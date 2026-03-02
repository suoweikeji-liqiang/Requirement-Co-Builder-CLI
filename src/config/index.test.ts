import { getBaseUrl } from './index.js';
import type { Config } from './schema.js';

describe('config base url resolution', () => {
  it('returns openai base url when default provider is openai', () => {
    const config: Config = {
      defaultProvider: 'openai',
      openaiBaseUrl: 'https://openai-proxy.example.com/v1',
    };
    expect(getBaseUrl(config)).toBe('https://openai-proxy.example.com/v1');
  });

  it('returns anthropic base url when default provider is anthropic', () => {
    const config: Config = {
      defaultProvider: 'anthropic',
      anthropicBaseUrl: 'https://anthropic-proxy.example.com',
    };
    expect(getBaseUrl(config)).toBe('https://anthropic-proxy.example.com');
  });

  it('returns undefined when no base url override is configured', () => {
    const config: Config = {
      defaultProvider: 'openai',
    };
    expect(getBaseUrl(config)).toBeUndefined();
  });
});
