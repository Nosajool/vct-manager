// VLR Org Name Mapping
// Maps VLR org abbreviations to game team names from VCT_TEAMS

import type { Region } from '@/types/player';
import type { VlrRegion } from '@/types/vlr';

/**
 * Maps VLR org abbreviations to game team names.
 * VLR uses short forms like "SEN", "C9" while the game uses full names.
 */
export const VLR_ORG_TO_TEAM_NAME: Record<string, string> = {
  // Americas
  SEN: 'Sentinels',
  C9: 'Cloud9',
  '100T': '100 Thieves',
  NRG: 'NRG',
  EG: 'Evil Geniuses',
  LOUD: 'LOUD',
  FUR: 'FURIA',
  MIBR: 'MIBR',
  LEV: 'Leviatán',
  KRU: 'KRÜ Esports',
  KRÜ: 'KRÜ Esports',
  G2: 'G2 Esports',
  '2G': '2GAME Esports',

  // EMEA
  FNC: 'Fnatic',
  TL: 'Team Liquid',
  VIT: 'Team Vitality',
  KC: 'Karmine Corp',
  TH: 'Team Heretics',
  NAVI: 'NAVI',
  FUT: 'FUT Esports',
  BBL: 'BBL Esports',
  GIA: 'Giants Gaming',
  KOI: 'KOI',
  M8: 'Gentle Mates',
  GX: 'Gentle Mates', // Alternative abbreviation
  APK: 'Apeks',

  // Pacific
  PRX: 'Paper Rex',
  DRX: 'DRX',
  T1: 'T1',
  GEN: 'Gen.G',
  GENG: 'Gen.G',
  ZETA: 'ZETA DIVISION',
  DFM: 'DetonatioN Gaming',
  GE: 'Global Esports',
  TS: 'Team Secret',
  TLN: 'Talon Esports',
  RRQ: 'Rex Regum Qeon',
  BLD: 'BLEED Esports',
  BLEED: 'BLEED Esports',
  NS: 'Nongshim RedForce',
  NRF: 'Nongshim RedForce',

  // China
  EDG: 'EDward Gaming',
  BLG: 'Bilibili Gaming',
  FPX: 'FunPlus Phoenix',
  JDG: 'JD Gaming',
  NOVA: 'Nova Esports',
  AG: 'All Gamers',
  DRG: 'Dragon Ranger Gaming',
  WOL: 'Wolves Esports',
  TEC: 'Titan Esports Club',
  TYL: 'TYLOO',
  TYLOO: 'TYLOO',
  TE: 'Trace Esports',
  ASE: 'Attacking Soul Esports',
};

/** Reverse lookup: team name to VLR org */
export const TEAM_NAME_TO_VLR_ORG: Record<string, string> = Object.fromEntries(
  Object.entries(VLR_ORG_TO_TEAM_NAME).map(([k, v]) => [v, k])
);

/** Maps VLR regions to game regions */
export const VLR_TO_GAME_REGION: Record<VlrRegion, Region> = {
  na: 'Americas',
  br: 'Americas',
  'la-s': 'Americas',
  'la-n': 'Americas',
  la: 'Americas',
  eu: 'EMEA',
  mn: 'EMEA',
  gc: 'EMEA',
  ap: 'Pacific',
  kr: 'Pacific',
  oce: 'Pacific',
  cn: 'China',
};

/**
 * Resolve a VLR org abbreviation to game team name.
 * Returns undefined if no mapping exists.
 */
export function resolveOrgToTeamName(vlrOrg: string): string | undefined {
  // Try exact match first
  const exact = VLR_ORG_TO_TEAM_NAME[vlrOrg];
  if (exact) return exact;

  // Try uppercase
  const upper = VLR_ORG_TO_TEAM_NAME[vlrOrg.toUpperCase()];
  if (upper) return upper;

  return undefined;
}
