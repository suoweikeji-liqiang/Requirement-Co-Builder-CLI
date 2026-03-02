import {
  buildTriggeredExplanation,
  parseExplainDirective,
  type ExplainTrigger,
} from './explain.js';

const TRIGGERS: ExplainTrigger[] = ['/explain', '/deep-dive', '/later'];

describe('explanation triggers', () => {
  it.each(TRIGGERS)('parses %s slash trigger', (trigger) => {
    const parsed = parseExplainDirective(`${trigger} clarify the tradeoffs`);
    expect(parsed).toEqual({
      trigger,
      remainder: 'clarify the tradeoffs',
    });
  });

  it('returns null when no trigger is present', () => {
    expect(parseExplainDirective('clarify the tradeoffs')).toBeNull();
  });
});

describe('trigger-gated explanation output', () => {
  it('returns null without trigger', () => {
    const explanation = buildTriggeredExplanation(
      'Can we continue with requirements?',
      'Sure. We should clarify scope first.',
    );
    expect(explanation).toBeNull();
  });

  it('caps explanation to three sentences and includes confidence tag', () => {
    const explanation = buildTriggeredExplanation(
      '/explain',
      'First point. Second point! Third point? Fourth point.',
    );

    expect(explanation).not.toBeNull();
    expect(explanation).toContain('confidence:');
    const sentenceCount = (explanation ?? '').match(/[.!?](?=\s|$)/g)?.length ?? 0;
    expect(sentenceCount).toBeLessThanOrEqual(3);
  });
});
