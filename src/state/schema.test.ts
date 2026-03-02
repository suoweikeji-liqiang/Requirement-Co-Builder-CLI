import { ProjectStateSchema, MessageSchema } from './schema.js';

describe('MessageSchema', () => {
  it('validates a valid message', () => {
    const msg = {
      role: 'user',
      content: 'Hello',
      timestamp: '2026-03-02T00:00:00.000Z',
    };
    const result = MessageSchema.safeParse(msg);
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const msg = {
      role: 'invalid',
      content: 'Hello',
      timestamp: '2026-03-02T00:00:00.000Z',
    };
    const result = MessageSchema.safeParse(msg);
    expect(result.success).toBe(false);
  });

  it('accepts all valid roles', () => {
    for (const role of ['user', 'assistant', 'system']) {
      const result = MessageSchema.safeParse({ role, content: 'text', timestamp: 'now' });
      expect(result.success).toBe(true);
    }
  });
});

describe('ProjectStateSchema', () => {
  const validState = {
    id: 'a3f2-build-a-cli-tool',
    idea: 'Build a CLI tool',
    clarityStage: 'concept',
    messages: [],
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
    useLocal: false,
  };

  it('validates a valid project state', () => {
    const result = ProjectStateSchema.safeParse(validState);
    expect(result.success).toBe(true);
  });

  it('rejects invalid clarityStage', () => {
    const result = ProjectStateSchema.safeParse({
      ...validState,
      clarityStage: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid clarityStage values', () => {
    for (const stage of ['concept', 'direction', 'structure', 'executable']) {
      const result = ProjectStateSchema.safeParse({ ...validState, clarityStage: stage });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing required fields', () => {
    const { id, ...withoutId } = validState;
    const result = ProjectStateSchema.safeParse(withoutId);
    expect(result.success).toBe(false);
  });

  it('rejects invalid useLocal type', () => {
    const result = ProjectStateSchema.safeParse({
      ...validState,
      useLocal: 'true',
    });
    expect(result.success).toBe(false);
  });

  it('validates state with messages', () => {
    const withMessages = {
      ...validState,
      messages: [
        { role: 'user', content: 'My idea', timestamp: '2026-03-02T00:00:00.000Z' },
        { role: 'assistant', content: 'Tell me more', timestamp: '2026-03-02T00:01:00.000Z' },
      ],
    };
    const result = ProjectStateSchema.safeParse(withMessages);
    expect(result.success).toBe(true);
  });
});
