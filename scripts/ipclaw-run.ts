import fs from 'fs';
import path from 'path';

interface CliOptions {
  creator: string;
  niche: string;
  audience: string;
  cta: string;
  repoUrl?: string;
  channels: string[];
  topicCount: number;
  focusTags: string[];
  lang: 'zh' | 'en';
  goal?: string;
  sourcePath?: string;
  caseInput?: string;
  caseFilePath?: string;
  outputDir?: string;
}

interface TopicIdea {
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  angle: string;
  format: string;
  hook: string;
  cta: string;
  channel: string;
}

type TopicBuilder = (
  seed: string,
  options: CliOptions,
) => Omit<TopicIdea, 'priority' | 'cta' | 'channel'>;

interface TopicQuota {
  p1: number;
  p2: number;
  p3: number;
}

interface CaseBrief {
  summary: string;
  problem: string;
  action: string;
  result: string;
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
  const rawFocus = getArg('focus') || '';
  const focusTags = rawFocus
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
  const rawChannels = getArg('channels') || 'github,x';
  const topicsArg = getArg('topics');
  const topicCount = topicsArg ? Number.parseInt(topicsArg, 10) : 12;
  const channels = rawChannels
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const lang: 'zh' | 'en' = langArg === 'en' ? 'en' : 'zh';

  if (!creator || !niche || !audience) {
    console.error(
      'Usage: npm run ip:run -- --creator "<name>" --niche "<niche>" --audience "<audience>" [--source <file>] [--case "<text>"] [--case-file <file>] [--repo <url>] [--cta <text>] [--channels github,x] [--focus 增长飞轮,模板复用] [--topics <count>] [--goal <text>] [--lang zh|en] [--out <dir>]',
    );
    process.exit(1);
  }

  if (channels.length === 0) {
    console.error('At least one channel is required. Example: --channels github,x');
    process.exit(1);
  }

  if (!Number.isInteger(topicCount) || topicCount < 3 || topicCount > 60) {
    console.error('Topics count must be an integer between 3 and 60. Example: --topics 20');
    process.exit(1);
  }

  if (focusTags.some((tag) => tag.length > 24)) {
    console.error('Each focus tag should be 24 characters or fewer. Example: --focus 增长飞轮,模板复用');
    process.exit(1);
  }

  const sourcePath = getArg('source');
  if (sourcePath && !fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const caseInput = getArg('case');
  if (caseInput && caseInput.length > 600) {
    console.error('Case text is too long. Keep it within 600 characters.');
    process.exit(1);
  }

  const caseFilePath = getArg('case-file');
  if (caseFilePath && !fs.existsSync(caseFilePath)) {
    console.error(`Case file not found: ${caseFilePath}`);
    process.exit(1);
  }

  return {
    creator,
    niche,
    audience,
    cta,
    repoUrl,
    channels,
    topicCount,
    focusTags,
    lang,
    goal,
    sourcePath,
    caseInput,
    caseFilePath,
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

function isMetricPoint(point: string): boolean {
  return /(\d+\s*[%xX倍]?|增长|提升|降低|优化|缩短|star|follower|conversion|ctr|lead|效率|minutes?|hours?|点击|转化|线索|新增)/i.test(
    point,
  );
}

function extractInsights(points: string[], maxPoints = 6): string[] {
  return dedupe(
    points
      .map((point) => point.replace(/`/g, '').trim())
      .map((point) => point.replace(/^([a-zA-Z\u4e00-\u9fa5]{1,16})[：:]\s*/, '').trim())
      .filter((point) => point.length >= 8)
      .filter((point) => !isMetricPoint(point))
      .filter((point) => !/^step\s*\d+/i.test(point))
      .filter((point) => !/^(首发渠道|外部分发)\b/.test(point))
      .filter((point) => !/^(positioning|content|distribution|analytics)\b/i.test(point))
      .filter((point) => !/^(GitHub\s*Star|GitHub\s*Followers|种子用户线索|每月可验证案例)\b/i.test(point))
      .filter((point) => !/二选一主渠道/.test(point))
      .filter((point) => !/一句话定位\s*\+\s*三个内容支柱\s*\+\s*CTA/i.test(point)),
  ).slice(0, maxPoints);
}

function extractProofPoints(
  points: string[],
  lang: 'zh' | 'en',
  maxPoints = 3,
): string[] {
  const proofPoints = points
    .map((point) => point.replace(/`/g, '').trim())
    .filter((point) => isMetricPoint(point))
    .slice(0, maxPoints);

  if (proofPoints.length > 0) return proofPoints;

  return [
    textByLang(
      lang,
      '暂无硬结果数据，本周优先补 1 组可验证前后对比。',
      'No hard metrics yet. Add one measurable before/after proof this week.',
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

function fallbackInsight(options: CliOptions): string {
  return textByLang(
    options.lang,
    `围绕 ${options.niche} 的真实构建过程输出可验证经验。`,
    `Publish measurable lessons from real builds in ${options.niche}.`,
  );
}

function resolveTopicQuota(total: number): TopicQuota {
  if (total <= 4) {
    return { p1: total, p2: 0, p3: 0 };
  }

  let p1 = Math.max(3, Math.round(total * 0.5));
  let p2 = Math.max(2, Math.round(total * 0.33));
  let p3 = total - p1 - p2;

  if (p3 < 1 && total >= 8) {
    p3 = 1;
  }

  while (p1 + p2 + p3 > total) {
    if (p2 > 2) {
      p2 -= 1;
      continue;
    }
    if (p1 > 3) {
      p1 -= 1;
      continue;
    }
    if (p3 > 0) {
      p3 -= 1;
      continue;
    }
    break;
  }

  while (p1 + p2 + p3 < total) {
    if (p2 <= p1) {
      p2 += 1;
      continue;
    }
    p1 += 1;
  }

  return { p1, p2, p3 };
}

function normalizeCaseText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function stripCasePrefix(line: string): string {
  return line
    .replace(/^(问题|挑战|痛点|problem|pain)[：:\-\s]*/i, '')
    .replace(/^(动作|做法|方案|执行|action|approach|solution)[：:\-\s]*/i, '')
    .replace(/^(结果|数据|收益|result|outcome|impact)[：:\-\s]*/i, '')
    .trim();
}

function parseCaseBrief(
  caseText: string,
  keyPoints: string[],
  lang: 'zh' | 'en',
): CaseBrief | undefined {
  const normalized = normalizeCaseText(caseText);
  if (!normalized) return undefined;

  const lines = dedupe(
    normalized
      .split(/[\n；;]+/)
      .map((line) => line.trim())
      .map((line) => line.replace(/^[-*+]\s+/, '').trim())
      .filter((line) => line.length >= 6),
  );

  if (lines.length === 0) return undefined;

  const findLine = (patterns: RegExp[]): string | undefined =>
    lines.find((line) => patterns.some((pattern) => pattern.test(line)));

  const problemLine =
    findLine([/^(问题|挑战|痛点|problem|pain)/i]) ||
    findLine([/(问题|挑战|痛点|卡在|难点|problem|pain|stuck)/i]) ||
    lines[0];
  const actionLine =
    findLine([/^(动作|做法|方案|执行|action|approach|solution)/i]) ||
    findLine([/(动作|做法|方案|执行|尝试|用了|action|approach|solution|implemented)/i]) ||
    lines[Math.min(1, lines.length - 1)];
  const resultLine =
    findLine([/^(结果|数据|收益|result|outcome|impact)/i]) ||
    findLine([/(提升|增长|降低|转化率|star|click|lead|result|outcome|impact|%|\d+)/i]) ||
    keyPoints.find((point) => isMetricPoint(point)) ||
    lines[Math.min(2, lines.length - 1)];

  const summary = stripCasePrefix(lines[0]);
  const problem = stripCasePrefix(problemLine || lines[0]);
  const action = stripCasePrefix(actionLine || lines[Math.min(1, lines.length - 1)]);
  const result = stripCasePrefix(
    resultLine ||
      textByLang(
        lang,
        '结果还在验证中，本周补充一组前后对比。',
        'Result still validating. Add one measurable before/after this week.',
      ),
  );

  return { summary, problem, action, result };
}

function buildPositioningCard(
  options: CliOptions,
  keyPoints: string[],
  templatePath: string,
  caseBrief?: CaseBrief,
): string {
  const insights = extractInsights(keyPoints, 6);
  const proofPoints = extractProofPoints(keyPoints, options.lang, 3);
  const line1 = insights[0] || fallbackInsight(options);
  const line2 = insights[1] || textByLang(options.lang, '输出可复用模板', 'Ship reusable templates');
  const line3 = insights[2] || textByLang(options.lang, '给出执行优先级', 'Provide execution priorities');

  const oneLine = textByLang(
    options.lang,
    `${options.creator} 帮助${options.audience}用${options.niche}做出可复用、可验证的增长选题。`,
    `${options.creator} helps ${options.audience} drive measurable outcomes through ${options.niche}.`,
  );

  const pillars = [
    textByLang(
      options.lang,
      `问题洞察：${line1}`,
      `Build logs: publish practical iterations in ${options.niche}.`,
    ),
    textByLang(
      options.lang,
      `方法资产：${line2}`,
      'Reusable assets: templates, scripts, and operational playbooks.',
    ),
    textByLang(
      options.lang,
      `行动建议：${line3}`,
      `Case reviews: before/after outcomes for real ${options.audience} scenarios.`,
    ),
  ];

  const differentiation = textByLang(
    options.lang,
    '差异化：不是泛写内容，而是围绕人设持续产出可发、可验证的优质选题。',
    'Differentiation: not generic copy, but persona-driven, publishable topic generation.',
  );

  const evidence = safePreview(
    proofPoints.map((item) => `- ${item}`),
    '- (none)',
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

${caseBrief
    ? `## ${textByLang(options.lang, '案例锚点', 'Case Anchor')}

- ${textByLang(options.lang, '问题', 'Problem')}：${caseBrief.problem}
- ${textByLang(options.lang, '动作', 'Action')}：${caseBrief.action}
- ${textByLang(options.lang, '结果', 'Result')}：${caseBrief.result}

`
    : ''}

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

- ${templatePath}
`;
}

function buildPersonaCard(
  options: CliOptions,
  keyPoints: string[],
  templatePath: string,
  caseBrief?: CaseBrief,
): string {
  const insights = extractInsights(keyPoints, 6);
  const painPoints = [
    caseBrief?.problem || insights[0] || textByLang(options.lang, `很难持续做出高质量${options.niche}内容`, `Hard to sustain high-quality ${options.niche} content`),
    insights[1] || textByLang(options.lang, '有输出但缺少明确结构与人设一致性', 'Outputs exist but lack a clear structure and persona consistency'),
    insights[2] || textByLang(options.lang, '不知道哪些选题能带来有效互动与转化', 'Unclear which topics can create engagement and conversion'),
  ];

  const goalText = options.goal || textByLang(options.lang, '每周稳定产出并发布 2-3 条高质量内容', 'Publish 2-3 high-quality pieces every week');

  const trustSignals = dedupe([
    caseBrief
      ? textByLang(options.lang, `真实案例结果：${caseBrief.result}`, `Real case evidence: ${caseBrief.result}`)
      : textByLang(options.lang, '可验证的真实构建过程', 'Verifiable real build process'),
    textByLang(options.lang, '可复制的模板与步骤', 'Reusable templates and steps'),
    textByLang(options.lang, '清晰边界：不夸大承诺', 'Clear boundaries: no exaggerated claims'),
    textByLang(options.lang, '持续周复盘并公开迭代记录', 'Weekly public iteration with measurable reviews'),
  ]);

  return `# ${textByLang(options.lang, 'IPClaw 人设卡', 'IPClaw Persona Card')}

## ${textByLang(options.lang, '主人设', 'Primary Persona')}

- ${textByLang(options.lang, '名称', 'Name')}：${textByLang(options.lang, '实战型增长搭建者', 'Hands-on Growth Builder')}
- ${textByLang(options.lang, '服务对象', 'Target')}：${options.audience}
- ${textByLang(options.lang, '核心任务', 'Job To Be Done')}：${goalText}

## ${textByLang(options.lang, '他们最痛的 3 个问题', 'Top 3 Pain Points')}

1. ${painPoints[0]}
2. ${painPoints[1]}
3. ${painPoints[2]}

## ${textByLang(options.lang, '决策触发点', 'Decision Triggers')}

- ${textByLang(options.lang, '看到可直接执行的步骤', 'See steps they can execute immediately')}
- ${textByLang(options.lang, '看到前后对比或失败复盘', 'See before/after outcomes or failure reviews')}
- ${textByLang(options.lang, '看到与你场景高度相似的案例', 'See cases matching their own context')}

## ${textByLang(options.lang, '信任信号', 'Trust Signals')}

${trustSignals.map((item) => `- ${item}`).join('\n')}

## ${textByLang(options.lang, '内容语气边界', 'Voice Guardrails')}

- ${textByLang(options.lang, '讲清方法，不贩卖焦虑。', 'Explain method, do not sell anxiety.')}
- ${textByLang(options.lang, '强调行动成本与适用条件。', 'State execution cost and applicability conditions.')}
- ${textByLang(options.lang, '先给证据，再给结论。', 'Show proof before conclusions.')}

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

- ${templatePath}
`;
}

function buildTopicIdeas(
  options: CliOptions,
  keyPoints: string[],
  templatePath: string,
  caseBrief?: CaseBrief,
): string {
  const insights = extractInsights(keyPoints, 10);
  const normalizedInsights = insights
    .map((item) => item.replace(/`/g, '').replace(/[。.!?]+$/g, '').trim())
    .filter((item) => item.length >= 6 && item.length <= 32)
    .filter((item) => !/^\/ip-[a-z-]+/i.test(item))
    .filter((item) => !/[\/\\]/.test(item))
    .filter((item) => !/[+＋]/.test(item))
    .filter((item) =>
      !/(完整闭环|人工审批|追踪参数|内容支柱|一句话定位|改写为|背景|目标受众|本周构建日志)/i.test(item),
    );

  const focusSeeds = options.focusTags.map((tag) =>
    textByLang(
      options.lang,
      `${options.niche}${tag}`,
      `${options.niche} ${tag}`,
    ),
  );

  const defaultSeeds = [
    textByLang(options.lang, `${options.niche}增长飞轮`, `${options.niche} growth loop`),
    textByLang(options.lang, `${options.niche}定位校准`, `${options.niche} positioning calibration`),
    textByLang(options.lang, `${options.niche}案例复盘`, `${options.niche} case review`),
    textByLang(options.lang, `${options.niche}分发策略`, `${options.niche} distribution strategy`),
    textByLang(options.lang, `${options.niche}转化路径`, `${options.niche} conversion pathway`),
    textByLang(options.lang, `${options.niche}执行节奏`, `${options.niche} execution cadence`),
    textByLang(options.lang, `${options.niche}内容资产化`, `${options.niche} content assetization`),
    textByLang(options.lang, `${options.niche}数据复盘`, `${options.niche} metrics review`),
  ];

  const caseSeeds = caseBrief
    ? [caseBrief.problem, caseBrief.action, caseBrief.result]
        .map((seed) => seed.trim())
        .map((seed) => seed.replace(/[。.!?]+$/g, '').trim())
        .filter((seed) => seed.length >= 6 && seed.length <= 32)
    : [];

  const seeds = dedupe([
    ...focusSeeds,
    ...caseSeeds,
    ...normalizedInsights,
    ...defaultSeeds,
    textByLang(options.lang, `${options.niche}常见误区`, `Common mistakes in ${options.niche}`),
    textByLang(options.lang, `${options.niche}执行路径`, `Execution path for ${options.niche}`),
    textByLang(options.lang, `${options.niche}案例拆解`, `Case breakdowns in ${options.niche}`),
  ]).slice(0, 18);

  const channelLabels = options.channels.map((channel) => toChannelLabel(channel));
  const quotas = resolveTopicQuota(options.topicCount);

  const p1Builders: TopicBuilder[] = [
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `把「${seed}」拆成 3 步执行图`, `Break down "${seed}" into 3 executable steps`),
      angle: textByLang(localOptions.lang, '给读者一个今天就能开始的路径。', 'Give readers a path they can start today.'),
      format: textByLang(localOptions.lang, '清单帖 + 示例图', 'Checklist + visual example'),
      hook: textByLang(localOptions.lang, '如果你总感觉知道但做不出来，这条给你。', 'If you know it but cannot execute, this is for you.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `为什么多数人卡在「${seed}」而不是努力不够`, `Why most people get stuck on "${seed}" (not because of effort)`),
      angle: textByLang(localOptions.lang, '反直觉观点 + 证据。', 'Contrarian point with evidence.'),
      format: textByLang(localOptions.lang, '观点帖 + 评论引导', 'Opinion post + discussion prompt'),
      hook: textByLang(localOptions.lang, '真正的问题不在执行力，而在路径设计。', 'The bottleneck is path design, not discipline.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `我如何用一个模板把「${seed}」提速`, `How one template accelerated "${seed}"`),
      angle: textByLang(localOptions.lang, '展示模板前后差异。', 'Show before/after with one template.'),
      format: textByLang(localOptions.lang, '案例帖 + 模板下载', 'Case post + template download'),
      hook: textByLang(localOptions.lang, '不是更努力，而是换一套模板。', 'Not more effort, better structure.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `做「${seed}」最容易犯的 5 个错`, `Top 5 mistakes when doing "${seed}"`),
      angle: textByLang(localOptions.lang, '先避坑再提效。', 'Avoid pitfalls before optimizing.'),
      format: textByLang(localOptions.lang, '避坑贴 + 自测清单', 'Pitfall post + self-checklist'),
      hook: textByLang(localOptions.lang, '你可能已经踩了其中 2 个坑。', 'You likely hit 2 of these already.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `从 0 到 1：一周完成「${seed}」的排期`, `From 0 to 1: a one-week schedule for "${seed}"`),
      angle: textByLang(localOptions.lang, '给出可落地时间盒。', 'Provide a time-boxed plan.'),
      format: textByLang(localOptions.lang, '排期图 + TODO 清单', 'Timeline + TODO checklist'),
      hook: textByLang(localOptions.lang, '给你一份可直接照抄的 7 天计划。', 'Here is a copy-ready 7-day plan.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `一次真实拆解：${localOptions.audience}如何完成「${seed}」`, `Real breakdown: how ${localOptions.audience} can complete "${seed}"`),
      angle: textByLang(localOptions.lang, '用真实场景讲方法。', 'Teach method through a realistic scenario.'),
      format: textByLang(localOptions.lang, '场景剧本 + 结果对比', 'Scenario script + outcome comparison'),
      hook: textByLang(localOptions.lang, '把抽象方法换成具体情境。', 'Turn abstract method into concrete context.'),
    }),
  ];

  const p2Builders: TopicBuilder[] = [
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `FAQ：关于「${seed}」被问最多的 7 个问题`, `FAQ: 7 most asked questions about "${seed}"`),
      angle: textByLang(localOptions.lang, '集中回答高频异议。', 'Answer frequent objections in one place.'),
      format: textByLang(localOptions.lang, '问答帖', 'Q&A post'),
      hook: textByLang(localOptions.lang, '这 7 个问题，决定你是否能走下去。', 'These 7 questions decide whether you move forward.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `工具对比：做「${seed}」该怎么选`, `Tool comparison: how to choose for "${seed}"`),
      angle: textByLang(localOptions.lang, '对比成本、速度、可维护性。', 'Compare cost, speed, and maintainability.'),
      format: textByLang(localOptions.lang, '对比表', 'Comparison table'),
      hook: textByLang(localOptions.lang, '别再凭感觉选工具。', 'Stop choosing tools by intuition alone.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `模板公开：我的「${seed}」工作流`, `Template drop: my workflow for "${seed}"`),
      angle: textByLang(localOptions.lang, '给可复制资产，提升收藏/转发。', 'Offer reusable assets to boost saves and shares.'),
      format: textByLang(localOptions.lang, '模板帖 + 使用说明', 'Template + usage guide'),
      hook: textByLang(localOptions.lang, '直接拿去改成你的版本。', 'Take it and adapt to your context.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `我删掉了什么：聚焦「${seed}」的取舍清单`, `What I removed: trade-off list to focus on "${seed}"`),
      angle: textByLang(localOptions.lang, '展示克制与边界，建立信任。', 'Show restraint and boundaries to build trust.'),
      format: textByLang(localOptions.lang, '反思帖 + 决策树', 'Reflection + decision tree'),
      hook: textByLang(localOptions.lang, '好策略是删出来的。', 'Good strategy comes from subtraction.'),
    }),
  ];

  const p3Builders: TopicBuilder[] = [
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `7 天挑战：围绕「${seed}」每天做一件小事`, `7-day challenge: one small action per day around "${seed}"`),
      angle: textByLang(localOptions.lang, '提高互动与参与感。', 'Increase interaction and participation.'),
      format: textByLang(localOptions.lang, '挑战帖 + 打卡模板', 'Challenge post + check-in template'),
      hook: textByLang(localOptions.lang, '一起做，7 天后对比变化。', 'Do it together and compare results in 7 days.'),
    }),
    (seed, localOptions) => ({
      title: textByLang(localOptions.lang, `共创征集：你最想看我拆哪类「${seed}」`, `Co-creation request: which "${seed}" case should I break down next?`),
      angle: textByLang(localOptions.lang, '把评论区变成选题池。', 'Turn comments into a topic pipeline.'),
      format: textByLang(localOptions.lang, '征集帖', 'Call-for-input post'),
      hook: textByLang(localOptions.lang, '下一条内容由你来定。', 'You decide the next piece.'),
    }),
  ];

  const ideas: TopicIdea[] = [];
  const usedTitles = new Set<string>();

  const appendIdeas = (
    priority: TopicIdea['priority'],
    count: number,
    builders: TopicBuilder[],
    startIndex: number,
  ): void => {
    const combinations: Array<{ seed: string; builder: TopicBuilder }> = [];
    for (let seedIndex = 0; seedIndex < seeds.length; seedIndex += 1) {
      for (let builderIndex = 0; builderIndex < builders.length; builderIndex += 1) {
        combinations.push({
          seed: seeds[seedIndex],
          builder: builders[builderIndex],
        });
      }
    }

    if (combinations.length === 0) return;

    const safeChannels =
      channelLabels.length > 0
        ? channelLabels
        : [textByLang(options.lang, 'GitHub', 'GitHub')];

    let added = 0;
    for (
      let index = 0;
      index < combinations.length && added < count;
      index += 1
    ) {
      const combo = combinations[(startIndex + index) % combinations.length];
      const channel = safeChannels[(startIndex + index) % safeChannels.length];
      const content = combo.builder(combo.seed, options);
      if (usedTitles.has(content.title)) continue;
      usedTitles.add(content.title);
      ideas.push({
        priority,
        title: content.title,
        angle: content.angle,
        format: content.format,
        hook: content.hook,
        cta: options.cta,
        channel,
      });
      added += 1;
    }

    let fallback = 1;
    while (added < count) {
      const seed = seeds[(startIndex + fallback) % seeds.length];
      const title = textByLang(
        options.lang,
        `实战补位：${seed}（第 ${fallback} 版）`,
        `Fallback execution topic: ${seed} (v${fallback})`,
      );
      if (usedTitles.has(title)) {
        fallback += 1;
        continue;
      }
      const channel =
        safeChannels[(startIndex + combinations.length + fallback) % safeChannels.length];
      usedTitles.add(title);
      ideas.push({
        priority,
        title,
        angle: textByLang(
          options.lang,
          '补齐本轮题量，优先补充可验证步骤与边界条件。',
          'Fill backlog with verifiable steps and explicit guardrails.',
        ),
        format: textByLang(options.lang, '执行清单 + 复盘卡', 'Execution checklist + review card'),
        hook: textByLang(
          options.lang,
          '这条是补位题，重点是可执行和可验证。',
          'This is a fallback topic focused on execution and validation.',
        ),
        cta: options.cta,
        channel,
      });
      added += 1;
      fallback += 1;
    }
  };

  appendIdeas('P1', quotas.p1, p1Builders, 0);
  appendIdeas('P2', quotas.p2, p2Builders, quotas.p1);
  appendIdeas('P3', quotas.p3, p3Builders, quotas.p1 + quotas.p2);

  const renderIdea = (idea: TopicIdea, index: number): string => `### ${index + 1}. ${idea.title}

- ${textByLang(options.lang, '优先级', 'Priority')}：${idea.priority}
- ${textByLang(options.lang, '切入角度', 'Angle')}：${idea.angle}
- ${textByLang(options.lang, '内容形式', 'Format')}：${idea.format}
- ${textByLang(options.lang, '开场钩子', 'Hook')}：${idea.hook}
- ${textByLang(options.lang, '推荐渠道', 'Recommended Channel')}：${idea.channel}
- CTA：${idea.cta}
`;

  const p1 = ideas.filter((idea) => idea.priority === 'P1');
  const p2 = ideas.filter((idea) => idea.priority === 'P2');
  const p3 = ideas.filter((idea) => idea.priority === 'P3');

  const renderGroup = (group: TopicIdea[]): string => {
    if (group.length === 0) {
      return textByLang(options.lang, '- 本轮未分配该级别选题。', '- No topics allocated for this priority in this run.');
    }
    return group.map((idea, index) => renderIdea(idea, index)).join('\n');
  };

  const publishingPlan = ideas.slice(0, Math.min(7, ideas.length)).map((idea, index) => {
    const day = index + 1;
    return `${day}. ${textByLang(options.lang, `Day ${day}：发布「${idea.title}」`, `Day ${day}: publish "${idea.title}"`)}`;
  });

  return `# ${textByLang(options.lang, 'IPClaw 优质选题包', 'IPClaw High-Quality Topic Pack')}

## ${textByLang(options.lang, '选题策略', 'Topic Strategy')}

- ${textByLang(options.lang, '目标受众', 'Audience')}：${options.audience}
- ${textByLang(options.lang, '内容赛道', 'Niche')}：${options.niche}
- ${textByLang(options.lang, '聚焦主题', 'Focus Tags')}：${options.focusTags.length > 0 ? options.focusTags.join(' / ') : textByLang(options.lang, '（自动从 source 提炼）', '(auto-derived from source)')}
- ${textByLang(options.lang, '本轮目标', 'Sprint Goal')}：${options.goal || textByLang(options.lang, '稳定产出并验证高质量选题', 'Ship and validate high-quality topics')}
- ${textByLang(options.lang, '选题总数', 'Topic Count')}：${options.topicCount}（P1 ${quotas.p1} / P2 ${quotas.p2} / P3 ${quotas.p3}）
- ${textByLang(options.lang, '核心原则', 'Core Principle')}：${textByLang(options.lang, '先人设一致，再追求传播效率。', 'Persona consistency first, distribution efficiency second.')}

## ${textByLang(options.lang, 'P1（本周必发）', 'P1 (Must Publish This Week)')}

${renderGroup(p1)}

## ${textByLang(options.lang, 'P2（选题储备）', 'P2 (Topic Backlog)')}

${renderGroup(p2)}

## ${textByLang(options.lang, 'P3（实验选题）', 'P3 (Experiments)')}

${renderGroup(p3)}

## ${textByLang(options.lang, '7 天发布节奏（建议）', '7-Day Publishing Plan')}

${publishingPlan.join('\n')}

## ${textByLang(options.lang, '选题质检清单', 'Topic Quality Checklist')}

- ${textByLang(options.lang, '标题是否具体到单一场景与对象。', 'Title is specific to one scenario and audience.')}
- ${textByLang(options.lang, '正文是否包含可执行步骤或模板。', 'Body includes executable steps or templates.')}
- ${textByLang(options.lang, '是否给出可验证证据或边界条件。', 'Includes verifiable proof or boundary conditions.')}
- ${textByLang(options.lang, '是否只保留一个明确 CTA。', 'Keeps exactly one clear CTA.')}

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

- ${templatePath}
${options.repoUrl ? `- Repo: ${options.repoUrl}` : ''}
`;
}

function buildContentPack(
  options: CliOptions,
  keyPoints: string[],
  templatePath: string,
  caseBrief?: CaseBrief,
): string {
  const insights = extractInsights(keyPoints, 8);
  const proofPoints = extractProofPoints(keyPoints, options.lang, 2);
  const proofLine = proofPoints[0];
  const repoLink = options.repoUrl || 'https://github.com/<you>/IPClaw';

  const problem =
    caseBrief?.problem ||
    insights[0] ||
    textByLang(
      options.lang,
      `目标受众在 ${options.niche} 上有持续执行难题。`,
      `Target audience has repeatable execution pain in ${options.niche}.`,
    );
  const action =
    caseBrief?.action ||
    insights[1] ||
    textByLang(
      options.lang,
      '用定位、人设、选题优先级三步重构执行路径。',
      'Rebuild execution with positioning, persona, and prioritized topic planning.',
    );
  const result =
    caseBrief?.result ||
    proofLine ||
    textByLang(
      options.lang,
      '已形成可验证的周迭代闭环。',
      'A measurable weekly iteration loop is now in place.',
    );

  const githubTitle = textByLang(
    options.lang,
    `从构建日志到增长闭环：${options.niche} 一次实战复盘`,
    `From build log to growth loop: a practical ${options.niche} breakdown`,
  );

  const shortPosts = [
    textByLang(
      options.lang,
      `我刚把一条构建日志转成了完整增长闭环。问题是：${problem}。做法是：${action}。结果：${result}。${options.cta} ${repoLink}`,
      `I turned one build log into a full growth loop. Problem: ${problem}. Action: ${action}. Result: ${result}. ${options.cta} ${repoLink}`,
    ),
    textByLang(
      options.lang,
      `多数人卡住不是不努力，而是没有执行系统。这个案例里我用 IPClaw 做了定位->人设->P1/P2/P3 选题，结果：${result}。${repoLink}`,
      `Most creators are stuck not because of effort, but because they lack an execution system. In this case, IPClaw generated positioning -> persona -> P1/P2/P3 topics. Result: ${result}. ${repoLink}`,
    ),
    textByLang(
      options.lang,
      `案例快照：问题=${problem}；动作=${action}；结果=${result}。如果你也在做 ${options.niche}，这套流程可直接复用。${repoLink}`,
      `Case snapshot: problem=${problem}; action=${action}; result=${result}. If you work on ${options.niche}, this workflow is reusable. ${repoLink}`,
    ),
    textByLang(
      options.lang,
      `本周我只做一件事：把内容生产改成结果导向。核心步骤是 ${action}，并用数据复盘。当前信号：${result}。${repoLink}`,
      `This week I focused on one thing: turning content production into a result-oriented loop. Core step: ${action}, followed by data review. Signal so far: ${result}. ${repoLink}`,
    ),
    textByLang(
      options.lang,
      `如果你有同样问题：${problem}，欢迎贴出你的场景。我会按这个案例结构给你一版执行清单。${repoLink}`,
      `If your problem looks like this: ${problem}, share your context. I will return an execution checklist based on this case structure. ${repoLink}`,
    ),
  ];

  return `# ${textByLang(options.lang, 'IPClaw 内容包', 'IPClaw Content Pack')}

- ${textByLang(options.lang, '模式', 'Mode')}：${caseBrief ? textByLang(options.lang, '案例驱动', 'Case-driven') : textByLang(options.lang, '标准模式', 'Standard')}
- ${textByLang(options.lang, '创作者', 'Creator')}：${options.creator}
- ${textByLang(options.lang, '赛道', 'Niche')}：${options.niche}

## ${textByLang(options.lang, '案例快照（Problem -> Action -> Result）', 'Case Snapshot (Problem -> Action -> Result)')}

- Problem: ${problem}
- Action: ${action}
- Result: ${result}

## 1) ${textByLang(options.lang, 'GitHub 更新（问题-方案-结果）', 'GitHub Update (Problem-Solution-Result)')}

### ${githubTitle}

${textByLang(options.lang, '问题', 'Problem')}：${problem}

${textByLang(options.lang, '方案', 'Solution')}：${action}

${textByLang(options.lang, '结果', 'Result')}：${result}

${textByLang(options.lang, '下一步', 'Next Step')}：${options.cta}

${textByLang(options.lang, '仓库链接', 'Repo')}：${repoLink}

## 2) ${textByLang(options.lang, '短内容版本 x5', 'Short Posts x5')}

1. ${shortPosts[0]}
2. ${shortPosts[1]}
3. ${shortPosts[2]}
4. ${shortPosts[3]}
5. ${shortPosts[4]}

## 3) ${textByLang(options.lang, '社区讨论贴', 'Community Discussion Post')}

${textByLang(
    options.lang,
    `我们最近在做一个 ${options.niche} 的执行实验。当前案例是：问题「${problem}」，动作「${action}」，结果「${result}」。你最关心哪一步：定位、人设还是选题优先级？欢迎直接回复你的场景，我会补一版可执行方案。`,
    `We are running an execution experiment around ${options.niche}. Current case: problem "${problem}", action "${action}", result "${result}". Which step matters most to you: positioning, persona, or topic prioritization? Share your context and I will propose an actionable plan.`,
  )}

## 4) ${textByLang(options.lang, 'Changelog 摘要', 'Changelog Summary')}

- ${textByLang(options.lang, '新增', 'Added')}：${textByLang(options.lang, '案例驱动内容包输出', 'Case-driven content-pack output')}
- ${textByLang(options.lang, '优化', 'Improved')}：${textByLang(options.lang, '选题去重与语义多样性', 'topic de-duplication and semantic variety')}
- ${textByLang(options.lang, '用户价值', 'User Value')}：${textByLang(options.lang, '从“有输出”转向“有验证结果”的发布节奏', 'a shift from output-only posting to measurable iteration')}

## ${textByLang(options.lang, '模板参考', 'Template Reference')}

- ${templatePath}
`;
}

function main(): void {
  const options = parseArgs();
  const runId = timestampSlug();
  const outputDir =
    options.outputDir || path.join('plans', 'ipclaw-runs', `${runId}`);

  ensureDir(outputDir);

  const sourceText = options.sourcePath ? readIfExists(options.sourcePath) : '';
  const caseTextFromFile = options.caseFilePath
    ? readIfExists(options.caseFilePath)
    : '';
  const caseText = normalizeCaseText(
    [options.caseInput || '', caseTextFromFile].filter(Boolean).join('\n'),
  );
  const combinedSource = [sourceText, caseText].filter(Boolean).join('\n');
  const keyPoints = extractKeyPoints(combinedSource, 12);
  const insights = extractInsights(keyPoints, 10);
  const proofPoints = extractProofPoints(keyPoints, options.lang, 3);
  const caseBrief = parseCaseBrief(caseText, keyPoints, options.lang);

  const positioningTemplatePath = 'templates/ipclaw/positioning-prompt.md';
  const personaTemplatePath = 'templates/ipclaw/persona-canvas.md';
  const topicTemplatePath = 'templates/ipclaw/topic-ideas.md';
  const contentTemplatePath = 'templates/ipclaw/content-repurpose.md';

  loadTemplate(positioningTemplatePath);
  loadTemplate(personaTemplatePath);
  loadTemplate(topicTemplatePath);
  loadTemplate(contentTemplatePath);

  const indexContent = `# IPClaw Run Pack

- Run ID: ${runId}
- Creator: ${options.creator}
- Niche: ${options.niche}
- Audience: ${options.audience}
- Language: ${options.lang}
- Channels: ${options.channels.join(', ')}
- Focus: ${options.focusTags.length > 0 ? options.focusTags.join(', ') : '(auto)'}
- Topics: ${options.topicCount}
- Goal: ${options.goal || '(default)'}
- Source: ${options.sourcePath || '(none)'}
- Case: ${caseBrief ? textByLang(options.lang, '已启用', 'enabled') : '(none)'}
- Case File: ${options.caseFilePath || '(none)'}
- Repo: ${options.repoUrl || '(none)'}
- Generated At: ${new Date().toISOString()}

## Files

- 01-positioning.md
- 02-persona.md
- 03-topic-ideas.md
- 04-content-pack.md

## Auto-fill Summary

- Key points extracted: ${keyPoints.length}
- Strategic insights: ${insights.length}
- Proof points: ${proofPoints.length}

## Suggested Flow

1. Review and lock positioning.
2. Confirm primary persona and pain points.
3. Pick top 2 P1 topics and publish.
4. Collect feedback and refresh topic backlog.
`;

  const positioningContent = buildPositioningCard(
    options,
    keyPoints,
    positioningTemplatePath,
    caseBrief,
  );
  const personaContent = buildPersonaCard(
    options,
    keyPoints,
    personaTemplatePath,
    caseBrief,
  );
  const topicIdeasContent = buildTopicIdeas(
    options,
    keyPoints,
    topicTemplatePath,
    caseBrief,
  );
  const contentPack = buildContentPack(
    options,
    keyPoints,
    contentTemplatePath,
    caseBrief,
  );

  writeFile(path.join(outputDir, 'README.md'), indexContent);
  writeFile(path.join(outputDir, '01-positioning.md'), positioningContent);
  writeFile(path.join(outputDir, '02-persona.md'), personaContent);
  writeFile(path.join(outputDir, '03-topic-ideas.md'), topicIdeasContent);
  writeFile(path.join(outputDir, '04-content-pack.md'), contentPack);

  console.log(outputDir);
}

main();
