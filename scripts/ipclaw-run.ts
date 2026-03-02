import fs from 'fs';
import path from 'path';

interface CliOptions {
  creator: string;
  niche: string;
  audience: string;
  cta: string;
  repoUrl?: string;
  channels: string[];
  lang: 'zh' | 'en';
  goal?: string;
  sourcePath?: string;
  outputDir?: string;
}

function getArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

function parseArgs(): CliOptions {
  const creator = getArg('creator');
  const niche = getArg('niche');
  const audience = getArg('audience');
  const cta =
    getArg('cta') ||
    '欢迎回复你的场景，我会给你一版可执行的 IP 增长方案';
  const repoUrl = getArg('repo');
  const goal = getArg('goal');
  const langArg = getArg('lang');
  const rawChannels = getArg('channels') || 'github,x';
  const channels = rawChannels
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const lang: 'zh' | 'en' = langArg === 'en' ? 'en' : 'zh';

  if (!creator || !niche || !audience) {
    console.error(
      'Usage: npm run ip:run -- --creator "<name>" --niche "<niche>" --audience "<audience>" [--source <file>] [--repo <url>] [--cta <text>] [--channels github,x] [--goal <text>] [--lang zh|en] [--out <dir>]',
    );
    process.exit(1);
  }

  if (channels.length === 0) {
    console.error('At least one channel is required. Example: --channels github,x');
    process.exit(1);
  }

  const sourcePath = getArg('source');
  if (sourcePath && !fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  return {
    creator,
    niche,
    audience,
    cta,
    repoUrl,
    channels,
    lang,
    goal,
    sourcePath,
    outputDir: getArg('out'),
  };
}

function readIfExists(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function loadTemplate(relativePath: string): string {
  const fullPath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template not found: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function textByLang(
  lang: 'zh' | 'en',
  zhText: string,
  enText: string,
): string {
  return lang === 'zh' ? zhText : enText;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function extractKeyPoints(sourceText: string, maxPoints = 6): string[] {
  if (!sourceText.trim()) return [];

  const noCodeBlocks = sourceText.replace(/```[\s\S]*?```/g, ' ');
  const rawLines = noCodeBlocks
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const normalizeLine = (line: string): string =>
    line
      .replace(/^#+\s*/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+[.)]\s+/, '')
      .trim();

  const isUseful = (line: string): boolean => {
    if (line.length < 12 || line.length > 180) return false;
    if (!line) return false;
    if (!/[\u4e00-\u9fa5a-zA-Z0-9]/.test(line)) return false;
    if (/^https?:\/\//i.test(line)) return false;
    if (/^step\s*\d+/i.test(line)) return false;
    if (/^(week|phase)\s*\d+/i.test(line)) return false;
    if (/^(north star|goal|目标|策略声明)$/i.test(line)) return false;
    if (line.endsWith(':') || line.endsWith('：')) return false;
    return true;
  };

  const bulletCandidates = rawLines
    .filter((line) => /^([-*+]|\d+[.)])\s+/.test(line))
    .map(normalizeLine)
    .filter(isUseful);

  const genericCandidates = rawLines.map(normalizeLine).filter(isUseful);

  const lines = bulletCandidates.length >= 3 ? bulletCandidates : genericCandidates;

  if (lines.length > 0) {
    return dedupe(lines).slice(0, maxPoints);
  }

  const sentences = noCodeBlocks
    .split(/[。！？!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12 && sentence.length <= 180);

  return dedupe(sentences).slice(0, maxPoints);
}

function extractWins(points: string[], lang: 'zh' | 'en'): string[] {
  const pattern =
    /(\d+\s*[%xX倍]?|增长|提升|降低|优化|缩短|star|follower|conversion|ctr|lead|效率|minutes?|hours?)/i;
  const wins = points
    .filter((point) => pattern.test(point))
    .filter((point) => !/^step\s*\d+/i.test(point))
    .slice(0, 3);
  if (wins.length > 0) return wins;
  return [
    textByLang(
      lang,
      '已完成首版闭环流程并具备可复用模板输出能力。',
      'Delivered a reusable first-loop workflow with template outputs.',
    ),
  ];
}

function safePreview(points: string[], fallback: string): string {
  if (points.length === 0) return fallback;
  return points.join('\n');
}

function toChannelLabel(channel: string): string {
  const value = channel.toLowerCase();
  if (value === 'x' || value === 'twitter') return 'X';
  if (value === 'wechat') return '微信公众号';
  if (value === 'xiaohongshu') return '小红书';
  if (value === 'github') return 'GitHub';
  return channel;
}

function trackingLink(
  repoUrl: string | undefined,
  source: string,
  campaign: string,
): string {
  if (!repoUrl) return '(add --repo to generate tracking links)';
  try {
    const url = new URL(repoUrl);
    url.searchParams.set('utm_source', source.toLowerCase());
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', campaign);
    return url.toString();
  } catch {
    return `${repoUrl}?utm_source=${encodeURIComponent(source)}&utm_medium=social&utm_campaign=${encodeURIComponent(campaign)}`;
  }
}

function weekRange(now: Date): { start: string; end: string } {
  const copy = new Date(now);
  const day = copy.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diffToMonday);
  const start = copy.toISOString().slice(0, 10);
  copy.setDate(copy.getDate() + 6);
  const end = copy.toISOString().slice(0, 10);
  return { start, end };
}

function buildPositioningCard(
  options: CliOptions,
  keyPoints: string[],
  wins: string[],
  template: string,
): string {
  const oneLine = textByLang(
    options.lang,
    `${options.creator} 帮助${options.audience}通过${options.niche}实现可验证增长。`,
    `${options.creator} helps ${options.audience} drive measurable outcomes through ${options.niche}.`,
  );

  const pillars = [
    textByLang(
      options.lang,
      `构建日志：持续公开 ${options.niche} 的实战迭代。`,
      `Build logs: publish practical iterations in ${options.niche}.`,
    ),
    textByLang(
      options.lang,
      '可复用资产：模板、脚本、流程卡可直接复制。',
      'Reusable assets: templates, scripts, and operational playbooks.',
    ),
    textByLang(
      options.lang,
      `案例复盘：围绕 ${options.audience} 的真实场景做前后对比。`,
      `Case reviews: before/after outcomes for real ${options.audience} scenarios.`,
    ),
  ];

  const differentiation = textByLang(
    options.lang,
    '差异化：不是只生成文案，而是从定位到复盘形成执行闭环。',
    'Differentiation: not copy-only generation, but an execution loop from positioning to KPI review.',
  );

  const evidence = safePreview(
    wins.map((item) => `- ${item}`),
    textByLang(
      options.lang,
      '- 本周将补充第一个可验证增长案例。',
      '- Add the first measurable growth case this week.',
    ),
  );

  return `# ${textByLang(options.lang, 'IPClaw 定位卡', 'IPClaw Positioning Card')}

- Creator: ${options.creator}
- Niche: ${options.niche}
- Audience: ${options.audience}

## ${textByLang(options.lang, '一句话定位', 'One-line Positioning')}

${oneLine}

## ${textByLang(options.lang, '内容支柱（3）', 'Content Pillars (3)')}

1. ${pillars[0]}
2. ${pillars[1]}
3. ${pillars[2]}

## ${textByLang(options.lang, '差异化主张', 'Differentiation')}

${differentiation}

## ${textByLang(options.lang, '证据与结果', 'Proof Points')}

${evidence}

## CTA

${options.cta}

## ${textByLang(options.lang, '素材摘要', 'Source Highlights')}

${safePreview(
  keyPoints.map((item) => `- ${item}`),
  textByLang(
    options.lang,
    '- 未提供 source，建议补充本周构建日志。',
    '- No source provided. Add this week build log for better output.',
  ),
)}

---

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

${template}
`;
}

function buildContentPack(
  options: CliOptions,
  keyPoints: string[],
  wins: string[],
  template: string,
): string {
  const metricPattern =
    /(\d+\s*[%xX倍]?|star|follower|lead|ctr|conversion|线索|关注|流量|点击|转化|新增)/i;
  const strategicPoints = keyPoints
    .map((point) => point.replace(/`/g, '').trim())
    .filter((point) => !metricPattern.test(point))
    .filter((point) => !/^(首发渠道|外部分发)/.test(point))
    .filter((point) => !/^(positioning|content|distribution|analytics)\b/i.test(point));

  const issue =
    strategicPoints[0] ||
    textByLang(
      options.lang,
      `很多${options.audience}缺少从内容生产到获客转化的闭环。`,
      `Many ${options.audience} still lack an end-to-end content-to-conversion loop.`,
    );
  const solution =
    strategicPoints[1] ||
    textByLang(
      options.lang,
      `用 ${options.niche} 将定位、内容、分发、复盘打通。`,
      `Use ${options.niche} to connect positioning, content, distribution, and review.`,
    );
  const nextStep =
    strategicPoints[2] ||
    textByLang(
      options.lang,
      '补齐真实案例并对比优化前后指标。',
      'Add real case studies with before/after metrics.',
    );

  const shortPostIdeas = [
    textByLang(
      options.lang,
      `我把一个模糊目标改成可执行动作：${issue}`,
      `I turned a vague goal into an executable action: ${issue}`,
    ),
    textByLang(
      options.lang,
      `本周核心改动：${solution}`,
      `Core update this week: ${solution}`,
    ),
    textByLang(
      options.lang,
      `可验证结果：${wins[0] || textByLang(options.lang, '已完成一轮闭环验证。', 'Completed one full-loop validation.')}`,
      `Measurable outcome: ${wins[0] || textByLang(options.lang, '已完成一轮闭环验证。', 'Completed one full-loop validation.')}`,
    ),
    textByLang(
      options.lang,
      `我们砍掉了低效动作，保留“定位→内容→分发→复盘”四步闭环。`,
      'We removed low-leverage actions and kept a 4-step loop: positioning → content → distribution → review.',
    ),
    textByLang(
      options.lang,
      `下周计划：${nextStep}`,
      `Next week plan: ${nextStep}`,
    ),
  ];

  const shortPosts = shortPostIdeas
    .map((idea, index) => {
      const link = options.repoUrl ? ` ${options.repoUrl}` : '';
      return `${index + 1}. ${idea}${link} ${options.cta}`.trim();
    })
    .join('\n');

  const winLines = wins.map((item) => `- ${item}`).join('\n');
  const today = new Date().toISOString().slice(0, 10);

  return `# ${textByLang(options.lang, 'IPClaw 内容包', 'IPClaw Content Pack')}

## ${textByLang(options.lang, '1) GitHub 更新草稿', '1) GitHub Update Draft')}

### ${textByLang(options.lang, '问题', 'Problem')}

${issue}

### ${textByLang(options.lang, '方案', 'Solution')}

${solution}

### ${textByLang(options.lang, '结果', 'Results')}

${winLines}

### ${textByLang(options.lang, '下一步', 'Next Step')}

${nextStep}

### CTA

${options.cta}

## ${textByLang(options.lang, '2) 短内容 x5', '2) Short Posts x5')}

${shortPosts}

## ${textByLang(options.lang, '3) 讨论贴版本', '3) Discussion Thread')}

${textByLang(
  options.lang,
  `你在做 ${options.niche} 时最卡的一步是什么？我在做一套可复用闭环，欢迎直接提你的场景。`,
  `What is your biggest bottleneck in ${options.niche}? I am building a reusable workflow and would love your case.`,
)}

## ${textByLang(options.lang, '4) Changelog 摘要', '4) Changelog Summary')}

## ${today}

### ${textByLang(options.lang, '新增', 'Added')}
- ${solution}

### ${textByLang(options.lang, '优化', 'Improved')}
- ${nextStep}

### ${textByLang(options.lang, '用户价值', 'User Value')}
- ${textByLang(
  options.lang,
  `帮助 ${options.audience} 更快完成“内容生产→分发→复盘”闭环。`,
  `Helps ${options.audience} complete the content → distribution → review loop faster.`,
)}

---

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

${template}
`;
}

function buildDistributionPlan(
  options: CliOptions,
  template: string,
  campaign: string,
): string {
  const rows = options.channels
    .map((channel) => {
      const label = toChannelLabel(channel);
      const link = trackingLink(options.repoUrl, label, campaign);
      return `| ${label} | ${textByLang(
        options.lang,
        '发布一个结果导向更新',
        'Publish one outcome-driven update',
      )} | ${textByLang(
        options.lang,
        '“这周我把一个低效动作删掉了”',
        '“This week I removed one low-leverage action.”',
      )} | ${link} | ${textByLang(options.lang, '待审批', 'Pending approval')} |`;
    })
    .join('\n');

  return `# ${textByLang(options.lang, 'IPClaw 分发与审批卡', 'IPClaw Distribution & Approval Card')}

## ${textByLang(options.lang, '本次分发目标', 'Campaign Goal')}

${options.goal || textByLang(options.lang, '拉新 + 回链 GitHub', 'New reach + GitHub traffic')}

## ${textByLang(options.lang, '渠道执行表', 'Channel Execution Table')}

| Channel | ${textByLang(options.lang, '目标', 'Objective')} | ${textByLang(options.lang, '开场钩子', 'Hook')} | ${textByLang(options.lang, '追踪链接', 'Tracking Link')} | ${textByLang(options.lang, '状态', 'Status')} |
| --- | --- | --- | --- | --- |
${rows}

## ${textByLang(options.lang, '发布守则', 'Guardrails')}

- ${textByLang(options.lang, '对外发布前必须人工审批。', 'Human approval is required before external publishing.')}
- ${textByLang(options.lang, '每条内容只保留一个核心 CTA。', 'Keep exactly one primary CTA per post.')}
- ${textByLang(options.lang, '禁止夸大承诺和保证式收益表达。', 'Avoid exaggerated claims and guaranteed outcomes.')}

---

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

${template}
`;
}

function buildWeeklyReview(
  options: CliOptions,
  keyPoints: string[],
  template: string,
): string {
  const range = weekRange(new Date());
  const keep = keyPoints[0]
    ? `- Keep: ${keyPoints[0]}`
    : textByLang(
        options.lang,
        '- Keep: 每周固定发布一条结果导向更新。',
        '- Keep: publish one result-oriented update every week.',
      );
  const drop = textByLang(
    options.lang,
    '- Drop: 没有 CTA 的泛内容输出。',
    '- Drop: generic posts with no CTA.',
  );
  const doubleDown = keyPoints[1]
    ? `- Double-down: ${keyPoints[1]}`
    : textByLang(
        options.lang,
        '- Double-down: 能带来可验证反馈的案例复盘。',
        '- Double-down: case-study posts with measurable feedback.',
      );

  return `# ${textByLang(options.lang, 'IPClaw 周复盘（自动填充）', 'IPClaw Weekly Review (Auto-filled)')}

${textByLang(options.lang, '复盘周期', 'Review Window')}：${range.start} ~ ${range.end}

## ${textByLang(options.lang, '本周关键观察', 'Key Observations')}

${safePreview(
  keyPoints.map((item) => `- ${item}`),
  textByLang(
    options.lang,
    '- 待补充本周构建日志。',
    '- Add this week build log for better observations.',
  ),
)}

## ${textByLang(options.lang, '策略决策', 'Strategy Decisions')}

${keep}
${drop}
${doubleDown}

## ${textByLang(options.lang, '下周动作（建议）', 'Next Week Actions')}

1. ${textByLang(
  options.lang,
  '发布 1 条“问题-方案-结果”结构更新并附 GitHub 回链。',
  'Publish one problem-solution-result update with a GitHub backlink.',
)}
2. ${textByLang(
  options.lang,
  '将本周最佳内容改写为 3 个渠道版本并走人工审批。',
  'Repurpose the top post into 3 channels with manual approval.',
)}
3. ${textByLang(
  options.lang,
  '记录本周 KPI 并决定 keep/drop/double-down。',
  'Record KPI and make keep/drop/double-down decisions.',
)}

---

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

${template}
`;
}

function main(): void {
  const options = parseArgs();
  const runId = timestampSlug();
  const outputDir =
    options.outputDir || path.join('plans', 'ipclaw-runs', `${runId}`);

  ensureDir(outputDir);

  const sourceText = options.sourcePath ? readIfExists(options.sourcePath) : '';
  const keyPoints = extractKeyPoints(sourceText, 6);
  const wins = extractWins(keyPoints, options.lang);
  const campaign = `ipclaw-${runId.slice(0, 10)}`;

  const positioningTemplate = loadTemplate('templates/ipclaw/positioning-prompt.md');
  const contentTemplate = loadTemplate('templates/ipclaw/content-repurpose.md');
  const distributionTemplate = loadTemplate(
    'templates/ipclaw/distribution-checklist.md',
  );
  const reviewTemplate = loadTemplate('templates/ipclaw/weekly-kpi-review.md');

  const indexContent = `# IPClaw Run Pack

- Run ID: ${runId}
- Creator: ${options.creator}
- Niche: ${options.niche}
- Audience: ${options.audience}
- Language: ${options.lang}
- Channels: ${options.channels.join(', ')}
- Goal: ${options.goal || '(default)'}
- Source: ${options.sourcePath || '(none)'}
- Repo: ${options.repoUrl || '(none)'}
- Generated At: ${new Date().toISOString()}

## Files

- 01-positioning.md
- 02-content-pack.md
- 03-distribution.md
- 04-weekly-review.md

## Auto-fill Summary

- Key points extracted: ${keyPoints.length}
- Detected wins: ${wins.length}
- Campaign tag: ${campaign}

## Suggested Flow

1. Review and edit positioning card.
2. Pick one short post and publish to primary channel.
3. Execute distribution checklist with manual approval.
4. Track KPI and update weekly review.
`;

  const positioningContent = buildPositioningCard(
    options,
    keyPoints,
    wins,
    positioningTemplate,
  );
  const contentPack = buildContentPack(options, keyPoints, wins, contentTemplate);
  const distributionContent = buildDistributionPlan(
    options,
    distributionTemplate,
    campaign,
  );
  const reviewContent = buildWeeklyReview(options, keyPoints, reviewTemplate);

  writeFile(path.join(outputDir, 'README.md'), indexContent);
  writeFile(path.join(outputDir, '01-positioning.md'), positioningContent);
  writeFile(path.join(outputDir, '02-content-pack.md'), contentPack);
  writeFile(path.join(outputDir, '03-distribution.md'), distributionContent);
  writeFile(path.join(outputDir, '04-weekly-review.md'), reviewContent);

  console.log(outputDir);
}

main();
