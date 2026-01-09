// FreeAgentList Component - Browse and sign free agents

import { useState, useMemo } from 'react';
import type { Player, Region } from '../../types';
import { PlayerCard } from './PlayerCard';
import { PlayerDetailModal } from './PlayerDetailModal';
import { playerGenerator } from '../../engine/player';

interface FreeAgentListProps {
  players: Player[];
  onSignPlayer?: (playerId: string) => void;
}

type SortField = 'overall' | 'age' | 'potential' | 'name';
type SortDirection = 'asc' | 'desc';

export function FreeAgentList({ players, onSignPlayer }: FreeAgentListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [minOverall, setMinOverall] = useState(0);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = players.filter((p) => p.teamId === null);

    // Region filter
    if (regionFilter !== 'all') {
      result = result.filter((p) => p.region === regionFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.nationality.toLowerCase().includes(query)
      );
    }

    // Overall filter
    if (minOverall > 0) {
      result = result.filter((p) => {
        const overall = playerGenerator.calculateOverall(p.stats);
        return overall >= minOverall;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'overall':
          aVal = playerGenerator.calculateOverall(a.stats);
          bVal = playerGenerator.calculateOverall(b.stats);
          break;
        case 'age':
          aVal = a.age;
          bVal = b.age;
          break;
        case 'potential':
          aVal = a.potential;
          bVal = b.potential;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [players, regionFilter, searchQuery, sortField, sortDirection, minOverall]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSign = () => {
    if (selectedPlayer && onSignPlayer) {
      onSignPlayer(selectedPlayer.id);
      setSelectedPlayer(null);
    }
  };

  const regions: (Region | 'all')[] = ['all', 'Americas', 'EMEA', 'Pacific', 'China'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-vct-dark border border-vct-gray/30 rounded
                         text-vct-light placeholder-vct-gray
                         focus:outline-none focus:border-vct-red/50"
            />
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as Region | 'all')}
              className="px-3 py-2 bg-vct-dark border border-vct-gray/30 rounded
                         text-vct-light focus:outline-none focus:border-vct-red/50"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? 'All Regions' : r}
                </option>
              ))}
            </select>
          </div>

          {/* Min Overall */}
          <div className="flex items-center gap-2">
            <span className="text-vct-gray text-sm">Min OVR:</span>
            <input
              type="number"
              min={0}
              max={99}
              value={minOverall}
              onChange={(e) => setMinOverall(Number(e.target.value))}
              className="w-16 px-2 py-2 bg-vct-dark border border-vct-gray/30 rounded
                         text-vct-light focus:outline-none focus:border-vct-red/50"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-vct-gray/20">
          <span className="text-vct-gray text-sm">Sort by:</span>
          {(['overall', 'potential', 'age', 'name'] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                sortField === field
                  ? 'bg-vct-red text-white'
                  : 'bg-vct-dark text-vct-gray hover:text-vct-light'
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-vct-gray text-sm">
          {filteredPlayers.length} free agents found
        </p>
      </div>

      {/* Player List */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.slice(0, 30).map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => setSelectedPlayer(player)}
              selected={selectedPlayer?.id === player.id}
              showContract
            />
          ))}
        </div>
      ) : (
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
          <p className="text-vct-gray">No free agents match your filters</p>
        </div>
      )}

      {/* Show more indicator */}
      {filteredPlayers.length > 30 && (
        <p className="text-center text-vct-gray text-sm">
          Showing 30 of {filteredPlayers.length} players. Use filters to narrow
          results.
        </p>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onSign={onSignPlayer ? handleSign : undefined}
        />
      )}
    </div>
  );
}
