// TeamStatsView Component - Display team statistics and match history

import { useMemo, useState } from 'react';
import { useGameStore } from '../../store';
import type { Player, MatchResult, Team, Match } from '../../types';
import { MatchResult as MatchResultModal } from '../match/MatchResult';
import { getMatchForResult } from '../../utils/matchResultUtils';
import { formatKD } from '../../utils/formatNumber';

interface TeamStatsViewProps {
  teamId?: string;
  compact?: boolean;
}

type TimePeriod = 'last5' | 'last10' | 'last20' | 'all';

export function TeamStatsView({ teamId, compact = false }: TeamStatsViewProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);
  const getTeamMatchHistory = useGameStore((state) => state.getTeamMatchHistory);

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [comparisonTeamId, setComparisonTeamId] = useState<string | null>(null);

  const targetTeamId = teamId ?? playerTeamId;
  if (!targetTeamId) return null;

  const team = teams[targetTeamId];
  if (!team) return null;

  const allMatchHistory = getTeamMatchHistory(targetTeamId);

  // Filter match history based on selected time period
  const matchHistory = useMemo(() => {
    switch (timePeriod) {
      case 'last5':
        return allMatchHistory.slice(0, 5);
      case 'last10':
        return allMatchHistory.slice(0, 10);
      case 'last20':
        return allMatchHistory.slice(0, 20);
      default:
        return allMatchHistory;
    }
  }, [allMatchHistory, timePeriod]);

  // Get active players
  const activePlayers = team.playerIds
    .map((id) => players[id])
    .filter(Boolean) as Player[];

  if (compact) {
    return <CompactView team={team} />;
  }

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <TimePeriodFilter selected={timePeriod} onChange={setTimePeriod} totalMatches={allMatchHistory.length} />

      {/* Overview Cards */}
      <OverviewCards team={team} matchHistory={matchHistory} />

      {/* League Comparison */}
      <LeagueComparisonSection team={team} matchHistory={matchHistory} teams={teams} />

      {/* Team Comparison (optional) */}
      <TeamComparisonSection
        team={team}
        matchHistory={matchHistory}
        comparisonTeamId={comparisonTeamId}
        onComparisonTeamChange={setComparisonTeamId}
        teams={teams}
      />

      {/* Historical Trends */}
      <HistoricalTrendsSection team={team} allMatchHistory={allMatchHistory} />

      {/* Match History */}
      <MatchHistorySection
        matchHistory={matchHistory}
        teamId={targetTeamId}
        teams={teams}
      />

      {/* Player Performance Summary */}
      <PlayerPerformanceSummary
        players={activePlayers}
        matchHistory={matchHistory}
      />
    </div>
  );
}

// Compact view for embedding in other components
function CompactView({
  team,
}: {
  team: Team;
}) {
  const { wins, losses, roundDiff, currentStreak } = team.standings;
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '0';

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <StatMini label="Record" value={`${wins}-${losses}`} />
        <StatMini label="Win Rate" value={`${winRate}%`} />
        <StatMini
          label="Round Diff"
          value={roundDiff >= 0 ? `+${roundDiff}` : `${roundDiff}`}
          color={roundDiff >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatMini
          label="Streak"
          value={currentStreak > 0 ? `W${currentStreak}` : currentStreak < 0 ? `L${Math.abs(currentStreak)}` : '-'}
          color={currentStreak > 0 ? 'text-green-400' : currentStreak < 0 ? 'text-red-400' : 'text-vct-gray'}
        />
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  color = 'text-vct-light',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-xs text-vct-gray">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

// Overview cards section
function OverviewCards({
  team,
  matchHistory,
}: {
  team: Team;
  matchHistory: MatchResult[];
}) {
  const { wins, losses, roundDiff, currentStreak } = team.standings;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0';

  // Calculate recent form (last 5 matches)
  const recentForm = useMemo(() => {
    return matchHistory
      .slice(0, 5)
      .map((result) => (result.winnerId === team.id ? 'W' : 'L'));
  }, [matchHistory, team.id]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Record Card */}
      <StatCard
        label="Season Record"
        value={`${wins}-${losses}`}
        subtext={`${winRate}% win rate`}
      />

      {/* Round Differential */}
      <StatCard
        label="Round Diff"
        value={roundDiff >= 0 ? `+${roundDiff}` : `${roundDiff}`}
        valueColor={roundDiff >= 0 ? 'text-green-400' : 'text-red-400'}
        subtext={`${totalMatches} matches played`}
      />

      {/* Current Streak */}
      <StatCard
        label="Current Streak"
        value={
          currentStreak > 0
            ? `${currentStreak}W`
            : currentStreak < 0
            ? `${Math.abs(currentStreak)}L`
            : '-'
        }
        valueColor={
          currentStreak > 0
            ? 'text-green-400'
            : currentStreak < 0
            ? 'text-red-400'
            : 'text-vct-gray'
        }
        subtext={currentStreak !== 0 ? 'consecutive' : 'No streak'}
      />

      {/* Team Chemistry */}
      <StatCard
        label="Team Chemistry"
        value={`${team.chemistry.overall}%`}
        valueColor={
          team.chemistry.overall >= 80
            ? 'text-green-400'
            : team.chemistry.overall >= 60
            ? 'text-yellow-400'
            : 'text-red-400'
        }
        subtext={
          team.chemistry.overall >= 80
            ? 'Excellent synergy'
            : team.chemistry.overall >= 60
            ? 'Good synergy'
            : 'Needs work'
        }
      />

      {/* Recent Form */}
      {recentForm.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
            <div className="text-xs text-vct-gray uppercase tracking-wide mb-2">
              Recent Form
            </div>
            <div className="flex gap-2">
              {recentForm.map((result, idx) => (
                <span
                  key={idx}
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                    result === 'W'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {result}
                </span>
              ))}
              {recentForm.length === 0 && (
                <span className="text-vct-gray text-sm">No recent matches</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  valueColor = 'text-vct-light',
}: {
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
      <div className="text-xs text-vct-gray uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      {subtext && <div className="text-xs text-vct-gray mt-1">{subtext}</div>}
    </div>
  );
}

// Match history section
function MatchHistorySection({
  matchHistory,
  teamId,
  teams,
}: {
  matchHistory: MatchResult[];
  teamId: string;
  teams: Record<string, Team>;
}) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleMatchClick = (result: MatchResult) => {
    const store = useGameStore.getState();
    const match = getMatchForResult(result, store);

    if (match) {
      setSelectedMatch(match);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMatch(null);
  };

  if (matchHistory.length === 0) {
    return (
      <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-6 text-center">
        <p className="text-vct-gray">No match history yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vct-gray/20">
          <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
            Match History
          </h3>
        </div>
        <div className="divide-y divide-vct-gray/10">
          {matchHistory.slice(0, 10).map((result) => {
            const isWin = result.winnerId === teamId;
            const opponentId =
              result.winnerId === teamId ? result.loserId : result.winnerId;
            const opponent = teams[opponentId];

            // Determine scores based on team position
            const teamScore = isWin ? result.scoreTeamA : result.scoreTeamB;
            const oppScore = isWin ? result.scoreTeamB : result.scoreTeamA;

            return (
              <div
                key={result.matchId}
                onClick={() => handleMatchClick(result)}
                className="px-4 py-3 flex items-center justify-between hover:bg-vct-darker/50 hover:border-l-2 hover:border-vct-accent/50 cursor-pointer transition-all duration-150 ease-in-out"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                      isWin
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {isWin ? 'W' : 'L'}
                  </span>
                  <div>
                    <div className="text-vct-light font-medium">
                      vs {opponent?.name ?? 'Unknown'}
                    </div>
                    <div className="text-xs text-vct-gray">
                      {result.maps.length} map{result.maps.length !== 1 ? 's' : ''} •{' '}
                      {result.maps.map((m) => m.map).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      isWin ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {teamScore}-{oppScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Result Modal */}
      {showModal && selectedMatch && (
        <MatchResultModal match={selectedMatch} onClose={handleCloseModal} />
      )}
    </>
  );
}

// Player performance summary
  function PlayerPerformanceSummary({
  players,
  matchHistory,
}: {
  players: Player[];
  matchHistory: MatchResult[];
}) {
  // Calculate average stats per player from match history
  const playerStats = useMemo(() => {
    const stats: Record<
      string,
      { kills: number; deaths: number; assists: number; acs: number; maps: number }
    > = {};

    for (const result of matchHistory) {
      for (const mapResult of result.maps) {
        // Check if our team is teamA or teamB based on player IDs
        const teamPerformances = mapResult.teamAPerformances.some(
          (p) => players.some((player) => player.id === p.playerId)
        )
          ? mapResult.teamAPerformances
          : mapResult.teamBPerformances;

        for (const perf of teamPerformances) {
          if (!stats[perf.playerId]) {
            stats[perf.playerId] = { kills: 0, deaths: 0, assists: 0, acs: 0, maps: 0 };
          }
          stats[perf.playerId].kills += perf.kills;
          stats[perf.playerId].deaths += perf.deaths;
          stats[perf.playerId].assists += perf.assists;
          stats[perf.playerId].acs += perf.acs;
          stats[perf.playerId].maps += 1;
        }
      }
    }

    return stats;
  }, [matchHistory, players]);

  if (players.length === 0) {
    return null;
  }

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
          Player Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-vct-darker text-xs text-vct-gray">
              <th className="px-4 py-2 text-left font-medium">Player</th>
              <th className="px-2 py-2 text-center font-medium">Maps</th>
              <th className="px-2 py-2 text-center font-medium">Avg K</th>
              <th className="px-2 py-2 text-center font-medium">Avg D</th>
              <th className="px-2 py-2 text-center font-medium">Avg A</th>
              <th className="px-2 py-2 text-center font-medium">Avg ACS</th>
              <th className="px-2 py-2 text-center font-medium">K/D</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => {
              const stat = playerStats[player.id];
              const maps = stat?.maps ?? 0;
              const avgKills = maps > 0 ? (stat.kills / maps).toFixed(1) : '-';
              const avgDeaths = maps > 0 ? (stat.deaths / maps).toFixed(1) : '-';
              const avgAssists = maps > 0 ? (stat.assists / maps).toFixed(1) : '-';
              const avgAcs = maps > 0 ? Math.round(stat.acs / maps) : '-';
              const kd =
                maps > 0 && stat.deaths > 0
                  ? formatKD(stat.kills / stat.deaths)
                  : maps > 0
                  ? formatKD(stat.kills)
                  : '-';

              return (
                <tr
                  key={player.id}
                  className={`border-t border-vct-gray/10 text-sm ${
                    idx % 2 === 0 ? 'bg-vct-darker' : 'bg-vct-dark'
                  }`}
                >
                  <td className="px-4 py-2 text-vct-light font-medium">
                    {player.name}
                  </td>
                  <td className="px-2 py-2 text-center text-vct-gray">{maps}</td>
                  <td className="px-2 py-2 text-center text-green-400">{avgKills}</td>
                  <td className="px-2 py-2 text-center text-red-400">{avgDeaths}</td>
                  <td className="px-2 py-2 text-center text-vct-gray">{avgAssists}</td>
                  <td className="px-2 py-2 text-center">
                    <AcsBadge acs={typeof avgAcs === 'number' ? avgAcs : 0} show={maps > 0} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <KdBadge kd={parseFloat(kd) || 0} show={maps > 0} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AcsBadge({ acs, show }: { acs: number; show: boolean }) {
  if (!show) return <span className="text-vct-gray">-</span>;

  const getColor = (value: number): string => {
    if (value >= 300) return 'text-yellow-400 font-bold';
    if (value >= 250) return 'text-green-400 font-medium';
    if (value >= 200) return 'text-vct-light';
    return 'text-vct-gray';
  };

  return <span className={getColor(acs)}>{acs}</span>;
}

function KdBadge({ kd, show }: { kd: number; show: boolean }) {
  if (!show) return <span className="text-vct-gray">-</span>;

  const getColor = (value: number): string => {
    if (value >= 1.5) return 'text-yellow-400 font-bold';
    if (value >= 1.0) return 'text-green-400';
    if (value >= 0.8) return 'text-vct-light';
    return 'text-red-400';
  };

  return <span className={getColor(kd)}>{formatKD(kd)}</span>;
}

// Time Period Filter Component
function TimePeriodFilter({
  selected,
  onChange,
  totalMatches,
}: {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
  totalMatches: number;
}) {
  const options: { value: TimePeriod; label: string }[] = [
    { value: 'last5', label: 'Last 5' },
    { value: 'last10', label: 'Last 10' },
    { value: 'last20', label: 'Last 20' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
            Time Period
          </h3>
          <p className="text-xs text-vct-gray mt-1">
            {totalMatches} total match{totalMatches !== 1 ? 'es' : ''} played
          </p>
        </div>
        <div className="flex gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selected === option.value
                  ? 'bg-vct-accent text-white'
                  : 'bg-vct-darker text-vct-gray hover:text-vct-light hover:bg-vct-darker/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// League Comparison Section
function LeagueComparisonSection({
  team,
  matchHistory,
  teams,
}: {
  team: Team;
  matchHistory: MatchResult[];
  teams: Record<string, Team>;
}) {
  const leagueStats = useMemo(() => {
    const allTeams = Object.values(teams);
    const getTeamMatchHistory = useGameStore.getState().getTeamMatchHistory;

    let totalWinRate = 0;
    let totalRoundDiff = 0;
    let totalChemistry = 0;
    let teamCount = 0;

    for (const t of allTeams) {
      const history = getTeamMatchHistory(t.id);
      if (history.length > 0) {
        const wins = history.filter((r) => r.winnerId === t.id).length;
        const winRate = (wins / history.length) * 100;
        totalWinRate += winRate;
        totalRoundDiff += t.standings.roundDiff / (t.standings.wins + t.standings.losses || 1);
        totalChemistry += t.chemistry.overall;
        teamCount++;
      }
    }

    return {
      avgWinRate: teamCount > 0 ? totalWinRate / teamCount : 0,
      avgRoundDiff: teamCount > 0 ? totalRoundDiff / teamCount : 0,
      avgChemistry: teamCount > 0 ? totalChemistry / teamCount : 0,
    };
  }, [teams]);

  const teamStats = useMemo(() => {
    const wins = matchHistory.filter((r) => r.winnerId === team.id).length;
    const totalMatches = matchHistory.length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const roundDiff = totalMatches > 0 ? team.standings.roundDiff / totalMatches : 0;

    return {
      winRate,
      roundDiff,
      chemistry: team.chemistry.overall,
    };
  }, [matchHistory, team]);

  const comparisons = [
    {
      label: 'Win Rate',
      team: `${teamStats.winRate.toFixed(1)}%`,
      league: `${leagueStats.avgWinRate.toFixed(1)}%`,
      diff: teamStats.winRate - leagueStats.avgWinRate,
    },
    {
      label: 'Avg Round Diff',
      team: teamStats.roundDiff.toFixed(1),
      league: leagueStats.avgRoundDiff.toFixed(1),
      diff: teamStats.roundDiff - leagueStats.avgRoundDiff,
    },
    {
      label: 'Team Chemistry',
      team: `${teamStats.chemistry}%`,
      league: `${leagueStats.avgChemistry.toFixed(0)}%`,
      diff: teamStats.chemistry - leagueStats.avgChemistry,
    },
  ];

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
          League Comparison
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisons.map((comp) => (
            <div key={comp.label} className="bg-vct-darker rounded-lg p-4">
              <div className="text-xs text-vct-gray uppercase mb-2">{comp.label}</div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-vct-gray">Your Team:</span>
                <span className="text-lg font-bold text-vct-light">{comp.team}</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-vct-gray">League Avg:</span>
                <span className="text-lg font-bold text-vct-gray">{comp.league}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-vct-gray/20">
                <span className="text-xs text-vct-gray">Difference:</span>
                <span
                  className={`text-sm font-bold ${
                    comp.diff > 0 ? 'text-green-400' : comp.diff < 0 ? 'text-red-400' : 'text-vct-gray'
                  }`}
                >
                  {comp.diff > 0 ? '+' : ''}
                  {comp.diff.toFixed(1)}
                  {comp.diff > 0 ? ' ↑' : comp.diff < 0 ? ' ↓' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Team Comparison Section
function TeamComparisonSection({
  team,
  matchHistory,
  comparisonTeamId,
  onComparisonTeamChange,
  teams,
}: {
  team: Team;
  matchHistory: MatchResult[];
  comparisonTeamId: string | null;
  onComparisonTeamChange: (teamId: string | null) => void;
  teams: Record<string, Team>;
}) {
  const getTeamMatchHistory = useGameStore((state) => state.getTeamMatchHistory);
  const getHeadToHead = useGameStore((state) => state.getHeadToHead);

  const otherTeams = useMemo(() => {
    return Object.values(teams).filter((t) => t.id !== team.id);
  }, [teams, team.id]);

  if (!comparisonTeamId) {
    return (
      <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-vct-gray/20">
          <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
            Team Comparison
          </h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-vct-gray mb-3">Compare with another team:</p>
          <select
            value=""
            onChange={(e) => onComparisonTeamChange(e.target.value || null)}
            className="w-full bg-vct-darker border border-vct-gray/20 rounded px-3 py-2 text-vct-light text-sm"
          >
            <option value="">Select a team...</option>
            {otherTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.region})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const comparisonTeam = teams[comparisonTeamId];
  if (!comparisonTeam) return null;

  const comparisonHistory = getTeamMatchHistory(comparisonTeamId);
  const headToHead = getHeadToHead(team.id, comparisonTeamId);

  const teamStats = useMemo(() => {
    const wins = matchHistory.filter((r) => r.winnerId === team.id).length;
    const totalMatches = matchHistory.length;
    return {
      winRate: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
      roundDiff: team.standings.roundDiff,
      chemistry: team.chemistry.overall,
      recentForm: matchHistory.slice(0, 5).map((r) => (r.winnerId === team.id ? 'W' : 'L')),
    };
  }, [matchHistory, team]);

  const compStats = useMemo(() => {
    const wins = comparisonHistory.filter((r) => r.winnerId === comparisonTeamId).length;
    const totalMatches = comparisonHistory.length;
    return {
      winRate: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
      roundDiff: comparisonTeam.standings.roundDiff,
      chemistry: comparisonTeam.chemistry.overall,
      recentForm: comparisonHistory.slice(0, 5).map((r) => (r.winnerId === comparisonTeamId ? 'W' : 'L')),
    };
  }, [comparisonHistory, comparisonTeam, comparisonTeamId]);

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-vct-gray/20 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
          Team Comparison
        </h3>
        <button
          onClick={() => onComparisonTeamChange(null)}
          className="text-xs text-vct-gray hover:text-vct-light"
        >
          Clear
        </button>
      </div>
      <div className="p-4 space-y-4">
        {/* Team selector */}
        <select
          value={comparisonTeamId}
          onChange={(e) => onComparisonTeamChange(e.target.value || null)}
          className="w-full bg-vct-darker border border-vct-gray/20 rounded px-3 py-2 text-vct-light text-sm"
        >
          {otherTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.region})
            </option>
          ))}
        </select>

        {/* Head to head record */}
        {headToHead.matches.length > 0 && (
          <div className="bg-vct-darker rounded-lg p-4">
            <div className="text-xs text-vct-gray uppercase mb-2">Head to Head</div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-vct-light">{headToHead.teamAWins}</div>
                <div className="text-xs text-vct-gray">{team.name}</div>
              </div>
              <div className="text-vct-gray">-</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-vct-light">{headToHead.teamBWins}</div>
                <div className="text-xs text-vct-gray">{comparisonTeam.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComparisonStat
            label="Win Rate"
            teamValue={`${teamStats.winRate.toFixed(1)}%`}
            compValue={`${compStats.winRate.toFixed(1)}%`}
            teamName={team.name}
            compName={comparisonTeam.name}
          />
          <ComparisonStat
            label="Round Diff"
            teamValue={teamStats.roundDiff >= 0 ? `+${teamStats.roundDiff}` : `${teamStats.roundDiff}`}
            compValue={compStats.roundDiff >= 0 ? `+${compStats.roundDiff}` : `${compStats.roundDiff}`}
            teamName={team.name}
            compName={comparisonTeam.name}
          />
          <ComparisonStat
            label="Chemistry"
            teamValue={`${teamStats.chemistry}%`}
            compValue={`${compStats.chemistry}%`}
            teamName={team.name}
            compName={comparisonTeam.name}
          />
        </div>

        {/* Recent form comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-vct-darker rounded-lg p-4">
            <div className="text-xs text-vct-gray uppercase mb-2">
              {team.name} Recent Form
            </div>
            <div className="flex gap-1">
              {teamStats.recentForm.map((result, idx) => (
                <span
                  key={idx}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                    result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {result}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-vct-darker rounded-lg p-4">
            <div className="text-xs text-vct-gray uppercase mb-2">
              {comparisonTeam.name} Recent Form
            </div>
            <div className="flex gap-1">
              {compStats.recentForm.map((result, idx) => (
                <span
                  key={idx}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                    result === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {result}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonStat({
  label,
  teamValue,
  compValue,
  teamName,
  compName,
}: {
  label: string;
  teamValue: string;
  compValue: string;
  teamName: string;
  compName: string;
}) {
  return (
    <div className="bg-vct-darker rounded-lg p-4">
      <div className="text-xs text-vct-gray uppercase mb-2">{label}</div>
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-vct-gray truncate mr-2">{teamName}:</span>
          <span className="text-sm font-bold text-vct-light">{teamValue}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-vct-gray truncate mr-2">{compName}:</span>
          <span className="text-sm font-bold text-vct-gray">{compValue}</span>
        </div>
      </div>
    </div>
  );
}

// Historical Trends Section
function HistoricalTrendsSection({
  team,
  allMatchHistory,
}: {
  team: Team;
  allMatchHistory: MatchResult[];
}) {
  const trends = useMemo(() => {
    if (allMatchHistory.length === 0) return null;

    // Split matches into buckets of 5
    const bucketSize = 5;
    const buckets: MatchResult[][] = [];
    for (let i = 0; i < allMatchHistory.length; i += bucketSize) {
      buckets.push(allMatchHistory.slice(i, i + bucketSize));
    }

    // Calculate stats for each bucket (reverse to show oldest first)
    const bucketStats = buckets.reverse().map((bucket, idx) => {
      const wins = bucket.filter((r) => r.winnerId === team.id).length;
      const winRate = (wins / bucket.length) * 100;

      let totalRoundDiff = 0;
      for (const result of bucket) {
        const isWin = result.winnerId === team.id;
        const teamScore = isWin ? result.scoreTeamA : result.scoreTeamB;
        const oppScore = isWin ? result.scoreTeamB : result.scoreTeamA;
        totalRoundDiff += teamScore - oppScore;
      }
      const avgRoundDiff = totalRoundDiff / bucket.length;

      return {
        label: `Matches ${idx * bucketSize + 1}-${idx * bucketSize + bucket.length}`,
        winRate,
        avgRoundDiff,
        matchCount: bucket.length,
      };
    });

    return bucketStats;
  }, [allMatchHistory, team.id]);

  if (!trends || trends.length < 2) {
    return null; // Need at least 2 buckets to show trends
  }

  return (
    <div className="bg-vct-dark border border-vct-gray/20 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-vct-gray/20">
        <h3 className="text-sm font-semibold text-vct-gray uppercase tracking-wide">
          Historical Trends
        </h3>
        <p className="text-xs text-vct-gray mt-1">Performance over time (grouped by 5 matches)</p>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-vct-darker text-xs text-vct-gray">
                <th className="px-4 py-2 text-left font-medium">Period</th>
                <th className="px-2 py-2 text-center font-medium">Matches</th>
                <th className="px-2 py-2 text-center font-medium">Win Rate</th>
                <th className="px-2 py-2 text-center font-medium">Trend</th>
                <th className="px-2 py-2 text-center font-medium">Avg Round Diff</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((bucket, idx) => {
                const prevBucket = idx > 0 ? trends[idx - 1] : null;
                const winRateTrend = prevBucket
                  ? bucket.winRate - prevBucket.winRate
                  : 0;

                return (
                  <tr
                    key={bucket.label}
                    className={`border-t border-vct-gray/10 text-sm ${
                      idx % 2 === 0 ? 'bg-vct-darker' : 'bg-vct-dark'
                    }`}
                  >
                    <td className="px-4 py-2 text-vct-light font-medium">{bucket.label}</td>
                    <td className="px-2 py-2 text-center text-vct-gray">{bucket.matchCount}</td>
                    <td className="px-2 py-2 text-center text-vct-light">
                      {bucket.winRate.toFixed(0)}%
                    </td>
                    <td className="px-2 py-2 text-center">
                      {prevBucket ? (
                        <span
                          className={`text-xs font-bold ${
                            winRateTrend > 0
                              ? 'text-green-400'
                              : winRateTrend < 0
                              ? 'text-red-400'
                              : 'text-vct-gray'
                          }`}
                        >
                          {winRateTrend > 0 ? '↑' : winRateTrend < 0 ? '↓' : '→'}{' '}
                          {Math.abs(winRateTrend).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-vct-gray text-xs">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={
                          bucket.avgRoundDiff > 0
                            ? 'text-green-400'
                            : bucket.avgRoundDiff < 0
                            ? 'text-red-400'
                            : 'text-vct-gray'
                        }
                      >
                        {bucket.avgRoundDiff > 0 ? '+' : ''}
                        {bucket.avgRoundDiff.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
