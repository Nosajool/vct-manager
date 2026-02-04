// RoundTimeline - Visual display of round-by-round match data
// Shows economy, ultimates, first bloods, clutches, and win conditions

import { useState } from 'react';
import type {
  EnhancedRoundInfo,
  BuyType,
  WinCondition,
} from '../../types';
import { DamageTimeline } from './DamageTimeline';

interface RoundTimelineProps {
  rounds: EnhancedRoundInfo[];
  teamAName: string;
  teamBName: string;
  onRoundSelect?: (roundNumber: number) => void;
}

const BUY_TYPE_COLORS: Record<BuyType, string> = {
  eco: 'bg-gray-500',
  half_buy: 'bg-yellow-500',
  force_buy: 'bg-orange-500',
  full_buy: 'bg-green-500',
};

const BUY_TYPE_LABELS: Record<BuyType, string> = {
  eco: 'Eco',
  half_buy: 'Half',
  force_buy: 'Force',
  full_buy: 'Full',
};

const WIN_CONDITION_LABELS: Record<WinCondition, string> = {
  elimination: 'Elim',
  spike_detonated: 'Spike',
  spike_defused: 'Defuse',
  time_expired: 'Time',
};

const WIN_CONDITION_ICONS: Record<WinCondition, string> = {
  elimination: '💀',
  spike_detonated: '💥',
  spike_defused: '🛡️',
  time_expired: '⏱️',
};

export function RoundTimeline({
  rounds,
  teamAName,
  teamBName,
  onRoundSelect,
}: RoundTimelineProps) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const handleRoundClick = (roundNumber: number) => {
    setSelectedRound(roundNumber === selectedRound ? null : roundNumber);
    onRoundSelect?.(roundNumber);
  };

  const selectedRoundData = selectedRound
    ? rounds.find((r) => r.roundNumber === selectedRound)
    : null;

  // Split into halves
  const firstHalf = rounds.filter((r) => r.roundNumber <= 12);
  const secondHalf = rounds.filter((r) => r.roundNumber > 12 && r.roundNumber <= 24);
  const overtime = rounds.filter((r) => r.roundNumber > 24);

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-vct-light font-medium">{teamAName}</span>
        <span className="text-vct-gray">Round Timeline</span>
        <span className="text-vct-light font-medium">{teamBName}</span>
      </div>

      {/* First Half */}
      <div className="space-y-1">
        <div className="text-xs text-vct-gray">First Half ({teamAName} Attack)</div>
        <div className="flex gap-1">
          {firstHalf.map((round) => (
            <RoundCell
              key={round.roundNumber}
              round={round}
              isSelected={selectedRound === round.roundNumber}
              onClick={() => handleRoundClick(round.roundNumber)}
            />
          ))}
        </div>
      </div>

      {/* Second Half */}
      {secondHalf.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-vct-gray">Second Half ({teamBName} Attack)</div>
          <div className="flex gap-1">
            {secondHalf.map((round) => (
              <RoundCell
                key={round.roundNumber}
                round={round}
                isSelected={selectedRound === round.roundNumber}
                onClick={() => handleRoundClick(round.roundNumber)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overtime */}
      {overtime.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-yellow-400">Overtime</div>
          <div className="flex gap-1">
            {overtime.map((round) => (
              <RoundCell
                key={round.roundNumber}
                round={round}
                isSelected={selectedRound === round.roundNumber}
                onClick={() => handleRoundClick(round.roundNumber)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selected Round Details */}
      {selectedRoundData && (
        <RoundDetails
          round={selectedRoundData}
          teamAName={teamAName}
          teamBName={teamBName}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-vct-gray pt-2 border-t border-vct-gray/20">
        <div className="flex items-center gap-2">
          <span>Buy Type:</span>
          {Object.entries(BUY_TYPE_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded ${BUY_TYPE_COLORS[key as BuyType]}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual round cell in the timeline
function RoundCell({
  round,
  isSelected,
  onClick,
}: {
  round: EnhancedRoundInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  const teamAWon = round.winner === 'teamA';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-1 rounded transition-all ${
        isSelected
          ? 'bg-vct-red/30 ring-2 ring-vct-red'
          : 'bg-vct-dark hover:bg-vct-gray/20'
      }`}
      title={`Round ${round.roundNumber}`}
    >
      {/* Round number */}
      <span className="text-[10px] text-vct-gray">{round.roundNumber}</span>

      {/* Winner indicator */}
      <div
        className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] ${
          teamAWon ? 'bg-green-500/80' : 'bg-red-500/80'
        }`}
      >
        {teamAWon ? 'A' : 'B'}
      </div>

      {/* Economy indicators */}
      <div className="flex gap-0.5 mt-0.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${BUY_TYPE_COLORS[round.teamAEconomy.buyType]}`}
          title={`A: ${BUY_TYPE_LABELS[round.teamAEconomy.buyType]}`}
        />
        <span
          className={`w-1.5 h-1.5 rounded-full ${BUY_TYPE_COLORS[round.teamBEconomy.buyType]}`}
          title={`B: ${BUY_TYPE_LABELS[round.teamBEconomy.buyType]}`}
        />
      </div>

      {/* Special events indicator */}
      {(round.clutchAttempt?.won || round.ultsUsed.length >= 2) && (
        <span className="text-[8px]">
          {round.clutchAttempt?.won ? '🎯' : ''}
          {round.ultsUsed.length >= 2 ? '⚡' : ''}
        </span>
      )}
    </button>
  );
}

// Detailed view for a selected round
function RoundDetails({
  round,
  teamAName,
  teamBName,
}: {
  round: EnhancedRoundInfo;
  teamAName: string;
  teamBName: string;
}) {
  const [showDamageTimeline, setShowDamageTimeline] = useState(false);
  const teamAWon = round.winner === 'teamA';

  return (
    <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4 space-y-3">
      {/* Round Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-vct-light">Round {round.roundNumber}</h4>
        <div className="flex items-center gap-2">
          <span className={teamAWon ? 'text-green-400' : 'text-red-400'}>
            {teamAWon ? teamAName : teamBName} wins
          </span>
          <span className="text-vct-gray text-sm">
            {WIN_CONDITION_ICONS[round.winCondition]} {WIN_CONDITION_LABELS[round.winCondition]}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-center text-2xl font-bold">
        <span className={teamAWon ? 'text-green-400' : 'text-vct-light'}>
          {round.teamAScore}
        </span>
        <span className="text-vct-gray mx-2">-</span>
        <span className={!teamAWon ? 'text-green-400' : 'text-vct-light'}>
          {round.teamBScore}
        </span>
      </div>

      {/* Economy */}
      <div className="grid grid-cols-2 gap-4">
        <EconomyDisplay
          teamName={teamAName}
          economy={round.teamAEconomy}
          isWinner={teamAWon}
        />
        <EconomyDisplay
          teamName={teamBName}
          economy={round.teamBEconomy}
          isWinner={!teamAWon}
        />
      </div>

      {/* Events */}
      <div className="space-y-2">
        {/* First Blood */}
        {round.firstBlood && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-400">💀 First Blood:</span>
            <span className="text-vct-light">
              {round.firstBlood.side === 'teamA' ? teamAName : teamBName}
            </span>
          </div>
        )}

        {/* Spike */}
        {round.spikePlanted && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-orange-400">💣 Spike Planted</span>
          </div>
        )}

        {/* Clutch */}
        {round.clutchAttempt && (
          <div className="flex items-center gap-2 text-sm">
            <span className={round.clutchAttempt.won ? 'text-green-400' : 'text-red-400'}>
              🎯 {round.clutchAttempt.situation} Clutch:
            </span>
            <span className="text-vct-light">
              {round.clutchAttempt.won ? 'Won!' : 'Lost'}
            </span>
          </div>
        )}

        {/* Ultimates */}
        {round.ultsUsed.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-400">⚡ Ultimates Used:</span>
            <span className="text-vct-light">
              {round.ultsUsed.map((u) => u.agent).join(', ')}
            </span>
          </div>
        )}

        {/* Damage Timeline Button */}
        {round.damageEvents && round.damageEvents.events.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowDamageTimeline(!showDamageTimeline)}
              className="flex items-center gap-2 text-sm bg-vct-red/20 hover:bg-vct-red/30 text-vct-red px-3 py-2 rounded transition-colors"
            >
              <span>🔫</span>
              <span>{showDamageTimeline ? 'Hide' : 'Show'} Damage Timeline</span>
              <span className="text-vct-gray">({round.damageEvents.events.length} events)</span>
            </button>
          </div>
        )}
      </div>

      {/* Damage Timeline */}
      {showDamageTimeline && round.damageEvents && (
        <div className="mt-4 pt-4 border-t border-vct-gray/20">
          <DamageTimeline
            damageEvents={round.damageEvents}
            playerNames={{}}
            playerAgents={round.ultsUsed.reduce((acc, ult) => {
              acc[ult.playerId] = ult.agent;
              return acc;
            }, {} as Record<string, string>)}
            teams={{
              teamA: { players: [], name: teamAName },
              teamB: { players: [], name: teamBName },
            }}
          />
        </div>
      )}
    </div>
  );
}

// Economy display component
function EconomyDisplay({
  teamName,
  economy,
  isWinner,
}: {
  teamName: string;
  economy: { credits: number; buyType: BuyType; roundsLost: number };
  isWinner: boolean;
}) {
  return (
    <div className={`p-2 rounded ${isWinner ? 'bg-green-500/10' : 'bg-vct-dark'}`}>
      <div className="text-xs text-vct-gray mb-1">{teamName}</div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${BUY_TYPE_COLORS[economy.buyType].replace('bg-', 'text-')}`}>
          {BUY_TYPE_LABELS[economy.buyType]}
        </span>
        <span className="text-sm text-vct-light">${economy.credits}</span>
      </div>
      {economy.roundsLost > 0 && (
        <div className="text-xs text-red-400">
          Loss bonus: {economy.roundsLost}
        </div>
      )}
    </div>
  );
}
