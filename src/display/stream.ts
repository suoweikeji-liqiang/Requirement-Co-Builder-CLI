import chalk from 'chalk';
import type { LLMAdapter, Message } from '../adapters/llm.js';

export interface StreamOptions {
  gutterChar?: string;
  separatorChar?: string;
  separatorWidth?: number;
}

let warnedWindowsEncoding = false;

export async function streamResponse(
  adapter: LLMAdapter,
  messages: Message[],
  options: StreamOptions = {},
): Promise<string> {
  const opts = {
    gutterChar: '│',
    separatorChar: '─',
    separatorWidth: 60,
    ...options,
  };

  const encoding = (process.stdout as NodeJS.WriteStream & { encoding?: string }).encoding
    ?.toLowerCase();
  if (
    !warnedWindowsEncoding &&
    process.platform === 'win32' &&
    encoding &&
    encoding !== 'utf8' &&
    encoding !== 'utf-8'
  ) {
    process.stderr.write(
      '[warning] Non-UTF-8 stdout encoding detected. Use Windows Terminal with UTF-8 for best rendering.\n',
    );
    warnedWindowsEncoding = true;
  }

  process.stdout.write(chalk.dim(`${opts.gutterChar} `));

  try {
    const fullText = await adapter.streamText(messages, (delta) => process.stdout.write(delta));
    process.stdout.write(`\n${chalk.dim(opts.separatorChar.repeat(opts.separatorWidth))}\n`);
    return fullText;
  } catch (err) {
    process.stdout.write(
      chalk.yellow('\n[Stream interrupted. Use `req chat <id>` to retry the last round.]'),
    );
    throw err;
  }
}
