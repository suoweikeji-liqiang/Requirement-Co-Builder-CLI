import path from 'node:path';
import { atomicWrite, readStateWithRecovery } from './atomic.js';
import { ProjectStateSchema, ProjectState } from './schema.js';

/**
 * Reads and validates project state from projectDir/state.json.
 *
 * - Returns null if the file is missing (uses readStateWithRecovery for crash recovery)
 * - Returns null if the JSON is invalid or Zod schema validation fails
 * - Returns parsed ProjectState on success
 */
export async function readProjectState(projectDir: string): Promise<ProjectState | null> {
  const statePath = path.join(projectDir, 'state.json');
  const raw = await readStateWithRecovery(statePath);

  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const result = ProjectStateSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    // JSON parse error — treat as missing/corrupt
    return null;
  }
}

/**
 * Atomically writes project state to projectDir/state.json.
 *
 * Always updates updatedAt to the current ISO timestamp before writing.
 * Creates a new state object (immutable — original is not mutated).
 */
export async function writeProjectState(projectDir: string, state: ProjectState): Promise<void> {
  const updatedState: ProjectState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  const statePath = path.join(projectDir, 'state.json');
  await atomicWrite(statePath, JSON.stringify(updatedState, null, 2));
}

/**
 * Creates a new ProjectState with default values.
 *
 * Returns a fresh object with:
 * - clarityStage: 'concept' (initial stage)
 * - messages: [] (no conversation history)
 * - createdAt and updatedAt set to current time
 */
export function createInitialState(
  id: string,
  idea: string,
  useLocal: boolean
): ProjectState {
  const now = new Date().toISOString();
  return {
    id,
    idea,
    clarityStage: 'concept',
    messages: [],
    createdAt: now,
    updatedAt: now,
    useLocal,
  };
}
