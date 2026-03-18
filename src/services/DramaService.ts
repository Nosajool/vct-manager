// DramaService - Orchestrates drama event system
// Connects drama engine with the Zustand store

import { useGameStore } from '../store';
import * as dramaEngine from '../engine/drama';
import { freeAgentInterestService } from './FreeAgentInterestService';
import { downtimeService } from './DowntimeService';
import { contractService } from './ContractService';
import { DRAMA_EVENT_TEMPLATES } from '../data/drama';
import { resolveEffects, type ResolvedEffect } from '../engine/drama/DramaEffectResolver';
import type {
  DramaEventInstance,
  DramaGameStateSnapshot,
  DramaEffect,
  DramaEventTemplate,
  DramaChoice,
} from '../types/drama';
import type { BracketStructure, BracketRound, BracketMatch, Tournament } from '../types/competition';

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

    const newEvents: DramaEventInstance[] = [];

    // Fire any pending event triggers that have reached their fire date
    const pendingTriggers = state.pendingEventTriggers ?? [];
    const currentDateObj = new Date(snapshot.currentDate);

    for (const trigger of pendingTriggers) {
      if (new Date(trigger.fireDate) <= currentDateObj) {
        const template = DRAMA_EVENT_TEMPLATES.find(t => t.id === trigger.templateId);
        if (template) {
          const triggerPlayer = trigger.involvedPlayerIds[0]
            ? snapshot.players.find(p => p.id === trigger.involvedPlayerIds[0]) ?? null
            : null;
          const eventInstance = dramaEngine.createEventInstance(template, snapshot, triggerPlayer);

          if (template.severity === 'minor') {
            if (template.effects) {
              this.applyEffects(template.effects, trigger.involvedPlayerIds);
              eventInstance.appliedEffects = template.effects;
            }
            const context = this.buildContext(state, eventInstance);
            eventInstance.outcomeText = dramaEngine.substituteNarrative(template.description, context);
            state.addDramaEvent(eventInstance);
            state.resolveDramaEvent(eventInstance.id, undefined, eventInstance.outcomeText, eventInstance.appliedEffects);
          } else {
            state.addDramaEvent(eventInstance);
          }
          newEvents.push(eventInstance);
        }
        state.removePendingEventTrigger(trigger.templateId, trigger.fireDate);
      }
    }

    // Call drama engine to evaluate triggers
    const result = dramaEngine.evaluate(snapshot, DRAMA_EVENT_TEMPLATES);

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

      // Check if this templateId has been seen before; mark as new if not
      const freshState = useGameStore.getState();
      if (!freshState.isTemplateSeen(template.id)) {
        freshState.markTemplateSeen(template.id);
        eventInstance.isNew = true;
      }

      // Handle minor events: apply auto-effects immediately
      if (template.severity === 'minor') {
        if (template.effects) {
          this.applyEffects(template.effects, eventInstance.affectedPlayerIds || []);
          eventInstance.appliedEffects = template.effects;
        }

        // Build context for narrative substitution
        const context = this.buildContext(state, eventInstance);

        // Substitute placeholders in description for minor events
        eventInstance.outcomeText = dramaEngine.substituteNarrative(template.description, context);

        // Add to store
        state.addDramaEvent(eventInstance);
        // Auto-resolve immediately — minor events need no player decision
        state.resolveDramaEvent(eventInstance.id, undefined, eventInstance.outcomeText, eventInstance.appliedEffects);
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

      // Carry over the affected player from the original event
      const fromEvent = snapshot.dramaState.activeEvents.find(
        e => e.id === escalation.fromEventId
      );
      const originalPlayerId = fromEvent?.affectedPlayerIds?.[0];
      const originalPlayer = originalPlayerId
        ? snapshot.players.find(p => p.id === originalPlayerId) ?? null
        : null;

      // Create escalated event instance
      const escalatedEvent = dramaEngine.createEventInstance(
        escalationTemplate,
        snapshot,
        originalPlayer
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
    const context = this.buildContext(state, event);

    // Substitute placeholders in outcome text
    const substitutedOutcomeText = dramaEngine.substituteNarrative(choice.outcomeText, context);

    // Update event in store
    state.resolveDramaEvent(
      eventId,
      choiceId,
      substitutedOutcomeText,
      choice.effects
    );

    // Schedule follow-up event if choice has a triggersEventId
    if (choice.triggersEventId) {
      const delayDays = choice.triggerDelay ?? 0;
      const fireDate = new Date(state.calendar.currentDate);
      fireDate.setDate(fireDate.getDate() + delayDays);
      state.addPendingEventTrigger({
        templateId: choice.triggersEventId,
        fireDate: fireDate.toISOString(),
        involvedPlayerIds: event.affectedPlayerIds || [],
      });
    }
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
      contract: player.contract,
      personality: player.personality,
      region: player.region,
      agentPreferences: state.playerAgentPreferences[player.id],
      isActive: playerTeam.playerIds.includes(player.id),
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
            value: data.value,
          };
        }
        return acc;
      }, {} as DramaGameStateSnapshot['dramaState']['activeFlags']),
      cooldowns: state.cooldowns as Record<string, string | null>,
    };

    const scrimCount = state.scrimHistory.length;

    // Compute max VOD leak risk across all scrim partners
    const scrimRelationships = playerTeam.scrimRelationships ?? {};
    const maxVodLeakRisk = Object.values(scrimRelationships)
      .reduce((max, rel) => Math.max(max, rel.vodLeakRisk), 0);

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

    // Compute tournament context — find the active tournament the player team is in
    const tournamentContext = this.computeTournamentContext(playerTeamId, state.tournaments);

    // Build free agent interests map for tracked free agents
    const freeAgentInterests: Record<string, number> = {};
    const freeAgents = Object.values(allPlayers).filter(p => p.teamId === null);
    for (const fa of freeAgents) {
      if (fa.teamInterests?.[playerTeamId] !== undefined) {
        freeAgentInterests[fa.id] = fa.teamInterests[playerTeamId];
      }
    }

    return {
      currentDate: calendar.currentDate,
      currentSeason: calendar.currentSeason,
      currentPhase: calendar.currentPhase,
      playerTeamId,
      playerTeamChemistry: playerTeam.chemistry.overall,
      iglPlayerId: playerTeam.iglPlayerId,
      players: playersSnapshot,
      recentMatchResults,
      scrimCount,
      maxVodLeakRisk,
      dramaState,
      tournamentContext,
      playerTeamRegion: playerTeam.region,
      activePatch: state.currentPatch ?? null,
      teamBudget: playerTeam.finances.balance,
      teamFinances: {
        consecutiveNegativeMonths: playerTeam.finances.consecutiveNegativeMonths ?? 0,
      },
      freeAgentInterests,
      isInDowntime: downtimeService.isTeamInDowntime(playerTeamId),
    };
  }

  /**
   * Compute tournament context for the drama snapshot.
   * Looks for an in-progress bracket tournament where the player team participates,
   * then finds the team's next pending/ready match to determine bracket position.
   */
  private computeTournamentContext(
    playerTeamId: string,
    tournaments: Record<string, Tournament>
  ): DramaGameStateSnapshot['tournamentContext'] {
    // Find the active tournament containing this team
    const activeTournament = Object.values(tournaments).find(
      (t) =>
        t.status === 'in_progress' &&
        t.teamIds.includes(playerTeamId) &&
        (t.bracket.upper.length > 0 || (t.bracket.lower?.length ?? 0) > 0)
    );

    if (!activeTournament) return undefined;

    const bracket = activeTournament.bracket;

    // Check if team is in grand final
    const gf = bracket.grandfinal;
    if (
      gf &&
      (gf.teamAId === playerTeamId || gf.teamBId === playerTeamId) &&
      (gf.status === 'pending' || gf.status === 'ready' || gf.status === 'in_progress')
    ) {
      return {
        bracketPosition: 'upper',
        eliminationRisk: gf.loserDestination.type === 'eliminated',
        isGrandFinal: true,
        tournamentType: activeTournament.type,
      };
    }

    // Search upper and lower bracket rounds for the team's next match
    const result = findTeamCurrentBracketMatch(bracket, playerTeamId);
    if (!result) {
      // No pending match found — check if the team was eliminated
      const eliminated = findTeamEliminationMatch(bracket, playerTeamId);
      if (eliminated) {
        return {
          bracketPosition: null,
          eliminationRisk: false,
          isGrandFinal: false,
          isEliminated: true,
          tournamentType: activeTournament.type,
        };
      }
      return undefined;
    }

    return {
      bracketPosition: result.round.bracketType === 'lower' ? 'lower' : 'upper',
      eliminationRisk: result.match.loserDestination.type === 'eliminated',
      isGrandFinal: false,
      tournamentType: activeTournament.type,
    };
  }

  /**
   * Build narrative substitution context from event metadata
   */
  private buildContext(
    state: ReturnType<typeof useGameStore.getState>,
    event: Pick<DramaEventInstance, 'affectedPlayerIds' | 'teamId'>
  ): Record<string, string> {
    const context: Record<string, string> = {};

    if (event.affectedPlayerIds && event.affectedPlayerIds.length > 0) {
      const player = state.players[event.affectedPlayerIds[0]];
      if (player) context.playerName = player.name;
    }

    if (event.teamId) {
      const team = state.teams[event.teamId];
      if (team) context.teamName = team.name;
      const activeSponsorships = state.teams[event.teamId]?.finances?.activeSponsorships;
      if (activeSponsorships && activeSponsorships.length > 0) {
        context.sponsorName = activeSponsorships[0].sponsorName;
      } else {
        context.sponsorName = 'Your primary sponsor';
      }
    }

    return context;
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
          } else if (effect.field === 'budget') {
            // Handle budget updates via updateTeamBalance
            if (effect.delta !== undefined) {
              state.updateTeamBalance(playerTeamId, effect.delta);
            }
          } else if (effect.field === 'hype') {
            const currentHype = team.reputation.hypeLevel;
            let newHype: number;
            if (effect.absoluteValue !== undefined) {
              newHype = effect.absoluteValue;
            } else if (effect.delta !== undefined) {
              newHype = currentHype + effect.delta;
            } else {
              continue;
            }
            newHype = Math.max(0, Math.min(100, newHype));
            state.updateTeam(playerTeamId, {
              reputation: { ...team.reputation, hypeLevel: newHype },
            });
          } else if (effect.field === 'sponsorTrust') {
            const currentSponsorTrust = team.reputation.sponsorTrust;
            let newSponsorTrust: number;
            if (effect.absoluteValue !== undefined) {
              newSponsorTrust = effect.absoluteValue;
            } else if (effect.delta !== undefined) {
              newSponsorTrust = currentSponsorTrust + effect.delta;
            } else {
              continue;
            }
            newSponsorTrust = Math.max(0, Math.min(100, newSponsorTrust));
            state.updateTeam(playerTeamId, {
              reputation: { ...team.reputation, sponsorTrust: newSponsorTrust },
            });
          }
          break;
        }

        case 'move_to_reserve': {
          if (!effect.playerId) continue;
          const playerTeamId = state.playerTeamId;
          if (!playerTeamId) continue;
          state.movePlayerToReserve(playerTeamId, effect.playerId);
          break;
        }

        case 'move_to_active': {
          if (!effect.playerId) continue;
          const playerTeamId = state.playerTeamId;
          if (!playerTeamId) continue;
          const team = state.teams[playerTeamId];
          if (team && team.playerIds.length >= 5) {
            // Bench the tracked substitute to make room for the returning player
            const substituteFlag = state.activeFlags[`substitute_taking_over_${effect.playerId}`];
            if (substituteFlag?.value) {
              state.movePlayerToReserve(playerTeamId, substituteFlag.value);
            }
          }
          state.movePlayerToActive(playerTeamId, effect.playerId);
          break;
        }

        case 'release_player': {
          if (!effect.playerId) continue;
          const playerTeamId = state.playerTeamId;
          if (!playerTeamId) continue;
          // Remove from team roster
          state.removePlayerFromTeam(playerTeamId, effect.playerId);
          // Make them a free agent
          state.updatePlayer(effect.playerId, { teamId: null });
          // Initialize FA interest for all other teams at elevated level (~65)
          const allTeams = Object.keys(state.teams).filter(id => id !== playerTeamId);
          for (const teamId of allTeams) {
            state.setFreeAgentInterest(effect.playerId, teamId, 60 + Math.floor(Math.random() * 15));
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

        case 'update_free_agent_interest': {
          if (effect.interestDelta === undefined) continue;
          const freeAgentsInState = Object.values(state.players).filter(p => p.teamId === null);
          const playerTeamId = state.playerTeamId;
          if (!playerTeamId) continue;
          for (const fa of freeAgentsInState) {
            if (fa.teamInterests?.[playerTeamId] !== undefined) {
              freeAgentInterestService.applyOutreach(fa.id, playerTeamId, 'drama_event', effect.interestDelta!, 0);
            }
          }
          break;
        }

        case 'extend_player_contract': {
          if (!effect.playerId) continue;
          const player = state.players[effect.playerId];
          if (!player?.contract) continue;

          const yearsToAdd = effect.yearsToAdd ?? 2;
          const salaryMultiplier = effect.salaryMultiplier ?? 1.5;

          const newYearsRemaining = (player.contract.yearsRemaining ?? 0) + yearsToAdd;
          const newSalary = Math.round(player.contract.salary * salaryMultiplier);

          const endDateObj = new Date(player.contract.endDate || state.calendar.currentDate);
          endDateObj.setFullYear(endDateObj.getFullYear() + yearsToAdd);

          state.updatePlayer(effect.playerId, {
            contract: {
              ...player.contract,
              yearsRemaining: newYearsRemaining,
              salary: newSalary,
              endDate: endDateObj.toISOString(),
            }
          });
          break;
        }

        case 'assign_igl': {
          if (!effect.playerId) continue;
          const playerTeamId = state.playerTeamId;
          if (!playerTeamId) continue;
          contractService.reassignIGL(effect.playerId, playerTeamId);
          break;
        }

        case 'trigger_event': {
          if (!effect.templateId) continue;
          state.addPendingEventTrigger({
            templateId: effect.templateId,
            fireDate: state.calendar.currentDate,
            involvedPlayerIds: [],
          });
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

// ============================================================================
// Bracket navigation helpers (module-private)
// ============================================================================

/**
 * Find a team's next pending/ready match in the bracket.
 * Returns the match and its parent round, or null if not found.
 */
function findTeamCurrentBracketMatch(
  bracket: BracketStructure,
  teamId: string
): { match: BracketMatch; round: BracketRound } | null {
  const roundGroups: BracketRound[][] = [
    bracket.upper,
    ...(bracket.lower ? [bracket.lower] : []),
    ...(bracket.middle ? [bracket.middle] : []),
  ];

  for (const rounds of roundGroups) {
    for (const round of rounds) {
      for (const match of round.matches) {
        if (
          (match.teamAId === teamId || match.teamBId === teamId) &&
          (match.status === 'pending' || match.status === 'ready' || match.status === 'in_progress')
        ) {
          return { match, round };
        }
      }
    }
  }
  return null;
}

/**
 * Detect if a team has been eliminated: find a completed bracket match where
 * the team was the loser and the loserDestination is 'eliminated'.
 */
function findTeamEliminationMatch(
  bracket: BracketStructure,
  teamId: string
): BracketMatch | null {
  const roundGroups: BracketRound[][] = [
    bracket.upper,
    ...(bracket.lower ? [bracket.lower] : []),
    ...(bracket.middle ? [bracket.middle] : []),
  ];

  for (const rounds of roundGroups) {
    for (const round of rounds) {
      for (const match of round.matches) {
        if (
          match.status === 'completed' &&
          match.loserId === teamId &&
          match.loserDestination.type === 'eliminated'
        ) {
          return match;
        }
      }
    }
  }

  // Also check grand final
  const gf = bracket.grandfinal;
  if (
    gf &&
    gf.status === 'completed' &&
    gf.loserId === teamId &&
    gf.loserDestination.type === 'eliminated'
  ) {
    return gf;
  }

  return null;
}

// Export singleton instance
export const dramaService = new DramaService();
