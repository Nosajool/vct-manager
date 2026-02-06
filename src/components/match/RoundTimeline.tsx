// RoundTimeline - Visual display of round-by-round match data
// Shows economy, ultimates, first bloods, clutches, and win conditions

import { useState } from 'react';
import type {
  EnhancedRoundInfo,
  BuyType,
  WinCondition,
} from '../../types';
import type {
  TimelineEvent,
  BuyPhaseEntry,
  SimDamageEvent,
  SimKillEvent,
  TradeKillEvent,
  PlantStartEvent,
  PlantInterruptEvent,
  PlantCompleteEvent,
  DefuseStartEvent,
  DefuseInterruptEvent,
  DefuseCompleteEvent,
  SpikeDropEvent,
  SpikePickupEvent,
  AbilityUseEvent,
  HealEvent,
} from '../../types/round-simulation';
import { DamageTimeline } from './DamageTimeline';

interface RoundTimelineProps {
  rounds: EnhancedRoundInfo[];
  teamAName: string;
  teamBName: string;
  playerNames: Record<string, string>;
  playerAgents: Record<string, string>;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
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
  playerNames,
  playerAgents,
  teamAPlayerIds,
  teamBPlayerIds,
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
          playerNames={playerNames}
          playerAgents={playerAgents}
          teamAPlayerIds={teamAPlayerIds}
          teamBPlayerIds={teamBPlayerIds}
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

// Helper function to format timestamp as MM:SS.mmm
function formatTimestamp(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis}`;
}

// Detailed view for a selected round
function RoundDetails({
  round,
  teamAName,
  teamBName,
  playerNames,
  playerAgents,
  teamAPlayerIds,
  teamBPlayerIds,
}: {
  round: EnhancedRoundInfo;
  teamAName: string;
  teamBName: string;
  playerNames: Record<string, string>;
  playerAgents: Record<string, string>;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
}) {
  const [showDamageTimeline, setShowDamageTimeline] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [showBuyPhase, setShowBuyPhase] = useState(false);
  const teamAWon = round.winner === 'teamA';

  // Check if we have new timeline data
  const hasNewTimeline = round.timeline && round.timeline.length > 0;
  const hasBuyPhase = round.buyPhase !== undefined;

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

        {/* Buy Phase Button */}
        {hasBuyPhase && (
          <div className="pt-2">
            <button
              onClick={() => setShowBuyPhase(!showBuyPhase)}
              className="flex items-center gap-2 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded transition-colors"
            >
              <span>💰</span>
              <span>{showBuyPhase ? 'Hide' : 'Show'} Buy Phase</span>
            </button>
          </div>
        )}

        {/* Full Timeline Button */}
        {hasNewTimeline && (
          <div className="pt-2">
            <button
              onClick={() => setShowFullTimeline(!showFullTimeline)}
              className="flex items-center gap-2 text-sm bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded transition-colors"
            >
              <span>📋</span>
              <span>{showFullTimeline ? 'Hide' : 'Show'} Full Timeline</span>
              <span className="text-vct-gray">({round.timeline!.length} events)</span>
            </button>
          </div>
        )}

        {/* Damage Timeline Button (Legacy) */}
        {round.damageEvents && round.damageEvents.events.length > 0 && !hasNewTimeline && (
          <div className="pt-2">
            <button
              onClick={() => setShowDamageTimeline(!showDamageTimeline)}
              className="flex items-center gap-2 text-sm bg-vct-red/20 hover:bg-vct-red/30 text-vct-red px-3 py-2 rounded transition-colors"
            >
              <span>🔫</span>
              <span>{showDamageTimeline ? 'Hide' : 'Show'} Timeline</span>
              <span className="text-vct-gray">({round.damageEvents.allEvents?.length || 0} events)</span>
            </button>
          </div>
        )}
      </div>

      {/* Buy Phase Display */}
      {showBuyPhase && hasBuyPhase && (
        <div className="mt-4 pt-4 border-t border-vct-gray/20">
          <BuyPhaseDisplay
            buyPhase={round.buyPhase!}
            teamAName={teamAName}
            teamBName={teamBName}
            teamAPlayerIds={teamAPlayerIds}
            teamBPlayerIds={teamBPlayerIds}
          />
        </div>
      )}

      {/* Full Timeline Display */}
      {showFullTimeline && hasNewTimeline && (
        <div className="mt-4 pt-4 border-t border-vct-gray/20">
          <FullTimelineDisplay
            timeline={round.timeline!}
            playerNames={playerNames}
          />
        </div>
      )}

      {/* Damage Timeline */}
      {showDamageTimeline && round.damageEvents && (
        <div className="mt-4 pt-4 border-t border-vct-gray/20">
          <DamageTimeline
            damageEvents={round.damageEvents}
            playerNames={playerNames}
            playerAgents={playerAgents}
            teams={{
              teamA: { players: teamAPlayerIds, name: teamAName },
              teamB: { players: teamBPlayerIds, name: teamBName },
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

// Buy Phase Display Component
function BuyPhaseDisplay({
  buyPhase,
  teamAName,
  teamBName,
  teamAPlayerIds,
  teamBPlayerIds,
}: {
  buyPhase: import('../../types/round-simulation').BuyPhaseResult;
  teamAName: string;
  teamBName: string;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
}) {
  // Separate entries by team
  const teamAEntries = buyPhase.attackerEntries.filter(e => teamAPlayerIds.includes(e.playerId));
  const teamBEntries = buyPhase.defenderEntries.filter(e => teamBPlayerIds.includes(e.playerId));

  // If teams are swapped in the buy phase
  const attackerIsTeamA = teamAEntries.length > 0;
  const attackerEntries = attackerIsTeamA ? teamAEntries : teamBEntries;
  const defenderEntries = attackerIsTeamA ? teamBEntries : teamAEntries;
  const attackerName = attackerIsTeamA ? teamAName : teamBName;
  const defenderName = attackerIsTeamA ? teamBName : teamAName;

  return (
    <div className="space-y-4">
      <h5 className="font-semibold text-vct-light">Buy Phase Summary</h5>

      <div className="grid grid-cols-2 gap-4">
        {/* Attackers */}
        <div>
          <div className="text-sm font-medium text-orange-400 mb-2">
            {attackerName} (Attack) - {BUY_TYPE_LABELS[buyPhase.attackerBuyType]}
          </div>
          <div className="space-y-1">
            {attackerEntries.map((entry) => (
              <BuyPhasePlayerEntry key={entry.playerId} entry={entry} />
            ))}
          </div>
          <div className="text-xs text-vct-gray mt-2">
            Total Spend: ${buyPhase.attackerTotalSpend}
          </div>
        </div>

        {/* Defenders */}
        <div>
          <div className="text-sm font-medium text-blue-400 mb-2">
            {defenderName} (Defense) - {BUY_TYPE_LABELS[buyPhase.defenderBuyType]}
          </div>
          <div className="space-y-1">
            {defenderEntries.map((entry) => (
              <BuyPhasePlayerEntry key={entry.playerId} entry={entry} />
            ))}
          </div>
          <div className="text-xs text-vct-gray mt-2">
            Total Spend: ${buyPhase.defenderTotalSpend}
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual buy phase player entry
function BuyPhasePlayerEntry({ entry }: { entry: BuyPhaseEntry }) {
  return (
    <div className="bg-vct-dark/50 rounded px-2 py-1 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-vct-light">{entry.playerName}</span>
        <span className="text-vct-gray">${entry.creditsSpent}</span>
      </div>
      <div className="text-vct-gray flex gap-2 mt-0.5">
        {entry.weaponPurchased && <span>🔫 {entry.weaponPurchased}</span>}
        {entry.shieldPurchased && entry.shieldPurchased !== 'none' && (
          <span>🛡️ {entry.shieldPurchased}</span>
        )}
        {entry.abilitiesPurchased.length > 0 && (
          <span>⚡ {entry.abilitiesPurchased.length}</span>
        )}
      </div>
    </div>
  );
}

// Full Timeline Display Component
function FullTimelineDisplay({
  timeline,
  playerNames,
}: {
  timeline: TimelineEvent[];
  playerNames: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      <h5 className="font-semibold text-vct-light">Round Timeline</h5>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {timeline.map((event, index) => (
          <TimelineEventRow
            key={event.id || index}
            event={event}
            playerNames={playerNames}
          />
        ))}
      </div>
    </div>
  );
}

// Individual timeline event row
function TimelineEventRow({
  event,
  playerNames,
}: {
  event: TimelineEvent;
  playerNames: Record<string, string>;
}) {
  const getPlayerName = (playerId: string) => playerNames[playerId] || playerId;

  switch (event.type) {
    case 'damage': {
      const damageEvent = event as SimDamageEvent;
      const hits = damageEvent.hits;
      const hitLocations = hits.map(h => h.location).join(', ');
      return (
        <div className="bg-vct-dark/30 rounded px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
              <span className="text-red-400">💥 Damage</span>
            </div>
            <span className="text-orange-400 font-mono">{damageEvent.totalDamage} HP</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(damageEvent.attackerId)}</span>
            {' → '}
            <span className="text-vct-light">{getPlayerName(damageEvent.defenderId)}</span>
            <span className="ml-2">({hitLocations})</span>
            {damageEvent.weapon && <span className="ml-2">with {damageEvent.weapon}</span>}
          </div>
          {hits.length > 0 && (
            <div className="mt-1 text-[10px] text-vct-gray/70">
              {hits.map((hit, i) => (
                <div key={i}>
                  {hit.location}: {hit.baseDamage} dmg
                  {hit.shieldAbsorbed > 0 && ` (${hit.shieldAbsorbed} shield)`}
                  {' → '}{hit.hpDamage} HP
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'kill': {
      const killEvent = event as SimKillEvent;
      return (
        <div className="bg-red-500/10 rounded px-3 py-2 text-xs border-l-2 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
              <span className="text-red-400">💀 Kill</span>
              {killEvent.isHeadshot && <span className="text-yellow-400">🎯</span>}
            </div>
          </div>
          <div className="mt-1">
            <span className="text-vct-light">{getPlayerName(killEvent.killerId)}</span>
            <span className="text-red-400"> killed </span>
            <span className="text-vct-light">{getPlayerName(killEvent.victimId)}</span>
            <span className="text-vct-gray ml-2">with {killEvent.weapon}</span>
          </div>
        </div>
      );
    }

    case 'trade_kill': {
      const tradeEvent = event as TradeKillEvent;
      return (
        <div className="bg-orange-500/10 rounded px-3 py-2 text-xs border-l-2 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
              <span className="text-orange-400">⚡ Trade Kill</span>
              {tradeEvent.isHeadshot && <span className="text-yellow-400">🎯</span>}
            </div>
            <span className="text-vct-gray text-[10px]">+{tradeEvent.tradeWindow}ms</span>
          </div>
          <div className="mt-1">
            <span className="text-vct-light">{getPlayerName(tradeEvent.killerId)}</span>
            <span className="text-orange-400"> traded </span>
            <span className="text-vct-light">{getPlayerName(tradeEvent.victimId)}</span>
          </div>
        </div>
      );
    }

    case 'plant_start': {
      const plantStart = event as PlantStartEvent;
      return (
        <div className="bg-yellow-500/10 rounded px-3 py-2 text-xs border-l-2 border-yellow-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-yellow-400">🔧 Plant Started</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(plantStart.planterId)}</span>
            {' on site '}<span className="text-yellow-400">{plantStart.site}</span>
          </div>
        </div>
      );
    }

    case 'plant_interrupt': {
      const plantInterrupt = event as PlantInterruptEvent;
      return (
        <div className="bg-red-500/10 rounded px-3 py-2 text-xs border-l-2 border-red-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-red-400">⚠️ Plant Interrupted</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(plantInterrupt.planterId)}</span>
            {' ('}{plantInterrupt.reason}{', '}{plantInterrupt.progress.toFixed(0)}% complete)
          </div>
        </div>
      );
    }

    case 'plant_complete': {
      const plantComplete = event as PlantCompleteEvent;
      return (
        <div className="bg-orange-500/20 rounded px-3 py-2 text-xs border-l-2 border-orange-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-orange-400">💣 Spike Planted</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(plantComplete.planterId)}</span>
            {' on site '}<span className="text-orange-400">{plantComplete.site}</span>
          </div>
        </div>
      );
    }

    case 'defuse_start': {
      const defuseStart = event as DefuseStartEvent;
      return (
        <div className="bg-blue-500/10 rounded px-3 py-2 text-xs border-l-2 border-blue-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-blue-400">🔧 Defuse Started</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(defuseStart.defuserId)}</span>
          </div>
        </div>
      );
    }

    case 'defuse_interrupt': {
      const defuseInterrupt = event as DefuseInterruptEvent;
      return (
        <div className="bg-red-500/10 rounded px-3 py-2 text-xs border-l-2 border-red-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-red-400">⚠️ Defuse Interrupted</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(defuseInterrupt.defuserId)}</span>
            {' ('}{defuseInterrupt.reason}{', '}{defuseInterrupt.progress.toFixed(0)}% complete)
          </div>
        </div>
      );
    }

    case 'defuse_complete': {
      const defuseComplete = event as DefuseCompleteEvent;
      return (
        <div className="bg-blue-500/20 rounded px-3 py-2 text-xs border-l-2 border-blue-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-blue-400">🛡️ Spike Defused</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(defuseComplete.defuserId)}</span>
          </div>
        </div>
      );
    }

    case 'spike_drop': {
      const spikeDrop = event as SpikeDropEvent;
      return (
        <div className="bg-gray-500/10 rounded px-3 py-2 text-xs border-l-2 border-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-gray-400">📍 Spike Dropped</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(spikeDrop.dropperId)}</span>
          </div>
        </div>
      );
    }

    case 'spike_pickup': {
      const spikePickup = event as SpikePickupEvent;
      return (
        <div className="bg-green-500/10 rounded px-3 py-2 text-xs border-l-2 border-green-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-green-400">📍 Spike Picked Up</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(spikePickup.pickerId)}</span>
          </div>
        </div>
      );
    }

    case 'ability_use': {
      const abilityEvent = event as AbilityUseEvent;
      return (
        <div className="bg-purple-500/10 rounded px-3 py-2 text-xs border-l-2 border-purple-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-purple-400">
              {abilityEvent.slot === 'ultimate' ? '⭐' : '⚡'} Ability
            </span>
          </div>
          <div className="mt-1">
            <span className="text-vct-light">{getPlayerName(abilityEvent.playerId)}</span>
            <span className="text-vct-gray"> used </span>
            <span className="text-purple-400">{abilityEvent.abilityName}</span>
            <span className="text-vct-gray text-[10px] ml-2">({abilityEvent.agentId})</span>
          </div>
        </div>
      );
    }

    case 'heal': {
      const healEvent = event as HealEvent;
      return (
        <div className="bg-green-500/10 rounded px-3 py-2 text-xs border-l-2 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
              <span className="text-green-400">💚 Heal</span>
            </div>
            <span className="text-green-400 font-mono">+{healEvent.amount} HP</span>
          </div>
          <div className="mt-1 text-vct-gray">
            <span className="text-vct-light">{getPlayerName(healEvent.healerId)}</span>
            {' healed '}
            <span className="text-vct-light">{getPlayerName(healEvent.targetId)}</span>
          </div>
        </div>
      );
    }

    case 'round_end': {
      return (
        <div className="bg-vct-red/20 rounded px-3 py-2 text-xs border-l-2 border-vct-red">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-vct-red font-semibold">🏁 Round End</span>
          </div>
        </div>
      );
    }

    case 'spike_detonation': {
      return (
        <div className="bg-orange-500/20 rounded px-3 py-2 text-xs border-l-2 border-orange-500">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(event.timestamp)}</span>
            <span className="text-orange-400">💥 Spike Detonated</span>
          </div>
        </div>
      );
    }

    default: {
      // This should never happen if all event types are handled
      const unknownEvent = event as { timestamp: number; type: string };
      return (
        <div className="bg-vct-dark/30 rounded px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-vct-gray">{formatTimestamp(unknownEvent.timestamp)}</span>
            <span className="text-vct-gray">Unknown event: {unknownEvent.type}</span>
          </div>
        </div>
      );
    }
  }
}
