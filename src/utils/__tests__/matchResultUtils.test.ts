// Match Result Utils Tests
// Verifies conversion utilities for MatchResult to Match transformations

import { describe, it, expect } from 'vitest';
import {
  getMatchForResult,
  canDisplayMatchResult,
  getMatchDisplayData,
} from '../matchResultUtils';
import type { Match, MatchResult, Team } from '../../types';
import type { GameStore } from '../../store';

describe('matchResultUtils', () => {
  // Helper to create a mock store
  const createMockStore = (
    matches: Record<string, Match> = {},
    teams: Record<string, Team> = {}
  ): GameStore => {
    return {
      matches,
      teams,
    } as GameStore;
  };

  // Helper to create a basic match
  const createMatch = (id: string, teamAId: string, teamBId: string): Match => ({
    id,
    teamAId,
    teamBId,
    scheduledDate: '2026-01-01',
    status: 'completed',
    season: 1,
  });

  // Helper to create a basic match result
  const createMatchResult = (
    matchId: string,
    winnerId: string,
    loserId: string
  ): MatchResult => ({
    matchId,
    winnerId,
    loserId,
    maps: [],
    scoreTeamA: 2,
    scoreTeamB: 1,
    duration: 45,
  });

  // Helper to create a basic team
  const createTeam = (id: string, name: string): Team => ({
    id,
    name,
    region: 'NA',
    playerIds: [],
    standings: {
      wins: 0,
      losses: 0,
      roundDiff: 0,
      currentStreak: 0,
    },
    chemistry: {
      overall: 75,
      pairs: {},
    },
    mapPool: ['Haven', 'Bind', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture'],
  });

  describe('getMatchForResult', () => {
    it('should return the match when it exists', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({ 'match-1': match });

      const foundMatch = getMatchForResult(result, store);

      expect(foundMatch).toEqual(match);
    });

    it('should return null when match does not exist', () => {
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({});

      const foundMatch = getMatchForResult(result, store);

      expect(foundMatch).toBeNull();
    });

    it('should handle empty store gracefully', () => {
      const result = createMatchResult('match-999', 'team-a', 'team-b');
      const store = createMockStore({}, {});

      const foundMatch = getMatchForResult(result, store);

      expect(foundMatch).toBeNull();
    });
  });

  describe('canDisplayMatchResult', () => {
    it('should return true when match and both teams exist', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const teamA = createTeam('team-a', 'Team A');
      const teamB = createTeam('team-b', 'Team B');
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore(
        { 'match-1': match },
        { 'team-a': teamA, 'team-b': teamB }
      );

      const canDisplay = canDisplayMatchResult(result, store);

      expect(canDisplay).toBe(true);
    });

    it('should return false when match does not exist', () => {
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({}, {});

      const canDisplay = canDisplayMatchResult(result, store);

      expect(canDisplay).toBe(false);
    });

    it('should return false when team A is missing', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const teamB = createTeam('team-b', 'Team B');
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({ 'match-1': match }, { 'team-b': teamB });

      const canDisplay = canDisplayMatchResult(result, store);

      expect(canDisplay).toBe(false);
    });

    it('should return false when team B is missing', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const teamA = createTeam('team-a', 'Team A');
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({ 'match-1': match }, { 'team-a': teamA });

      const canDisplay = canDisplayMatchResult(result, store);

      expect(canDisplay).toBe(false);
    });
  });

  describe('getMatchDisplayData', () => {
    it('should return complete display data when all entities exist', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const teamA = createTeam('team-a', 'Sentinels');
      const teamB = createTeam('team-b', 'G2 Esports');
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore(
        { 'match-1': match },
        { 'team-a': teamA, 'team-b': teamB }
      );

      const displayData = getMatchDisplayData(result, store);

      expect(displayData).not.toBeNull();
      expect(displayData?.match).toEqual(match);
      expect(displayData?.teamAName).toBe('Sentinels');
      expect(displayData?.teamBName).toBe('G2 Esports');
      expect(displayData?.isWin('team-a')).toBe(true);
      expect(displayData?.isWin('team-b')).toBe(false);
    });

    it('should return null when match does not exist', () => {
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({}, {});

      const displayData = getMatchDisplayData(result, store);

      expect(displayData).toBeNull();
    });

    it('should return null when teams are missing', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const result = createMatchResult('match-1', 'team-a', 'team-b');
      const store = createMockStore({ 'match-1': match }, {});

      const displayData = getMatchDisplayData(result, store);

      expect(displayData).toBeNull();
    });

    it('should correctly identify winner with isWin function', () => {
      const match = createMatch('match-1', 'team-a', 'team-b');
      const teamA = createTeam('team-a', 'Winners');
      const teamB = createTeam('team-b', 'Losers');
      const result = createMatchResult('match-1', 'team-b', 'team-a'); // team-b wins
      const store = createMockStore(
        { 'match-1': match },
        { 'team-a': teamA, 'team-b': teamB }
      );

      const displayData = getMatchDisplayData(result, store);

      expect(displayData).not.toBeNull();
      expect(displayData?.isWin('team-a')).toBe(false);
      expect(displayData?.isWin('team-b')).toBe(true);
    });
  });
});
