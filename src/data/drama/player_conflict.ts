import type { DramaEventTemplate } from '../../types/drama';

export const PLAYER_CONFLICT_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // PLAYER CONFLICT (3 templates)
  // ==========================================================================

  {
    id: 'conflict_tension_rising',
    category: 'player_conflict',
    severity: 'minor',
    title: 'Tensions Rising',
    description: 'The low team chemistry is starting to show. {playerName} seems increasingly frustrated with teammates, and you\'ve noticed small arguments breaking out during practice.',
    conditions: [
      { type: 'team_in_downtime' },
      { type: 'team_chemistry_below', threshold: 55 },
      { type: 'min_season_day', threshold: 30 },
      { type: 'flag_not_active', flag: 'conflict_resolved' },
      { type: 'random_chance', chance: 25, playerSelector: 'any' },
    ],
    probability: 100,
    cooldownDays: 7,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'conflict_active',
        flagDuration: 14,
      },
    ],
    escalateDays: 5,
    escalationTemplateId: 'conflict_boiling_over',
  },

  {
    id: 'conflict_boiling_over',
    category: 'player_conflict',
    severity: 'major',
    title: 'Conflict Boiling Over',
    description: 'Things have escalated. {playerName} and a teammate have gotten into a heated argument that disrupted the whole practice session. The team is waiting to see how you handle this.',
    conditions: [
      { type: 'flag_active', flag: 'conflict_active', playerSelector: 'any' },
    ],
    probability: 90,
    cooldownDays: 7,
    choices: [
      {
        id: 'mediate',
        text: 'Mediate between the players',
        description: 'Sit everyone down and work through the conflict professionally',
        effects: [
          {
            target: 'team_chemistry',
            delta: -5,
          },
        ],
        outcomeText: 'You bring the players together for a mediation session. It\'s tense, but everyone agrees to try harder. You\'ve scheduled a follow-up in a week to check on the progress.',
        triggersEventId: 'conflict_mediation_outcome',
        triggerDelay: 7,
      },
      {
        id: 'bench_rival',
        text: 'Side with the team leader, bench the rival',
        description: 'Make a firm decision to bench the troublemaker',
        effects: [
          {
            target: 'move_to_reserve',
            effectPlayerSelector: 'triggering',
          },
          {
            target: 'set_flag',
            flag: 'conflict_rival_benched_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} is benched until further notice. The team respects your decisiveness, though some wonder if the conflict runs deeper than one player.',
      },
      {
        id: 'release_both',
        text: 'Release both players immediately',
        description: 'Cut your losses — toxic players aren\'t worth the disruption',
        effects: [
          {
            target: 'release_player',
            effectPlayerSelector: 'triggering',
          },
          {
            target: 'release_player',
            effectPlayerSelector: 'random_teammate',
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: -10,
          },
          {
            target: 'team_hype',
            delta: 10,
          },
          {
            target: 'set_flag',
            flag: 'mass_release',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You release both players on the spot. The remaining roster is shocked — morale takes a hit — but the fan base buzzes with the bold move. Now you need to rebuild.',
      },
    ],
  },

  {
    id: 'conflict_mediation_outcome',
    category: 'player_conflict',
    severity: 'minor',
    title: 'Mediation Outcome',
    description: 'A week has passed since the mediation session. The players have had time to cool down and reflect on the situation. It seems to have worked.',
    conditions: [
      { type: 'flag_active', flag: 'conflict_active' },
    ],
    probability: 100,
    cooldownDays: 3,
    effects: [
      {
        target: 'team_chemistry',
        delta: 8,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 3,
      },
      {
        target: 'clear_flag',
        flag: 'conflict_active',
      },
      {
        target: 'set_flag',
        flag: 'conflict_resolved',
        flagDuration: 60,
      },
    ],
  },
];
