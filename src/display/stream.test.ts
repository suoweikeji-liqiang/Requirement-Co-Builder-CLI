import type { LLMAdapter, Message } from '../adapters/llm.js';
import { streamResponse } from './stream.js';

describe('streamResponse', () => {
  const messages: Message[] = [{ role: 'user', content: 'test' }];

  it('writes gutter, streams tokens, writes separator, and returns full text', async () => {
    const writes: string[] = [];
    const stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: any) => {
        writes.push(String(chunk));
        return true;
      });

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
    expect(writes.join('')).toContain('| ');
    expect(writes.join('')).toContain('Hello world!');
    expect(writes.join('')).toContain('\n-----\n');

    stdoutSpy.mockRestore();
  });

  it('prints interruption hint and rethrows on stream error', async () => {
    const writes: string[] = [];
    const stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: any) => {
        writes.push(String(chunk));
        return true;
      });

    const adapter: LLMAdapter = {
      async streamText() {
        throw new Error('boom');
      },
      async generateStructured() {
        return {} as any;
      },
    };

    await expect(streamResponse(adapter, messages)).rejects.toThrow('boom');
    expect(writes.join('')).toContain('[Stream interrupted. Use `req chat <id>` to retry the last round.]');

    stdoutSpy.mockRestore();
  });
});
