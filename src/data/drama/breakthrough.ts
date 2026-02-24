import type { DramaEventTemplate } from '../../types/drama';

export const BREAKTHROUGH_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // BREAKTHROUGH (3 templates)
  // ==========================================================================

  {
    id: 'breakthrough_growth',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Unexpected Growth',
    description: '{playerName} has shown surprising improvement recently. Their potential is really starting to shine through.',
    conditions: [
      {
        type: 'random_chance',
        chance: 20,
        playerSelector: 'any'
      },
      { type: 'min_season_day', threshold: 15 },
    ],
    probability: 20,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
      {
        target: 'player_stat',
        stat: 'mechanics',
        effectPlayerSelector: 'triggering',
        delta: 5,
      },
    ],
  },

  {
    id: 'breakthrough_role_click',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Role Mastery',
    description: '{playerName} has really clicked in their current role. Something just connected for them.',
    conditions: [
      {
        type: 'random_chance',
        chance: 10,
        playerSelector: 'any'
      },
      { type: 'min_season_day', threshold: 15 },
    ],
    probability: 10,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_stat',
        stat: 'igl',
        effectPlayerSelector: 'triggering',
        delta: 5,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 5,
      },
    ],
  },

  {
    id: 'breakthrough_scrim_upset',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Scrim Upset Victory',
    description: '{teamName} just dominated a scrim against a much stronger opponent. The energy is infectious.',
    conditions: [
      { type: 'no_recent_match' },
      {
        type: 'team_chemistry_above',
        threshold: 50,
      },
      { type: 'scrim_count_min', threshold: 5 },
      {
        type: 'random_chance',
        chance: 12,
      },
    ],
    probability: 12,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: 5,
      },
      {
        target: 'team_chemistry',
        delta: 5,
      },
    ],
  },

];
