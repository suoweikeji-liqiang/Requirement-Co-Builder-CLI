import { z } from 'zod';

export const ConfigSchema = z.object({
  defaultProvider: z.enum(['openai', 'anthropic']).default('openai'),
  defaultModel: z.string().optional(),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_MODELS: Record<'openai' | 'anthropic', string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5',
};
