/**
 * Image asset utilities for VCT Manager
 *
 * Provides consistent image path resolution and name normalization
 * for agents, weapons, teams, players, and events.
 */

/**
 * Normalize any entity name to a filename-safe slug
 *
 * Rules:
 * - Lowercase
 * - Strip diacritics (é → e, ü → u, etc.)
 * - Remove `/` and `.` characters
 * - Replace non-alphanumeric with hyphens
 * - Collapse multiple hyphens to single hyphen
 * - Trim leading/trailing hyphens
 *
 * Examples:
 * - "KAY/O" → "kayo"
 * - "KRÜ Esports" → "kru-esports"
 * - "Gen.G" → "geng"
 * - "TenZ" → "tenz"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    // Normalize unicode characters (é → e, ü → u, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    // Remove slashes and dots
    .replace(/[/.]/g, '')
    // Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim hyphens from start/end
    .replace(/^-+|-+$/g, '');
}

/**
 * Get the URL for an agent portrait image
 * @param agentName - Display name of the agent (e.g., "Jett", "KAY/O")
 * @returns URL path to the agent image
 */
export function getAgentImageUrl(agentName: string): string {
  const slug = slugify(agentName);
  return `${import.meta.env.BASE_URL}images/agents/${slug}.png`;
}

/**
 * Get the URL for a weapon image
 * @param weaponId - Weapon identifier (e.g., "Vandal", "Phantom")
 * @returns URL path to the weapon image
 */
export function getWeaponImageUrl(weaponId: string): string {
  const slug = slugify(weaponId);
  return `${import.meta.env.BASE_URL}images/weapons/${slug}.png`;
}

/**
 * Get the URL for a team logo
 * @param teamName - Team name (e.g., "Sentinels", "Gen.G")
 * @returns URL path to the team logo
 */
export function getTeamLogoUrl(teamName: string): string {
  const slug = slugify(teamName);
  return `${import.meta.env.BASE_URL}images/teams/${slug}.png`;
}

/**
 * Get the URL for a player photo
 * @param playerSlug - Player slug (already normalized)
 * @returns URL path to the player photo
 */
export function getPlayerImageUrl(playerSlug: string): string {
  return `${import.meta.env.BASE_URL}images/players/${playerSlug}.png`;
}

/**
 * Get the URL for an event logo
 * @param eventSlug - Event slug (already normalized)
 * @returns URL path to the event logo
 */
export function getEventLogoUrl(eventSlug: string): string {
  return `${import.meta.env.BASE_URL}images/events/${eventSlug}.png`;
}
