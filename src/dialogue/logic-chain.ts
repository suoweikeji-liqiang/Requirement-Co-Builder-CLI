export interface LogicChain {
  cause: string;
  effect: string;
  assumption?: string;
}

export function extractLogicChains(text: string): LogicChain[] {
  const chains: LogicChain[] = [];
  const sentences = text
    .split(/[。！？.!?]/)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const becauseMatch = sentence.match(/^(.*)\bbecause\b(.*)$/i);
    if (becauseMatch) {
      const effect = becauseMatch[1].trim();
      const cause = becauseMatch[2].trim();
      chains.push({
        cause,
        effect,
        assumption: 'Causal relation inferred from "because".',
      });
      continue;
    }

    const ifThenMatch = sentence.match(/^if\s+(.*)\s+then\s+(.*)$/i);
    if (ifThenMatch) {
      chains.push({
        cause: ifThenMatch[1].trim(),
        effect: ifThenMatch[2].trim(),
        assumption: 'Conditional relation inferred from "if...then".',
      });
    }
  }

  return chains;
}

export function formatLogicChainBlock(chains: LogicChain[]): string {
  if (chains.length === 0) {
    return 'LOGIC_CHAIN:\n- (none)';
  }

  const lines = chains.map((chain) => {
    const assumption = chain.assumption ? ` | ASSUMPTION: ${chain.assumption}` : '';
    return `- CAUSE: ${chain.cause} | EFFECT: ${chain.effect}${assumption}`;
  });

  return `LOGIC_CHAIN:\n${lines.join('\n')}`;
}

export function formatBusinessAssumptionBlock(assumptions: string[]): string {
  if (assumptions.length === 0) {
    return '';
  }

  return `BUSINESS_ASSUMPTION:\n${assumptions.map((item) => `- ${item}`).join('\n')}`;
}
