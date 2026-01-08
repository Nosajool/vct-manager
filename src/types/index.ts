// Core type definitions for VCT Manager
// These will be expanded as features are built

export type Region = 'Americas' | 'EMEA' | 'Pacific' | 'China';

export type SeasonPhase =
  | 'offseason'
  | 'kickoff'
  | 'stage1'
  | 'stage2'
  | 'masters1'
  | 'masters2'
  | 'champions';

export type CompetitionType = 'kickoff' | 'stage1' | 'stage2' | 'masters' | 'champions';

export type TournamentFormat = 'single_elim' | 'double_elim' | 'triple_elim' | 'round_robin';

// Re-export types from individual files as they are created
// export * from './player';
// export * from './team';
// export * from './match';
// export * from './competition';
// export * from './calendar';
// export * from './economy';
