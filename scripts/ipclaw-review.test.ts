import { describe, expect, it } from 'vitest';

import {
  buildWeeklyReviewData,
  buildWeeklyReviewMarkdown,
  evaluateTopic,
  parseTrackerCsv,
  type TrackerRow,
} from './ipclaw-review.js';

describe('ipclaw-review csv parser', () => {
  it('parses csv rows with quoted commas and escaped quotes', () => {
    const csv = [
      'topic_id,priority,title,channel,status,publish_date,impressions,clicks,ctr,leads,lead_rate,notes',
      'topic-01,P1,"A ""quoted"", title",GitHub,published,2026-03-07,200,20,10%,3,15%,"note, with comma"',
    ].join('\n');

    const rows = parseTrackerCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('A "quoted", title');
    expect(rows[0].notes).toBe('note, with comma');
    expect(rows[0].ctr).toBeCloseTo(0.1, 6);
    expect(rows[0].leadRate).toBeCloseTo(0.15, 6);
  });
});

describe('ipclaw-review recommendation strategy', () => {
  const thresholds = {
    minImpressions: 120,
    strongCtr: 0.04,
    weakCtr: 0.01,
    leadTarget: 2,
  };

  const baseRow: TrackerRow = {
    topicId: 'topic-01',
    priority: 'P1',
    title: 'Title',
    channel: 'GitHub',
    status: 'published',
    publishDate: '2026-03-07',
    impressions: 0,
    clicks: 0,
    ctr: 0,
    leads: 0,
    leadRate: 0,
    notes: '',
  };

  it('marks strong performers as double-down', () => {
    const recommendation = evaluateTopic(
      {
        ...baseRow,
        impressions: 300,
        clicks: 30,
        ctr: 0.1,
        leads: 4,
      },
      thresholds,
    );
    expect(recommendation).toBe('double-down');
  });

  it('marks weak performers as drop', () => {
    const recommendation = evaluateTopic(
      {
        ...baseRow,
        impressions: 200,
        clicks: 1,
        ctr: 0.005,
        leads: 0,
      },
      thresholds,
    );
    expect(recommendation).toBe('drop');
  });

  it('keeps planned topics as keep', () => {
    const recommendation = evaluateTopic(
      {
        ...baseRow,
        status: 'planned',
      },
      thresholds,
    );
    expect(recommendation).toBe('keep');
  });
});

describe('ipclaw-review markdown output', () => {
  it('includes snapshot and recommendation sections', () => {
    const rows: TrackerRow[] = [
      {
        topicId: 'topic-01',
        priority: 'P1',
        title: 'High performer',
        channel: 'GitHub',
        status: 'published',
        publishDate: '2026-03-07',
        impressions: 300,
        clicks: 36,
        ctr: 0.12,
        leads: 4,
        leadRate: 4 / 36,
        notes: '',
      },
      {
        topicId: 'topic-02',
        priority: 'P2',
        title: 'Low performer',
        channel: 'X',
        status: 'published',
        publishDate: '2026-03-07',
        impressions: 200,
        clicks: 1,
        ctr: 0.005,
        leads: 0,
        leadRate: 0,
        notes: '',
      },
    ];

    const report = buildWeeklyReviewMarkdown(rows, '/tmp/tracker.csv', {
      minImpressions: 120,
      strongCtr: 0.04,
      weakCtr: 0.01,
      leadTarget: 2,
    });

    expect(report).toContain('# IPClaw Weekly KPI Review');
    expect(report).toContain('## Snapshot');
    expect(report).toContain('## Recommendation Mix');
    expect(report).toContain('## Double-down');
    expect(report).toContain('## Drop');
  });

  it('builds structured weekly review data for json output', () => {
    const rows: TrackerRow[] = [
      {
        topicId: 'topic-01',
        priority: 'P1',
        title: 'High performer',
        channel: 'GitHub',
        status: 'published',
        publishDate: '2026-03-07',
        impressions: 300,
        clicks: 36,
        ctr: 0.12,
        leads: 4,
        leadRate: 4 / 36,
        notes: '',
      },
      {
        topicId: 'topic-02',
        priority: 'P2',
        title: 'Low performer',
        channel: 'X',
        status: 'published',
        publishDate: '2026-03-07',
        impressions: 200,
        clicks: 1,
        ctr: 0.005,
        leads: 0,
        leadRate: 0,
        notes: '',
      },
    ];

    const data = buildWeeklyReviewData(rows, '/tmp/tracker.csv', {
      minImpressions: 120,
      strongCtr: 0.04,
      weakCtr: 0.01,
      leadTarget: 2,
    });

    expect(data.snapshot.topics).toBe(2);
    expect(data.snapshot.published).toBe(2);
    expect(data.recommendationMix.doubleDown).toBe(1);
    expect(data.recommendationMix.drop).toBe(1);
    expect(data.recommendations.doubleDown[0].topic.topicId).toBe('topic-01');
    expect(data.recommendations.drop[0].topic.topicId).toBe('topic-02');
  });
});
