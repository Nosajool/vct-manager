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
  ScrimEligibilityCheck,
  MapStrengthAttributes,
} from '../types';
import { SCRIM_CONSTANTS } from '../types/scrim';

/**
 * ScrimService - Handles all scrim-related operations
 */
export class ScrimService {

  // ============================================
  // Scrim Scheduling
  // ============================================

  /**
   * Generate auto-configuration for a scrim
   * Used when user wants quick setup (at 80% efficiency)
   * Picks partner from existing relationships, team's strongest maps, moderate intensity
   */
  generateAutoConfig(): ScrimOptions | null {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) {
      return null;
    }

    const playerTeam = state.teams[playerTeamId];
    if (!playerTeam) {
      return null;
    }

    // 1. Pick partner from existing relationships (prefer best relationship)
    let partnerTeamId: string | null = null;
    const relationships = Object.values(playerTeam.scrimRelationships || {});

    if (relationships.length > 0) {
      // Sort by relationship score, pick the best one
      const sortedRelationships = [...relationships].sort(
        (a, b) => b.relationshipScore - a.relationshipScore
      );
      partnerTeamId = sortedRelationships[0].teamId;
    } else {
      // No relationships yet, pick a T2 team from available partners
      const availablePartners = this.getAvailablePartners();
      if (availablePartners.t2Teams.length > 0) {
        partnerTeamId = availablePartners.t2Teams[0].id;
      } else if (availablePartners.t3Teams.length > 0) {
        partnerTeamId = availablePartners.t3Teams[0].id;
      } else if (availablePartners.t1Teams.length > 0) {
        partnerTeamId = availablePartners.t1Teams[0].id;
      }
    }

    if (!partnerTeamId) {
      return null;
    }

    // 2. Pick team's strongest maps
    const mapPool = playerTeam.mapPool;
    const strongestMaps = mapPool?.strongestMaps || [];

    // 3. Create config with moderate intensity
    return {
      partnerTeamId,
      format: 'best_of_3',
      focusMaps: strongestMaps.length > 0 ? strongestMaps.slice(0, 3) : undefined,
      intensity: 'moderate',
    };
  }

  /**
   * Schedule scrim with efficiency modifier
   * Used for auto-configured scrims (0.8 modifier) or other efficiency adjustments
   *
   * NOTE: Only map improvements are scaled by the modifier.
   * Chemistry, relationship changes, and VOD leak risk are NOT scaled.
   */
  scheduleScrimWithModifier(
    options: ScrimOptions,
    modifier: number
  ): { success: boolean; result?: ScrimResult; error?: string } {
    // If modifier is 1.0, just use regular scheduleScrim
    if (modifier === 1.0) {
      return this.scheduleScrim(options);
    }

    // Execute the base scrim
    const scrimResult = this.scheduleScrim(options);

    // If scrim failed or no result, return as-is
    if (!scrimResult.success || !scrimResult.result) {
      return scrimResult;
    }

    const result = scrimResult.result;
    const state = useGameStore.getState();

    // Apply efficiency modifier to map improvements only
    const scaledMapImprovements: Record<string, Partial<MapStrengthAttributes>> = {};
    for (const [mapName, improvements] of Object.entries(result.mapImprovements)) {
      scaledMapImprovements[mapName] = {};
      for (const [attr, value] of Object.entries(improvements)) {
        scaledMapImprovements[mapName][attr as keyof MapStrengthAttributes] = value * modifier;
      }
    }

    // Reverse the original map improvements that were already applied
    const reverseImprovements: Record<string, Partial<MapStrengthAttributes>> = {};
    for (const [mapName, improvements] of Object.entries(result.mapImprovements)) {
      reverseImprovements[mapName] = {};
      for (const [attr, value] of Object.entries(improvements)) {
        reverseImprovements[mapName][attr as keyof MapStrengthAttributes] = -value;
      }
    }

    // Apply reverse to undo original improvements
    state.applyMapPoolImprovements(
      result.playerTeamId,
      reverseImprovements,
      result.date
    );

    // Apply scaled improvements
    state.applyMapPoolImprovements(
      result.playerTeamId,
      scaledMapImprovements,
      result.date
    );

    // Create modified result with scaled values
    const modifiedResult: ScrimResult = {
      ...result,
      mapImprovements: scaledMapImprovements,
      efficiencyMultiplier: result.efficiencyMultiplier * modifier,
    };

    // Update the stored result in scrim history
    // Remove the original result and add the modified one
    const scrimHistory = state.scrimHistory;
    const updatedHistory = scrimHistory.map(s =>
      s.id === result.id ? modifiedResult : s
    );

    // Use Zustand's internal set mechanism (via a direct store update)
    // Since we can't access 'set' here, we'll use the store's setState
    useGameStore.setState({ scrimHistory: updatedHistory });

    return { success: true, result: modifiedResult };
  }

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

    // Comprehensive eligibility check
    const eligibilityCheck = this.checkScrimEligibility();
    if (!eligibilityCheck.canScrim) {
      return { success: false, error: eligibilityCheck.reason || 'Cannot schedule scrim' };
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
   * Get the start of the week (Monday) for a date
   * Used for map decay tracking
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
   * Comprehensive eligibility check for scheduling scrims
   * Checks match day restrictions and player requirements
   */
  checkScrimEligibility(): ScrimEligibilityCheck {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    const failedChecks: Array<'match_day' | 'player_count'> = [];

    // Check 1: Player team exists and has enough players
    if (!playerTeamId) {
      return {
        canScrim: false,
        reason: 'No player team found',
        failedChecks: ['player_count'],
      };
    }

    const playerTeam = state.teams[playerTeamId];
    if (!playerTeam) {
      return {
        canScrim: false,
        reason: 'Player team not found',
        failedChecks: ['player_count'],
      };
    }

    const playerCount = playerTeam.playerIds.length;
    if (playerCount < 5) {
      failedChecks.push('player_count');
    }

    // Check 2: Match day restriction (can't scrim on match days)
    const todaysActivities = state.getTodaysActivities();
    const hasMatchToday = todaysActivities.some((e) => {
      if (e.type !== 'match' || e.processed) return false;
      const data = e.data as { homeTeamId?: string; awayTeamId?: string };
      return data.homeTeamId === playerTeamId || data.awayTeamId === playerTeamId;
    });

    if (hasMatchToday) {
      failedChecks.push('match_day');
    }

    // Determine primary reason for failure
    let reason: string | undefined;
    if (failedChecks.length > 0) {
      if (failedChecks.includes('match_day')) {
        reason = 'Cannot schedule scrims on match days';
      } else if (failedChecks.includes('player_count')) {
        reason = `Need at least 5 players on roster (current: ${playerCount})`;
      }
    }

    return {
      canScrim: failedChecks.length === 0,
      reason,
      failedChecks,
    };
  }

  /**
   * Mark scrim calendar event as processed
   */
  private markScrimEventProcessed(): void {
    const state = useGameStore.getState();
    const todaysActivities = state.getTodaysActivities();
    const scrimEvent = todaysActivities.find((e) => e.type === 'scheduled_scrim');
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
  // Relationship Analytics
  // ============================================

  /**
   * Get comprehensive relationship statistics
   */
  getRelationshipStats(): {
    totalScrims: number;
    avgRelationshipScore: number;
    t1Partners: number;
    t2Partners: number;
    t3Partners: number;
    highVodRiskCount: number;
    distribution: Record<string, number>;
  } {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    const relationships = playerTeamId
      ? Object.values(state.teams[playerTeamId]?.scrimRelationships || {})
      : [];

    const totalScrims = relationships.reduce((sum, r) => sum + r.totalScrims, 0);
    const avgScore =
      relationships.length > 0
        ? relationships.reduce((sum, r) => sum + r.relationshipScore, 0) /
          relationships.length
        : 0;

    const tierCounts = { T1: 0, T2: 0, T3: 0 };
    const distribution: Record<string, number> = {
      Excellent: 0,
      Good: 0,
      Neutral: 0,
      Poor: 0,
      Hostile: 0,
    };

    let highVodRiskCount = 0;

    for (const rel of relationships) {
      // Count by tier
      tierCounts[rel.tier]++;

      // Count by relationship status
      if (rel.relationshipScore >= 80) distribution.Excellent++;
      else if (rel.relationshipScore >= 60) distribution.Good++;
      else if (rel.relationshipScore >= 40) distribution.Neutral++;
      else if (rel.relationshipScore >= 20) distribution.Poor++;
      else distribution.Hostile++;

      // Count high VOD risks
      if (rel.vodLeakRisk > 50) highVodRiskCount++;
    }

    return {
      totalScrims,
      avgRelationshipScore: Math.round(avgScore),
      t1Partners: tierCounts.T1,
      t2Partners: tierCounts.T2,
      t3Partners: tierCounts.T3,
      highVodRiskCount,
      distribution,
    };
  }

  /**
   * Calculate scrim effectiveness score for a partner
   * Effectiveness = base tier efficiency + relationship bonus
   */
  calculatePartnerEffectiveness(relationship: ScrimRelationship): number {
    const tierEfficiency = SCRIM_CONSTANTS.TIER_EFFICIENCY[relationship.tier];
    const relationshipBonus = (relationship.relationshipScore / 100) * 0.3; // Up to +30%
    return tierEfficiency + relationshipBonus;
  }

  /**
   * Get all relationships sorted by effectiveness
   */
  getRelationshipsByEffectiveness(): Array<ScrimRelationship & { effectiveness: number }> {
    const relationships = this.getAllRelationships();
    return relationships
      .map((rel) => ({
        ...rel,
        effectiveness: this.calculatePartnerEffectiveness(rel),
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Get win/loss record against a specific partner
   */
  getWinLossRecord(partnerTeamId: string): { wins: number; losses: number } {
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;
    if (!playerTeamId) return { wins: 0, losses: 0 };

    const history = state.scrimHistory.filter((s) => s.partnerTeamId === partnerTeamId);
    const wins = history.filter((s) => s.overallWinner === playerTeamId).length;
    const losses = history.length - wins;

    return { wins, losses };
  }

  /**
   * Get recommendations based on current state
   */
  getRecommendations(): Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }> {
    const recommendations: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }> = [];
    const state = useGameStore.getState();
    const playerTeamId = state.playerTeamId;

    if (!playerTeamId) return recommendations;

    // Check 1: VOD Risk warnings
    const relationships = this.getAllRelationships();
    for (const rel of relationships) {
      if (rel.vodLeakRisk > 50) {
        const teamName = this.getPartnerName(rel.teamId);
        recommendations.push({
          type: 'vod_risk',
          message: `Take a break from ${teamName} - VOD leak risk at ${rel.vodLeakRisk}%`,
          priority: 'high',
        });
      }
    }

    // Check 2: Tier balance
    const tierCounts = { T1: 0, T2: 0, T3: 0 };
    for (const rel of relationships) {
      tierCounts[rel.tier]++;
    }
    if (tierCounts.T1 < 2 && relationships.length > 3) {
      recommendations.push({
        type: 'tier_balance',
        message: 'Build more T1 relationships for competitive practice',
        priority: 'low',
      });
    }

    // Check 3: Map pool decay
    const mapSummary = this.getMapPoolSummary();
    if (mapSummary.needsPractice.length > 0) {
      const maps = mapSummary.needsPractice.slice(0, 2).join(', ');
      recommendations.push({
        type: 'map_practice',
        message: `${maps} need${mapSummary.needsPractice.length === 1 ? 's' : ''} practice (14+ days since last scrim)`,
        priority: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Get partner name by ID
   */
  private getPartnerName(teamId: string): string {
    const state = useGameStore.getState();
    const t1Team = state.teams[teamId];
    if (t1Team) return t1Team.name;
    const tierTeam = state.tierTeams[teamId];
    if (tierTeam) return tierTeam.name;
    return 'Unknown Team';
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
