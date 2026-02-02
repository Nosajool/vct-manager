// Today Page - Main game hub with tournament context and daily actions
//
// Shows:
// - Tournament context (position, standings, next match)
// - Training/Scrim actions (disabled on match days)
// - Alerts (contracts, morale, map practice, finances)

import { useState } from 'react';
import { useGameStore } from '../store';
import { timeProgression } from '../engine/calendar';
import { economyService } from '../services';
import { TournamentContextPanel, ActionsPanel, AlertsPanel } from '../components/today';
import { TrainingModal } from '../components/calendar';
import { ScrimModal } from '../components/scrim';

export function Today() {
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [scrimModalOpen, setScrimModalOpen] = useState(false);

  const initialized = useGameStore((state) => state.initialized);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const calendar = useGameStore((state) => state.calendar);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Show loading state if not initialized
  if (!initialized || !gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl text-vct-gray mb-4">Game not initialized</p>
          <p className="text-sm text-vct-gray/60">Start a new game to begin</p>
        </div>
      </div>
    );
  }

  // Format date for header
  const formattedDate = timeProgression.formatDate(calendar.currentDate);

  // Get phase display name
  const phaseDisplayMap: Record<string, string> = {
    offseason: 'Offseason',
    kickoff: 'Kickoff',
    stage1: 'Stage 1',
    stage1_playoffs: 'Stage 1 Playoffs',
    stage2: 'Stage 2',
    stage2_playoffs: 'Stage 2 Playoffs',
    masters1: 'Masters Santiago',
    masters2: 'Masters London',
    champions: 'Champions',
  };
  const phaseDisplay = phaseDisplayMap[calendar.currentPhase] || calendar.currentPhase;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-vct-red/20 to-vct-dark border border-vct-red/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vct-light">Today</h1>
            <p className="text-vct-gray">
              {formattedDate} • {phaseDisplay}
            </p>
          </div>
          {playerTeam && (
            <div className="text-right">
              <p className="text-lg font-bold text-vct-light">{playerTeam.name}</p>
              <p className="text-vct-gray text-sm">{playerTeam.region}</p>
              <p
                className={`text-sm font-medium ${
                  playerTeam.finances.balance >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {economyService.formatCurrency(playerTeam.finances.balance)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tournament Context (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <TournamentContextPanel />
        </div>

        {/* Right Column - Actions & Alerts */}
        <div className="space-y-6">
          <ActionsPanel
            onTrainingClick={() => setTrainingModalOpen(true)}
            onScrimClick={() => setScrimModalOpen(true)}
          />
          <AlertsPanel />
        </div>
      </div>

      {/* Training Modal */}
      <TrainingModal isOpen={trainingModalOpen} onClose={() => setTrainingModalOpen(false)} />

      {/* Scrim Modal */}
      <ScrimModal isOpen={scrimModalOpen} onClose={() => setScrimModalOpen(false)} />
    </div>
  );
}
