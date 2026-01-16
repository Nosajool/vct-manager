// VLR Team ID Mapping
// Maps game team names to VLR.gg team page IDs for roster scraping

import type { Region } from '@/types/player';

/**
 * VLR Team ID mapping for roster scraping.
 * Team IDs correspond to vlr.gg/team/{id}/{slug}
 */
export const VLR_TEAM_IDS: Record<Region, Record<string, number>> = {
  Americas: {
    'Sentinels': 2,
    'Cloud9': 188,
    '100 Thieves': 120,
    'NRG': 1034,
    'Evil Geniuses': 5248,
    'LOUD': 6961,
    'FURIA': 2406,
    'MIBR': 7386,
    'Leviatán': 2359,
    'KRÜ Esports': 2355,
    'G2 Esports': 11058,
    '2GAME Esports': 15072,
  },
  EMEA: {
    'Fnatic': 2593,
    'Team Liquid': 474,
    'Team Vitality': 2059,
    'Karmine Corp': 8877,
    'Team Heretics': 1001,
    'NAVI': 4915,
    'FUT Esports': 1184,
    'BBL Esports': 397,
    'Giants Gaming': 14419, // GIANTX
    'KOI': 7035,
    'Gentle Mates': 12694,
    'Apeks': 11479,
  },
  Pacific: {
    'Paper Rex': 624,
    'DRX': 8185,
    'T1': 14,
    'Gen.G': 17,
    'ZETA DIVISION': 5448,
    'DetonatioN Gaming': 278, // DetonatioN FocusMe
    'Global Esports': 918,
    'Team Secret': 6199,
    'Talon Esports': 8304,
    'Rex Regum Qeon': 878,
    'BLEED Esports': 6387,
    'Nongshim RedForce': 11060,
  },
  China: {
    'EDward Gaming': 1120,
    'Bilibili Gaming': 12010,
    'FunPlus Phoenix': 11328,
    'JD Gaming': 13576,
    'Nova Esports': 12064,
    'All Gamers': 1119,
    'Dragon Ranger Gaming': 11981,
    'Wolves Esports': 13790,
    'Titan Esports Club': 14137,
    'TYLOO': 731,
    'Trace Esports': 12685,
    'Attacking Soul Esports': 1837,
  },
};

/**
 * Flat map of all team names to VLR IDs (for quick lookup)
 */
export const ALL_VLR_TEAM_IDS: Record<string, number> = Object.values(VLR_TEAM_IDS).reduce(
  (acc, regionTeams) => ({ ...acc, ...regionTeams }),
  {}
);

/**
 * Get VLR team ID by team name
 */
export function getVlrTeamId(teamName: string): number | undefined {
  return ALL_VLR_TEAM_IDS[teamName];
}

/**
 * Get all teams for a specific region
 */
export function getRegionTeamIds(region: Region): Record<string, number> {
  return VLR_TEAM_IDS[region] || {};
}
