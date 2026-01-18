// GameInitService - Orchestrates game initialization
// Connects engine classes with the store

import { useGameStore } from '../store';
import { playerGenerator } from '../engine/player';
import { teamManager } from '../engine/team';
import { eventScheduler } from '../engine/calendar';
import { scrimEngine, tierTeamGenerator } from '../engine/scrim';
import { tournamentService } from './TournamentService';
import type { Player, Region, MatchEventData } from '../types';
import {
  FREE_AGENTS_PER_REGION,
  AMERICAS_KICKOFF_SEEDING,
  EMEA_KICKOFF_SEEDING,
  PACIFIC_KICKOFF_SEEDING,
  CHINA_KICKOFF_SEEDING,
} from '../utils/constants';
import { VLR_PLAYER_STATS, VLR_SNAPSHOT_META, VLR_TEAM_ROSTERS } from '../data/vlrSnapshot';
import { processVlrSnapshot, createPlayerFromVlr } from '../engine/player/vlr';

/**
 * Options for initializing a new game
 */
export interface NewGameOptions {
  playerTeamId?: string;
  playerTeamName?: string;
  playerRegion?: Region;
  difficulty?: 'easy' | 'normal' | 'hard';
  /** Use real VLR player data instead of procedural generation */
  useVlrData?: boolean;
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
    const {
      playerRegion = 'Americas',
      difficulty = 'normal',
      useVlrData = true, // Default to using VLR data
    } = options;

    // Reset player generator for fresh names
    playerGenerator.resetUsedNames();

    let teams: ReturnType<typeof teamManager.generateAllTeams>['teams'];
    let players: Player[];
    let freeAgents: Player[];

    if (useVlrData && VLR_SNAPSHOT_META.totalPlayers > 0) {
      // Use VLR data for roster players and free agents
      console.log(`Using VLR data (${VLR_SNAPSHOT_META.totalPlayers} players from ${VLR_SNAPSHOT_META.fetchedAt})`);
      const result = this.generateWithVlrData();
      teams = result.teams;
      players = result.players;
      freeAgents = result.vlrFreeAgents;
      console.log(`VLR integration: ${result.vlrPlayersUsed} roster players, ${result.vlrFreeAgents.length} free agents, ${result.generatedPlayers} generated to fill gaps`);
    } else {
      // Fallback to full procedural generation
      console.log('Generating teams and players procedurally...');
      const generated = teamManager.generateAllTeams({ generatePlayers: true });
      teams = generated.teams;
      players = generated.players;

      // Generate free agents procedurally
      console.log('Generating free agents...');
      const regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];
      freeAgents = regions.flatMap((region) =>
        playerGenerator.generateFreeAgents(FREE_AGENTS_PER_REGION, region)
      );
    }

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

    // Sort teams according to official seeding for each region
    // All regions use actual VCT 2026 seeding order based on Champions 2025 qualifiers
    const sortedRegionTeams = this.sortTeamsByKickoffSeeding(regionTeams, playerRegion);
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
   * Generate teams with VLR player data
   * Uses scraped roster data to determine which players belong on each team.
   * Falls back to procedural generation for unfilled roster slots.
   * Also returns unmatched VLR players to be used as free agents.
   */
  private generateWithVlrData(): {
    teams: ReturnType<typeof teamManager.generateAllTeams>['teams'];
    players: Player[];
    vlrFreeAgents: Player[];
    vlrPlayersUsed: number;
    generatedPlayers: number;
  } {
    // Generate team shells without players
    const { teams } = teamManager.generateAllTeams({ generatePlayers: false });

    // Process VLR snapshot
    const vlrData = processVlrSnapshot(VLR_PLAYER_STATS);
    console.log(`VLR snapshot: ${vlrData.stats.totalPlayers} total, ${vlrData.stats.matchedPlayers} matched to teams`);
    console.log(`VLR rosters: ${Object.keys(VLR_TEAM_ROSTERS).length} teams with scraped rosters`);

    if (vlrData.unmatchedOrgs.length > 0) {
      console.log(`Unmatched VLR orgs: ${vlrData.unmatchedOrgs.slice(0, 10).join(', ')}${vlrData.unmatchedOrgs.length > 10 ? '...' : ''}`);
    }

    // Create a lookup map for VLR player stats by name (case-insensitive)
    const vlrPlayersByName = new Map<string, typeof vlrData.players[0]>();
    for (const vlrPlayer of vlrData.players) {
      vlrPlayersByName.set(vlrPlayer.name.toLowerCase(), vlrPlayer);
    }

    const allPlayers: Player[] = [];
    const usedPlayerNames = new Set<string>(); // Track which players have been assigned
    let vlrPlayersUsed = 0;
    let generatedPlayers = 0;

    // Populate each team's roster
    for (const team of teams) {
      const rosterPlayers: Player[] = [];
      const teamRoster = VLR_TEAM_ROSTERS[team.name];

      if (teamRoster && teamRoster.players.length > 0) {
        // Use the scraped roster to determine which players belong on this team
        for (const playerName of teamRoster.players) {
          const lowerName = playerName.toLowerCase();

          // Find the VLR player stats for this roster player
          const vlrPlayer = vlrPlayersByName.get(lowerName);

          if (vlrPlayer && !usedPlayerNames.has(lowerName)) {
            // Found player stats - create the player
            const player = createPlayerFromVlr(vlrPlayer, team.id);
            rosterPlayers.push(player);
            usedPlayerNames.add(lowerName);
            vlrPlayersUsed++;
          } else if (!usedPlayerNames.has(lowerName)) {
            // No stats found for this roster player - generate with their name
            // This handles new players who don't have stats yet
            const tier =
              team.organizationValue >= 4000000
                ? 'top'
                : team.organizationValue >= 3000000
                ? 'mid'
                : 'low';

            const generated = playerGenerator.generatePlayer({
              region: team.region,
              teamId: team.id,
              minOverall: tier === 'top' ? 70 : tier === 'mid' ? 60 : 50,
              maxOverall: tier === 'top' ? 95 : tier === 'mid' ? 85 : 75,
              forceName: playerName, // Use the actual roster player name
            });
            rosterPlayers.push(generated);
            usedPlayerNames.add(lowerName);
            generatedPlayers++;
            console.log(`  Generated player ${playerName} for ${team.name} (no VLR stats found)`);
          }
        }
      }

      // Fill remaining slots with procedurally generated players
      const slotsToFill = 5 - rosterPlayers.length;
      if (slotsToFill > 0) {
        const tier =
          team.organizationValue >= 4000000
            ? 'top'
            : team.organizationValue >= 3000000
            ? 'mid'
            : 'low';

        for (let i = 0; i < slotsToFill; i++) {
          const generated = playerGenerator.generatePlayer({
            region: team.region,
            teamId: team.id,
            minOverall: tier === 'top' ? 70 : tier === 'mid' ? 60 : 50,
            maxOverall: tier === 'top' ? 95 : tier === 'mid' ? 85 : 75,
          });
          rosterPlayers.push(generated);
          generatedPlayers++;
        }
      }

      // Generate 2 reserve players (always procedural)
      for (let i = 0; i < 2; i++) {
        const reserve = playerGenerator.generatePlayer({
          region: team.region,
          teamId: team.id,
          minOverall: 50,
          maxOverall: 70,
        });
        rosterPlayers.push(reserve);
        generatedPlayers++;
      }

      // Update team with player IDs
      team.playerIds = rosterPlayers.slice(0, 5).map((p) => p.id);
      team.reservePlayerIds = rosterPlayers.slice(5).map((p) => p.id);

      // Update team finances based on roster salaries
      const totalSalaries = rosterPlayers.reduce(
        (sum, p) => sum + (p.contract?.salary || 0),
        0
      );
      team.finances.monthlyExpenses.playerSalaries = Math.round(totalSalaries / 12);

      allPlayers.push(...rosterPlayers);
    }

    // Create free agents from VLR players not on any roster
    const vlrFreeAgents: Player[] = [];
    const unmatchedPlayers = vlrData.players
      .filter((p) => !usedPlayerNames.has(p.name.toLowerCase()))
      .sort((a, b) => b.vlrRating - a.vlrRating); // Best players first

    // Take top players from each region as free agents
    const freeAgentsPerRegion = 25; // Limit per region to keep pool manageable
    const regionCounts: Record<Region, number> = {
      Americas: 0,
      EMEA: 0,
      Pacific: 0,
      China: 0,
    };

    for (const vlrPlayer of unmatchedPlayers) {
      if (regionCounts[vlrPlayer.region] >= freeAgentsPerRegion) continue;

      const player = createPlayerFromVlr(vlrPlayer, null); // null teamId = free agent
      vlrFreeAgents.push(player);
      regionCounts[vlrPlayer.region]++;
    }

    console.log(`VLR free agents: ${vlrFreeAgents.length} (players not on current rosters)`);

    return { teams, players: allPlayers, vlrFreeAgents, vlrPlayersUsed, generatedPlayers };
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

  /**
   * Sort teams according to official VCT 2026 Kickoff seeding for each region
   * All regions follow the same format:
   * - Seeds 1-4 (bye teams): Champions 2025 qualifiers
   * - Seeds 5-12 (play in R1): Remaining teams
   */
  private sortTeamsByKickoffSeeding<T extends { name: string }>(teams: T[], region: Region): T[] {
    // Get the appropriate seeding array for the region
    const seedingArray = this.getKickoffSeeding(region);

    // Create a map of team name (lowercase) to their seed position
    const seedingMap = new Map<string, number>();
    seedingArray.forEach((teamName, index) => {
      seedingMap.set(teamName.toLowerCase(), index);
    });

    // Sort teams by their seeding position
    return [...teams].sort((a, b) => {
      const seedA = seedingMap.get(a.name.toLowerCase()) ?? 999;
      const seedB = seedingMap.get(b.name.toLowerCase()) ?? 999;
      return seedA - seedB;
    });
  }

  /**
   * Get the official Kickoff seeding array for a region
   */
  private getKickoffSeeding(region: Region): string[] {
    switch (region) {
      case 'Americas':
        return AMERICAS_KICKOFF_SEEDING;
      case 'EMEA':
        return EMEA_KICKOFF_SEEDING;
      case 'Pacific':
        return PACIFIC_KICKOFF_SEEDING;
      case 'China':
        return CHINA_KICKOFF_SEEDING;
      default:
        return AMERICAS_KICKOFF_SEEDING;
    }
  }
}

// Export singleton instance
export const gameInitService = new GameInitService();
