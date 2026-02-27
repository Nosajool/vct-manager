// AgentMasteryEngine - Handles agent mastery defaults, comfort modifiers, and mastery gain
// Pure utility class with no store dependencies

import type { Player, AgentRole, PlayerAgentPreferences } from '../../types';
import { COMPOSITION_CONSTANTS } from '../match/constants';

export class AgentMasteryEngine {
  /**
   * Seed initial mastery values when preferences are first set.
   * - preferredAgents[0] → 80 (main)
   * - preferredAgents[1] → 60
   * - preferredAgents[2] → 40
   * - Other agents in primaryRole → 20
   * - All other agents → 10
   */
  getDefaultMastery(
    preferredAgents: [string, string, string],
    primaryRole: AgentRole
  ): Record<string, number> {
    const mastery: Record<string, number> = {};
    const allAgents = Object.keys(COMPOSITION_CONSTANTS.AGENT_ROLES);
    const roleAgents = [...COMPOSITION_CONSTANTS.AGENTS_BY_ROLE[primaryRole]];

    // Seed all agents at baseline
    for (const agent of allAgents) {
      mastery[agent] = 10;
    }

    // Bump role agents to 20
    for (const agent of roleAgents) {
      mastery[agent] = 20;
    }

    // Set preferred agent values (overwrite in reverse order so #1 wins)
    if (preferredAgents[2]) mastery[preferredAgents[2]] = 40;
    if (preferredAgents[1]) mastery[preferredAgents[1]] = 60;
    if (preferredAgents[0]) mastery[preferredAgents[0]] = 80;

    return mastery;
  }

  /**
   * Returns a per-player strength multiplier offset based on mastery.
   * - 0–29:  −0.12
   * - 30–59: −0.05
   * - 60–79:  0.00
   * - 80–100: +0.05
   */
  getComfortModifier(agentName: string, mastery: Record<string, number>): number {
    const value = mastery[agentName] ?? 0;
    if (value >= 80) return 0.05;
    if (value >= 60) return 0.0;
    if (value >= 30) return -0.05;
    return -0.12;
  }

  /**
   * Averages comfort modifier across all 5 players given their agent assignments.
   * Return range: roughly −0.12 to +0.05.
   */
  calculateTeamMasteryModifier(
    players: Player[],
    assignments: Record<string, string>,
    prefs: Record<string, PlayerAgentPreferences>
  ): number {
    if (players.length === 0) return 0;

    let total = 0;
    for (const player of players) {
      const agentName = assignments[player.id];
      if (!agentName) continue;
      const playerPrefs = prefs[player.id];
      const mastery = playerPrefs?.agentMastery ?? {};
      total += this.getComfortModifier(agentName, mastery);
    }

    return total / players.length;
  }

  /**
   * Returns the mastery gain for a played agent.
   * - Match, preferred agent: +4
   * - Match, non-preferred: +2
   */
  getMasteryGain(isPreferred: boolean): number {
    return isPreferred ? 4 : 2;
  }
}

export const agentMasteryEngine = new AgentMasteryEngine();
