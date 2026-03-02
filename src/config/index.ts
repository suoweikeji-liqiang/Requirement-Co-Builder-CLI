import fs from 'node:fs';
import path from 'node:path';
import { getConfigPath } from '../utils/paths.js';
import { ConfigSchema, DEFAULT_MODELS, type Config } from './schema.js';

export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();

  try {
    const raw = await fs.promises.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    const result = ConfigSchema.safeParse(parsed);

    if (!result.success) {
      throw new Error(
        `Config file is corrupt at ${configPath}.\n` +
          `Validation errors: ${result.error.message}\n` +
          `Fix or delete the file and try again.`
      );
    }

    return result.data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return ConfigSchema.parse({});
    }
    throw err;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  const tmpPath = configPath + '.tmp';

  await fs.promises.mkdir(configDir, { recursive: true });
  await fs.promises.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf8');

  try {
    await fs.promises.rename(tmpPath, configPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      await fs.promises.copyFile(tmpPath, configPath);
      await fs.promises.unlink(tmpPath);
    } else {
      throw err;
    }
  }
}

export function getApiKey(config: Config): string {
  const provider = config.defaultProvider;
  const key = provider === 'openai' ? config.openaiKey : config.anthropicKey;

  if (!key) {
    throw new Error(
      `No API key set. Run: req config set-key ${provider} <key>`
    );
  }

  return key;
}

export function getModel(config: Config): string {
  return config.defaultModel ?? DEFAULT_MODELS[config.defaultProvider];
}

export function getBaseUrl(config: Config): string | undefined {
  return config.defaultProvider === 'openai' ? config.openaiBaseUrl : config.anthropicBaseUrl;
}
