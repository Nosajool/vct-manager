// StageCompletionModal - Shows league stage completion results
//
// Displayed when Stage 1 or Stage 2 league completes.
// Shows final league standings with top 8 teams qualifying for playoffs.
//
// Data flow:
// 1. CalendarService/MatchService detects all stage matches complete
// 2. TournamentService.handleStageCompletion() is called
// 3. Calls openModal('stage_completion', data)
// 4. TimeBar renders this modal
// 5. On close, triggers stage_to_playoffs transition

import { useRef } from 'react';
import { useGameStore } from '../../store';
import { tournamentTransitionService } from '../../services/TournamentTransitionService';
import type { StandingsEntry } from '../../store/slices/competitionSlice';

export interface StageCompletionModalData {
  tournamentId: string;
  tournamentName: string;
  stageType: 'stage1' | 'stage2';
  standings: StandingsEntry[];
  qualifiedTeams: Array<{
    teamId: string;
    teamName: string;
    placement: number;
    wins: number;
    losses: number;
    roundDiff: number;
  }>;
  playerQualified: boolean;
  playerPlacement?: number;
  /** Transition ID to execute when modal closes (e.g., 'stage1_to_stage1_playoffs') */
  nextTransitionId?: string;
}

interface StageCompletionModalProps {
  data: StageCompletionModalData;
  onClose: () => void;
}

export function StageCompletionModal({ data, onClose }: StageCompletionModalProps) {
  const transitionTriggeredRef = useRef(false);

  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const closeModal = useGameStore((state) => state.closeModal);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Get stage display name
  const stageDisplayName = data.stageType === 'stage1' ? 'Stage 1' : 'Stage 2';
  const playoffsName = data.stageType === 'stage1' ? 'Stage 1 Playoffs' : 'Stage 2 Playoffs';

  /**
   * Execute the next phase transition (Stage → Stage Playoffs)
   * This is called when the user closes the modal via any method
   */
  const executeTransitionIfNeeded = () => {
    if (transitionTriggeredRef.current || !data.nextTransitionId) {
      return;
    }
    transitionTriggeredRef.current = true;

    console.log(`Executing transition: ${data.nextTransitionId}`);
    const result = tournamentTransitionService.executeTransition(data.nextTransitionId);

    if (result.success) {
      console.log(`Successfully transitioned to ${result.newPhase}`);
    } else {
      console.error(`Transition failed: ${result.error}`);
    }
  };

  /**
   * Handle modal close - execute transition then close
   */
  const handleClose = () => {
    executeTransitionIfNeeded();
    onClose();
  };

  // Handle viewing tournament standings
  const handleViewStandings = () => {
    executeTransitionIfNeeded();
    closeModal();
    setActiveView('tournament');
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

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-vct-gray/20 text-center bg-gradient-to-b from-vct-dark to-vct-darker">
          <div className="text-green-400 text-4xl mb-2">📊</div>
          <h2 className="text-2xl font-bold text-vct-light">
            {stageDisplayName} League Complete!
          </h2>
          <p className="text-vct-gray mt-1">
            Top 8 teams qualify for {playoffsName}
          </p>
        </div>

        {/* Player Team Status Banner */}
        <div
          className={`p-4 border-b ${
            data.playerQualified
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`font-bold ${
                  data.playerQualified ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {data.playerQualified
                  ? `Your Team Qualified for ${playoffsName}!`
                  : `Your Team Did Not Qualify`}
              </p>
              <p className="text-sm text-vct-gray">
                {playerTeam?.name || 'Your Team'} -{' '}
                {data.playerPlacement
                  ? `${data.playerPlacement}${getPlacementSuffix(data.playerPlacement)} Place`
                  : 'Unknown'}
              </p>
            </div>
            {data.playerQualified && (
              <div className="text-right">
                <span className="text-2xl">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Standings Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div>
            <h4 className="text-sm font-medium text-vct-gray uppercase mb-3">
              Final League Standings
            </h4>
            <div className="bg-vct-dark rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-vct-gray uppercase border-b border-vct-gray/20">
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-3 text-center w-20">Record</th>
                    <th className="py-3 px-3 text-center w-16">RD</th>
                    <th className="py-3 px-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.standings.map((entry, index) => {
                    const isPlayerTeam = entry.teamId === playerTeamId;
                    const isQualified = (entry.placement || index + 1) <= 8;

                    return (
                      <tr
                        key={entry.teamId}
                        className={`border-b border-vct-gray/10 ${
                          isPlayerTeam
                            ? 'bg-vct-red/10'
                            : isQualified
                              ? 'bg-green-500/5'
                              : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              isQualified ? 'text-green-400' : 'text-vct-gray'
                            }`}
                          >
                            {entry.placement || index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              isPlayerTeam ? 'text-vct-red' : 'text-white'
                            }`}
                          >
                            {entry.teamName}
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
                            className={`text-xs px-2 py-1 rounded ${
                              isQualified
                                ? 'text-green-400 bg-green-400/10'
                                : 'text-red-400 bg-red-400/10'
                            }`}
                          >
                            {isQualified ? 'Qualified' : 'Eliminated'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-vct-gray mt-3">
              Top 8 teams advance to the {playoffsName}. Remaining teams are eliminated from this split.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-between items-center">
          <button
            onClick={handleViewStandings}
            className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg font-medium transition-colors"
          >
            View Full Standings
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Continue to {playoffsName}
          </button>
        </div>
      </div>
    </div>
  );
}
