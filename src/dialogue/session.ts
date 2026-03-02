import readline from 'node:readline/promises';
import { getProjectDir } from '../utils/paths.js';
import { writeProjectState } from '../state/index.js';
import type { ProjectState } from '../state/schema.js';
import { openProject } from '../projects/index.js';
import { appendRoundToState, executeRound } from './engine.js';
import { formatLogicBaseBlock } from './render.js';
import { buildTriggeredExplanation } from './explain.js';
import { syncRoundArtifacts } from '../output/artifacts.js';

export async function syncSessionArtifacts(
  projectDir: string,
  state: ProjectState,
  userInput: string,
  assistantText: string,
): Promise<void> {
  await syncRoundArtifacts(projectDir, { state, userInput, assistantText });
}

export async function startChatSession(projectId: string, useLocal: boolean): Promise<void> {
  const projectDir = getProjectDir(projectId, useLocal);
  let state = await openProject(projectId, useLocal);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  process.stdout.write(`Resuming ${projectId}. Type /exit to quit.\n`);

  try {
    while (true) {
      const input = (await rl.question('you> ')).trim();
      if (!input) {
        continue;
      }
      if (input === '/exit' || input === '/quit') {
        process.stdout.write('Session ended.\n');
        break;
      }

      const result = await executeRound(state, input);
      state = appendRoundToState(state, { userInput: input, ...result });
      await writeProjectState(projectDir, state);
      await syncSessionArtifacts(projectDir, state, input, result.assistantText);

      process.stdout.write(`assistant> ${result.assistantText}\n`);
      process.stdout.write(formatLogicBaseBlock(result.logicBase) + '\n');
      process.stdout.write(`ONE_LINER: ${result.compression.oneLiner}\n`);
      process.stdout.write(`THREE_LINER:\n${result.compression.threeLiner}\n`);
      process.stdout.write(`STRUCTURED:\n${result.compression.structured}\n`);
      if (result.logicChains.length > 0) {
        process.stdout.write(result.logicChainBlock + '\n');
      }
      if (result.businessAssumptionBlock) {
        process.stdout.write(result.businessAssumptionBlock + '\n');
      }
      if (result.guardWarnings.length > 0) {
        process.stdout.write(`GUARD_WARNINGS:\n- ${result.guardWarnings.join('\n- ')}\n`);
      }
      const explanation = buildTriggeredExplanation(input, result.assistantText);
      if (explanation) {
        process.stdout.write(`${explanation}\n`);
      }
    }
  } finally {
    rl.close();
  }
}
