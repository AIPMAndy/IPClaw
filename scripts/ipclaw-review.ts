import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export type ReviewFormat = 'md' | 'json' | 'both';

export interface ReviewOptions {
  trackerPath?: string;
  outPath?: string;
  format: ReviewFormat;
  minImpressions: number;
  strongCtr: number;
  weakCtr: number;
  leadTarget: number;
}

export interface TrackerRow {
  topicId: string;
  priority: 'P1' | 'P2' | 'P3' | 'Unknown';
  title: string;
  channel: string;
  status: string;
  publishDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  leadRate: number;
  notes: string;
}

export type Recommendation = 'double-down' | 'keep' | 'drop';

interface EvaluatedTopic {
  row: TrackerRow;
  recommendation: Recommendation;
}

export interface RecommendationItem {
  recommendation: Recommendation;
  topic: TrackerRow;
}

interface PrioritySummary {
  priority: TrackerRow['priority'];
  topics: number;
  published: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
}

export interface WeeklyReviewData {
  generatedAt: string;
  trackerPath: string;
  thresholds: Pick<
    ReviewOptions,
    'minImpressions' | 'strongCtr' | 'weakCtr' | 'leadTarget'
  >;
  snapshot: {
    topics: number;
    published: number;
    planned: number;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
    leadRate: number;
  };
  priorityBreakdown: PrioritySummary[];
  recommendationMix: {
    doubleDown: number;
    keep: number;
    drop: number;
  };
  recommendations: {
    doubleDown: RecommendationItem[];
    keep: RecommendationItem[];
    drop: RecommendationItem[];
  };
}

function getArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

function parseIntArg(
  value: string | undefined,
  fallback: number,
  minValue: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < minValue) return fallback;
  return parsed;
}

function parseFloatArg(
  value: string | undefined,
  fallback: number,
  minValue: number,
  maxValue: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < minValue || parsed > maxValue) return fallback;
  return parsed;
}

function normalizeFormat(value: string | undefined): ReviewFormat {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'json') return 'json';
  if (normalized === 'both') return 'both';
  return 'md';
}

function normalizePriority(value: string): TrackerRow['priority'] {
  const upper = value.trim().toUpperCase();
  if (upper === 'P1' || upper === 'P2' || upper === 'P3') return upper;
  return 'Unknown';
}

function parseCount(rawValue: string): number {
  const normalized = rawValue.replace(/[, ]/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function parseRate(rawValue: string): number | undefined {
  const value = rawValue.trim();
  if (!value) return undefined;
  const hasPercentSign = value.includes('%');
  const normalized = value.replace(/[% ,]/g, '');
  if (!normalized) return undefined;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  if (hasPercentSign) return parsed / 100;
  if (parsed > 1) return parsed / 100;
  return parsed;
}

function parseCsvRows(content: string): string[][] {
  if (!content.trim()) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      if (inQuotes && content[index + 1] === '"') {
        currentCell += '"';
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(currentCell);
      currentCell = '';
      continue;
    }

    if (char === '\n' && !inQuotes) {
      row.push(currentCell);
      currentCell = '';
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
      row = [];
      continue;
    }

    if (char === '\r') continue;
    currentCell += char;
  }

  row.push(currentCell);
  if (!(row.length === 1 && row[0] === '')) rows.push(row);

  return rows;
}

export function parseTrackerCsv(content: string): TrackerRow[] {
  const rows = parseCsvRows(content);
  if (rows.length === 0) return [];

  const header = rows[0].map((item) => item.trim());
  const headerIndex = new Map<string, number>();
  for (let index = 0; index < header.length; index += 1) {
    headerIndex.set(header[index], index);
  }

  const required = [
    'topic_id',
    'priority',
    'title',
    'channel',
    'status',
    'publish_date',
    'impressions',
    'clicks',
    'ctr',
    'leads',
    'lead_rate',
    'notes',
  ];

  for (const field of required) {
    if (!headerIndex.has(field)) {
      throw new Error(`Invalid tracker header: missing field "${field}"`);
    }
  }

  const getCell = (row: string[], field: string): string => {
    const index = headerIndex.get(field);
    if (index === undefined) return '';
    return (row[index] || '').trim();
  };

  const dataRows: TrackerRow[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const currentRow = rows[index];
    if (!currentRow || currentRow.every((cell) => !cell.trim())) continue;

    const impressions = parseCount(getCell(currentRow, 'impressions'));
    const clicks = parseCount(getCell(currentRow, 'clicks'));
    const leads = parseCount(getCell(currentRow, 'leads'));

    const parsedCtr = parseRate(getCell(currentRow, 'ctr'));
    const parsedLeadRate = parseRate(getCell(currentRow, 'lead_rate'));

    const ctr = parsedCtr ?? (impressions > 0 ? clicks / impressions : 0);
    const leadRate = parsedLeadRate ?? (clicks > 0 ? leads / clicks : 0);

    dataRows.push({
      topicId: getCell(currentRow, 'topic_id'),
      priority: normalizePriority(getCell(currentRow, 'priority')),
      title: getCell(currentRow, 'title'),
      channel: getCell(currentRow, 'channel') || 'Unknown',
      status: getCell(currentRow, 'status') || 'planned',
      publishDate: getCell(currentRow, 'publish_date'),
      impressions,
      clicks,
      ctr,
      leads,
      leadRate,
      notes: getCell(currentRow, 'notes'),
    });
  }

  return dataRows;
}

function isPublishedStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === 'published' ||
    normalized === 'posted' ||
    normalized === 'live' ||
    normalized === 'done' ||
    normalized === 'completed'
  );
}

function isDroppedStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === 'drop' ||
    normalized === 'dropped' ||
    normalized === 'cancelled'
  );
}

export function evaluateTopic(
  row: TrackerRow,
  options: Pick<
    ReviewOptions,
    'minImpressions' | 'strongCtr' | 'weakCtr' | 'leadTarget'
  >,
): Recommendation {
  if (isDroppedStatus(row.status)) return 'drop';
  if (!isPublishedStatus(row.status)) return 'keep';

  if (row.leads >= options.leadTarget) return 'double-down';
  if (
    row.impressions >= options.minImpressions &&
    row.ctr >= options.strongCtr
  ) {
    return 'double-down';
  }

  if (row.impressions >= options.minImpressions * 2 && row.clicks === 0) {
    return 'drop';
  }
  if (
    row.impressions >= options.minImpressions &&
    row.ctr <= options.weakCtr &&
    row.leads === 0
  ) {
    return 'drop';
  }

  return 'keep';
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function buildTopicLine(item: EvaluatedTopic): string {
  const { row } = item;
  return `- [${row.topicId || 'topic'}] (${row.priority}/${row.channel}) ${row.title} | status=${row.status} | impressions=${row.impressions}, clicks=${row.clicks}, ctr=${formatPercent(row.ctr)}, leads=${row.leads}`;
}

function recommendationLabel(recommendation: Recommendation): string {
  if (recommendation === 'double-down') return 'Double-down';
  if (recommendation === 'drop') return 'Drop';
  return 'Keep';
}

function sortByImpact(items: EvaluatedTopic[]): EvaluatedTopic[] {
  return [...items].sort((a, b) => {
    if (b.row.leads !== a.row.leads) return b.row.leads - a.row.leads;
    if (b.row.clicks !== a.row.clicks) return b.row.clicks - a.row.clicks;
    return b.row.impressions - a.row.impressions;
  });
}

function safeDivide(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function summarizePriority(
  rows: TrackerRow[],
  priority: TrackerRow['priority'],
): PrioritySummary {
  const filtered = rows.filter((row) => row.priority === priority);
  const topics = filtered.length;
  const published = filtered.filter((row) =>
    isPublishedStatus(row.status),
  ).length;
  const impressions = filtered.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = filtered.reduce((sum, row) => sum + row.clicks, 0);
  const leads = filtered.reduce((sum, row) => sum + row.leads, 0);
  const ctr = safeDivide(clicks, impressions);
  return { priority, topics, published, impressions, clicks, ctr, leads };
}

function buildPriorityMarkdownRow(summary: PrioritySummary): string {
  const { priority, topics, published, impressions, clicks, ctr, leads } =
    summary;
  return `| ${priority} | ${topics} | ${published} | ${impressions} | ${clicks} | ${formatPercent(ctr)} | ${leads} |`;
}

export function buildWeeklyReviewData(
  rows: TrackerRow[],
  trackerPath: string,
  options: Pick<
    ReviewOptions,
    'minImpressions' | 'strongCtr' | 'weakCtr' | 'leadTarget'
  >,
): WeeklyReviewData {
  const generatedAt = new Date().toISOString();
  const publishedRows = rows.filter((row) => isPublishedStatus(row.status));
  const plannedRows = rows.filter((row) => !isPublishedStatus(row.status));

  const totals = {
    impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
    clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
    leads: rows.reduce((sum, row) => sum + row.leads, 0),
  };
  const overallCtr = safeDivide(totals.clicks, totals.impressions);
  const overallLeadRate = safeDivide(totals.leads, totals.clicks);

  const evaluated = rows.map((row) => ({
    row,
    recommendation: evaluateTopic(row, options),
  }));

  const toRecommendationItems = (
    items: EvaluatedTopic[],
  ): RecommendationItem[] =>
    items.map((item) => ({
      recommendation: item.recommendation,
      topic: item.row,
    }));

  const doubleDown = sortByImpact(
    evaluated.filter((item) => item.recommendation === 'double-down'),
  );
  const keep = sortByImpact(
    evaluated.filter((item) => item.recommendation === 'keep'),
  );
  const drop = sortByImpact(
    evaluated.filter((item) => item.recommendation === 'drop'),
  );

  return {
    generatedAt,
    trackerPath,
    thresholds: options,
    snapshot: {
      topics: rows.length,
      published: publishedRows.length,
      planned: plannedRows.length,
      impressions: totals.impressions,
      clicks: totals.clicks,
      leads: totals.leads,
      ctr: overallCtr,
      leadRate: overallLeadRate,
    },
    priorityBreakdown: [
      summarizePriority(rows, 'P1'),
      summarizePriority(rows, 'P2'),
      summarizePriority(rows, 'P3'),
      summarizePriority(rows, 'Unknown'),
    ],
    recommendationMix: {
      doubleDown: doubleDown.length,
      keep: keep.length,
      drop: drop.length,
    },
    recommendations: {
      doubleDown: toRecommendationItems(doubleDown),
      keep: toRecommendationItems(keep),
      drop: toRecommendationItems(drop),
    },
  };
}

function renderWeeklyReviewMarkdown(data: WeeklyReviewData): string {
  const toEvaluatedTopics = (items: RecommendationItem[]): EvaluatedTopic[] =>
    items.map((item) => ({
      row: item.topic,
      recommendation: item.recommendation,
    }));

  const evaluatedDoubleDown = toEvaluatedTopics(
    data.recommendations.doubleDown,
  );
  const evaluatedKeep = toEvaluatedTopics(data.recommendations.keep);
  const evaluatedDrop = toEvaluatedTopics(data.recommendations.drop);

  const recommendationSummary = [
    `- ${recommendationLabel('double-down')}: ${data.recommendationMix.doubleDown}`,
    `- ${recommendationLabel('keep')}: ${data.recommendationMix.keep}`,
    `- ${recommendationLabel('drop')}: ${data.recommendationMix.drop}`,
  ].join('\n');

  const renderGroup = (items: EvaluatedTopic[], fallback: string): string => {
    if (items.length === 0) return `- ${fallback}`;
    return items.map((item) => buildTopicLine(item)).join('\n');
  };

  return `# IPClaw Weekly KPI Review

- Generated At: ${data.generatedAt}
- Tracker: ${data.trackerPath}
- Thresholds: min_impressions=${data.thresholds.minImpressions}, strong_ctr=${formatPercent(data.thresholds.strongCtr)}, weak_ctr=${formatPercent(data.thresholds.weakCtr)}, lead_target=${data.thresholds.leadTarget}

## Snapshot

- Topics in tracker: ${data.snapshot.topics}
- Published topics: ${data.snapshot.published}
- Planned topics: ${data.snapshot.planned}
- Total impressions: ${data.snapshot.impressions}
- Total clicks: ${data.snapshot.clicks}
- Total leads: ${data.snapshot.leads}
- Overall CTR: ${formatPercent(data.snapshot.ctr)}
- Overall lead rate: ${formatPercent(data.snapshot.leadRate)}

## Priority Breakdown

| Priority | Topics | Published | Impressions | Clicks | CTR | Leads |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${data.priorityBreakdown.map((summary) => buildPriorityMarkdownRow(summary)).join('\n')}

## Recommendation Mix

${recommendationSummary}

## Double-down

${renderGroup(
  evaluatedDoubleDown,
  'No topic reached the current double-down threshold. Keep testing headline and distribution angle.',
)}

## Keep

${renderGroup(
  evaluatedKeep,
  'No keep candidates. Either publish pending topics first or refine current threshold settings.',
)}

## Drop

${renderGroup(evaluatedDrop, 'No drop candidates this cycle.')}

## Next Sprint Actions

1. Ship at least two P1 topics from the double-down or keep list.
2. Rewrite hook + format for dropped topics and retest once before archival.
3. Update this tracker weekly and compare recommendation drift over time.
`;
}

export function buildWeeklyReviewMarkdown(
  rows: TrackerRow[],
  trackerPath: string,
  options: Pick<
    ReviewOptions,
    'minImpressions' | 'strongCtr' | 'weakCtr' | 'leadTarget'
  >,
): string {
  const data = buildWeeklyReviewData(rows, trackerPath, options);
  return renderWeeklyReviewMarkdown(data);
}

function findLatestTracker(projectDir: string): string | undefined {
  const baseDir = path.join(projectDir, 'plans', 'ipclaw-runs');
  if (!fs.existsSync(baseDir)) return undefined;

  const runDirs = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (let index = runDirs.length - 1; index >= 0; index -= 1) {
    const trackerPath = path.join(
      baseDir,
      runDirs[index],
      '05-feedback-tracker.csv',
    );
    if (fs.existsSync(trackerPath)) return trackerPath;
  }

  return undefined;
}

interface OutputPaths {
  mdPath: string;
  jsonPath: string;
}

function resolveOutputPaths(
  outArg: string | undefined,
  trackerPath: string,
): OutputPaths {
  const defaultBaseName = '06-weekly-review';

  if (!outArg) {
    const baseDir = path.dirname(trackerPath);
    return {
      mdPath: path.join(baseDir, `${defaultBaseName}.md`),
      jsonPath: path.join(baseDir, `${defaultBaseName}.json`),
    };
  }

  const extension = path.extname(outArg).toLowerCase();
  if (extension === '.md' || extension === '.json') {
    const baseDir = path.dirname(outArg);
    const baseName = path.basename(outArg, extension);
    return {
      mdPath: path.join(baseDir, `${baseName}.md`),
      jsonPath: path.join(baseDir, `${baseName}.json`),
    };
  }

  const isExistingDir =
    fs.existsSync(outArg) && fs.statSync(outArg).isDirectory();
  const isDirectoryHint =
    outArg.endsWith(path.sep) || outArg.endsWith('/') || isExistingDir;
  if (isDirectoryHint) {
    return {
      mdPath: path.join(outArg, `${defaultBaseName}.md`),
      jsonPath: path.join(outArg, `${defaultBaseName}.json`),
    };
  }

  const baseDir = path.dirname(outArg);
  const baseName = path.basename(outArg);
  return {
    mdPath: path.join(baseDir, `${baseName}.md`),
    jsonPath: path.join(baseDir, `${baseName}.json`),
  };
}

function parseArgs(): ReviewOptions {
  const help = process.argv.includes('--help') || process.argv.includes('-h');
  if (help) {
    console.log(
      'Usage: npm run ip:review -- [--tracker <path>] [--out <file-or-dir>] [--format md|json|both] [--min-impressions <number>] [--strong-ctr <0-1>] [--weak-ctr <0-1>] [--lead-target <number>]',
    );
    process.exit(0);
  }

  return {
    trackerPath: getArg('tracker'),
    outPath: getArg('out'),
    format: normalizeFormat(getArg('format')),
    minImpressions: parseIntArg(getArg('min-impressions'), 120, 1),
    strongCtr: parseFloatArg(getArg('strong-ctr'), 0.04, 0, 1),
    weakCtr: parseFloatArg(getArg('weak-ctr'), 0.01, 0, 1),
    leadTarget: parseIntArg(getArg('lead-target'), 2, 1),
  };
}

function main(): void {
  const options = parseArgs();
  const resolvedTrackerPath =
    options.trackerPath || findLatestTracker(process.cwd());

  if (!resolvedTrackerPath) {
    console.error(
      'Tracker file not found. Run ip:run first or provide --tracker <path>.',
    );
    process.exit(1);
  }

  if (!fs.existsSync(resolvedTrackerPath)) {
    console.error(`Tracker file not found: ${resolvedTrackerPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolvedTrackerPath, 'utf-8');
  const rows = parseTrackerCsv(content);

  if (rows.length === 0) {
    console.error(
      'Tracker contains no data rows. Ensure it has at least one topic entry.',
    );
    process.exit(1);
  }

  const outputPaths = resolveOutputPaths(options.outPath, resolvedTrackerPath);
  const reportData = buildWeeklyReviewData(rows, resolvedTrackerPath, options);
  const writtenPaths: string[] = [];

  if (options.format === 'md' || options.format === 'both') {
    const markdown = renderWeeklyReviewMarkdown(reportData);
    fs.mkdirSync(path.dirname(outputPaths.mdPath), { recursive: true });
    fs.writeFileSync(outputPaths.mdPath, markdown);
    writtenPaths.push(outputPaths.mdPath);
  }

  if (options.format === 'json' || options.format === 'both') {
    const jsonOutput = `${JSON.stringify(reportData, null, 2)}\n`;
    fs.mkdirSync(path.dirname(outputPaths.jsonPath), { recursive: true });
    fs.writeFileSync(outputPaths.jsonPath, jsonOutput);
    writtenPaths.push(outputPaths.jsonPath);
  }

  console.log(writtenPaths.join('\n'));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  main();
}
