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
   *
   * Also seeds `agentStreaks: {}` for streak tracking.
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
   * Diminishing returns multiplier based on current mastery value.
   * 0–40:   ×1.00
   * 40–60:  ×0.75
   * 60–75:  ×0.50
   * 75–85:  ×0.25
   * 85–100: ×0.10
   */
  getMasteryGainMultiplier(currentMastery: number): number {
    if (currentMastery >= 85) return 0.10;
    if (currentMastery >= 75) return 0.25;
    if (currentMastery >= 60) return 0.50;
    if (currentMastery >= 40) return 0.75;
    return 1.00;
  }

  /**
   * Career tendency multipliers stacked on top of diminishing returns.
   * 1. Role match bonus: ×1.25 if agent's role matches player's primaryRole
   * 2. Signature agent streak: ×1.25 for 3–5 consecutive appearances, ×1.50 for 6+
   */
  getCareerTendencyMultiplier(
    agentName: string,
    prefs: PlayerAgentPreferences
  ): number {
    let multiplier = 1.0;

    // 1. Role match bonus
    const agentRole = (COMPOSITION_CONSTANTS.AGENT_ROLES as Record<string, string>)[agentName];
    if (agentRole && agentRole === prefs.primaryRole) {
      multiplier *= 1.25;
    }

    // 2. Signature agent streak bonus
    const streak = prefs.agentStreaks?.[agentName] ?? 0;
    if (streak >= 6) {
      multiplier *= 1.50;
    } else if (streak >= 3) {
      multiplier *= 1.25;
    }

    return multiplier;
  }

  /**
   * Returns the raw mastery gain for a played agent, applying:
   * 1. Base gain by context (match / scrim / training)
   * 2. Diminishing returns curve
   * 3. Career tendency multipliers (role + streak)
   *
   * @param isPreferred - Whether the agent is in the player's top-3
   * @param currentMastery - Current mastery value (0–100)
   * @param prefs - Player's agent preferences (for tendency multipliers)
   * @param agentName - The agent played
   * @param source - 'match' | 'scrim' | 'training'
   */
  getMasteryGain(
    isPreferred: boolean,
    currentMastery: number,
    prefs: PlayerAgentPreferences,
    agentName: string,
    source: 'match' | 'scrim' | 'training' = 'match'
  ): number {
    // Base gains by source
    let baseGain: number;
    if (source === 'match') {
      baseGain = isPreferred ? 4 : 2;
    } else if (source === 'scrim') {
      baseGain = isPreferred ? 0.8 : 0.4;
    } else {
      // training: always +2 on a preferred agent (caller picks the agent)
      baseGain = 2;
    }

    const dimReturns = this.getMasteryGainMultiplier(currentMastery);
    const tendency = this.getCareerTendencyMultiplier(agentName, prefs);

    return baseGain * dimReturns * tendency;
  }

  /**
   * Update agent streak tracking after a game on `agentName`.
   * Increments the streak for that agent; resets all others to 0.
   * Returns the updated streaks object.
   */
  updateAgentStreaks(
    agentName: string,
    currentStreaks: Record<string, number>
  ): Record<string, number> {
    const updated: Record<string, number> = {};

    // Reset all agents to 0
    for (const key of Object.keys(currentStreaks)) {
      updated[key] = 0;
    }

    // Increment for the agent played
    updated[agentName] = (currentStreaks[agentName] ?? 0) + 1;

    return updated;
  }

  /**
   * Apply weekly mastery decay to all agents a player hasn't played this week.
   * - 1.5% per week for non-preferred agents (floor 20)
   * - 0.75% per week for top-3 preferred agents (floor 40)
   *
   * @param prefs - Current agent preferences
   * @param playedAgentsThisWeek - Set of agent names played this week
   */
  applyAgentMasteryDecay(
    prefs: PlayerAgentPreferences,
    playedAgentsThisWeek: Set<string>
  ): PlayerAgentPreferences {
    const mastery = { ...(prefs.agentMastery ?? {}) };
    const preferred = new Set(prefs.preferredAgents);

    for (const [agent, value] of Object.entries(mastery)) {
      if (playedAgentsThisWeek.has(agent)) continue;

      const isPreferred = preferred.has(agent);
      const decayRate = isPreferred ? 0.0075 : 0.015;
      const floor = isPreferred ? 40 : 20;

      mastery[agent] = Math.max(floor, value * (1 - decayRate));
    }

    return { ...prefs, agentMastery: mastery };
  }
}

export const agentMasteryEngine = new AgentMasteryEngine();
