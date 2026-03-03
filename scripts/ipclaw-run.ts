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
      'Usage: npm run ip:run -- --creator "<name>" --niche "<niche>" --audience "<audience>" [--source <file>] [--repo <url>] [--cta <text>] [--channels github,x] [--focus 增长飞轮,模板复用] [--topics <count>] [--goal <text>] [--lang zh|en] [--out <dir>]',
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

function buildPositioningCard(
  options: CliOptions,
  keyPoints: string[],
  templatePath: string,
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
): string {
  const insights = extractInsights(keyPoints, 6);
  const painPoints = [
    insights[0] || textByLang(options.lang, `很难持续做出高质量${options.niche}内容`, `Hard to sustain high-quality ${options.niche} content`),
    insights[1] || textByLang(options.lang, '有输出但缺少明确结构与人设一致性', 'Outputs exist but lack a clear structure and persona consistency'),
    insights[2] || textByLang(options.lang, '不知道哪些选题能带来有效互动与转化', 'Unclear which topics can create engagement and conversion'),
  ];

  const goalText = options.goal || textByLang(options.lang, '每周稳定产出并发布 2-3 条高质量内容', 'Publish 2-3 high-quality pieces every week');

  const trustSignals = [
    textByLang(options.lang, '可验证的真实构建过程', 'Verifiable real build process'),
    textByLang(options.lang, '可复制的模板与步骤', 'Reusable templates and steps'),
    textByLang(options.lang, '清晰边界：不夸大承诺', 'Clear boundaries: no exaggerated claims'),
  ];

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
): string {
  const insights = extractInsights(keyPoints, 8);

  const focusSeeds = options.focusTags.map((tag) =>
    textByLang(
      options.lang,
      `${options.niche}${tag}`,
      `${options.niche} ${tag}`,
    ),
  );

  const seeds = dedupe([
    ...focusSeeds,
    ...insights,
    textByLang(options.lang, `${options.niche}常见误区`, `Common mistakes in ${options.niche}`),
    textByLang(options.lang, `${options.niche}执行路径`, `Execution path for ${options.niche}`),
    textByLang(options.lang, `${options.niche}案例拆解`, `Case breakdowns in ${options.niche}`),
  ]).slice(0, 8);

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

  const appendIdeas = (
    priority: TopicIdea['priority'],
    count: number,
    builders: TopicBuilder[],
    startIndex: number,
  ): void => {
    for (let index = 0; index < count; index += 1) {
      const seed = seeds[(startIndex + index) % seeds.length];
      const channel = channelLabels[(startIndex + index) % channelLabels.length];
      const builder = builders[index % builders.length];
      const content = builder(seed, options);
      ideas.push({
        priority,
        title: content.title,
        angle: content.angle,
        format: content.format,
        hook: content.hook,
        cta: options.cta,
        channel,
      });
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

function main(): void {
  const options = parseArgs();
  const runId = timestampSlug();
  const outputDir =
    options.outputDir || path.join('plans', 'ipclaw-runs', `${runId}`);

  ensureDir(outputDir);

  const sourceText = options.sourcePath ? readIfExists(options.sourcePath) : '';
  const keyPoints = extractKeyPoints(sourceText, 6);
  const insights = extractInsights(keyPoints, 6);
  const proofPoints = extractProofPoints(keyPoints, options.lang, 3);

  const positioningTemplatePath = 'templates/ipclaw/positioning-prompt.md';
  const personaTemplatePath = 'templates/ipclaw/persona-canvas.md';
  const topicTemplatePath = 'templates/ipclaw/topic-ideas.md';

  loadTemplate(positioningTemplatePath);
  loadTemplate(personaTemplatePath);
  loadTemplate(topicTemplatePath);

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
- Repo: ${options.repoUrl || '(none)'}
- Generated At: ${new Date().toISOString()}

## Files

- 01-positioning.md
- 02-persona.md
- 03-topic-ideas.md

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
  );
  const personaContent = buildPersonaCard(
    options,
    keyPoints,
    personaTemplatePath,
  );
  const topicIdeasContent = buildTopicIdeas(
    options,
    keyPoints,
    topicTemplatePath,
  );

  writeFile(path.join(outputDir, 'README.md'), indexContent);
  writeFile(path.join(outputDir, '01-positioning.md'), positioningContent);
  writeFile(path.join(outputDir, '02-persona.md'), personaContent);
  writeFile(path.join(outputDir, '03-topic-ideas.md'), topicIdeasContent);

  console.log(outputDir);
}

main();
