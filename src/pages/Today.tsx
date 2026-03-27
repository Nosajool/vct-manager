// Today Page - Main game hub with tournament context and daily actions
//
// Shows:
// - Tournament context (position, standings, next match)
// - Day plan panel (configure training/scrims before advancing)
// - Alerts (contracts, morale, map practice, finances)

import { useState } from 'react';
import { useGameStore } from '../store';
import { timeProgression } from '../engine/calendar';
import { economyService } from '../services';
import { getReputationTier } from '../types/team';
import { TournamentContextPanel, AlertsPanel } from '../components/today';
import { CoachObservationsPanel } from '../components/today/CoachObservationsPanel';
import { FirstDayObjectives } from '../components/onboarding/FirstDayObjectives';
import { ScrimModal } from '../components/scrim';
import { NarrativeHistoryPanel } from '../components/narrative/NarrativeHistoryPanel';

export function Today() {
  const [scrimModalOpen, setScrimModalOpen] = useState(false);
  const [scrimInitialMaps, setScrimInitialMaps] = useState<string[] | undefined>(undefined);

  // Handler for opening scrim modal from alerts (with pre-selected maps)
  const handleOpenScrimModal = (initialMaps?: string[]) => {
    setScrimInitialMaps(initialMaps);
    setScrimModalOpen(true);
  };

  // Handler for closing scrim modal (clears initial maps)
  const handleCloseScrimModal = () => {
    setScrimModalOpen(false);
    setScrimInitialMaps(undefined);
  };

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

  const reputationTier = playerTeam ? getReputationTier(playerTeam.reputation.fanbase) : null;

  return (
    <div className="space-y-6">
      {/* Compact Hub Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-vct-gray uppercase tracking-wide">{phaseDisplay}</p>
          <h1 className="text-xl font-bold text-vct-light">{formattedDate}</h1>
        </div>
        {playerTeam && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-vct-gray">{reputationTier}</span>
            <span className="text-vct-gray/40">|</span>
            <span className="text-vct-gray">Hype {playerTeam.reputation.hypeLevel}/100</span>
            <span className="text-vct-gray/40">|</span>
            <span className={playerTeam.finances.balance >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
              {economyService.formatCurrency(playerTeam.finances.balance)}
            </span>
          </div>
        )}
      </div>

      {/* Day 1 Onboarding Checklist — hidden once objectives complete */}
      <FirstDayObjectives />

      {/* Coach's observations — soft narrative hints about team state */}
      <CoachObservationsPanel />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tournament Context (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <TournamentContextPanel />
        </div>

        {/* Right Column - Alerts */}
        <div className="space-y-6">
          <AlertsPanel onOpenScrimModal={handleOpenScrimModal} />
        </div>
      </div>

      {/* Recent Events Section */}
      <NarrativeHistoryPanel limit={20} />

      {/* Scrim Modal for Alerts (DayPlanPanel has its own modals for event cards) */}
      <ScrimModal
        isOpen={scrimModalOpen}
        onClose={handleCloseScrimModal}
        initialMaps={scrimInitialMaps}
      />
    </div>
  );
}
