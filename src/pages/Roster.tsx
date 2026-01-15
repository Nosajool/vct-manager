// Roster Page - Manage team roster and browse free agents

import { useState } from 'react';
import { useGameStore } from '../store';
import { RosterList } from '../components/roster/RosterList';
import { FreeAgentList } from '../components/roster/FreeAgentList';
import { ContractNegotiationModal } from '../components/roster/ContractNegotiationModal';
import { ReleasePlayerModal } from '../components/roster/ReleasePlayerModal';
import { SetupWizard, type SetupOptions } from '../components/setup';
import { gameInitService } from '../services/GameInitService';
import type { Player } from '../types';

type RosterTab = 'myteam' | 'freeagents';

export function Roster() {
  const [activeTab, setActiveTab] = useState<RosterTab>('myteam');
  const [isInitializing, setIsInitializing] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Modal states
  const [signingPlayer, setSigningPlayer] = useState<Player | null>(null);
  const [releasingPlayer, setReleasingPlayer] = useState<Player | null>(null);

  const gameStarted = useGameStore((state) => state.gameStarted);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;
  const allPlayers = Object.values(players);
  const teamPlayers = playerTeam
    ? allPlayers.filter(
        (p) =>
          playerTeam.playerIds.includes(p.id) ||
          playerTeam.reservePlayerIds.includes(p.id)
      )
    : [];

  // Handle setup wizard completion
  const handleSetupComplete = async (options: SetupOptions) => {
    setShowSetupWizard(false);
    setIsInitializing(true);
    try {
      await gameInitService.initializeNewGame({
        playerRegion: options.region,
        playerTeamName: options.teamName,
        difficulty: options.difficulty,
      });
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
    setIsInitializing(false);
  };

  // Handle setup wizard cancel
  const handleSetupCancel = () => {
    setShowSetupWizard(false);
  };

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

  // Not started yet - show start game UI or setup wizard
  if (!gameStarted) {
    return (
      <>
        {showSetupWizard && (
          <SetupWizard
            onComplete={handleSetupComplete}
            onCancel={handleSetupCancel}
          />
        )}

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-vct-darker border border-vct-gray/30 rounded-lg flex items-center justify-center mb-6">
            <span className="text-5xl">🎮</span>
          </div>
          <h2 className="text-2xl font-bold text-vct-light mb-2">
            Start Your Career
          </h2>
          <p className="text-vct-gray mb-6 text-center max-w-md">
            Choose your region and team to begin your VCT management journey.
            Manage one of 48 teams across all VCT regions.
          </p>
          <button
            onClick={() => setShowSetupWizard(true)}
            disabled={isInitializing}
            className="px-8 py-3 bg-vct-red text-white font-bold rounded-lg
                       hover:bg-vct-red/80 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isInitializing ? 'Generating...' : 'Start New Game'}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-vct-light">Roster Management</h1>

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
      <div className="flex gap-2 border-b border-vct-gray/20">
        <button
          onClick={() => setActiveTab('myteam')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'myteam'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          My Team
        </button>
        <button
          onClick={() => setActiveTab('freeagents')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'freeagents'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Free Agents
        </button>
      </div>

      {/* Content */}
      {activeTab === 'myteam' && playerTeam ? (
        <RosterList
          team={playerTeam}
          players={teamPlayers}
          onReleasePlayer={handleReleasePlayer}
        />
      ) : activeTab === 'freeagents' ? (
        <FreeAgentList players={allPlayers} onSignPlayer={handleSignPlayer} />
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
