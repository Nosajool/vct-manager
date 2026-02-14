// ActionsPanel - Training and Scrim actions for Today view
//
// Shows training and scrim buttons with summary info.
// Disabled on match days with explanatory message.

import { useGameStore } from '../../store';
import { useMatchDay, useFeatureUnlocked } from '../../hooks';
import { scrimService, trainingService } from '../../services';

interface ActionsPanelProps {
  onTrainingClick: () => void;
  onScrimClick: () => void;
}

export function ActionsPanel({ onTrainingClick, onScrimClick }: ActionsPanelProps) {
  const setActiveView = useGameStore((state) => state.setActiveView);
  const playerTeam = useGameStore((state) => {
    const teamId = state.playerTeamId;
    return teamId ? state.teams[teamId] : null;
  });

  const { isMatchDay, opponentName } = useMatchDay();

  // Check feature gates
  const scrimsUnlocked = useFeatureUnlocked('scrims');

  // Get training summary
  const trainingSummary = trainingService.getTeamTrainingSummary();

  // Get scrim eligibility
  const scrimStatus = scrimService.checkScrimEligibility();

  // Get map pool summary for scrim preview
  const mapPoolSummary = scrimService.getMapPoolSummary();

  // Match day - show disabled state
  if (isMatchDay) {
    return (
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Actions</h3>

        <div className="p-4 bg-vct-red/10 border border-vct-red/30 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-vct-red font-bold">MATCH DAY</span>
          </div>
          <p className="text-sm text-vct-gray">
            No training or scrims on match days. Focus on today's match vs {opponentName}.
          </p>
          <p className="text-xs text-vct-gray/60 mt-2">
            Use time controls to simulate the match
          </p>
        </div>

        {/* Roster quick link */}
        <button
          onClick={() => setActiveView('team')}
          className="w-full p-3 bg-vct-gray/10 border border-vct-gray/20 rounded-lg text-left hover:bg-vct-gray/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-vct-light">View Roster</span>
            <span className="text-vct-gray text-sm">
              {playerTeam?.playerIds.length || 0} active, {playerTeam?.reservePlayerIds.length || 0} reserve
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Non-match day - show actions
  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Actions</h3>

      <div className="space-y-3">
        {/* Training Button */}
        <button
          onClick={onTrainingClick}
          className="w-full p-3 border rounded-lg transition-colors text-left bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏋️</span>
              <span className="text-blue-400 font-medium">
                Training
              </span>
            </div>
            <span className="px-2 py-0.5 text-xs rounded font-medium bg-blue-500/20 text-blue-400">
              {trainingSummary.totalPlayers} players
            </span>
          </div>
          <p className="text-xs text-vct-gray mt-1">
            Train your players to improve their stats
          </p>
        </button>

        {/* Scrim Button */}
        <button
          onClick={onScrimClick}
          disabled={!scrimsUnlocked || !scrimStatus.canScrim}
          className={`w-full p-3 border rounded-lg transition-colors text-left ${
            scrimsUnlocked && scrimStatus.canScrim
              ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30'
              : 'bg-vct-gray/5 border-vct-gray/10 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤝</span>
              <span
                className={
                  scrimsUnlocked && scrimStatus.canScrim ? 'text-purple-400 font-medium' : 'text-vct-gray/60'
                }
              >
                Scrim
              </span>
            </div>
            <span
              className={`px-2 py-0.5 text-xs rounded font-medium ${
                scrimsUnlocked && scrimStatus.canScrim
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-vct-gray/20 text-vct-gray'
              }`}
            >
              {scrimsUnlocked ? 'Available' : 'Unlocks Week 2'}
            </span>
          </div>
          <p className="text-xs text-vct-gray mt-1">
            {!scrimsUnlocked
              ? 'Build your team through training first'
              : scrimStatus.canScrim
              ? (() => {
                  const weakestMap = mapPoolSummary.weakestMaps[0];
                  return weakestMap
                    ? `Practice ${weakestMap.map} to boost strength`
                    : 'Practice maps and build team chemistry';
                })()
              : scrimStatus.reason || 'Scrim unavailable'}
          </p>
        </button>

        {/* Roster Link */}
        <button
          onClick={() => setActiveView('team')}
          className="w-full p-3 bg-vct-gray/10 border border-vct-gray/20 rounded-lg text-left hover:bg-vct-gray/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-vct-light">Roster</span>
            </div>
            <span className="text-vct-gray text-sm">
              {playerTeam?.playerIds.length || 0} active, {playerTeam?.reservePlayerIds.length || 0} reserve
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
