// Pre-Match Preparation Types
// Used for the pre-match veto and agent selection flow

/**
 * A single action in the map veto sequence
 */
export interface VetoAction {
  phase: number;       // 0-6
  action: 'ban' | 'pick' | 'decider';
  teamId: string;      // 'player' | opponent team id | 'auto'
  mapName: string;
}

/**
 * Complete pre-match configuration from the prep modal
 */
export interface PreMatchConfig {
  /** Ordered maps: [map1 (player pick), map2 (opponent pick), map3 (decider)] */
  selectedMaps: string[];
  /** Agent assignments per map: mapName -> playerId -> agentName */
  agentAssignments: Record<string, Record<string, string>>;
  /** Full veto sequence log */
  vetoLog: VetoAction[];
}
