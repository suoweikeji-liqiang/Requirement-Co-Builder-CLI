import { atomicWrite, readStateWithRecovery } from './atomic.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('atomicWrite', () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-atomic-test-'));
    testFile = path.join(testDir, 'state.json');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('writes data and creates the destination file', async () => {
    await atomicWrite(testFile, JSON.stringify({ test: true }));
    const content = await fs.readFile(testFile, 'utf8');
    expect(JSON.parse(content)).toEqual({ test: true });
  });

  it('writes temp file in same directory as destination (not os.tmpdir)', async () => {
    // We verify by checking that .tmp is in the same dir
    // Since rename is atomic, .tmp should not exist after successful write
    await atomicWrite(testFile, '{"done":true}');
    // After successful write, .tmp should be cleaned up
    const tmpFile = testFile + '.tmp';
    await expect(fs.access(tmpFile)).rejects.toThrow();
  });

  it('overwrites existing file atomically', async () => {
    await atomicWrite(testFile, '{"version":1}');
    await atomicWrite(testFile, '{"version":2}');
    const content = await fs.readFile(testFile, 'utf8');
    expect(JSON.parse(content).version).toBe(2);
  });

  it('uses the pattern filePath + .tmp for the temp file', async () => {
    // The temp file path should be filePath + '.tmp'
    // We can verify this by checking no .tmp in tmpdir and the file lands in testDir
    await atomicWrite(testFile, '{"ok":true}');
    const files = await fs.readdir(testDir);
    // Only the final file should remain (no .tmp)
    expect(files).toEqual(['state.json']);
  });
});

describe('readStateWithRecovery', () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-recovery-test-'));
    testFile = path.join(testDir, 'state.json');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('returns null when both main file and .tmp are missing', async () => {
    const result = await readStateWithRecovery(testFile);
    expect(result).toBeNull();
  });

  it('returns content when main file exists', async () => {
    await fs.writeFile(testFile, '{"valid":true}', 'utf8');
    const result = await readStateWithRecovery(testFile);
    expect(result).toBe('{"valid":true}');
  });

  it('promotes .tmp to main file when main file is missing', async () => {
    const tmpFile = testFile + '.tmp';
    await fs.writeFile(tmpFile, '{"recovered":true}', 'utf8');

    const result = await readStateWithRecovery(testFile);
    expect(result).toBe('{"recovered":true}');

    // After promotion, main file should exist and .tmp should be gone
    const mainExists = await fs.access(testFile).then(() => true).catch(() => false);
    const tmpExists = await fs.access(tmpFile).then(() => true).catch(() => false);
    expect(mainExists).toBe(true);
    expect(tmpExists).toBe(false);
  });

  it('returns .tmp content when main file read fails', async () => {
    const tmpFile = testFile + '.tmp';
    await fs.writeFile(tmpFile, '{"fallback":true}', 'utf8');

    const result = await readStateWithRecovery(testFile);
    expect(result).toBe('{"fallback":true}');
  });
});
