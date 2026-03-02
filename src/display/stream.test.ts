import type { LLMAdapter, Message } from '../adapters/llm.js';
import { streamResponse } from './stream.js';

describe('streamResponse', () => {
  const messages: Message[] = [{ role: 'user', content: 'test' }];
  let stdoutOutput: string;
  let stderrOutput: string;
  let originalStdoutWrite: typeof process.stdout.write;
  let originalStderrWrite: typeof process.stderr.write;

  beforeEach(() => {
    stdoutOutput = '';
    stderrOutput = '';
    originalStdoutWrite = process.stdout.write.bind(process.stdout);
    originalStderrWrite = process.stderr.write.bind(process.stderr);
    process.stdout.write = (chunk: string | Uint8Array) => {
      stdoutOutput += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    };
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    };
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });

  it('writes gutter, streams tokens, writes separator, and returns full text', async () => {
    const adapter: LLMAdapter = {
      async streamText(_messages, onToken) {
        onToken('Hello');
        onToken(' world');
        onToken('!');
        return 'Hello world!';
      },
      async generateStructured() {
        return {} as any;
      },
    };

    const result = await streamResponse(adapter, messages, {
      gutterChar: '|',
      separatorChar: '-',
      separatorWidth: 5,
    });

    expect(result).toBe('Hello world!');
    expect(stdoutOutput).toContain('| ');
    expect(stdoutOutput).toContain('Hello world!');
    expect(stdoutOutput).toContain('\n-----\n');
    expect(stderrOutput).toBe('');
  });

  it('prints interruption hint and rethrows on stream error', async () => {
    const adapter: LLMAdapter = {
      async streamText() {
        throw new Error('boom');
      },
      async generateStructured() {
        return {} as any;
      },
    };

    await expect(streamResponse(adapter, messages)).rejects.toThrow('boom');
    expect(stdoutOutput).toContain('[Stream interrupted. Use `req chat <id>` to retry the last round.]');
  });
});
