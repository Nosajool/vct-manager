// Scoreboard Component - Map-by-map breakdown with player stats

import { useState } from 'react';
import type { MatchResult, MapResult } from '../../types';
import { PlayerStatsTable } from './PlayerStatsTable';
import { RoundTimeline } from './RoundTimeline';

interface ScoreboardProps {
  result: MatchResult;
  teamAName: string;
  teamBName: string;
}

export function Scoreboard({ result, teamAName, teamBName }: ScoreboardProps) {
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);
  const selectedMap = result.maps[selectedMapIndex];

  // Check if enhanced round data is available
  const hasEnhancedRounds = selectedMap?.enhancedRounds && selectedMap.enhancedRounds.length > 0;

  return (
    <div className="space-y-4">
      {/* Map Tabs */}
      <div className="flex gap-2">
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

      {/* Selected Map Details */}
      {selectedMap && (
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
            // Extract player data for RoundTimeline
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
              showEnhanced={hasEnhancedRounds}
            />
            <PlayerStatsTable
              performances={selectedMap.teamBPerformances}
              teamName={teamBName}
              isWinner={selectedMap.winner === 'teamB'}
              showEnhanced={hasEnhancedRounds}
            />
          </div>
        </div>
      )}
    </div>
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
        px-4 py-2 rounded-lg border transition-all text-left flex-1
        ${
          isSelected
            ? 'bg-vct-red/10 border-vct-red/50 text-vct-light'
            : 'bg-vct-darker border-vct-gray/20 text-vct-gray hover:border-vct-gray/40'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">Map {index + 1}</span>
        {map.overtime && (
          <span className="text-xs text-yellow-400">OT</span>
        )}
      </div>
      <p className="text-xs mt-1">{map.map}</p>
      <div className="flex items-center gap-1 mt-1 text-xs">
        <span className={map.winner === 'teamA' ? 'text-green-400' : ''}>
          {map.teamAScore}
        </span>
        <span>-</span>
        <span className={map.winner === 'teamB' ? 'text-green-400' : ''}>
          {map.teamBScore}
        </span>
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
        <div className="flex-1 text-left">
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
        <div className="flex-1 text-right">
          <p
            className={`text-xl font-bold ${
              map.winner === 'teamB' ? 'text-green-400' : 'text-vct-light'
            }`}
          >
            {teamBName}
          </p>
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
