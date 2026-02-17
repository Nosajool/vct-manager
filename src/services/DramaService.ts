// DramaService - Orchestrates drama event system
// Connects drama engine with the Zustand store

import { useGameStore } from '../store';
import * as dramaEngine from '../engine/drama';
import { DRAMA_EVENT_TEMPLATES } from '../data/dramaEvents';
import { resolveEffects, type ResolvedEffect } from '../engine/drama/DramaEffectResolver';
import type {
  DramaEventInstance,
  DramaGameStateSnapshot,
  DramaEffect,
  DramaEventTemplate,
  DramaChoice,
} from '../types/drama';

/**
 * DramaService - Handles all drama event operations
 * Orchestrates the drama engine and applies results to the store
 */
export class DramaService {
  /**
   * Evaluate drama triggers for the current day
   * Returns all newly triggered events (for TimeAdvanceResult)
   */
  evaluateDay(): DramaEventInstance[] {
    const state = useGameStore.getState();

    // Build snapshot from current game state
    const snapshot = this.buildSnapshot();

    // Call drama engine to evaluate triggers
    const result = dramaEngine.evaluate(snapshot, DRAMA_EVENT_TEMPLATES);

    const newEvents: DramaEventInstance[] = [];

    // Process triggered events
    for (const triggered of result.triggeredEvents) {
      const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === triggered.templateId);
      if (!template) continue;

      // Create event instance
      const affectedPlayerIds = triggered.affectedPlayerIds;
      const eventInstance = dramaEngine.createEventInstance(
        template,
        snapshot,
        affectedPlayerIds && affectedPlayerIds[0]
          ? {
              id: affectedPlayerIds[0],
              name: snapshot.players.find(p => p.id === affectedPlayerIds[0])?.name || 'Unknown'
            }
          : null
      );

      // Handle minor events: apply auto-effects immediately
      if (template.severity === 'minor') {
        if (template.effects) {
          this.applyEffects(template.effects, eventInstance.affectedPlayerIds || []);
          eventInstance.appliedEffects = template.effects;
        }

        // Build context for narrative substitution
        const context: Record<string, string> = {};

        // Add player name if event has affected players
        if (eventInstance.affectedPlayerIds && eventInstance.affectedPlayerIds.length > 0) {
          const playerId = eventInstance.affectedPlayerIds[0];
          const player = state.players[playerId];
          if (player) {
            context.playerName = player.name;
          }
        }

        // Add team name
        if (eventInstance.teamId) {
          const team = state.teams[eventInstance.teamId];
          if (team) {
            context.teamName = team.name;
          }
        }

        // Substitute placeholders in description for minor events
        eventInstance.outcomeText = dramaEngine.substituteNarrative(template.description, context);

        // Add to store
        state.addDramaEvent(eventInstance);
      } else {
        // Handle major events: add as 'pending' (require player decision)
        state.addDramaEvent(eventInstance);
      }

      // Update last event by category
      state.updateLastEventByCategory(template.category, snapshot.currentDate);

      newEvents.push(eventInstance);
    }

    // Handle escalated events
    for (const escalation of result.escalatedEvents) {
      const escalationTemplate = DRAMA_EVENT_TEMPLATES.find(
        t => t.id === escalation.toTemplateId
      );
      if (!escalationTemplate) continue;

      // Create escalated event instance
      const escalatedEvent = dramaEngine.createEventInstance(
        escalationTemplate,
        snapshot,
        null
      );

      // Apply escalation in store
      state.escalateDramaEvent(escalation.fromEventId, escalatedEvent);

      newEvents.push(escalatedEvent);
    }

    // Handle expired events
    for (const expiredEventId of result.expiredEventIds) {
      state.expireDramaEvent(expiredEventId);
    }

    // Set cooldowns
    for (const cooldown of result.cooldownsSet) {
      state.setCooldown(cooldown.category, cooldown.expiresDate);
    }

    // Clear expired flags
    const expiredFlags = dramaEngine.checkFlagExpiry(
      snapshot.dramaState.activeFlags,
      snapshot.currentDate
    );
    for (const flag of expiredFlags) {
      state.clearDramaFlag(flag);
    }

    return newEvents;
  }

  /**
   * Resolve a major event with a player's choice
   */
  resolveEvent(eventId: string, choiceId: string): void {
    const state = useGameStore.getState();

    // Get event from store
    const event = state.activeEvents.find(e => e.id === eventId);
    if (!event) {
      console.error(`[DramaService] Event ${eventId} not found`);
      return;
    }

    // Find template
    const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === event.templateId);
    if (!template) {
      console.error(`[DramaService] Template ${event.templateId} not found`);
      return;
    }

    // Find choice
    const choice = template.choices?.find(c => c.id === choiceId);
    if (!choice) {
      console.error(`[DramaService] Choice ${choiceId} not found in template ${template.id}`);
      return;
    }

    // Resolve effects
    const snapshot = this.buildSnapshot();
    const resolvedEffects = resolveEffects(
      choice.effects,
      snapshot,
      event.affectedPlayerIds || []
    );

    // Apply effects to store
    this.applyResolvedEffects(resolvedEffects);

    // Build context for narrative substitution
    const context: Record<string, string> = {};

    // Add player name if event has affected players
    if (event.affectedPlayerIds && event.affectedPlayerIds.length > 0) {
      const playerId = event.affectedPlayerIds[0];
      const player = state.players[playerId];
      if (player) {
        context.playerName = player.name;
      }
    }

    // Add team name
    if (event.teamId) {
      const team = state.teams[event.teamId];
      if (team) {
        context.teamName = team.name;
      }
    }

    // Substitute placeholders in outcome text
    const substitutedOutcomeText = dramaEngine.substituteNarrative(choice.outcomeText, context);

    // Update event in store
    state.resolveDramaEvent(
      eventId,
      choiceId,
      substitutedOutcomeText,
      choice.effects
    );

    // Handle escalation control from choice
    // Note: Choice-based escalation prevention/triggering would be implemented here
    // if the DramaChoice interface had preventsEscalation/triggersEscalation flags
    // For now, this is handled by the event expiry/escalation system
  }

  /**
   * Build a snapshot of current game state for drama evaluation
   */
  buildSnapshot(): DramaGameStateSnapshot {
    const state = useGameStore.getState();
    const { calendar, playerTeamId, teams, players: allPlayers } = state;

    if (!playerTeamId) {
      throw new Error('[DramaService] No player team ID found');
    }

    const playerTeam = teams[playerTeamId];
    if (!playerTeam) {
      throw new Error('[DramaService] Player team not found');
    }

    // Get all players on the player's team
    const teamPlayerIds = [...playerTeam.playerIds, ...playerTeam.reservePlayerIds];
    const teamPlayers = teamPlayerIds
      .map(id => allPlayers[id])
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    // Build players array for snapshot
    const playersSnapshot = teamPlayers.map(player => ({
      id: player.id,
      name: player.name,
      teamId: player.teamId,
      stats: player.stats,
      morale: player.morale,
      form: player.form,
    }));

    // Build drama state for snapshot
    const dramaState = {
      activeEvents: state.activeEvents,
      eventHistory: state.eventHistory,
      activeFlags: Object.entries(state.activeFlags).reduce((acc, [flag, data]) => {
        // Handle both old (string) and new (object) formats for backwards compatibility
        if (typeof data === 'string') {
          acc[flag] = {
            setDate: data,
            expiresDate: undefined,
            value: undefined,
          };
        } else {
          acc[flag] = {
            setDate: data.setDate,
            expiresDate: data.expiresDate,
            value: undefined,
          };
        }
        return acc;
      }, {} as DramaGameStateSnapshot['dramaState']['activeFlags']),
      cooldowns: state.cooldowns as Record<string, string | null>,
    };

    // Get recent match results for streak-based conditions
    const matchHistory = state.getTeamMatchHistory(playerTeamId);
    const recentMatchResults = matchHistory.map(result => {
      const match = state.getMatch(result.matchId);
      return {
        matchId: result.matchId,
        date: match?.scheduledDate || '',
        won: result.winnerId === playerTeamId,
        teamId: playerTeamId,
      };
    });

    return {
      currentDate: calendar.currentDate,
      currentSeason: calendar.currentSeason,
      currentPhase: calendar.currentPhase,
      playerTeamId,
      playerTeamChemistry: playerTeam.chemistry.overall,
      players: playersSnapshot,
      recentMatchResults,
      dramaState,
    };
  }

  /**
   * Apply abstract effects to the store
   * Used for auto-effects on minor events
   */
  applyEffects(effects: DramaEffect[], involvedPlayerIds: string[]): void {
    const snapshot = this.buildSnapshot();
    const resolved = resolveEffects(effects, snapshot, involvedPlayerIds);
    this.applyResolvedEffects(resolved);
  }

  /**
   * Apply resolved effects to the store
   * Translates ResolvedEffect objects into store mutations
   */
  private applyResolvedEffects(resolved: ResolvedEffect[]): void {
    const state = useGameStore.getState();

    for (const effect of resolved) {
      switch (effect.type) {
        case 'update_player': {
          if (!effect.playerId || !effect.field) continue;

          const player = state.players[effect.playerId];
          if (!player) continue;

          // Handle nested field paths (e.g., "stats.mechanics")
          if (effect.field.startsWith('stats.')) {
            const statName = effect.field.substring(6) as keyof typeof player.stats;
            const currentValue = player.stats[statName];

            let newValue: number;
            if (effect.absoluteValue !== undefined) {
              newValue = effect.absoluteValue;
            } else if (effect.delta !== undefined) {
              newValue = currentValue + effect.delta;
            } else {
              continue;
            }

            // Clamp stat value
            newValue = Math.max(0, Math.min(100, newValue));

            state.updatePlayer(effect.playerId, {
              stats: {
                ...player.stats,
                [statName]: newValue,
              },
            });
          } else {
            // Handle top-level fields (morale, form)
            const currentValue = player[effect.field as keyof typeof player] as number;

            let newValue: number;
            if (effect.absoluteValue !== undefined) {
              newValue = effect.absoluteValue;
            } else if (effect.delta !== undefined) {
              newValue = currentValue + effect.delta;
            } else {
              continue;
            }

            // Clamp percentage value
            newValue = Math.max(0, Math.min(100, newValue));

            state.updatePlayer(effect.playerId, {
              [effect.field]: newValue,
            });
          }
          break;
        }

        case 'update_team': {
          const playerTeamId = state.playerTeamId;
          if (!playerTeamId || !effect.field) continue;

          const team = state.teams[playerTeamId];
          if (!team) continue;

          if (effect.field === 'chemistry') {
            const currentChemistry = team.chemistry.overall;

            let newChemistry: number;
            if (effect.absoluteValue !== undefined) {
              newChemistry = effect.absoluteValue;
            } else if (effect.delta !== undefined) {
              newChemistry = currentChemistry + effect.delta;
            } else {
              continue;
            }

            // Clamp chemistry
            newChemistry = Math.max(0, Math.min(100, newChemistry));

            state.updateTeamChemistry(playerTeamId, {
              ...team.chemistry,
              overall: newChemistry,
            });
          } else if (effect.field === 'fanbase') {
            // Handle fanbase updates (stored in reputation.fanbase)
            const currentFanbase = team.reputation.fanbase;

            let newFanbase: number;
            if (effect.absoluteValue !== undefined) {
              newFanbase = effect.absoluteValue;
            } else if (effect.delta !== undefined) {
              newFanbase = currentFanbase + effect.delta;
            } else {
              continue;
            }

            // Clamp fanbase
            newFanbase = Math.max(0, Math.min(100, newFanbase));

            state.updateTeam(playerTeamId, {
              reputation: { ...team.reputation, fanbase: newFanbase },
            });
          }
          break;
        }

        case 'set_flag': {
          if (!effect.flag) continue;

          const currentDate = state.calendar.currentDate;

          // Compute expiry date if flagDuration is specified
          let expiresDate: string | undefined = undefined;
          if (effect.flagDuration !== undefined && effect.flagDuration > 0) {
            const currentDateObj = new Date(currentDate);
            const expiryDateObj = new Date(currentDateObj);
            expiryDateObj.setDate(expiryDateObj.getDate() + effect.flagDuration);
            expiresDate = expiryDateObj.toISOString();
          }

          state.setDramaFlag(effect.flag, {
            setDate: currentDate,
            expiresDate,
          });
          break;
        }

        case 'clear_flag': {
          if (!effect.flag) continue;
          state.clearDramaFlag(effect.flag);
          break;
        }
      }
    }
  }

  /**
   * Get the next pending major event that requires player decision
   */
  getNextPendingMajorEvent(): DramaEventInstance | null {
    const state = useGameStore.getState();
    const pendingMajorEvents = state.getPendingMajorEvents();

    // Return oldest pending event
    if (pendingMajorEvents.length === 0) return null;

    return pendingMajorEvents.sort((a, b) =>
      new Date(a.triggeredDate).getTime() - new Date(b.triggeredDate).getTime()
    )[0];
  }

  /**
   * Get recent drama events from history
   */
  getRecentEvents(limit: number = 10): DramaEventInstance[] {
    const state = useGameStore.getState();
    return state.getEventHistory(limit);
  }

  /**
   * Get all active drama events
   */
  getActiveEvents(): DramaEventInstance[] {
    const state = useGameStore.getState();
    return state.getActiveEvents();
  }

  /**
   * Get event template by ID
   */
  getTemplate(templateId: string): DramaEventTemplate | undefined {
    return DRAMA_EVENT_TEMPLATES.find(t => t.id === templateId);
  }

  /**
   * Get choice from template
   */
  getChoice(templateId: string, choiceId: string): DramaChoice | undefined {
    const template = this.getTemplate(templateId);
    return template?.choices?.find(c => c.id === choiceId);
  }
}

// Export singleton instance
export const dramaService = new DramaService();
