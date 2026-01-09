// GameInitService - Orchestrates game initialization
// Connects engine classes with the store

import { useGameStore } from '../store';
import { playerGenerator } from '../engine/player';
import { teamManager } from '../engine/team';
import type { Region } from '../types';
import { FREE_AGENTS_PER_REGION } from '../utils/constants';

/**
 * Options for initializing a new game
 */
export interface NewGameOptions {
  playerTeamId?: string;
  playerRegion?: Region;
  difficulty?: 'easy' | 'normal' | 'hard';
}

/**
 * GameInitService - Handles new game creation and initialization
 */
export class GameInitService {
  /**
   * Initialize a new game with all teams and players
   */
  async initializeNewGame(options: NewGameOptions = {}): Promise<void> {
    const store = useGameStore.getState();
    const { playerRegion = 'Americas', difficulty = 'normal' } = options;

    // Reset player generator for fresh names
    playerGenerator.resetUsedNames();

    // Generate all teams and their players
    console.log('Generating teams and players...');
    const { teams, players } = teamManager.generateAllTeams({ generatePlayers: true });

    // Generate free agents for each region
    console.log('Generating free agents...');
    const regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];
    const freeAgents = regions.flatMap((region) =>
      playerGenerator.generateFreeAgents(FREE_AGENTS_PER_REGION, region)
    );

    // Combine all players
    const allPlayers = [...players, ...freeAgents];

    // Add all players to store
    store.addPlayers(allPlayers);

    // Add all teams to store
    store.addTeams(teams);

    // Set player's team (first team in their region by default)
    const playerTeamId =
      options.playerTeamId ||
      teams.find((t) => t.region === playerRegion)?.id ||
      teams[0].id;
    store.setPlayerTeam(playerTeamId);

    // Apply difficulty settings to player's team
    this.applyDifficultySettings(playerTeamId, difficulty);

    // Set calendar to start of season
    store.setCurrentDate(new Date().toISOString());
    store.setCurrentPhase('kickoff');
    store.setCurrentSeason(1);

    // Mark game as initialized and started
    store.setInitialized(true);
    store.setGameStarted(true);

    console.log(
      `Game initialized: ${allPlayers.length} players, ${teams.length} teams`
    );
  }

  /**
   * Apply difficulty settings to player's team
   */
  private applyDifficultySettings(
    teamId: string,
    difficulty: 'easy' | 'normal' | 'hard'
  ): void {
    const store = useGameStore.getState();
    const team = store.teams[teamId];
    if (!team) return;

    const multipliers = {
      easy: 1.5,
      normal: 1.0,
      hard: 0.7,
    };

    const multiplier = multipliers[difficulty];

    // Adjust team balance
    store.updateTeamFinances(teamId, {
      balance: Math.round(team.finances.balance * multiplier),
    });
  }

  /**
   * Quick start - initialize with default settings
   */
  async quickStart(): Promise<void> {
    await this.initializeNewGame({
      playerRegion: 'Americas',
      difficulty: 'normal',
    });
  }

  /**
   * Get summary of generated game data
   */
  getGameSummary(): {
    totalPlayers: number;
    totalTeams: number;
    freeAgents: number;
    playersByRegion: Record<Region, number>;
    teamsByRegion: Record<Region, number>;
  } {
    const store = useGameStore.getState();
    const players = Object.values(store.players);
    const teams = Object.values(store.teams);

    const playersByRegion: Record<Region, number> = {
      Americas: 0,
      EMEA: 0,
      Pacific: 0,
      China: 0,
    };

    const teamsByRegion: Record<Region, number> = {
      Americas: 0,
      EMEA: 0,
      Pacific: 0,
      China: 0,
    };

    players.forEach((p) => {
      playersByRegion[p.region]++;
    });

    teams.forEach((t) => {
      teamsByRegion[t.region]++;
    });

    return {
      totalPlayers: players.length,
      totalTeams: teams.length,
      freeAgents: players.filter((p) => p.teamId === null).length,
      playersByRegion,
      teamsByRegion,
    };
  }
}

// Export singleton instance
export const gameInitService = new GameInitService();
