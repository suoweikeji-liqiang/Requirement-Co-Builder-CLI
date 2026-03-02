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

export interface RoundResult {
  assistantText: string;
  projection: FiveDimensionProjection;
  clarityStage: ClarityStage;
  logicBase: LogicPremise[];
  compression: CompressionOutput;
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
  const assistantText = enforceSingleQuestion(assistantRaw);

  const previousProjection = state.projection ?? createEmptyProjection();
  const projection = projectFromTurn(previousProjection, userInput);
  const clarityStage = nextClarityStage(state.clarityStage, projection);
  const logicBase = buildLogicBase(userInput, assistantText);
  const compression = buildCompression(assistantText);

  return {
    assistantText,
    projection,
    clarityStage,
    logicBase,
    compression,
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
    messages: [
      ...state.messages,
      { role: 'user', content: input.userInput, timestamp },
      { role: 'assistant', content: input.assistantText, timestamp },
    ],
  };
}
