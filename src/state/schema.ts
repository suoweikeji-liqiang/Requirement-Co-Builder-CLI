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

export const ProjectionSchema = z.object({
  context: z.string(),
  actors: z.string(),
  intent: z.string(),
  mechanism: z.string(),
  boundary: z.string(),
});

export type Projection = z.infer<typeof ProjectionSchema>;

export const LogicPremiseSchema = z.object({
  premise: z.string(),
  source: z.enum(['user', 'assistant', 'inference']),
});

export const CompressionSchema = z.object({
  oneLiner: z.string(),
  threeLiner: z.string(),
  structured: z.string(),
});

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
  projection: ProjectionSchema.optional(),
  lastLogicBase: z.array(LogicPremiseSchema).optional(),
  lastCompression: CompressionSchema.optional(),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;
