// SimulationResultsModal - Shows matches simulated during time advancement
//
// Displays all matches that were simulated when using time controls,
// organized with player's team matches at the top, then grouped by
// tournament and region.

import { useState, useMemo } from 'react';
import { useGameStore } from '../../store';
import { MatchResult as MatchResultComponent } from '../match/MatchResult';
import type { MatchResult, Match, Tournament, BracketStructure, BracketMatch } from '../../types';
import type { TimeAdvanceResult, ReputationDelta } from '../../services';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';

interface SimulationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TimeAdvanceResult | null;
}

interface GroupedMatches {
  playerTeamMatches: MatchWithDetails[];
  tournamentGroups: Map<string, { name: string; matches: MatchWithDetails[] }>;
  regionGroups: Map<string, MatchWithDetails[]>;
}

interface MatchWithDetails {
  match: Match;
  result: MatchResult;
  teamAName: string;
  teamBName: string;
  teamARegion: string;
  teamBRegion: string;
  tournamentName?: string;
  matchLabel?: string;
  isPlayerTeamMatch: boolean;
  playerTeamWon?: boolean;
}

/**
 * Find a bracket match by its matchId in a bracket structure
 * Returns the match along with its bracket type, round number, and position in the round
 */
function findBracketMatchInfo(
  bracket: BracketStructure,
  matchId: string
): { bracketMatch: BracketMatch; bracketType: string; roundNumber: number; matchIndex: number } | null {
  // Check grand final
  if (bracket.grandfinal?.matchId === matchId) {
    return { bracketMatch: bracket.grandfinal, bracketType: 'grandfinal', roundNumber: 0, matchIndex: 0 };
  }

  // Search through upper bracket
  for (const round of bracket.upper) {
    const matchIndex = round.matches.findIndex(m => m.matchId === matchId);
    if (matchIndex !== -1) {
      return { bracketMatch: round.matches[matchIndex], bracketType: 'upper', roundNumber: round.roundNumber, matchIndex };
    }
  }

  // Search through middle bracket (triple elimination)
  if (bracket.middle) {
    for (const round of bracket.middle) {
      const matchIndex = round.matches.findIndex(m => m.matchId === matchId);
      if (matchIndex !== -1) {
        return { bracketMatch: round.matches[matchIndex], bracketType: 'middle', roundNumber: round.roundNumber, matchIndex };
      }
    }
  }

  // Search through lower bracket
  if (bracket.lower) {
    for (const round of bracket.lower) {
      const matchIndex = round.matches.findIndex(m => m.matchId === matchId);
      if (matchIndex !== -1) {
        return { bracketMatch: round.matches[matchIndex], bracketType: 'lower', roundNumber: round.roundNumber, matchIndex };
      }
    }
  }

  return null;
}

/**
 * Generate a human-readable match label like "Upper Round 1 Match 2"
 */
function getMatchLabel(tournament: Tournament, matchId: string): string | undefined {
  // Check if it's a swiss tournament and search swiss stage first
  if (tournament.format === 'swiss_to_playoff') {
    const multiStage = tournament as Tournament & { swissStage?: { rounds: Array<{ roundNumber: number; matches: BracketMatch[] }> }; playoffBracket?: BracketStructure };

    // Search swiss stage
    if (multiStage.swissStage) {
      for (const round of multiStage.swissStage.rounds) {
        const matchIndex = round.matches.findIndex(m => m.matchId === matchId);
        if (matchIndex !== -1) {
          return `Swiss Round ${round.roundNumber} Match ${matchIndex + 1}`;
        }
      }
    }

    // Search playoff bracket
    if (multiStage.playoffBracket) {
      const info = findBracketMatchInfo(multiStage.playoffBracket, matchId);
      if (info) {
        return formatMatchLabel(info.bracketType, info.roundNumber, info.matchIndex, true);
      }
    }
  }

  // Search main bracket
  const info = findBracketMatchInfo(tournament.bracket, matchId);
  if (!info) return undefined;

  const hasMiddleBracket = !!(tournament.bracket.middle && tournament.bracket.middle.length > 0);
  return formatMatchLabel(info.bracketType, info.roundNumber, info.matchIndex, hasMiddleBracket);
}

/**
 * Format the match label based on bracket type and position
 */
function formatMatchLabel(
  bracketType: string,
  roundNumber: number,
  matchIndex: number,
  isTripleElim: boolean
): string {
  if (bracketType === 'grandfinal') {
    return 'Grand Final';
  }

  const bracketName = isTripleElim
    ? { upper: 'Alpha', middle: 'Beta', lower: 'Omega' }[bracketType] || bracketType
    : { upper: 'Upper', lower: 'Lower' }[bracketType] || bracketType;

  // Capitalize first letter
  const formattedBracket = bracketName.charAt(0).toUpperCase() + bracketName.slice(1);

  return `${formattedBracket} Round ${roundNumber} Match ${matchIndex + 1}`;
}

export function SimulationResultsModal({
  isOpen,
  onClose,
  result,
}: SimulationResultsModalProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const teams = useGameStore((state) => state.teams);
  const matches = useGameStore((state) => state.matches);
  const tournaments = useGameStore((state) => state.tournaments);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  // Group and organize matches
  const groupedMatches = useMemo((): GroupedMatches => {
    const playerTeamMatches: MatchWithDetails[] = [];
    const tournamentGroups = new Map<string, { name: string; matches: MatchWithDetails[] }>();
    const regionGroups = new Map<string, MatchWithDetails[]>();

    if (!result?.simulatedMatches) {
      return { playerTeamMatches, tournamentGroups, regionGroups };
    }

    for (const matchResult of result.simulatedMatches) {
      const match = matches[matchResult.matchId];
      if (!match) continue;

      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];
      if (!teamA || !teamB) continue;

      const isPlayerTeamMatch =
        match.teamAId === playerTeamId || match.teamBId === playerTeamId;

      const playerTeamWon = isPlayerTeamMatch
        ? matchResult.winnerId === playerTeamId
        : undefined;

      const tournament = match.tournamentId ? tournaments[match.tournamentId] : null;

      // Get match label from tournament bracket
      const matchLabel = tournament ? getMatchLabel(tournament, match.id) : undefined;

      const matchWithDetails: MatchWithDetails = {
        match,
        result: matchResult,
        teamAName: teamA.name,
        teamBName: teamB.name,
        teamARegion: teamA.region,
        teamBRegion: teamB.region,
        tournamentName: tournament?.name,
        matchLabel,
        isPlayerTeamMatch,
        playerTeamWon,
      };

      // Sort into groups
      if (isPlayerTeamMatch) {
        playerTeamMatches.push(matchWithDetails);
      } else if (tournament) {
        // Group by tournament
        if (!tournamentGroups.has(tournament.id)) {
          tournamentGroups.set(tournament.id, {
            name: tournament.name,
            matches: [],
          });
        }
        tournamentGroups.get(tournament.id)!.matches.push(matchWithDetails);
      } else {
        // Group by region (use teamA's region for league matches)
        const region = teamA.region;
        if (!regionGroups.has(region)) {
          regionGroups.set(region, []);
        }
        regionGroups.get(region)!.push(matchWithDetails);
      }
    }

    return { playerTeamMatches, tournamentGroups, regionGroups };
  }, [result, matches, teams, tournaments, playerTeamId]);

  // Early return after hooks
  if (!isOpen || !result) return null;

  const totalMatches = result.simulatedMatches.length;

  if (totalMatches === 0) {
    return null; // Don't show modal if no matches were simulated
  }

  // Handle viewing detailed match result
  const handleViewDetails = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleCloseDetails = () => {
    setSelectedMatch(null);
  };

  const handleClose = () => {
    setSelectedMatch(null);
    onClose();
  };

  // If viewing a specific match, show the detailed result
  if (selectedMatch) {
    return (
      <MatchResultComponent
        match={selectedMatch}
        onClose={handleCloseDetails}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Simulation Results</h2>
            <p className="text-sm text-vct-gray">
              {totalMatches} match{totalMatches !== 1 ? 'es' : ''} simulated over{' '}
              {result.daysAdvanced} day{result.daysAdvanced !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-vct-gray hover:text-vct-light transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Player's Team Matches - Top Section */}
          {groupedMatches.playerTeamMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-vct-red">Your Matches</h3>
                <span className="px-2 py-0.5 bg-vct-red/20 text-vct-red text-xs rounded">
                  {groupedMatches.playerTeamMatches.length}
                </span>
              </div>
              <div className="space-y-2">
                {groupedMatches.playerTeamMatches.map((m) => (
                  <MatchCard
                    key={m.match.id}
                    matchDetails={m}
                    isHighlighted
                    reputationDelta={result.reputationDelta}
                    onViewDetails={() => handleViewDetails(m.match)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tournament Matches - Grouped by Tournament */}
          {groupedMatches.tournamentGroups.size > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">
                Tournament Matches
              </h3>
              <div className="space-y-4">
                {Array.from(groupedMatches.tournamentGroups.entries()).map(
                  ([tournamentId, group]) => (
                    <div key={tournamentId}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-purple-300">
                          {group.name}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                          {group.matches.length}
                        </span>
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-purple-500/30">
                        {group.matches.map((m) => (
                          <MatchCard
                            key={m.match.id}
                            matchDetails={m}
                            onViewDetails={() => handleViewDetails(m.match)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* League/Regional Matches - Grouped by Region */}
          {groupedMatches.regionGroups.size > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                League Matches
              </h3>
              <div className="space-y-4">
                {Array.from(groupedMatches.regionGroups.entries()).map(
                  ([region, regionMatches]) => (
                    <div key={region}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-300">
                          {region}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {regionMatches.length}
                        </span>
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-blue-500/30">
                        {regionMatches.map((m) => (
                          <MatchCard
                            key={m.match.id}
                            matchDetails={m}
                            onViewDetails={() => handleViewDetails(m.match)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Match Card Component
function MatchCard({
  matchDetails,
  isHighlighted = false,
  reputationDelta,
  onViewDetails,
}: {
  matchDetails: MatchWithDetails;
  isHighlighted?: boolean;
  reputationDelta?: ReputationDelta;
  onViewDetails: () => void;
}) {
  const { match, result, teamAName, teamBName, matchLabel, isPlayerTeamMatch, playerTeamWon } =
    matchDetails;

  const teamAWon = result.winnerId === match.teamAId;
  const teamBWon = result.winnerId === match.teamBId;

  // Determine card style based on player team result
  let cardBgClass = 'bg-vct-dark';
  if (isHighlighted && isPlayerTeamMatch) {
    cardBgClass = playerTeamWon
      ? 'bg-green-500/10 border-green-500/30'
      : 'bg-red-500/10 border-red-500/30';
  }

  return (
    <div
      className={`${cardBgClass} p-3 rounded-lg border border-vct-gray/20 hover:border-vct-gray/40 transition-colors`}
    >
      {/* Match Label */}
      {matchLabel && (
        <div className="text-xs text-vct-gray/70 mb-2 text-center">
          {matchLabel}
        </div>
      )}
      <div className="flex items-center justify-between">
        {/* Teams and Score */}
        <div className="flex items-center gap-4 flex-1">
          {/* Team A */}
          <div className="flex-1">
            <div className="flex items-center gap-2 justify-end">
              <span
                className={`font-medium ${
                  teamAWon ? 'text-green-400' : 'text-vct-light'
                }`}
              >
                {teamAName}
              </span>
              <GameImage
                src={getTeamLogoUrl(teamAName)}
                alt={teamAName}
                className="w-8 h-8"
              />
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-3">
            <span
              className={`text-lg font-bold ${
                teamAWon ? 'text-green-400' : 'text-vct-gray'
              }`}
            >
              {result.scoreTeamA}
            </span>
            <span className="text-vct-gray">-</span>
            <span
              className={`text-lg font-bold ${
                teamBWon ? 'text-green-400' : 'text-vct-gray'
              }`}
            >
              {result.scoreTeamB}
            </span>
          </div>

          {/* Team B */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GameImage
                src={getTeamLogoUrl(teamBName)}
                alt={teamBName}
                className="w-8 h-8"
              />
              <span
                className={`font-medium ${
                  teamBWon ? 'text-green-400' : 'text-vct-light'
                }`}
              >
                {teamBName}
              </span>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={onViewDetails}
          className="ml-4 px-3 py-1 text-sm bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded transition-colors"
        >
          View Details
        </button>
      </div>

      {/* Map Scores Preview */}
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-vct-gray">
        {result.maps.map((map, index) => (
          <span key={index} className="flex items-center gap-1">
            <span className="text-vct-gray/60">{map.map}:</span>
            <span
              className={
                map.winner === 'teamA' ? 'text-green-400/70' : 'text-vct-gray'
              }
            >
              {map.teamAScore}
            </span>
            <span>-</span>
            <span
              className={
                map.winner === 'teamB' ? 'text-green-400/70' : 'text-vct-gray'
              }
            >
              {map.teamBScore}
            </span>
            {index < result.maps.length - 1 && <span className="mx-1">|</span>}
          </span>
        ))}
      </div>

      {/* Player Team Result Badge + Reputation Chips */}
      {isHighlighted && isPlayerTeamMatch && (
        <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              playerTeamWon
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {playerTeamWon ? 'Victory' : 'Defeat'}
          </span>
          {reputationDelta && reputationDelta.fanbaseDelta > 0 && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-vct-red/20 text-vct-red">
              +{reputationDelta.fanbaseDelta} Fans
            </span>
          )}
          {reputationDelta && reputationDelta.hypeDelta > 0 && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
              +{reputationDelta.hypeDelta} Hype
            </span>
          )}
        </div>
      )}
    </div>
  );
}
