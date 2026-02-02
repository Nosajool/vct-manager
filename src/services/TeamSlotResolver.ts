// TeamSlotResolver - Resolves TBD slots when teams qualify from previous tournaments

import { useGameStore } from '../store';
import { bracketManager } from '../engine/competition';
import { globalTournamentScheduler } from './GlobalTournamentScheduler';
import type {
  Tournament,
  MultiStageTournament,
  Region,
  Match,
  CalendarEvent,
  BracketMatch,
  SwissStage,
} from '../types';
import type { TeamSlot } from '../types/competition';
import { isMultiStageTournament } from '../types';

/**
 * Qualified team info extracted from a completed tournament
 */
interface QualifiedTeam {
  teamId: string;
  placement: 'alpha' | 'beta' | 'omega' | 'first' | 'second' | 'third' | number;
  source: {
    tournamentId: string;
    tournamentType: string;
    region: Region | 'International';
  };
}

/**
 * TeamSlotResolver - Resolves TBD slots when teams qualify from previous tournaments
 *
 * Called when a tournament completes to:
 * 1. Extract qualifiers from the completed tournament
 * 2. Find downstream tournaments with TBD slots
 * 3. Resolve those slots and update brackets
 * 4. Create Match entities and calendar events for newly-ready matches
 */
export class TeamSlotResolver {
  /**
   * Resolve qualifications from a completed tournament
   */
  resolveQualifications(completedTournamentId: string): void {
    const state = useGameStore.getState();
    const completed = state.tournaments[completedTournamentId];

    if (!completed) {
      console.error(`Tournament not found: ${completedTournamentId}`);
      return;
    }

    console.log(`Resolving qualifications from ${completed.name}`);

    // Extract qualifiers based on tournament type
    const qualifiers = this.extractQualifiers(completed);

    if (qualifiers.length === 0) {
      console.log('No qualifiers to process');
      return;
    }

    console.log(`Found ${qualifiers.length} qualifiers:`, qualifiers.map(q => ({
      teamId: q.teamId,
      placement: q.placement,
    })));

    // Find downstream tournaments with TBD slots for this source
    const downstreamIds = this.findDownstreamTournaments(completed);

    console.log(`Found ${downstreamIds.length} downstream tournaments`);

    for (const tournamentId of downstreamIds) {
      this.fillTeamSlots(tournamentId, qualifiers, completed);
    }
  }

  /**
   * Extract qualified teams from a completed tournament
   */
  private extractQualifiers(tournament: Tournament): QualifiedTeam[] {
    const qualifiers: QualifiedTeam[] = [];

    switch (tournament.type) {
      case 'kickoff': {
        // Extract alpha, beta, omega qualifiers
        const kickoffQualifiers = bracketManager.getQualifiers(tournament.bracket);
        if (kickoffQualifiers.alpha) {
          qualifiers.push({
            teamId: kickoffQualifiers.alpha,
            placement: 'alpha',
            source: {
              tournamentId: tournament.id,
              tournamentType: 'kickoff',
              region: tournament.region as Region,
            },
          });
        }
        if (kickoffQualifiers.beta) {
          qualifiers.push({
            teamId: kickoffQualifiers.beta,
            placement: 'beta',
            source: {
              tournamentId: tournament.id,
              tournamentType: 'kickoff',
              region: tournament.region as Region,
            },
          });
        }
        if (kickoffQualifiers.omega) {
          qualifiers.push({
            teamId: kickoffQualifiers.omega,
            placement: 'omega',
            source: {
              tournamentId: tournament.id,
              tournamentType: 'kickoff',
              region: tournament.region as Region,
            },
          });
        }
        break;
      }

      case 'stage1':
      case 'stage2': {
        // Extract top 8 from standings for playoffs
        const standings = tournament.standings || [];
        const sortedStandings = [...standings].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
          return b.mapDiff - a.mapDiff;
        });

        for (let i = 0; i < Math.min(8, sortedStandings.length); i++) {
          qualifiers.push({
            teamId: sortedStandings[i].teamId,
            placement: i + 1, // 1-8
            source: {
              tournamentId: tournament.id,
              tournamentType: tournament.type,
              region: tournament.region as Region,
            },
          });
        }
        break;
      }

      case 'masters': {
        // Extract top teams for Championship Points (not direct qualification)
        const placements = bracketManager.getFinalPlacements(tournament.bracket);
        for (const [place, teamId] of Object.entries(placements)) {
          if (teamId) {
            qualifiers.push({
              teamId,
              placement: parseInt(place),
              source: {
                tournamentId: tournament.id,
                tournamentType: 'masters',
                region: tournament.region,
              },
            });
          }
        }
        break;
      }

      case 'champions':
        // Champions is the final tournament - no further qualification
        break;
    }

    return qualifiers;
  }

  /**
   * Find tournaments that have TBD slots sourced from the completed tournament
   */
  private findDownstreamTournaments(completed: Tournament): string[] {
    const state = useGameStore.getState();
    const downstreamIds: string[] = [];

    for (const tournament of Object.values(state.tournaments)) {
      if (!tournament.teamSlots) continue;
      if (tournament.status === 'completed') continue;

      // Check if any TBD slots reference this completed tournament's type/region
      const hasMatchingSlots = tournament.teamSlots.some((slot: TeamSlot) => {
        if (slot.type !== 'qualified_from') return false;
        const source = slot.source;

        // Match tournament type
        if (source.tournamentType !== completed.type) return false;

        // Match region if specified
        if (source.region && source.region !== completed.region) return false;

        return true;
      });

      if (hasMatchingSlots) {
        downstreamIds.push(tournament.id);
      }
    }

    return downstreamIds;
  }

  /**
   * Fill TBD team slots with qualified teams
   */
  private fillTeamSlots(
    tournamentId: string,
    qualifiers: QualifiedTeam[],
    source: Tournament
  ): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament || !tournament.teamSlots) {
      return;
    }

    console.log(`Filling slots in ${tournament.name} from ${source.name}`);

    // Create a map of qualifiers by placement
    const qualifierMap = new Map<string, string>(); // "placement" -> teamId
    for (const q of qualifiers) {
      const key = String(q.placement);
      qualifierMap.set(key, q.teamId);
    }

    // Update team slots
    const updatedSlots: TeamSlot[] = [...tournament.teamSlots];
    const resolvedTeamIds: string[] = [...tournament.teamIds];

    for (let i = 0; i < updatedSlots.length; i++) {
      const slot = updatedSlots[i];

      if (slot.type !== 'qualified_from') continue;

      // Check if this slot matches the source
      if (slot.source.tournamentType !== source.type) continue;
      if (slot.source.region && slot.source.region !== source.region) continue;

      // Find matching qualifier
      const placementKey = String(slot.source.placement);
      const teamId = qualifierMap.get(placementKey);

      if (teamId) {
        // Resolve this slot
        updatedSlots[i] = { type: 'resolved', teamId };

        if (!resolvedTeamIds.includes(teamId)) {
          resolvedTeamIds.push(teamId);
        }

        console.log(`  Resolved slot ${i} (${slot.description}) -> ${teamId}`);
      }
    }

    // Check if this is a Masters tournament with Swiss stage
    if (isMultiStageTournament(tournament)) {
      this.updateMastersWithQualifiers(tournamentId, qualifiers, source, updatedSlots);
    } else {
      // Update tournament with resolved slots
      state.updateTournament(tournamentId, {
        teamSlots: updatedSlots,
        teamIds: resolvedTeamIds,
      });

      // Check if all slots are resolved and we can generate the bracket
      const allResolved = updatedSlots.every(s => s.type === 'resolved');
      if (allResolved && resolvedTeamIds.length > 0) {
        this.generateBracketForResolvedTournament(tournamentId, resolvedTeamIds);
      }
    }
  }

  /**
   * Update a Masters tournament with qualified teams
   */
  private updateMastersWithQualifiers(
    tournamentId: string,
    qualifiers: QualifiedTeam[],
    _source: Tournament,
    updatedSlots: TeamSlot[]
  ): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId] as MultiStageTournament;

    if (!tournament) return;

    // Separate alpha (playoff) and beta/omega (Swiss) qualifiers
    const playoffTeams: string[] = [...(tournament.playoffOnlyTeamIds || [])];
    const swissTeams: string[] = [...(tournament.swissTeamIds || [])];

    for (const q of qualifiers) {
      if (q.placement === 'alpha') {
        if (!playoffTeams.includes(q.teamId)) {
          playoffTeams.push(q.teamId);
        }
      } else if (q.placement === 'beta' || q.placement === 'omega') {
        if (!swissTeams.includes(q.teamId)) {
          swissTeams.push(q.teamId);
        }
      }
    }

    const allTeamIds = [...playoffTeams, ...swissTeams];

    // Update tournament - cast to allow MultiStageTournament fields
    state.updateTournament(tournamentId, {
      teamSlots: updatedSlots,
      teamIds: allTeamIds,
    } as Partial<Tournament>);

    // Update multi-stage specific fields separately if needed
    // These will be merged by the store's spread operator
    const multiStageUpdates = {
      playoffOnlyTeamIds: playoffTeams,
      swissTeamIds: swissTeams,
    };
    state.updateTournament(tournamentId, multiStageUpdates as Partial<Tournament>);

    // If we have all 8 Swiss teams, initialize the Swiss stage
    if (swissTeams.length === 8) {
      console.log('All Swiss teams resolved, initializing Swiss stage');
      this.initializeSwissStage(tournamentId, swissTeams);
    }

    console.log(`Masters update: ${playoffTeams.length} playoff teams, ${swissTeams.length} Swiss teams`);
  }

  /**
   * Initialize Swiss stage when all teams are resolved
   */
  private initializeSwissStage(tournamentId: string, swissTeamIds: string[]): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId] as MultiStageTournament;

    if (!tournament) return;

    // Create team regions map
    const teamRegions = new Map<string, string>();
    for (const teamId of swissTeamIds) {
      const team = state.teams[teamId];
      if (team) {
        teamRegions.set(teamId, team.region);
      }
    }

    // Initialize Swiss stage with the teams
    const swissStage = bracketManager.initializeSwissStage(swissTeamIds, teamRegions, {
      totalRounds: 3,
      winsToQualify: 2,
      lossesToEliminate: 2,
      tournamentId,
    });

    // Update tournament with initialized Swiss stage
    state.updateSwissStage(tournamentId, swissStage);

    // Create Match entities for first round
    this.createSwissRoundMatches(tournamentId, swissStage, 1);
  }

  /**
   * Create Match entities and calendar events for a Swiss round
   * Uses proper match days based on tournament region
   */
  private createSwissRoundMatches(
    tournamentId: string,
    swissStage: SwissStage,
    roundNumber: number
  ): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) return;

    const round = swissStage.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return;

    const events: CalendarEvent[] = [];
    const currentDate = state.calendar.currentDate;

    // Get proper match days for the tournament
    const region = tournament.region === 'International' ? 'International' : tournament.region;
    const matchDays = globalTournamentScheduler.getMatchDays(region);

    // Find next valid match day from current date
    let matchDate = globalTournamentScheduler.getNextMatchDay(new Date(currentDate), matchDays);

    // Ensure match date is within tournament range
    const tournamentStart = new Date(tournament.startDate);
    const tournamentEnd = new Date(tournament.endDate);
    if (matchDate < tournamentStart) matchDate = globalTournamentScheduler.getNextMatchDay(tournamentStart, matchDays);
    if (matchDate > tournamentEnd) matchDate = globalTournamentScheduler.getLastMatchDayBefore(tournamentEnd, matchDays);

    for (const match of round.matches) {
      if (match.status !== 'ready' || !match.teamAId || !match.teamBId) continue;

      // Set scheduled date on proper match day
      if (!match.scheduledDate) {
        match.scheduledDate = matchDate.toISOString();
      }

      // Create Match entity
      if (!state.matches[match.matchId]) {
        const matchEntity: Match = {
          id: match.matchId,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          scheduledDate: match.scheduledDate,
          status: 'scheduled',
          tournamentId,
        };
        state.addMatch(matchEntity);
      }

      // Create calendar event
      const teamA = state.teams[match.teamAId];
      const teamB = state.teams[match.teamBId];

      events.push({
        id: `event-match-${match.matchId}`,
        type: 'match',
        date: match.scheduledDate,
        data: {
          matchId: match.matchId,
          homeTeamId: match.teamAId,
          awayTeamId: match.teamBId,
          homeTeamName: teamA?.name || 'Unknown',
          awayTeamName: teamB?.name || 'Unknown',
          tournamentId,
          isSwissMatch: true,
          swissRound: roundNumber,
        },
        processed: false,
        required: true,
      });
    }

    if (events.length > 0) {
      state.addCalendarEvents(events);
    }
  }

  /**
   * Generate bracket for a tournament when all teams are resolved
   */
  private generateBracketForResolvedTournament(
    tournamentId: string,
    teamIds: string[]
  ): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) return;

    console.log(`Generating bracket for ${tournament.name} with ${teamIds.length} teams`);

    // Generate appropriate bracket based on format
    let bracket;
    switch (tournament.format) {
      case 'double_elim':
        bracket = bracketManager.generateDoubleElimination(teamIds);
        break;
      case 'single_elim':
        bracket = bracketManager.generateSingleElimination(teamIds);
        break;
      default:
        console.warn(`Unexpected format for resolved tournament: ${tournament.format}`);
        return;
    }

    // Prefix match IDs
    const prefix = tournamentId.slice(-12);
    const prefixId = (id: string) => `${prefix}-${id}`;

    // Update match IDs in bracket (simplified version)
    for (const round of bracket.upper) {
      round.roundId = prefixId(round.roundId);
      for (const match of round.matches) {
        match.matchId = prefixId(match.matchId);
        match.roundId = prefixId(match.roundId);
      }
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        round.roundId = prefixId(round.roundId);
        for (const match of round.matches) {
          match.matchId = prefixId(match.matchId);
          match.roundId = prefixId(match.roundId);
        }
      }
    }

    if (bracket.grandfinal) {
      bracket.grandfinal.matchId = prefixId(bracket.grandfinal.matchId);
      bracket.grandfinal.roundId = prefixId(bracket.grandfinal.roundId);
    }

    // Update tournament with bracket
    state.updateBracket(tournamentId, bracket);

    // Create Match entities for ready matches
    this.createMatchEntitiesForBracket(tournamentId, bracket);
  }

  /**
   * Create Match entities for ready bracket matches
   * Schedules all bracket matches upfront using proper match days
   */
  private createMatchEntitiesForBracket(
    tournamentId: string,
    bracket: { upper: Array<{ matches: BracketMatch[] }>; lower?: Array<{ matches: BracketMatch[] }>; grandfinal?: BracketMatch }
  ): void {
    const state = useGameStore.getState();
    const tournament = state.tournaments[tournamentId];

    if (!tournament) return;

    // Get proper match days for the tournament
    const region = tournament.region === 'International' ? 'International' : tournament.region;

    // Start from the day AFTER current date (today's events already processed)
    const currentDate = state.calendar.currentDate;
    const tomorrow = new Date(currentDate);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const startDate = tomorrow;

    // Ensure endDate is in the future - if tournament.endDate has passed,
    // extend it to accommodate the bracket
    let endDate = new Date(tournament.endDate);
    if (endDate <= startDate) {
      // Tournament end date is in the past, extend it
      endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 14);
      console.log(`  Tournament ${tournament.name} endDate was in the past, extended to ${endDate.toISOString()}`);
    }

    globalTournamentScheduler.scheduleAllBracketMatches(
      bracket as import('../types').BracketStructure,
      startDate,
      endDate,
      region
    );

    const events: CalendarEvent[] = [];

    const processMatches = (matches: BracketMatch[], isGrandFinal: boolean = false) => {
      for (const match of matches) {
        if (match.status !== 'ready' || !match.teamAId || !match.teamBId) continue;

        // Create Match entity
        if (!state.matches[match.matchId]) {
          const matchEntity: Match = {
            id: match.matchId,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            scheduledDate: match.scheduledDate || tournament.startDate,
            status: 'scheduled',
            tournamentId,
          };
          state.addMatch(matchEntity);
        }

        // Create calendar event
        const teamA = state.teams[match.teamAId];
        const teamB = state.teams[match.teamBId];

        events.push({
          id: `event-match-${match.matchId}`,
          type: 'match',
          date: match.scheduledDate || tournament.startDate,
          data: {
            matchId: match.matchId,
            homeTeamId: match.teamAId,
            awayTeamId: match.teamBId,
            homeTeamName: teamA?.name || 'Unknown',
            awayTeamName: teamB?.name || 'Unknown',
            tournamentId,
            isGrandFinal,
          },
          processed: false,
          required: true,
        });
      }
    };

    for (const round of bracket.upper) {
      processMatches(round.matches);
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        processMatches(round.matches);
      }
    }

    if (bracket.grandfinal) {
      processMatches([bracket.grandfinal], true);
    }

    if (events.length > 0) {
      state.addCalendarEvents(events);
    }
  }
}

// Export singleton instance
export const teamSlotResolver = new TeamSlotResolver();
