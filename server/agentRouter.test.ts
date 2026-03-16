import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';

describe('ANTHROPIC_API_KEY validation', () => {
  it('should have a valid API key configured (format check)', () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(apiKey, 'ANTHROPIC_API_KEY must be set').toBeTruthy();
    expect(apiKey!.length, 'API key must be non-empty').toBeGreaterThan(10);
    // Les clés Anthropic commencent par "sk-ant-"
    expect(apiKey, 'API key must start with sk-ant-').toMatch(/^sk-ant-/);
  });

  it('should instantiate Anthropic client without error', () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(() => new Anthropic({ apiKey })).not.toThrow();
  });
});
