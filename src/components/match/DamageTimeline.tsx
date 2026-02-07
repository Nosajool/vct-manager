import { useState, useMemo } from 'react';
import type {
  RoundDamageEvents,
  TimelineEvent,
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
  SpikeDetonationEvent,
  AbilityUseEvent,
  HealEvent
} from '../../types';

interface DamageTimelineProps {
  damageEvents: RoundDamageEvents;
  playerNames: Record<string, string>;
  playerAgents: Record<string, string>;
  teams: {
    teamA: { players: string[]; name: string };
    teamB: { players: string[]; name: string };
  };
}

// Enhanced Damage Event Card Component (with hit breakdown)
function SimDamageEventCard({
  event,
  attackerName,
  defenderName,
  attackerAgent,
  defenderAgent,
}: {
  event: SimDamageEvent;
  attackerName: string;
  defenderName: string;
  attackerAgent?: string;
  defenderAgent?: string;
}) {
  const getSourceIcon = () => {
    switch (event.source) {
      case 'weapon': return '🔫';
      case 'ability': return '⚡';
      case 'melee': return '🗡️';
      case 'utility': return '💨';
      case 'environment': return '🌍';
      default: return '💥';
    }
  };

  // Count hits by location
  const hitCounts = event.hits.reduce((acc, hit) => {
    acc[hit.location] = (acc[hit.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`p-2 rounded border transition-colors ${
      event.isLethal
        ? 'bg-red-900/40 border-red-500/40 hover:border-red-500/60'
        : 'bg-vct-dark border-vct-gray/20 hover:border-vct-red/50'
    }`}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{getSourceIcon()}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-vct-light font-medium">{attackerName}</span>
            {attackerAgent && <span className="text-vct-gray text-xs">({attackerAgent})</span>}
            <span className="text-white">→</span>
            <span className="text-vct-light font-medium">{defenderName}</span>
            {defenderAgent && <span className="text-vct-gray text-xs">({defenderAgent})</span>}
            {event.isLethal && <span className="text-red-400 text-xs font-bold">LETHAL</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-vct-gray mt-1">
            {event.weapon && <span>{event.weapon}</span>}
            {event.ability && <span>• {event.ability}</span>}
            <span>• {Math.round(event.distance)}m</span>
            {/* Hit breakdown */}
            {Object.entries(hitCounts).map(([location, count]) => (
              <span
                key={location}
                className={location === 'head' ? 'text-red-400' : location === 'body' ? 'text-yellow-400' : 'text-green-400'}
              >
                {count}× {location.toUpperCase()}
              </span>
            ))}
          </div>
          {/* Shield info for defender */}
          <div className="flex items-center gap-2 text-xs text-vct-gray mt-0.5">
            <span>HP: {event.defenderHpAfter}</span>
            <span>Shield: {event.defenderShieldAfter}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-semibold">{event.totalDamage}</div>
          <div className="text-xs text-vct-gray">damage</div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Kill Event Card Component
function SimKillEventCard({
  event,
  killerName,
  victimName,
  killerAgent,
  victimAgent,
  isTrade,
}: {
  event: SimKillEvent;
  killerName: string;
  victimName: string;
  killerAgent?: string;
  victimAgent?: string;
  isTrade?: boolean;
}) {
  return (
    <div className={`p-2 rounded border transition-colors ${
      isTrade
        ? 'bg-purple-900/30 border-purple-500/30 hover:border-purple-500/50'
        : 'bg-red-900/30 border-red-500/30 hover:border-red-500/50'
    }`}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{isTrade ? '⚔️' : '💀'}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-medium">{killerName}</span>
            {killerAgent && <span className="text-vct-gray text-xs">({killerAgent})</span>}
            <span className="text-red-400 font-bold">{isTrade ? 'TRADED' : 'KILLED'}</span>
            <span className="text-red-300 font-medium">{victimName}</span>
            {victimAgent && <span className="text-vct-gray text-xs">({victimAgent})</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-vct-gray mt-1">
            <span>{event.weapon}</span>
            {event.ability && <span>• {event.ability}</span>}
            {event.isHeadshot && (
              <span className="text-yellow-400 font-semibold">HEADSHOT</span>
            )}
            {event.assisters.length > 0 && (
              <span>• {event.assisters.length} assist{event.assisters.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Trade Kill Event Card
function TradeKillEventCard({
  event,
  killerName,
  victimName,
  killerAgent,
  victimAgent,
}: {
  event: TradeKillEvent;
  killerName: string;
  victimName: string;
  killerAgent?: string;
  victimAgent?: string;
}) {
  return (
    <div className="bg-purple-900/30 p-2 rounded border border-purple-500/30 hover:border-purple-500/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">⚔️</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-medium">{killerName}</span>
            {killerAgent && <span className="text-vct-gray text-xs">({killerAgent})</span>}
            <span className="text-purple-400 font-bold">TRADED</span>
            <span className="text-red-300 font-medium">{victimName}</span>
            {victimAgent && <span className="text-vct-gray text-xs">({victimAgent})</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-vct-gray mt-1">
            <span>{event.weapon}</span>
            <span className="text-purple-300">• Trade window: {Math.round(event.tradeWindow)}ms</span>
            {event.isHeadshot && (
              <span className="text-yellow-400 font-semibold">HEADSHOT</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Plant Start Event Card
function PlantStartEventCard({
  event,
  planterName,
  planterAgent,
}: {
  event: PlantStartEvent;
  planterName: string;
  planterAgent?: string;
}) {
  return (
    <div className="bg-orange-900/20 p-2 rounded border border-orange-500/20 hover:border-orange-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">⏳</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-medium">{planterName}</span>
            {planterAgent && <span className="text-vct-gray text-xs">({planterAgent})</span>}
            <span className="text-orange-300">started planting</span>
            <span className="text-orange-200">Site {event.site}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plant Interrupt Event Card
function PlantInterruptEventCard({
  event,
  planterName,
  planterAgent,
}: {
  event: PlantInterruptEvent;
  planterName: string;
  planterAgent?: string;
}) {
  return (
    <div className="bg-red-900/20 p-2 rounded border border-red-500/20 hover:border-red-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">⛔</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-medium">{planterName}</span>
            {planterAgent && <span className="text-vct-gray text-xs">({planterAgent})</span>}
            <span className="text-red-300">plant interrupted</span>
            <span className="text-red-200">({event.reason})</span>
          </div>
          <div className="text-xs text-vct-gray mt-1">
            Site {event.site} • {event.progress.toFixed(0)}% progress
          </div>
        </div>
      </div>
    </div>
  );
}

// Plant Complete Event Card
function PlantCompleteEventCard({
  event,
  planterName,
  planterAgent,
}: {
  event: PlantCompleteEvent;
  planterName: string;
  planterAgent?: string;
}) {
  return (
    <div className="bg-orange-900/30 p-2 rounded border border-orange-500/30 hover:border-orange-500/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">💣</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-medium">{planterName}</span>
            {planterAgent && <span className="text-vct-gray text-xs">({planterAgent})</span>}
            <span className="text-orange-300 font-bold">PLANTED SPIKE</span>
            <span className="text-orange-200">Site {event.site}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Defuse Start Event Card
function DefuseStartEventCard({
  defuserName,
  defuserAgent,
}: {
  event: DefuseStartEvent;
  defuserName: string;
  defuserAgent?: string;
}) {
  return (
    <div className="bg-blue-900/20 p-2 rounded border border-blue-500/20 hover:border-blue-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">⏳</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-medium">{defuserName}</span>
            {defuserAgent && <span className="text-vct-gray text-xs">({defuserAgent})</span>}
            <span className="text-blue-300">started defusing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Defuse Interrupt Event Card
function DefuseInterruptEventCard({
  event,
  defuserName,
  defuserAgent,
}: {
  event: DefuseInterruptEvent;
  defuserName: string;
  defuserAgent?: string;
}) {
  return (
    <div className="bg-red-900/20 p-2 rounded border border-red-500/20 hover:border-red-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">⛔</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-medium">{defuserName}</span>
            {defuserAgent && <span className="text-vct-gray text-xs">({defuserAgent})</span>}
            <span className="text-red-300">defuse interrupted</span>
            <span className="text-red-200">({event.reason})</span>
          </div>
          <div className="text-xs text-vct-gray mt-1">
            {event.progress.toFixed(0)}% progress
          </div>
        </div>
      </div>
    </div>
  );
}

// Defuse Complete Event Card
function DefuseCompleteEventCard({
  defuserName,
  defuserAgent,
}: {
  event: DefuseCompleteEvent;
  defuserName: string;
  defuserAgent?: string;
}) {
  return (
    <div className="bg-blue-900/30 p-2 rounded border border-blue-500/30 hover:border-blue-500/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">🛡️</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-medium">{defuserName}</span>
            {defuserAgent && <span className="text-vct-gray text-xs">({defuserAgent})</span>}
            <span className="text-blue-300 font-bold">DEFUSED SPIKE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Spike Drop Event Card
function SpikeDropEventCard({
  event,
  dropperName,
  dropperAgent,
}: {
  event: SpikeDropEvent;
  dropperName: string;
  dropperAgent?: string;
}) {
  return (
    <div className="bg-yellow-900/20 p-2 rounded border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">📍</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-medium">{dropperName}</span>
            {dropperAgent && <span className="text-vct-gray text-xs">({dropperAgent})</span>}
            <span className="text-yellow-300">dropped spike</span>
          </div>
          {event.location.area && (
            <div className="text-xs text-vct-gray mt-1">
              Location: {event.location.area}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Spike Pickup Event Card
function SpikePickupEventCard({
  event,
  pickerName,
  pickerAgent,
}: {
  event: SpikePickupEvent;
  pickerName: string;
  pickerAgent?: string;
}) {
  return (
    <div className="bg-green-900/20 p-2 rounded border border-green-500/20 hover:border-green-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">📦</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-medium">{pickerName}</span>
            {pickerAgent && <span className="text-vct-gray text-xs">({pickerAgent})</span>}
            <span className="text-green-300">picked up spike</span>
          </div>
          {event.location.area && (
            <div className="text-xs text-vct-gray mt-1">
              Location: {event.location.area}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Spike Detonation Event Card
function SpikeDetonationEventCard({
  event,
}: {
  event: SpikeDetonationEvent;
}) {
  return (
    <div className="bg-red-900/40 p-2 rounded border border-red-500/50 hover:border-red-500/70 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">💥</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold">SPIKE DETONATED</span>
            <span className="text-red-200">Site {event.site}</span>
          </div>
          {event.casualties.length > 0 && (
            <div className="text-xs text-vct-gray mt-1">
              Casualties: {event.casualties.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ability Use Event Card
function AbilityUseEventCard({
  event,
  playerName,
  playerAgent,
}: {
  event: AbilityUseEvent;
  playerName: string;
  playerAgent?: string;
}) {
  return (
    <div className="bg-purple-900/20 p-2 rounded border border-purple-500/20 hover:border-purple-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">⚡</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-medium">{playerName}</span>
            {playerAgent && <span className="text-vct-gray text-xs">({playerAgent})</span>}
            <span className="text-purple-300">used</span>
            <span className="text-purple-200 font-semibold">{event.abilityName}</span>
          </div>
          {event.targets && event.targets.length > 0 && (
            <div className="text-xs text-vct-gray mt-1">
              Targets: {event.targets.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Heal Event Card
function HealEventCard({
  event,
  healerName,
  targetName,
  healerAgent,
  targetAgent,
}: {
  event: HealEvent;
  healerName: string;
  targetName: string;
  healerAgent?: string;
  targetAgent?: string;
}) {
  return (
    <div className="bg-green-900/20 p-2 rounded border border-green-500/20 hover:border-green-500/40 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">💚</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-medium">{healerName}</span>
            {healerAgent && <span className="text-vct-gray text-xs">({healerAgent})</span>}
            <span className="text-green-300">healed</span>
            <span className="text-green-200 font-medium">{targetName}</span>
            {targetAgent && <span className="text-vct-gray text-xs">({targetAgent})</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-vct-gray mt-1">
            <span className="text-green-400">+{event.amount} HP</span>
            <span>• HP after: {event.targetHpAfter}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render event based on type
function RoundEventCard({
  event,
  playerNames,
  playerAgents,
}: {
  event: TimelineEvent;
  playerNames: Record<string, string>;
  playerAgents: Record<string, string>;
}) {
  switch (event.type) {
    case 'damage':
      return (
        <SimDamageEventCard
          event={event}
          attackerName={playerNames[event.attackerId] || event.attackerId}
          defenderName={playerNames[event.defenderId] || event.defenderId}
          attackerAgent={playerAgents[event.attackerId]}
          defenderAgent={playerAgents[event.defenderId]}
        />
      );
    case 'kill':
      return (
        <SimKillEventCard
          event={event}
          killerName={playerNames[event.killerId] || event.killerId}
          victimName={playerNames[event.victimId] || event.victimId}
          killerAgent={playerAgents[event.killerId]}
          victimAgent={playerAgents[event.victimId]}
        />
      );
    case 'trade_kill':
      return (
        <TradeKillEventCard
          event={event}
          killerName={playerNames[event.killerId] || event.killerId}
          victimName={playerNames[event.victimId] || event.victimId}
          killerAgent={playerAgents[event.killerId]}
          victimAgent={playerAgents[event.victimId]}
        />
      );
    case 'plant_start':
      return (
        <PlantStartEventCard
          event={event}
          planterName={playerNames[event.planterId] || event.planterId}
          planterAgent={playerAgents[event.planterId]}
        />
      );
    case 'plant_interrupt':
      return (
        <PlantInterruptEventCard
          event={event}
          planterName={playerNames[event.planterId] || event.planterId}
          planterAgent={playerAgents[event.planterId]}
        />
      );
    case 'plant_complete':
      return (
        <PlantCompleteEventCard
          event={event}
          planterName={playerNames[event.planterId] || event.planterId}
          planterAgent={playerAgents[event.planterId]}
        />
      );
    case 'defuse_start':
      return (
        <DefuseStartEventCard
          event={event}
          defuserName={playerNames[event.defuserId] || event.defuserId}
          defuserAgent={playerAgents[event.defuserId]}
        />
      );
    case 'defuse_interrupt':
      return (
        <DefuseInterruptEventCard
          event={event}
          defuserName={playerNames[event.defuserId] || event.defuserId}
          defuserAgent={playerAgents[event.defuserId]}
        />
      );
    case 'defuse_complete':
      return (
        <DefuseCompleteEventCard
          event={event}
          defuserName={playerNames[event.defuserId] || event.defuserId}
          defuserAgent={playerAgents[event.defuserId]}
        />
      );
    case 'spike_drop':
      return (
        <SpikeDropEventCard
          event={event}
          dropperName={playerNames[event.dropperId] || event.dropperId}
          dropperAgent={playerAgents[event.dropperId]}
        />
      );
    case 'spike_pickup':
      return (
        <SpikePickupEventCard
          event={event}
          pickerName={playerNames[event.pickerId] || event.pickerId}
          pickerAgent={playerAgents[event.pickerId]}
        />
      );
    case 'spike_detonation':
      return (
        <SpikeDetonationEventCard
          event={event}
        />
      );
    case 'ability_use':
      return (
        <AbilityUseEventCard
          event={event}
          playerName={playerNames[event.playerId] || event.playerId}
          playerAgent={playerAgents[event.playerId]}
        />
      );
    case 'heal':
      return (
        <HealEventCard
          event={event}
          healerName={playerNames[event.healerId] || event.healerId}
          targetName={playerNames[event.targetId] || event.targetId}
          healerAgent={playerAgents[event.healerId]}
          targetAgent={playerAgents[event.targetId]}
        />
      );
    case 'round_end':
      return null;
    default:
      return null;
  }
}

export function DamageTimeline({
  damageEvents,
  playerNames,
  playerAgents,
  teams
}: DamageTimelineProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  // Use timeline events from allEvents
  const allEvents = useMemo(() => {
    return damageEvents.allEvents || [];
  }, [damageEvents]);

  // Group events by time for better visualization
  const eventsByTime = useMemo(() => {
    const grouped = new Map<number, TimelineEvent[]>();

    // Filter events based on current filters
    let filteredEvents = [...allEvents];

    if (selectedPlayer) {
      filteredEvents = filteredEvents.filter(event => {
        switch (event.type) {
          case 'damage':
            return event.attackerId === selectedPlayer || event.defenderId === selectedPlayer;
          case 'kill':
          case 'trade_kill':
            return event.killerId === selectedPlayer || event.victimId === selectedPlayer;
          case 'plant_start':
          case 'plant_interrupt':
          case 'plant_complete':
            return event.planterId === selectedPlayer;
          case 'defuse_start':
          case 'defuse_interrupt':
          case 'defuse_complete':
            return event.defuserId === selectedPlayer;
          case 'spike_drop':
            return event.dropperId === selectedPlayer;
          case 'spike_pickup':
            return event.pickerId === selectedPlayer;
          case 'ability_use':
            return event.playerId === selectedPlayer;
          case 'heal':
            return event.healerId === selectedPlayer || event.targetId === selectedPlayer;
          default:
            return true;
        }
      });
    }

    if (selectedEventType !== 'all') {
      // Handle grouped event types
      if (selectedEventType === 'plant_events') {
        filteredEvents = filteredEvents.filter(e =>
          e.type === 'plant_start' || e.type === 'plant_interrupt' || e.type === 'plant_complete'
        );
      } else if (selectedEventType === 'defuse_events') {
        filteredEvents = filteredEvents.filter(e =>
          e.type === 'defuse_start' || e.type === 'defuse_interrupt' || e.type === 'defuse_complete'
        );
      } else if (selectedEventType === 'spike_events') {
        filteredEvents = filteredEvents.filter(e =>
          e.type === 'spike_drop' || e.type === 'spike_pickup' || e.type === 'spike_detonation'
        );
      } else {
        filteredEvents = filteredEvents.filter(event => event.type === selectedEventType);
      }
    }

    // Group by timestamp (rounded to nearest second)
    filteredEvents.forEach(event => {
      const timeKey = Math.floor(event.timestamp / 1000);
      if (!grouped.has(timeKey)) {
        grouped.set(timeKey, []);
      }
      grouped.get(timeKey)!.push(event);
    });

    // Sort events within each time group
    grouped.forEach(events => {
      events.sort((a, b) => a.timestamp - b.timestamp);
    });

    return grouped;
  }, [allEvents, selectedPlayer, selectedEventType]);

  const maxTime = Math.max(...allEvents.map(e => e.timestamp / 1000), 0);
  const availablePlayers = useMemo(() => {
    return [...teams.teamA.players, ...teams.teamB.players];
  }, [teams]);

  // Count events by type
  const eventCounts = useMemo(() => {
    const counts = {
      damage: 0,
      kill: 0,
      trade_kill: 0,
      plant_events: 0,
      defuse_events: 0,
      spike_events: 0,
      ability_use: 0,
      heal: 0,
    };

    allEvents.forEach(event => {
      switch (event.type) {
        case 'damage':
          counts.damage++;
          break;
        case 'kill':
          counts.kill++;
          break;
        case 'trade_kill':
          counts.trade_kill++;
          break;
        case 'plant_start':
        case 'plant_interrupt':
        case 'plant_complete':
          counts.plant_events++;
          break;
        case 'defuse_start':
        case 'defuse_interrupt':
        case 'defuse_complete':
          counts.defuse_events++;
          break;
        case 'spike_drop':
        case 'spike_pickup':
        case 'spike_detonation':
          counts.spike_events++;
          break;
        case 'ability_use':
          counts.ability_use++;
          break;
        case 'heal':
          counts.heal++;
          break;
      }
    });
    return counts;
  }, [allEvents]);

  return (
    <div className="bg-vct-darker rounded-lg p-4 space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center bg-vct-dark p-3 rounded">
        <div className="flex items-center gap-2">
          <label className="text-vct-gray text-sm">Filter Player:</label>
          <select
            value={selectedPlayer || ''}
            onChange={(e) => setSelectedPlayer(e.target.value || null)}
            className="bg-vct-darker text-white px-2 py-1 rounded text-sm"
          >
            <option value="">All Players</option>
            {availablePlayers.map(playerId => (
              <option key={playerId} value={playerId}>
                {playerNames[playerId] || playerId}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-vct-gray text-sm">Event Type:</label>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-vct-darker text-white px-2 py-1 rounded text-sm"
          >
            <option value="all">All Events ({allEvents.length})</option>
            <option value="damage">Damage ({eventCounts.damage})</option>
            <option value="kill">Kills ({eventCounts.kill})</option>
            <option value="trade_kill">Trade Kills ({eventCounts.trade_kill})</option>
            <option value="plant_events">Plant Events ({eventCounts.plant_events})</option>
            <option value="defuse_events">Defuse Events ({eventCounts.defuse_events})</option>
            <option value="spike_events">Spike Events ({eventCounts.spike_events})</option>
            <option value="ability_use">Ability Usage ({eventCounts.ability_use})</option>
            <option value="heal">Heals ({eventCounts.heal})</option>
          </select>
        </div>
      </div>

      {/* Round Event Timeline */}
      <div className="space-y-3">
        <h3 className="text-vct-light font-semibold">Round Event Timeline</h3>
        {eventsByTime.size === 0 ? (
          <div className="text-vct-gray text-center py-8">
            No events match the current filters
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Array.from(eventsByTime.entries())
              .sort(([a], [b]) => a - b)
              .map(([time, events]) => (
                <div key={time} className="border-l-2 border-vct-red pl-4 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-vct-red rounded-full"></div>
                  <div className="text-vct-gray text-sm mb-2">
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="space-y-1">
                    {events.map(event => (
                      <RoundEventCard
                        key={event.id}
                        event={event}
                        playerNames={playerNames}
                        playerAgents={playerAgents}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Round Summary */}
      <div className="bg-vct-dark p-3 rounded">
        <h3 className="text-vct-light font-semibold mb-2">Round Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          <div>
            <div className="text-vct-gray">Total Events</div>
            <div className="text-white font-semibold">
              {allEvents.length}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Kills</div>
            <div className="text-red-400 font-semibold">
              {eventCounts.kill}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Trade Kills</div>
            <div className="text-purple-400 font-semibold">
              {eventCounts.trade_kill}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Total Damage</div>
            <div className="text-white font-semibold">
              {allEvents
                .filter((e): e is SimDamageEvent => e.type === 'damage')
                .reduce((sum, e) => sum + (e as SimDamageEvent).totalDamage, 0)}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Plant Events</div>
            <div className="text-orange-400 font-semibold">
              {eventCounts.plant_events}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Defuse Events</div>
            <div className="text-blue-400 font-semibold">
              {eventCounts.defuse_events}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Spike Events</div>
            <div className="text-yellow-400 font-semibold">
              {eventCounts.spike_events}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Abilities Used</div>
            <div className="text-purple-400 font-semibold">
              {eventCounts.ability_use}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Heals</div>
            <div className="text-green-400 font-semibold">
              {eventCounts.heal}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Round Duration</div>
            <div className="text-white font-semibold">
              {Math.floor(maxTime / 60)}:{(maxTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
