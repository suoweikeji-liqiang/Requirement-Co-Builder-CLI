import chalk from 'chalk';

/**
 * Formats an error value into a user-friendly string.
 *
 * - Error instances: returns the message only (no stack trace)
 * - Strings: returned as-is
 * - All other types: returns a generic fallback message
 *
 * Never exposes stack traces or internal implementation details to users.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return 'An unexpected error occurred';
}

/**
 * Prints a user-facing error message to stderr.
 *
 * Uses chalk.red for visibility. Always writes to stderr to keep
 * stdout clean for piping and scripting.
 */
export function printError(err: unknown): void {
  process.stderr.write(chalk.red('Error: ' + formatError(err)) + '\n');
}
