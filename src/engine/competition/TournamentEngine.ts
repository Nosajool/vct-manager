// TournamentEngine
// Pure class with no React/store dependencies
// Handles tournament creation and configuration

import type {
  Tournament,
  TournamentFormat,
  CompetitionType,
  TournamentRegion,
  PrizePool,
  BracketStructure,
  BracketRound,
  Team,
  MultiStageTournament,
  SwissStage,
} from '../../types';
import type { StandingsEntry } from '../../store/slices/competitionSlice';
import { bracketManager } from './BracketManager';

// Prize pool distributions by competition type (percentage of total)
const PRIZE_DISTRIBUTIONS: Record<CompetitionType, Record<number, number>> = {
  kickoff: {
    1: 0.40,
    2: 0.20,
    3: 0.12,
    4: 0.08,
    5: 0.05,
    6: 0.05,
    7: 0.05,
    8: 0.05,
  },
  stage1: {
    1: 0.35,
    2: 0.20,
    3: 0.15,
    4: 0.10,
    5: 0.05,
    6: 0.05,
    7: 0.05,
    8: 0.05,
  },
  stage2: {
    1: 0.35,
    2: 0.20,
    3: 0.15,
    4: 0.10,
    5: 0.05,
    6: 0.05,
    7: 0.05,
    8: 0.05,
  },
  masters: {
    1: 0.35,
    2: 0.20,
    3: 0.15,
    4: 0.10,
    5: 0.05,
    6: 0.05,
    7: 0.05,
    8: 0.05,
  },
  champions: {
    1: 0.30,
    2: 0.18,
    3: 0.12,
    4: 0.08,
    5: 0.06,
    6: 0.06,
    7: 0.05,
    8: 0.05,
    9: 0.025,
    10: 0.025,
    11: 0.025,
    12: 0.025,
  },
};

// Default prize pools by competition type (in dollars)
const DEFAULT_PRIZE_POOLS: Record<CompetitionType, number> = {
  kickoff: 500000,
  stage1: 200000,
  stage2: 200000,
  masters: 1000000,
  champions: 2500000,
};

// Tournament duration in days by format
const TOURNAMENT_DURATION: Record<TournamentFormat, number> = {
  single_elim: 3,
  double_elim: 7,
  triple_elim: 14,
  round_robin: 35, // ~5 weeks for league play
  swiss_to_playoff: 18, // 4 days Swiss + 10 days Playoffs + 4 days buffer
};

/**
 * TournamentEngine handles tournament creation and prize calculations.
 * Pure class with no store dependencies.
 */
export class TournamentEngine {
  /**
   * Create a new tournament with bracket
   */
  createTournament(
    name: string,
    type: CompetitionType,
    format: TournamentFormat,
    region: TournamentRegion,
    teamIds: string[],
    startDate: Date,
    totalPrizePool?: number
  ): Tournament {
    const id = `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Calculate prize pool
    const prizePoolAmount = totalPrizePool || DEFAULT_PRIZE_POOLS[type];
    const prizePool = this.calculatePrizePool(type, prizePoolAmount);

    // Calculate end date based on format
    const durationDays = TOURNAMENT_DURATION[format];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    // Generate bracket based on format (with special seeding for Kickoff)
    let bracket = this.generateBracket(format, teamIds, type, region);

    // Make bracket match IDs unique by prefixing with tournament ID
    // This prevents collisions when multiple tournaments are simulated
    bracket = this.prefixBracketMatchIds(bracket, id);

    const tournament: Tournament = {
      id,
      name,
      type,
      format,
      region,
      teamIds,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool,
      bracket,
      status: 'upcoming',
    };

    return tournament;
  }

  /**
   * Create Masters Santiago tournament with Swiss + Playoffs format
   *
   * @param swissTeamIds - 8 teams for Swiss stage (beta+omega qualifiers from each region)
   * @param playoffOnlyTeamIds - 4 teams that join at playoffs (alpha qualifiers from each region)
   * @param teamRegions - Map of teamId -> region for cross-regional Swiss pairings
   * @param startDate - Tournament start date
   * @param prizePool - Optional prize pool amount (default: $1,000,000)
   */
  createMastersSantiago(
    swissTeamIds: string[],
    playoffOnlyTeamIds: string[],
    teamRegions: Map<string, string>,
    startDate: Date,
    prizePool?: number,
    name?: string
  ): MultiStageTournament {
    const id = `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Validate inputs
    if (swissTeamIds.length !== 8) {
      console.warn(`Masters Santiago Swiss requires 8 teams, got ${swissTeamIds.length}`);
    }
    if (playoffOnlyTeamIds.length !== 4) {
      console.warn(`Masters Santiago Playoffs requires 4 direct seeds, got ${playoffOnlyTeamIds.length}`);
    }

    // Calculate prize pool
    const prizePoolAmount = prizePool || DEFAULT_PRIZE_POOLS['masters'];
    const prizePoolDistribution = this.calculatePrizePool('masters', prizePoolAmount);

    // Calculate end date
    const durationDays = TOURNAMENT_DURATION['swiss_to_playoff'];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    // Initialize Swiss stage
    const swissStage: SwissStage = bracketManager.initializeSwissStage(
      swissTeamIds,
      teamRegions,
      {
        totalRounds: 3,
        winsToQualify: 2,
        lossesToEliminate: 2,
        tournamentId: id,
      }
    );

    // All teams (Swiss + playoff only)
    const allTeamIds = [...swissTeamIds, ...playoffOnlyTeamIds];

    // Create empty placeholder bracket (will be populated when Swiss completes)
    const emptyBracket: BracketStructure = { upper: [] };

    const tournament: MultiStageTournament = {
      id,
      name: name || 'VCT Masters Santiago 2026',
      type: 'masters',
      format: 'swiss_to_playoff',
      region: 'International',
      teamIds: allTeamIds,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool: prizePoolDistribution,
      bracket: emptyBracket, // Placeholder until playoffs
      status: 'upcoming',
      // Multi-stage tournament specific fields
      swissStage,
      currentStage: 'swiss',
      swissTeamIds,
      playoffOnlyTeamIds,
    };

    return tournament;
  }

  /**
   * Generate playoff bracket for Masters after Swiss stage completes
   * Takes 4 Swiss qualifiers + 4 Kickoff winners = 8 teams for double elimination
   *
   * Seeding:
   * 1-4: Kickoff winners (alpha bracket winners from each region)
   * 5-8: Swiss qualifiers (in order of qualification)
   */
  generateMastersPlayoffBracket(
    swissQualifiers: string[],
    playoffOnlyTeamIds: string[],
    tournamentId: string
  ): BracketStructure {
    // Combine teams: Kickoff winners (seeds 1-4) + Swiss qualifiers (seeds 5-8)
    const seededTeamIds = [...playoffOnlyTeamIds, ...swissQualifiers];

    // Generate double elimination bracket
    const bracket = bracketManager.generateDoubleElimination(seededTeamIds);

    // Prefix match IDs with tournament ID for uniqueness
    return this.prefixBracketMatchIds(bracket, tournamentId);
  }

  /**
   * Calculate prize pool distribution
   */
  calculatePrizePool(type: CompetitionType, totalPool: number): PrizePool {
    const distribution = PRIZE_DISTRIBUTIONS[type];

    return {
      first: Math.round(totalPool * distribution[1]),
      second: Math.round(totalPool * distribution[2]),
      third: Math.round(totalPool * distribution[3]),
      fourth: distribution[4] ? Math.round(totalPool * distribution[4]) : undefined,
      fifthSixth: distribution[5] ? Math.round(totalPool * distribution[5]) : undefined,
      seventhEighth: distribution[7] ? Math.round(totalPool * distribution[7]) : undefined,
    };
  }

  /**
   * Calculate prize distribution as a placement map
   */
  calculatePrizeDistribution(
    type: CompetitionType,
    totalPool: number
  ): Record<number, number> {
    const distribution = PRIZE_DISTRIBUTIONS[type];
    const result: Record<number, number> = {};

    for (const [placement, percentage] of Object.entries(distribution)) {
      result[parseInt(placement)] = Math.round(totalPool * percentage);
    }

    return result;
  }

  /**
   * Seed teams based on standings or default order
   * Returns array where index is seed-1 and value is position in teamIds
   */
  seedTeams(teams: Team[], standings?: StandingsEntry[]): number[] {
    if (!standings || standings.length === 0) {
      // Default seeding: by team rating or index
      return teams.map((_, i) => i + 1);
    }

    // Create standing lookup
    const standingMap = new Map<string, number>();
    standings.forEach((entry, index) => {
      standingMap.set(entry.teamId, index);
    });

    // Sort teams by standing position
    const sortedIndices = teams
      .map((team, originalIndex) => ({
        originalIndex,
        standingPosition: standingMap.get(team.id) ?? 999,
      }))
      .sort((a, b) => a.standingPosition - b.standingPosition)
      .map(({ originalIndex }) => originalIndex + 1);

    return sortedIndices;
  }

  /**
   * Get tournament type display name
   */
  getTypeName(type: CompetitionType): string {
    const names: Record<CompetitionType, string> = {
      kickoff: 'Kickoff',
      stage1: 'Stage 1',
      stage2: 'Stage 2',
      masters: 'Masters',
      champions: 'Champions',
    };
    return names[type];
  }

  /**
   * Get format display name
   */
  getFormatName(format: TournamentFormat): string {
    const names: Record<TournamentFormat, string> = {
      single_elim: 'Single Elimination',
      double_elim: 'Double Elimination',
      triple_elim: 'Triple Elimination',
      round_robin: 'Round Robin',
      swiss_to_playoff: 'Swiss to Playoffs',
    };
    return names[format];
  }

  /**
   * Prefix all match IDs in a bracket with the tournament ID
   * This ensures match IDs are globally unique across tournaments
   */
  private prefixBracketMatchIds(bracket: BracketStructure, tournamentId: string): BracketStructure {
    // Create a short prefix from tournament ID (last 8 chars should be unique enough)
    const prefix = tournamentId.slice(-12);

    // Helper to update a match ID
    const prefixId = (id: string) => `${prefix}-${id}`;

    // Helper to update destination match IDs
    const updateDestination = (dest: { type: string; matchId?: string }) => {
      if (dest.type === 'match' && dest.matchId) {
        return { ...dest, matchId: prefixId(dest.matchId) };
      }
      return dest;
    };

    // Helper to update source match IDs
    const updateSource = (source: { type: string; matchId?: string }) => {
      if ((source.type === 'winner' || source.type === 'loser') && source.matchId) {
        return { ...source, matchId: prefixId(source.matchId) };
      }
      return source;
    };

    // Helper to process a round's matches
    const processRound = (round: BracketRound): BracketRound => ({
      ...round,
      roundId: prefixId(round.roundId),
      matches: round.matches.map((match) => ({
        ...match,
        matchId: prefixId(match.matchId),
        roundId: prefixId(match.roundId),
        teamASource: updateSource(match.teamASource) as typeof match.teamASource,
        teamBSource: updateSource(match.teamBSource) as typeof match.teamBSource,
        winnerDestination: updateDestination(match.winnerDestination) as typeof match.winnerDestination,
        loserDestination: updateDestination(match.loserDestination) as typeof match.loserDestination,
      })),
    });

    // Process all brackets
    const newBracket: BracketStructure = {
      upper: bracket.upper.map(processRound),
    };

    if (bracket.middle) {
      newBracket.middle = bracket.middle.map(processRound);
    }

    if (bracket.lower) {
      newBracket.lower = bracket.lower.map(processRound);
    }

    if (bracket.grandfinal) {
      newBracket.grandfinal = {
        ...bracket.grandfinal,
        matchId: prefixId(bracket.grandfinal.matchId),
        roundId: prefixId(bracket.grandfinal.roundId),
        teamASource: updateSource(bracket.grandfinal.teamASource) as typeof bracket.grandfinal.teamASource,
        teamBSource: updateSource(bracket.grandfinal.teamBSource) as typeof bracket.grandfinal.teamBSource,
        winnerDestination: updateDestination(bracket.grandfinal.winnerDestination) as typeof bracket.grandfinal.winnerDestination,
        loserDestination: updateDestination(bracket.grandfinal.loserDestination) as typeof bracket.grandfinal.loserDestination,
      };
    }

    return newBracket;
  }

  /**
   * Generate bracket based on format
   */
  private generateBracket(
    format: TournamentFormat,
    teamIds: string[],
    type?: CompetitionType,
    region?: TournamentRegion
  ): BracketStructure {
    // For Kickoff triple elim, use special seeding:
    // Americas uses actual VCT 2026 seeding
    // Other regions: Top 4 get byes (seeds 1-4), bottom 8 are randomly drawn (seeds 5-12)
    if (format === 'triple_elim' && type === 'kickoff') {
      const seeding = this.generateKickoffSeeding(teamIds, region);
      return bracketManager.generateTripleElimination(teamIds, seeding);
    }

    switch (format) {
      case 'single_elim':
        return bracketManager.generateSingleElimination(teamIds);
      case 'double_elim':
        return bracketManager.generateDoubleElimination(teamIds);
      case 'triple_elim':
        return bracketManager.generateTripleElimination(teamIds);
      case 'round_robin':
        return bracketManager.generateRoundRobin(teamIds);
      default:
        return bracketManager.generateSingleElimination(teamIds);
    }
  }

  /**
   * Generate Kickoff tournament seeding
   * For Americas: Uses actual VCT 2026 seeding order
   * For other regions: Top 4 teams get byes, remaining are randomly drawn
   */
  generateKickoffSeeding(teamIds: string[], region?: TournamentRegion): number[] {
    const numTeams = teamIds.length;

    // For Americas, use the actual VCT 2026 seeding
    if (region === 'Americas') {
      return this.generateAmericasKickoffSeeding(teamIds);
    }

    // For other regions, use default seeding logic:
    // First 4 teams = Champions qualifiers = get byes (seeds 1-4)
    // Remaining teams = randomly drawn for R1 (seeds 5-12+)
    const seeding: number[] = [];
    const numByeTeams = Math.min(4, numTeams);
    const numDrawnTeams = numTeams - numByeTeams;

    // Top 4 get seeds 1-4 (bye positions)
    for (let i = 0; i < numByeTeams; i++) {
      seeding.push(i + 1);
    }

    // Remaining teams get random seeds 5-N
    const remainingSeeds = Array.from(
      { length: numDrawnTeams },
      (_, i) => i + numByeTeams + 1
    );

    // Fisher-Yates shuffle for random draw
    for (let i = remainingSeeds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingSeeds[i], remainingSeeds[j]] = [remainingSeeds[j], remainingSeeds[i]];
    }

    seeding.push(...remainingSeeds);

    return seeding;
  }

  /**
   * Generate Americas Kickoff seeding based on actual VCT 2026 format
   * Teams are expected to be pre-sorted by the service layer according to
   * official seeding order (NRG, MIBR, Sentinels, G2, LOUD, Cloud9, etc.)
   * So we just return sequential seeds 1, 2, 3, 4, ...
   */
  private generateAmericasKickoffSeeding(teamIds: string[]): number[] {
    // Teams are already sorted in official seeding order by the service layer
    // Return sequential seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    return teamIds.map((_, index) => index + 1);
  }

  /**
   * Get default format for a competition type
   */
  getDefaultFormat(type: CompetitionType): TournamentFormat {
    const defaults: Record<CompetitionType, TournamentFormat> = {
      kickoff: 'triple_elim',
      stage1: 'round_robin',
      stage2: 'round_robin',
      masters: 'double_elim',
      champions: 'double_elim',
    };
    return defaults[type];
  }

  /**
   * Get expected team count for a competition type
   */
  getExpectedTeamCount(type: CompetitionType): number {
    const counts: Record<CompetitionType, number> = {
      kickoff: 16,
      stage1: 10,
      stage2: 10,
      masters: 12,
      champions: 16,
    };
    return counts[type];
  }

  /**
   * Validate tournament can be created
   */
  validateTournament(
    teamIds: string[],
    _type: CompetitionType,
    format: TournamentFormat
  ): { valid: boolean; error?: string } {
    const minTeams = format === 'round_robin' ? 2 : 2;
    const maxTeams = format === 'round_robin' ? 20 : 64;

    if (teamIds.length < minTeams) {
      return { valid: false, error: `At least ${minTeams} teams required` };
    }

    if (teamIds.length > maxTeams) {
      return { valid: false, error: `Maximum ${maxTeams} teams allowed` };
    }

    // Check for duplicates
    const uniqueTeams = new Set(teamIds);
    if (uniqueTeams.size !== teamIds.length) {
      return { valid: false, error: 'Duplicate teams not allowed' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const tournamentEngine = new TournamentEngine();
