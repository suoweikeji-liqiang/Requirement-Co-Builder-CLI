import { z } from 'zod';

/**
 * Schema for a single dialogue message.
 * Keeps fields flat to avoid Zod recursive reference issues.
 */
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Schema for the project state persisted to state.json.
 *
 * clarityStage tracks conversation progress from vague idea to executable spec:
 * - concept: initial vague idea
 * - direction: high-level direction established
 * - structure: structured requirements emerging
 * - executable: ready to export as actionable spec
 */
export const ProjectStateSchema = z.object({
  id: z.string(),
  idea: z.string(),
  clarityStage: z.enum(['concept', 'direction', 'structure', 'executable']),
  messages: z.array(MessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  useLocal: z.boolean(),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;
