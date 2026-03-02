import { streamText as sdkStreamText, generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { jsonrepair } from 'jsonrepair';
import type { LanguageModel, CoreMessage } from 'ai';
import type { z } from 'zod';
import { formatError } from '../display/errors.js';

export type Provider = 'openai' | 'anthropic';

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface LLMAdapter {
  streamText(messages: Message[], onToken: (token: string) => void): Promise<string>;
  generateStructured<T>(messages: Message[], schema: z.ZodSchema<T>): Promise<T>;
}

/**
 * Creates an LLM adapter for the given provider.
 *
 * CRITICAL: API keys are always passed explicitly — the adapter NEVER reads
 * OPENAI_API_KEY or ANTHROPIC_API_KEY from environment variables.
 */
export function createLLMAdapter(
  provider: Provider,
  apiKey: string,
  modelId: string,
  baseURL?: string,
): LLMAdapter {
  let model: LanguageModel;

  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey, baseURL });
    model = openai(modelId);
  } else if (provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey, baseURL });
    model = anthropic(modelId);
  } else {
    throw new Error(`Unknown provider: ${provider}. Supported: openai, anthropic`);
  }

  return {
    async streamText(messages: Message[], onToken: (token: string) => void): Promise<string> {
      try {
        const result = await sdkStreamText({
          model,
          messages: messages as CoreMessage[],
        });

        let fullText = '';
        for await (const delta of result.textStream) {
          fullText += delta;
          onToken(delta);
        }
        return fullText;
      } catch (err) {
        throw new Error('LLM streaming failed: ' + formatError(err));
      }
    },

    async generateStructured<T>(messages: Message[], schema: z.ZodSchema<T>): Promise<T> {
      // Primary: use Output.object for structured output
      try {
        const result = await generateText({
          model,
          messages: messages as CoreMessage[],
          experimental_output: Output.object({ schema }),
        });
        return result.experimental_output as T;
      } catch (_primaryErr) {
        // Fallback: get raw text, strip fenced blocks, apply jsonrepair, validate with Zod
        const rawResult = await generateText({
          model,
          messages: messages as CoreMessage[],
        });

        const rawText = rawResult.text;
        // Strip fenced code block wrappers (```json...``` or ```...```)
        const stripped = rawText.replace(/```(?:json)?\n?([\s\S]*?)```/g, '$1').trim();
        const repaired = jsonrepair(stripped);
        const parsed = JSON.parse(repaired) as unknown;

        try {
          return schema.parse(parsed);
        } catch (_parseErr) {
          throw new Error('LLM returned unparseable response after fallback attempt');
        }
      }
    },
  };
}
