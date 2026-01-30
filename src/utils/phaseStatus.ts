// Phase Status Utility
// Determines what team status to display based on the current tournament phase
//
// - Bracket stages (kickoff, playoffs): Show bracket position
// - Swiss stages (masters swiss): Show Swiss record
// - Group stages (stage1, stage2): Show tournament standings record

import type {
  SeasonPhase,
  Tournament,
  Team,
  BracketStructure,
  BracketMatch,
  BracketRound,
  Region,
} from '../types';
import { isMultiStageTournament } from '../types';

export type PhaseStatusType = 'bracket' | 'swiss' | 'league' | 'offseason';

export interface BracketPosition {
  bracketType: 'upper' | 'middle' | 'lower';
  roundNumber: number;
  roundName: string;
  isEliminated: boolean;
  isChampion: boolean;
  finalPlacement?: number;
}

export interface PhaseStatusDisplay {
  type: PhaseStatusType;
  label: string;
  sublabel: string;
  record?: {
    wins: number;
    losses: number;
    roundDiff?: number;
  };
  bracketPosition?: BracketPosition;
}

/**
 * Map phase to the tournament type we should look for
 */
function getPhaseToTournamentMapping(phase: SeasonPhase): {
  tournamentType: string | null;
  isInternational: boolean;
} {
  switch (phase) {
    case 'kickoff':
      return { tournamentType: 'kickoff', isInternational: false };
    case 'stage1':
      return { tournamentType: 'stage1', isInternational: false };
    case 'stage1_playoffs':
      return { tournamentType: 'stage1', isInternational: false }; // Stage 1 playoffs use stage1 tournament type
    case 'stage2':
      return { tournamentType: 'stage2', isInternational: false };
    case 'stage2_playoffs':
      return { tournamentType: 'stage2', isInternational: false }; // Stage 2 playoffs use stage2 tournament type
    case 'masters1':
      return { tournamentType: 'masters', isInternational: true };
    case 'masters2':
      return { tournamentType: 'masters', isInternational: true };
    case 'champions':
      return { tournamentType: 'champions', isInternational: true };
    case 'offseason':
      return { tournamentType: null, isInternational: false };
    default:
      return { tournamentType: null, isInternational: false };
  }
}

/**
 * Find the active tournament for the current phase and team
 */
function findActiveTournament(
  phase: SeasonPhase,
  teamRegion: Region,
  tournaments: Record<string, Tournament>
): Tournament | undefined {
  const mapping = getPhaseToTournamentMapping(phase);
  if (!mapping.tournamentType) return undefined;

  const allTournaments = Object.values(tournaments);

  // For international tournaments, find the one in progress
  if (mapping.isInternational) {
    return allTournaments.find(
      (t) =>
        t.type === mapping.tournamentType &&
        t.region === 'International' &&
        (t.status === 'in_progress' || t.status === 'upcoming')
    );
  }

  // For regional tournaments, find the one matching the team's region
  // Check for playoffs first (double_elim format during playoffs phases)
  if (phase === 'stage1_playoffs' || phase === 'stage2_playoffs') {
    const playoff = allTournaments.find(
      (t) =>
        t.type === mapping.tournamentType &&
        t.region === teamRegion &&
        t.format === 'double_elim' &&
        (t.status === 'in_progress' || t.status === 'upcoming')
    );
    if (playoff) return playoff;
  }

  return allTournaments.find(
    (t) =>
      t.type === mapping.tournamentType &&
      t.region === teamRegion &&
      (t.status === 'in_progress' || t.status === 'upcoming')
  );
}

/**
 * Get team's position in a bracket
 */
function getTeamBracketPosition(
  teamId: string,
  bracket: BracketStructure
): BracketPosition | null {
  // Check if team is champion
  const grandFinal = bracket.grandfinal;
  if (grandFinal?.status === 'completed' && grandFinal.winnerId === teamId) {
    return {
      bracketType: 'upper',
      roundNumber: 0,
      roundName: 'Champion',
      isEliminated: false,
      isChampion: true,
      finalPlacement: 1,
    };
  }

  // Collect all matches the team is in
  interface TeamMatchInfo {
    match: BracketMatch;
    bracketType: 'upper' | 'middle' | 'lower';
    roundNumber: number;
  }
  const teamMatches: TeamMatchInfo[] = [];

  // Helper to collect matches from a bracket
  const collectMatches = (
    rounds: BracketRound[] | undefined,
    bracketType: 'upper' | 'middle' | 'lower'
  ) => {
    if (!rounds) return;
    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.teamAId === teamId || match.teamBId === teamId) {
          teamMatches.push({
            match,
            bracketType,
            roundNumber: round.roundNumber,
          });
        }
      }
    }
  };

  // Search through all brackets
  collectMatches(bracket.upper, 'upper');
  collectMatches(bracket.middle, 'middle');
  collectMatches(bracket.lower, 'lower');

  // Check grand final
  if (grandFinal && (grandFinal.teamAId === teamId || grandFinal.teamBId === teamId)) {
    const maxRound = teamMatches.reduce((max, m) => Math.max(max, m.roundNumber), 0);
    if (grandFinal.status === 'completed') {
      if (grandFinal.loserId === teamId) {
        return {
          bracketType: 'upper',
          roundNumber: maxRound + 1,
          roundName: 'Grand Final',
          isEliminated: true,
          isChampion: false,
          finalPlacement: 2,
        };
      }
    } else {
      return {
        bracketType: 'upper',
        roundNumber: maxRound + 1,
        roundName: 'Grand Final',
        isEliminated: false,
        isChampion: false,
      };
    }
  }

  if (teamMatches.length === 0) return null;

  // Find the team's current position (latest round, prefer incomplete matches)
  // Sort: by roundNumber DESC, then by incomplete status
  teamMatches.sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) return b.roundNumber - a.roundNumber;
    // Prefer incomplete matches (status not completed)
    if (a.match.status === 'completed' && b.match.status !== 'completed') return 1;
    if (a.match.status !== 'completed' && b.match.status === 'completed') return -1;
    return 0;
  });

  const lastMatchInfo = teamMatches[0];
  const lastMatch = lastMatchInfo.match;
  const lastBracketType = lastMatchInfo.bracketType;
  const lastRoundNumber = lastMatchInfo.roundNumber;

  // Determine if eliminated
  const isEliminated =
    lastMatch.status === 'completed' && lastMatch.loserId === teamId;

  // For completed matches where team lost, check if they're truly eliminated
  // In double/triple elim, losing in upper doesn't mean eliminated
  let finalPlacement: number | undefined;
  if (isEliminated && lastMatch.loserDestination.type === 'eliminated') {
    // Team is actually eliminated
    finalPlacement = undefined;
  } else if (isEliminated && lastMatch.loserDestination.type === 'placement') {
    finalPlacement = lastMatch.loserDestination.place;
  }

  // Check if loser went to another match (not truly eliminated)
  const wentToLowerBracket =
    isEliminated &&
    lastMatch.loserDestination.type === 'match';

  // Generate round name
  const roundNames: Record<string, Record<number, string>> = {
    upper: { 1: 'Upper R1', 2: 'Upper R2', 3: 'Upper Final', 4: 'Upper Final' },
    middle: { 1: 'Beta R1', 2: 'Beta R2', 3: 'Beta Final' },
    lower: { 1: 'Lower R1', 2: 'Lower R2', 3: 'Lower R3', 4: 'Lower Final' },
  };
  const roundName =
    roundNames[lastBracketType]?.[lastRoundNumber] ||
    `${lastBracketType.charAt(0).toUpperCase() + lastBracketType.slice(1)} R${lastRoundNumber}`;

  return {
    bracketType: lastBracketType,
    roundNumber: lastRoundNumber,
    roundName,
    isEliminated: isEliminated && !wentToLowerBracket,
    isChampion: false,
    finalPlacement,
  };
}

/**
 * Get the phase-appropriate status display for a team
 */
export function getPhaseStatusDisplay(
  phase: SeasonPhase,
  playerTeamId: string,
  playerTeam: Team,
  tournaments: Record<string, Tournament>
): PhaseStatusDisplay {
  // Offseason - show career stats
  if (phase === 'offseason') {
    return {
      type: 'offseason',
      label: `${playerTeam.standings.wins}W - ${playerTeam.standings.losses}L`,
      sublabel: 'Career Record',
      record: {
        wins: playerTeam.standings.wins,
        losses: playerTeam.standings.losses,
        roundDiff: playerTeam.standings.roundDiff,
      },
    };
  }

  // Find active tournament for this phase
  const tournament = findActiveTournament(phase, playerTeam.region, tournaments);

  if (!tournament) {
    // No tournament found, show career stats
    return {
      type: 'offseason',
      label: `${playerTeam.standings.wins}W - ${playerTeam.standings.losses}L`,
      sublabel: 'Career Record',
      record: {
        wins: playerTeam.standings.wins,
        losses: playerTeam.standings.losses,
        roundDiff: playerTeam.standings.roundDiff,
      },
    };
  }

  // Check if this is a Swiss-to-playoff tournament in Swiss stage
  if (isMultiStageTournament(tournament) && tournament.currentStage === 'swiss') {
    const swissRecord = tournament.swissStage.standings.find(
      (s) => s.teamId === playerTeamId
    );
    if (swissRecord) {
      const statusLabel =
        swissRecord.status === 'qualified'
          ? 'Qualified'
          : swissRecord.status === 'eliminated'
          ? 'Eliminated'
          : `${swissRecord.wins}-${swissRecord.losses}`;

      return {
        type: 'swiss',
        label: statusLabel,
        sublabel: 'Swiss Stage',
        record: {
          wins: swissRecord.wins,
          losses: swissRecord.losses,
          roundDiff: swissRecord.roundDiff,
        },
      };
    }

    // Team might be a direct playoff qualifier (not in Swiss)
    if (tournament.playoffOnlyTeamIds?.includes(playerTeamId)) {
      return {
        type: 'swiss',
        label: 'Playoff Seed',
        sublabel: 'Awaiting Playoffs',
      };
    }
  }

  // Check if this is a bracket tournament (kickoff, playoffs, or playoff stage of masters)
  const isBracketPhase =
    phase === 'kickoff' ||
    phase === 'stage1_playoffs' ||
    phase === 'stage2_playoffs' ||
    phase === 'champions' ||
    (isMultiStageTournament(tournament) && tournament.currentStage === 'playoff');

  if (isBracketPhase) {
    const bracketPosition = getTeamBracketPosition(playerTeamId, tournament.bracket);
    if (bracketPosition) {
      let label: string;
      if (bracketPosition.isChampion) {
        label = 'Champion';
      } else if (bracketPosition.isEliminated) {
        label = bracketPosition.finalPlacement
          ? `${getOrdinal(bracketPosition.finalPlacement)} Place`
          : 'Eliminated';
      } else {
        label = bracketPosition.roundName;
      }

      return {
        type: 'bracket',
        label,
        sublabel: tournament.name,
        bracketPosition,
      };
    }
  }

  // League format (stage1, stage2) - use tournament standings
  // Check if team is in the tournament
  const isTeamInTournament = tournament.teamIds.includes(playerTeamId);

  if (isTeamInTournament) {
    // Try to find existing standings
    if (tournament.standings && tournament.standings.length > 0) {
      const teamStanding = tournament.standings.find(
        (s) => s.teamId === playerTeamId
      );
      if (teamStanding) {
        return {
          type: 'league',
          label: `${teamStanding.wins}W - ${teamStanding.losses}L`,
          sublabel: `#${teamStanding.placement || '?'} ${tournament.name}`,
          record: {
            wins: teamStanding.wins,
            losses: teamStanding.losses,
            roundDiff: teamStanding.roundDiff,
          },
        };
      }
    }

    // Tournament exists but no standings yet - show 0-0 for league tournaments
    if (tournament.format === 'round_robin' || phase === 'stage1' || phase === 'stage2') {
      return {
        type: 'league',
        label: '0W - 0L',
        sublabel: tournament.name,
        record: {
          wins: 0,
          losses: 0,
          roundDiff: 0,
        },
      };
    }
  }

  // Fallback: show career stats
  return {
    type: 'offseason',
    label: `${playerTeam.standings.wins}W - ${playerTeam.standings.losses}L`,
    sublabel: 'Career Record',
    record: {
      wins: playerTeam.standings.wins,
      losses: playerTeam.standings.losses,
      roundDiff: playerTeam.standings.roundDiff,
    },
  };
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}
