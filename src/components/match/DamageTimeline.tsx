import { useState, useMemo } from 'react';
import type { DamageEvent, RoundDamageEvents } from '../../types';
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

export function DamageTimeline({ 
  damageEvents, 
  playerNames, 
  playerAgents, 
  teams 
}: DamageTimelineProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);

  // Group events by time for better visualization
  const eventsByTime = useMemo(() => {
    const grouped = new Map<number, DamageEvent[]>();
    
    // Filter events based on current filters
    let filteredEvents = [...damageEvents.events];
    
    if (selectedPlayer) {
      filteredEvents = filteredEvents.filter(event => 
        event.dealerId === selectedPlayer || event.victimId === selectedPlayer
      );
    }
    
    if (selectedWeapon) {
      filteredEvents = filteredEvents.filter(event => 
        event.weapon === selectedWeapon
      );
    }
    
    // Group by timestamp (rounded to nearest second)
    filteredEvents.forEach(event => {
      const timeKey = Math.floor(event.timestamp / 1000); // Convert ms to seconds
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
  }, [damageEvents, selectedPlayer, selectedWeapon]);

  const maxTime = Math.max(...damageEvents.events.map(e => e.timestamp / 1000), 0);
  const availablePlayers = useMemo(() => {
    return [...teams.teamA.players, ...teams.teamB.players];
  }, [teams]);

  const availableWeapons = useMemo(() => {
    const weapons = new Set<string>();
    damageEvents.events.forEach(event => {
      if (event.weapon) {
        weapons.add(event.weapon);
      }
    });
    return Array.from(weapons).sort();
  }, [damageEvents]);

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
          <label className="text-vct-gray text-sm">Filter Weapon:</label>
          <select
            value={selectedWeapon || ''}
            onChange={(e) => setSelectedWeapon(e.target.value || null)}
            className="bg-vct-darker text-white px-2 py-1 rounded text-sm"
          >
            <option value="">All Weapons</option>
            {availableWeapons.map(weapon => (
              <option key={weapon} value={weapon}>{weapon}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Damage Timeline */}
      <div className="space-y-3">
        <h3 className="text-vct-light font-semibold">Damage Timeline</h3>
        {eventsByTime.size === 0 ? (
          <div className="text-vct-gray text-center py-8">
            No damage events match the current filters
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
                      <DamageEventCard
                        key={event.id}
                        event={event}
                        sourcePlayerName={playerNames[event.dealerId] || event.dealerId}
                        targetPlayerName={playerNames[event.victimId] || event.victimId}
                        sourceAgent={playerAgents[event.dealerId]}
                        targetAgent={playerAgents[event.victimId]}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-vct-gray">Total Damage Events</div>
            <div className="text-white font-semibold">
              {damageEvents.events.length}
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
            <div className="text-vct-gray">Unique Players</div>
            <div className="text-white font-semibold">
              {availablePlayers.length}
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