// Drama Condition Evaluator Engine
// Pure function module for evaluating drama event conditions

import type {
  DramaCondition,
  DramaGameStateSnapshot,
  PlayerSelector,
} from '@/types/drama';
import type { PlayerStats } from '@/types/player';

/**
 * Evaluates a single drama condition against current game state
 * Pure function - no side effects or store access
 */
export function evaluateCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  switch (condition.type) {
    // Player stat checks
    case 'player_stat_below':
      return evaluatePlayerStatCondition(condition, snapshot, 'below');
    case 'player_stat_above':
      return evaluatePlayerStatCondition(condition, snapshot, 'above');

    // Player morale checks
    case 'player_morale_below':
      return evaluatePlayerMoraleCondition(condition, snapshot, 'below');
    case 'player_morale_above':
      return evaluatePlayerMoraleCondition(condition, snapshot, 'above');

    // Player form checks
    case 'player_form_below':
      return evaluatePlayerFormCondition(condition, snapshot, 'below');
    case 'player_form_above':
      return evaluatePlayerFormCondition(condition, snapshot, 'above');

    // Team chemistry checks
    case 'team_chemistry_below':
      return condition.threshold !== undefined
        ? snapshot.playerTeamChemistry < condition.threshold
        : false;
    case 'team_chemistry_above':
      return condition.threshold !== undefined
        ? snapshot.playerTeamChemistry > condition.threshold
        : false;

    // Team streak checks
    case 'team_win_streak':
      return evaluateWinStreakCondition(condition, snapshot);
    case 'team_loss_streak':
      return evaluateLossStreakCondition(condition, snapshot);

    // Game state checks
    case 'season_phase':
      return condition.phase !== undefined
        ? snapshot.currentPhase === condition.phase
        : false;

    case 'tournament_active':
      // Tournament is active if currentPhase is one of the tournament phases
      return (
        snapshot.currentPhase === 'kickoff' ||
        snapshot.currentPhase === 'stage1' ||
        snapshot.currentPhase === 'stage1_playoffs' ||
        snapshot.currentPhase === 'stage2' ||
        snapshot.currentPhase === 'stage2_playoffs' ||
        snapshot.currentPhase === 'masters1' ||
        snapshot.currentPhase === 'masters2' ||
        snapshot.currentPhase === 'champions'
      );

    case 'match_result':
      // Check if there's a recent match result (within last 3 days)
      return hasRecentMatchResult(snapshot);

    case 'no_recent_match':
      return !hasRecentMatchResult(snapshot, condition.threshold ?? 1);

    case 'player_injured':
      // Check if any player on the team is injured
      // Note: This requires injury tracking in PlayerStats which may not exist yet
      return false; // TODO: Implement once injury system is added

    // Drama state checks
    case 'category_on_cooldown':
      return evaluateCategoryCooldown(condition, snapshot);

    case 'flag_active':
      return evaluateFlagActive(condition, snapshot);

    case 'recent_event_count':
      return evaluateRecentEventCount(condition, snapshot);

    // Player archetype checks
    case 'player_personality':
      return evaluatePlayerPersonalityCondition(condition, snapshot);

    case 'player_contract_expiring':
      return evaluatePlayerContractExpiringCondition(condition, snapshot);

    // Tournament bracket checks
    case 'bracket_position':
      return evaluateBracketPositionCondition(condition, snapshot);

    case 'elimination_risk':
      return snapshot.tournamentContext?.eliminationRisk === true;

    case 'scrim_count_min':
      return condition.threshold !== undefined
        ? (snapshot.scrimCount ?? 0) >= condition.threshold
        : false;

    case 'min_season_day': {
      const seasonYear = 2025 + snapshot.currentSeason;
      const seasonStart = new Date(`${seasonYear}-01-01T00:00:00.000Z`);
      const current = new Date(snapshot.currentDate);
      const dayOfSeason = Math.floor(
        (current.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1; // day 1-indexed
      return dayOfSeason >= (condition.threshold ?? 1);
    }

    case 'player_is_import': {
      if (!snapshot.playerTeamRegion) return false;
      const teamPlayers = snapshot.players.filter(
        (p) => p.teamId === snapshot.playerTeamId
      );
      return teamPlayers.some(
        (p) => p.region !== undefined && p.region !== snapshot.playerTeamRegion
      );
    }

    // Random chance
    case 'random_chance':
      return condition.chance !== undefined
        ? Math.random() * 100 < condition.chance
        : false;

    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Evaluates all conditions with AND logic
 * All conditions must pass for this to return true
 */
export function evaluateAllConditions(
  conditions: DramaCondition[],
  snapshot: DramaGameStateSnapshot
): boolean {
  if (conditions.length === 0) {
    return true; // No conditions = always pass
  }

  return conditions.every((condition) =>
    evaluateCondition(condition, snapshot)
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Selects a player or players based on the selector strategy
 */
function selectPlayers(
  selector: PlayerSelector | undefined,
  snapshot: DramaGameStateSnapshot,
  playerId?: string
): Array<DramaGameStateSnapshot['players'][number]> {
  const teamPlayers = snapshot.players.filter(
    (p) => p.teamId === snapshot.playerTeamId
  );

  if (!selector || selector === 'any') {
    return teamPlayers;
  }

  switch (selector) {
    case 'all':
      return teamPlayers;

    case 'specific':
      if (!playerId) return [];
      const specificPlayer = teamPlayers.find((p) => p.id === playerId);
      return specificPlayer ? [specificPlayer] : [];

    case 'star_player': {
      // Player with highest overall rating
      const starPlayer = teamPlayers.reduce((best, current) => {
        const currentRating = getPlayerOverallRating(current.stats);
        const bestRating = getPlayerOverallRating(best.stats);
        return currentRating > bestRating ? current : best;
      }, teamPlayers[0]);
      return starPlayer ? [starPlayer] : [];
    }

    case 'lowest_morale': {
      const lowestMoralePlayer = teamPlayers.reduce((lowest, current) =>
        current.morale < lowest.morale ? current : lowest
      , teamPlayers[0]);
      return lowestMoralePlayer ? [lowestMoralePlayer] : [];
    }

    case 'newest': {
      // This would require join date tracking - for now return random
      // TODO: Implement once player join dates are tracked
      const randomIndex = Math.floor(Math.random() * teamPlayers.length);
      return teamPlayers[randomIndex] ? [teamPlayers[randomIndex]] : [];
    }

    case 'random': {
      const randomIndex = Math.floor(Math.random() * teamPlayers.length);
      return teamPlayers[randomIndex] ? [teamPlayers[randomIndex]] : [];
    }

    default:
      return teamPlayers;
  }
}

/**
 * Calculates overall player rating from stats
 */
function getPlayerOverallRating(stats: PlayerStats): number {
  // Simple average of all stats
  const statValues = [
    stats.mechanics,
    stats.igl,
    stats.mental,
    stats.clutch,
    stats.vibes,
    stats.lurking,
    stats.entry,
    stats.support,
    stats.stamina,
  ];
  return statValues.reduce((sum, val) => sum + val, 0) / statValues.length;
}

/**
 * Evaluates player stat conditions (above/below threshold)
 */
function evaluatePlayerStatCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot,
  comparison: 'above' | 'below'
): boolean {
  if (condition.stat === undefined || condition.threshold === undefined) {
    return false;
  }

  const selectedPlayers = selectPlayers(
    condition.playerSelector,
    snapshot,
    condition.playerId
  );

  if (selectedPlayers.length === 0) {
    return false;
  }

  const checkPlayer = (player: typeof selectedPlayers[number]): boolean => {
    const statValue = player.stats[condition.stat!];
    if (statValue === undefined) return false;

    return comparison === 'above'
      ? statValue > condition.threshold!
      : statValue < condition.threshold!;
  };

  // For 'any' selector, at least one player must match
  // For 'all' selector, all players must match
  // For specific selectors, the selected player must match
  if (condition.playerSelector === 'all') {
    return selectedPlayers.every(checkPlayer);
  } else {
    return selectedPlayers.some(checkPlayer);
  }
}

/**
 * Evaluates player morale conditions (above/below threshold)
 */
function evaluatePlayerMoraleCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot,
  comparison: 'above' | 'below'
): boolean {
  if (condition.threshold === undefined) {
    return false;
  }

  const selectedPlayers = selectPlayers(
    condition.playerSelector,
    snapshot,
    condition.playerId
  );

  if (selectedPlayers.length === 0) {
    return false;
  }

  const checkPlayer = (player: typeof selectedPlayers[number]): boolean => {
    return comparison === 'above'
      ? player.morale > condition.threshold!
      : player.morale < condition.threshold!;
  };

  if (condition.playerSelector === 'all') {
    return selectedPlayers.every(checkPlayer);
  } else {
    return selectedPlayers.some(checkPlayer);
  }
}

/**
 * Evaluates player form conditions (above/below threshold)
 */
function evaluatePlayerFormCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot,
  comparison: 'above' | 'below'
): boolean {
  if (condition.threshold === undefined) {
    return false;
  }

  const selectedPlayers = selectPlayers(
    condition.playerSelector,
    snapshot,
    condition.playerId
  );

  if (selectedPlayers.length === 0) {
    return false;
  }

  const checkPlayer = (player: typeof selectedPlayers[number]): boolean => {
    return comparison === 'above'
      ? player.form > condition.threshold!
      : player.form < condition.threshold!;
  };

  if (condition.playerSelector === 'all') {
    return selectedPlayers.every(checkPlayer);
  } else {
    return selectedPlayers.some(checkPlayer);
  }
}

/**
 * Evaluates win streak condition
 */
function evaluateWinStreakCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (condition.streakLength === undefined) {
    return false;
  }

  const currentStreak = calculateCurrentStreak(snapshot);
  return currentStreak >= condition.streakLength && currentStreak > 0;
}

/**
 * Evaluates loss streak condition
 */
function evaluateLossStreakCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (condition.streakLength === undefined) {
    return false;
  }

  const currentStreak = calculateCurrentStreak(snapshot);
  return Math.abs(currentStreak) >= condition.streakLength && currentStreak < 0;
}

/**
 * Calculates current win/loss streak from recent match results
 * Positive = win streak, Negative = loss streak
 */
function calculateCurrentStreak(snapshot: DramaGameStateSnapshot): number {
  if (!snapshot.recentMatchResults || snapshot.recentMatchResults.length === 0) {
    return 0;
  }

  // Filter for player's team and sort by date (most recent first)
  const teamResults = snapshot.recentMatchResults
    .filter((result) => result.teamId === snapshot.playerTeamId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (teamResults.length === 0) {
    return 0;
  }

  let streak = 0;
  const firstResult = teamResults[0].won;

  // Count consecutive results matching the most recent result
  for (const result of teamResults) {
    if (result.won === firstResult) {
      streak += firstResult ? 1 : -1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Checks if there's a recent match result within the specified number of days
 */
function hasRecentMatchResult(snapshot: DramaGameStateSnapshot, days = 3): boolean {
  if (!snapshot.recentMatchResults || snapshot.recentMatchResults.length === 0) {
    return false;
  }

  const currentDate = new Date(snapshot.currentDate);
  const cutoff = new Date(currentDate);
  cutoff.setDate(cutoff.getDate() - days);

  return snapshot.recentMatchResults.some((result) => {
    const resultDate = new Date(result.date);
    return resultDate >= cutoff && result.teamId === snapshot.playerTeamId;
  });
}

/**
 * Evaluates category cooldown condition
 */
function evaluateCategoryCooldown(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (condition.category === undefined) {
    return false;
  }

  const cooldownExpiry = snapshot.dramaState.cooldowns[condition.category];
  if (!cooldownExpiry) {
    return false; // No cooldown = category is NOT on cooldown
  }

  const currentDate = new Date(snapshot.currentDate);
  const expiryDate = new Date(cooldownExpiry);

  return currentDate < expiryDate; // True if still on cooldown
}

/**
 * Matches a flag pattern against active flags
 * Converts {playerId}/{teamId} patterns to regex and checks for matches
 */
function matchesFlagPattern(
  pattern: string,
  activeFlags: Record<string, any>
): string | null {
  // If no placeholders, do direct lookup
  if (!pattern.includes('{')) {
    return pattern in activeFlags ? pattern : null;
  }

  // Convert pattern to regex
  const regex = new RegExp(
    '^' +
    pattern
      .replace(/\{playerId\}/g, '[^_]+')
      .replace(/\{teamId\}/g, '[^_]+') +
    '$'
  );

  // Find first matching flag
  const match = Object.keys(activeFlags).find(flag => regex.test(flag));
  return match || null;
}

/**
 * Evaluates flag active condition
 */
function evaluateFlagActive(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (condition.flag === undefined) {
    return false;
  }

  // Find matching flag (supports patterns with {playerId}/{teamId})
  const matchedFlag = matchesFlagPattern(
    condition.flag,
    snapshot.dramaState.activeFlags
  );

  if (!matchedFlag) {
    return false;
  }

  const flagData = snapshot.dramaState.activeFlags[matchedFlag];
  if (!flagData) {
    return false;
  }

  // Check if flag has expired
  if (flagData.expiresDate) {
    const currentDate = new Date(snapshot.currentDate);
    const expiryDate = new Date(flagData.expiresDate);
    return currentDate < expiryDate;
  }

  return true; // Flag exists and has no expiry
}

/**
 * Evaluates recent event count condition
 */
function evaluateRecentEventCount(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (condition.threshold === undefined) {
    return false;
  }

  const currentDate = new Date(snapshot.currentDate);
  const recentPeriod = new Date(currentDate);
  recentPeriod.setDate(recentPeriod.getDate() - 30); // Last 30 days

  const recentEvents = snapshot.dramaState.eventHistory.filter((event) => {
    const eventDate = new Date(event.triggeredDate);
    return eventDate >= recentPeriod;
  });

  // Optionally filter by category if specified
  const filteredEvents = condition.category
    ? recentEvents.filter((event) => event.category === condition.category)
    : recentEvents;

  return filteredEvents.length >= condition.threshold;
}

/**
 * Evaluates player_personality condition
 * True if any player on the team matches the specified personality archetype
 */
function evaluatePlayerPersonalityCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (!condition.personality) {
    return false;
  }

  const teamPlayers = snapshot.players.filter(
    (p) => p.teamId === snapshot.playerTeamId
  );

  return teamPlayers.some((p) => p.personality === condition.personality);
}

/**
 * Evaluates bracket_position condition
 * True if the team's current bracket position matches the required position
 */
function evaluateBracketPositionCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  if (!condition.bracketPosition) return false;
  const ctx = snapshot.tournamentContext;
  if (!ctx || ctx.bracketPosition === null) return false;
  return ctx.bracketPosition === condition.bracketPosition;
}

/**
 * Evaluates player_contract_expiring condition
 * True if any player on the team has yearsRemaining <= contractYearsThreshold (default: 1)
 */
function evaluatePlayerContractExpiringCondition(
  condition: DramaCondition,
  snapshot: DramaGameStateSnapshot
): boolean {
  const threshold = condition.contractYearsThreshold ?? 1;

  const teamPlayers = snapshot.players.filter(
    (p) => p.teamId === snapshot.playerTeamId
  );

  return teamPlayers.some(
    (p) => p.contract != null && p.contract.yearsRemaining <= threshold
  );
}
