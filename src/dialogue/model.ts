export type ClarityStage = 'concept' | 'direction' | 'structure' | 'executable';

export interface FiveDimensionProjection {
  context: string;
  actors: string;
  intent: string;
  mechanism: string;
  boundary: string;
}

export function createEmptyProjection(): FiveDimensionProjection {
  return {
    context: '',
    actors: '',
    intent: '',
    mechanism: '',
    boundary: '',
  };
}

export function mergeProjection(
  previous: FiveDimensionProjection,
  next: Partial<FiveDimensionProjection>,
): FiveDimensionProjection {
  return {
    context: next.context ?? previous.context,
    actors: next.actors ?? previous.actors,
    intent: next.intent ?? previous.intent,
    mechanism: next.mechanism ?? previous.mechanism,
    boundary: next.boundary ?? previous.boundary,
  };
}

function countFilledDimensions(projection: FiveDimensionProjection): number {
  return Object.values(projection).filter((value) => value.trim().length > 0).length;
}

export function nextClarityStage(
  current: ClarityStage,
  projection: FiveDimensionProjection,
): ClarityStage {
  const filled = countFilledDimensions(projection);

  if (current === 'concept' && filled >= 2) {
    return 'direction';
  }
  if (current === 'direction' && filled >= 4) {
    return 'structure';
  }
  if (current === 'structure' && filled >= 5) {
    return 'executable';
  }
  return current;
}

export function projectFromTurn(
  previous: FiveDimensionProjection,
  userInput: string,
): FiveDimensionProjection {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return previous;
  }

  const segments = trimmed
    .split(/[。！？.!?]/)
    .map((value) => value.trim())
    .filter(Boolean);

  const next = { ...previous };
  const keys: Array<keyof FiveDimensionProjection> = [
    'context',
    'actors',
    'intent',
    'mechanism',
    'boundary',
  ];

  for (let index = 0; index < keys.length && index < segments.length; index++) {
    const key = keys[index];
    if (!next[key]) {
      next[key] = segments[index];
    }
  }

  return next;
}
