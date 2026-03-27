import { useGameStore } from '../store';
import { downtimeService } from './DowntimeService';
import { timeProgression } from '../engine/calendar';
import type { CalendarEvent } from '../types/calendar';
import type { Team } from '../types/team';
import type { DowntimeActivityResult } from '../types/activityPlan';

/**
 * DowntimeResolutionService - Resolves single-day downtime activities when
 * CalendarService advances past a team_activity event carrying one of the 5
 * downtime types: watch_party, streamer_collab, youtube_documentary, fan_meetup,
 * sponsored_content.
 */
export class DowntimeResolutionService {
  /**
   * Main entry point. Dispatches to the appropriate private resolver.
   * Returns a DowntimeActivityResult describing what happened, or null for unknown types.
   */
  resolveDowntimeActivity(event: CalendarEvent): DowntimeActivityResult | null {
    const data = event.data as { activityType?: string; scheduledAt?: string };
    return this.resolveByType(data?.activityType);
  }

  /**
   * Resolve a downtime activity directly by type string.
   * Used by the advance-day flow where activities are chosen at advance time (no pre-scheduling).
   */
  resolveByType(activityType: string | undefined): DowntimeActivityResult | null {
    switch (activityType) {
      case 'watch_party':
        return this.resolveWatchParty();
      case 'streamer_collab':
        return this.resolveStreamerCollab();
      case 'youtube_documentary':
        return this.resolveYoutubeDocumentary();
      case 'fan_meetup':
        return this.resolveFanMeetup();
      case 'sponsored_content':
        return this.resolveSponsoredContent();
      default:
        console.warn(`[DowntimeResolutionService] Unknown activityType: ${activityType}`);
        return null;
    }
  }

  // ============================================================================
  // Activity Resolvers
  // ============================================================================

  private resolveWatchParty(): DowntimeActivityResult {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    let interviewPending = false;

    if (teamId) {
      const matchIds = downtimeService.getRecentOtherTeamMatchIds(teamId, 7);
      const matchId = matchIds[0];

      if (matchId) {
        const match = state.matches[matchId];
        if (match) {
          this.setFlag('tournament_watching', 7);
          this.setFlag(`watched_${match.teamAId}_${match.teamBId}`, 7);
          if (Math.random() < 0.8) {
            this.setFlag('downtime_interview_pending', 1);
            interviewPending = true;
          }
        } else {
          this.setFlag('tournament_watching', 7);
        }
      } else {
        this.setFlag('tournament_watching', 7);
      }
    }

    console.log('[DowntimeResolutionService] Watch Party resolved');
    return {
      activityType: 'watch_party',
      financialDelta: 0,
      moraleChanges: [],
      reputationDeltas: {},
      interviewPending,
    };
  }

  private resolveStreamerCollab(): DowntimeActivityResult {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return { activityType: 'streamer_collab', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const team = state.teams[teamId];
    if (!team) return { activityType: 'streamer_collab', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const financialDelta = -5000;
    state.updateTeamBalance(teamId, financialDelta);

    const featuredPlayerId = this.selectHighestMoralePlayer(team.playerIds);
    const reputationDeltas = { fanbase: 3, hype: 5 };
    this.updateReputation(team, teamId, reputationDeltas);

    const moraleChanges: DowntimeActivityResult['moraleChanges'] = [];
    if (featuredPlayerId) {
      this.applyMoraleToPlayer(featuredPlayerId, 2);
      const player = state.players[featuredPlayerId];
      if (player) moraleChanges.push({ playerId: featuredPlayerId, playerName: player.name, delta: 2 });
    }

    const featuredPlayerName = featuredPlayerId ? (state.players[featuredPlayerId]?.name) : undefined;
    this.setFlag('streamer_collab_done', 7);
    console.log('[DowntimeResolutionService] Streamer Collab resolved');
    return { activityType: 'streamer_collab', financialDelta, moraleChanges, reputationDeltas, featuredPlayerName };
  }

  private resolveYoutubeDocumentary(): DowntimeActivityResult {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return { activityType: 'youtube_documentary', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const team = state.teams[teamId];
    if (!team) return { activityType: 'youtube_documentary', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const financialDelta = -10000;
    state.updateTeamBalance(teamId, financialDelta);

    const featuredPlayerId = this.selectHighestMoralePlayer(team.playerIds);
    const reputationDeltas = { sponsorTrust: 5, fanbase: 4 };
    this.updateReputation(team, teamId, reputationDeltas);

    const moraleChanges: DowntimeActivityResult['moraleChanges'] = [];
    if (featuredPlayerId) {
      this.applyMoraleToPlayer(featuredPlayerId, 5);
      const fp = state.players[featuredPlayerId];
      if (fp) moraleChanges.push({ playerId: featuredPlayerId, playerName: fp.name, delta: 5 });
      const others = team.playerIds.filter(id => id !== featuredPlayerId);
      this.applyMoraleToAll(others, -1);
      for (const id of others) {
        const p = state.players[id];
        if (p) moraleChanges.push({ playerId: id, playerName: p.name, delta: -1 });
      }
    } else {
      this.applyMoraleToAll(team.playerIds, -1);
      for (const id of team.playerIds) {
        const p = state.players[id];
        if (p) moraleChanges.push({ playerId: id, playerName: p.name, delta: -1 });
      }
    }

    let dramaTriggered = false;
    if (Math.random() < 0.6) {
      this.setFlag('youtube_drama_trigger', 1);
      dramaTriggered = true;
    }

    if (featuredPlayerId) {
      this.setFlag(`youtube_doc_${featuredPlayerId}`, 14);
    }

    const featuredPlayerName = featuredPlayerId ? (state.players[featuredPlayerId]?.name) : undefined;
    console.log('[DowntimeResolutionService] YouTube Documentary resolved');
    return { activityType: 'youtube_documentary', financialDelta, moraleChanges, reputationDeltas, featuredPlayerName, dramaTriggered };
  }

  private resolveFanMeetup(): DowntimeActivityResult {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return { activityType: 'fan_meetup', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const team = state.teams[teamId];
    if (!team) return { activityType: 'fan_meetup', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const financialDelta = -2000;
    state.updateTeamBalance(teamId, financialDelta);

    const reputationDeltas = { hype: 4, fanbase: 2 };
    this.updateReputation(team, teamId, reputationDeltas);

    this.applyMoraleToAll(team.playerIds, 3);
    const moraleChanges: DowntimeActivityResult['moraleChanges'] = team.playerIds.map(id => {
      const p = state.players[id];
      return p ? { playerId: id, playerName: p.name, delta: 3 } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    this.setFlag('fan_meetup_done', 7);
    console.log('[DowntimeResolutionService] Fan Meetup resolved');
    return { activityType: 'fan_meetup', financialDelta, moraleChanges, reputationDeltas };
  }

  private resolveSponsoredContent(): DowntimeActivityResult {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return { activityType: 'sponsored_content', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    const team = state.teams[teamId];
    if (!team) return { activityType: 'sponsored_content', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };

    if (!team.finances.activeSponsorships || team.finances.activeSponsorships.length === 0) {
      console.warn('[DowntimeResolutionService] Sponsored Content: no active sponsorships, skipping effects');
      return { activityType: 'sponsored_content', financialDelta: 0, moraleChanges: [], reputationDeltas: {} };
    }

    const income = Math.floor(Math.random() * 7001) + 8000;
    state.updateTeamBalance(teamId, income);

    const reputationDeltas = { sponsorTrust: 3 };
    this.updateReputation(team, teamId, reputationDeltas);

    this.applyMoraleToAll(team.playerIds, -1);
    const moraleChanges: DowntimeActivityResult['moraleChanges'] = team.playerIds.map(id => {
      const p = state.players[id];
      return p ? { playerId: id, playerName: p.name, delta: -1 } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    this.setFlag('sponsored_content_done', 7);
    console.log(`[DowntimeResolutionService] Sponsored Content resolved: +$${income}`);
    return { activityType: 'sponsored_content', financialDelta: income, moraleChanges, reputationDeltas };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private updateReputation(
    team: Team,
    teamId: string,
    delta: { fanbase?: number; hype?: number; sponsorTrust?: number }
  ): void {
    const state = useGameStore.getState();
    const rep = team.reputation;

    const newFanbase = delta.fanbase !== undefined
      ? Math.max(0, Math.min(100, rep.fanbase + delta.fanbase))
      : rep.fanbase;
    const newHypeLevel = delta.hype !== undefined
      ? Math.max(0, Math.min(100, rep.hypeLevel + delta.hype))
      : rep.hypeLevel;
    const newSponsorTrust = delta.sponsorTrust !== undefined
      ? Math.max(0, Math.min(100, rep.sponsorTrust + delta.sponsorTrust))
      : rep.sponsorTrust;

    state.updateTeam(teamId, {
      reputation: {
        ...rep,
        fanbase: newFanbase,
        hypeLevel: newHypeLevel,
        sponsorTrust: newSponsorTrust,
      },
    });
  }

  /**
   * Returns the playerId with the highest morale, random tiebreak.
   */
  private selectHighestMoralePlayer(playerIds: string[]): string | null {
    if (playerIds.length === 0) return null;
    const state = useGameStore.getState();

    let best: string[] = [];
    let bestMorale = -Infinity;

    for (const id of playerIds) {
      const player = state.players[id];
      if (!player) continue;
      const morale = player.morale ?? 0;
      if (morale > bestMorale) {
        bestMorale = morale;
        best = [id];
      } else if (morale === bestMorale) {
        best.push(id);
      }
    }

    if (best.length === 0) return null;
    return best[Math.floor(Math.random() * best.length)];
  }

  private applyMoraleToAll(playerIds: string[], delta: number): void {
    for (const id of playerIds) {
      this.applyMoraleToPlayer(id, delta);
    }
  }

  private applyMoraleToPlayer(playerId: string, delta: number): void {
    const state = useGameStore.getState();
    const player = state.players[playerId];
    if (!player) return;
    const newMorale = Math.max(0, Math.min(100, (player.morale ?? 50) + delta));
    state.updatePlayer(playerId, { morale: newMorale });
  }

  private setFlag(key: string, durationDays: number): void {
    const state = useGameStore.getState();
    const setDate = state.calendar.currentDate;
    const expiresDate = timeProgression.addDays(setDate, durationDays);
    state.setDramaFlag(key, { setDate, expiresDate });
  }
}

export const downtimeResolutionService = new DowntimeResolutionService();
