/**
 * Deterministic PRNG using FNV-1a hash.
 * Returns consistent 0-1 value for the same seed string.
 */
export function seededRandom(seed: string): number {
  let hash = 2166136261; // FNV-1a offset basis (32-bit)
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV-1a prime
    hash >>>= 0; // Force unsigned 32-bit
  }
  return hash / 0xFFFFFFFF;
}

/**
 * Generates a seed string for daily interest drift.
 */
export function dailyInterestSeed(playerId: string, teamId: string, dateStr: string): string {
  return `${playerId}:${teamId}:${dateStr}`;
}
