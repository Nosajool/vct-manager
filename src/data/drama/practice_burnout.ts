import type { DramaEventTemplate } from '../../types/drama';

export const PRACTICE_BURNOUT_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // PRACTICE/BURNOUT (3 templates)
  // ==========================================================================

  {
    id: 'burnout_overtraining',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Signs of Burnout',
    description: '{playerName} is showing signs of mental fatigue. They look drained after recent practice sessions.',
    conditions: [
      { type: 'no_recent_match' },
      {
        type: 'random_chance',
        chance: 15,
        playerSelector: 'any'
      },
    ],
    probability: 15,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'training_effectiveness_penalty_{playerId}',
        flagDuration: 3,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -20,
      },
    ],
  },

  {
    id: 'burnout_motivation_dip',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Motivation Dip',
    description: 'The team is going through the motions. Practice lacks the usual energy and focus.',
    conditions: [
      { type: 'no_recent_match' },
      {
        type: 'random_chance',
        chance: 20,
      },
    ],
    probability: 20,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'random',
        delta: -15,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'random',
        delta: -15,
      },
    ],
  },

  {
    id: 'burnout_grind_culture',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Unhealthy Grind Culture',
    description: 'Late-night practice sessions have become the norm. Players are burning the midnight oil, but at what cost?',
    conditions: [
      { type: 'no_recent_match' },
      {
        type: 'flag_active',
        flag: 'training_effectiveness_penalty_{playerId}',
      },
    ],
    probability: 60,
    cooldownDays: 10,
    choices: [
      {
        id: 'enforce_rest',
        text: 'Enforce rest periods',
        description: 'Mandate downtime and recovery',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 10,
          },
          {
            target: 'clear_flag',
            flag: 'training_effectiveness_penalty_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'reduced_training_time',
            flagDuration: 7,
          },
        ],
        outcomeText: 'You put your foot down and enforce mandatory rest. Players are relieved and come back refreshed, though practice time is reduced.',
      },
      {
        id: 'let_them_grind',
        text: 'Let them grind',
        description: 'Trust them to manage their own schedules',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -50,
          },
          {
            target: 'set_flag',
            flag: 'burnout_risk_high',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You let the grind continue. Short-term, practice hours stay high, but you worry about the long-term toll on mental health.',
      },
      {
        id: 'flexible_schedule',
        text: 'Implement flexible schedules',
        description: 'Balance practice with personalized recovery',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
          {
            target: 'team_chemistry',
            delta: 2,
          },
        ],
        outcomeText: 'You work with each player to create personalized schedules. It\'s more work for you, but the team appreciates the individual attention.',
      },
    ],
  },

];
