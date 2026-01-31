// BracketManager Engine
// Pure class with no React/store dependencies
// Handles bracket generation and advancement logic

import type {
  BracketStructure,
  BracketRound,
  BracketMatch,
  TeamSource,
  Destination,
  MatchResult,
  SwissStage,
  SwissRound,
  SwissTeamRecord,
} from '../../types';

/**
 * BracketManager handles all bracket generation and advancement logic.
 * All methods are pure and return new bracket structures (immutable).
 */
export class BracketManager {
  // ============================================
  // Bracket Generation
  // ============================================

  /**
   * Generate a single elimination bracket
   * @param teamIds - Array of team IDs (must be power of 2 for clean bracket)
   * @param seeding - Optional seeding order (index = seed-1, value = teamId index)
   */
  generateSingleElimination(
    teamIds: string[],
    seeding?: number[]
  ): BracketStructure {
    const numTeams = teamIds.length;
    const numRounds = Math.ceil(Math.log2(numTeams));
    const bracketSize = Math.pow(2, numRounds);

    // Create seeded order of teams
    const seededTeams = this.applySeeding(teamIds, seeding, bracketSize);

    // Generate rounds
    const upper: BracketRound[] = [];
    let matchCounter = 0;

    for (let round = 1; round <= numRounds; round++) {
      const numMatches = bracketSize / Math.pow(2, round);
      const roundId = `upper-r${round}`;
      const matches: BracketMatch[] = [];

      for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
        const matchId = `match-${++matchCounter}`;

        // Determine team sources
        let teamASource: TeamSource;
        let teamBSource: TeamSource;

        if (round === 1) {
          // First round: teams come from seeding
          const seedA = matchIdx * 2 + 1;
          const seedB = matchIdx * 2 + 2;
          teamASource = { type: 'seed', seed: seedA };
          teamBSource = { type: 'seed', seed: seedB };
        } else {
          // Later rounds: winners from previous round
          const prevMatchA = matchIdx * 2 + 1;
          const prevMatchB = matchIdx * 2 + 2;
          teamASource = {
            type: 'winner',
            matchId: `match-${this.getMatchNumber(round - 1, prevMatchA - 1, bracketSize)}`,
          };
          teamBSource = {
            type: 'winner',
            matchId: `match-${this.getMatchNumber(round - 1, prevMatchB - 1, bracketSize)}`,
          };
        }

        // Determine destinations
        let winnerDestination: Destination;
        let loserDestination: Destination;

        if (round === numRounds) {
          // Final round
          winnerDestination = { type: 'champion' };
          loserDestination = { type: 'placement', place: 2 };
        } else {
          // Winner goes to next round
          const nextMatchIdx = Math.floor(matchIdx / 2);
          const nextMatchNumber = this.getMatchNumber(round + 1, nextMatchIdx, bracketSize);
          winnerDestination = { type: 'match', matchId: `match-${nextMatchNumber}` };
          loserDestination = { type: 'eliminated' };
        }

        const match: BracketMatch = {
          matchId,
          roundId,
          teamASource,
          teamBSource,
          status: 'pending',
          winnerDestination,
          loserDestination,
        };

        // Resolve first round teams
        if (round === 1) {
          const seedA = (teamASource as { type: 'seed'; seed: number }).seed;
          const seedB = (teamBSource as { type: 'seed'; seed: number }).seed;
          match.teamAId = seededTeams[seedA - 1];
          match.teamBId = seededTeams[seedB - 1];

          // Check for byes
          if (!match.teamAId) {
            teamASource = { type: 'bye' };
            match.teamASource = teamASource;
          }
          if (!match.teamBId) {
            teamBSource = { type: 'bye' };
            match.teamBSource = teamBSource;
          }

          // Update status if both teams are present
          if (match.teamAId && match.teamBId) {
            match.status = 'ready';
          }
        }

        matches.push(match);
      }

      upper.push({
        roundId,
        roundNumber: round,
        bracketType: 'upper',
        matches,
      });
    }

    // Process byes (auto-advance teams with bye opponents)
    let bracket: BracketStructure = { format: 'single_elim', upper };
    bracket = this.processByes(bracket);

    return bracket;
  }

  /**
   * Generate a double elimination bracket
   * Upper bracket losers drop to lower bracket
   * Lower bracket losers are eliminated
   * Grand final between upper winner and lower winner
   *
   * For 8 teams:
   * Upper: R1 (4 matches) → R2 (2 matches) → R3/Final (1 match)
   * Lower: R1 (2 matches, UR1 losers) → R2 (2 matches, UR2 losers vs LR1 winners) →
   *        R3 (1 match, LR2 winners) → R4 (1 match, Upper Final loser vs LR3 winner)
   */
  generateDoubleElimination(
    teamIds: string[],
    seeding?: number[]
  ): BracketStructure {
    const numTeams = teamIds.length;
    const numUpperRounds = Math.ceil(Math.log2(numTeams));
    const bracketSize = Math.pow(2, numUpperRounds);

    // Create seeded order of teams
    const seededTeams = this.applySeeding(teamIds, seeding, bracketSize);

    // Generate upper bracket (similar to single elim)
    const upper: BracketRound[] = [];
    const lower: BracketRound[] = [];
    let matchCounter = 0;

    // Upper bracket
    for (let round = 1; round <= numUpperRounds; round++) {
      const numMatches = bracketSize / Math.pow(2, round);
      const roundId = `upper-r${round}`;
      const matches: BracketMatch[] = [];

      for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
        const matchId = `match-${++matchCounter}`;

        let teamASource: TeamSource;
        let teamBSource: TeamSource;

        if (round === 1) {
          const seedA = matchIdx * 2 + 1;
          const seedB = matchIdx * 2 + 2;
          teamASource = { type: 'seed', seed: seedA };
          teamBSource = { type: 'seed', seed: seedB };
        } else {
          teamASource = {
            type: 'winner',
            matchId: `match-${this.getMatchNumber(round - 1, matchIdx * 2, bracketSize)}`,
          };
          teamBSource = {
            type: 'winner',
            matchId: `match-${this.getMatchNumber(round - 1, matchIdx * 2 + 1, bracketSize)}`,
          };
        }

        // Winner destination (next upper bracket round or grand final)
        let winnerDestination: Destination;
        if (round === numUpperRounds) {
          winnerDestination = { type: 'match', matchId: 'grandfinal' };
        } else {
          const nextMatchNumber = this.getMatchNumber(round + 1, Math.floor(matchIdx / 2), bracketSize);
          winnerDestination = { type: 'match', matchId: `match-${nextMatchNumber}` };
        }

        // Loser destination (lower bracket)
        // For 8-team double elim:
        // - UR1 (4 matches) losers → LR1 (2 matches) at 2:1 ratio
        // - UR2 (2 matches) losers → LR2 (combined with LR1 winners)
        // - Upper Final loser → LR4 (combined with LR3 winner)
        let loserDestination: Destination;
        if (round === 1) {
          // UR1 losers → LR1 (2:1 mapping)
          const lowerMatchIdx = Math.floor(matchIdx / 2) + 1;
          loserDestination = { type: 'match', matchId: `lower-r1-m${lowerMatchIdx}` };
        } else if (round === numUpperRounds) {
          // Upper Final loser → last lower round (LR4 for 8 teams)
          const numLowerRounds = 2 * (numUpperRounds - 1);
          loserDestination = { type: 'match', matchId: `lower-r${numLowerRounds}-m1` };
        } else {
          // Middle upper rounds losers → corresponding combined lower round
          // UR2 losers → LR2 (at position matching their index)
          const lowerRound = round; // UR2 → LR2, UR3 → LR3, etc.
          loserDestination = { type: 'match', matchId: `lower-r${lowerRound}-m${matchIdx + 1}` };
        }

        const match: BracketMatch = {
          matchId,
          roundId,
          teamASource,
          teamBSource,
          status: 'pending',
          winnerDestination,
          loserDestination,
        };

        if (round === 1) {
          match.teamAId = seededTeams[(teamASource as { type: 'seed'; seed: number }).seed - 1];
          match.teamBId = seededTeams[(teamBSource as { type: 'seed'; seed: number }).seed - 1];
          if (match.teamAId && match.teamBId) {
            match.status = 'ready';
          }
        }

        matches.push(match);
      }

      upper.push({
        roundId,
        roundNumber: round,
        bracketType: 'upper',
        matches,
      });
    }

    // Lower bracket structure for standard double elimination:
    // For 8 teams (3 upper rounds):
    // - LR1: 2 matches (4 losers from UR1 paired up)
    // - LR2: 2 matches (2 losers from UR2 vs 2 winners from LR1) - combined round
    // - LR3: 1 match (2 winners from LR2 face each other) - internal round
    // - LR4: 1 match (Upper Final loser vs LR3 winner) - combined round
    const numLowerRounds = 2 * (numUpperRounds - 1);

    for (let lowerRound = 1; lowerRound <= numLowerRounds; lowerRound++) {
      const roundId = `lower-r${lowerRound}`;
      const matches: BracketMatch[] = [];

      // Calculate number of matches and structure for each lower round
      if (lowerRound === 1) {
        // LR1: Pure dropout round - UR1 losers paired up
        // 4 UR1 losers → 2 LR1 matches
        const numMatches = bracketSize / 4;

        for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
          const matchId = `lower-r1-m${matchIdx + 1}`;

          // Pair adjacent UR1 losers
          const teamASource: TeamSource = {
            type: 'loser',
            matchId: `match-${matchIdx * 2 + 1}`,
          };
          const teamBSource: TeamSource = {
            type: 'loser',
            matchId: `match-${matchIdx * 2 + 2}`,
          };

          // Winner goes to LR2
          const winnerDestination: Destination = {
            type: 'match',
            matchId: `lower-r2-m${matchIdx + 1}`,
          };

          matches.push({
            matchId,
            roundId,
            teamASource,
            teamBSource,
            status: 'pending',
            winnerDestination,
            loserDestination: { type: 'eliminated' },
          });
        }
      } else if (lowerRound % 2 === 0 && lowerRound < numLowerRounds) {
        // Even rounds (LR2, LR4 for larger brackets): Combined rounds
        // Upper bracket losers vs lower bracket winners from previous round
        // LR2: UR2 losers vs LR1 winners
        const prevLowerMatchCount = lower[lowerRound - 2].matches.length;
        const numMatches = prevLowerMatchCount;

        for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
          const matchId = `lower-r${lowerRound}-m${matchIdx + 1}`;

          // TeamA: Upper bracket loser (from round = lowerRound)
          const upperRound = lowerRound; // LR2 gets losers from UR2
          const teamASource: TeamSource = {
            type: 'loser',
            matchId: `match-${this.getMatchNumber(upperRound, matchIdx, bracketSize)}`,
          };

          // TeamB: Winner from previous lower round
          const teamBSource: TeamSource = {
            type: 'winner',
            matchId: `lower-r${lowerRound - 1}-m${matchIdx + 1}`,
          };

          // Winner goes to next lower round (LR3 for 8 teams)
          const winnerDestination: Destination = {
            type: 'match',
            matchId: `lower-r${lowerRound + 1}-m${Math.floor(matchIdx / 2) + 1}`,
          };

          matches.push({
            matchId,
            roundId,
            teamASource,
            teamBSource,
            status: 'pending',
            winnerDestination,
            loserDestination: { type: 'eliminated' },
          });
        }
      } else if (lowerRound % 2 === 1 && lowerRound > 1 && lowerRound < numLowerRounds) {
        // Odd rounds after LR1 (LR3 for 8 teams): Internal rounds
        // Winners from previous lower round face each other
        const prevLowerMatchCount = lower[lowerRound - 2].matches.length;
        const numMatches = Math.ceil(prevLowerMatchCount / 2);

        for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
          const matchId = `lower-r${lowerRound}-m${matchIdx + 1}`;

          // Both teams from previous lower round winners
          const teamASource: TeamSource = {
            type: 'winner',
            matchId: `lower-r${lowerRound - 1}-m${matchIdx * 2 + 1}`,
          };
          const teamBSource: TeamSource = {
            type: 'winner',
            matchId: `lower-r${lowerRound - 1}-m${matchIdx * 2 + 2}`,
          };

          // Winner goes to next lower round (LR4 for 8 teams)
          const winnerDestination: Destination = {
            type: 'match',
            matchId: `lower-r${lowerRound + 1}-m${matchIdx + 1}`,
          };

          matches.push({
            matchId,
            roundId,
            teamASource,
            teamBSource,
            status: 'pending',
            winnerDestination,
            loserDestination: { type: 'eliminated' },
          });
        }
      } else if (lowerRound === numLowerRounds) {
        // Final lower round (LR4 for 8 teams): Upper Final loser vs LR3 winner
        const matchId = `lower-r${lowerRound}-m1`;

        // TeamA: Upper Final loser
        const teamASource: TeamSource = {
          type: 'loser',
          matchId: `match-${matchCounter}`, // Upper Final is last match in upper
        };

        // TeamB: Winner from previous lower round (LR3)
        const teamBSource: TeamSource = {
          type: 'winner',
          matchId: `lower-r${lowerRound - 1}-m1`,
        };

        // Winner goes to Grand Final
        const winnerDestination: Destination = {
          type: 'match',
          matchId: 'grandfinal',
        };

        matches.push({
          matchId,
          roundId,
          teamASource,
          teamBSource,
          status: 'pending',
          winnerDestination,
          loserDestination: { type: 'eliminated' },
        });
      }

      lower.push({
        roundId,
        roundNumber: lowerRound,
        bracketType: 'lower',
        matches,
      });
    }

    // Grand final
    const grandfinal: BracketMatch = {
      matchId: 'grandfinal',
      roundId: 'grandfinal',
      teamASource: { type: 'winner', matchId: `match-${matchCounter}` }, // Upper bracket winner
      teamBSource: { type: 'winner', matchId: `lower-r${numLowerRounds}-m1` }, // Lower bracket winner
      status: 'pending',
      winnerDestination: { type: 'champion' },
      loserDestination: { type: 'placement', place: 2 },
    };

    let bracket: BracketStructure = { format: 'double_elim', upper, lower, grandfinal };
    bracket = this.processByes(bracket);

    return bracket;
  }

  /**
   * Generate a triple elimination bracket for VCT Kickoff format
   *
   * Structure for 12 teams (4 byes, 8 play R1):
   *
   * UPPER (Alpha - 0 losses):
   * - R1: 4 matches (seeds 5-12 play)
   * - R2: 4 matches (seeds 1-4 byes + R1 winners)
   * - R3: 2 matches
   * - Final: 1 match → winner to Grand Final
   *
   * MIDDLE (Beta - 1 loss):
   * - R1: 4 matches (UR1 + UR2 losers combined = 8 teams)
   * - R2: 2 matches (MR1 winners)
   * - R3: 2 matches (UR3 losers + MR2 winners)
   * - R4: 1 match (MR3 winners)
   * - Final: 1 match (MR4 winner + UF loser)
   *
   * LOWER (Omega - 2 losses):
   * - R1: 2 matches (MR1 losers)
   * - R2: 2 matches (MR2 losers + LR1 winners)
   * - R3: 2 matches (MR3 losers + LR2 winners)
   * - R4: 1 match (LR3 winners)
   * - R5: 1 match (MR4 loser + LR4 winner)
   * - Final: 1 match (MF loser + LR5 winner)
   *
   * Grand Final: UF winner vs LF winner
   */
  generateTripleElimination(
    teamIds: string[],
    seeding?: number[]
  ): BracketStructure {
    const numTeams = teamIds.length;

    // For 12 teams: 4 byes, 8 play R1
    // Bracket size is 16 to accommodate byes
    const bracketSize = 16;
    const numByes = bracketSize - numTeams; // 4 byes for 12 teams

    // Create seeded order of teams with byes
    const seededTeams = this.applySeeding(teamIds, seeding, bracketSize);

    const upper: BracketRound[] = [];
    const middle: BracketRound[] = [];
    const lower: BracketRound[] = [];

    // ============================================
    // UPPER BRACKET (Alpha) - 0 losses
    // ============================================

    // Upper R1: 4 matches (seeds 5-12, non-bye teams)
    const ur1Matches: BracketMatch[] = [];
    for (let i = 0; i < 4; i++) {
      const seedA = numByes + i * 2 + 1; // Seeds 5, 7, 9, 11
      const seedB = numByes + i * 2 + 2; // Seeds 6, 8, 10, 12
      ur1Matches.push({
        matchId: `ur1-m${i + 1}`,
        roundId: 'upper-r1',
        teamASource: { type: 'seed', seed: seedA },
        teamBSource: { type: 'seed', seed: seedB },
        teamAId: seededTeams[seedA - 1],
        teamBId: seededTeams[seedB - 1],
        status: seededTeams[seedA - 1] && seededTeams[seedB - 1] ? 'ready' : 'pending',
        winnerDestination: { type: 'match', matchId: `ur2-m${i + 1}` },
        loserDestination: { type: 'match', matchId: `mr1-m${i + 1}` }, // UR1 losers → MR1
      });
    }
    upper.push({ roundId: 'upper-r1', roundNumber: 1, bracketType: 'upper', matches: ur1Matches });

    // Upper R2: 4 matches (bye teams 1-4 vs UR1 winners)
    const ur2Matches: BracketMatch[] = [];
    for (let i = 0; i < 4; i++) {
      const byeSeed = i + 1; // Seeds 1, 2, 3, 4 (bye teams)
      ur2Matches.push({
        matchId: `ur2-m${i + 1}`,
        roundId: 'upper-r2',
        teamASource: { type: 'seed', seed: byeSeed },
        teamBSource: { type: 'winner', matchId: `ur1-m${i + 1}` },
        teamAId: seededTeams[byeSeed - 1], // Bye team already known
        status: 'pending',
        winnerDestination: { type: 'match', matchId: `ur3-m${Math.floor(i / 2) + 1}` },
        loserDestination: { type: 'match', matchId: `mr1-m${i + 1}` }, // UR2 losers → MR1 (teamB slot)
      });
    }
    upper.push({ roundId: 'upper-r2', roundNumber: 2, bracketType: 'upper', matches: ur2Matches });

    // Upper R3: 2 matches (UR2 winners)
    const ur3Matches: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      ur3Matches.push({
        matchId: `ur3-m${i + 1}`,
        roundId: 'upper-r3',
        teamASource: { type: 'winner', matchId: `ur2-m${i * 2 + 1}` },
        teamBSource: { type: 'winner', matchId: `ur2-m${i * 2 + 2}` },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: 'upper-final' },
        loserDestination: { type: 'match', matchId: `mr3-m${i + 1}` }, // UR3 losers → MR3
      });
    }
    upper.push({ roundId: 'upper-r3', roundNumber: 3, bracketType: 'upper', matches: ur3Matches });

    // Upper Final: 1 match - Winner = Alpha Qualifier
    upper.push({
      roundId: 'upper-final',
      roundNumber: 4,
      bracketType: 'upper',
      matches: [{
        matchId: 'upper-final',
        roundId: 'upper-final',
        teamASource: { type: 'winner', matchId: 'ur3-m1' },
        teamBSource: { type: 'winner', matchId: 'ur3-m2' },
        status: 'pending',
        winnerDestination: { type: 'placement', place: 1 }, // Alpha winner = Masters qualifier
        loserDestination: { type: 'match', matchId: 'middle-final' }, // UF loser → MF
      }],
    });

    // ============================================
    // MIDDLE BRACKET (Beta) - 1 loss
    // ============================================

    // Middle R1: 4 matches (UR1 losers 1-4 + UR2 losers 5-8 = 8 teams)
    const mr1Matches: BracketMatch[] = [];
    for (let i = 0; i < 4; i++) {
      mr1Matches.push({
        matchId: `mr1-m${i + 1}`,
        roundId: 'middle-r1',
        teamASource: { type: 'loser', matchId: `ur1-m${i + 1}` }, // UR1 loser
        teamBSource: { type: 'loser', matchId: `ur2-m${i + 1}` }, // UR2 loser
        status: 'pending',
        winnerDestination: { type: 'match', matchId: `mr2-m${Math.floor(i / 2) + 1}` },
        loserDestination: { type: 'match', matchId: `lr1-m${Math.floor(i / 2) + 1}` }, // MR1 losers → LR1
      });
    }
    middle.push({ roundId: 'middle-r1', roundNumber: 1, bracketType: 'middle', matches: mr1Matches });

    // Middle R2: 2 matches (MR1 winners)
    const mr2Matches: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      mr2Matches.push({
        matchId: `mr2-m${i + 1}`,
        roundId: 'middle-r2',
        teamASource: { type: 'winner', matchId: `mr1-m${i * 2 + 1}` },
        teamBSource: { type: 'winner', matchId: `mr1-m${i * 2 + 2}` },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: `mr3-m${i + 1}` },
        loserDestination: { type: 'match', matchId: `lr2-m${i + 1}` }, // MR2 losers → LR2
      });
    }
    middle.push({ roundId: 'middle-r2', roundNumber: 2, bracketType: 'middle', matches: mr2Matches });

    // Middle R3: 2 matches (UR3 losers + MR2 winners)
    const mr3Matches: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      mr3Matches.push({
        matchId: `mr3-m${i + 1}`,
        roundId: 'middle-r3',
        teamASource: { type: 'loser', matchId: `ur3-m${i + 1}` }, // UR3 loser
        teamBSource: { type: 'winner', matchId: `mr2-m${i + 1}` }, // MR2 winner
        status: 'pending',
        winnerDestination: { type: 'match', matchId: 'mr4' },
        loserDestination: { type: 'match', matchId: `lr3-m${i + 1}` }, // MR3 losers → LR3
      });
    }
    middle.push({ roundId: 'middle-r3', roundNumber: 3, bracketType: 'middle', matches: mr3Matches });

    // Middle R4: 1 match (MR3 winners)
    middle.push({
      roundId: 'middle-r4',
      roundNumber: 4,
      bracketType: 'middle',
      matches: [{
        matchId: 'mr4',
        roundId: 'middle-r4',
        teamASource: { type: 'winner', matchId: 'mr3-m1' },
        teamBSource: { type: 'winner', matchId: 'mr3-m2' },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: 'middle-final' },
        loserDestination: { type: 'match', matchId: 'lr5' }, // MR4 loser → LR5
      }],
    });

    // Middle Final: 1 match (MR4 winner + UF loser) - Winner = Beta Qualifier
    middle.push({
      roundId: 'middle-final',
      roundNumber: 5,
      bracketType: 'middle',
      matches: [{
        matchId: 'middle-final',
        roundId: 'middle-final',
        teamASource: { type: 'winner', matchId: 'mr4' },
        teamBSource: { type: 'loser', matchId: 'upper-final' },
        status: 'pending',
        winnerDestination: { type: 'placement', place: 2 }, // Beta winner = Masters qualifier
        loserDestination: { type: 'match', matchId: 'lower-final' }, // MF loser → LF
      }],
    });

    // ============================================
    // LOWER BRACKET (Omega) - 2 losses
    // ============================================

    // Lower R1: 2 matches (MR1 losers, 4 teams)
    const lr1Matches: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      lr1Matches.push({
        matchId: `lr1-m${i + 1}`,
        roundId: 'lower-r1',
        teamASource: { type: 'loser', matchId: `mr1-m${i * 2 + 1}` },
        teamBSource: { type: 'loser', matchId: `mr1-m${i * 2 + 2}` },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: `lr2-m${i + 1}` },
        loserDestination: { type: 'eliminated' },
      });
    }
    lower.push({ roundId: 'lower-r1', roundNumber: 1, bracketType: 'lower', matches: lr1Matches });

    // Lower R2: 2 matches (MR2 losers + LR1 winners)
    const lr2Matches: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      lr2Matches.push({
        matchId: `lr2-m${i + 1}`,
        roundId: 'lower-r2',
        teamASource: { type: 'loser', matchId: `mr2-m${i + 1}` },
        teamBSource: { type: 'winner', matchId: `lr1-m${i + 1}` },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: `lr3-m${i + 1}` },
        loserDestination: { type: 'eliminated' },
      });
    }
    lower.push({ roundId: 'lower-r2', roundNumber: 2, bracketType: 'lower', matches: lr2Matches });

    // Lower R3: 2 matches (MR3 losers + LR2 winners)
    const lr3Matches: BracketMatch[] = [];
    for (let i = 0; i < 2; i++) {
      lr3Matches.push({
        matchId: `lr3-m${i + 1}`,
        roundId: 'lower-r3',
        teamASource: { type: 'loser', matchId: `mr3-m${i + 1}` },
        teamBSource: { type: 'winner', matchId: `lr2-m${i + 1}` },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: 'lr4' },
        loserDestination: { type: 'eliminated' },
      });
    }
    lower.push({ roundId: 'lower-r3', roundNumber: 3, bracketType: 'lower', matches: lr3Matches });

    // Lower R4: 1 match (LR3 winners)
    lower.push({
      roundId: 'lower-r4',
      roundNumber: 4,
      bracketType: 'lower',
      matches: [{
        matchId: 'lr4',
        roundId: 'lower-r4',
        teamASource: { type: 'winner', matchId: 'lr3-m1' },
        teamBSource: { type: 'winner', matchId: 'lr3-m2' },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: 'lr5' },
        loserDestination: { type: 'eliminated' },
      }],
    });

    // Lower R5: 1 match (MR4 loser + LR4 winner)
    lower.push({
      roundId: 'lower-r5',
      roundNumber: 5,
      bracketType: 'lower',
      matches: [{
        matchId: 'lr5',
        roundId: 'lower-r5',
        teamASource: { type: 'loser', matchId: 'mr4' },
        teamBSource: { type: 'winner', matchId: 'lr4' },
        status: 'pending',
        winnerDestination: { type: 'match', matchId: 'lower-final' },
        loserDestination: { type: 'eliminated' },
      }],
    });

    // Lower Final: 1 match (MF loser + LR5 winner) - Winner = Omega Qualifier
    lower.push({
      roundId: 'lower-final',
      roundNumber: 6,
      bracketType: 'lower',
      matches: [{
        matchId: 'lower-final',
        roundId: 'lower-final',
        teamASource: { type: 'loser', matchId: 'middle-final' },
        teamBSource: { type: 'winner', matchId: 'lr5' },
        status: 'pending',
        winnerDestination: { type: 'placement', place: 3 }, // Omega winner = Masters qualifier
        loserDestination: { type: 'placement', place: 4 }, // 4th place
      }],
    });

    // No Grand Final in Kickoff - 3 bracket winners qualify for Masters
    const bracket: BracketStructure = { format: 'triple_elim', upper, middle, lower };

    // No need to process byes - bye teams are already set in UR2
    return this.updateMatchStatuses(bracket);
  }

  /**
   * Generate a round robin bracket
   * Each team plays every other team once
   */
  generateRoundRobin(
    teamIds: string[],
    groups?: number
  ): BracketStructure {
    const numTeams = teamIds.length;
    const numGroups = groups || 1;
    const teamsPerGroup = Math.ceil(numTeams / numGroups);

    const upper: BracketRound[] = [];
    let matchCounter = 0;

    // Split teams into groups
    const groupedTeams: string[][] = [];
    for (let g = 0; g < numGroups; g++) {
      groupedTeams.push(teamIds.slice(g * teamsPerGroup, (g + 1) * teamsPerGroup));
    }

    // Generate matches for each group
    for (let g = 0; g < numGroups; g++) {
      const groupTeams = groupedTeams[g];
      const roundId = `group-${g + 1}`;

      const matches: BracketMatch[] = [];

      // Round-robin scheduling
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          matches.push({
            matchId: `match-${++matchCounter}`,
            roundId,
            teamASource: { type: 'seed', seed: i + 1 },
            teamBSource: { type: 'seed', seed: j + 1 },
            teamAId: groupTeams[i],
            teamBId: groupTeams[j],
            status: 'ready',
            winnerDestination: { type: 'placement', place: 0 }, // Determined by standings
            loserDestination: { type: 'placement', place: 0 },
          });
        }
      }

      upper.push({
        roundId,
        roundNumber: g + 1,
        bracketType: 'upper',
        matches,
      });
    }

    return { format: 'round_robin', upper };
  }

  // ============================================
  // Bracket Advancement
  // ============================================

  /**
   * Complete a match and advance the bracket
   * Returns a new bracket structure with the result applied
   */
  completeMatch(
    bracket: BracketStructure,
    matchId: string,
    winnerId: string,
    loserId: string,
    result: MatchResult
  ): BracketStructure {
    console.log(`Completing bracket match ${matchId}, winner: ${winnerId}, loser: ${loserId}`);

    // Find and update the match
    let newBracket = this.updateMatchResult(bracket, matchId, winnerId, loserId, result);

    const completedMatch = this.findMatch(newBracket, matchId);
    if (completedMatch) {
      console.log(`  Winner destination:`, completedMatch.winnerDestination);
      console.log(`  Loser destination:`, completedMatch.loserDestination);
    }

    // Propagate winner to next match
    newBracket = this.propagateWinner(newBracket, matchId, winnerId);

    // Propagate loser (for double/triple elim)
    newBracket = this.propagateLoser(newBracket, matchId, loserId);

    // Update match statuses
    newBracket = this.updateMatchStatuses(newBracket);

    // Log ready matches after update
    const readyMatches = this.getReadyMatches(newBracket);
    console.log(`  Ready matches after completion:`, readyMatches.map(m => m.matchId));

    return newBracket;
  }

  // ============================================
  // Bracket Queries
  // ============================================

  /**
   * Get all matches that are ready to be played
   */
  getReadyMatches(bracket: BracketStructure): BracketMatch[] {
    const readyMatches: BracketMatch[] = [];

    const collectReady = (rounds: BracketRound[] | undefined) => {
      if (!rounds) return;
      for (const round of rounds) {
        for (const match of round.matches) {
          if (match.status === 'ready') {
            readyMatches.push(match);
          }
        }
      }
    };

    collectReady(bracket.upper);
    collectReady(bracket.middle);
    collectReady(bracket.lower);

    if (bracket.grandfinal?.status === 'ready') {
      readyMatches.push(bracket.grandfinal);
    }

    return readyMatches;
  }

  /**
   * Get the next match to be played
   */
  getNextMatch(bracket: BracketStructure): BracketMatch | null {
    const ready = this.getReadyMatches(bracket);
    return ready[0] || null;
  }

  /**
   * Get bracket status
   */
  getBracketStatus(bracket: BracketStructure): 'not_started' | 'in_progress' | 'completed' {
    let hasCompleted = false;
    let hasPending = false;
    let hasReady = false;

    const checkRounds = (rounds: BracketRound[] | undefined) => {
      if (!rounds) return;
      for (const round of rounds) {
        for (const match of round.matches) {
          if (match.status === 'completed') hasCompleted = true;
          if (match.status === 'pending') hasPending = true;
          if (match.status === 'ready') hasReady = true;
        }
      }
    };

    checkRounds(bracket.upper);
    checkRounds(bracket.middle);
    checkRounds(bracket.lower);

    if (bracket.grandfinal) {
      if (bracket.grandfinal.status === 'completed') hasCompleted = true;
      if (bracket.grandfinal.status === 'pending') hasPending = true;
      if (bracket.grandfinal.status === 'ready') hasReady = true;
    }

    // Check if grand final is completed (for double elim with grand final)
    if (bracket.grandfinal?.status === 'completed') {
      return 'completed';
    }

    // For round-robin: ALL matches must be completed
    if (bracket.format === 'round_robin') {
      // Round-robin is complete only when all matches are done (no pending or ready)
      if (hasCompleted && !hasPending && !hasReady) {
        return 'completed';
      }
      if (!hasCompleted && !hasReady && hasPending) {
        return 'not_started';
      }
      return 'in_progress';
    }

    // Check if last upper bracket match is completed (for single elim)
    if (bracket.format === 'single_elim') {
      const lastRound = bracket.upper[bracket.upper.length - 1];
      if (lastRound?.matches[0]?.status === 'completed') {
        return 'completed';
      }
    }

    // For triple elim (no grand final): check if all 3 finals are completed
    if (bracket.format === 'triple_elim') {
      const upperFinal = bracket.upper[bracket.upper.length - 1]?.matches[0];
      const middleFinal = bracket.middle?.[bracket.middle.length - 1]?.matches[0];
      const lowerFinal = bracket.lower?.[bracket.lower.length - 1]?.matches[0];

      if (
        upperFinal?.status === 'completed' &&
        middleFinal?.status === 'completed' &&
        lowerFinal?.status === 'completed'
      ) {
        return 'completed';
      }
    }

    if (!hasCompleted && !hasReady && hasPending) {
      return 'not_started';
    }

    return 'in_progress';
  }

  /**
   * Get the champion team ID
   * For triple elim without grand final, returns Alpha bracket winner
   * For round-robin, returns null (no champion - placements are by standings)
   */
  getChampion(bracket: BracketStructure): string | null {
    // Check grand final first
    if (bracket.grandfinal?.status === 'completed') {
      return bracket.grandfinal.winnerId || null;
    }

    // Round-robin leagues don't have a single champion - placements are by standings
    if (bracket.format === 'round_robin') {
      return null;
    }

    // For single elimination, check last upper bracket round
    if (bracket.format === 'single_elim') {
      const lastRound = bracket.upper[bracket.upper.length - 1];
      if (lastRound?.matches[0]?.status === 'completed') {
        return lastRound.matches[0].winnerId || null;
      }
    }

    // For triple elim without grand final, return Alpha (upper) bracket winner
    if (bracket.format === 'triple_elim') {
      const upperFinal = bracket.upper[bracket.upper.length - 1]?.matches[0];
      if (upperFinal?.status === 'completed') {
        return upperFinal.winnerId || null;
      }
    }

    return null;
  }

  /**
   * Get all qualifiers from a triple elimination bracket
   * Returns winners of Alpha, Beta, and Omega brackets
   */
  getQualifiers(bracket: BracketStructure): { alpha?: string; beta?: string; omega?: string } {
    const qualifiers: { alpha?: string; beta?: string; omega?: string } = {};

    // Alpha winner (Upper Final)
    const upperFinal = bracket.upper[bracket.upper.length - 1]?.matches[0];
    if (upperFinal?.status === 'completed' && upperFinal.winnerId) {
      qualifiers.alpha = upperFinal.winnerId;
    }

    // Beta winner (Middle Final)
    if (bracket.middle) {
      const middleFinal = bracket.middle[bracket.middle.length - 1]?.matches[0];
      if (middleFinal?.status === 'completed' && middleFinal.winnerId) {
        qualifiers.beta = middleFinal.winnerId;
      }
    }

    // Omega winner (Lower Final)
    if (bracket.lower) {
      const lowerFinal = bracket.lower[bracket.lower.length - 1]?.matches[0];
      if (lowerFinal?.status === 'completed' && lowerFinal.winnerId) {
        qualifiers.omega = lowerFinal.winnerId;
      }
    }

    return qualifiers;
  }

  /**
   * Get final placements for all teams
   */
  getFinalPlacements(bracket: BracketStructure): Record<number, string> {
    const placements: Record<number, string> = {};

    const champion = this.getChampion(bracket);
    if (champion) {
      placements[1] = champion;
    }

    // Process matches to find placements
    const processMatch = (match: BracketMatch) => {
      if (match.status !== 'completed' || !match.loserId) return;

      if (match.loserDestination.type === 'placement') {
        placements[match.loserDestination.place] = match.loserId;
      }

      // Second place from grand final/final
      if (match.winnerId && match.winnerDestination.type === 'champion') {
        placements[2] = match.loserId;
      }
    };

    // Process all matches
    bracket.upper.forEach((round) => round.matches.forEach(processMatch));
    bracket.lower?.forEach((round) => round.matches.forEach(processMatch));
    if (bracket.grandfinal) processMatch(bracket.grandfinal);

    return placements;
  }

  // ============================================
  // Swiss Stage Methods
  // ============================================

  /**
   * Initialize a Swiss stage with teams and configuration
   * Creates initial standings and Round 1 matches with cross-regional pairings
   *
   * @param teamIds - Array of team IDs (8 teams for Masters Swiss)
   * @param teamRegions - Map of teamId -> region for cross-regional pairing
   * @param config - Swiss stage configuration
   */
  initializeSwissStage(
    teamIds: string[],
    teamRegions: Map<string, string>,
    config: {
      totalRounds: number;      // 3 for Masters
      winsToQualify: number;    // 2 for Masters
      lossesToEliminate: number; // 2 for Masters
      tournamentId: string;
    }
  ): SwissStage {
    // Initialize standings for all teams
    const standings: SwissTeamRecord[] = teamIds.map((teamId, index) => ({
      teamId,
      wins: 0,
      losses: 0,
      roundDiff: 0,
      opponentIds: [],
      status: 'active' as const,
      seed: index + 1,
    }));

    // Generate Round 1 pairings (cross-regional)
    const round1Matches = this.generateSwissRound1Pairings(
      teamIds,
      teamRegions,
      config.tournamentId
    );

    const round1: SwissRound = {
      roundNumber: 1,
      matches: round1Matches,
      completed: false,
    };

    return {
      rounds: [round1],
      standings,
      qualifiedTeamIds: [],
      eliminatedTeamIds: [],
      currentRound: 1,
      totalRounds: config.totalRounds,
      winsToQualify: config.winsToQualify,
      lossesToEliminate: config.lossesToEliminate,
    };
  }

  /**
   * Generate Round 1 Swiss pairings with cross-regional matchups
   * Pairs 2nd place finishers vs 3rd place finishers from different regions
   *
   * For 8 teams (2 per region): Pair teams from different regions
   * Example: Americas-2nd vs EMEA-3rd, EMEA-2nd vs Pacific-3rd, etc.
   */
  generateSwissRound1Pairings(
    teamIds: string[],
    teamRegions: Map<string, string>,
    tournamentId: string
  ): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const usedTeams = new Set<string>();

    // Group teams by region
    const teamsByRegion = new Map<string, string[]>();
    for (const teamId of teamIds) {
      const region = teamRegions.get(teamId) || 'Unknown';
      if (!teamsByRegion.has(region)) {
        teamsByRegion.set(region, []);
      }
      teamsByRegion.get(region)!.push(teamId);
    }

    // Create cross-regional pairings
    // For each region's teams, try to pair with teams from different regions
    let matchIndex = 0;

    for (let i = 0; i < teamIds.length; i++) {
      const teamA = teamIds[i];
      if (usedTeams.has(teamA)) continue;

      const teamARegion = teamRegions.get(teamA);

      // Find opponent from different region
      for (let j = i + 1; j < teamIds.length; j++) {
        const teamB = teamIds[j];
        if (usedTeams.has(teamB)) continue;

        const teamBRegion = teamRegions.get(teamB);

        // Prefer cross-regional matchup
        if (teamARegion !== teamBRegion) {
          usedTeams.add(teamA);
          usedTeams.add(teamB);

          const match: BracketMatch = {
            matchId: `${tournamentId}-swiss-r1-m${++matchIndex}`,
            roundId: `${tournamentId}-swiss-r1`,
            teamASource: { type: 'seed', seed: i + 1 },
            teamBSource: { type: 'seed', seed: j + 1 },
            teamAId: teamA,
            teamBId: teamB,
            status: 'ready',
            winnerDestination: { type: 'placement', place: 0 }, // Determined by Swiss standings
            loserDestination: { type: 'placement', place: 0 },
          };

          matches.push(match);
          break;
        }
      }
    }

    // Handle any remaining teams that couldn't get cross-regional matchups
    const remainingTeams = teamIds.filter(t => !usedTeams.has(t));
    for (let i = 0; i < remainingTeams.length; i += 2) {
      if (i + 1 < remainingTeams.length) {
        const match: BracketMatch = {
          matchId: `${tournamentId}-swiss-r1-m${++matchIndex}`,
          roundId: `${tournamentId}-swiss-r1`,
          teamASource: { type: 'seed', seed: teamIds.indexOf(remainingTeams[i]) + 1 },
          teamBSource: { type: 'seed', seed: teamIds.indexOf(remainingTeams[i + 1]) + 1 },
          teamAId: remainingTeams[i],
          teamBId: remainingTeams[i + 1],
          status: 'ready',
          winnerDestination: { type: 'placement', place: 0 },
          loserDestination: { type: 'placement', place: 0 },
        };
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Generate the next Swiss round based on current standings
   * Pairs teams by win-loss record, avoiding rematches
   *
   * Pairing algorithm:
   * 1. Group active teams by record (e.g., 1-0, 0-1, 1-1)
   * 2. Within each group, pair by seed (highest vs lowest)
   * 3. Avoid repeat matchups
   * 4. If uneven groups, pull from adjacent group
   */
  generateNextSwissRound(
    stage: SwissStage,
    tournamentId: string
  ): SwissStage {
    const nextRoundNumber = stage.currentRound + 1;
    if (nextRoundNumber > stage.totalRounds) {
      return stage; // No more rounds
    }

    // Get active teams (not qualified or eliminated)
    const activeTeams = stage.standings.filter(t => t.status === 'active');

    if (activeTeams.length < 2) {
      return stage; // Not enough teams for matches
    }

    // Group teams by record
    const teamsByRecord = new Map<string, SwissTeamRecord[]>();
    for (const team of activeTeams) {
      const record = `${team.wins}-${team.losses}`;
      if (!teamsByRecord.has(record)) {
        teamsByRecord.set(record, []);
      }
      teamsByRecord.get(record)!.push(team);
    }

    // Sort records by wins descending, losses ascending
    const sortedRecords = Array.from(teamsByRecord.keys()).sort((a, b) => {
      const [winsA, lossesA] = a.split('-').map(Number);
      const [winsB, lossesB] = b.split('-').map(Number);
      if (winsB !== winsA) return winsB - winsA;
      return lossesA - lossesB;
    });

    const matches: BracketMatch[] = [];
    const pairedTeams = new Set<string>();
    let matchIndex = 0;

    // Process each record group
    for (const record of sortedRecords) {
      const teamsInGroup = teamsByRecord.get(record)!
        .filter(t => !pairedTeams.has(t.teamId))
        .sort((a, b) => (a.seed || 999) - (b.seed || 999)); // Sort by seed

      // Try to pair within group
      const unpaired: SwissTeamRecord[] = [];

      for (let i = 0; i < teamsInGroup.length; i++) {
        const teamA = teamsInGroup[i];
        if (pairedTeams.has(teamA.teamId)) continue;

        let paired = false;
        // Try to find opponent (prefer lower seed from same group)
        for (let j = teamsInGroup.length - 1; j > i; j--) {
          const teamB = teamsInGroup[j];
          if (pairedTeams.has(teamB.teamId)) continue;

          // Check for rematch
          if (teamA.opponentIds.includes(teamB.teamId)) continue;

          // Create match
          pairedTeams.add(teamA.teamId);
          pairedTeams.add(teamB.teamId);

          matches.push({
            matchId: `${tournamentId}-swiss-r${nextRoundNumber}-m${++matchIndex}`,
            roundId: `${tournamentId}-swiss-r${nextRoundNumber}`,
            teamASource: { type: 'seed', seed: teamA.seed || 1 },
            teamBSource: { type: 'seed', seed: teamB.seed || 2 },
            teamAId: teamA.teamId,
            teamBId: teamB.teamId,
            status: 'ready',
            winnerDestination: { type: 'placement', place: 0 },
            loserDestination: { type: 'placement', place: 0 },
          });

          paired = true;
          break;
        }

        if (!paired) {
          unpaired.push(teamA);
        }
      }

      // Add unpaired teams back to be handled in cross-group pairing
      for (const team of unpaired) {
        if (!pairedTeams.has(team.teamId)) {
          // Will be handled in next iteration or final cleanup
        }
      }
    }

    // Handle any remaining unpaired teams (cross-group pairing)
    const remainingTeams = activeTeams
      .filter(t => !pairedTeams.has(t.teamId))
      .sort((a, b) => (a.seed || 999) - (b.seed || 999));

    for (let i = 0; i < remainingTeams.length; i += 2) {
      if (i + 1 >= remainingTeams.length) break;

      const teamA = remainingTeams[i];
      let teamB = remainingTeams[i + 1];

      // Check for rematch and try to find alternative
      if (teamA.opponentIds.includes(teamB.teamId)) {
        for (let j = i + 2; j < remainingTeams.length; j++) {
          if (!teamA.opponentIds.includes(remainingTeams[j].teamId)) {
            teamB = remainingTeams[j];
            remainingTeams.splice(j, 1);
            remainingTeams.splice(i + 1, 0, teamB);
            break;
          }
        }
      }

      pairedTeams.add(teamA.teamId);
      pairedTeams.add(teamB.teamId);

      matches.push({
        matchId: `${tournamentId}-swiss-r${nextRoundNumber}-m${++matchIndex}`,
        roundId: `${tournamentId}-swiss-r${nextRoundNumber}`,
        teamASource: { type: 'seed', seed: teamA.seed || 1 },
        teamBSource: { type: 'seed', seed: teamB.seed || 2 },
        teamAId: teamA.teamId,
        teamBId: teamB.teamId,
        status: 'ready',
        winnerDestination: { type: 'placement', place: 0 },
        loserDestination: { type: 'placement', place: 0 },
      });
    }

    const newRound: SwissRound = {
      roundNumber: nextRoundNumber,
      matches,
      completed: false,
    };

    return {
      ...stage,
      rounds: [...stage.rounds, newRound],
      currentRound: nextRoundNumber,
    };
  }

  /**
   * Complete a Swiss match and update standings
   * Checks for qualification (winsToQualify) or elimination (lossesToEliminate)
   */
  completeSwissMatch(
    stage: SwissStage,
    matchId: string,
    result: MatchResult
  ): SwissStage {
    // Deep clone to avoid mutations
    const newStage: SwissStage = JSON.parse(JSON.stringify(stage));

    // Find and update the match
    let matchFound = false;
    for (const round of newStage.rounds) {
      for (const match of round.matches) {
        if (match.matchId === matchId) {
          match.winnerId = result.winnerId;
          match.loserId = result.loserId;
          match.result = result;
          match.status = 'completed';
          matchFound = true;
          break;
        }
      }
      if (matchFound) break;
    }

    if (!matchFound) {
      console.error(`Swiss match not found: ${matchId}`);
      return stage;
    }

    // Update standings
    const winnerRecord = newStage.standings.find(s => s.teamId === result.winnerId);
    const loserRecord = newStage.standings.find(s => s.teamId === result.loserId);

    if (winnerRecord) {
      winnerRecord.wins++;
      winnerRecord.roundDiff += (result.scoreTeamA > result.scoreTeamB)
        ? (result.scoreTeamA - result.scoreTeamB)
        : (result.scoreTeamB - result.scoreTeamA);
      winnerRecord.opponentIds.push(result.loserId);

      // Check qualification
      if (winnerRecord.wins >= newStage.winsToQualify) {
        winnerRecord.status = 'qualified';
        newStage.qualifiedTeamIds.push(winnerRecord.teamId);
      }
    }

    if (loserRecord) {
      loserRecord.losses++;
      loserRecord.roundDiff -= (result.scoreTeamA > result.scoreTeamB)
        ? (result.scoreTeamA - result.scoreTeamB)
        : (result.scoreTeamB - result.scoreTeamA);
      loserRecord.opponentIds.push(result.winnerId);

      // Check elimination
      if (loserRecord.losses >= newStage.lossesToEliminate) {
        loserRecord.status = 'eliminated';
        newStage.eliminatedTeamIds.push(loserRecord.teamId);
      }
    }

    // Check if current round is complete
    const currentRound = newStage.rounds.find(r => r.roundNumber === newStage.currentRound);
    if (currentRound) {
      const allMatchesComplete = currentRound.matches.every(m => m.status === 'completed');
      if (allMatchesComplete) {
        currentRound.completed = true;
      }
    }

    return newStage;
  }

  /**
   * Check if the Swiss stage is complete
   * Complete when all teams are either qualified or eliminated
   */
  isSwissStageComplete(stage: SwissStage): boolean {
    const activeTeams = stage.standings.filter(t => t.status === 'active');
    return activeTeams.length === 0;
  }

  /**
   * Check if the current Swiss round is complete
   */
  isSwissRoundComplete(stage: SwissStage): boolean {
    const currentRound = stage.rounds.find(r => r.roundNumber === stage.currentRound);
    if (!currentRound) return true;
    return currentRound.completed;
  }

  /**
   * Get sorted Swiss standings
   * Sorted by: wins (desc), losses (asc), roundDiff (desc), seed (asc)
   */
  getSwissStandings(stage: SwissStage): SwissTeamRecord[] {
    return [...stage.standings].sort((a, b) => {
      // First by wins (descending)
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by losses (ascending)
      if (a.losses !== b.losses) return a.losses - b.losses;
      // Then by round diff (descending)
      if (b.roundDiff !== a.roundDiff) return b.roundDiff - a.roundDiff;
      // Finally by seed (ascending)
      return (a.seed || 999) - (b.seed || 999);
    });
  }

  /**
   * Get qualified teams from Swiss stage (teams that won winsToQualify matches)
   */
  getSwissQualifiedTeams(stage: SwissStage): string[] {
    return stage.qualifiedTeamIds;
  }

  /**
   * Get eliminated teams from Swiss stage (teams that lost lossesToEliminate matches)
   */
  getSwissEliminatedTeams(stage: SwissStage): string[] {
    return stage.eliminatedTeamIds;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Apply seeding to create ordered team array with byes
   */
  private applySeeding(
    teamIds: string[],
    seeding: number[] | undefined,
    bracketSize: number
  ): (string | undefined)[] {
    const result: (string | undefined)[] = new Array(bracketSize).fill(undefined);

    if (seeding && seeding.length === teamIds.length) {
      // Apply custom seeding
      for (let i = 0; i < seeding.length; i++) {
        result[seeding[i] - 1] = teamIds[i];
      }
    } else {
      // Default seeding (1-N in order)
      for (let i = 0; i < teamIds.length; i++) {
        result[i] = teamIds[i];
      }
    }

    return result;
  }

  /**
   * Calculate match number based on round and position
   */
  private getMatchNumber(round: number, position: number, bracketSize: number): number {
    let matchNum = 0;

    // Count matches in all previous rounds
    for (let r = 1; r < round; r++) {
      matchNum += bracketSize / Math.pow(2, r);
    }

    // Add position in current round
    return matchNum + position + 1;
  }


  /**
   * Process byes (auto-advance teams with bye opponents)
   */
  private processByes(bracket: BracketStructure): BracketStructure {
    const newBracket = JSON.parse(JSON.stringify(bracket)) as BracketStructure;

    // Process first round byes
    const firstRound = newBracket.upper[0];
    if (!firstRound) return newBracket;

    for (const match of firstRound.matches) {
      const hasByeA = match.teamASource.type === 'bye' || !match.teamAId;
      const hasByeB = match.teamBSource.type === 'bye' || !match.teamBId;

      if (hasByeA && hasByeB) {
        // Both byes - match is complete with no winner
        match.status = 'completed';
      } else if (hasByeA && match.teamBId) {
        // Team B auto-advances
        match.winnerId = match.teamBId;
        match.status = 'completed';
      } else if (hasByeB && match.teamAId) {
        // Team A auto-advances
        match.winnerId = match.teamAId;
        match.status = 'completed';
      }
    }

    // Propagate bye winners
    for (const match of firstRound.matches) {
      if (match.status === 'completed' && match.winnerId) {
        this.propagateTeamToDestination(
          newBracket,
          match.winnerId,
          match.winnerDestination,
          match.matchId,
          'winner'
        );
      }
    }

    // Update statuses
    return this.updateMatchStatuses(newBracket);
  }

  /**
   * Update a match with the result
   */
  private updateMatchResult(
    bracket: BracketStructure,
    matchId: string,
    winnerId: string,
    loserId: string,
    result: MatchResult
  ): BracketStructure {
    const newBracket = JSON.parse(JSON.stringify(bracket)) as BracketStructure;

    const updateMatch = (match: BracketMatch): boolean => {
      if (match.matchId === matchId) {
        match.winnerId = winnerId;
        match.loserId = loserId;
        match.result = result;
        match.status = 'completed';
        return true;
      }
      return false;
    };

    // Search and update in all brackets
    for (const round of newBracket.upper) {
      for (const match of round.matches) {
        if (updateMatch(match)) return newBracket;
      }
    }

    if (newBracket.middle) {
      for (const round of newBracket.middle) {
        for (const match of round.matches) {
          if (updateMatch(match)) return newBracket;
        }
      }
    }

    if (newBracket.lower) {
      for (const round of newBracket.lower) {
        for (const match of round.matches) {
          if (updateMatch(match)) return newBracket;
        }
      }
    }

    if (newBracket.grandfinal && updateMatch(newBracket.grandfinal)) {
      return newBracket;
    }

    return newBracket;
  }

  /**
   * Propagate winner to their destination match
   */
  private propagateWinner(
    bracket: BracketStructure,
    matchId: string,
    winnerId: string
  ): BracketStructure {
    const newBracket = JSON.parse(JSON.stringify(bracket)) as BracketStructure;
    const match = this.findMatch(newBracket, matchId);

    if (!match || match.winnerDestination.type !== 'match') {
      return newBracket;
    }

    this.propagateTeamToDestination(
      newBracket,
      winnerId,
      match.winnerDestination,
      matchId,
      'winner'
    );

    return newBracket;
  }

  /**
   * Propagate loser to their destination match (for double/triple elim)
   */
  private propagateLoser(
    bracket: BracketStructure,
    matchId: string,
    loserId: string
  ): BracketStructure {
    const newBracket = JSON.parse(JSON.stringify(bracket)) as BracketStructure;
    const match = this.findMatch(newBracket, matchId);

    if (!match || match.loserDestination.type !== 'match') {
      return newBracket;
    }

    this.propagateTeamToDestination(
      newBracket,
      loserId,
      match.loserDestination,
      matchId,
      'loser'
    );

    return newBracket;
  }

  /**
   * Helper to propagate team to a destination
   */
  private propagateTeamToDestination(
    bracket: BracketStructure,
    teamId: string,
    destination: Destination,
    sourceMatchId: string,
    sourceType: 'winner' | 'loser'
  ): void {
    if (destination.type !== 'match') return;

    const destMatch = this.findMatch(bracket, destination.matchId);
    if (!destMatch) {
      console.warn(`    Could not find destination match: ${destination.matchId}`);
      return;
    }

    console.log(`    Propagating ${sourceType} (team ${teamId}) from ${sourceMatchId} to ${destination.matchId}`);

    // Check if this team should go to teamA slot
    const teamASource = destMatch.teamASource;
    if (
      teamASource.type === sourceType &&
      'matchId' in teamASource &&
      teamASource.matchId === sourceMatchId
    ) {
      destMatch.teamAId = teamId;
      console.log(`      Assigned to teamA slot`);
      return;
    }

    // Check if this team should go to teamB slot
    const teamBSource = destMatch.teamBSource;
    if (
      teamBSource.type === sourceType &&
      'matchId' in teamBSource &&
      teamBSource.matchId === sourceMatchId
    ) {
      destMatch.teamBId = teamId;
      console.log(`      Assigned to teamB slot`);
      return;
    }

    // Fallback: assign to first empty slot that expects this source type
    if (
      (teamASource.type === 'winner' || teamASource.type === 'loser') &&
      !destMatch.teamAId
    ) {
      destMatch.teamAId = teamId;
      console.log(`      Assigned to teamA slot (fallback)`);
    } else if (
      (teamBSource.type === 'winner' || teamBSource.type === 'loser') &&
      !destMatch.teamBId
    ) {
      destMatch.teamBId = teamId;
      console.log(`      Assigned to teamB slot (fallback)`);
    } else {
      console.warn(`      Could not assign team - no matching slot found`);
      console.warn(`      teamASource:`, teamASource, `teamAId:`, destMatch.teamAId);
      console.warn(`      teamBSource:`, teamBSource, `teamBId:`, destMatch.teamBId);
    }
  }

  /**
   * Find a match by ID in the bracket
   */
  private findMatch(
    bracket: BracketStructure,
    matchId: string
  ): BracketMatch | null {
    for (const round of bracket.upper) {
      for (const match of round.matches) {
        if (match.matchId === matchId) return match;
      }
    }

    if (bracket.middle) {
      for (const round of bracket.middle) {
        for (const match of round.matches) {
          if (match.matchId === matchId) return match;
        }
      }
    }

    if (bracket.lower) {
      for (const round of bracket.lower) {
        for (const match of round.matches) {
          if (match.matchId === matchId) return match;
        }
      }
    }

    if (bracket.grandfinal?.matchId === matchId) {
      return bracket.grandfinal;
    }

    return null;
  }

  /**
   * Update match statuses based on team availability
   */
  private updateMatchStatuses(bracket: BracketStructure): BracketStructure {
    const newBracket = JSON.parse(JSON.stringify(bracket)) as BracketStructure;

    const updateStatus = (match: BracketMatch) => {
      if (match.status === 'completed') return;

      if (match.teamAId && match.teamBId) {
        match.status = 'ready';
      } else {
        match.status = 'pending';
      }
    };

    newBracket.upper.forEach((round) => round.matches.forEach(updateStatus));
    newBracket.middle?.forEach((round) => round.matches.forEach(updateStatus));
    newBracket.lower?.forEach((round) => round.matches.forEach(updateStatus));
    if (newBracket.grandfinal) updateStatus(newBracket.grandfinal);

    return newBracket;
  }
}

// Export singleton instance
export const bracketManager = new BracketManager();
