import { DamageTimeline } from './DamageTimeline';
import type { RoundDamageEvents } from '../../types';

// Sample damage events data for testing
const sampleDamageEvents: RoundDamageEvents = {
  events: [
    {
      id: 'damage-1',
      dealerId: 'player-1',
      victimId: 'player-2',
      baseDamage: 40,
      finalDamage: 35,
      hitLocation: 'head',
      source: 'weapon',
      weapon: 'Vandal',
      distance: 25,
      timestamp: 15000,
      armorBreakdown: {
        shieldDamage: 15,
        hpDamage: 20,
        remainingShield: 10,
        remainingHp: 80,
      },
    },
    {
      id: 'damage-2',
      dealerId: 'player-2',
      victimId: 'player-1',
      baseDamage: 30,
      finalDamage: 25,
      hitLocation: 'body',
      source: 'weapon',
      weapon: 'Phantom',
      distance: 35,
      timestamp: 18000,
      armorBreakdown: {
        shieldDamage: 10,
        hpDamage: 15,
        remainingShield: 0,
        remainingHp: 85,
      },
    },
    {
      id: 'damage-3',
      dealerId: 'player-1',
      victimId: 'player-2',
      baseDamage: 160,
      finalDamage: 160,
      hitLocation: 'head',
      source: 'weapon',
      weapon: 'Vandal',
      distance: 20,
      timestamp: 22000,
      armorBreakdown: {
        shieldDamage: 10,
        hpDamage: 150,
        remainingShield: 0,
        remainingHp: 0,
      },
    },
  ],
  totalDamageByPlayer: {
    'player-1': 195,
    'player-2': 25,
  },
  totalDamageReceived: {
    'player-1': 25,
    'player-2': 195,
  },
  damageContributions: {
    'player-1': [],
    'player-2': [],
  },
};

const samplePlayerNames = {
  'player-1': 'AcePlayer',
  'player-2': 'NoobPlayer',
  'player-3': 'SupportPlayer',
};

const samplePlayerAgents = {
  'player-1': 'Jett',
  'player-2': 'Sage',
  'player-3': 'Brimstone',
};

export function DamageTimelineTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Damage Timeline Test</h1>
      <DamageTimeline
        damageEvents={sampleDamageEvents}
        playerNames={samplePlayerNames}
        playerAgents={samplePlayerAgents}
        teams={{
          teamA: { 
            players: ['player-1', 'player-3'], 
            name: 'Team Alpha' 
          },
          teamB: { 
            players: ['player-2'], 
            name: 'Team Beta' 
          },
        }}
      />
    </div>
  );
}