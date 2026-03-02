import {
  createEmptyProjection,
  nextClarityStage,
  type FiveDimensionProjection,
} from './model.js';
import { buildCompression, buildLogicBase, enforceSingleQuestion } from './render.js';

describe('dialogue domain model', () => {
  it('progresses stage deterministically based on projection completeness', () => {
    const p1: FiveDimensionProjection = {
      context: 'ctx',
      actors: 'actors',
      intent: '',
      mechanism: '',
      boundary: '',
    };
    expect(nextClarityStage('concept', p1)).toBe('direction');

    const p2: FiveDimensionProjection = {
      context: 'ctx',
      actors: 'actors',
      intent: 'intent',
      mechanism: 'mech',
      boundary: '',
    };
    expect(nextClarityStage('direction', p2)).toBe('structure');
  });

  it('creates an empty projection with all five dimensions', () => {
    expect(createEmptyProjection()).toEqual({
      context: '',
      actors: '',
      intent: '',
      mechanism: '',
      boundary: '',
    });
  });
});

describe('dialogue rendering helpers', () => {
  it('builds compression outputs', () => {
    const compression = buildCompression(
      'First sentence. Second sentence. Third sentence. Fourth sentence.',
    );
    expect(compression.oneLiner.length).toBeGreaterThan(0);
    expect(compression.threeLiner.split('\n').length).toBe(3);
    expect(compression.structured.includes('"oneLiner"')).toBe(true);
  });

  it('builds LOGIC_BASE entries with source tags', () => {
    const logicBase = buildLogicBase('User wants a tool', 'We should define workflow');
    expect(logicBase.length).toBeGreaterThan(0);
    expect(logicBase[0].source).toBeDefined();
  });

  it('enforces exactly one question in assistant output', () => {
    const normalized = enforceSingleQuestion('What is your goal? What constraints matter?');
    const count = (normalized.match(/\?/g) ?? []).length;
    expect(count).toBe(1);
  });
});
