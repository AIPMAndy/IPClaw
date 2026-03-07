import { describe, it, expect } from 'vitest';

import {
  buildFeedbackTrackerCsv,
  resolveDefaultCta,
  resolveLang,
} from './ipclaw-run.js';

describe('ipclaw-run argument helpers', () => {
  it('defaults language to zh when missing or unsupported', () => {
    expect(resolveLang()).toBe('zh');
    expect(resolveLang('fr')).toBe('zh');
  });

  it('keeps en when explicitly requested', () => {
    expect(resolveLang('en')).toBe('en');
  });

  it('uses localized default CTA when not provided', () => {
    expect(resolveDefaultCta('en')).toContain(
      'Reply with your context and I will draft an actionable IP growth plan for you.',
    );
    expect(resolveDefaultCta('zh')).toContain('欢迎回复你的场景');
  });

  it('preserves explicit CTA override', () => {
    expect(resolveDefaultCta('en', 'custom-en')).toBe('custom-en');
    expect(resolveDefaultCta('zh', '自定义')).toBe('自定义');
  });
});

describe('feedback tracker csv', () => {
  it('generates header and stable topic ids', () => {
    const csv = buildFeedbackTrackerCsv([
      {
        priority: 'P1',
        title: 'First title',
        angle: 'angle',
        format: 'format',
        hook: 'hook',
        cta: 'cta',
        channel: 'GitHub',
      },
      {
        priority: 'P2',
        title: 'Second title',
        angle: 'angle',
        format: 'format',
        hook: 'hook',
        cta: 'cta',
        channel: 'X',
      },
    ]);

    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(
      'topic_id,priority,title,channel,status,publish_date,impressions,clicks,ctr,leads,lead_rate,notes',
    );
    expect(lines[1]).toContain('topic-01');
    expect(lines[2]).toContain('topic-02');
    expect(lines).toHaveLength(3);
  });

  it('escapes csv-sensitive topic titles', () => {
    const csv = buildFeedbackTrackerCsv([
      {
        priority: 'P1',
        title: 'A "quoted", title',
        angle: 'angle',
        format: 'format',
        hook: 'hook',
        cta: 'cta',
        channel: 'GitHub',
      },
    ]);

    expect(csv).toContain('"A ""quoted"", title"');
  });
});
