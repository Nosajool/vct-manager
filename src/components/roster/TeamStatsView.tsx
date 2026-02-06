// TeamStatsView Component - Display team statistics and match history

import { useMemo, useState } from 'react';
import { useGameStore } from '../../store';
import type { Player, MatchResult, Team, Match } from '../../types';
import { MatchResult as MatchResultModal } from '../match/MatchResult';
import { getMatchForResult } from '../../utils/matchResultUtils';

interface TeamStatsViewProps {
  teamId?: string;
  compact?: boolean;
}

export function TeamStatsView({ teamId, compact = false }: TeamStatsViewProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);
  const getTeamMatchHistory = useGameStore((state) => state.getTeamMatchHistory);

  const targetTeamId = teamId ?? playerTeamId;
  if (!targetTeamId) return null;

  const team = teams[targetTeamId];
  if (!team) return null;

  const matchHistory = getTeamMatchHistory(targetTeamId);

  // Get active players
  const activePlayers = team.playerIds
    .map((id) => players[id])
    .filter(Boolean) as Player[];

  if (compact) {
    return <CompactView team={team} />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <OverviewCards team={team} matchHistory={matchHistory} />

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
                  ? (stat.kills / stat.deaths).toFixed(2)
                  : maps > 0
                  ? stat.kills.toFixed(2)
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

  return <span className={getColor(kd)}>{kd.toFixed(2)}</span>;
}
