// useAlerts Hook - Computed alerts from game state
//
// Extensible alert framework that computes alerts on-the-fly from game state.
// Add new alert rules by adding to the ALERT_RULES array.

import { useGameStore } from '../store';
import type { ActiveView } from '../store/slices/uiSlice';
import type { Player, Team } from '../types';
import { useMatchDay } from './useMatchDay';

export type AlertSeverity = 'urgent' | 'warning' | 'info';
export type AlertCategory = 'contract' | 'morale' | 'sponsor' | 'map' | 'roster' | 'finance' | 'other';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  action?: {
    label: string;
    navigateTo: ActiveView;
    subTab?: string;
    openModal?: 'scrim' | 'training';
  };
  data?: Record<string, unknown>;
}

interface AlertRule {
  id: string;
  check: (context: AlertContext) => Alert | null;
  shouldShow?: (context: AlertContext) => boolean;
}

interface AlertContext {
  playerTeamId: string | null;
  playerTeam: Team | null;
  players: Record<string, Player>;
  currentDate: string;
  isMatchDay: boolean;
}

/**
 * Alert rules - each rule checks game state and returns an Alert or null
 * Add new rules here to extend the alert system
 */
const ALERT_RULES: AlertRule[] = [
  // Contract expiring soon (within 30 days)
  {
    id: 'contract-expiring',
    check: ({ playerTeamId, players, currentDate }) => {
      if (!playerTeamId) return null;

      const currentDateObj = new Date(currentDate);
      const thirtyDaysFromNow = new Date(currentDateObj);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const teamPlayers = Object.values(players).filter(p => p.teamId === playerTeamId);
      const expiringContracts = teamPlayers.filter(p => {
        if (!p.contract?.endDate) return false;
        const endDate = new Date(p.contract.endDate);
        return endDate <= thirtyDaysFromNow && endDate > currentDateObj;
      });

      if (expiringContracts.length === 0) return null;

      const firstExpiring = expiringContracts[0];
      const daysUntil = Math.ceil(
        (new Date(firstExpiring.contract!.endDate).getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: 'contract-expiring',
        severity: daysUntil <= 7 ? 'urgent' : 'warning',
        category: 'contract',
        title: 'Contract Expiring',
        description: `${firstExpiring.name}'s contract ends in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        action: {
          label: 'View Roster',
          navigateTo: 'team',
          subTab: 'roster',
        },
      };
    },
  },

  // Low morale players (below 40)
  {
    id: 'low-morale',
    check: ({ playerTeamId, players }) => {
      if (!playerTeamId) return null;

      const teamPlayers = Object.values(players).filter(p => p.teamId === playerTeamId);
      const lowMoralePlayers = teamPlayers.filter(p => p.morale < 40);

      if (lowMoralePlayers.length === 0) return null;

      const lowestMorale = lowMoralePlayers.reduce((prev, curr) =>
        prev.morale < curr.morale ? prev : curr
      );

      return {
        id: 'low-morale',
        severity: lowestMorale.morale < 25 ? 'urgent' : 'warning',
        category: 'morale',
        title: 'Low Morale',
        description: `${lowestMorale.name}'s morale is at ${lowestMorale.morale}%`,
        action: {
          label: 'View Roster',
          navigateTo: 'team',
          subTab: 'roster',
        },
      };
    },
  },

  // Low form players (below 40)
  {
    id: 'low-form',
    check: ({ playerTeamId, players }) => {
      if (!playerTeamId) return null;

      const teamPlayers = Object.values(players).filter(p => p.teamId === playerTeamId);
      const lowFormPlayers = teamPlayers.filter(p => p.form < 40);

      if (lowFormPlayers.length === 0) return null;

      const lowestForm = lowFormPlayers.reduce((prev, curr) =>
        prev.form < curr.form ? prev : curr
      );

      return {
        id: 'low-form',
        severity: 'warning',
        category: 'roster',
        title: 'Low Form',
        description: `${lowestForm.name}'s form is at ${lowestForm.form}%`,
        action: {
          label: 'View Roster',
          navigateTo: 'team',
          subTab: 'roster',
        },
      };
    },
  },

  // Map practice low (any map below 50%)
  {
    id: 'map-practice-low',
    shouldShow: ({ isMatchDay }) => !isMatchDay,
    check: ({ playerTeam }) => {
      if (!playerTeam?.mapPool?.maps) return null;

      const maps = Object.entries(playerTeam.mapPool.maps);
      const lowMaps = maps.filter(([, strength]) => {
        const avgStrength = Object.values(strength.attributes).reduce((a, b) => a + b, 0) / 6;
        return avgStrength < 50;
      });

      if (lowMaps.length === 0) return null;

      const [lowestMapName, lowestMap] = lowMaps.reduce((prev, curr) => {
        const prevAvg = Object.values(prev[1].attributes).reduce((a, b) => a + b, 0) / 6;
        const currAvg = Object.values(curr[1].attributes).reduce((a, b) => a + b, 0) / 6;
        return prevAvg < currAvg ? prev : curr;
      });

      const avgStrength = Math.round(Object.values(lowestMap.attributes).reduce((a, b) => a + b, 0) / 6);

      // Collect all weak map names for pre-selection (up to 3)
      const weakMapNames = lowMaps
        .sort((a, b) => {
          const avgA = Object.values(a[1].attributes).reduce((x, y) => x + y, 0) / 6;
          const avgB = Object.values(b[1].attributes).reduce((x, y) => x + y, 0) / 6;
          return avgA - avgB;
        })
        .slice(0, 3)
        .map(([name]) => name);

      return {
        id: 'map-practice-low',
        severity: avgStrength < 30 ? 'urgent' : 'warning',
        category: 'map',
        title: 'Map Practice Low',
        description: `${lowestMapName} strength is at ${avgStrength}%`,
        action: {
          label: 'Schedule Scrim',
          navigateTo: 'today',
          openModal: 'scrim',
        },
        data: { weakMaps: weakMapNames },
      };
    },
  },

  // Roster incomplete (less than 5 active players)
  {
    id: 'roster-incomplete',
    check: ({ playerTeam }) => {
      if (!playerTeam) return null;

      const activeCount = playerTeam.playerIds.length;
      if (activeCount >= 5) return null;

      return {
        id: 'roster-incomplete',
        severity: 'urgent',
        category: 'roster',
        title: 'Roster Incomplete',
        description: `Only ${activeCount}/5 active players`,
        action: {
          label: 'Sign Players',
          navigateTo: 'team',
          subTab: 'free-agents',
        },
      };
    },
  },

  // Low balance warning
  {
    id: 'low-balance',
    check: ({ playerTeam }) => {
      if (!playerTeam) return null;

      const balance = playerTeam.finances.balance;
      const monthlyExpenses =
        playerTeam.finances.monthlyExpenses.playerSalaries +
        playerTeam.finances.monthlyExpenses.coachSalaries +
        playerTeam.finances.monthlyExpenses.facilities +
        playerTeam.finances.monthlyExpenses.travel;

      // Warn if balance is less than 2 months of expenses
      if (balance >= monthlyExpenses * 2) return null;

      const monthsRunway = balance > 0 ? (balance / monthlyExpenses).toFixed(1) : '0';

      return {
        id: 'low-balance',
        severity: balance < monthlyExpenses ? 'urgent' : 'warning',
        category: 'finance',
        title: 'Low Balance',
        description: `${monthsRunway} months of runway remaining`,
        action: {
          label: 'View Finances',
          navigateTo: 'finances',
        },
      };
    },
  },
];

/**
 * Hook to get all active alerts computed from game state
 */
export function useAlerts(): Alert[] {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);
  const calendar = useGameStore((state) => state.calendar);
  const { isMatchDay } = useMatchDay();

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  const context: AlertContext = {
    playerTeamId,
    playerTeam,
    players,
    currentDate: calendar.currentDate,
    isMatchDay,
  };

  return ALERT_RULES
    .filter(rule => !rule.shouldShow || rule.shouldShow(context))
    .map(rule => rule.check(context))
    .filter((alert): alert is Alert => alert !== null);
}
