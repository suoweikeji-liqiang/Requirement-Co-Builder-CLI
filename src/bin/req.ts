#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig, saveConfig } from '../config/index.js';

const VALID_PROVIDERS = ['openai', 'anthropic'] as const;
type Provider = typeof VALID_PROVIDERS[number];

function isValidProvider(value: string): value is Provider {
  return VALID_PROVIDERS.includes(value as Provider);
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('req')
    .description('Requirement Co-Builder CLI')
    .version('0.1.0')
    .option('--local', 'use current directory for project storage instead of ~/.reqgen/');

  const configCmd = program
    .command('config')
    .description('Manage configuration settings');

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

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
