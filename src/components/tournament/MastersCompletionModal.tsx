// MastersCompletionModal - Shows complete Masters tournament results
//
// Displayed when a Masters (or Champions) tournament completes.
// Shows Swiss Stage final standings and Playoff Bracket results.
//
// Data flow:
// 1. TournamentService detects Masters completion
// 2. Calls openModal('masters_completion', data)
// 3. TimeBar renders this modal

import { useState } from 'react';
import { useGameStore } from '../../store';
import type { SwissTeamRecord } from '../../types';

export interface MastersCompletionModalData {
  tournamentId: string;
  tournamentName: string;
  championId: string;
  championName: string;
  finalPlacements: Array<{
    teamId: string;
    teamName: string;
    placement: number;
    prize: number;
  }>;
  swissStandings: SwissTeamRecord[];
  playerTeamPlacement?: {
    placement: number;
    prize: number;
    qualifiedFromSwiss: boolean;
  };
}

interface MastersCompletionModalProps {
  data: MastersCompletionModalData;
  onClose: () => void;
}

type ViewTab = 'summary' | 'swiss' | 'bracket';

export function MastersCompletionModal({ data, onClose }: MastersCompletionModalProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('summary');

  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const closeModal = useGameStore((state) => state.closeModal);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Check if player team participated
  const playerParticipated = data.finalPlacements.some((p) => p.teamId === playerTeamId);
  const playerPlacement = data.finalPlacements.find((p) => p.teamId === playerTeamId);

  // Format prize money
  const formatPrize = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toLocaleString()}`;
  };

  // Get placement suffix
  const getPlacementSuffix = (n: number): string => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  // Handle viewing tournament bracket
  const handleViewBracket = () => {
    closeModal();
    setActiveView('tournament');
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <SummaryView
            data={data}
            playerTeamId={playerTeamId}
            formatPrize={formatPrize}
            getPlacementSuffix={getPlacementSuffix}
          />
        );
      case 'swiss':
        return (
          <SwissStandingsView
            standings={data.swissStandings}
            playerTeamId={playerTeamId}
            teams={teams}
          />
        );
      case 'bracket':
        return (
          <BracketResultsView
            placements={data.finalPlacements}
            playerTeamId={playerTeamId}
            formatPrize={formatPrize}
            getPlacementSuffix={getPlacementSuffix}
          />
        );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-vct-darker rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-vct-gray/20 text-center bg-gradient-to-b from-vct-dark to-vct-darker">
          <div className="text-yellow-400 text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold text-vct-light">
            {data.tournamentName} - Complete!
          </h2>
          <p className="text-vct-gray mt-1">Tournament Champion</p>
          <p className="text-xl font-bold text-yellow-400 mt-2">
            {data.championName}
          </p>
        </div>

        {/* Player Team Status Banner */}
        {playerParticipated && playerPlacement && (
          <div
            className={`p-4 border-b ${
              playerPlacement.placement === 1
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : playerPlacement.placement <= 4
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-vct-gray/10 border-vct-gray/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`font-bold ${
                    playerPlacement.placement === 1
                      ? 'text-yellow-400'
                      : playerPlacement.placement <= 4
                        ? 'text-green-400'
                        : 'text-vct-light'
                  }`}
                >
                  {playerPlacement.placement === 1
                    ? 'Your Team Won the Tournament!'
                    : `Your Team Finished ${playerPlacement.placement}${getPlacementSuffix(playerPlacement.placement)}`}
                </p>
                <p className="text-sm text-vct-gray">
                  {playerTeam?.name || 'Your Team'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">
                  {formatPrize(playerPlacement.prize)}
                </p>
                <p className="text-xs text-vct-gray">Prize Money</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-vct-gray/20">
          {(['summary', 'swiss', 'bracket'] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-vct-red border-b-2 border-vct-red bg-vct-red/5'
                  : 'text-vct-gray hover:text-vct-light'
              }`}
            >
              {tab === 'summary'
                ? 'Summary'
                : tab === 'swiss'
                  ? 'Swiss Stage'
                  : 'Playoff Results'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-between items-center">
          <button
            onClick={handleViewBracket}
            className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg font-medium transition-colors"
          >
            View Full Bracket
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Summary View - Overview of tournament results
function SummaryView({
  data,
  playerTeamId,
  formatPrize,
  getPlacementSuffix,
}: {
  data: MastersCompletionModalData;
  playerTeamId: string | null;
  formatPrize: (n: number) => string;
  getPlacementSuffix: (n: number) => string;
}) {
  // Show top 8 placements
  const topPlacements = data.finalPlacements.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top 4 Placements */}
      <div>
        <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
          Final Standings
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {topPlacements.slice(0, 4).map((p) => {
            const isPlayerTeam = p.teamId === playerTeamId;
            const isChampion = p.placement === 1;

            return (
              <div
                key={p.teamId}
                className={`p-4 rounded-lg border ${
                  isChampion
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : isPlayerTeam
                      ? 'bg-vct-red/10 border-vct-red/30'
                      : 'bg-vct-dark border-vct-gray/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${
                        p.placement === 1
                          ? 'text-yellow-400'
                          : p.placement === 2
                            ? 'text-gray-300'
                            : p.placement === 3
                              ? 'text-amber-600'
                              : 'text-vct-gray'
                      }`}
                    >
                      {p.placement}
                      {getPlacementSuffix(p.placement)}
                    </span>
                    <div>
                      <p
                        className={`font-medium ${
                          isPlayerTeam ? 'text-vct-red' : 'text-vct-light'
                        }`}
                      >
                        {p.teamName}
                      </p>
                      <p className="text-sm text-green-400">
                        {formatPrize(p.prize)}
                      </p>
                    </div>
                  </div>
                  {isChampion && <span className="text-2xl">🏆</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5th-8th Placements */}
      {topPlacements.length > 4 && (
        <div>
          <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
            Other Placements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {topPlacements.slice(4, 8).map((p) => {
              const isPlayerTeam = p.teamId === playerTeamId;

              return (
                <div
                  key={p.teamId}
                  className={`p-3 rounded-lg ${
                    isPlayerTeam ? 'bg-vct-red/10' : 'bg-vct-dark'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-vct-gray font-medium">
                        {p.placement}
                        {getPlacementSuffix(p.placement)}
                      </span>
                      <span
                        className={`text-sm ${
                          isPlayerTeam ? 'text-vct-red' : 'text-vct-light'
                        }`}
                      >
                        {p.teamName}
                      </span>
                    </div>
                    <span className="text-xs text-green-400">
                      {formatPrize(p.prize)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Swiss Standings View - Final Swiss stage standings
function SwissStandingsView({
  standings,
  playerTeamId,
  teams,
}: {
  standings: SwissTeamRecord[];
  playerTeamId: string | null;
  teams: Record<string, { name: string }>;
}) {
  // Sort standings: qualified first, then eliminated, by wins/losses
  const sortedStandings = [...standings].sort((a, b) => {
    // Status order: qualified > eliminated
    const statusOrder = { qualified: 0, active: 1, eliminated: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    // Then by wins
    if (b.wins !== a.wins) return b.wins - a.wins;
    // Then by losses
    if (a.losses !== b.losses) return a.losses - b.losses;
    // Then by round diff
    return b.roundDiff - a.roundDiff;
  });

  const statusColors = {
    qualified: 'text-green-400 bg-green-400/10',
    active: 'text-yellow-400 bg-yellow-400/10',
    eliminated: 'text-red-400 bg-red-400/10',
  };

  const statusLabels = {
    qualified: 'Qualified',
    active: 'Active',
    eliminated: 'Eliminated',
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
        Swiss Stage Final Standings
      </h4>
      <div className="bg-vct-dark rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-vct-gray uppercase border-b border-vct-gray/20">
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-3 text-center w-20">Record</th>
              <th className="py-3 px-3 text-center w-16">RD</th>
              <th className="py-3 px-3 text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((entry) => {
              const isPlayerTeam = entry.teamId === playerTeamId;
              const teamName = teams[entry.teamId]?.name || 'Unknown';

              return (
                <tr
                  key={entry.teamId}
                  className={`border-b border-vct-gray/10 ${
                    isPlayerTeam ? 'bg-vct-red/10' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <span
                      className={`font-medium ${
                        isPlayerTeam ? 'text-vct-red' : 'text-white'
                      }`}
                    >
                      {teamName}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-green-400">{entry.wins}</span>
                    <span className="text-vct-gray mx-1">-</span>
                    <span className="text-red-400">{entry.losses}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={
                        entry.roundDiff > 0
                          ? 'text-green-400'
                          : entry.roundDiff < 0
                            ? 'text-red-400'
                            : 'text-vct-gray'
                      }
                    >
                      {entry.roundDiff > 0 ? '+' : ''}
                      {entry.roundDiff}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded ${statusColors[entry.status]}`}
                    >
                      {statusLabels[entry.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-vct-gray mt-3">
        Teams with 2 wins qualified for Playoffs. Teams with 2 losses were eliminated.
      </p>
    </div>
  );
}

// Bracket Results View - Complete bracket placements
function BracketResultsView({
  placements,
  playerTeamId,
  formatPrize,
  getPlacementSuffix,
}: {
  placements: Array<{
    teamId: string;
    teamName: string;
    placement: number;
    prize: number;
  }>;
  playerTeamId: string | null;
  formatPrize: (n: number) => string;
  getPlacementSuffix: (n: number) => string;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
        Playoff Final Results
      </h4>
      <div className="space-y-2">
        {placements.map((p) => {
          const isPlayerTeam = p.teamId === playerTeamId;
          const isTop3 = p.placement <= 3;

          return (
            <div
              key={p.teamId}
              className={`p-3 rounded-lg flex items-center justify-between ${
                p.placement === 1
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : p.placement === 2
                    ? 'bg-gray-400/10 border border-gray-400/30'
                    : p.placement === 3
                      ? 'bg-amber-600/10 border border-amber-600/30'
                      : isPlayerTeam
                        ? 'bg-vct-red/10'
                        : 'bg-vct-dark'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 text-lg font-bold ${
                    p.placement === 1
                      ? 'text-yellow-400'
                      : p.placement === 2
                        ? 'text-gray-300'
                        : p.placement === 3
                          ? 'text-amber-600'
                          : 'text-vct-gray'
                  }`}
                >
                  {p.placement}
                  {getPlacementSuffix(p.placement)}
                </span>
                <span
                  className={`font-medium ${
                    isPlayerTeam ? 'text-vct-red' : 'text-vct-light'
                  }`}
                >
                  {p.teamName}
                </span>
                {p.placement === 1 && <span className="ml-2">🏆</span>}
              </div>
              <span
                className={`font-medium ${isTop3 ? 'text-green-400' : 'text-green-400/60'}`}
              >
                {formatPrize(p.prize)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
