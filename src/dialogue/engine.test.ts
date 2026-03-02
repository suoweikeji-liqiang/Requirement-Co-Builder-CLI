import {
  createEmptyProjection,
  nextClarityStage,
  type FiveDimensionProjection,
} from './model.js';
import { buildCompression, buildLogicBase, enforceSingleQuestion } from './render.js';
import { appendRoundToState, executeRound } from './engine.js';
import { createInitialState } from '../state/index.js';

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

describe('dialogue engine round execution', () => {
  it('executes round with one-question enforcement and compression', async () => {
    const state = createInitialState('proj-1', 'Build a requirements tool', true);
    const result = await executeRound(state, 'I need clearer specs', {
      respond: async () => 'I understand your need. What should we clarify first? Any deadline?',
    });

    expect((result.assistantText.match(/\?/g) ?? []).length).toBe(1);
    expect(result.compression.oneLiner.length).toBeGreaterThan(0);
    expect(result.logicBase.length).toBeGreaterThan(0);
  });

  it('appends user and assistant messages and updates stage/projection in state', () => {
    const state = createInitialState('proj-2', 'Plan my CLI', true);
    const updated = appendRoundToState(state, {
      userInput: 'Need a command layout',
      assistantText: 'Understood. Which command is most critical?',
      projection: {
        context: 'CLI planning',
        actors: 'developer',
        intent: 'define commands',
        mechanism: '',
        boundary: '',
      },
      clarityStage: 'direction',
      logicBase: [],
      compression: {
        oneLiner: 'Define the core command first.',
        threeLiner: 'Define scope.\nPick one command.\nRefine details.',
        structured: '{"oneLiner":"Define the core command first."}',
      },
    });

    expect(updated.messages.length).toBe(2);
    expect(updated.clarityStage).toBe('direction');
    expect(updated.projection?.actors).toBe('developer');
  });
});
