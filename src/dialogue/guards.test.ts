import {
  detectAbstractEvaluativeLanguage,
  detectBusinessAssumptions,
  detectModelDominantRhythm,
  enforceStagePolicy,
} from './guards.js';
import { extractLogicChains } from './logic-chain.js';

describe('dialogue safety guards', () => {
  it('flags abstract evaluative language without logic support', () => {
    const issues = detectAbstractEvaluativeLanguage('This is better and optimal for everyone.');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('blocks architecture suggestions before structure stage', () => {
    const result = enforceStagePolicy(
      'concept',
      'Use a microservice architecture with Redis and Kubernetes.',
    );
    expect(result.blocked).toBe(true);
  });

  it('detects model-dominant rhythm from trailing assistant turns', () => {
    const rhythm = detectModelDominantRhythm([
      { role: 'assistant', content: 'A', timestamp: '1' },
      { role: 'assistant', content: 'B', timestamp: '2' },
      { role: 'assistant', content: 'C', timestamp: '3' },
    ]);
    expect(rhythm.isDominant).toBe(true);
  });

  it('extracts logic chains when causal reasoning exists', () => {
    const chains = extractLogicChains('Because users need speed, response times should be under 200ms.');
    expect(chains.length).toBeGreaterThan(0);
  });

  it('detects business assumptions in text', () => {
    const assumptions = detectBusinessAssumptions('Users are willing to pay if setup time is low.');
    expect(assumptions.length).toBeGreaterThan(0);
  });
});
