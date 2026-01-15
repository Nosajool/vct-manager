// VLR Player Data Integration
// Exports for processing VLR data into game Player entities

export {
  VLR_ORG_TO_TEAM_NAME,
  TEAM_NAME_TO_VLR_ORG,
  VLR_TO_GAME_REGION,
  resolveOrgToTeamName,
} from './orgMapping';

export {
  convertVlrToGameStats,
  calculateVlrOverall,
} from './statConverter';

export {
  processVlrSnapshot,
  createPlayerFromVlr,
  type ProcessedVlrData,
  type VlrProcessedPlayer,
} from './VlrDataProcessor';
