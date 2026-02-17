// Drama Engine
// Core engine for evaluating drama event triggers and creating event instances

import { evaluateAllConditions } from './DramaConditionEvaluator';
import type {
  DramaEventTemplate,
  DramaEventInstance,
  DramaGameStateSnapshot,
  DramaEvaluationResult,
  DramaCategory,
} from '@/types/drama';

// ============================================================================
// Constants
// ============================================================================

/** Cadence control limits for event frequency */
const CADENCE_LIMITS = {
  MINOR_EVENTS_PER_WEEK: 5,        // Max 5 minor events per week
  MAJOR_EVENT_INTERVAL_DAYS: 2,    // Min 2 days between major events
  MAX_EVENTS_PER_DAY: 3,            // Max 3 events per day total
  CATEGORY_BOOST_DAYS: 5,           // Boost probability if category hasn't fired in 5+ days
  CATEGORY_BOOST_MULTIPLIER: 2.0,  // Probability multiplier for boost
};

// ============================================================================
// Main Evaluation Function
// ============================================================================

/**
 * Evaluates drama triggers for the current game state and returns events to create
 *
 * Algorithm:
 * 1. Check flag expiry
 * 2. Check escalations
 * 3. Filter eligible templates
 * 4. Roll probability
 * 5. Apply cadence limits
 * 6. Create instances
 */
export function evaluate(
  snapshot: DramaGameStateSnapshot,
  templates: DramaEventTemplate[]
): DramaEvaluationResult {
  const result: DramaEvaluationResult = {
    triggeredEvents: [],
    expiredEventIds: [],
    escalatedEvents: [],
    cooldownsSet: [],
  };

  // Step 1: Check flag expiry
  // Note: Flag expiry is checked but expired flags are not added to result structure
  // The calling service will handle checking and removing expired flags
  checkFlagExpiry(snapshot.dramaState.activeFlags, snapshot.currentDate);

  // Step 2: Check escalations
  const escalatedEvents = checkEscalations(snapshot, templates);
  result.escalatedEvents = escalatedEvents.map(event => ({
    fromEventId: event.fromEventId!,
    toTemplateId: event.templateId,
  }));

  // Step 3: Filter eligible templates
  const eligibleTemplates = filterEligibleTemplates(snapshot, templates);

  // Step 4: Roll probability for each eligible template
  const selectedTemplates: Array<{ template: DramaEventTemplate; involvedPlayer?: { id: string; name: string } }> = [];

  for (const template of eligibleTemplates) {
    if (rollForEvent(template, snapshot)) {
      const involvedPlayer = selectInvolvedPlayer(template, snapshot) || undefined;
      selectedTemplates.push({ template, involvedPlayer });
    }
  }

  // Step 5: Apply cadence limits
  const limitedTemplates = applyCadenceLimits(selectedTemplates, snapshot);

  // Step 6: Create event instances
  for (const { template, involvedPlayer } of limitedTemplates) {
    const instance = createEventInstance(template, snapshot, involvedPlayer);

    result.triggeredEvents.push({
      templateId: template.id,
      category: template.category,
      severity: template.severity,
      affectedPlayerIds: instance.affectedPlayerIds,
    });

    // Set cooldown if template specifies one
    if (template.cooldownDays) {
      const expiresDate = new Date(snapshot.currentDate);
      expiresDate.setDate(expiresDate.getDate() + template.cooldownDays);

      result.cooldownsSet.push({
        category: template.category,
        expiresDate: expiresDate.toISOString(),
      });
    }
  }

  // Mark expired events (events that reached their expiresDate)
  const expiredEvents = snapshot.dramaState.activeEvents.filter(event => {
    if (!event.expiresDate) return false;
    const expiryDate = new Date(event.expiresDate);
    const currentDate = new Date(snapshot.currentDate);
    return currentDate >= expiryDate;
  });
  result.expiredEventIds = expiredEvents.map(e => e.id);

  return result;
}

// ============================================================================
// Flag Expiry
// ============================================================================

/**
 * Checks active flags for expiry and returns list of expired flag names
 */
export function checkFlagExpiry(
  activeFlags: DramaGameStateSnapshot['dramaState']['activeFlags'],
  currentDate: string
): string[] {
  const expired: string[] = [];
  const currentDateTime = new Date(currentDate);

  for (const [flagName, flagData] of Object.entries(activeFlags)) {
    if (flagData.expiresDate) {
      const expiryDate = new Date(flagData.expiresDate);
      if (currentDateTime >= expiryDate) {
        expired.push(flagName);
      }
    }
  }

  return expired;
}

// ============================================================================
// Escalations
// ============================================================================

/**
 * Checks active events for escalation deadlines and creates escalated events
 */
export function checkEscalations(
  snapshot: DramaGameStateSnapshot,
  templates: DramaEventTemplate[]
): Array<DramaEventInstance & { fromEventId: string }> {
  const escalated: Array<DramaEventInstance & { fromEventId: string }> = [];
  const currentDate = new Date(snapshot.currentDate);

  for (const event of snapshot.dramaState.activeEvents) {
    // Skip if already escalated or doesn't have escalation info
    if (event.escalated || !event.expiresDate) {
      continue;
    }

    // Find the original template to get escalation info
    const template = templates.find(t => t.id === event.templateId);
    if (!template || !template.escalationTemplateId) {
      continue;
    }

    // Check if escalation deadline has passed
    const escalationDeadline = new Date(event.expiresDate);
    if (currentDate >= escalationDeadline) {
      // Find escalation template
      const escalationTemplate = templates.find(t => t.id === template.escalationTemplateId);
      if (!escalationTemplate) {
        continue;
      }

      // Create escalated event instance
      const escalatedEvent = createEventInstance(escalationTemplate, snapshot, undefined);
      escalated.push({
        ...escalatedEvent,
        fromEventId: event.id,
      });
    }
  }

  return escalated;
}

// ============================================================================
// Template Filtering
// ============================================================================

/**
 * Filters templates to find those eligible to trigger based on:
 * - Conditions are met
 * - Not on cooldown
 * - Category frequency is acceptable
 */
function filterEligibleTemplates(
  snapshot: DramaGameStateSnapshot,
  templates: DramaEventTemplate[]
): DramaEventTemplate[] {
  const eligible: DramaEventTemplate[] = [];
  const currentDate = new Date(snapshot.currentDate);

  for (const template of templates) {
    // Check if all conditions are met
    if (!evaluateAllConditions(template.conditions, snapshot)) {
      continue;
    }

    // Check if on cooldown
    const cooldown = snapshot.dramaState.cooldowns[template.category];
    if (cooldown) {
      const cooldownDate = new Date(cooldown);
      if (currentDate < cooldownDate) {
        continue;
      }
    }

    // Check once-per-season restriction
    if (template.oncePerSeason) {
      const seasonEvents = snapshot.dramaState.eventHistory.filter(
        e => e.templateId === template.id
      );
      // Check if any event from this template exists in current season
      // We'll assume events from this season have been triggered this season
      // A more robust check would compare season numbers, but that's not in the event data
      if (seasonEvents.length > 0) {
        // Simple heuristic: if the template was used in recent history, skip
        const recentEvent = seasonEvents.find(e => {
          const daysSince = (currentDate.getTime() - new Date(e.triggeredDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince < 90; // Assume season is ~90 days
        });
        if (recentEvent) {
          continue;
        }
      }
    }

    // Check requires player team
    if (template.requiresPlayerTeam) {
      // This is already implicitly handled by conditions checking player team
      // but we could add explicit validation here if needed
    }

    eligible.push(template);
  }

  return eligible;
}

// ============================================================================
// Probability Rolling
// ============================================================================

/**
 * Rolls probability check for a template with category boost if applicable
 */
export function rollForEvent(
  template: DramaEventTemplate,
  snapshot: DramaGameStateSnapshot
): boolean {
  let probability = template.probability;

  // Check if category hasn't fired in 7+ days for boost
  const lastEventOfCategory = findLastEventOfCategory(
    template.category,
    snapshot.dramaState.eventHistory
  );

  if (lastEventOfCategory) {
    const daysSince = calculateDaysBetween(lastEventOfCategory.triggeredDate, snapshot.currentDate);
    if (daysSince >= CADENCE_LIMITS.CATEGORY_BOOST_DAYS) {
      probability *= CADENCE_LIMITS.CATEGORY_BOOST_MULTIPLIER;
    }
  } else {
    // No events of this category ever - apply boost
    probability *= CADENCE_LIMITS.CATEGORY_BOOST_MULTIPLIER;
  }

  // Cap at 100%
  probability = Math.min(100, probability);

  // Roll
  return Math.random() * 100 < probability;
}

/**
 * Finds the most recent event of a given category
 */
function findLastEventOfCategory(
  category: DramaCategory,
  eventHistory: DramaEventInstance[]
): DramaEventInstance | null {
  const categoryEvents = eventHistory
    .filter(e => e.category === category)
    .sort((a, b) => new Date(b.triggeredDate).getTime() - new Date(a.triggeredDate).getTime());

  return categoryEvents[0] || null;
}

/**
 * Calculates days between two ISO date strings
 */
function calculateDaysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================================
// Cadence Limits
// ============================================================================

/**
 * Applies cadence limits to selected templates:
 * - Max minor events per week
 * - Min interval between major events
 * - Max events per day
 */
function applyCadenceLimits(
  selectedTemplates: Array<{ template: DramaEventTemplate; involvedPlayer?: { id: string; name: string } }>,
  snapshot: DramaGameStateSnapshot
): Array<{ template: DramaEventTemplate; involvedPlayer?: { id: string; name: string } }> {
  const currentDate = new Date(snapshot.currentDate);
  const limited: Array<{ template: DramaEventTemplate; involvedPlayer?: { id: string; name: string } }> = [];

  // Count recent events
  const oneWeekAgo = new Date(currentDate);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentMinorEvents = snapshot.dramaState.eventHistory.filter(e => {
    const eventDate = new Date(e.triggeredDate);
    return eventDate >= oneWeekAgo && e.severity === 'minor';
  }).length;

  const recentActiveEvents = snapshot.dramaState.activeEvents.filter(e => {
    const eventDate = new Date(e.triggeredDate);
    return eventDate >= oneWeekAgo;
  }).length;

  const recentMinorCount = recentMinorEvents + recentActiveEvents;

  // Count events today
  const todayStart = new Date(currentDate);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(currentDate);
  todayEnd.setHours(23, 59, 59, 999);

  const eventsToday = snapshot.dramaState.eventHistory.filter(e => {
    const eventDate = new Date(e.triggeredDate);
    return eventDate >= todayStart && eventDate <= todayEnd;
  }).length;

  const activeEventsToday = snapshot.dramaState.activeEvents.filter(e => {
    const eventDate = new Date(e.triggeredDate);
    return eventDate >= todayStart && eventDate <= todayEnd;
  }).length;

  let eventsTodayCount = eventsToday + activeEventsToday;

  // Find last major event
  const allMajorEvents = [
    ...snapshot.dramaState.eventHistory.filter(e => e.severity === 'major'),
    ...snapshot.dramaState.activeEvents.filter(e => e.severity === 'major'),
  ].sort((a, b) => new Date(b.triggeredDate).getTime() - new Date(a.triggeredDate).getTime());

  const lastMajorEvent = allMajorEvents[0];
  const daysSinceLastMajor = lastMajorEvent
    ? calculateDaysBetween(lastMajorEvent.triggeredDate, snapshot.currentDate)
    : 999;

  // Process templates
  let minorThisWeek = recentMinorCount;

  for (const selected of selectedTemplates) {
    const { template } = selected;

    // Check max events per day
    if (eventsTodayCount >= CADENCE_LIMITS.MAX_EVENTS_PER_DAY) {
      continue;
    }

    // Check minor events per week limit
    if (template.severity === 'minor') {
      if (minorThisWeek >= CADENCE_LIMITS.MINOR_EVENTS_PER_WEEK) {
        continue;
      }
      minorThisWeek++;
    }

    // Check major event interval
    if (template.severity === 'major') {
      if (daysSinceLastMajor < CADENCE_LIMITS.MAJOR_EVENT_INTERVAL_DAYS) {
        continue;
      }
    }

    limited.push(selected);
    eventsTodayCount++;
  }

  return limited;
}

// ============================================================================
// Event Instance Creation
// ============================================================================

/**
 * Creates a drama event instance from a template
 */
export function createEventInstance(
  template: DramaEventTemplate,
  snapshot: DramaGameStateSnapshot,
  involvedPlayer?: { id: string; name: string } | null
): DramaEventInstance {
  const currentDate = snapshot.currentDate;

  // Generate unique instance ID
  const instanceId = crypto.randomUUID();

  // Calculate expiry date if duration is specified
  let expiresDate: string | undefined;
  if (template.durationDays) {
    const expiry = new Date(currentDate);
    expiry.setDate(expiry.getDate() + template.durationDays);
    expiresDate = expiry.toISOString();
  } else if (template.escalateDays) {
    // Use escalation deadline as expiry
    const expiry = new Date(currentDate);
    expiry.setDate(expiry.getDate() + template.escalateDays);
    expiresDate = expiry.toISOString();
  }

  // Determine affected players
  const affectedPlayerIds: string[] = [];
  if (involvedPlayer) {
    affectedPlayerIds.push(involvedPlayer.id);
  }

  // Note: Narrative substitution is handled by the UI layer when displaying events
  // The instance stores template references, and the UI will substitute player/team names
  // using the affectedPlayerIds and teamId at display time

  // Create instance
  const instance: DramaEventInstance = {
    id: instanceId,
    templateId: template.id,
    status: 'active',
    category: template.category,
    severity: template.severity,
    teamId: snapshot.playerTeamId,
    affectedPlayerIds: affectedPlayerIds.length > 0 ? affectedPlayerIds : undefined,
    triggeredDate: currentDate,
    expiresDate,
    appliedEffects: [],
  };

  return instance;
}

// ============================================================================
// Player Selection
// ============================================================================

/**
 * Selects an involved player based on template conditions and effects
 * Returns null if no player is involved or selection fails
 */
export function selectInvolvedPlayer(
  template: DramaEventTemplate,
  snapshot: DramaGameStateSnapshot
): { id: string; name: string } | null {
  // Check template conditions for player selector hints
  const playerConditions = template.conditions.filter(c =>
    c.playerSelector !== undefined && c.playerSelector !== 'all'
  );

  // Check template effects for player selector hints
  const playerEffects = (template.effects || []).filter(e =>
    e.playerSelector !== undefined && e.playerSelector !== 'all'
  );

  // Combine both sources
  const hasPlayerTarget = playerConditions.length > 0 || playerEffects.length > 0;

  if (!hasPlayerTarget) {
    // No specific player targeting - event affects team generally
    return null;
  }

  // Use the first player condition or effect to select a player
  const selector = playerConditions[0]?.playerSelector || playerEffects[0]?.playerSelector;
  const condition = playerConditions[0];

  if (selector === 'specific') {
    const playerId = condition?.playerId;
    if (playerId) {
      const player = snapshot.players.find(p => p.id === playerId);
      return player ? { id: player.id, name: player.name } : null;
    }
    // If no specific playerId provided, fall through to team selection
  }

  const teamPlayers = snapshot.players.filter(p => p.teamId === snapshot.playerTeamId);

  if (teamPlayers.length === 0) {
    return null;
  }

  switch (selector) {
    case 'star_player': {
      const starPlayer = teamPlayers.reduce((best, current) => {
        const currentRating = calculatePlayerRating(current);
        const bestRating = calculatePlayerRating(best);
        return currentRating > bestRating ? current : best;
      }, teamPlayers[0]);
      return { id: starPlayer.id, name: starPlayer.name };
    }

    case 'lowest_morale': {
      const lowestMoralePlayer = teamPlayers.reduce((lowest, current) =>
        current.morale < lowest.morale ? current : lowest
      , teamPlayers[0]);
      return { id: lowestMoralePlayer.id, name: lowestMoralePlayer.name };
    }

    case 'any':
    case 'newest':
    case 'random': {
      const randomIndex = Math.floor(Math.random() * teamPlayers.length);
      const player = teamPlayers[randomIndex];
      return { id: player.id, name: player.name };
    }

    default:
      return null;
  }
}

/**
 * Calculates overall player rating from stats
 */
function calculatePlayerRating(player: DramaGameStateSnapshot['players'][number]): number {
  const stats = player.stats;
  const statValues = [
    stats.mechanics,
    stats.igl,
    stats.mental,
    stats.clutch,
    stats.vibes,
    stats.lurking,
    stats.entry,
    stats.support,
    stats.stamina,
  ];
  return statValues.reduce((sum, val) => sum + val, 0) / statValues.length;
}

// ============================================================================
// Narrative Substitution
// ============================================================================

/**
 * Substitutes placeholders in narrative text with context values
 * Supports: {playerName}, {teamName}, etc.
 */
export function substituteNarrative(
  template: string,
  context: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}
