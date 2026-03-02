import { ConfigSchema } from './schema.js';

describe('config schema base url fields', () => {
  it('accepts openai and anthropic base url fields', () => {
    const parsed = ConfigSchema.parse({
      defaultProvider: 'openai',
      openaiBaseUrl: 'https://openai-proxy.example.com/v1',
      anthropicBaseUrl: 'https://anthropic-proxy.example.com',
    });

    expect(parsed.openaiBaseUrl).toBe('https://openai-proxy.example.com/v1');
    expect(parsed.anthropicBaseUrl).toBe('https://anthropic-proxy.example.com');
  });
});
