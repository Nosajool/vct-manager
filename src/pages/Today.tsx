// Today Page - Main game hub
//
// Shows:
// - Coach's observations (narrative hints + actionable alerts merged)
// - Recent narrative history

import { useGameStore } from '../store';
import { timeProgression } from '../engine/calendar';
import { economyService } from '../services';
import { getReputationTier } from '../types/team';
import { FirstDayObjectives } from '../components/onboarding/FirstDayObjectives';
import { NarrativeHistoryPanel } from '../components/narrative/NarrativeHistoryPanel';

export function Today() {
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

      {/* Recent Events Section */}
      <NarrativeHistoryPanel limit={30} />
    </div>
  );
}
