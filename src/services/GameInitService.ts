// GameInitService - Orchestrates game initialization
// Connects engine classes with the store

import { useGameStore } from '../store';
import { playerGenerator } from '../engine/player';
import { teamManager } from '../engine/team';
import { eventScheduler } from '../engine/calendar';
import { scrimEngine, tierTeamGenerator } from '../engine/scrim';
import { tournamentService } from './TournamentService';
import type { Region, MatchEventData } from '../types';
import { FREE_AGENTS_PER_REGION } from '../utils/constants';

/**
 * Options for initializing a new game
 */
export interface NewGameOptions {
  playerTeamId?: string;
  playerTeamName?: string;
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

    // Set player's team (by ID, by name, or first team in region by default)
    let playerTeamId = options.playerTeamId;

    if (!playerTeamId && options.playerTeamName) {
      // Find team by name within the selected region
      const teamByName = teams.find(
        (t) => t.name === options.playerTeamName && t.region === playerRegion
      );
      playerTeamId = teamByName?.id;
    }

    if (!playerTeamId) {
      // Fallback to first team in region
      playerTeamId = teams.find((t) => t.region === playerRegion)?.id || teams[0].id;
    }

    store.setPlayerTeam(playerTeamId);

    // Apply difficulty settings to player's team
    this.applyDifficultySettings(playerTeamId, difficulty);

    // Initialize map pools for all T1 teams (Phase 6 - Scrim System)
    console.log('Initializing map pools for teams...');
    for (const team of teams) {
      const mapPool = scrimEngine.createDefaultMapPool();
      store.updateTeamMapPool(team.id, mapPool);
    }

    // Generate T2/T3 teams from free agents (Phase 6 - Scrim System)
    console.log('Generating T2/T3 scrim partner teams...');
    const tierTeams = tierTeamGenerator.generateAllTierTeams(freeAgents);
    store.addTierTeams(tierTeams);
    console.log(`Generated ${tierTeams.length} T2/T3 teams for scrim practice`);

    // Set calendar to start of season (January 1, 2026)
    const seasonStartDate = '2026-01-01T00:00:00.000Z';
    store.setCurrentDate(seasonStartDate);
    store.setCurrentPhase('kickoff');
    store.setCurrentSeason(1);
    store.setLastSaveDate(seasonStartDate);

    // Generate season schedule (matches, salary payments, etc.)
    console.log('Generating season schedule...');
    const scheduleEvents = eventScheduler.generateInitialSchedule(
      playerTeamId,
      teams,
      seasonStartDate,
      2026
    );
    store.addCalendarEvents(scheduleEvents);
    console.log(`Generated ${scheduleEvents.length} calendar events`);

    // Create Match entities for all match calendar events
    // This ensures the Schedule page can find and simulate these matches
    const matchEvents = scheduleEvents.filter((e) => e.type === 'match');
    for (const event of matchEvents) {
      const data = event.data as MatchEventData;
      if (data.matchId && data.homeTeamId && data.awayTeamId) {
        store.addMatch({
          id: data.matchId,
          teamAId: data.homeTeamId,
          teamBId: data.awayTeamId,
          scheduledDate: event.date,
          status: 'scheduled',
        });
      }
    }
    console.log(`Created ${matchEvents.length} match entities`);

    // Generate initial Kickoff tournament for player's region
    console.log('Generating Kickoff tournament...');
    const regionTeams = teams.filter((t) => t.region === playerRegion);

    // Sort teams by strength (orgValue + fanbase) - top 4 will get byes as "Champions qualifiers"
    // In subsequent seasons, this would be based on previous season performance
    const sortedRegionTeams = [...regionTeams].sort((a, b) => {
      const strengthA = a.organizationValue + a.fanbase * 10000;
      const strengthB = b.organizationValue + b.fanbase * 10000;
      return strengthB - strengthA; // Descending order (strongest first)
    });
    const regionTeamIds = sortedRegionTeams.map((t) => t.id);

    // For Kickoff: 12 teams, top 4 get byes, bottom 8 play R1 via random draw
    const kickoffTeamIds = regionTeamIds.slice(0, 12);
    if (kickoffTeamIds.length > 0) {
      // Use TournamentService to properly create tournament with calendar events
      tournamentService.createTournament(
        `VCT ${playerRegion} Kickoff 2026`,
        'kickoff',
        'triple_elim',
        playerRegion,
        kickoffTeamIds,
        new Date(seasonStartDate),
        500000
      );
      console.log(`Created Kickoff tournament with ${kickoffTeamIds.length} teams`);
    }

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
    totalTierTeams: number;
    freeAgents: number;
    playersByRegion: Record<Region, number>;
    teamsByRegion: Record<Region, number>;
  } {
    const store = useGameStore.getState();
    const players = Object.values(store.players);
    const teams = Object.values(store.teams);
    const tierTeams = Object.values(store.tierTeams);

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
      totalTierTeams: tierTeams.length,
      freeAgents: players.filter((p) => p.teamId === null).length,
      playersByRegion,
      teamsByRegion,
    };
  }
}

// Export singleton instance
export const gameInitService = new GameInitService();
