// GlobalTournamentScheduler - Creates ALL VCT tournaments at game initialization
// Implements upfront creation with lazy resolution of team slots

import { tournamentEngine, bracketManager } from '../engine/competition';
import type {
  Tournament,
  MultiStageTournament,
  Team,
  CalendarEvent,
  Region,
  SwissStage,
  BracketStructure,
  BracketRound,
  BracketMatch,
} from '../types';
import type {
  TeamSlot,
  TournamentStandingsEntry,
} from '../types/competition';
import {
  AMERICAS_KICKOFF_SEEDING,
  EMEA_KICKOFF_SEEDING,
  PACIFIC_KICKOFF_SEEDING,
  CHINA_KICKOFF_SEEDING,
} from '../utils/constants';

/**
 * Match days configuration by region type
 * Days of week: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
const MATCH_DAYS = {
  // Americas, Pacific, China: Thursday(4), Friday(5), Saturday(6), Sunday(0)
  regional_standard: [4, 5, 6, 0],
  // EMEA: Tuesday(2), Wednesday(3), Thursday(4), Friday(5)
  emea: [2, 3, 4, 5],
  // International: Thu-Sun, can extend to Mon(1), Tue(2) if needed
  international: [4, 5, 6, 0, 1, 2],
} as const;

/**
 * VCT Season timing (days from season start)
 */
const SEASON_TIMING = {
  kickoff: { start: 0, duration: 28 },
  masters1: { start: 35, duration: 18 },  // Swiss (8 days) + Playoffs (10 days)
  stage1: { start: 56, duration: 35 },
  stage1_playoffs: { start: 98, duration: 14 },
  masters2: { start: 119, duration: 18 }, // Swiss (8 days) + Playoffs (10 days)
  stage2: { start: 140, duration: 35 },
  stage2_playoffs: { start: 182, duration: 14 },
  champions: { start: 217, duration: 21 },
} as const;

/**
 * Result from creating all tournaments
 */
export interface TournamentScheduleResult {
  kickoffs: Tournament[];
  masters1: MultiStageTournament;
  stage1s: Tournament[];
  stage1Playoffs: Tournament[];
  masters2: MultiStageTournament;
  stage2s: Tournament[];
  stage2Playoffs: Tournament[];
  champions: MultiStageTournament;

  /** Get all tournaments as a flat array */
  allTournaments(): Tournament[];
}

/**
 * GlobalTournamentScheduler - Creates all VCT tournaments at game initialization
 *
 * Core principle: Upfront creation, lazy resolution
 * - All tournament structures created at game init
 * - Bracket positions use TeamSlot (resolved, TBD, or qualified_from)
 * - Teams are resolved when they qualify from previous phases
 */
export class GlobalTournamentScheduler {
  private regions: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];

  /**
   * Create ALL VCT tournaments for the season
   */
  createAllTournaments(
    teams: Team[],
    seasonStartDate: string
  ): TournamentScheduleResult {
    const startDate = new Date(seasonStartDate);

    // 1. Create 4 regional Kickoffs (teams known)
    const kickoffs = this.regions.map((region) =>
      this.createKickoff(region, teams, startDate)
    );

    // 2. Create Masters 1 (Santiago) with TBD slots
    const masters1 = this.createMasters(
      'masters1',
      'VCT Masters Santiago 2026',
      startDate,
      SEASON_TIMING.masters1.start
    );

    // 3. Create 4 regional Stage 1 leagues (teams known from region)
    const stage1s = this.regions.map((region) =>
      this.createStageLeague(region, 'stage1', teams, startDate, SEASON_TIMING.stage1.start)
    );

    // 4. Create 4 regional Stage 1 Playoffs with TBD slots
    const stage1Playoffs = this.regions.map((region) =>
      this.createStagePlayoffs(region, 'stage1', startDate, SEASON_TIMING.stage1_playoffs.start)
    );

    // 5. Create Masters 2 (London) with TBD slots
    const masters2 = this.createMasters(
      'masters2',
      'VCT Masters London 2026',
      startDate,
      SEASON_TIMING.masters2.start
    );

    // 6. Create 4 regional Stage 2 leagues (teams known from region)
    const stage2s = this.regions.map((region) =>
      this.createStageLeague(region, 'stage2', teams, startDate, SEASON_TIMING.stage2.start)
    );

    // 7. Create 4 regional Stage 2 Playoffs with TBD slots
    const stage2Playoffs = this.regions.map((region) =>
      this.createStagePlayoffs(region, 'stage2', startDate, SEASON_TIMING.stage2_playoffs.start)
    );

    // 8. Create Champions with TBD slots
    const champions = this.createChampions(startDate, SEASON_TIMING.champions.start);

    return {
      kickoffs,
      masters1,
      stage1s,
      stage1Playoffs,
      masters2,
      stage2s,
      stage2Playoffs,
      champions,
      allTournaments() {
        return [
          ...this.kickoffs,
          this.masters1,
          ...this.stage1s,
          ...this.stage1Playoffs,
          this.masters2,
          ...this.stage2s,
          ...this.stage2Playoffs,
          this.champions,
        ];
      },
    };
  }

  /**
   * Create a regional Kickoff tournament
   * 12 teams per region, triple elimination format
   */
  private createKickoff(region: Region, teams: Team[], seasonStart: Date): Tournament {
    const regionTeams = teams.filter((t) => t.region === region);

    // Sort by official seeding
    const sortedTeams = this.sortTeamsByKickoffSeeding(regionTeams, region);
    const teamIds = sortedTeams.slice(0, 12).map((t) => t.id);

    // Calculate dates
    const startDate = new Date(seasonStart);
    startDate.setDate(startDate.getDate() + SEASON_TIMING.kickoff.start);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + SEASON_TIMING.kickoff.duration);

    const id = this.generateId('kickoff', region);

    // Generate bracket
    const seeding = teamIds.map((_, i) => i + 1); // Already sorted by seeding
    let bracket = bracketManager.generateTripleElimination(teamIds, seeding);
    bracket = this.prefixBracketMatchIds(bracket, id);

    // Schedule all bracket matches upfront on proper match days
    this.scheduleAllBracketMatches(bracket, startDate, endDate, region);

    // Initialize standings
    const standings: TournamentStandingsEntry[] = teamIds.map((teamId) => ({
      teamId,
      wins: 0,
      losses: 0,
      roundDiff: 0,
      mapDiff: 0,
    }));

    // Create team slots (all resolved since teams are known)
    const teamSlots: TeamSlot[] = teamIds.map((teamId) => ({
      type: 'resolved',
      teamId,
    }));

    const tournament: Tournament = {
      id,
      name: `VCT ${region} Kickoff 2026`,
      type: 'kickoff',
      format: 'triple_elim',
      region,
      teamIds,
      teamSlots,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool: tournamentEngine.calculatePrizePool('kickoff', 500000),
      bracket,
      standings,
      status: 'upcoming',
    };

    return tournament;
  }

  /**
   * Create a Masters tournament with TBD slots
   * 12 teams: 4 Kickoff winners (alpha) + 8 Swiss teams (beta/omega)
   */
  private createMasters(
    mastersId: 'masters1' | 'masters2',
    name: string,
    seasonStart: Date,
    dayOffset: number
  ): MultiStageTournament {
    const startDate = new Date(seasonStart);
    startDate.setDate(startDate.getDate() + dayOffset);
    const endDate = new Date(startDate);
    // Use duration from SEASON_TIMING to ensure tournament dates are consistent
    const duration = mastersId === 'masters1'
      ? SEASON_TIMING.masters1.duration
      : SEASON_TIMING.masters2.duration;
    endDate.setDate(endDate.getDate() + duration); // Swiss + Playoffs

    const id = this.generateId('masters', mastersId);

    // Create TBD team slots
    // 4 alpha bracket winners (1 per region) - go directly to playoffs
    // 8 beta/omega qualifiers (2 per region) - play Swiss first
    const teamSlots: TeamSlot[] = [];

    // Alpha winners (playoff only)
    for (const region of this.regions) {
      teamSlots.push({
        type: 'qualified_from',
        source: {
          tournamentType: 'kickoff',
          region,
          placement: 'alpha',
        },
        description: `${region} Kickoff Alpha Winner`,
      });
    }

    // Beta qualifiers (Swiss)
    for (const region of this.regions) {
      teamSlots.push({
        type: 'qualified_from',
        source: {
          tournamentType: 'kickoff',
          region,
          placement: 'beta',
        },
        description: `${region} Kickoff Beta`,
      });
    }

    // Omega qualifiers (Swiss)
    for (const region of this.regions) {
      teamSlots.push({
        type: 'qualified_from',
        source: {
          tournamentType: 'kickoff',
          region,
          placement: 'omega',
        },
        description: `${region} Kickoff Omega`,
      });
    }

    // Empty placeholder bracket (created when Swiss completes)
    const emptyBracket: BracketStructure = { upper: [] };

    // Initialize Swiss stage with empty team IDs (TBD)
    // We'll need 8 teams for Swiss (beta + omega from each region)
    const swissTeamIds: string[] = []; // Will be filled when qualifiers are resolved
    const swissStage: SwissStage = {
      rounds: [],
      standings: [],
      qualifiedTeamIds: [],
      eliminatedTeamIds: [],
      currentRound: 1,
      totalRounds: 3,
      winsToQualify: 2,
      lossesToEliminate: 2,
    };

    const tournament: MultiStageTournament = {
      id,
      name,
      type: 'masters',
      format: 'swiss_to_playoff',
      region: 'International',
      teamIds: [], // Will be filled when qualifiers are resolved
      teamSlots,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool: tournamentEngine.calculatePrizePool('masters', 1000000),
      bracket: emptyBracket,
      status: 'upcoming',
      swissStage,
      currentStage: 'swiss',
      swissTeamIds,
      playoffOnlyTeamIds: [], // Will be filled with alpha winners
    };

    return tournament;
  }

  /**
   * Create a regional Stage league tournament
   * All 12 teams in region, round-robin format
   */
  private createStageLeague(
    region: Region,
    stage: 'stage1' | 'stage2',
    teams: Team[],
    seasonStart: Date,
    dayOffset: number
  ): Tournament {
    const regionTeams = teams.filter((t) => t.region === region);
    const teamIds = regionTeams.map((t) => t.id);

    const startDate = new Date(seasonStart);
    startDate.setDate(startDate.getDate() + dayOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 35); // 5 weeks

    const id = this.generateId(stage, region);

    // Generate round-robin bracket
    let bracket = bracketManager.generateRoundRobin(teamIds);
    bracket = this.prefixBracketMatchIds(bracket, id);

    // Schedule all round-robin matches across the stage period on proper match days
    this.scheduleRoundRobinMatches(bracket, startDate, endDate, region);

    // Initialize standings
    const standings: TournamentStandingsEntry[] = teamIds.map((teamId) => ({
      teamId,
      wins: 0,
      losses: 0,
      roundDiff: 0,
      mapDiff: 0,
    }));

    // All teams are known (resolved slots)
    const teamSlots: TeamSlot[] = teamIds.map((teamId) => ({
      type: 'resolved',
      teamId,
    }));

    const stageName = stage === 'stage1' ? 'Stage 1' : 'Stage 2';

    const tournament: Tournament = {
      id,
      name: `VCT ${region} ${stageName} 2026`,
      type: stage,
      format: 'round_robin',
      region,
      teamIds,
      teamSlots,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool: tournamentEngine.calculatePrizePool(stage, 200000),
      bracket,
      standings,
      status: 'upcoming',
    };

    return tournament;
  }

  /**
   * Create a regional Stage Playoffs tournament with TBD slots
   * Top 8 from stage league qualify
   */
  private createStagePlayoffs(
    region: Region,
    stage: 'stage1' | 'stage2',
    seasonStart: Date,
    dayOffset: number
  ): Tournament {
    const startDate = new Date(seasonStart);
    startDate.setDate(startDate.getDate() + dayOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks

    const id = this.generateId(`${stage}_playoffs`, region);
    const stageName = stage === 'stage1' ? 'Stage 1' : 'Stage 2';

    // Create TBD team slots for top 8 from stage league
    const teamSlots: TeamSlot[] = [];
    for (let i = 1; i <= 8; i++) {
      teamSlots.push({
        type: 'qualified_from',
        source: {
          tournamentType: stage,
          region,
          placement: i,
        },
        description: `${region} ${stageName} #${i}`,
      });
    }

    // Empty bracket (will be generated when teams qualify)
    const emptyBracket: BracketStructure = { upper: [] };

    const tournament: Tournament = {
      id,
      name: `VCT ${region} ${stageName} Playoffs 2026`,
      type: stage, // Use 'stage1' or 'stage2' type
      format: 'double_elim',
      region,
      teamIds: [], // Will be filled when qualifiers are resolved
      teamSlots,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool: tournamentEngine.calculatePrizePool(stage, 300000),
      bracket: emptyBracket,
      status: 'upcoming',
    };

    return tournament;
  }

  /**
   * Create Champions tournament with TBD slots
   * 16 teams from all regions
   */
  private createChampions(seasonStart: Date, dayOffset: number): MultiStageTournament {
    const startDate = new Date(seasonStart);
    startDate.setDate(startDate.getDate() + dayOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 21); // 3 weeks

    const id = this.generateId('champions', 'international');

    // Create TBD team slots
    // 4 teams per region based on Championship Points
    const teamSlots: TeamSlot[] = [];

    for (const region of this.regions) {
      for (let i = 1; i <= 4; i++) {
        teamSlots.push({
          type: 'qualified_from',
          source: {
            tournamentType: 'champions',
            region,
            placement: i,
          },
          description: `${region} #${i} Championship Points`,
        });
      }
    }

    // Empty bracket (will be generated when teams qualify)
    const emptyBracket: BracketStructure = { upper: [] };

    // Swiss stage for Champions
    const swissStage: SwissStage = {
      rounds: [],
      standings: [],
      qualifiedTeamIds: [],
      eliminatedTeamIds: [],
      currentRound: 1,
      totalRounds: 4, // Champions has 4 Swiss rounds
      winsToQualify: 3,
      lossesToEliminate: 3,
    };

    const tournament: MultiStageTournament = {
      id,
      name: 'VCT Champions Shanghai 2026',
      type: 'champions',
      format: 'swiss_to_playoff',
      region: 'International',
      teamIds: [], // Will be filled when qualifiers are resolved
      teamSlots,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      prizePool: tournamentEngine.calculatePrizePool('champions', 2500000),
      bracket: emptyBracket,
      status: 'upcoming',
      swissStage,
      currentStage: 'swiss',
      swissTeamIds: [],
      playoffOnlyTeamIds: [],
    };

    return tournament;
  }

  /**
   * Generate all match calendar events for all tournaments
   */
  generateAllMatchEvents(result: TournamentScheduleResult): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Generate events for each tournament
    for (const tournament of result.allTournaments()) {
      // Add tournament start/end events
      events.push({
        id: `event-${tournament.id}-start`,
        type: 'tournament_start',
        date: tournament.startDate,
        data: { tournamentId: tournament.id, tournamentName: tournament.name },
        processed: false,
        required: false,
      });

      events.push({
        id: `event-${tournament.id}-end`,
        type: 'tournament_end',
        date: tournament.endDate,
        data: { tournamentId: tournament.id, tournamentName: tournament.name },
        processed: false,
        required: false,
      });

      // Generate match events for ready matches (teams known)
      const matchEvents = this.generateMatchEventsForTournament(tournament);
      events.push(...matchEvents);
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  }

  /**
   * Generate match calendar events for a tournament
   * Only creates events for matches with both teams known
   */
  private generateMatchEventsForTournament(tournament: Tournament): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    const processMatches = (matches: Array<{
      matchId: string;
      teamAId?: string;
      teamBId?: string;
      scheduledDate?: string;
      status: string;
    }>) => {
      for (const match of matches) {
        // Only create events for ready matches with known teams
        if (match.status !== 'ready') continue;
        if (!match.teamAId || !match.teamBId) continue;

        events.push({
          id: `event-match-${match.matchId}`,
          type: 'match',
          date: match.scheduledDate || tournament.startDate,
          data: {
            matchId: match.matchId,
            homeTeamId: match.teamAId,
            awayTeamId: match.teamBId,
            tournamentId: tournament.id,
            isPlayerMatch: false,
            region: tournament.region === 'International' ? undefined : tournament.region as Region,
            phase: tournament.type === 'kickoff' ? 'kickoff' :
                   tournament.type === 'stage1' ? 'stage1' :
                   tournament.type === 'stage2' ? 'stage2' :
                   tournament.type === 'masters' ? (tournament.name.includes('Santiago') ? 'masters1' : 'masters2') :
                   'champions',
          },
          processed: false,
          required: true,
        });
      }
    };

    // Process bracket matches
    for (const round of tournament.bracket.upper) {
      processMatches(round.matches);
    }

    if (tournament.bracket.lower) {
      for (const round of tournament.bracket.lower) {
        processMatches(round.matches);
      }
    }

    if (tournament.bracket.middle) {
      for (const round of tournament.bracket.middle) {
        processMatches(round.matches);
      }
    }

    if (tournament.bracket.grandfinal) {
      processMatches([tournament.bracket.grandfinal]);
    }

    return events;
  }

  // ============================================
  // Helper Methods
  // ============================================

  private generateId(type: string, suffix: string): string {
    return `tournament-${type}-${suffix.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private sortTeamsByKickoffSeeding<T extends { name: string }>(
    teams: T[],
    region: Region
  ): T[] {
    const seedingArray = this.getKickoffSeeding(region);
    const seedingMap = new Map<string, number>();
    seedingArray.forEach((teamName, index) => {
      seedingMap.set(teamName.toLowerCase(), index);
    });

    return [...teams].sort((a, b) => {
      const seedA = seedingMap.get(a.name.toLowerCase()) ?? 999;
      const seedB = seedingMap.get(b.name.toLowerCase()) ?? 999;
      return seedA - seedB;
    });
  }

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

  // ============================================
  // Match Scheduling Methods
  // ============================================

  /**
   * Get valid match days for a region
   */
  getMatchDays(region: Region | 'International'): readonly number[] {
    if (region === 'International') {
      return MATCH_DAYS.international;
    }
    if (region === 'EMEA') {
      return MATCH_DAYS.emea;
    }
    return MATCH_DAYS.regional_standard;
  }

  /**
   * Find next valid match day from a given date
   */
  getNextMatchDay(date: Date, matchDays: readonly number[]): Date {
    const result = new Date(date);
    // Try up to 7 days to find a valid match day
    for (let i = 0; i < 7; i++) {
      if (matchDays.includes(result.getUTCDay())) {
        return result;
      }
      result.setUTCDate(result.getUTCDate() + 1);
    }
    // Fallback to original date if no match day found (shouldn't happen)
    return new Date(date);
  }

  /**
   * Get the last valid match day before or on a given date
   */
  getLastMatchDayBefore(date: Date, matchDays: readonly number[]): Date {
    const result = new Date(date);
    // Try up to 7 days backward to find a valid match day
    for (let i = 0; i < 7; i++) {
      if (matchDays.includes(result.getUTCDay())) {
        return result;
      }
      result.setUTCDate(result.getUTCDate() - 1);
    }
    // Fallback to original date if no match day found (shouldn't happen)
    return new Date(date);
  }

  /**
   * Schedule all matches in a bracket by round
   * Earlier rounds get earlier dates, all matches in same round share same date
   */
  scheduleAllBracketMatches(
    bracket: BracketStructure,
    startDate: Date,
    endDate: Date,
    region: Region | 'International'
  ): void {
    const matchDays = this.getMatchDays(region);

    // Collect all rounds in order: upper R1, R2..., middle R1, R2..., lower R1, R2...
    const allRounds: BracketRound[] = [];

    // Upper bracket rounds
    for (const round of bracket.upper) {
      allRounds.push(round);
    }

    // Middle bracket rounds (if exists - for triple elim)
    if (bracket.middle) {
      for (const round of bracket.middle) {
        allRounds.push(round);
      }
    }

    // Lower bracket rounds
    if (bracket.lower) {
      for (const round of bracket.lower) {
        allRounds.push(round);
      }
    }

    // Calculate how many match days we have in the range
    const totalRounds = allRounds.length;
    if (totalRounds === 0) return;

    // Start from the first valid match day on or after startDate
    let currentDate = this.getNextMatchDay(new Date(startDate), matchDays);

    // Calculate roughly how many match days we need to spread rounds
    // Leave the last match day for grand final
    const lastMatchDay = this.getLastMatchDayBefore(new Date(endDate), matchDays);

    // Distribute rounds across available match days
    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
      const round = allRounds[roundIndex];

      // Ensure we don't exceed tournament end date
      if (currentDate > lastMatchDay) {
        currentDate = new Date(lastMatchDay);
        currentDate.setUTCDate(currentDate.getUTCDate() - 1);
        currentDate = this.getLastMatchDayBefore(currentDate, matchDays);
      }

      // Assign same date to all matches in round (they can be played in parallel)
      for (const match of round.matches) {
        match.scheduledDate = currentDate.toISOString();
      }

      // Move to next match day for next round
      const nextDay = new Date(currentDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      currentDate = this.getNextMatchDay(nextDay, matchDays);
    }

    // Grand final on last match day before endDate
    if (bracket.grandfinal) {
      bracket.grandfinal.scheduledDate = lastMatchDay.toISOString();
    }
  }

  /**
   * Schedule round-robin matches across a date range
   * Distributes matches evenly across valid match days
   */
  scheduleRoundRobinMatches(
    bracket: BracketStructure,
    startDate: Date,
    endDate: Date,
    region: Region | 'International'
  ): void {
    const matchDays = this.getMatchDays(region);

    // Collect all matches from the round-robin bracket
    const allMatches: BracketMatch[] = [];
    for (const round of bracket.upper) {
      for (const match of round.matches) {
        allMatches.push(match);
      }
    }

    if (allMatches.length === 0) return;

    // Collect all valid match days in the range
    const validMatchDays: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      if (matchDays.includes(current.getUTCDay())) {
        validMatchDays.push(new Date(current));
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (validMatchDays.length === 0) return;

    // Distribute matches evenly across match days
    const matchesPerDay = Math.ceil(allMatches.length / validMatchDays.length);

    let dayIndex = 0;
    let matchCountOnDay = 0;

    for (const match of allMatches) {
      match.scheduledDate = validMatchDays[dayIndex].toISOString();
      matchCountOnDay++;

      if (matchCountOnDay >= matchesPerDay && dayIndex < validMatchDays.length - 1) {
        dayIndex++;
        matchCountOnDay = 0;
      }
    }
  }

  /**
   * Prefix all match IDs in a bracket with tournament ID for uniqueness
   */
  private prefixBracketMatchIds(bracket: BracketStructure, tournamentId: string): BracketStructure {
    const prefix = tournamentId.slice(-12);

    const prefixId = (id: string) => `${prefix}-${id}`;

    const updateDestination = <T extends { type: string; matchId?: string }>(dest: T): T => {
      if (dest.type === 'match' && dest.matchId) {
        return { ...dest, matchId: prefixId(dest.matchId) };
      }
      return dest;
    };

    const updateSource = <T extends { type: string; matchId?: string }>(source: T): T => {
      if ((source.type === 'winner' || source.type === 'loser') && source.matchId) {
        return { ...source, matchId: prefixId(source.matchId) };
      }
      return source;
    };

    const processRound = (round: BracketRound): BracketRound => ({
      ...round,
      roundId: prefixId(round.roundId),
      matches: round.matches.map((match) => ({
        ...match,
        matchId: prefixId(match.matchId),
        roundId: prefixId(match.roundId),
        teamASource: updateSource(match.teamASource),
        teamBSource: updateSource(match.teamBSource),
        winnerDestination: updateDestination(match.winnerDestination),
        loserDestination: updateDestination(match.loserDestination),
      })),
    });

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
      const gf = bracket.grandfinal;
      newBracket.grandfinal = {
        ...gf,
        matchId: prefixId(gf.matchId),
        roundId: prefixId(gf.roundId),
        teamASource: updateSource(gf.teamASource),
        teamBSource: updateSource(gf.teamBSource),
        winnerDestination: updateDestination(gf.winnerDestination),
        loserDestination: updateDestination(gf.loserDestination),
      };
    }

    return newBracket;
  }
}

// Export singleton instance
export const globalTournamentScheduler = new GlobalTournamentScheduler();
