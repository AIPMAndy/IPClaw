import { describe, it, expect } from 'vitest';

import { resolveDefaultCta, resolveLang } from './ipclaw-run.js';

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
