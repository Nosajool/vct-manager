// ObjectivesService - Generates context-aware daily objectives for the manager
// Pure function that analyzes game state and returns actionable objectives

import type { GameState } from '../store';
import type { MatchEventData } from '../types';
import { featureGateService } from './FeatureGateService';

/**
 * Navigation action for an objective
 */
export interface ObjectiveAction {
  view: 'today' | 'team' | 'tournament' | 'finances';
  data?: {
    matchId?: string;
    tournamentId?: string;
    playerId?: string;
  };
  openModal?: 'training' | 'scrim';
  eventId?: string;
}

/**
 * Daily objective for the manager
 */
export interface DailyObjective {
  id: string;
  label: string;
  description: string;
  priority: number; // Higher = more important
  completed: boolean;
  action?: ObjectiveAction;
  activityType?: 'training' | 'scrim' | 'strategy';
}

/**
 * Priority levels for objectives
 */
const PRIORITY = {
  CRITICAL: 100,  // Match day prep
  HIGH: 80,       // Urgent alerts
  MEDIUM: 60,     // Training/Scrims available
  LOW: 40,        // Secondary tasks
} as const;

/**
 * Get daily objectives based on current game state
 * Returns 2-4 context-aware objectives prioritized by importance
 */
export function getDailyObjectives(state: GameState): DailyObjective[] {
  const objectives: DailyObjective[] = [];
  const currentDate = state.calendar.currentDate;

  // 1. Match day preparation (CRITICAL)
  const matchObjective = getMatchDayObjective(state, currentDate);
  if (matchObjective) {
    objectives.push(matchObjective);
  }

  // 2. Urgent alerts (HIGH)
  const urgentObjectives = getUrgentAlerts(state);
  objectives.push(...urgentObjectives);

  // 3. Training available (MEDIUM)
  const trainingObjective = getTrainingObjective(state, currentDate);
  if (trainingObjective) {
    objectives.push(trainingObjective);
  }

  // 4. Scrims available (MEDIUM)
  const scrimObjective = getScrimObjective(state, currentDate);
  if (scrimObjective) {
    objectives.push(scrimObjective);
  }

  // 5. Secondary tasks (LOW)
  const secondaryObjectives = getSecondaryTasks(state);
  objectives.push(...secondaryObjectives);

  // Sort by priority (highest first) and take top 2-4
  const sorted = objectives.sort((a, b) => b.priority - a.priority);
  return sorted.slice(0, 4);
}

/**
 * Check for upcoming matches requiring preparation
 */
function getMatchDayObjective(state: GameState, currentDate: string): DailyObjective | null {
  if (!state.playerTeamId) return null;

  // Check for matches today or tomorrow
  const nextMatch = state.getNextMatchEvent();
  if (!nextMatch) return null;

  const matchDate = new Date(nextMatch.date);
  const current = new Date(currentDate);
  const daysDiff = Math.floor((matchDate.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

  // Only show if match is within next 2 days
  if (daysDiff > 2) return null;

  const matchData = nextMatch.data as MatchEventData;
  const isHome = matchData.homeTeamId === state.playerTeamId;
  const opponentId = isHome ? matchData.awayTeamId : matchData.homeTeamId;
  const opponent = state.teams[opponentId];

  let label = 'Match Today';
  let description = 'Prepare for your upcoming match';

  if (daysDiff === 0) {
    label = 'Match Today';
    description = opponent
      ? `Your match against ${opponent.name} is today. Review tactics and finalize your lineup.`
      : 'Your match is today. Review tactics and finalize your lineup.';
  } else if (daysDiff === 1) {
    label = 'Match Tomorrow';
    description = opponent
      ? `Match against ${opponent.name} tomorrow. Prepare your strategy and rest your players.`
      : 'Match tomorrow. Prepare your strategy and rest your players.';
  }

  return {
    id: 'match-prep',
    label,
    description,
    priority: PRIORITY.CRITICAL,
    completed: false, // Could check if lineup is set, strategy reviewed, etc.
    action: {
      view: 'today',
      data: { matchId: matchData.matchId },
    },
  };
}

/**
 * Check for urgent issues requiring immediate attention
 */
function getUrgentAlerts(state: GameState): DailyObjective[] {
  const alerts: DailyObjective[] = [];

  if (!state.playerTeamId) return alerts;

  const team = state.teams[state.playerTeamId];
  if (!team) return alerts;

  // Check financial health
  if (team.finances.balance < 50000) {
    alerts.push({
      id: 'low-funds',
      label: 'Low Funds',
      description: `Team balance is critically low ($${Math.floor(team.finances.balance).toLocaleString()}). Review finances and consider cuts.`,
      priority: PRIORITY.HIGH,
      completed: false,
      action: { view: 'finances' },
    });
  }

  // Check team morale
  const players = [...team.playerIds, ...team.reservePlayerIds]
    .map(id => state.players[id])
    .filter(Boolean);

  const lowMoralePlayers = players.filter(p => p.morale < 40);
  if (lowMoralePlayers.length >= 2) {
    alerts.push({
      id: 'low-morale',
      label: 'Team Morale Low',
      description: `${lowMoralePlayers.length} players have low morale. Consider rest days or lighter training.`,
      priority: PRIORITY.HIGH,
      completed: false,
      action: { view: 'team' },
    });
  }

  // Check for expiring contracts (within 30 days)
  const currentDate = new Date(state.calendar.currentDate);
  const expiringPlayers = players.filter(p => {
    if (!p.contract?.endDate) return false;
    const endDate = new Date(p.contract.endDate);
    const daysUntilExpiry = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  if (expiringPlayers.length > 0) {
    alerts.push({
      id: 'expiring-contracts',
      label: 'Contracts Expiring',
      description: `${expiringPlayers.length} player contract${expiringPlayers.length > 1 ? 's' : ''} expiring soon. Consider renewals.`,
      priority: PRIORITY.HIGH,
      completed: false,
      action: { view: 'team' },
    });
  }

  return alerts.slice(0, 1); // Only return the most urgent alert
}

/**
 * Check if training is available today
 */
function getTrainingObjective(state: GameState, currentDate: string): DailyObjective | null {
  // Feature gate check
  if (!featureGateService.isFeatureUnlocked('training')) {
    return null;
  }

  // Check for scheduled_training event today
  const todaysEvents = state.getEventsOnDate(currentDate);
  const trainingEvent = todaysEvents.find(
    e => e.type === 'scheduled_training' && !e.processed
  );

  if (!trainingEvent) return null;

  if (!state.playerTeamId) return null;

  const team = state.teams[state.playerTeamId];
  if (!team) return null;

  // Count how many players can still train this week
  // Note: This is a simplified check - actual implementation would need TrainingService
  const players = [...team.playerIds, ...team.reservePlayerIds]
    .map(id => state.players[id])
    .filter(Boolean);

  if (players.length === 0) return null;

  // Check if training is configured
  const activityConfig = state.getActivityConfig?.(trainingEvent.id);
  const isConfigured = !!(activityConfig && activityConfig.status !== 'needs_setup');

  return {
    id: 'training-available',
    label: 'Training Available',
    description: `Schedule training sessions for your players to improve their skills.`,
    priority: PRIORITY.MEDIUM,
    completed: isConfigured,
    activityType: 'training',
    action: {
      view: 'team',
      openModal: 'training',
      eventId: trainingEvent.id,
    },
  };
}

/**
 * Check if scrims are available today
 */
function getScrimObjective(state: GameState, currentDate: string): DailyObjective | null {
  // Feature gate check
  if (!featureGateService.isFeatureUnlocked('scrims')) {
    return null;
  }

  // Check for scheduled_scrim event today
  const todaysEvents = state.getEventsOnDate(currentDate);
  const scrimEvent = todaysEvents.find(
    e => e.type === 'scheduled_scrim' && !e.processed
  );

  if (!scrimEvent) return null;

  if (!state.playerTeamId) return null;

  // Check if scrim is configured
  const activityConfig = state.getActivityConfig?.(scrimEvent.id);
  const isConfigured = !!(activityConfig && activityConfig.status !== 'needs_setup');

  return {
    id: 'scrim-available',
    label: 'Scrim Available',
    description: 'Practice match available against another team. Build synergy and test strategies.',
    priority: PRIORITY.MEDIUM,
    completed: isConfigured,
    activityType: 'scrim',
    action: {
      view: 'team',
      openModal: 'scrim',
      eventId: scrimEvent.id,
    },
  };
}

/**
 * Get secondary tasks (lower priority, but still useful)
 */
function getSecondaryTasks(state: GameState): DailyObjective[] {
  const tasks: DailyObjective[] = [];

  if (!state.playerTeamId) return tasks;

  const team = state.teams[state.playerTeamId];
  if (!team) return tasks;

  // Check tournament standings
  const activeTournament = Object.values(state.tournaments).find(
    t => t.status === 'in_progress' &&
    (t.teamIds?.includes(state.playerTeamId!) || false)
  );

  if (activeTournament) {
    tasks.push({
      id: 'review-standings',
      label: 'Review Standings',
      description: `Check your position in ${activeTournament.name || 'the tournament'}.`,
      priority: PRIORITY.LOW,
      completed: false,
      action: {
        view: 'tournament',
        data: { tournamentId: activeTournament.id },
      },
    });
  }

  // Check team chemistry
  if (team.chemistry && team.chemistry.overall < 60) {
    tasks.push({
      id: 'improve-chemistry',
      label: 'Team Chemistry',
      description: 'Team chemistry is below optimal. Consider team activities or roster adjustments.',
      priority: PRIORITY.LOW,
      completed: false,
      action: { view: 'team' },
    });
  }

  // Suggest reviewing tactics if no recent updates (feature gated)
  if (featureGateService.isFeatureUnlocked('strategy')) {
    tasks.push({
      id: 'review-tactics',
      label: 'Review Strategy',
      description: 'Review and adjust your team strategy and agent compositions.',
      priority: PRIORITY.LOW - 10, // Lowest priority
      completed: false,
      activityType: 'strategy',
      action: { view: 'team' },
    });
  }

  return tasks.slice(0, 2); // Only return top 2 secondary tasks
}
