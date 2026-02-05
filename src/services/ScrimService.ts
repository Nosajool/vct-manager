// ScrimService - Orchestrates scrim operations
// Connects ScrimEngine and TierTeamGenerator with the Zustand store

import { useGameStore } from '../store';
import { scrimEngine, tierTeamGenerator } from '../engine/scrim';
import type {
  Team,
  Player,
  TierTeam,
  TeamTier,
  ScrimOptions,
  ScrimResult,
  ScrimRelationship,
  WeeklyScrimTracker,
} from '../types';
import { SCRIM_CONSTANTS } from '../types/scrim';

/**
 * ScrimService - Handles all scrim-related operations
 */
export class ScrimService {
  // In-memory tracking of weekly scrim sessions
  private weeklyTracker: Map<string, WeeklyScrimTracker> = new Map();

  // ============================================
  // Scrim Scheduling
  // ============================================

  /**
   * Schedule and execute a scrim session
   */
  scheduleScrim(
    options: ScrimOptions
  ): { success: boolean; result?: ScrimResult; error?: string } {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) {
      return { success: false, error: 'No player team found' };
    }

    // Check weekly limit
    const weeklyCheck = this.checkWeeklyLimit();
    if (!weeklyCheck.canScrim) {
      return { success: false, error: weeklyCheck.reason };
    }

    // Get player team and players
    const playerTeam = state.teams[playerTeamId];
    if (!playerTeam) {
      return { success: false, error: 'Player team not found' };
    }

    const playerTeamPlayers = playerTeam.playerIds
      .map((id) => state.players[id])
      .filter((p): p is Player => p !== undefined);

    if (playerTeamPlayers.length < 5) {
      return { success: false, error: 'Need at least 5 players on roster' };
    }

    // Get partner team (T1, T2, or T3)
    const partnerTeam = this.getPartnerTeam(options.partnerTeamId);
    if (!partnerTeam) {
      return { success: false, error: 'Partner team not found' };
    }

    const partnerPlayers = this.getPartnerPlayers(partnerTeam);

    // Get or create relationship
    const relationship = this.getOrCreateRelationship(
      playerTeam,
      partnerTeam
    );

    // Calculate team strengths
    const playerTeamStrength = this.calculateTeamStrength(playerTeam, playerTeamPlayers);
    const partnerStrength = this.calculatePartnerStrength(partnerTeam, partnerPlayers);

    // Calculate efficiency
    const efficiency = scrimEngine.calculateEfficiency(
      partnerTeam.tier,
      relationship.relationshipScore
    );

    // Select maps
    const mapPool = playerTeam.mapPool || scrimEngine.createDefaultMapPool();
    const mapsToPlay = scrimEngine.selectScrimMaps(options, mapPool);

    // Capture "before" snapshot for display
    const chemistryBefore = playerTeam.chemistry.overall;
    const relationshipBefore = relationship.relationshipScore;
    const mapStatsBefore: Record<string, typeof mapPool.maps[string]['attributes']> = {};
    for (const mapName of mapsToPlay) {
      const mapStrength = mapPool.maps[mapName];
      if (mapStrength) {
        mapStatsBefore[mapName] = { ...mapStrength.attributes };
      }
    }

    // Simulate each map
    const maps = mapsToPlay.map((mapName) =>
      scrimEngine.simulateScrimMap(
        playerTeamStrength,
        partnerStrength,
        mapName,
        playerTeamPlayers,
        partnerPlayers,
        options.intensity
      )
    );

    // Calculate improvements
    const mapImprovements = scrimEngine.calculateMapImprovements(
      mapsToPlay,
      options.focusAttributes,
      efficiency,
      options.intensity
    );

    // Calculate chemistry changes
    const chemistryChanges = scrimEngine.calculateChemistryChanges(
      playerTeamPlayers,
      maps,
      options.intensity
    );

    // Roll for relationship event
    const relationshipEvent = scrimEngine.rollRelationshipEvent(
      relationship,
      partnerTeam,
      options.intensity,
      state.calendar.currentDate
    );

    // Calculate relationship change
    const relationshipChange = scrimEngine.calculateRelationshipChange(
      maps,
      options.intensity,
      relationshipEvent
    );

    // Determine winner
    const winsA = maps.filter((m) => m.winner === 'teamA').length;
    const overallWinner = winsA > maps.length / 2 ? playerTeamId : options.partnerTeamId;

    // Build result
    const result: ScrimResult = {
      id: `scrim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: state.calendar.currentDate,
      playerTeamId,
      partnerTeamId: options.partnerTeamId,
      partnerTeamName: partnerTeam.name,
      partnerTier: partnerTeam.tier,
      maps,
      overallWinner,
      mapImprovements,
      chemistryChange: chemistryChanges.overallChange,
      pairChemistryChanges: chemistryChanges.pairChanges,
      relationshipChange,
      relationshipEvent,
      efficiencyMultiplier: efficiency,
      duration: options.format === 'single_map' ? 1 : options.format === 'best_of_3' ? 3 : 5,
      // "Before" snapshots for "old → new" display
      chemistryBefore,
      relationshipBefore,
      mapStatsBefore,
    };

    // Apply results to store
    this.applyScrimResults(result, playerTeamId);

    // Track scrim usage
    this.recordScrimSession(options.partnerTeamId);

    // Mark calendar event as processed
    this.markScrimEventProcessed();

    return { success: true, result };
  }

  /**
   * Apply scrim results to store
   */
  private applyScrimResults(result: ScrimResult, playerTeamId: string): void {
    const state = useGameStore.getState();

    // 1. Update map pool strengths
    state.applyMapPoolImprovements(
      playerTeamId,
      result.mapImprovements,
      result.date
    );

    // 2. Update chemistry (immediate visibility)
    const currentTeam = state.teams[playerTeamId];
    if (currentTeam) {
      const newOverall = Math.max(
        0,
        Math.min(100, currentTeam.chemistry.overall + result.chemistryChange)
      );

      // Merge pair chemistry changes
      const newPairs = { ...currentTeam.chemistry.pairs };
      for (const [p1, changes] of Object.entries(result.pairChemistryChanges)) {
        if (!newPairs[p1]) newPairs[p1] = {};
        for (const [p2, change] of Object.entries(changes)) {
          const current = newPairs[p1][p2] || 50;
          newPairs[p1][p2] = Math.max(0, Math.min(100, current + change));
        }
      }

      state.updateTeamChemistry(playerTeamId, {
        overall: newOverall,
        pairs: newPairs,
      });
    }

    // 3. Update relationship
    state.updateScrimRelationship(
      playerTeamId,
      result.partnerTeamId,
      result.relationshipChange,
      result.date
    );

    // 4. Increment VOD leak risk
    state.incrementVodLeakRisk(playerTeamId, result.partnerTeamId);

    // 5. Store scrim result in history
    state.addScrimResult(result);
  }

  // ============================================
  // Partner Team Management
  // ============================================

  /**
   * Get a partner team (T1, T2, or T3)
   */
  private getPartnerTeam(teamId: string): (Team & { tier: TeamTier }) | TierTeam | null {
    const state = useGameStore.getState();

    // Check T1 teams first
    const t1Team = state.teams[teamId];
    if (t1Team) {
      return { ...t1Team, tier: 'T1' as TeamTier };
    }

    // Check T2/T3 teams
    const tierTeam = state.tierTeams[teamId];
    if (tierTeam) {
      return tierTeam;
    }

    return null;
  }

  /**
   * Get players for a partner team
   */
  private getPartnerPlayers(team: (Team & { tier: TeamTier }) | TierTeam): Player[] {
    const state = useGameStore.getState();
    const playerIds = 'playerIds' in team ? team.playerIds : [];

    return playerIds
      .map((id) => state.players[id])
      .filter((p): p is Player => p !== undefined);
  }

  /**
   * Get available scrim partners for the player's team
   */
  getAvailablePartners(): {
    t1Teams: (Team & { tier: TeamTier })[];
    t2Teams: TierTeam[];
    t3Teams: TierTeam[];
  } {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    const playerTeam = playerTeamId ? state.teams[playerTeamId] : null;

    // T1: All VCT teams except player's team
    const t1Teams = Object.values(state.teams)
      .filter((t) => t.id !== playerTeamId)
      .map((t) => ({ ...t, tier: 'T1' as TeamTier }));

    // T2/T3: From tier teams, prefer same region
    const allTierTeams = Object.values(state.tierTeams);
    const t2Teams = allTierTeams.filter((t) => t.tier === 'T2');
    const t3Teams = allTierTeams.filter((t) => t.tier === 'T3');

    // Sort by region preference (same region first)
    if (playerTeam) {
      const sortByRegion = (a: TierTeam, b: TierTeam) => {
        const aMatch = a.region === playerTeam.region ? 0 : 1;
        const bMatch = b.region === playerTeam.region ? 0 : 1;
        return aMatch - bMatch;
      };
      t2Teams.sort(sortByRegion);
      t3Teams.sort(sortByRegion);
    }

    return { t1Teams, t2Teams, t3Teams };
  }

  /**
   * Get or create a relationship with a partner team
   */
  private getOrCreateRelationship(
    playerTeam: Team,
    partnerTeam: (Team & { tier: TeamTier }) | TierTeam
  ): ScrimRelationship {
    const state = useGameStore.getState();
    const existing = playerTeam.scrimRelationships?.[partnerTeam.id];

    if (existing) {
      return existing;
    }

    // Create new relationship
    const isSameRegion = playerTeam.region === partnerTeam.region;
    state.initializeScrimRelationship(
      playerTeam.id,
      partnerTeam.id,
      partnerTeam.tier,
      isSameRegion
    );

    // Return the newly created relationship
    return {
      teamId: partnerTeam.id,
      tier: partnerTeam.tier,
      relationshipScore: isSameRegion
        ? SCRIM_CONSTANTS.BASE_RELATIONSHIP.SAME_REGION
        : SCRIM_CONSTANTS.BASE_RELATIONSHIP.CROSS_REGION,
      lastScrimDate: null,
      totalScrims: 0,
      vodLeakRisk: 0,
    };
  }

  // ============================================
  // Team Strength Calculation
  // ============================================

  private calculateTeamStrength(team: Team, players: Player[]): number {
    if (players.length === 0) return 50;

    let totalStrength = 0;
    for (const player of players) {
      const playerStrength =
        player.stats.mechanics * 0.3 +
        player.stats.igl * 0.15 +
        player.stats.mental * 0.15 +
        player.stats.clutch * 0.1 +
        player.stats.entry * 0.1 +
        player.stats.support * 0.1 +
        player.stats.lurking * 0.05 +
        player.stats.vibes * 0.05;

      const formModifier = 1 + ((player.form - 70) / 100) * 0.1;
      totalStrength += playerStrength * formModifier;
    }

    const avgStrength = totalStrength / players.length;
    const chemistryBonus = 1 + (team.chemistry.overall / 100) * 0.2;

    return avgStrength * chemistryBonus;
  }

  private calculatePartnerStrength(
    team: (Team & { tier: TeamTier }) | TierTeam,
    players: Player[]
  ): number {
    if ('averageOverall' in team && players.length === 0) {
      // TierTeam with no players loaded - use average overall
      return team.averageOverall;
    }

    if (players.length === 0) return 50;

    let totalStrength = 0;
    for (const player of players) {
      const playerStrength =
        player.stats.mechanics * 0.3 +
        player.stats.igl * 0.15 +
        player.stats.mental * 0.15 +
        player.stats.clutch * 0.1 +
        player.stats.entry * 0.1 +
        player.stats.support * 0.1 +
        player.stats.lurking * 0.05 +
        player.stats.vibes * 0.05;

      const formModifier = 1 + ((player.form - 70) / 100) * 0.1;
      totalStrength += playerStrength * formModifier;
    }

    return totalStrength / players.length;
  }

  // ============================================
  // Weekly Tracking
  // ============================================

  /**
   * Check if player can scrim this week
   */
  checkWeeklyLimit(): {
    canScrim: boolean;
    scrimsUsed: number;
    reason?: string;
  } {
    const currentDate = useGameStore.getState().calendar.currentDate;
    const weekStart = this.getWeekStart(currentDate);
    const tracker = this.weeklyTracker.get(weekStart);
    const scrimsUsed = tracker?.scrimsUsed ?? 0;

    if (scrimsUsed >= SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS) {
      return {
        canScrim: false,
        scrimsUsed,
        reason: `Maximum ${SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS} scrims per week reached`,
      };
    }

    return { canScrim: true, scrimsUsed };
  }

  /**
   * Get remaining scrim slots this week
   */
  getRemainingScrimSlots(): number {
    const { scrimsUsed } = this.checkWeeklyLimit();
    return Math.max(0, SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS - scrimsUsed);
  }

  /**
   * Record a scrim session
   */
  private recordScrimSession(partnerTeamId: string): void {
    const currentDate = useGameStore.getState().calendar.currentDate;
    const weekStart = this.getWeekStart(currentDate);

    const existing = this.weeklyTracker.get(weekStart);
    if (existing) {
      existing.scrimsUsed += 1;
      if (!existing.partnersUsedThisWeek.includes(partnerTeamId)) {
        existing.partnersUsedThisWeek.push(partnerTeamId);
      }
    } else {
      this.weeklyTracker.set(weekStart, {
        weekStart,
        scrimsUsed: 1,
        maxScrims: SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS,
        partnersUsedThisWeek: [partnerTeamId],
      });
    }
  }

  /**
   * Get the start of the week (Monday) for a date
   */
  private getWeekStart(isoDate: string): string {
    const date = new Date(isoDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
  }

  /**
   * Mark scrim calendar event as processed
   */
  private markScrimEventProcessed(): void {
    const state = useGameStore.getState();
    const todaysActivities = state.getTodaysActivities();
    const scrimEvent = todaysActivities.find((e) => e.type === 'scrim_available');
    if (scrimEvent) {
      state.markEventProcessed(scrimEvent.id);
    }
  }

  // ============================================
  // Map Pool Management
  // ============================================

  /**
   * Apply weekly map decay to unpracticed maps
   */
  applyWeeklyMapDecay(): void {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    if (!playerTeamId) return;

    const team = state.teams[playerTeamId];
    if (!team?.mapPool) return;

    const currentDate = state.calendar.currentDate;

    // Get maps practiced this week from scrim history
    const weekStart = this.getWeekStart(currentDate);
    const practicedMaps = state.scrimHistory
      .filter((s) => s.date >= weekStart)
      .flatMap((s) => s.maps.map((m) => m.map));

    const uniquePracticedMaps = [...new Set(practicedMaps)];

    // Apply decay
    const decayedMapPool = scrimEngine.applyMapDecay(
      team.mapPool,
      currentDate,
      uniquePracticedMaps
    );

    state.updateTeamMapPool(playerTeamId, decayedMapPool);
  }

  /**
   * Get summary of map pool status
   */
  getMapPoolSummary(): {
    strongestMaps: { map: string; strength: number }[];
    weakestMaps: { map: string; strength: number }[];
    needsPractice: string[];
  } {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    if (!playerTeamId) {
      return { strongestMaps: [], weakestMaps: [], needsPractice: [] };
    }

    const team = state.teams[playerTeamId];
    if (!team?.mapPool) {
      return { strongestMaps: [], weakestMaps: [], needsPractice: [] };
    }

    const mapStrengths = Object.entries(team.mapPool.maps).map(([name, map]) => ({
      map: name,
      strength: scrimEngine.calculateMapOverall(map),
      lastPracticed: map.lastPracticedDate,
    }));

    // Sort by strength
    const sorted = [...mapStrengths].sort((a, b) => b.strength - a.strength);

    // Find maps needing practice (not practiced in 2 weeks or low strength)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const cutoff = twoWeeksAgo.toISOString();

    const needsPractice = mapStrengths
      .filter((m) => !m.lastPracticed || m.lastPracticed < cutoff || m.strength < 45)
      .map((m) => m.map);

    return {
      strongestMaps: sorted.slice(0, 3),
      weakestMaps: sorted.slice(-3).reverse(),
      needsPractice,
    };
  }

  // ============================================
  // Relationship Management
  // ============================================

  /**
   * Get relationship status with a partner
   */
  getRelationshipStatus(partnerTeamId: string): ScrimRelationship | null {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    if (!playerTeamId) return null;

    return state.teams[playerTeamId]?.scrimRelationships?.[partnerTeamId] || null;
  }

  /**
   * Get all relationships for the player team
   */
  getAllRelationships(): ScrimRelationship[] {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    if (!playerTeamId) return [];

    const relationships = state.teams[playerTeamId]?.scrimRelationships;
    return relationships ? Object.values(relationships) : [];
  }

  /**
   * Get scrim history with a specific partner
   */
  getScrimHistoryWithPartner(partnerTeamId: string): ScrimResult[] {
    const state = useGameStore.getState();
    return state.scrimHistory.filter((s) => s.partnerTeamId === partnerTeamId);
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Reset weekly tracker (called at start of new week)
   */
  resetWeeklyTracker(): void {
    this.weeklyTracker.clear();
  }

  /**
   * Initialize T2/T3 teams for a region
   */
  initializeTierTeams(freeAgents: Player[]): void {
    const state = useGameStore.getState();
    const tierTeams = tierTeamGenerator.generateAllTierTeams(freeAgents);
    state.addTierTeams(tierTeams);
  }
}

// Export singleton instance
export const scrimService = new ScrimService();
