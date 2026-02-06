// SummaryCalculator Tests
// Verifies that summary derivation follows the principle: only derive from timeline

import { describe, it, expect } from 'vitest';
import { SummaryCalculator } from '../SummaryCalculator';
import type {
  TimelineEvent,
  PlayerRoundState,
  SimKillEvent,
  SimDamageEvent,
  RoundEndEvent,
  PlantCompleteEvent,
  DefuseCompleteEvent,
  AbilityUseEvent,
  HealEvent,
} from '../../../types/round-simulation';

describe('SummaryCalculator', () => {
  const calculator = new SummaryCalculator();

  // Helper to create basic player state
  const createPlayerState = (
    id: string,
    name: string,
    teamSide: 'attacker' | 'defender'
  ): PlayerRoundState => ({
    playerId: id,
    playerName: name,
    teamSide,
    state: 'alive',
    hp: 100,
    maxHp: 100,
    shieldHp: 50,
    shieldType: 'heavy',
    regenPool: 0,
    weapon: 'vandal',
    sidearm: 'classic',
    credits: 0,
    creditsSpent: 0,
    agentId: 'Jett',
    agentRole: 'duelist',
    abilities: {
      basic1: 0,
      basic2: 0,
      signature: 1,
      ultimatePoints: 0,
      ultimateRequired: 7,
    },
    killsThisRound: 0,
    damageDealtThisRound: 0,
    damageTakenThisRound: 0,
  });

  describe('deriveFromTimeline', () => {
    it('should derive first blood from timeline', () => {
      const playerStates = new Map([
        ['p1', createPlayerState('p1', 'Player1', 'attacker')],
        ['p2', createPlayerState('p2', 'Player2', 'defender')],
      ]);

      const killEvent: SimKillEvent = {
        id: 'k1',
        type: 'kill',
        timestamp: 5000,
        killerId: 'p1',
        victimId: 'p2',
        weapon: 'vandal',
        isHeadshot: true,
        damageEventId: 'd1',
        assisters: [],
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 10000,
        winner: 'attacker',
        winCondition: 'defenders_eliminated',
        survivors: ['p1'],
      };

      const timeline: TimelineEvent[] = [killEvent, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['p1']),
        teamBPlayerIds: new Set(['p2']),
      });

      expect(summary.firstBlood).toEqual({
        killerId: 'p1',
        killerName: 'Player1',
        victimId: 'p2',
        victimName: 'Player2',
        timestamp: 5000,
        weapon: 'vandal',
      });
      expect(summary.totalKills).toBe(1);
      expect(summary.totalHeadshots).toBe(1);
      expect(summary.headshotPercentage).toBe(100);
    });

    it('should return null for first blood if no kills', () => {
      const playerStates = new Map();
      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 100000,
        winner: 'defender',
        winCondition: 'time_expired',
        survivors: [],
      };

      const summary = calculator.deriveFromTimeline({
        timeline: [roundEndEvent],
        playerStates,
        teamAPlayerIds: new Set(),
        teamBPlayerIds: new Set(),
      });

      expect(summary.firstBlood).toBeNull();
      expect(summary.totalKills).toBe(0);
      expect(summary.totalHeadshots).toBe(0);
    });

    it('should detect spike planted from timeline', () => {
      const playerStates = new Map([
        ['p1', createPlayerState('p1', 'Player1', 'attacker')],
      ]);

      const plantEvent: PlantCompleteEvent = {
        id: 'plant1',
        type: 'plant_complete',
        timestamp: 30000,
        planterId: 'p1',
        site: 'A',
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 75000,
        winner: 'attacker',
        winCondition: 'spike_detonated',
        survivors: [],
      };

      const timeline: TimelineEvent[] = [plantEvent, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['p1']),
        teamBPlayerIds: new Set(),
      });

      expect(summary.spikePlanted).toBe(true);
      expect(summary.plantSite).toBe('A');
      expect(summary.spikeDefused).toBe(false);
      expect(summary.spikeDetonated).toBe(false);
      expect(summary.plantsAttempted).toBe(0); // No plant_start event
    });

    it('should calculate total damage from timeline', () => {
      const playerStates = new Map();

      const damageEvent1: SimDamageEvent = {
        id: 'd1',
        type: 'damage',
        timestamp: 5000,
        attackerId: 'p1',
        defenderId: 'p2',
        source: 'weapon',
        weapon: 'vandal',
        distance: 10,
        hits: [],
        totalDamage: 40,
        defenderHpAfter: 60,
        defenderShieldAfter: 50,
        isLethal: false,
      };

      const damageEvent2: SimDamageEvent = {
        id: 'd2',
        type: 'damage',
        timestamp: 5100,
        attackerId: 'p1',
        defenderId: 'p2',
        source: 'weapon',
        weapon: 'vandal',
        distance: 10,
        hits: [],
        totalDamage: 160,
        defenderHpAfter: 0,
        defenderShieldAfter: 0,
        isLethal: true,
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 10000,
        winner: 'attacker',
        winCondition: 'defenders_eliminated',
        survivors: ['p1'],
      };

      const timeline: TimelineEvent[] = [damageEvent1, damageEvent2, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['p1']),
        teamBPlayerIds: new Set(['p2']),
      });

      expect(summary.totalDamage).toBe(200);
    });

    it('should count abilities and ultimates from timeline', () => {
      const playerStates = new Map();

      const abilityEvent1: AbilityUseEvent = {
        id: 'a1',
        type: 'ability_use',
        timestamp: 3000,
        playerId: 'p1',
        agentId: 'Jett',
        abilityId: 'Jett_E',
        abilityName: 'Tailwind',
        slot: 'signature',
      };

      const abilityEvent2: AbilityUseEvent = {
        id: 'a2',
        type: 'ability_use',
        timestamp: 10000,
        playerId: 'p1',
        agentId: 'Jett',
        abilityId: 'Jett_X',
        abilityName: 'Blade Storm',
        slot: 'ultimate',
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 20000,
        winner: 'attacker',
        winCondition: 'defenders_eliminated',
        survivors: ['p1'],
      };

      const timeline: TimelineEvent[] = [abilityEvent1, abilityEvent2, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['p1']),
        teamBPlayerIds: new Set(),
      });

      expect(summary.abilitiesUsed).toBe(2);
      expect(summary.ultimatesUsed).toBe(1);
    });

    it('should calculate healing from timeline', () => {
      const playerStates = new Map();

      const healEvent1: HealEvent = {
        id: 'h1',
        type: 'heal',
        timestamp: 5000,
        healerId: 'p1',
        targetId: 'p2',
        ability: 'Sage_C',
        amount: 60,
        targetHpAfter: 100,
      };

      const healEvent2: HealEvent = {
        id: 'h2',
        type: 'heal',
        timestamp: 8000,
        healerId: 'p1',
        targetId: 'p1',
        ability: 'Sage_E',
        amount: 60,
        targetHpAfter: 100,
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 10000,
        winner: 'defender',
        winCondition: 'attackers_eliminated',
        survivors: ['p1', 'p2'],
      };

      const timeline: TimelineEvent[] = [healEvent1, healEvent2, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(),
        teamBPlayerIds: new Set(['p1', 'p2']),
      });

      expect(summary.healsApplied).toBe(2);
      expect(summary.totalHealing).toBe(120);
    });

    it('should calculate round duration from last event', () => {
      const playerStates = new Map();

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 45000,
        winner: 'defender',
        winCondition: 'time_expired',
        survivors: [],
      };

      const summary = calculator.deriveFromTimeline({
        timeline: [roundEndEvent],
        playerStates,
        teamAPlayerIds: new Set(),
        teamBPlayerIds: new Set(),
      });

      expect(summary.roundDuration).toBe(45000);
      expect(summary.winCondition).toBe('time_expired');
      expect(summary.winner).toBe('defender');
    });

    it('should throw error if timeline has no round_end event', () => {
      const playerStates = new Map();

      expect(() => {
        calculator.deriveFromTimeline({
          timeline: [],
          playerStates,
          teamAPlayerIds: new Set(),
          teamBPlayerIds: new Set(),
        });
      }).toThrow('Timeline must contain a round_end event');
    });
  });

  describe('clutch detection', () => {
    it('should detect 1v2 clutch situation', () => {
      const playerStates = new Map([
        ['a1', createPlayerState('a1', 'Alice', 'attacker')],
        ['a2', createPlayerState('a2', 'Bob', 'attacker')],
        ['d1', createPlayerState('d1', 'Charlie', 'defender')],
        ['d2', createPlayerState('d2', 'Dave', 'defender')],
      ]);

      // Kill sequence: a2 dies, then a1 (in clutch) kills d1, then d2
      const kill1: SimKillEvent = {
        id: 'k1',
        type: 'kill',
        timestamp: 5000,
        killerId: 'd1',
        victimId: 'a2', // Alice's teammate dies
        weapon: 'vandal',
        isHeadshot: false,
        damageEventId: 'd1',
        assisters: [],
      };

      const kill2: SimKillEvent = {
        id: 'k2',
        type: 'kill',
        timestamp: 8000,
        killerId: 'a1',
        victimId: 'd1', // Alice gets a kill in clutch
        weapon: 'phantom',
        isHeadshot: true,
        damageEventId: 'd2',
        assisters: [],
      };

      const kill3: SimKillEvent = {
        id: 'k3',
        type: 'kill',
        timestamp: 10000,
        killerId: 'a1',
        victimId: 'd2', // Alice wins the clutch
        weapon: 'phantom',
        isHeadshot: false,
        damageEventId: 'd3',
        assisters: [],
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 12000,
        winner: 'attacker',
        winCondition: 'defenders_eliminated',
        survivors: ['a1'],
      };

      const timeline: TimelineEvent[] = [kill1, kill2, kill3, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['a1', 'a2']),
        teamBPlayerIds: new Set(['d1', 'd2']),
      });

      expect(summary.clutchAttempt).toEqual({
        playerId: 'a1',
        playerName: 'Alice',
        situation: '1v2',
        startTimestamp: 5000,
        won: true,
        killsDuring: 2,
      });
    });

    it('should detect lost clutch', () => {
      const playerStates = new Map([
        ['a1', createPlayerState('a1', 'Alice', 'attacker')],
        ['a2', createPlayerState('a2', 'Bob', 'attacker')],
        ['d1', createPlayerState('d1', 'Charlie', 'defender')],
        ['d2', createPlayerState('d2', 'Dave', 'defender')],
      ]);

      // Alice in 1v2, gets one kill but dies
      const kill1: SimKillEvent = {
        id: 'k1',
        type: 'kill',
        timestamp: 5000,
        killerId: 'd1',
        victimId: 'a2',
        weapon: 'vandal',
        isHeadshot: false,
        damageEventId: 'd1',
        assisters: [],
      };

      const kill2: SimKillEvent = {
        id: 'k2',
        type: 'kill',
        timestamp: 8000,
        killerId: 'a1',
        victimId: 'd1',
        weapon: 'phantom',
        isHeadshot: true,
        damageEventId: 'd2',
        assisters: [],
      };

      const kill3: SimKillEvent = {
        id: 'k3',
        type: 'kill',
        timestamp: 10000,
        killerId: 'd2',
        victimId: 'a1',
        weapon: 'vandal',
        isHeadshot: false,
        damageEventId: 'd3',
        assisters: [],
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 12000,
        winner: 'defender',
        winCondition: 'attackers_eliminated',
        survivors: ['d2'],
      };

      const timeline: TimelineEvent[] = [kill1, kill2, kill3, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['a1', 'a2']),
        teamBPlayerIds: new Set(['d1', 'd2']),
      });

      expect(summary.clutchAttempt).toEqual({
        playerId: 'a1',
        playerName: 'Alice',
        situation: '1v2',
        startTimestamp: 5000,
        won: false,
        killsDuring: 1,
      });
    });

    it('should return null if no clutch situation', () => {
      const playerStates = new Map([
        ['a1', createPlayerState('a1', 'Alice', 'attacker')],
        ['d1', createPlayerState('d1', 'Charlie', 'defender')],
      ]);

      const kill1: SimKillEvent = {
        id: 'k1',
        type: 'kill',
        timestamp: 5000,
        killerId: 'a1',
        victimId: 'd1',
        weapon: 'vandal',
        isHeadshot: false,
        damageEventId: 'd1',
        assisters: [],
      };

      const roundEndEvent: RoundEndEvent = {
        id: 'r1',
        type: 'round_end',
        timestamp: 10000,
        winner: 'attacker',
        winCondition: 'defenders_eliminated',
        survivors: ['a1'],
      };

      const timeline: TimelineEvent[] = [kill1, roundEndEvent];

      const summary = calculator.deriveFromTimeline({
        timeline,
        playerStates,
        teamAPlayerIds: new Set(['a1']),
        teamBPlayerIds: new Set(['d1']),
      });

      // Only 1 kill, never a 1vN situation (need at least 2 kills to create clutch)
      expect(summary.clutchAttempt).toBeNull();
    });
  });
});
