import { z } from 'zod';
import { ProjectStateSchema } from '../state/schema.js';

export const ProjectListItemSchema = z.object({
  id: z.string(),
  idea: z.string(),
  clarityStage: ProjectStateSchema.shape.clarityStage,
  updatedAt: z.string(),
  projectDir: z.string(),
});

export type ProjectListItem = z.infer<typeof ProjectListItemSchema>;

export const CreatedProjectSchema = z.object({
  id: z.string(),
  projectDir: z.string(),
  state: ProjectStateSchema,
});

export type CreatedProject = z.infer<typeof CreatedProjectSchema>;
