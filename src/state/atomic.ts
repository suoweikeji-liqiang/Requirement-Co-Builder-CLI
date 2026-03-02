import { promises as fs } from 'node:fs';

/**
 * Atomically writes data to filePath using a temp file in the same directory.
 *
 * The temp file is created at filePath + '.tmp' (same directory as destination)
 * to avoid EXDEV errors on Windows when temp and destination are on different drives.
 *
 * On EXDEV (cross-device rename), falls back to copyFile + unlink.
 */
export async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, data, 'utf8');
  try {
    await fs.rename(tmpPath, filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      // Windows: temp and dest on different drives — copy then delete
      await fs.copyFile(tmpPath, filePath);
      await fs.unlink(tmpPath);
    } else {
      throw err;
    }
  }
}

/**
 * Reads a state file with recovery fallback to the .tmp file.
 *
 * - Returns file content if the main file exists and is readable.
 * - If the main file is missing or unreadable, tries filePath + '.tmp'.
 * - If .tmp exists, promotes it to the main path (rename) and returns its content.
 * - Returns null if both files are missing.
 */
export async function readStateWithRecovery(filePath: string): Promise<string | null> {
  const tmpPath = filePath + '.tmp';
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    // state.json missing or corrupt — try .tmp recovery
    try {
      const recovered = await fs.readFile(tmpPath, 'utf8');
      // Promote .tmp to main file before returning
      await fs.rename(tmpPath, filePath);
      return recovered;
    } catch {
      return null;
    }
  }
}
