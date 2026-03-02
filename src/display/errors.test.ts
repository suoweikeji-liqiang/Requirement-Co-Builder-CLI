import { formatError, printError } from './errors.js';

describe('formatError', () => {
  it('returns error message for Error instances', () => {
    const err = new Error('something went wrong');
    expect(formatError(err)).toBe('something went wrong');
  });

  it('returns string directly for string errors', () => {
    expect(formatError('a string error')).toBe('a string error');
  });

  it('returns generic message for unknown error types', () => {
    expect(formatError(42)).toBe('An unexpected error occurred');
    expect(formatError(null)).toBe('An unexpected error occurred');
    expect(formatError(undefined)).toBe('An unexpected error occurred');
    expect(formatError({ code: 'ERR' })).toBe('An unexpected error occurred');
  });

  it('never returns stack traces', () => {
    const err = new Error('test error');
    const result = formatError(err);
    expect(result).not.toContain('at ');
    expect(result).not.toContain('Error:');
  });

  it('does not expose internal Error properties beyond message', () => {
    const err = new Error('simple message');
    const result = formatError(err);
    expect(result).toBe('simple message');
    expect(result.length).toBeLessThan(100);
  });
});

describe('printError', () => {
  let stderrOutput: string;
  let originalWrite: typeof process.stderr.write;

  beforeEach(() => {
    stderrOutput = '';
    originalWrite = process.stderr.write.bind(process.stderr);
    // Capture stderr writes
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderrOutput += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    };
  });

  afterEach(() => {
    process.stderr.write = originalWrite;
  });

  it('writes to stderr (not stdout)', () => {
    let stdoutCalled = false;
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array) => {
      stdoutCalled = true;
      return originalStdoutWrite(chunk);
    };

    printError(new Error('stderr test'));

    process.stdout.write = originalStdoutWrite;
    expect(stdoutCalled).toBe(false);
    expect(stderrOutput).toContain('stderr test');
  });

  it('includes "Error:" prefix in output', () => {
    printError(new Error('test error'));
    expect(stderrOutput).toContain('Error:');
  });

  it('includes the error message in stderr output', () => {
    printError(new Error('specific message'));
    expect(stderrOutput).toContain('specific message');
  });
});
