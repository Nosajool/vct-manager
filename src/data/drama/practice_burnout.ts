import type { DramaEventTemplate } from '../../types/drama';

export const PRACTICE_BURNOUT_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // BURNOUT ARC
  //
  // Heavy scrim block on a low-morale player tips into visible fatigue.
  // Manager can enforce rest (→ recovery check) or let it slide (→ burnout_risk_high).
  //
  // burnout_overtraining (minor, arc-entry)
  //   → [7d escalation] burnout_grind_culture (major)
  //       "enforce rest"     → reduced_training_time flag
  //         → [7d] burnout_recovery_check (minor, terminal)
  //       "let them grind"   → burnout_risk_high flag (read by arc_aware CRISIS interviews)
  //       "flexible schedule"→ small positive, no escalation
  // ==========================================================================

  {
    id: 'burnout_overtraining',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Signs of Burnout',
    description: '{playerName} is running on empty. After another late-night scrim block they\'re sitting in silence during the debrief, staring at nothing. The grind is catching up to them — you can see it in their reaction time, in the mistakes they never used to make.',
    conditions: [
      { type: 'no_recent_match' },
      { type: 'min_season_day', threshold: 20 },
      { type: 'scrim_count_min', threshold: 15 },
      { type: 'player_morale_below', threshold: 55, playerSelector: 'any' },
      { type: 'flag_not_active', flag: 'burnout_risk_high' },
    ],
    probability: 50,
    cooldownDays: 10,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
      { target: 'set_flag', flag: 'training_effectiveness_penalty_{playerId}', flagDuration: 12 },
    ],
    escalateDays: 7,
    escalationTemplateId: 'burnout_grind_culture',
  },

  {
    id: 'burnout_grind_culture',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Unhealthy Grind Culture',
    description: 'It\'s 1am and {playerName} is still at the setup. They\'ve been on for twelve hours. You know the hours are unsustainable — but there\'s always one more match to review, one more strat to run. At some point this catches up to everyone.',
    conditions: [
      { type: 'flag_active', flag: 'training_effectiveness_penalty_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 70,
    cooldownDays: 7,
    choices: [
      {
        id: 'enforce_rest',
        text: 'Enforce mandatory rest days',
        description: 'Call it. No scrims, no VOD review — a full reset.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 8 },
          { target: 'set_flag', flag: 'reduced_training_time', flagDuration: 10 },
        ],
        outcomeText: 'You cancel the next two scrim blocks. Some players are visibly relieved. Others are anxious about falling behind. {playerName} sleeps for fourteen hours.',
      },
      {
        id: 'let_them_grind',
        text: 'Let them manage their own schedule',
        description: 'It\'s their body — trust them to know their limits',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -15 },
          { target: 'set_flag', flag: 'burnout_risk_high', flagDuration: 14 },
        ],
        outcomeText: 'You leave it up to them. The hours stay high. A week later {playerName}\'s form in matches starts to slip in ways that are hard to explain to the outside world.',
      },
      {
        id: 'flexible_schedule',
        text: 'Implement flexible schedules',
        description: 'Build individual recovery time into the structure',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 5 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'clear_flag', flag: 'training_effectiveness_penalty_{playerId}' },
          { target: 'set_flag', flag: 'manager_development_focused', flagDuration: 21 },
        ],
        outcomeText: 'You sit with each player individually and build a schedule around their needs. It takes extra work on your end, but the energy in the room changes noticeably by end of week.',
      },
    ],
    autoResolveEffects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
      { target: 'clear_flag', flag: 'training_effectiveness_penalty_{playerId}' },
    ],
  },

  {
    id: 'burnout_recovery_check',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Back from the Break',
    description: '{playerName} is back at the setup after the forced rest days. There\'s something different — they\'re engaged again, actually laughing during warmup. The break worked.',
    conditions: [
      { type: 'flag_active', flag: 'reduced_training_time' },
      { type: 'player_morale_below', threshold: 70, playerSelector: 'condition_match' },
    ],
    probability: 80,
    cooldownDays: 7,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 12 },
      { target: 'team_chemistry', delta: 3 },
      { target: 'clear_flag', flag: 'reduced_training_time' },
      { target: 'clear_flag', flag: 'training_effectiveness_penalty_{playerId}' },
    ],
  },

];
