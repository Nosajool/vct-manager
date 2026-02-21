// PlayerList Component - Browse all players (free agents + rostered)

import { useState, useMemo } from 'react';
import type { Player, Region } from '../../types';
import { PlayerCard } from './PlayerCard';
import { PlayerDetailModal } from './PlayerDetailModal';
import { playerGenerator } from '../../engine/player';
import { useGameStore } from '../../store';

interface PlayerListProps {
  players: Player[];
  onSignPlayer?: (playerId: string) => void;
}

type StatusFilter = 'all' | 'free_agents' | 'rostered';
type SortField =
  | 'overall'
  | 'potential'
  | 'age'
  | 'name'
  | 'form'
  | 'morale'
  | 'mechanics'
  | 'igl'
  | 'mental'
  | 'clutch'
  | 'vibes'
  | 'lurking'
  | 'entry'
  | 'support'
  | 'stamina';
type SortDirection = 'asc' | 'desc';

export function PlayerList({ players, onSignPlayer }: PlayerListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('free_agents');
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [minOverall, setMinOverall] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 30;
  const teams = useGameStore((state) => state.teams);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Status filter
    if (statusFilter === 'free_agents') {
      result = result.filter((p) => p.teamId === null);
    } else if (statusFilter === 'rostered') {
      result = result.filter((p) => p.teamId !== null);
    }

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
        case 'form':
          aVal = a.form;
          bVal = b.form;
          break;
        case 'morale':
          aVal = a.morale;
          bVal = b.morale;
          break;
        case 'mechanics':
          aVal = a.stats.mechanics;
          bVal = b.stats.mechanics;
          break;
        case 'igl':
          aVal = a.stats.igl;
          bVal = b.stats.igl;
          break;
        case 'mental':
          aVal = a.stats.mental;
          bVal = b.stats.mental;
          break;
        case 'clutch':
          aVal = a.stats.clutch;
          bVal = b.stats.clutch;
          break;
        case 'vibes':
          aVal = a.stats.vibes;
          bVal = b.stats.vibes;
          break;
        case 'lurking':
          aVal = a.stats.lurking;
          bVal = b.stats.lurking;
          break;
        case 'entry':
          aVal = a.stats.entry;
          bVal = b.stats.entry;
          break;
        case 'support':
          aVal = a.stats.support;
          bVal = b.stats.support;
          break;
        case 'stamina':
          aVal = a.stats.stamina;
          bVal = b.stats.stamina;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [players, statusFilter, regionFilter, searchQuery, sortField, sortDirection, minOverall]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedPlayers = filteredPlayers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setCurrentPage(1);

  const handleSign = () => {
    if (selectedPlayer && onSignPlayer) {
      onSignPlayer(selectedPlayer.id);
      setSelectedPlayer(null);
    }
  };

  const regions: (Region | 'all')[] = ['all', 'Americas', 'EMEA', 'Pacific', 'China'];

  const statusButtons: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'free_agents', label: 'Free Agents' },
    { value: 'rostered', label: 'Rostered' },
  ];

  const selectedTeamName = selectedPlayer?.teamId
    ? teams[selectedPlayer.teamId]?.name
    : undefined;

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
              onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
              className="w-full px-3 py-2 bg-vct-dark border border-vct-gray/30 rounded
                         text-vct-light placeholder-vct-gray
                         focus:outline-none focus:border-vct-red/50"
            />
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value as Region | 'all'); resetPage(); }}
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
              onChange={(e) => { setMinOverall(Number(e.target.value)); resetPage(); }}
              className="w-16 px-2 py-2 bg-vct-dark border border-vct-gray/30 rounded
                         text-vct-light focus:outline-none focus:border-vct-red/50"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-vct-gray/20">
          <span className="text-vct-gray text-sm">Status:</span>
          {statusButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); resetPage(); }}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                statusFilter === value
                  ? 'bg-vct-red text-white'
                  : 'bg-vct-dark text-vct-gray hover:text-vct-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-vct-gray/20">
          <span className="text-vct-gray text-sm">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value as SortField);
              setSortDirection('desc');
              resetPage();
            }}
            className="px-3 py-1.5 bg-vct-dark border border-vct-gray/30 rounded
                       text-vct-light text-sm focus:outline-none focus:border-vct-red/50"
          >
            <optgroup label="General">
              <option value="overall">Overall</option>
              <option value="potential">Potential</option>
              <option value="age">Age</option>
              <option value="form">Form</option>
              <option value="morale">Morale</option>
              <option value="name">Name</option>
            </optgroup>
            <optgroup label="Stats">
              <option value="mechanics">Mechanics</option>
              <option value="igl">Leadership</option>
              <option value="mental">Mental</option>
              <option value="clutch">Clutch</option>
              <option value="vibes">Vibes</option>
              <option value="lurking">Lurking</option>
              <option value="entry">Entry</option>
              <option value="support">Support</option>
              <option value="stamina">Stamina</option>
            </optgroup>
          </select>
          <button
            onClick={() =>
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
            }
            className="px-3 py-1.5 text-sm rounded bg-vct-dark text-vct-gray hover:text-vct-light transition-colors border border-vct-gray/30"
            title="Toggle sort direction"
          >
            {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-vct-gray text-sm">
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
          {totalPages > 1 && (
            <span> — page {safePage} of {totalPages}</span>
          )}
        </p>
      </div>

      {/* Player List */}
      {pagedPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedPlayers.map((player) => {
            const teamName = player.teamId ? teams[player.teamId]?.name : undefined;
            return (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => setSelectedPlayer(player)}
                selected={selectedPlayer?.id === player.id}
                showContract
                teamName={teamName}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
          <p className="text-vct-gray">No players match your filters</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safePage === 1}
            className="px-2 py-1 text-sm rounded bg-vct-dark text-vct-gray hover:text-vct-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage(safePage - 1)}
            disabled={safePage === 1}
            className="px-3 py-1 text-sm rounded bg-vct-dark text-vct-gray hover:text-vct-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹ Prev
          </button>
          <span className="px-3 py-1 text-sm text-vct-light">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(safePage + 1)}
            disabled={safePage === totalPages}
            className="px-3 py-1 text-sm rounded bg-vct-dark text-vct-gray hover:text-vct-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage === totalPages}
            className="px-2 py-1 text-sm rounded bg-vct-dark text-vct-gray hover:text-vct-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            »
          </button>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onSign={!selectedPlayer.teamId && onSignPlayer ? handleSign : undefined}
          teamName={selectedTeamName}
        />
      )}
    </div>
  );
}
