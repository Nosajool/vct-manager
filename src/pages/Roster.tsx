// Team Page - Manage team roster and browse free agents

import { useState } from 'react';
import { useGameStore } from '../store';
import { RosterList } from '../components/roster/RosterList';
import { AllTeamsView } from '../components/roster/AllTeamsView';
import { FreeAgentList } from '../components/roster/FreeAgentList';
import { ContractNegotiationModal } from '../components/roster/ContractNegotiationModal';
import { ReleasePlayerModal } from '../components/roster/ReleasePlayerModal';
import { TeamStrategy } from '../components/roster/TeamStrategy';
import { TeamStatsView } from '../components/roster/TeamStatsView';
import { ScrimOverview } from '../components/scrim';
import { SetupWizard, type SetupOptions } from '../components/setup';
import { gameInitService } from '../services/GameInitService';
import type { Player } from '../types';

type TeamTab = 'roster' | 'freeagents' | 'allteams' | 'strategy' | 'stats' | 'scrims';

export function Roster() {
  const [activeTab, setActiveTab] = useState<TeamTab>('roster');
  const [isInitializing, setIsInitializing] = useState(false);

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

  // Not started yet - auto-show setup wizard
  if (!gameStarted) {
    if (isInitializing) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-vct-darker border border-vct-gray/30 rounded-lg flex items-center justify-center mb-6 animate-pulse">
            <span className="text-5xl">🎮</span>
          </div>
          <h2 className="text-2xl font-bold text-vct-light mb-2">
            Initializing Game...
          </h2>
          <p className="text-vct-gray text-center max-w-md">
            Generating teams, players, and tournaments. This may take a moment.
          </p>
        </div>
      );
    }

    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div className="space-y-6">
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
      <div className="flex gap-2 border-b border-vct-gray/20">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'roster'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Roster
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
        <button
          onClick={() => setActiveTab('allteams')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'allteams'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          All Teams
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'strategy'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Strategy
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'stats'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab('scrims')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'scrims'
              ? 'text-vct-red border-vct-red'
              : 'text-vct-gray border-transparent hover:text-vct-light'
          }`}
        >
          Scrims
        </button>
      </div>

      {/* Content */}
      {activeTab === 'roster' && playerTeam ? (
        <RosterList
          team={playerTeam}
          players={teamPlayers}
          onReleasePlayer={handleReleasePlayer}
        />
      ) : activeTab === 'freeagents' ? (
        <FreeAgentList players={allPlayers} onSignPlayer={handleSignPlayer} />
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
