#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig, saveConfig } from '../config/index.js';
import { createProject, deleteProject, listProjects, openProject } from '../projects/index.js';
import { snapshotProject } from '../projects/snapshot.js';
import { pathToFileURL } from 'node:url';
import { startChatSession } from '../dialogue/session.js';

const VALID_PROVIDERS = ['openai', 'anthropic'] as const;
type Provider = typeof VALID_PROVIDERS[number];

function isValidProvider(value: string): value is Provider {
  return VALID_PROVIDERS.includes(value as Provider);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toISOString();
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('req')
    .description('Requirement Co-Builder CLI')
    .version('0.1.0')
    .option('--local', 'use current directory for project storage instead of ~/.reqgen/');

  const configCmd = program.command('config').description('Manage configuration settings');

  configCmd
    .command('set-key <provider> <key>')
    .description('Set API key for a provider (openai or anthropic)')
    .action(async (provider: string, key: string) => {
      if (!isValidProvider(provider)) {
        console.error(`Error: Invalid provider "${provider}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
        process.exit(1);
      }

      const config = await loadConfig();
      const keyField = `${provider}Key` as 'openaiKey' | 'anthropicKey';
      const updated = { ...config, [keyField]: key };
      await saveConfig(updated);
      console.log(`API key for ${provider} saved.`);
    });

  configCmd
    .command('set-provider <provider>')
    .description('Set the default LLM provider (openai or anthropic)')
    .action(async (provider: string) => {
      if (!isValidProvider(provider)) {
        console.error(`Error: Invalid provider "${provider}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
        process.exit(1);
      }

      const config = await loadConfig();
      const updated = { ...config, defaultProvider: provider };
      await saveConfig(updated);
      console.log(`Default provider set to ${provider}.`);
    });

  program
    .command('new <idea>')
    .description('Create a new project from an idea')
    .action(async function (idea: string) {
      const useLocal = this.optsWithGlobals().local === true;
      const created = await createProject(idea, useLocal);
      console.log(`Created project: ${created.id}`);
      console.log(`Path: ${created.projectDir}`);
    });

  program
    .command('list')
    .description('List projects with stage and last updated')
    .action(async function () {
      const useLocal = this.optsWithGlobals().local === true;
      const projects = await listProjects(useLocal);

      if (projects.length === 0) {
        console.log('No projects found.');
        return;
      }

      console.log('ID'.padEnd(24) + 'Stage'.padEnd(14) + 'Updated At');
      console.log('-'.repeat(70));
      for (const project of projects) {
        console.log(
          project.id.padEnd(24) +
            project.clarityStage.padEnd(14) +
            formatTimestamp(project.updatedAt),
        );
      }
    });

  program
    .command('open <id>')
    .description('View project summary')
    .action(async function (id: string) {
      const useLocal = this.optsWithGlobals().local === true;
      const state = await openProject(id, useLocal);
      console.log(`ID: ${state.id}`);
      console.log(`Idea: ${state.idea}`);
      console.log(`Stage: ${state.clarityStage}`);
      console.log(`Messages: ${state.messages.length}`);
      console.log(`Updated: ${formatTimestamp(state.updatedAt)}`);
    });

  program
    .command('delete <id>')
    .description('Delete a project')
    .action(async function (id: string) {
      const useLocal = this.optsWithGlobals().local === true;
      await deleteProject(id, useLocal);
      console.log(`Deleted project: ${id}`);
    });

  program
    .command('snapshot <id>')
    .description('Create a timestamped snapshot for a project')
    .option('--tag <tag>', 'snapshot tag name (default: ISO timestamp)')
    .action(async function (id: string, options: { tag?: string }) {
      const useLocal = this.optsWithGlobals().local === true;
      const snapshotDir = await snapshotProject(id, useLocal, options.tag);
      console.log(`Snapshot created: ${snapshotDir}`);
    });

  program
    .command('chat <id>')
    .description('Resume dialogue session for a project')
    .action(async function (id: string) {
      const useLocal = this.optsWithGlobals().local === true;
      await startChatSession(id, useLocal);
    });

  return program;
}

async function main(): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exit(1);
  });
}
