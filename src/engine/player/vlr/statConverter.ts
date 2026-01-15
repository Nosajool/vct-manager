// VLR Stats to Game Stats Converter
// Converts VLR performance metrics to the game's PlayerStats interface

import type { PlayerStats } from '@/types/player';
import type { VlrPlayerStats } from '@/types/vlr';

/** Statistical ranges observed in VLR data for normalization */
const VLR_STAT_RANGES = {
  rating: { min: 0.7, max: 1.5 },
  acs: { min: 150, max: 300 },
  kd: { min: 0.6, max: 1.6 },
  kast: { min: 0.55, max: 0.85 },
  adr: { min: 100, max: 200 },
  kpr: { min: 0.5, max: 1.0 },
  apr: { min: 0.1, max: 0.5 },
  fkpr: { min: 0.05, max: 0.25 },
  fdpr: { min: 0.05, max: 0.2 },
  hs: { min: 0.15, max: 0.4 },
  clutch: { min: 0.1, max: 0.45 },
};

/** Parse VLR stat string to number */
function parseVlrStat(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace('%', '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  // If it had a %, divide by 100
  return value.includes('%') ? num / 100 : num;
}

/** Normalize a value to 0-100 scale based on observed ranges */
function normalize(value: number, range: { min: number; max: number }): number {
  const clamped = Math.max(range.min, Math.min(range.max, value));
  const normalized = ((clamped - range.min) / (range.max - range.min)) * 100;
  // Game uses ~40-99 range for realistic stat distribution
  return Math.round(Math.max(40, Math.min(99, normalized)));
}

/** Weighted combination of normalized stats */
function combine(
  weights: Record<string, number>,
  values: Record<string, number>
): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const weighted = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + (values[key] ?? 50) * weight,
    0
  );
  return Math.round(weighted / total);
}

/**
 * Converts VLR player statistics to game PlayerStats.
 *
 * Mapping rationale:
 * - mechanics: Based on ACS, headshot %, and K/D - raw fragging ability
 * - igl: Inferred from KAST and survival - team-oriented play patterns
 * - mental: Based on K/D consistency and clutch % - composure under pressure
 * - clutch: Directly from clutch success % with rating modifier
 * - vibes: Derived from team performance correlation (approximated from KAST)
 * - lurking: Inverse of FKPR - players who don't entry often lurk
 * - entry: Directly from FKPR with ACS modifier
 * - support: Based on APR and KAST - utility and team contribution
 * - stamina: Based on rating consistency (approximated from overall rating)
 */
export function convertVlrToGameStats(vlr: VlrPlayerStats): PlayerStats {
  // Parse all stats
  const parsed = {
    rating: parseVlrStat(vlr.rating),
    acs: parseVlrStat(vlr.average_combat_score),
    kd: parseVlrStat(vlr.kill_deaths),
    kast: parseVlrStat(vlr.kill_assists_survived_traded),
    adr: parseVlrStat(vlr.average_damage_per_round),
    kpr: parseVlrStat(vlr.kills_per_round),
    apr: parseVlrStat(vlr.assists_per_round),
    fkpr: parseVlrStat(vlr.first_kills_per_round),
    fdpr: parseVlrStat(vlr.first_deaths_per_round),
    hs: parseVlrStat(vlr.headshot_percentage),
    clutch: parseVlrStat(vlr.clutch_success_percentage),
  };

  // Normalize to 0-100 scale
  const norm = {
    rating: normalize(parsed.rating, VLR_STAT_RANGES.rating),
    acs: normalize(parsed.acs, VLR_STAT_RANGES.acs),
    kd: normalize(parsed.kd, VLR_STAT_RANGES.kd),
    kast: normalize(parsed.kast, VLR_STAT_RANGES.kast),
    adr: normalize(parsed.adr, VLR_STAT_RANGES.adr),
    kpr: normalize(parsed.kpr, VLR_STAT_RANGES.kpr),
    apr: normalize(parsed.apr, VLR_STAT_RANGES.apr),
    fkpr: normalize(parsed.fkpr, VLR_STAT_RANGES.fkpr),
    fdpr: normalize(parsed.fdpr, VLR_STAT_RANGES.fdpr),
    hs: normalize(parsed.hs, VLR_STAT_RANGES.hs),
    clutch: normalize(parsed.clutch, VLR_STAT_RANGES.clutch),
  };

  // Compute inverse stats (low FKPR = high lurking tendency)
  const invFkpr = 100 - norm.fkpr;
  const fkFdRatio = norm.fkpr / Math.max(norm.fdpr, 1); // First kill efficiency

  return {
    mechanics: combine(
      { acs: 0.4, hs: 0.3, kd: 0.3 },
      { acs: norm.acs, hs: norm.hs, kd: norm.kd }
    ),
    igl: combine(
      { kast: 0.5, rating: 0.3, adr: 0.2 },
      { kast: norm.kast, rating: norm.rating, adr: norm.adr }
    ),
    mental: combine(
      { kd: 0.4, clutch: 0.4, rating: 0.2 },
      { kd: norm.kd, clutch: norm.clutch, rating: norm.rating }
    ),
    clutch: combine(
      { clutch: 0.7, kd: 0.2, rating: 0.1 },
      { clutch: norm.clutch, kd: norm.kd, rating: norm.rating }
    ),
    vibes: combine(
      { kast: 0.4, rating: 0.4, kd: 0.2 },
      { kast: norm.kast, rating: norm.rating, kd: norm.kd }
    ),
    lurking: combine(
      { invFkpr: 0.5, kast: 0.3, kd: 0.2 },
      { invFkpr, kast: norm.kast, kd: norm.kd }
    ),
    entry: combine(
      { fkpr: 0.5, acs: 0.3, fkFdRatio: 0.2 },
      { fkpr: norm.fkpr, acs: norm.acs, fkFdRatio: Math.min(fkFdRatio * 25, 100) }
    ),
    support: combine(
      { kast: 0.4, apr: 0.4, rating: 0.2 },
      { kast: norm.kast, apr: norm.apr, rating: norm.rating }
    ),
    stamina: combine(
      { rating: 0.5, kast: 0.3, kd: 0.2 },
      { rating: norm.rating, kast: norm.kast, kd: norm.kd }
    ),
  };
}

/**
 * Calculate an overall rating from VLR stats (0-100 scale).
 * Used for sorting and display purposes.
 */
export function calculateVlrOverall(vlr: VlrPlayerStats): number {
  const rating = parseVlrStat(vlr.rating);
  const acs = parseVlrStat(vlr.average_combat_score);
  const kast = parseVlrStat(vlr.kill_assists_survived_traded);

  // Weighted formula based on VLR's own rating system
  const normalized =
    normalize(rating, VLR_STAT_RANGES.rating) * 0.5 +
    normalize(acs, VLR_STAT_RANGES.acs) * 0.3 +
    normalize(kast, VLR_STAT_RANGES.kast) * 0.2;

  return Math.round(normalized);
}
