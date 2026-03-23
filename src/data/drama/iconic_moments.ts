import type { DramaEventTemplate } from '../../types/drama';

export const ICONIC_MOMENT_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // MINOR EVENTS. Auto-apply flavor toasts
  // ==========================================================================

  {
    id: 'iconic_knife_finish',
    category: 'iconic_moments',
    severity: 'minor',
    title: '{playerName} ends it with the knife',
    description:
      'In a moment that\'ll live in the highlights, {playerName} puts away the knife to close it out. The chat goes wild.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'iconic_knife_kill_{playerId}',
        playerSelector: 'condition_match',
      },
    ],
    probability: 75,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    oncePerSeason: true,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 5 },
      { target: 'team_hype', delta: 3 },
    ],
  },

  {
    id: 'iconic_ace_moment',
    category: 'iconic_moments',
    severity: 'minor',
    title: 'Chronicle ace type beat',
    description:
      '{playerName} clears the site solo. Five kills, no help needed. The round is theirs.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'iconic_ace_round_{playerId}',
        playerSelector: 'condition_match',
      },
    ],
    probability: 80,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_form', effectPlayerSelector: 'triggering', delta: 5 },
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 8 },
      { target: 'team_hype', delta: 4 },
    ],
  },

  {
    id: 'iconic_clutch_moment',
    category: 'iconic_moments',
    severity: 'minor',
    title: 'Alfa Yellow levels of clutch',
    description:
      '{playerName} is alone against three. Then two. Then one. Then none. The comms explode.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'iconic_clutch_1v3plus_{playerId}',
        playerSelector: 'condition_match',
      },
    ],
    probability: 80,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 10 },
      { target: 'player_form', effectPlayerSelector: 'triggering', delta: 8 },
      { target: 'team_chemistry', delta: 3 },
    ],
  },

  {
    id: 'iconic_ability_moment',
    category: 'iconic_moments',
    severity: 'minor',
    title: 'The rope ace. Except it\'s {playerName}.',
    description:
      'Three players in the wrong place at the wrong time. {playerName} doesn\'t even think about it. They just pull the trigger.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'iconic_ability_massacre_{playerId}',
        playerSelector: 'condition_match',
      },
    ],
    probability: 75,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_form', effectPlayerSelector: 'triggering', delta: 6 },
      { target: 'team_hype', delta: 5 },
    ],
  },

  {
    id: 'iconic_force_buy_comeback',
    category: 'iconic_moments',
    severity: 'minor',
    title: 'The force buy that changed everything',
    description:
      'The economy looked unwinnable. They forced anyway. The round. And maybe the map. Swings on it.',
    conditions: [
      { type: 'flag_active', flag: 'iconic_force_buy_comeback' },
    ],
    probability: 70,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_chemistry', delta: 4 },
      { target: 'player_morale', effectPlayerSelector: 'random', delta: 6 },
    ],
  },

  {
    id: 'iconic_aggressive_identity',
    category: 'iconic_moments',
    severity: 'minor',
    title: 'They just PRX\'d the site',
    description:
      'Full commitment. No hesitation. The opponents get overwhelmed before they can react. This team has a style.',
    conditions: [
      { type: 'flag_active', flag: 'iconic_aggressive_identity' },
      { type: 'team_playstyle', playstyle: 'aggressive' },
    ],
    probability: 70,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_hype', delta: 5 },
      { target: 'set_flag', flag: 'aggressive_identity_established', flagDuration: 30 },
    ],
  },

  // ==========================================================================
  // MAJOR EVENTS. Player choices required
  // ==========================================================================

  {
    id: 'viral_knife_moment',
    category: 'iconic_moments',
    severity: 'major',
    title: 'The knife clip is everywhere',
    description:
      'Twelve hours after {playerName} ended the match with a knife, the clip has 200k views. Reporters want a quote.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'iconic_knife_kill_{playerId}',
        playerSelector: 'condition_match',
      },
      { type: 'team_chemistry_above', threshold: 70 },
    ],
    probability: 50,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    socialFormat: {
      platform: 'twitter',
      handle: '@VCTHighlights',
      flavorReactions: { likes: 21400, retweets: 5300 },
    },
    choices: [
      {
        id: 'lean_into_it',
        text: 'Lean into it',
        description: 'Embrace the moment. Let {playerName} have their spotlight.',
        effects: [
          { target: 'team_hype', delta: 8 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 5 },
          { target: 'set_flag', flag: 'knife_meme_leaned_in', flagDuration: 30 },
        ],
        outcomeText:
          '{playerName} leans into the meme hard. The clip hits 500k. The community loves it. Whether that becomes an ego thing later is a different problem.',
      },
      {
        id: 'team_credit',
        text: 'Give credit to the team',
        description: 'Redirect the spotlight. The team earned this moment together.',
        effects: [
          { target: 'team_chemistry', delta: 6 },
          { target: 'team_hype', delta: 3 },
          { target: 'set_flag', flag: 'team_first_brand', flagDuration: 45 },
        ],
        outcomeText:
          'The quote lands well. "We all put in the work, I just got the timing right." The team feels it. Community respects the humility.',
      },
      {
        id: 'deflect_to_opponent',
        text: 'Deflect. Credit the opponent',
        description: 'Classy move. Acknowledge the opponent set the situation up.',
        effects: [
          { target: 'team_sponsor_trust', delta: 5 },
        ],
        outcomeText:
          '"They played well enough to put me in that spot." Clean, professional, forgettable in the best way. Sponsors notice.',
      },
    ],
  },

  {
    id: 'the_spike_incident',
    category: 'iconic_moments',
    severity: 'major',
    title: 'That\'s the spike?!',
    description:
      'The spike dropped twice. Both teams scrambled. The crowd doesn\'t know whether to groan or laugh. It\'s already a meme.',
    conditions: [
      { type: 'flag_active', flag: 'iconic_spike_chaos' },
    ],
    probability: 65,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'own_it_humor',
        text: 'Own it (humor)',
        description: 'Laugh about it publicly. Chaos is part of the brand now.',
        effects: [
          { target: 'team_hype', delta: 6 },
          { target: 'player_morale', effectPlayerSelector: 'random', delta: -3 },
          { target: 'set_flag', flag: 'chaos_brand_owned', flagDuration: 30 },
        ],
        outcomeText:
          'The clip becomes a bit. The team leans into it. Whoever was carrying that spike is never going to hear the end of it. But at least it\'s funny.',
      },
      {
        id: 'treat_seriously',
        text: 'Treat it seriously',
        description: 'Acknowledge the mistake without drama. Focus on the lesson.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'random', delta: 3 },
          { target: 'team_chemistry', delta: 2 },
        ],
        outcomeText:
          'Short debrief, no blame assigned. The team files it under "things we don\'t do again" and moves on. Quiet professionalism.',
      },
      {
        id: 'blame_communication',
        text: 'Blame comms',
        description: 'Point to the communication breakdown. Assign accountability.',
        effects: [
          { target: 'team_chemistry', delta: -5 },
          { target: 'set_flag', flag: 'spike_blame_flag', flagDuration: 21 },
        ],
        outcomeText:
          'The debrief gets tense. Fingers point. The IGL ends it early but the conversation doesn\'t actually end. It just moves to the team chat.',
      },
    ],
  },

  {
    id: 'prx_train_identity',
    category: 'iconic_moments',
    severity: 'major',
    title: 'Analysts are calling it the PRX treatment',
    description:
      'Three maps in a row. Full sends, no hesitation. The coverage has a name for your style now. Do you own it?',
    conditions: [
      { type: 'flag_active', flag: 'aggressive_identity_established' },
      { type: 'team_win_streak', streakLength: 3 },
    ],
    probability: 60,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'embrace_identity',
        text: 'Embrace the identity',
        description: 'Double down. This is who you are.',
        effects: [
          { target: 'team_hype', delta: 10 },
          { target: 'set_flag', flag: 'prx_identity_committed', flagDuration: 14 },
        ],
        outcomeText:
          '"That\'s us. That\'s always been us." The declaration lands loud. The team feels it. The playstyle constraint is real, but so is the energy.',
      },
      {
        id: 'stay_flexible',
        text: 'Stay flexible',
        description: 'Appreciate the label but don\'t let it cage you.',
        effects: [
          { target: 'team_chemistry', delta: 5 },
        ],
        outcomeText:
          '"We like to play fast, but we adapt." Strategic answer. The analysts note it. The team keeps its options open.',
      },
      {
        id: 'deny_label',
        text: 'Deny the label',
        description: 'Reject the narrative. You\'re more than a style.',
        effects: [
          { target: 'team_sponsor_trust', delta: 4 },
          { target: 'team_hype', delta: -3 },
        ],
        outcomeText:
          '"Don\'t box us in." The community is mildly annoyed. They were enjoying the storyline. Sponsors appreciate the measured response.',
      },
    ],
  },

  {
    id: 'force_buy_crisis_arc',
    category: 'iconic_moments',
    severity: 'major',
    title: 'Three force buys, three losses',
    description:
      'The economy is broken and the calls keep coming. Someone in comms snapped. The IGL is under pressure.',
    conditions: [
      { type: 'flag_active', flag: 'iconic_force_buy_crisis' },
      { type: 'team_loss_streak', streakLength: 2 },
    ],
    probability: 65,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'igl_doubles_down',
        text: 'IGL doubles down',
        description: 'Trust the calls. The reads are right, the execution wasn\'t.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'random', delta: 5 },
          { target: 'team_chemistry', delta: -4 },
          { target: 'set_flag', flag: 'igl_economy_authority', flagDuration: 21 },
        ],
        outcomeText:
          'The IGL stands firm. Some players trust it. Others exchange glances. The authority holds. For now.',
      },
      {
        id: 'team_vote_reset',
        text: 'Team vote to reset',
        description: 'Open the floor. Let the team decide how to handle economy.',
        effects: [
          { target: 'team_chemistry', delta: 6 },
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 3 },
          { target: 'set_flag', flag: 'economy_reset_flag', flagDuration: 14 },
        ],
        outcomeText:
          'The conversation is messy but honest. A consensus emerges. The IGL concedes some authority; the team feels heard.',
      },
      {
        id: 'bring_in_coach',
        text: 'Bring in coach input',
        description: 'Escalate to the coach. Take it out of the in-game loop.',
        effects: [
          { target: 'team_sponsor_trust', delta: 3 },
          { target: 'team_chemistry', delta: 2 },
        ],
        outcomeText:
          'The coach reviews the footage. Their analysis is calm and specific. The team appreciates the outside perspective.',
      },
    ],
  },
];
