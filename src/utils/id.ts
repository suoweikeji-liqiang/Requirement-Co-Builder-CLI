import crypto from 'node:crypto';

/**
 * Generates a unique, human-readable project ID.
 *
 * Format: "{4-char-hex-hash}-{idea-slug}"
 * Example: "a3f2-build-a-cli-tool"
 *
 * The hash uses SHA-256 of (idea + Date.now()) for collision resistance.
 * The slug takes up to 5 lowercase alphanumeric words from the idea.
 *
 * For ideas with no ASCII alphanumeric characters (e.g., Chinese-only),
 * uses 'project' as the fallback slug.
 */
export function generateProjectId(idea: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(idea + Date.now())
    .digest('hex')
    .slice(0, 4);

  const slug = idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join('-');

  return `${hash}-${slug || 'project'}`;
}
