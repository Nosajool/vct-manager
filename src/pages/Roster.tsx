// Team Page - Manage team roster and browse free agents

import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { useFeatureUnlocked } from '../hooks/useFeatureGate';
import { RosterList } from '../components/roster/RosterList';
import { AllTeamsView } from '../components/roster/AllTeamsView';
import { PlayerList } from '../components/roster/PlayerList';
import { ContractNegotiationModal } from '../components/roster/ContractNegotiationModal';
import { ReleasePlayerModal } from '../components/roster/ReleasePlayerModal';
import { TeamStrategy } from '../components/roster/TeamStrategy';
import { TeamStatsView } from '../components/roster/TeamStatsView';
import { ScrimOverview } from '../components/scrim';
import type { Player } from '../types';
import { FirstVisitHint } from '../components/onboarding/FirstVisitHint';

type TeamTab = 'roster' | 'freeagents' | 'allteams' | 'strategy' | 'stats' | 'scrims';

export function Roster() {
  const [activeTab, setActiveTab] = useState<TeamTab>('roster');

  // Modal states
  const [signingPlayer, setSigningPlayer] = useState<Player | null>(null);
  const [releasingPlayer, setReleasingPlayer] = useState<Player | null>(null);

  const setActiveView = useGameStore((state) => state.setActiveView);
  const teamTab = useGameStore((state) => state.teamTab);
  const setTeamTab = useGameStore((state) => state.setTeamTab);
  const hasSeenHint = useGameStore((state) => state.onboardingHasSeenHintRoster);
  const setOnboardingHasVisitedRoster = useGameStore((state) => state.setOnboardingHasVisitedRoster);
  const setOnboardingHasSeenHintRoster = useGameStore((state) => state.setOnboardingHasSeenHintRoster);

  // Mark roster as visited on first load (for Day 1 checklist)
  useEffect(() => {
    setOnboardingHasVisitedRoster();
  }, [setOnboardingHasVisitedRoster]);

  // Pick up teamTab from store (set by navigation from other pages)
  useEffect(() => {
    if (teamTab) {
      setActiveTab(teamTab as TeamTab);
      setTeamTab(null);
    }
  }, [teamTab, setTeamTab]);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);

  // Check feature gates
  const scrimsUnlocked = useFeatureUnlocked('scrims');
  const transfersUnlocked = useFeatureUnlocked('transfers');
  const strategyUnlocked = useFeatureUnlocked('strategy');

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;
  const allPlayers = Object.values(players);
  const teamPlayers = playerTeam
    ? allPlayers.filter(
        (p) =>
          playerTeam.playerIds.includes(p.id) ||
          playerTeam.reservePlayerIds.includes(p.id)
      )
    : [];

  // Open contract negotiation modal for signing
  const handleSignPlayer = (playerId: string) => {
    const player = players[playerId];
    if (player) {
      setSigningPlayer(player);
    }
  };

  // Open release confirmation modal
  const handleReleasePlayer = (playerId: string) => {
    const player = players[playerId];
    if (player) {
      setReleasingPlayer(player);
    }
  };

  // Refresh data after successful operations
  const handleSigningSuccess = () => {
    setSigningPlayer(null);
  };

  const handleReleaseSuccess = () => {
    setReleasingPlayer(null);
  };

  return (
    <div className="space-y-6">
      {/* First-visit hint */}
      {!hasSeenHint && (
        <FirstVisitHint
          message="Your players are your most important asset. Review contracts, morale, and agent preferences. A strong starting lineup wins matches."
          onDismiss={setOnboardingHasSeenHintRoster}
        />
      )}

      {/* Back to Hub */}
      <button
        onClick={() => setActiveView('today')}
        className="flex items-center gap-1.5 text-sm text-vct-gray hover:text-vct-light transition-colors mb-2"
      >
        ← Hub
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-vct-light">Team</h1>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-vct-gray">
            Total Players:{' '}
            <span className="text-vct-light font-medium">
              {allPlayers.length}
            </span>
          </div>
          <div className="text-vct-gray">
            Free Agents:{' '}
            <span className="text-green-400 font-medium">
              {allPlayers.filter((p) => !p.teamId).length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-2 border-b border-vct-gray/20 min-w-max">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === 'roster'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Roster
          </button>
          <button
            onClick={() => transfersUnlocked && setActiveTab('freeagents')}
            disabled={!transfersUnlocked}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px relative ${
              activeTab === 'freeagents'
                ? 'text-vct-red border-vct-red'
                : transfersUnlocked
                ? 'text-vct-gray border-transparent hover:text-vct-light'
                : 'text-vct-gray/40 border-transparent cursor-not-allowed'
            }`}
          >
            Players
            {!transfersUnlocked && (
              <span className="ml-2 text-xs text-vct-gray/60">Unlocks Week 4</span>
            )}
          </button>
          <button
            onClick={() => transfersUnlocked && setActiveTab('allteams')}
            disabled={!transfersUnlocked}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px relative ${
              activeTab === 'allteams'
                ? 'text-vct-red border-vct-red'
                : transfersUnlocked
                ? 'text-vct-gray border-transparent hover:text-vct-light'
                : 'text-vct-gray/40 border-transparent cursor-not-allowed'
            }`}
          >
            All Teams
            {!transfersUnlocked && (
              <span className="ml-2 text-xs text-vct-gray/60">Unlocks Week 4</span>
            )}
          </button>
          <button
            onClick={() => strategyUnlocked && setActiveTab('strategy')}
            disabled={!strategyUnlocked}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px relative ${
              activeTab === 'strategy'
                ? 'text-vct-red border-vct-red'
                : strategyUnlocked
                ? 'text-vct-gray border-transparent hover:text-vct-light'
                : 'text-vct-gray/40 border-transparent cursor-not-allowed'
            }`}
          >
            Strategy
            {!strategyUnlocked && (
              <span className="ml-2 text-xs text-vct-gray/60">Unlocks at Stage 1</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === 'stats'
                ? 'text-vct-red border-vct-red'
                : 'text-vct-gray border-transparent hover:text-vct-light'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => scrimsUnlocked && setActiveTab('scrims')}
            disabled={!scrimsUnlocked}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px relative ${
              activeTab === 'scrims'
                ? 'text-vct-red border-vct-red'
                : scrimsUnlocked
                ? 'text-vct-gray border-transparent hover:text-vct-light'
                : 'text-vct-gray/40 border-transparent cursor-not-allowed'
            }`}
          >
            Scrims
            {!scrimsUnlocked && (
              <span className="ml-2 text-xs text-vct-gray/60">Unlocks Week 2</span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'roster' && playerTeam ? (
        <RosterList
          team={playerTeam}
          players={teamPlayers}
          onReleasePlayer={handleReleasePlayer}
        />
      ) : activeTab === 'freeagents' ? (
        <PlayerList players={allPlayers} onSignPlayer={handleSignPlayer} />
      ) : activeTab === 'allteams' ? (
        <AllTeamsView />
      ) : activeTab === 'strategy' && playerTeamId ? (
        <TeamStrategy teamId={playerTeamId} />
      ) : activeTab === 'stats' && playerTeamId ? (
        <TeamStatsView teamId={playerTeamId} />
      ) : activeTab === 'scrims' ? (
        <ScrimOverview />
      ) : (
        <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-8 text-center">
          <p className="text-vct-gray">No team selected</p>
        </div>
      )}

      {/* Contract Negotiation Modal */}
      {signingPlayer && playerTeam && (
        <ContractNegotiationModal
          player={signingPlayer}
          team={playerTeam}
          onClose={() => setSigningPlayer(null)}
          onSuccess={handleSigningSuccess}
        />
      )}

      {/* Release Player Modal */}
      {releasingPlayer && playerTeam && (
        <ReleasePlayerModal
          player={releasingPlayer}
          team={playerTeam}
          onClose={() => setReleasingPlayer(null)}
          onSuccess={handleReleaseSuccess}
        />
      )}
    </div>
  );
}
