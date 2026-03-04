// Scoreboard Component - Map-by-map breakdown with player stats

import { useState } from 'react';
import type { MatchResult, MapResult, PlayerMapPerformance } from '../../types';
import { PlayerStatsTable } from './PlayerStatsTable';
import { RoundTimeline } from './RoundTimeline';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl, getMapImageUrl } from '../../utils/imageAssets';

interface ScoreboardProps {
  result: MatchResult;
  teamAName: string;
  teamBName: string;
  overallWinner: 'teamA' | 'teamB';
}

function aggregatePerformances(
  maps: MapResult[],
  teamKey: 'teamAPerformances' | 'teamBPerformances'
): PlayerMapPerformance[] {
  const playerMap = new Map<string, {
    playerId: string;
    playerName: string;
    agents: Set<string>;
    kills: number;
    deaths: number;
    assists: number;
    firstKills: number;
    firstDeaths: number;
    clutchesAttempted: number;
    clutchesWon: number;
    plants: number;
    defuses: number;
    ultsUsed: number;
    acsWeighted: number;
    adrWeighted: number;
    adrRounds: number;
    kastWeighted: number;
    kastRounds: number;
    hsWeighted: number;
    hsKills: number;
    totalRounds: number;
  }>();

  for (const map of maps) {
    const rounds = map.totalRounds;
    for (const p of map[teamKey]) {
      if (!playerMap.has(p.playerId)) {
        playerMap.set(p.playerId, {
          playerId: p.playerId,
          playerName: p.playerName,
          agents: new Set(),
          kills: 0, deaths: 0, assists: 0,
          firstKills: 0, firstDeaths: 0,
          clutchesAttempted: 0, clutchesWon: 0,
          plants: 0, defuses: 0, ultsUsed: 0,
          acsWeighted: 0,
          adrWeighted: 0, adrRounds: 0,
          kastWeighted: 0, kastRounds: 0,
          hsWeighted: 0, hsKills: 0,
          totalRounds: 0,
        });
      }
      const a = playerMap.get(p.playerId)!;
      a.agents.add(p.agent);
      a.kills += p.kills;
      a.deaths += p.deaths;
      a.assists += p.assists;
      a.firstKills += p.firstKills ?? 0;
      a.firstDeaths += p.firstDeaths ?? 0;
      a.clutchesAttempted += p.clutchesAttempted ?? 0;
      a.clutchesWon += p.clutchesWon ?? 0;
      a.plants += p.plants ?? 0;
      a.defuses += p.defuses ?? 0;
      a.ultsUsed += p.ultsUsed ?? 0;
      a.acsWeighted += p.acs * rounds;
      a.totalRounds += rounds;
      if (p.adr !== undefined) { a.adrWeighted += p.adr * rounds; a.adrRounds += rounds; }
      if (p.kast !== undefined) { a.kastWeighted += p.kast * rounds; a.kastRounds += rounds; }
      if (p.hsPercent !== undefined) { a.hsWeighted += p.hsPercent * p.kills; a.hsKills += p.kills; }
    }
  }

  return Array.from(playerMap.values()).map(a => ({
    playerId: a.playerId,
    playerName: a.playerName,
    agent: Array.from(a.agents).join(', '),
    kills: a.kills,
    deaths: a.deaths,
    assists: a.assists,
    kd: a.deaths > 0 ? a.kills / a.deaths : a.kills,
    acs: a.totalRounds > 0 ? Math.round(a.acsWeighted / a.totalRounds) : 0,
    firstKills: a.firstKills,
    firstDeaths: a.firstDeaths,
    clutchesAttempted: a.clutchesAttempted,
    clutchesWon: a.clutchesWon,
    plants: a.plants,
    defuses: a.defuses,
    ultsUsed: a.ultsUsed,
    adr: a.adrRounds > 0 ? Math.round(a.adrWeighted / a.adrRounds) : undefined,
    kast: a.kastRounds > 0 ? a.kastWeighted / a.kastRounds : undefined,
    hsPercent: a.hsKills > 0 ? a.hsWeighted / a.hsKills : undefined,
  }));
}

export function Scoreboard({ result, teamAName, teamBName, overallWinner }: ScoreboardProps) {
  const [selectedMapIndex, setSelectedMapIndex] = useState<number | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const isAllMaps = selectedMapIndex === null;
  const selectedMap = isAllMaps ? null : result.maps[selectedMapIndex];

  const hasEnhancedRounds = isAllMaps
    ? result.maps.some(m => m.enhancedRounds && m.enhancedRounds.length > 0)
    : !!(selectedMap?.enhancedRounds && selectedMap.enhancedRounds.length > 0);

  const aggregatedTeamA = isAllMaps ? aggregatePerformances(result.maps, 'teamAPerformances') : null;
  const aggregatedTeamB = isAllMaps ? aggregatePerformances(result.maps, 'teamBPerformances') : null;
  const totalRounds = isAllMaps ? result.maps.reduce((sum, m) => sum + m.totalRounds, 0) : 0;

  return (
    <div className="space-y-4">
      {/* Map Tabs */}
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
        <AllMapsTab
          isSelected={isAllMaps}
          onClick={() => setSelectedMapIndex(null)}
          result={result}
        />
        {result.maps.map((map, idx) => (
          <MapTab
            key={idx}
            map={map}
            index={idx}
            isSelected={idx === selectedMapIndex}
            onClick={() => setSelectedMapIndex(idx)}
          />
        ))}
      </div>

      {/* All Maps View */}
      {isAllMaps && aggregatedTeamA && aggregatedTeamB && (
        <div className="space-y-4">
          <div className="text-center text-sm text-vct-gray">
            {totalRounds} total rounds across {result.maps.length} maps
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PlayerStatsTable
              performances={aggregatedTeamA}
              teamName={teamAName}
              isWinner={overallWinner === 'teamA'}
            />
            <PlayerStatsTable
              performances={aggregatedTeamB}
              teamName={teamBName}
              isWinner={overallWinner === 'teamB'}
            />
          </div>
        </div>
      )}

      {/* Individual Map View */}
      {!isAllMaps && selectedMap && (
        <div className="space-y-4">
          {/* Map Score Header */}
          <MapScoreHeader
            map={selectedMap}
            teamAName={teamAName}
            teamBName={teamBName}
          />

          {/* Timeline Toggle */}
          {hasEnhancedRounds && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  showTimeline
                    ? 'bg-vct-red/20 text-vct-red border border-vct-red/30'
                    : 'bg-vct-gray/20 text-vct-gray hover:bg-vct-gray/30'
                }`}
              >
                {showTimeline ? 'Hide Round Timeline' : 'Show Round Timeline'}
              </button>
            </div>
          )}

          {/* Round Timeline */}
          {showTimeline && hasEnhancedRounds && selectedMap.enhancedRounds && (() => {
            const playerNames: Record<string, string> = {};
            const playerAgents: Record<string, string> = {};
            const teamAPlayerIds: string[] = [];
            const teamBPlayerIds: string[] = [];

            selectedMap.teamAPerformances.forEach(p => {
              playerNames[p.playerId] = p.playerName;
              playerAgents[p.playerId] = p.agent;
              teamAPlayerIds.push(p.playerId);
            });
            selectedMap.teamBPerformances.forEach(p => {
              playerNames[p.playerId] = p.playerName;
              playerAgents[p.playerId] = p.agent;
              teamBPlayerIds.push(p.playerId);
            });

            return (
              <div className="bg-vct-darker border border-vct-gray/20 rounded-lg p-4">
                <RoundTimeline
                  rounds={selectedMap.enhancedRounds}
                  teamAName={teamAName}
                  teamBName={teamBName}
                  playerNames={playerNames}
                  playerAgents={playerAgents}
                  teamAPlayerIds={teamAPlayerIds}
                  teamBPlayerIds={teamBPlayerIds}
                />
              </div>
            );
          })()}

          {/* Player Stats Tables */}
          <div className="grid gap-4 lg:grid-cols-2">
            <PlayerStatsTable
              performances={selectedMap.teamAPerformances}
              teamName={teamAName}
              isWinner={selectedMap.winner === 'teamA'}
            />
            <PlayerStatsTable
              performances={selectedMap.teamBPerformances}
              teamName={teamBName}
              isWinner={selectedMap.winner === 'teamB'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// All Maps Tab Component
function AllMapsTab({
  isSelected,
  onClick,
  result,
}: {
  isSelected: boolean;
  onClick: () => void;
  result: MatchResult;
}) {
  const teamAWins = result.maps.filter(m => m.winner === 'teamA').length;
  const teamBWins = result.maps.filter(m => m.winner === 'teamB').length;

  return (
    <button
      onClick={onClick}
      className={`
        rounded-lg border transition-all px-3 py-2 text-left min-w-[80px] shrink-0 w-[100px] sm:w-auto
        ${isSelected ? 'border-vct-red/50 bg-vct-red/10' : 'border-vct-gray/20 hover:border-vct-gray/40'}
      `}
    >
      <p className="text-xs text-vct-gray">All Maps</p>
      <p className="text-sm font-medium text-vct-light">{teamAWins} – {teamBWins}</p>
    </button>
  );
}

// Map Tab Component
function MapTab({
  map,
  index,
  isSelected,
  onClick,
}: {
  map: MapResult;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
      <button
      onClick={onClick}
      className={`
        rounded-lg border transition-all text-left shrink-0 overflow-hidden w-[160px] sm:w-auto
        ${
          isSelected
            ? 'border-vct-red/50'
            : 'border-vct-gray/20 hover:border-vct-gray/40'
        }
      `}
    >
      <div className="relative h-12">
        <img src={getMapImageUrl(map.map)} alt={map.map} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 ${isSelected ? 'bg-black/50' : 'bg-black/65'}`} />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <div>
            <p className="text-xs text-vct-gray">Map {index + 1}</p>
            <p className="text-sm font-medium text-vct-light">{map.map}</p>
          </div>
          <div className="text-right">
            {map.overtime && <p className="text-xs text-yellow-400">OT</p>}
            <div className="flex items-center gap-1 text-xs">
              <span className={map.winner === 'teamA' ? 'text-green-400' : 'text-vct-gray'}>
                {map.teamAScore}
              </span>
              <span className="text-vct-gray">-</span>
              <span className={map.winner === 'teamB' ? 'text-green-400' : 'text-vct-gray'}>
                {map.teamBScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// Map Score Header Component
function MapScoreHeader({
  map,
  teamAName,
  teamBName,
}: {
  map: MapResult;
  teamAName: string;
  teamBName: string;
}) {
  return (
    <div className="bg-vct-darker rounded-lg p-4 border border-vct-gray/20">
      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex-1 text-left flex items-center gap-2">
          <GameImage
            src={getTeamLogoUrl(teamAName)}
            alt={teamAName}
            className="w-8 h-8"
          />
          <p
            className={`text-xl font-bold ${
              map.winner === 'teamA' ? 'text-green-400' : 'text-vct-light'
            }`}
          >
            {teamAName}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4 px-6">
          <span
            className={`text-4xl font-bold ${
              map.winner === 'teamA' ? 'text-green-400' : 'text-vct-gray'
            }`}
          >
            {map.teamAScore}
          </span>
          <span className="text-2xl text-vct-gray">-</span>
          <span
            className={`text-4xl font-bold ${
              map.winner === 'teamB' ? 'text-green-400' : 'text-vct-gray'
            }`}
          >
            {map.teamBScore}
          </span>
        </div>

        {/* Team B */}
        <div className="flex-1 text-right flex items-center justify-end gap-2">
          <p
            className={`text-xl font-bold ${
              map.winner === 'teamB' ? 'text-green-400' : 'text-vct-light'
            }`}
          >
            {teamBName}
          </p>
          <GameImage
            src={getTeamLogoUrl(teamBName)}
            alt={teamBName}
            className="w-8 h-8"
          />
        </div>
      </div>

      {/* Map Info */}
      <div className="flex items-center justify-center gap-4 mt-3 text-sm text-vct-gray">
        <span>{map.map}</span>
        <span>•</span>
        <span>{map.totalRounds} rounds</span>
        {map.overtime && (
          <>
            <span>•</span>
            <span className="text-yellow-400">
              Overtime ({map.overtimeRounds} rounds)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
