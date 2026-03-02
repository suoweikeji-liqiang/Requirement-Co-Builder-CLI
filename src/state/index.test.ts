import { readProjectState, writeProjectState, createInitialState } from './index.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('createInitialState', () => {
  it('returns a valid ProjectState with clarityStage=concept', () => {
    const state = createInitialState('test-id', 'Test idea', false);
    expect(state.clarityStage).toBe('concept');
    expect(state.messages).toEqual([]);
    expect(state.id).toBe('test-id');
    expect(state.idea).toBe('Test idea');
    expect(state.useLocal).toBe(false);
  });

  it('sets valid ISO timestamps', () => {
    const state = createInitialState('test-id', 'Test idea', false);
    expect(() => new Date(state.createdAt)).not.toThrow();
    expect(() => new Date(state.updatedAt)).not.toThrow();
    expect(new Date(state.createdAt).getFullYear()).toBeGreaterThan(2020);
  });

  it('creates new objects (immutability — not reusing a shared state)', () => {
    const state1 = createInitialState('id1', 'idea1', false);
    const state2 = createInitialState('id2', 'idea2', true);
    expect(state1).not.toBe(state2);
    expect(state1.messages).not.toBe(state2.messages);
  });
});

describe('readProjectState', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-state-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('returns null for missing state.json', async () => {
    const result = await readProjectState(testDir);
    expect(result).toBeNull();
  });

  it('returns parsed state for a valid state.json', async () => {
    const state = createInitialState('test-id', 'Test idea', false);
    await fs.writeFile(
      path.join(testDir, 'state.json'),
      JSON.stringify(state),
      'utf8'
    );
    const result = await readProjectState(testDir);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('test-id');
    expect(result!.clarityStage).toBe('concept');
  });

  it('returns null for corrupt state.json (Zod validation failure)', async () => {
    await fs.writeFile(
      path.join(testDir, 'state.json'),
      JSON.stringify({ corrupt: true }),
      'utf8'
    );
    const result = await readProjectState(testDir);
    expect(result).toBeNull();
  });

  it('returns null for invalid JSON in state.json', async () => {
    await fs.writeFile(
      path.join(testDir, 'state.json'),
      'not valid json',
      'utf8'
    );
    const result = await readProjectState(testDir);
    expect(result).toBeNull();
  });
});

describe('writeProjectState', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reqgen-write-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('writes state to state.json', async () => {
    const state = createInitialState('write-id', 'Write test', false);
    await writeProjectState(testDir, state);
    const raw = await fs.readFile(path.join(testDir, 'state.json'), 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.id).toBe('write-id');
  });

  it('updates updatedAt timestamp on write', async () => {
    const state = createInitialState('ts-id', 'Timestamp test', false);
    const originalUpdatedAt = state.updatedAt;
    // Small delay to ensure timestamp differs
    await new Promise(resolve => setTimeout(resolve, 10));
    await writeProjectState(testDir, state);
    const result = await readProjectState(testDir);
    expect(result!.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('does not mutate the original state object (immutable pattern)', async () => {
    const state = createInitialState('immutable-id', 'Immutability test', false);
    const originalUpdatedAt = state.updatedAt;
    await writeProjectState(testDir, state);
    // Original object must not have been mutated
    expect(state.updatedAt).toBe(originalUpdatedAt);
  });

  it('can roundtrip: write then read returns equivalent state', async () => {
    const state = createInitialState('roundtrip-id', 'Roundtrip test', false);
    await writeProjectState(testDir, state);
    const result = await readProjectState(testDir);
    expect(result!.id).toBe(state.id);
    expect(result!.idea).toBe(state.idea);
    expect(result!.clarityStage).toBe(state.clarityStage);
    expect(result!.messages).toEqual(state.messages);
  });
});
