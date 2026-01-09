// Roster Page - Manage team roster and browse free agents

import { useState } from 'react';
import { useGameStore } from '../store';
import { RosterList } from '../components/roster/RosterList';
import { FreeAgentList } from '../components/roster/FreeAgentList';
import { gameInitService } from '../services/GameInitService';

type RosterTab = 'myteam' | 'freeagents';

export function Roster() {
  const [activeTab, setActiveTab] = useState<RosterTab>('myteam');
  const [isInitializing, setIsInitializing] = useState(false);

  const gameStarted = useGameStore((state) => state.gameStarted);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);

  // Store actions
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const removePlayerFromTeam = useGameStore((state) => state.removePlayerFromTeam);
  const addPlayerToTeam = useGameStore((state) => state.addPlayerToTeam);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;
  const allPlayers = Object.values(players);
  const teamPlayers = playerTeam
    ? allPlayers.filter(
        (p) =>
          playerTeam.playerIds.includes(p.id) ||
          playerTeam.reservePlayerIds.includes(p.id)
      )
    : [];

  // Handle game initialization
  const handleStartGame = async () => {
    setIsInitializing(true);
    try {
      await gameInitService.initializeNewGame({
        playerRegion: 'Americas',
        difficulty: 'normal',
      });
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
    setIsInitializing(false);
  };

  // Handle releasing a player
  const handleReleasePlayer = (playerId: string) => {
    if (!playerTeamId) return;

    const confirmed = window.confirm(
      'Are you sure you want to release this player?'
    );
    if (!confirmed) return;

    // Remove from team
    removePlayerFromTeam(playerTeamId, playerId);

    // Update player's teamId to null
    updatePlayer(playerId, { teamId: null, contract: null });
  };

  // Handle signing a player
  const handleSignPlayer = (playerId: string) => {
    if (!playerTeamId || !playerTeam) return;

    const player = players[playerId];
    if (!player) return;

    // Check roster space
    const totalRoster =
      playerTeam.playerIds.length + playerTeam.reservePlayerIds.length;
    if (totalRoster >= 10) {
      alert('Roster is full! Release a player first.');
      return;
    }

    // Simple contract for now (will be expanded later)
    const salary = 100000 + Math.floor(Math.random() * 200000);
    const contract = {
      salary,
      bonusPerWin: Math.round(salary * 0.01),
      yearsRemaining: 2,
      endDate: new Date(
        Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    // Add to team (active if < 5, else reserve)
    if (playerTeam.playerIds.length < 5) {
      addPlayerToTeam(playerTeamId, playerId);
    } else {
      // Add to reserve
      useGameStore.getState().addPlayerToReserve(playerTeamId, playerId);
    }

    // Update player
    updatePlayer(playerId, { teamId: playerTeamId, contract });
  };

  // Not started yet - show start game UI
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-vct-darker border border-vct-gray/30 rounded-lg flex items-center justify-center mb-6">
          <span className="text-5xl">🎮</span>
        </div>
        <h2 className="text-2xl font-bold text-vct-light mb-2">
          Start Your Career
        </h2>
        <p className="text-vct-gray mb-6 text-center max-w-md">
          Initialize the game to generate teams and players. This will create
          40 teams with 400+ players across all VCT regions.
        </p>
        <button
          onClick={handleStartGame}
          disabled={isInitializing}
          className="px-8 py-3 bg-vct-red text-white font-bold rounded-lg
                     hover:bg-vct-red/80 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isInitializing ? 'Generating...' : 'Start New Game'}
        </button>
      </div>
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
    </div>
  );
}
