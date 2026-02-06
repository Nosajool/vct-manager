// SummaryCalculator - Derives round summary ONLY from timeline events
// PRINCIPLE: If an event is not in the timeline, it MUST NOT appear in the summary

import type {
  TimelineEvent,
  SimKillEvent,
  SimDamageEvent,
  PlantCompleteEvent,
  AbilityUseEvent,
  HealEvent,
  RoundEndEvent,
  TradeKillEvent,
  DerivedRoundSummary,
  ClutchAttemptInfo,
  PlayerRoundState,
} from '../../types/round-simulation';

/**
 * Input for summary calculation
 */
export interface SummaryCalculationInput {
  /** Timeline of all events that occurred in the round */
  timeline: TimelineEvent[];
  /** Map of player IDs to their round states (for name lookups) */
  playerStates: Map<string, PlayerRoundState>;
  /** Team A player IDs (for determining team sides) */
  teamAPlayerIds: Set<string>;
  /** Team B player IDs (for determining team sides) */
  teamBPlayerIds: Set<string>;
}

/**
 * SummaryCalculator
 *
 * Derives round summary statistics ONLY from timeline events.
 * Never generates or assumes data that isn't explicitly in the timeline.
 */
export class SummaryCalculator {
  /**
   * Derive complete round summary from timeline
   */
  deriveFromTimeline(input: SummaryCalculationInput): DerivedRoundSummary {
    const { timeline, playerStates, teamAPlayerIds, teamBPlayerIds } = input;

    // Extract round end event (should always be present)
    const roundEndEvent = timeline.find(e => e.type === 'round_end') as RoundEndEvent | undefined;
    if (!roundEndEvent) {
      throw new Error('Timeline must contain a round_end event');
    }

    // Derive all summary fields from timeline
    return {
      // First blood
      firstBlood: this.extractFirstBlood(timeline, playerStates),

      // Spike events
      spikePlanted: this.hasEventType(timeline, 'plant_complete'),
      plantSite: this.extractPlantSite(timeline),
      spikeDefused: this.hasEventType(timeline, 'defuse_complete'),
      spikeDetonated: this.hasEventType(timeline, 'spike_detonation'),
      plantsAttempted: this.countEventType(timeline, 'plant_start'),
      plantsInterrupted: this.countEventType(timeline, 'plant_interrupt'),
      defusesAttempted: this.countEventType(timeline, 'defuse_start'),
      defusesInterrupted: this.countEventType(timeline, 'defuse_interrupt'),

      // Clutch
      clutchAttempt: this.detectClutch(timeline, playerStates, teamAPlayerIds, teamBPlayerIds),

      // Combat stats
      totalKills: this.countKills(timeline),
      totalHeadshots: this.countHeadshots(timeline),
      headshotPercentage: this.calculateHeadshotPercentage(timeline),
      totalDamage: this.sumTotalDamage(timeline),
      tradeKills: this.countEventType(timeline, 'trade_kill'),

      // Round info
      roundDuration: this.calculateRoundDuration(timeline),
      winCondition: roundEndEvent.winCondition,
      winner: roundEndEvent.winner,

      // Ability usage
      abilitiesUsed: this.countAbilities(timeline),
      ultimatesUsed: this.countUltimates(timeline),
      healsApplied: this.countEventType(timeline, 'heal'),
      totalHealing: this.sumTotalHealing(timeline),
    };
  }

  // ============================================
  // FIRST BLOOD
  // ============================================

  private extractFirstBlood(
    timeline: TimelineEvent[],
    playerStates: Map<string, PlayerRoundState>
  ): DerivedRoundSummary['firstBlood'] {
    // Find first kill event (not trade kill)
    const firstKill = timeline.find(e => e.type === 'kill') as SimKillEvent | undefined;
    if (!firstKill) return null;

    const killerState = playerStates.get(firstKill.killerId);
    const victimState = playerStates.get(firstKill.victimId);

    return {
      killerId: firstKill.killerId,
      killerName: killerState?.playerName || 'Unknown',
      victimId: firstKill.victimId,
      victimName: victimState?.playerName || 'Unknown',
      timestamp: firstKill.timestamp,
      weapon: firstKill.weapon,
    };
  }

  // ============================================
  // SPIKE EVENTS
  // ============================================

  private extractPlantSite(timeline: TimelineEvent[]): 'A' | 'B' | null {
    const plantEvent = timeline.find(e => e.type === 'plant_complete') as PlantCompleteEvent | undefined;
    return plantEvent?.site || null;
  }

  // ============================================
  // CLUTCH DETECTION
  // ============================================

  /**
   * Detect clutch situations from kill timeline
   * A clutch is when one player faces 2+ opponents
   */
  private detectClutch(
    timeline: TimelineEvent[],
    playerStates: Map<string, PlayerRoundState>,
    teamAPlayerIds: Set<string>,
    teamBPlayerIds: Set<string>
  ): ClutchAttemptInfo | null {
    // Get all kill events (including trade kills)
    const killEvents = timeline.filter(e =>
      e.type === 'kill' || e.type === 'trade_kill'
    ) as (SimKillEvent | TradeKillEvent)[];

    if (killEvents.length < 2) return null;

    // Track alive players after each kill
    let aliveTeamA = new Set(teamAPlayerIds);
    let aliveTeamB = new Set(teamBPlayerIds);

    let clutchInfo: ClutchAttemptInfo | null = null;
    let clutchStartTimestamp: number | null = null;

    // Scan through kills chronologically
    for (const kill of killEvents) {
      const victimId = kill.victimId;

      // Remove victim from alive set
      if (aliveTeamA.has(victimId)) {
        aliveTeamA.delete(victimId);
      } else if (aliveTeamB.has(victimId)) {
        aliveTeamB.delete(victimId);
      }

      // Check for 1vN situation (only record first clutch)
      const aCount = aliveTeamA.size;
      const bCount = aliveTeamB.size;

      if (!clutchInfo) {
        if (aCount === 1 && bCount >= 2 && bCount <= 5) {
          // Team A player in clutch
          const [playerId] = Array.from(aliveTeamA);
          const playerState = playerStates.get(playerId);
          clutchInfo = {
            playerId,
            playerName: playerState?.playerName || 'Unknown',
            situation: `1v${bCount}` as ClutchAttemptInfo['situation'],
            startTimestamp: kill.timestamp,
            won: false, // Will update after processing all kills
            killsDuring: 0,
          };
          clutchStartTimestamp = kill.timestamp;
        } else if (bCount === 1 && aCount >= 2 && aCount <= 5) {
          // Team B player in clutch
          const [playerId] = Array.from(aliveTeamB);
          const playerState = playerStates.get(playerId);
          clutchInfo = {
            playerId,
            playerName: playerState?.playerName || 'Unknown',
            situation: `1v${aCount}` as ClutchAttemptInfo['situation'],
            startTimestamp: kill.timestamp,
            won: false, // Will update after processing all kills
            killsDuring: 0,
          };
          clutchStartTimestamp = kill.timestamp;
        }
      }

      // Count kills during clutch
      if (clutchInfo && clutchStartTimestamp !== null) {
        const killerId = kill.type === 'kill' ? kill.killerId : kill.killerId;
        if (killerId === clutchInfo.playerId && kill.timestamp >= clutchStartTimestamp) {
          clutchInfo.killsDuring++;
        }
      }
    }

    // If no clutch detected, return null
    if (!clutchInfo) return null;

    // Determine if clutch was won (clutcher is still alive at round end)
    const roundEndEvent = timeline.find(e => e.type === 'round_end') as RoundEndEvent;
    clutchInfo.won = roundEndEvent.survivors.includes(clutchInfo.playerId);

    return clutchInfo;
  }

  // ============================================
  // COMBAT STATS
  // ============================================

  private countKills(timeline: TimelineEvent[]): number {
    return timeline.filter(e => e.type === 'kill').length;
  }

  private countHeadshots(timeline: TimelineEvent[]): number {
    return timeline.filter(e => e.type === 'kill' && (e as SimKillEvent).isHeadshot).length;
  }

  private calculateHeadshotPercentage(timeline: TimelineEvent[]): number {
    const totalKills = this.countKills(timeline);
    if (totalKills === 0) return 0;

    const headshots = this.countHeadshots(timeline);
    return Math.round((headshots / totalKills) * 100 * 10) / 10; // Round to 1 decimal
  }

  private sumTotalDamage(timeline: TimelineEvent[]): number {
    const damageEvents = timeline.filter(e => e.type === 'damage') as SimDamageEvent[];
    return damageEvents.reduce((sum, event) => sum + event.totalDamage, 0);
  }

  // ============================================
  // ROUND INFO
  // ============================================

  private calculateRoundDuration(timeline: TimelineEvent[]): number {
    if (timeline.length === 0) return 0;

    // Find the last event's timestamp
    const lastEvent = timeline[timeline.length - 1];
    return lastEvent.timestamp;
  }

  // ============================================
  // ABILITY USAGE
  // ============================================

  private countAbilities(timeline: TimelineEvent[]): number {
    return timeline.filter(e => e.type === 'ability_use').length;
  }

  private countUltimates(timeline: TimelineEvent[]): number {
    const abilityEvents = timeline.filter(e => e.type === 'ability_use') as AbilityUseEvent[];
    return abilityEvents.filter(e => e.slot === 'ultimate').length;
  }

  private sumTotalHealing(timeline: TimelineEvent[]): number {
    const healEvents = timeline.filter(e => e.type === 'heal') as HealEvent[];
    return healEvents.reduce((sum, event) => sum + event.amount, 0);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if timeline contains at least one event of given type
   */
  private hasEventType(timeline: TimelineEvent[], eventType: TimelineEvent['type']): boolean {
    return timeline.some(e => e.type === eventType);
  }

  /**
   * Count events of a specific type
   */
  private countEventType(timeline: TimelineEvent[], eventType: TimelineEvent['type']): number {
    return timeline.filter(e => e.type === eventType).length;
  }
}

/**
 * Singleton instance for convenience
 */
export const summaryCalculator = new SummaryCalculator();
