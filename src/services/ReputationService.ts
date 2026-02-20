// ReputationService - Fan growth, hype decay, and sponsor trust management
// Part of the narrative layer (System 3: Fan & Reputation)

import type { Team } from '../types';
import type { MatchResult } from '../types/match';
import type { CompetitionType } from '../types/competition';
import { useGameStore } from '../store';

/**
 * The change in reputation metrics resulting from a match
 */
export interface ReputationDelta {
  fanbaseDelta: number;
  hypeDelta: number;
  newFanbase: number;
  newHypeLevel: number;
}

/**
 * Minimal rivalry info needed for reputation calculation.
 * Full Rivalry type lives in rivalrySlice (vct-manager-p7j3).
 */
interface RivalryContext {
  intensity: number;
}

// Tournament weights for fan growth
const TOURNAMENT_WEIGHT: Record<CompetitionType, number> = {
  kickoff: 1.5,
  stage1: 1.2,
  stage2: 1.2,
  masters: 2.0,
  champions: 3.0,
};

export class ReputationService {
  /**
   * Calculate and apply fan/hype gains from a completed match.
   * Returns the delta so CalendarService can surface it to the UI.
   */
  processMatchReputation(
    matchResult: MatchResult,
    playerTeamId: string,
    team: Team,
    tournamentType?: CompetitionType,
    isPlayoffMatch?: boolean,
    rivalry?: RivalryContext
  ): ReputationDelta {
    const { fanbase, hypeLevel } = team.reputation;

    // Scrims or unknown tournaments grant no reputation
    if (!tournamentType) {
      return { fanbaseDelta: 0, hypeDelta: 0, newFanbase: fanbase, newHypeLevel: hypeLevel };
    }

    const weight = TOURNAMENT_WEIGHT[tournamentType];
    const matchImportance = isPlayoffMatch ? 1.5 : 1.0;
    const baseGain = weight * matchImportance * 2;

    const won = matchResult.winnerId === playerTeamId;
    const winBonus = won ? 5 : 0;
    const hypeMultiplier = 1 + hypeLevel / 100;
    const rivalryModifier = rivalry && rivalry.intensity > 40 ? 3 : 0;

    const fanbaseDelta = Math.round(baseGain * hypeMultiplier) + winBonus + rivalryModifier;

    // Hype boost per match (win = +3, loss = +1) plus playoff/championship bonuses
    let playoffHypeBonus = 0;
    if (won) {
      if (tournamentType === 'champions') {
        playoffHypeBonus = 10; // Championship win
      } else if (isPlayoffMatch) {
        playoffHypeBonus = 5;  // Playoff win
      }
    }
    const hypeDelta = (won ? 3 : 1) + playoffHypeBonus;

    const newFanbase = Math.max(0, Math.min(100, fanbase + fanbaseDelta));
    const newHypeLevel = Math.max(0, Math.min(100, hypeLevel + hypeDelta));

    // Apply to store
    const state = useGameStore.getState();
    const updatedReputation = { ...team.reputation, fanbase: newFanbase, hypeLevel: newHypeLevel };
    state.updateTeam(playerTeamId, { reputation: updatedReputation });

    // Set or clear high_hype_active drama flag based on new hype level
    this.syncHypeFlag(newHypeLevel, state);

    return { fanbaseDelta, hypeDelta, newFanbase, newHypeLevel };
  }

  /**
   * Apply weekly hype decay (-3 per 7 days, minimum 0).
   * Should be called from CalendarService once per week.
   */
  processWeeklyHypeDecay(team: Team, playerTeamId: string): void {
    const { hypeLevel } = team.reputation;
    const newHypeLevel = Math.max(0, hypeLevel - 3);

    if (newHypeLevel === hypeLevel) return; // Already at 0, nothing to do

    const state = useGameStore.getState();
    state.updateTeam(playerTeamId, {
      reputation: { ...team.reputation, hypeLevel: newHypeLevel },
    });

    this.syncHypeFlag(newHypeLevel, state);
  }

  /**
   * Sync the high_hype_active drama flag based on current hype level.
   * hypeLevel > 60 → set flag; otherwise clear it.
   */
  private syncHypeFlag(
    hypeLevel: number,
    state: ReturnType<typeof useGameStore.getState>
  ): void {
    const FLAG = 'high_hype_active';
    if (hypeLevel > 60) {
      // Only set if not already active
      if (!state.activeFlags[FLAG]) {
        state.setDramaFlag(FLAG, { setDate: state.calendar.currentDate });
      }
    } else {
      if (state.activeFlags[FLAG]) {
        state.clearDramaFlag(FLAG);
      }
    }
  }
}

export const reputationService = new ReputationService();
