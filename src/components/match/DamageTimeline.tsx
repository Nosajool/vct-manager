import { useState, useMemo } from 'react';
import type { RoundDamageEvents, RoundEvent, KillEvent, PlantEvent, DefuseEvent } from '../../types';
import { DamageEventCard } from './DamageEventCard';

interface DamageTimelineProps {
  damageEvents: RoundDamageEvents;
  playerNames: Record<string, string>;
  playerAgents: Record<string, string>;
  teams: {
    teamA: { players: string[]; name: string };
    teamB: { players: string[]; name: string };
  };
}

// Kill Event Card Component
function KillEventCard({
  event,
  killerName,
  victimName,
  killerAgent,
  victimAgent,
}: {
  event: KillEvent;
  killerName: string;
  victimName: string;
  killerAgent?: string;
  victimAgent?: string;
}) {
  return (
    <div className="bg-red-900/30 p-2 rounded border border-red-500/30 hover:border-red-500/50 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">💀</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-medium">{killerName}</span>
            {killerAgent && <span className="text-vct-gray text-xs">({killerAgent})</span>}
            <span className="text-red-400 font-bold">KILLED</span>
            <span className="text-red-300 font-medium">{victimName}</span>
            {victimAgent && <span className="text-vct-gray text-xs">({victimAgent})</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-vct-gray mt-1">
            <span>{event.weapon}</span>
            <span className="text-red-300">{event.damage} damage</span>
            {event.isHeadshot && (
              <span className="text-yellow-400 font-semibold">HEADSHOT</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Plant Event Card Component
function PlantEventCard({
  event,
  planterName,
  planterAgent,
}: {
  event: PlantEvent;
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

// Defuse Event Card Component
function DefuseEventCard({
  defuserName,
  defuserAgent,
}: {
  event: DefuseEvent;
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

// Render event based on type
function RoundEventCard({
  event,
  playerNames,
  playerAgents,
}: {
  event: RoundEvent;
  playerNames: Record<string, string>;
  playerAgents: Record<string, string>;
}) {
  switch (event.type) {
    case 'damage':
      return (
        <DamageEventCard
          event={event}
          sourcePlayerName={playerNames[event.dealerId] || event.dealerId}
          targetPlayerName={playerNames[event.victimId] || event.victimId}
          sourceAgent={playerAgents[event.dealerId]}
          targetAgent={playerAgents[event.victimId]}
        />
      );
    case 'kill':
      return (
        <KillEventCard
          event={event}
          killerName={playerNames[event.killerId] || event.killerId}
          victimName={playerNames[event.victimId] || event.victimId}
          killerAgent={playerAgents[event.killerId]}
          victimAgent={playerAgents[event.victimId]}
        />
      );
    case 'plant':
      return (
        <PlantEventCard
          event={event}
          planterName={playerNames[event.planterId] || event.planterId}
          planterAgent={playerAgents[event.planterId]}
        />
      );
    case 'defuse':
      return (
        <DefuseEventCard
          event={event}
          defuserName={playerNames[event.defuserId] || event.defuserId}
          defuserAgent={playerAgents[event.defuserId]}
        />
      );
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

  // Use allEvents if available, otherwise fall back to damage events only
  const allEvents = useMemo(() => {
    if (damageEvents.allEvents && damageEvents.allEvents.length > 0) {
      return damageEvents.allEvents;
    }
    // Fall back to damage events with type discriminator
    return damageEvents.events.map(e => ({ ...e, type: 'damage' as const }));
  }, [damageEvents]);

  // Group events by time for better visualization
  const eventsByTime = useMemo(() => {
    const grouped = new Map<number, RoundEvent[]>();

    // Filter events based on current filters
    let filteredEvents = [...allEvents];

    if (selectedPlayer) {
      filteredEvents = filteredEvents.filter(event => {
        switch (event.type) {
          case 'damage':
            return event.dealerId === selectedPlayer || event.victimId === selectedPlayer;
          case 'kill':
            return event.killerId === selectedPlayer || event.victimId === selectedPlayer;
          case 'plant':
            return event.planterId === selectedPlayer;
          case 'defuse':
            return event.defuserId === selectedPlayer;
          default:
            return true;
        }
      });
    }

    if (selectedEventType !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.type === selectedEventType);
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
    const counts = { damage: 0, kill: 0, plant: 0, defuse: 0 };
    allEvents.forEach(event => {
      counts[event.type]++;
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
            <option value="plant">Plants ({eventCounts.plant})</option>
            <option value="defuse">Defuses ({eventCounts.defuse})</option>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
            <div className="text-vct-gray">Total Damage</div>
            <div className="text-white font-semibold">
              {damageEvents.events
                .reduce((sum, event) => sum + event.finalDamage, 0)}
            </div>
          </div>
          <div>
            <div className="text-vct-gray">Plants</div>
            <div className="text-orange-400 font-semibold">
              {eventCounts.plant}
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
