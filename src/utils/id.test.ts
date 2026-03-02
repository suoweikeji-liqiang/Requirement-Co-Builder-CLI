import { generateProjectId } from './id.js';

describe('generateProjectId', () => {
  it('returns a string matching /^[0-9a-f]{4}-[a-z0-9-]+$/', () => {
    const id = generateProjectId('Build a CLI tool');
    expect(id).toMatch(/^[0-9a-f]{4}-[a-z0-9-]+$/);
  });

  it('produces a 4-char hex hash prefix', () => {
    const id = generateProjectId('some idea');
    const parts = id.split('-');
    expect(parts[0]).toMatch(/^[0-9a-f]{4}$/);
  });

  it('slugifies the idea into the suffix', () => {
    const id = generateProjectId('Build a CLI tool');
    // Should contain recognizable words from the idea
    expect(id).toContain('build');
    expect(id).toContain('cli');
  });

  it('takes at most 5 words in the slug', () => {
    const id = generateProjectId('one two three four five six seven eight');
    const slugPart = id.substring(5); // after "xxxx-"
    const wordCount = slugPart.split('-').length;
    expect(wordCount).toBeLessThanOrEqual(5);
  });

  it('handles Chinese-only ideas without crashing (fallback slug)', () => {
    const id = generateProjectId('构建一个命令行工具');
    // Should not crash; hash-xxxx should still appear
    expect(id).toMatch(/^[0-9a-f]{4}-/);
    // Fallback slug is 'project' when all chars are stripped
    expect(id).toContain('project');
  });

  it('strips special characters from slug', () => {
    const id = generateProjectId('Hello, World! @2026');
    expect(id).not.toContain(',');
    expect(id).not.toContain('!');
    expect(id).not.toContain('@');
  });

  it('produces unique IDs for same idea (due to Date.now() salt)', async () => {
    const id1 = generateProjectId('same idea');
    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 2));
    const id2 = generateProjectId('same idea');
    // Hashes should differ because Date.now() differs
    const hash1 = id1.split('-')[0];
    const hash2 = id2.split('-')[0];
    expect(hash1).not.toBe(hash2);
  });

  it('returns just hash-project for empty string idea', () => {
    const id = generateProjectId('');
    expect(id).toMatch(/^[0-9a-f]{4}-project$/);
  });
});
