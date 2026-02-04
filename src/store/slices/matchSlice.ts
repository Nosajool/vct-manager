// Match Slice - Zustand store slice for match management
// Follows normalized data pattern with entities stored by ID

import type { StateCreator } from 'zustand';
import type { Match, MatchResult } from '../../types';

export interface MatchSlice {
  // Normalized match entities
  matches: Record<string, Match>;

  // Normalized match results (separate for efficient lookup)
  results: Record<string, MatchResult>;

  // Actions
  addMatch: (match: Match) => void;
  addMatches: (matches: Match[]) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  removeMatch: (matchId: string) => void;
  addResult: (result: MatchResult) => void;

  // Selectors
  getMatch: (matchId: string) => Match | undefined;
  getResult: (matchId: string) => MatchResult | undefined;
  getMatchesByTeam: (teamId: string) => Match[];
  getTeamMatchHistory: (teamId: string) => MatchResult[];
  getUpcomingMatches: (teamId: string) => Match[];
  getCompletedMatches: (teamId: string) => Match[];
  getAllMatches: () => Match[];

  // Stats selectors
  getTeamWinRate: (teamId: string) => number;
  getTeamRecentForm: (teamId: string, count?: number) => ('W' | 'L')[];
  getTeamMapStats: (teamId: string) => Record<string, { wins: number; losses: number; winRate: number }>;
  getHeadToHead: (teamIdA: string, teamIdB: string) => {
    teamAWins: number;
    teamBWins: number;
    matches: MatchResult[];
  };
  getTeamAverageRoundDiff: (teamId: string) => number;
  getTeamClutchStats: (teamId: string) => {
    totalAttempts: number;
    wins: number;
    winRate: number;
    byPlayer: Record<string, { attempts: number; wins: number }>;
  };
  getTeamPlayerAggregateStats: (teamId: string) => Record<string, {
    playerId: string;
    maps: number;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
    totalAcs: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgAcs: number;
    kd: number;
  }>;
}

export const createMatchSlice: StateCreator<
  MatchSlice,
  [],
  [],
  MatchSlice
> = (set, get) => ({
  // Initial state
  matches: {},
  results: {},

  // Actions
  addMatch: (match) =>
    set((state) => ({
      matches: { ...state.matches, [match.id]: match },
    })),

  addMatches: (matches) =>
    set((state) => ({
      matches: {
        ...state.matches,
        ...Object.fromEntries(matches.map((m) => [m.id, m])),
      },
    })),

  updateMatch: (matchId, updates) =>
    set((state) => {
      const existing = state.matches[matchId];
      if (!existing) return state;

      return {
        matches: {
          ...state.matches,
          [matchId]: { ...existing, ...updates },
        },
      };
    }),

  removeMatch: (matchId) =>
    set((state) => {
      const { [matchId]: removedMatch, ...remainingMatches } = state.matches;
      const { [matchId]: removedResult, ...remainingResults } = state.results;
      return {
        matches: remainingMatches,
        results: remainingResults,
      };
    }),

  addResult: (result) =>
    set((state) => ({
      results: { ...state.results, [result.matchId]: result },
    })),

  // Selectors
  getMatch: (matchId) => get().matches[matchId],

  getResult: (matchId) => get().results[matchId],

  getMatchesByTeam: (teamId) =>
    Object.values(get().matches).filter(
      (match) => match.teamAId === teamId || match.teamBId === teamId
    ),

  getTeamMatchHistory: (teamId) => {
    const { matches, results } = get();
    return Object.values(matches)
      .filter(
        (match) =>
          match.status === 'completed' &&
          (match.teamAId === teamId || match.teamBId === teamId)
      )
      .map((match) => results[match.id])
      .filter((result): result is MatchResult => result !== undefined);
  },

  getUpcomingMatches: (teamId) =>
    Object.values(get().matches)
      .filter(
        (match) =>
          match.status === 'scheduled' &&
          (match.teamAId === teamId || match.teamBId === teamId)
      )
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),

  getCompletedMatches: (teamId) =>
    Object.values(get().matches)
      .filter(
        (match) =>
          match.status === 'completed' &&
          (match.teamAId === teamId || match.teamBId === teamId)
      )
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)),

  getAllMatches: () => Object.values(get().matches),

  // Stats selectors
  getTeamWinRate: (teamId) => {
    const history = get().getTeamMatchHistory(teamId);
    if (history.length === 0) return 0;
    const wins = history.filter((r) => r.winnerId === teamId).length;
    return (wins / history.length) * 100;
  },

  getTeamRecentForm: (teamId, count = 5) => {
    const completedMatches = Object.values(get().matches)
      .filter(
        (m) =>
          m.status === 'completed' &&
          (m.teamAId === teamId || m.teamBId === teamId)
      )
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

    return completedMatches.slice(0, count).map((match) => {
      const result = get().results[match.id];
      return result?.winnerId === teamId ? 'W' : 'L';
    });
  },

  getTeamMapStats: (teamId) => {
    const history = get().getTeamMatchHistory(teamId);
    const mapStats: Record<string, { wins: number; losses: number; winRate: number }> = {};

    for (const result of history) {
      for (const mapResult of result.maps) {
        const mapName = mapResult.map;
        if (!mapStats[mapName]) {
          mapStats[mapName] = { wins: 0, losses: 0, winRate: 0 };
        }

        // Check if team was teamA or teamB in match
        const match = Object.values(get().matches).find((m) => m.id === result.matchId);
        const isTeamAInMatch = match?.teamAId === teamId;
        const teamMapScore = isTeamAInMatch ? mapResult.teamAScore : mapResult.teamBScore;
        const oppMapScore = isTeamAInMatch ? mapResult.teamBScore : mapResult.teamAScore;

        if (teamMapScore > oppMapScore) {
          mapStats[mapName].wins++;
        } else {
          mapStats[mapName].losses++;
        }
      }
    }

    // Calculate win rates
    for (const mapName of Object.keys(mapStats)) {
      const stats = mapStats[mapName];
      const total = stats.wins + stats.losses;
      stats.winRate = total > 0 ? (stats.wins / total) * 100 : 0;
    }

    return mapStats;
  },

  getHeadToHead: (teamIdA, teamIdB) => {
    const { matches, results } = get();
    const h2hMatches = Object.values(matches)
      .filter(
        (m) =>
          m.status === 'completed' &&
          ((m.teamAId === teamIdA && m.teamBId === teamIdB) ||
            (m.teamAId === teamIdB && m.teamBId === teamIdA))
      )
      .map((m) => results[m.id])
      .filter((r): r is MatchResult => r !== undefined);

    const teamAWins = h2hMatches.filter((r) => r.winnerId === teamIdA).length;
    const teamBWins = h2hMatches.filter((r) => r.winnerId === teamIdB).length;

    return { teamAWins, teamBWins, matches: h2hMatches };
  },

  getTeamAverageRoundDiff: (teamId) => {
    const history = get().getTeamMatchHistory(teamId);
    if (history.length === 0) return 0;

    let totalRoundDiff = 0;
    let mapCount = 0;

    for (const result of history) {
      const match = Object.values(get().matches).find((m) => m.id === result.matchId);
      const isTeamA = match?.teamAId === teamId;

      for (const mapResult of result.maps) {
        const teamScore = isTeamA ? mapResult.teamAScore : mapResult.teamBScore;
        const oppScore = isTeamA ? mapResult.teamBScore : mapResult.teamAScore;
        totalRoundDiff += teamScore - oppScore;
        mapCount++;
      }
    }

    return mapCount > 0 ? totalRoundDiff / mapCount : 0;
  },

  getTeamClutchStats: (teamId) => {
    const history = get().getTeamMatchHistory(teamId);
    const stats = {
      totalAttempts: 0,
      wins: 0,
      winRate: 0,
      byPlayer: {} as Record<string, { attempts: number; wins: number }>,
    };

    for (const result of history) {
      const match = Object.values(get().matches).find((m) => m.id === result.matchId);
      const isTeamA = match?.teamAId === teamId;

      for (const mapResult of result.maps) {
        const performances = isTeamA
          ? mapResult.teamAPerformances
          : mapResult.teamBPerformances;

        for (const perf of performances) {
          if (perf.clutchesAttempted && perf.clutchesAttempted > 0) {
            stats.totalAttempts += perf.clutchesAttempted;
            stats.wins += perf.clutchesWon ?? 0;

            if (!stats.byPlayer[perf.playerId]) {
              stats.byPlayer[perf.playerId] = { attempts: 0, wins: 0 };
            }
            stats.byPlayer[perf.playerId].attempts += perf.clutchesAttempted;
            stats.byPlayer[perf.playerId].wins += perf.clutchesWon ?? 0;
          }
        }
      }
    }

    stats.winRate = stats.totalAttempts > 0 ? (stats.wins / stats.totalAttempts) * 100 : 0;

    return stats;
  },

  getTeamPlayerAggregateStats: (teamId) => {
    const history = get().getTeamMatchHistory(teamId);
    const playerStats: Record<string, {
      playerId: string;
      maps: number;
      totalKills: number;
      totalDeaths: number;
      totalAssists: number;
      totalAcs: number;
      avgKills: number;
      avgDeaths: number;
      avgAssists: number;
      avgAcs: number;
      kd: number;
    }> = {};

    for (const result of history) {
      const match = Object.values(get().matches).find((m) => m.id === result.matchId);
      const isTeamA = match?.teamAId === teamId;

      for (const mapResult of result.maps) {
        const performances = isTeamA
          ? mapResult.teamAPerformances
          : mapResult.teamBPerformances;

        for (const perf of performances) {
          if (!playerStats[perf.playerId]) {
            playerStats[perf.playerId] = {
              playerId: perf.playerId,
              maps: 0,
              totalKills: 0,
              totalDeaths: 0,
              totalAssists: 0,
              totalAcs: 0,
              avgKills: 0,
              avgDeaths: 0,
              avgAssists: 0,
              avgAcs: 0,
              kd: 0,
            };
          }

          const stats = playerStats[perf.playerId];
          stats.maps++;
          stats.totalKills += perf.kills;
          stats.totalDeaths += perf.deaths;
          stats.totalAssists += perf.assists;
          stats.totalAcs += perf.acs;
        }
      }
    }

    // Calculate averages
    for (const playerId of Object.keys(playerStats)) {
      const stats = playerStats[playerId];
      if (stats.maps > 0) {
        stats.avgKills = stats.totalKills / stats.maps;
        stats.avgDeaths = stats.totalDeaths / stats.maps;
        stats.avgAssists = stats.totalAssists / stats.maps;
        stats.avgAcs = stats.totalAcs / stats.maps;
        stats.kd = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : stats.totalKills;
      }
    }

    return playerStats;
  },
});
