import { useGameStore } from '../store';
import { downtimeService } from './DowntimeService';
import { timeProgression } from '../engine/calendar';
import type { CalendarEvent } from '../types/calendar';
import type { Team } from '../types/team';

/**
 * DowntimeResolutionService - Resolves single-day downtime activities when
 * CalendarService advances past a team_activity event carrying one of the 5
 * downtime types: watch_party, streamer_collab, youtube_documentary, fan_meetup,
 * sponsored_content.
 */
export class DowntimeResolutionService {
  /**
   * Main entry point. Dispatches to the appropriate private resolver.
   */
  resolveDowntimeActivity(event: CalendarEvent): void {
    const data = event.data as { activityType?: string; scheduledAt?: string };
    const activityType = data?.activityType;

    switch (activityType) {
      case 'watch_party':
        this.resolveWatchParty();
        break;
      case 'streamer_collab':
        this.resolveStreamerCollab();
        break;
      case 'youtube_documentary':
        this.resolveYoutubeDocumentary();
        break;
      case 'fan_meetup':
        this.resolveFanMeetup();
        break;
      case 'sponsored_content':
        this.resolveSponsoredContent();
        break;
      default:
        console.warn(`[DowntimeResolutionService] Unknown activityType: ${activityType}`);
    }
  }

  // ============================================================================
  // Activity Resolvers
  // ============================================================================

  private resolveWatchParty(): void {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return;

    // Try to find a recent match from another team
    const matchIds = downtimeService.getRecentOtherTeamMatchIds(teamId, 7);
    const matchId = matchIds[0];

    if (matchId) {
      const match = state.matches[matchId];
      if (match) {
        this.setFlag('tournament_watching', 7);
        this.setFlag(`watched_${match.teamAId}_${match.teamBId}`, 7);
        // 80% chance: set downtime_interview_pending (consumed by Phase 4)
        if (Math.random() < 0.8) {
          this.setFlag('downtime_interview_pending', 1);
        }
      } else {
        this.setFlag('tournament_watching', 7);
      }
    } else {
      this.setFlag('tournament_watching', 7);
    }

    console.log('[DowntimeResolutionService] Watch Party resolved');
  }

  private resolveStreamerCollab(): void {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return;

    const team = state.teams[teamId];
    if (!team) return;

    // Cost
    state.updateTeamBalance(teamId, -5000);

    // Featured player
    const featuredPlayerId = this.selectHighestMoralePlayer(team.playerIds);

    // Reputation effects
    this.updateReputation(team, teamId, { fanbase: 3, hype: 5 });

    // Morale for featured player
    if (featuredPlayerId) {
      this.applyMoraleToPlayer(featuredPlayerId, 2);
    }

    this.setFlag('streamer_collab_done', 7);
    console.log('[DowntimeResolutionService] Streamer Collab resolved');
  }

  private resolveYoutubeDocumentary(): void {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return;

    const team = state.teams[teamId];
    if (!team) return;

    // Cost
    state.updateTeamBalance(teamId, -10000);

    // Featured player
    const featuredPlayerId = this.selectHighestMoralePlayer(team.playerIds);

    // Reputation effects
    this.updateReputation(team, teamId, { sponsorTrust: 5, fanbase: 4 });

    // Morale effects
    if (featuredPlayerId) {
      this.applyMoraleToPlayer(featuredPlayerId, 5);
      // All others get -1
      const others = team.playerIds.filter(id => id !== featuredPlayerId);
      this.applyMoraleToAll(others, -1);
    } else {
      // No featured player, apply -1 to everyone
      this.applyMoraleToAll(team.playerIds, -1);
    }

    // 60% chance: set youtube_drama_trigger (Phase 5 drama hook)
    if (Math.random() < 0.6) {
      this.setFlag('youtube_drama_trigger', 1);
    }

    if (featuredPlayerId) {
      this.setFlag(`youtube_doc_${featuredPlayerId}`, 14);
    }

    console.log('[DowntimeResolutionService] YouTube Documentary resolved');
  }

  private resolveFanMeetup(): void {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return;

    const team = state.teams[teamId];
    if (!team) return;

    // Cost
    state.updateTeamBalance(teamId, -2000);

    // Reputation effects
    this.updateReputation(team, teamId, { hype: 4, fanbase: 2 });

    // Morale +3 to ALL roster players
    this.applyMoraleToAll(team.playerIds, 3);

    this.setFlag('fan_meetup_done', 7);
    console.log('[DowntimeResolutionService] Fan Meetup resolved');
  }

  private resolveSponsoredContent(): void {
    const state = useGameStore.getState();
    const teamId = state.playerTeamId;
    if (!teamId) return;

    const team = state.teams[teamId];
    if (!team) return;

    // Guard: must have active sponsorships
    if (!team.finances.activeSponsorships || team.finances.activeSponsorships.length === 0) {
      console.warn('[DowntimeResolutionService] Sponsored Content: no active sponsorships, skipping effects');
      return;
    }

    // Income: random $8,000–$15,000
    const income = Math.floor(Math.random() * 7001) + 8000;
    state.updateTeamBalance(teamId, income);

    // Reputation effects
    this.updateReputation(team, teamId, { sponsorTrust: 3 });

    // Morale -1 to ALL roster players
    this.applyMoraleToAll(team.playerIds, -1);

    this.setFlag('sponsored_content_done', 7);
    console.log(`[DowntimeResolutionService] Sponsored Content resolved: +$${income}`);
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
