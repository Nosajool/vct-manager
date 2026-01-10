// Store Slices - Re-export all slices for convenience

export { createPlayerSlice, type PlayerSlice } from './playerSlice';
export { createTeamSlice, type TeamSlice } from './teamSlice';
export { createGameSlice, type GameSlice } from './gameSlice';
export {
  createUISlice,
  type UISlice,
  type ActiveView,
  type BulkSimulationProgress,
} from './uiSlice';
export { createMatchSlice, type MatchSlice } from './matchSlice';
export {
  createCompetitionSlice,
  type CompetitionSlice,
  type StandingsEntry,
} from './competitionSlice';
