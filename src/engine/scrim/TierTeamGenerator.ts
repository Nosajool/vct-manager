// TierTeamGenerator - Generates T2/T3 teams using free agent players
// No React or store dependencies - pure functions only

import type { Player, Region, TierTeam, TeamTier, MapPoolStrength } from '../../types';
import { T2_TEAM_TEMPLATES, T3_TEAM_TEMPLATES, T2_STAT_RANGES, T3_STAT_RANGES } from '../../utils/constants';
import { scrimEngine } from './ScrimEngine';

/**
 * TierTeamGenerator - Creates T2/T3 teams from free agents
 */
export class TierTeamGenerator {
  /**
   * Generate a unique team ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Calculate a player's overall rating
   */
  private calculateOverall(player: Player): number {
    const stats = player.stats;
    return Math.round(
      stats.mechanics * 0.2 +
        stats.igl * 0.1 +
        stats.mental * 0.1 +
        stats.clutch * 0.1 +
        stats.vibes * 0.05 +
        stats.lurking * 0.1 +
        stats.entry * 0.1 +
        stats.support * 0.1 +
        stats.stamina * 0.15
    );
  }

  /**
   * Filter free agents by skill level for a tier
   */
  private filterPlayersForTier(players: Player[], tier: TeamTier): Player[] {
    const ranges = tier === 'T2' ? T2_STAT_RANGES : T3_STAT_RANGES;

    return players.filter((p) => {
      const overall = this.calculateOverall(p);
      return overall >= ranges.min && overall <= ranges.max;
    });
  }

  /**
   * Generate T2 or T3 teams for a specific region
   */
  generateTierTeams(
    freeAgents: Player[],
    region: Region,
    tier: TeamTier
  ): TierTeam[] {
    const templates = tier === 'T2' ? T2_TEAM_TEMPLATES[region] : T3_TEAM_TEMPLATES[region];

    // Filter players from this region that fit the tier skill level
    const eligiblePlayers = this.filterPlayersForTier(
      freeAgents.filter((p) => p.region === region),
      tier
    );

    // If not enough regional players, include some cross-region players
    let availablePlayers = [...eligiblePlayers];
    if (availablePlayers.length < templates.length * 5) {
      const crossRegionPlayers = this.filterPlayersForTier(
        freeAgents.filter((p) => p.region !== region),
        tier
      );
      // Add some cross-region players
      availablePlayers = [
        ...availablePlayers,
        ...crossRegionPlayers.slice(0, templates.length * 5 - availablePlayers.length),
      ];
    }

    // Shuffle available players
    availablePlayers.sort(() => Math.random() - 0.5);

    const teams: TierTeam[] = [];

    for (let i = 0; i < templates.length; i++) {
      const teamName = templates[i];

      // Assign 5 players to this team (if available)
      const teamPlayers = availablePlayers.splice(0, 5);

      // If not enough players, generate placeholder IDs
      // These will reference actual free agents who can be on multiple T2/T3 teams
      const playerIds = teamPlayers.map((p) => p.id);

      // Calculate average overall
      const avgOverall =
        teamPlayers.length > 0
          ? Math.round(teamPlayers.reduce((sum, p) => sum + this.calculateOverall(p), 0) / teamPlayers.length)
          : tier === 'T2'
            ? 65
            : 52;

      teams.push({
        id: this.generateId(`tier-${tier.toLowerCase()}`),
        name: teamName,
        region,
        tier,
        playerIds,
        mapStrengths: this.generateTierMapPool(tier),
        averageOverall: avgOverall,
      });
    }

    return teams;
  }

  /**
   * Generate all T2 and T3 teams for a region
   */
  generateAllTierTeamsForRegion(freeAgents: Player[], region: Region): TierTeam[] {
    const t2Teams = this.generateTierTeams(freeAgents, region, 'T2');
    const t3Teams = this.generateTierTeams(freeAgents, region, 'T3');
    return [...t2Teams, ...t3Teams];
  }

  /**
   * Generate all T2 and T3 teams for all regions
   */
  generateAllTierTeams(freeAgents: Player[]): TierTeam[] {
    const regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];
    const allTeams: TierTeam[] = [];

    for (const region of regions) {
      allTeams.push(...this.generateAllTierTeamsForRegion(freeAgents, region));
    }

    return allTeams;
  }

  /**
   * Generate a map pool for T2/T3 teams (weaker than T1)
   */
  private generateTierMapPool(tier: TeamTier): MapPoolStrength {
    const basePool = scrimEngine.createDefaultMapPool();

    // T2/T3 teams have weaker map pools
    const multiplier = tier === 'T2' ? 0.85 : 0.7;

    // Apply multiplier to all map attributes
    const adjustedMaps = Object.entries(basePool.maps).reduce(
      (acc, [mapName, mapStrength]) => {
        acc[mapName] = {
          ...mapStrength,
          attributes: {
            executes: Math.round(mapStrength.attributes.executes * multiplier),
            retakes: Math.round(mapStrength.attributes.retakes * multiplier),
            utility: Math.round(mapStrength.attributes.utility * multiplier),
            communication: Math.round(mapStrength.attributes.communication * multiplier),
            mapControl: Math.round(mapStrength.attributes.mapControl * multiplier),
            antiStrat: Math.round(mapStrength.attributes.antiStrat * multiplier),
          },
        };
        return acc;
      },
      {} as Record<string, typeof basePool.maps[string]>
    );

    return {
      maps: adjustedMaps,
      strongestMaps: scrimEngine.calculateStrongestMaps(adjustedMaps),
      banPriority: scrimEngine.calculateBanPriority(adjustedMaps),
    };
  }

  /**
   * Get a T2/T3 team's effective strength for scrim simulation
   */
  calculateTierTeamStrength(team: TierTeam, players: Player[]): number {
    const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));

    if (teamPlayers.length === 0) {
      // Use average overall as fallback
      return team.averageOverall;
    }

    // Calculate like T1 teams but with tier penalty already baked into player stats
    let totalStrength = 0;
    for (const player of teamPlayers) {
      const playerStrength =
        player.stats.mechanics * 0.3 +
        player.stats.igl * 0.15 +
        player.stats.mental * 0.15 +
        player.stats.clutch * 0.1 +
        player.stats.entry * 0.1 +
        player.stats.support * 0.1 +
        player.stats.lurking * 0.05 +
        player.stats.vibes * 0.05;

      // Apply form modifier
      const formModifier = 1 + ((player.form - 70) / 100) * 0.1;
      totalStrength += playerStrength * formModifier;
    }

    return totalStrength / teamPlayers.length;
  }

  /**
   * Update tier team roster when free agents change
   * Call this when free agents are signed or new ones are generated
   */
  refreshTierTeamRosters(
    tierTeams: TierTeam[],
    freeAgents: Player[]
  ): TierTeam[] {
    return tierTeams.map((team) => {
      // Keep only players who are still free agents
      const validPlayerIds = team.playerIds.filter((id) =>
        freeAgents.some((p) => p.id === id)
      );

      // If team lost players, try to recruit new ones
      if (validPlayerIds.length < 5) {
        const eligiblePlayers = this.filterPlayersForTier(
          freeAgents.filter(
            (p) => p.region === team.region && !validPlayerIds.includes(p.id)
          ),
          team.tier
        );

        // Add new players to fill roster
        const needed = 5 - validPlayerIds.length;
        const newPlayers = eligiblePlayers.slice(0, needed);
        validPlayerIds.push(...newPlayers.map((p) => p.id));
      }

      // Recalculate average overall
      const teamPlayers = freeAgents.filter((p) => validPlayerIds.includes(p.id));
      const avgOverall =
        teamPlayers.length > 0
          ? Math.round(
              teamPlayers.reduce((sum, p) => sum + this.calculateOverall(p), 0) /
                teamPlayers.length
            )
          : team.averageOverall;

      return {
        ...team,
        playerIds: validPlayerIds,
        averageOverall: avgOverall,
      };
    });
  }
}

// Export singleton instance
export const tierTeamGenerator = new TierTeamGenerator();
