// AllTeamsView Component - Browse all teams and their rosters

import { useState, useMemo } from 'react';
import { useGameStore } from '../../store';
import { PlayerCard } from './PlayerCard';
import { PlayerDetailModal } from './PlayerDetailModal';
import type { Player, Region, Team } from '../../types';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';

type RegionFilter = Region | 'all';

export function AllTeamsView() {
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  const allTeams = useMemo(() => Object.values(teams), [teams]);

  // Filter teams by region
  const filteredTeams = useMemo(() => {
    let result = allTeams;

    if (selectedRegion !== 'all') {
      result = result.filter((t) => t.region === selectedRegion);
    }

    // Sort: player's team first, then by org value
    return result.sort((a, b) => {
      if (a.id === playerTeamId) return -1;
      if (b.id === playerTeamId) return 1;
      return b.organizationValue - a.organizationValue;
    });
  }, [allTeams, selectedRegion, playerTeamId]);

  // Get players for a team
  const getTeamPlayers = (team: Team): Player[] => {
    const allPlayerIds = [...team.playerIds, ...team.reservePlayerIds];
    return allPlayerIds.map((id) => players[id]).filter(Boolean);
  };

  // Calculate team overall rating
  const calculateTeamOverall = (team: Team): number => {
    const teamPlayers = team.playerIds.map((id) => players[id]).filter(Boolean);
    if (teamPlayers.length === 0) return 0;

    const avgOverall =
      teamPlayers.reduce((sum, p) => {
        const overall =
          p.stats.mechanics * 0.2 +
          p.stats.igl * 0.1 +
          p.stats.mental * 0.1 +
          p.stats.clutch * 0.1 +
          p.stats.vibes * 0.05 +
          p.stats.lurking * 0.1 +
          p.stats.entry * 0.1 +
          p.stats.support * 0.1 +
          p.stats.stamina * 0.15;
        return sum + overall;
      }, 0) / teamPlayers.length;

    return Math.round(avgOverall);
  };

  const regions: RegionFilter[] = ['all', 'Americas', 'EMEA', 'Pacific', 'China'];

  return (
    <div className="space-y-4">
      {/* Region Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-vct-gray">Region:</span>
        <div className="flex gap-1">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedRegion === region
                  ? 'bg-vct-red text-white'
                  : 'bg-vct-dark text-vct-gray hover:text-vct-light'
              }`}
            >
              {region === 'all' ? 'All' : region}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-vct-gray">
          {filteredTeams.length} teams
        </span>
      </div>

      {/* Teams List */}
      <div className="space-y-2">
        {filteredTeams.map((team) => {
          const isExpanded = expandedTeamId === team.id;
          const isPlayerTeam = team.id === playerTeamId;
          const teamPlayers = getTeamPlayers(team);
          const activePlayers = teamPlayers.filter((p) =>
            team.playerIds.includes(p.id)
          );
          const teamOverall = calculateTeamOverall(team);

          return (
            <div
              key={team.id}
              className={`bg-vct-dark border rounded-lg overflow-hidden transition-colors ${
                isPlayerTeam
                  ? 'border-vct-red/50'
                  : 'border-vct-gray/20 hover:border-vct-gray/40'
              }`}
            >
              {/* Team Header (clickable) */}
              <button
                onClick={() =>
                  setExpandedTeamId(isExpanded ? null : team.id)
                }
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-vct-darker/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Team Overall */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                      teamOverall >= 80
                        ? 'bg-green-500/20 text-green-400'
                        : teamOverall >= 70
                        ? 'bg-blue-500/20 text-blue-400'
                        : teamOverall >= 60
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-vct-gray/20 text-vct-gray'
                    }`}
                  >
                    {teamOverall}
                  </div>

                  {/* Team Logo */}
                  <GameImage
                    src={getTeamLogoUrl(team.name)}
                    alt={team.name}
                    className="w-10 h-10"
                  />

                  {/* Team Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-vct-light">
                        {team.name}
                      </span>
                      {isPlayerTeam && (
                        <span className="px-2 py-0.5 bg-vct-red/20 border border-vct-red/50 rounded text-vct-red text-xs font-medium">
                          Your Team
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-vct-gray">
                      {team.region} • {activePlayers.length}/5 roster
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Arrow */}
                <svg
                  className={`w-5 h-5 text-vct-gray transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Expanded Roster */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-vct-gray/20">
                  <div className="pt-4">
                    <h4 className="text-xs font-semibold text-vct-gray uppercase tracking-wide mb-3">
                      Active Roster
                    </h4>
                    {activePlayers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {activePlayers.map((player) => (
                          <PlayerCard
                            key={player.id}
                            player={player}
                            onClick={() => setSelectedPlayer(player)}
                            compact
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-vct-gray">No active players</p>
                    )}
                  </div>

                  {/* Reserve Players */}
                  {team.reservePlayerIds.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-vct-gray/10">
                      <h4 className="text-xs font-semibold text-vct-gray uppercase tracking-wide mb-3">
                        Reserves ({team.reservePlayerIds.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {team.reservePlayerIds.map((id) => {
                          const player = players[id];
                          if (!player) return null;
                          return (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              onClick={() => setSelectedPlayer(player)}
                              compact
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
