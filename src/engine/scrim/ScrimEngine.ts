// ScrimEngine - Pure engine class for scrim simulation
// No React or store dependencies - pure functions only

import type {
  Team,
  Player,
  TierTeam,
  TeamTier,
  ScrimRelationship,
  ScrimOptions,
  ScrimIntensity,
  MapStrength,
  MapStrengthAttributes,
  MapPoolStrength,
  RelationshipEvent,
  MapResult,
  PlayerMapPerformance,
} from '../../types';
import { MAPS, ALL_AGENTS } from '../../utils/constants';
import { SCRIM_CONSTANTS } from '../../types/scrim';

/**
 * ScrimEngine - Handles scrim simulation, map improvements, chemistry, and relationships
 */
export class ScrimEngine {
  // ============================================
  // Scrim Simulation
  // ============================================

  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Calculate efficiency multiplier based on partner tier and relationship
   * Higher tier = better quality practice, higher relationship = better communication
   */
  calculateEfficiency(tier: TeamTier, relationshipScore: number): number {
    const tierEfficiency = SCRIM_CONSTANTS.TIER_EFFICIENCY[tier];
    // Relationship provides up to 30% bonus on top of tier efficiency
    const relationshipBonus = (relationshipScore / 100) * 0.3;
    return Math.min(1.5, tierEfficiency + relationshipBonus);
  }

  /**
   * Select maps for the scrim based on format and options
   */
  selectScrimMaps(options: ScrimOptions, mapPool: MapPoolStrength): string[] {
    // If specific maps requested, use those
    if (options.focusMaps && options.focusMaps.length > 0) {
      const count =
        options.format === 'single_map' ? 1 : options.format === 'best_of_3' ? 3 : 5;
      return options.focusMaps.slice(0, count);
    }

    // Otherwise, select based on format
    const count = options.format === 'single_map' ? 1 : options.format === 'best_of_3' ? 3 : 5;

    // Prioritize weaker maps for practice, but include some strong maps
    const sortedMaps = Object.entries(mapPool.maps)
      .sort((a, b) => this.calculateMapOverall(a[1]) - this.calculateMapOverall(b[1]))
      .map(([name]) => name);

    // Mix of weak and strong maps for balanced practice
    const weakMaps = sortedMaps.slice(0, Math.ceil(count / 2));
    const strongMaps = sortedMaps.slice(-Math.floor(count / 2));

    const selected = [...weakMaps, ...strongMaps].slice(0, count);

    // Shuffle to randomize order
    return selected.sort(() => Math.random() - 0.5);
  }

  /**
   * Calculate overall strength of a map
   */
  calculateMapOverall(mapStrength: MapStrength): number {
    const attrs = mapStrength.attributes;
    return (
      attrs.executes * 0.2 +
      attrs.retakes * 0.2 +
      attrs.utility * 0.15 +
      attrs.communication * 0.15 +
      attrs.mapControl * 0.15 +
      attrs.antiStrat * 0.15
    );
  }

  /**
   * Simulate a single scrim map
   */
  simulateScrimMap(
    playerTeamStrength: number,
    partnerTeamStrength: number,
    mapName: string,
    playerTeamPlayers: Player[],
    partnerPlayers: Player[],
    intensity: ScrimIntensity
  ): MapResult {
    // Add variance based on intensity (competitive scrims are more realistic)
    const varianceFactor = intensity === 'competitive' ? 0.1 : intensity === 'moderate' ? 0.15 : 0.2;

    // Calculate win probability
    const totalStrength = playerTeamStrength + partnerTeamStrength;
    const baseProbA = playerTeamStrength / totalStrength;

    // Simulate rounds
    let scoreA = 0;
    let scoreB = 0;
    const targetScore = 13;

    while (scoreA < targetScore && scoreB < targetScore) {
      const variance = 1 - varianceFactor + Math.random() * varianceFactor * 2;
      const roundProb = Math.min(0.8, Math.max(0.2, baseProbA * variance));

      if (Math.random() < roundProb) {
        scoreA++;
      } else {
        scoreB++;
      }

      // Overtime check
      if (scoreA === 12 && scoreB === 12) {
        // Play until 2 round lead or max 30 rounds
        while (Math.abs(scoreA - scoreB) < 2 && scoreA + scoreB < 30) {
          if (Math.random() < baseProbA) {
            scoreA++;
          } else {
            scoreB++;
          }
        }
        break;
      }
    }

    const winner = scoreA > scoreB ? 'teamA' : 'teamB';
    const overtime = scoreA + scoreB > 24;

    return {
      map: mapName,
      teamAScore: scoreA,
      teamBScore: scoreB,
      winner,
      teamAPerformances: this.generatePlayerPerformances(
        playerTeamPlayers,
        scoreA,
        scoreB,
        winner === 'teamA'
      ),
      teamBPerformances: this.generatePlayerPerformances(
        partnerPlayers,
        scoreB,
        scoreA,
        winner === 'teamB'
      ),
      totalRounds: scoreA + scoreB,
      overtime,
      overtimeRounds: overtime ? scoreA + scoreB - 24 : undefined,
    };
  }

  /**
   * Generate player performance stats for a map
   */
  private generatePlayerPerformances(
    players: Player[],
    teamScore: number,
    enemyScore: number,
    won: boolean
  ): PlayerMapPerformance[] {
    const totalRounds = teamScore + enemyScore;

    return players.map((player) => {
      // Base KPR influenced by mechanics
      const baseKPR = 0.6 + (player.stats.mechanics / 100) * 0.6;
      const kills = Math.round(baseKPR * totalRounds * (0.8 + Math.random() * 0.4));
      const deaths = Math.round(
        (totalRounds / 5) * (1.2 - player.stats.mental / 200) * (0.8 + Math.random() * 0.4)
      );
      const assists = Math.round(
        (player.stats.support / 100) * totalRounds * 0.3 * (0.8 + Math.random() * 0.4)
      );

      // Win/loss modifier
      const modifier = won ? 1.1 : 0.9;

      return {
        playerId: player.id,
        playerName: player.name,
        agent: ALL_AGENTS[Math.floor(Math.random() * ALL_AGENTS.length)],
        kills: Math.round(kills * modifier),
        deaths: Math.max(1, deaths),
        assists: Math.round(assists * modifier),
        acs: Math.round((kills * 200 + assists * 50) / totalRounds + Math.random() * 50),
        kd: Number(((kills * modifier) / Math.max(1, deaths)).toFixed(2)),
      };
    });
  }

  // ============================================
  // Map Pool Improvements
  // ============================================

  /**
   * Calculate map strength improvements after scrim
   */
  calculateMapImprovements(
    playedMaps: string[],
    focusAttributes: (keyof MapStrengthAttributes)[] | undefined,
    efficiencyMultiplier: number,
    intensity: ScrimIntensity
  ): Record<string, Partial<MapStrengthAttributes>> {
    const improvements: Record<string, Partial<MapStrengthAttributes>> = {};

    // Intensity affects improvement rate
    const intensityMultiplier =
      intensity === 'competitive' ? 1.2 : intensity === 'moderate' ? 1.0 : 0.7;
    const baseImprovement = 2 * efficiencyMultiplier * intensityMultiplier;

    for (const mapName of playedMaps) {
      improvements[mapName] = {
        executes: this.randomImprovement(baseImprovement, focusAttributes?.includes('executes')),
        retakes: this.randomImprovement(baseImprovement, focusAttributes?.includes('retakes')),
        utility: this.randomImprovement(baseImprovement, focusAttributes?.includes('utility')),
        communication: this.randomImprovement(baseImprovement * 0.5), // Always improves slightly
        mapControl: this.randomImprovement(baseImprovement, focusAttributes?.includes('mapControl')),
        antiStrat: this.randomImprovement(baseImprovement * 0.3), // Slower to improve
      };
    }

    return improvements;
  }

  /**
   * Calculate random improvement with optional focus bonus
   */
  private randomImprovement(base: number, isFocused: boolean = false): number {
    const focusMultiplier = isFocused ? 1.5 : 1.0;
    const variance = 0.5 + Math.random(); // 0.5 to 1.5
    return Math.round(base * focusMultiplier * variance * 10) / 10;
  }

  /**
   * Apply improvements to a map pool (immutable)
   */
  applyMapImprovements(
    mapPool: MapPoolStrength,
    improvements: Record<string, Partial<MapStrengthAttributes>>,
    currentDate: string
  ): MapPoolStrength {
    const updatedMaps = { ...mapPool.maps };

    for (const [mapName, improvement] of Object.entries(improvements)) {
      const existing = updatedMaps[mapName];
      if (!existing) continue;

      const newAttributes: MapStrengthAttributes = {
        executes: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existing.attributes.executes + (improvement.executes || 0)
        ),
        retakes: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existing.attributes.retakes + (improvement.retakes || 0)
        ),
        utility: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existing.attributes.utility + (improvement.utility || 0)
        ),
        communication: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existing.attributes.communication + (improvement.communication || 0)
        ),
        mapControl: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existing.attributes.mapControl + (improvement.mapControl || 0)
        ),
        antiStrat: Math.min(
          SCRIM_CONSTANTS.MAX_MAP_ATTRIBUTE,
          existing.attributes.antiStrat + (improvement.antiStrat || 0)
        ),
      };

      updatedMaps[mapName] = {
        ...existing,
        attributes: newAttributes,
        lastPracticedDate: currentDate,
        totalPracticeHours: existing.totalPracticeHours + 2, // ~2 hours per scrim
      };
    }

    return {
      maps: updatedMaps,
      strongestMaps: this.calculateStrongestMaps(updatedMaps),
      banPriority: this.calculateBanPriority(updatedMaps),
    };
  }

  /**
   * Apply decay to unpracticed maps
   */
  applyMapDecay(
    mapPool: MapPoolStrength,
    _currentDate: string,
    practicedMaps: string[]
  ): MapPoolStrength {
    const updatedMaps = { ...mapPool.maps };
    const practicedSet = new Set(practicedMaps);

    for (const [mapName, mapStrength] of Object.entries(updatedMaps)) {
      // Skip if practiced this week
      if (practicedSet.has(mapName)) continue;

      // Apply decay to all attributes
      const decayRate = SCRIM_CONSTANTS.MAP_DECAY_RATE;
      const newAttributes: MapStrengthAttributes = {
        executes: Math.max(30, mapStrength.attributes.executes * (1 - decayRate)),
        retakes: Math.max(30, mapStrength.attributes.retakes * (1 - decayRate)),
        utility: Math.max(30, mapStrength.attributes.utility * (1 - decayRate)),
        communication: Math.max(35, mapStrength.attributes.communication * (1 - decayRate * 0.5)), // Slower decay
        mapControl: Math.max(30, mapStrength.attributes.mapControl * (1 - decayRate)),
        antiStrat: Math.max(25, mapStrength.attributes.antiStrat * (1 - decayRate * 1.5)), // Faster decay
      };

      updatedMaps[mapName] = {
        ...mapStrength,
        attributes: newAttributes,
      };
    }

    return {
      maps: updatedMaps,
      strongestMaps: this.calculateStrongestMaps(updatedMaps),
      banPriority: this.calculateBanPriority(updatedMaps),
    };
  }

  /**
   * Calculate top 3 strongest maps
   */
  calculateStrongestMaps(maps: Record<string, MapStrength>): string[] {
    return Object.entries(maps)
      .sort((a, b) => this.calculateMapOverall(b[1]) - this.calculateMapOverall(a[1]))
      .slice(0, 3)
      .map(([name]) => name);
  }

  /**
   * Calculate bottom 2 maps (ban priority)
   */
  calculateBanPriority(maps: Record<string, MapStrength>): string[] {
    return Object.entries(maps)
      .sort((a, b) => this.calculateMapOverall(a[1]) - this.calculateMapOverall(b[1]))
      .slice(0, 2)
      .map(([name]) => name);
  }

  // ============================================
  // Chemistry System
  // ============================================

  /**
   * Calculate chemistry changes after scrim
   */
  calculateChemistryChanges(
    players: Player[],
    maps: MapResult[],
    intensity: ScrimIntensity
  ): { overallChange: number; pairChanges: Record<string, Record<string, number>> } {
    // More intense scrims = more chemistry growth/loss
    const intensityMultiplier =
      intensity === 'competitive' ? 1.5 : intensity === 'moderate' ? 1.0 : 0.5;

    // Win percentage affects chemistry
    const wins = maps.filter((m) => m.winner === 'teamA').length;
    const winRate = wins / maps.length;

    // Base chemistry change: +2 to +5 depending on win rate
    const baseChange = 2 + winRate * 3;
    const overallChange = Math.round(baseChange * intensityMultiplier * 10) / 10;

    // Pair chemistry changes (players who perform well together)
    const pairChanges: Record<string, Record<string, number>> = {};

    // For each pair of players, calculate chemistry based on combined performance
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        // Calculate combined KD from performances
        let totalKD = 0;
        for (const map of maps) {
          const perf1 = map.teamAPerformances.find((p) => p.playerId === p1.id);
          const perf2 = map.teamAPerformances.find((p) => p.playerId === p2.id);
          if (perf1 && perf2) {
            totalKD += perf1.kd + perf2.kd;
          }
        }
        const avgKD = totalKD / maps.length;

        // Chemistry change based on performance
        const pairChange = Math.round((avgKD - 1.8) * intensityMultiplier * 10) / 10;

        if (!pairChanges[p1.id]) pairChanges[p1.id] = {};
        if (!pairChanges[p2.id]) pairChanges[p2.id] = {};
        pairChanges[p1.id][p2.id] = pairChange;
        pairChanges[p2.id][p1.id] = pairChange;
      }
    }

    return { overallChange, pairChanges };
  }

  // ============================================
  // Relationship System
  // ============================================

  /**
   * Roll for relationship event
   */
  rollRelationshipEvent(
    relationship: ScrimRelationship,
    partnerTeam: TierTeam | Team,
    intensity: ScrimIntensity,
    currentDate: string
  ): RelationshipEvent | undefined {
    // Higher VOD leak risk with more scrims
    const leakRisk = Math.min(0.15, relationship.vodLeakRisk / 100);

    // Check for negative events first
    if (Math.random() < leakRisk) {
      // VOD leak - most damaging
      if (Math.random() < 0.3) {
        return {
          id: this.generateId('event'),
          date: currentDate,
          type: 'vod_leak',
          partnerTeamId: partnerTeam.id,
          partnerTeamName: partnerTeam.name,
          description: `${partnerTeam.name} leaked your scrim VODs to an upcoming opponent!`,
          relationshipChange: SCRIM_CONSTANTS.RELATIONSHIP_EVENTS.vod_leak,
          affectsAllTeams: false,
        };
      }

      // Strat leak
      if (Math.random() < 0.4) {
        return {
          id: this.generateId('event'),
          date: currentDate,
          type: 'strat_leak',
          partnerTeamId: partnerTeam.id,
          partnerTeamName: partnerTeam.name,
          description: `Someone from ${partnerTeam.name} shared your strategies on social media.`,
          relationshipChange: SCRIM_CONSTANTS.RELATIONSHIP_EVENTS.strat_leak,
        };
      }
    }

    // Unprofessional behavior (more likely in competitive scrims)
    if (intensity === 'competitive' && Math.random() < 0.05) {
      return {
        id: this.generateId('event'),
        date: currentDate,
        type: 'unprofessional',
        partnerTeamId: partnerTeam.id,
        partnerTeamName: partnerTeam.name,
        description: `${partnerTeam.name} was unprofessional during the scrim.`,
        relationshipChange: SCRIM_CONSTANTS.RELATIONSHIP_EVENTS.unprofessional,
      };
    }

    // Scheduling issues
    if (Math.random() < 0.03) {
      return {
        id: this.generateId('event'),
        date: currentDate,
        type: 'scheduling_issue',
        partnerTeamId: partnerTeam.id,
        partnerTeamName: partnerTeam.name,
        description: `${partnerTeam.name} arrived late to the scrim.`,
        relationshipChange: SCRIM_CONSTANTS.RELATIONSHIP_EVENTS.scheduling_issue,
      };
    }

    // Positive feedback (most common)
    if (Math.random() < 0.15) {
      return {
        id: this.generateId('event'),
        date: currentDate,
        type: 'positive_feedback',
        partnerTeamId: partnerTeam.id,
        partnerTeamName: partnerTeam.name,
        description: `${partnerTeam.name} praised your team's practice quality!`,
        relationshipChange: SCRIM_CONSTANTS.RELATIONSHIP_EVENTS.positive_feedback,
      };
    }

    // No event this time
    return undefined;
  }

  /**
   * Calculate relationship change from scrim
   */
  calculateRelationshipChange(
    maps: MapResult[],
    intensity: ScrimIntensity,
    event?: RelationshipEvent
  ): number {
    // Base change: +1-3 for completing a scrim
    let change = 1 + Math.random() * 2;

    // Competitive scrims build more trust
    if (intensity === 'competitive') {
      change *= 1.3;
    }

    // Close games build more respect
    const avgMargin =
      maps.reduce((sum, m) => sum + Math.abs(m.teamAScore - m.teamBScore), 0) / maps.length;
    if (avgMargin < 3) {
      change *= 1.2; // Close games
    }

    // Apply event change if any
    if (event) {
      change += event.relationshipChange;
    }

    return Math.round(change * 10) / 10;
  }

  // ============================================
  // Default Map Pool Initialization
  // ============================================

  /**
   * Create a default map pool for a new team
   */
  createDefaultMapPool(): MapPoolStrength {
    const maps: Record<string, MapStrength> = {};

    for (const mapName of MAPS) {
      maps[mapName] = {
        mapName,
        attributes: {
          executes: 40 + Math.random() * 15,
          retakes: 40 + Math.random() * 15,
          utility: 40 + Math.random() * 15,
          communication: 45 + Math.random() * 15,
          mapControl: 40 + Math.random() * 15,
          antiStrat: 30 + Math.random() * 15,
        },
        lastPracticedDate: null,
        totalPracticeHours: 0,
        decayRate: SCRIM_CONSTANTS.MAP_DECAY_RATE,
      };
    }

    return {
      maps,
      strongestMaps: this.calculateStrongestMaps(maps),
      banPriority: this.calculateBanPriority(maps),
    };
  }

  // ============================================
  // Match Bonus Calculation
  // ============================================

  /**
   * Calculate map strength bonus for actual matches
   * Used by MatchSimulator to add map-specific advantage
   */
  calculateMapBonus(mapStrength: MapStrength): number {
    const overall = this.calculateMapOverall(mapStrength);
    // Scale from 0 to MAX_MAP_BONUS (15%) based on overall strength
    return (overall / 100) * SCRIM_CONSTANTS.MAX_MAP_BONUS;
  }
}

// Export singleton instance
export const scrimEngine = new ScrimEngine();
