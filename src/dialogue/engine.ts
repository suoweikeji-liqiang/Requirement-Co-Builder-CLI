import type { Message as AdapterMessage } from '../adapters/llm.js';
import { createLLMAdapter } from '../adapters/llm.js';
import { loadConfig, getApiKey, getModel } from '../config/index.js';
import { streamResponse } from '../display/stream.js';
import type { ProjectState } from '../state/schema.js';
import type { ClarityStage, FiveDimensionProjection } from './model.js';
import { createEmptyProjection, nextClarityStage, projectFromTurn } from './model.js';
import { buildSystemPrompt, buildUserPrompt } from './prompts.js';
import type { CompressionOutput, LogicPremise } from './render.js';
import { buildCompression, buildLogicBase, enforceSingleQuestion } from './render.js';
import {
  detectAbstractEvaluativeLanguage,
  detectBusinessAssumptions,
  detectModelDominantRhythm,
  enforceStagePolicy,
} from './guards.js';
import {
  extractLogicChains,
  formatBusinessAssumptionBlock,
  formatLogicChainBlock,
  type LogicChain,
} from './logic-chain.js';

export interface RoundResult {
  assistantText: string;
  projection: FiveDimensionProjection;
  clarityStage: ClarityStage;
  logicBase: LogicPremise[];
  compression: CompressionOutput;
  guardWarnings: string[];
  logicChains: LogicChain[];
  businessAssumptions: string[];
  logicChainBlock: string;
  businessAssumptionBlock: string;
}

export interface AppendRoundInput extends RoundResult {
  userInput: string;
}

export interface ExecuteRoundOptions {
  respond?: (messages: AdapterMessage[]) => Promise<string>;
}

function toAdapterMessages(state: ProjectState, userInput: string): AdapterMessage[] {
  const projection = state.projection ?? createEmptyProjection();
  const system = buildSystemPrompt(state.clarityStage);
  const userPrompt = buildUserPrompt(state.idea, userInput, projection);

  const history: AdapterMessage[] = state.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  return [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: userPrompt },
  ];
}

async function defaultRespond(messages: AdapterMessage[]): Promise<string> {
  const config = await loadConfig();
  const provider = config.defaultProvider;
  const apiKey = getApiKey(config);
  const model = getModel(config);
  const adapter = createLLMAdapter(provider, apiKey, model);
  return streamResponse(adapter, messages);
}

export async function executeRound(
  state: ProjectState,
  userInput: string,
  options: ExecuteRoundOptions = {},
): Promise<RoundResult> {
  const messages = toAdapterMessages(state, userInput);
  const respond = options.respond ?? defaultRespond;
  const assistantRaw = await respond(messages);
  let assistantText = enforceSingleQuestion(assistantRaw);

  const policy = enforceStagePolicy(state.clarityStage, assistantText);
  assistantText = policy.sanitized;

  const guardWarnings = detectAbstractEvaluativeLanguage(assistantText);
  if (policy.blocked && policy.reason) {
    guardWarnings.push(policy.reason);
  }

  const rhythm = detectModelDominantRhythm(state.messages);
  if (rhythm.isDominant) {
    guardWarnings.push(
      `Model-dominant rhythm detected (${rhythm.consecutiveAssistantTurns} consecutive assistant turns).`,
    );
  }

  const previousProjection = state.projection ?? createEmptyProjection();
  const projection = projectFromTurn(previousProjection, userInput);
  const clarityStage = nextClarityStage(state.clarityStage, projection);
  const logicBase = buildLogicBase(userInput, assistantText);
  const compression = buildCompression(assistantText);
  const logicChains = extractLogicChains(assistantText);
  const businessAssumptions = detectBusinessAssumptions(assistantText);
  const logicChainBlock = formatLogicChainBlock(logicChains);
  const businessAssumptionBlock = formatBusinessAssumptionBlock(businessAssumptions);

  return {
    assistantText,
    projection,
    clarityStage,
    logicBase,
    compression,
    guardWarnings,
    logicChains,
    businessAssumptions,
    logicChainBlock,
    businessAssumptionBlock,
  };
}

export function appendRoundToState(state: ProjectState, input: AppendRoundInput): ProjectState {
  const timestamp = new Date().toISOString();
  return {
    ...state,
    clarityStage: input.clarityStage,
    projection: input.projection,
    lastLogicBase: input.logicBase,
    lastCompression: input.compression,
    lastGuardWarnings: input.guardWarnings,
    lastBusinessAssumptions: input.businessAssumptions,
    lastLogicChainBlock: input.logicChainBlock,
    lastBusinessAssumptionBlock: input.businessAssumptionBlock,
    messages: [
      ...state.messages,
      { role: 'user', content: input.userInput, timestamp },
      { role: 'assistant', content: input.assistantText, timestamp },
    ],
  };
}
