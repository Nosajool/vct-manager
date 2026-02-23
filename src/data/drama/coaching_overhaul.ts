import type { DramaEventTemplate } from '../../types/drama';

export const COACHING_OVERHAUL_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // COACHING OVERHAUL ARC (10 templates)
  // Arc flow: kickoff crisis → star reaction → strict regime → benching decision
  //           → PATH A: buy-in / PATH B: rebellion → terminal events
  // ==========================================================================

  {
    id: 'coach_overhaul_kickoff_crisis',
    category: 'coaching_overhaul',
    severity: 'minor',
    title: 'Head Coach Dismissed After Disappointing Kickoff',
    description: 'Following a poor start to the tournament, the org has made the difficult decision to dismiss the head coach. The team is in flux.',
    conditions: [
      { type: 'bracket_position', bracketPosition: 'lower' },
      { type: 'flag_active', flag: 'org_high_expectations' },
      { type: 'flag_not_active', flag: 'coaching_overhaul_active' },
      { type: 'flag_not_active', flag: 'coaching_overhaul_failed' },
    ],
    probability: 70,
    cooldownDays: 5,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -5 },
      { target: 'team_chemistry', delta: -5 },
      { target: 'set_flag', flag: 'coaching_overhaul_active', flagDuration: 60 },
    ],
    escalateDays: 5,
    escalationTemplateId: 'star_player_coaching_reaction',
  },

  {
    id: 'star_player_coaching_reaction',
    category: 'coaching_overhaul',
    severity: 'major',
    title: "How Does the Star React to the Coaching Change?",
    description: "The coaching change has put {playerName} in the spotlight. Their reaction will set the tone for the rest of the team.",
    conditions: [
      { type: 'flag_active', flag: 'coaching_overhaul_active' },
      { type: 'flag_not_active', flag: 'star_bought_in_{playerId}', playerSelector: 'condition_match' },
      { type: 'flag_not_active', flag: 'star_skeptical_{playerId}', playerSelector: 'condition_match' },
      { type: 'player_personality', personality: 'FAME_SEEKER', playerSelector: 'star_player' },
    ],
    probability: 90,
    choices: [
      {
        id: 'team_buyin',
        text: "\"We'll buy into the new system.\"",
        description: "The star publicly commits to making the transition work.",
        effects: [
          { target: 'set_flag', flag: 'star_bought_in_{playerId}', flagDuration: 45 },
          { target: 'team_chemistry', delta: 5 },
          { target: 'team_hype', delta: 3 },
        ],
        outcomeText: "The star's public buy-in steadies the locker room. The team has a direction.",
      },
      {
        id: 'blame_coach',
        text: "\"It's always the coach, right?\"",
        description: "The star deflects, hinting the problem was never with the players.",
        effects: [
          { target: 'set_flag', flag: 'star_skeptical_{playerId}', flagDuration: 30 },
          { target: 'set_flag', flag: 'locker_room_divide', flagDuration: 21 },
          { target: 'team_chemistry', delta: -5 },
        ],
        outcomeText: "The comment lands badly internally. Factions begin forming around who to blame.",
      },
      {
        id: 'embrace_structure',
        text: "\"We needed structure. I'm ready.\"",
        description: "The star acknowledges the team needed this change and is fully committed.",
        effects: [
          { target: 'set_flag', flag: 'star_bought_in_{playerId}', flagDuration: 45 },
          { target: 'player_morale', effectPlayerSelector: 'star_player', delta: 5 },
          { target: 'team_hype', delta: 5 },
        ],
        outcomeText: "The star's self-awareness generates genuine optimism. Morale lifts across the board.",
      },
    ],
  },

  {
    id: 'new_regime_strict_structure',
    category: 'coaching_overhaul',
    severity: 'minor',
    title: 'New Coach Implements Strict Practice Structure',
    description: 'The incoming coaching staff has rolled out a demanding new regimen. Players are adjusting to higher expectations.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_overhaul_active' },
      { type: 'flag_not_active', flag: 'strict_regime_active' },
      { type: 'scrim_count_min', threshold: 3 },
    ],
    probability: 80,
    effects: [
      { target: 'set_flag', flag: 'strict_regime_active', flagDuration: 30 },
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -3 },
      { target: 'player_stat', effectPlayerSelector: 'all', stat: 'stamina', delta: 2 },
    ],
  },

  {
    id: 'star_benched_in_scrims',
    category: 'coaching_overhaul',
    severity: 'major',
    title: 'Coach Benches Star in Scrims',
    description: "{playerName}'s recent scrim performances haven't met the new coaching staff's standards. The coach has benched them — a public message about the new expectations.",
    conditions: [
      { type: 'flag_active', flag: 'strict_regime_active' },
      { type: 'player_form_below', threshold: 60, playerSelector: 'star_player' },
      { type: 'player_personality', personality: 'FAME_SEEKER', playerSelector: 'star_player' },
      { type: 'flag_not_active', flag: 'star_coach_conflict_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 75,
    choices: [
      {
        id: 'accept_accountability',
        text: 'Accept Accountability',
        description: 'The star admits they need to raise their level and commits to the system.',
        effects: [
          { target: 'player_stat', effectPlayerSelector: 'star_player', stat: 'mental', delta: 3 },
          { target: 'player_form', effectPlayerSelector: 'star_player', delta: 8 },
          { target: 'set_flag', flag: 'star_bought_in_{playerId}', flagDuration: 45 },
        ],
        outcomeText: "Taking accountability publicly earns the star respect from both coaching staff and teammates. Their form begins to recover.",
      },
      {
        id: 'push_back',
        text: 'Push Back Against Coach',
        description: "The star refuses to accept the benching and challenges the coach's authority.",
        effects: [
          { target: 'team_chemistry', delta: -10 },
          { target: 'set_flag', flag: 'star_coach_conflict_{playerId}', flagDuration: 30 },
          { target: 'set_flag', flag: 'coaching_authority_undermined', flagDuration: 21 },
        ],
        outcomeText: "The confrontation fractures the locker room. The coaching staff's authority is openly questioned.",
      },
      {
        id: 'silent_grind',
        text: 'Silent Grind',
        description: "The star says nothing publicly but puts their head down and grinds.",
        effects: [
          { target: 'player_stat', effectPlayerSelector: 'star_player', stat: 'mental', delta: 2 },
          { target: 'set_flag', flag: 'star_silent_grind_{playerId}', flagDuration: 30 },
          { target: 'team_hype', delta: 3 },
        ],
        outcomeText: "The quiet determination creates intrigue — media speculates, but the locker room respects the professionalism.",
      },
    ],
  },

  {
    id: 'system_buyin_taking_hold',
    category: 'coaching_overhaul',
    severity: 'minor',
    title: "Analysts Praise Team's Structural Improvement",
    description: "Outside observers are noting real improvement in how the team executes. The new system is beginning to bear fruit.",
    conditions: [
      { type: 'flag_active', flag: 'strict_regime_active' },
      { type: 'flag_active', flag: 'star_bought_in_{playerId}', playerSelector: 'condition_match' },
      { type: 'team_chemistry_above', threshold: 60 },
      { type: 'flag_not_active', flag: 'coaching_system_peak' },
    ],
    probability: 65,
    cooldownDays: 7,
    effects: [
      { target: 'set_flag', flag: 'system_buyin_path_active', flagDuration: 45 },
      { target: 'set_flag', flag: 'coaching_system_peak', flagDuration: 45 },
      { target: 'team_chemistry', delta: 8 },
      { target: 'player_stat', effectPlayerSelector: 'all', stat: 'stamina', delta: 3 },
      { target: 'player_stat', effectPlayerSelector: 'all', stat: 'mental', delta: 2 },
      { target: 'team_hype', delta: 5 },
    ],
  },

  {
    id: 'locker_room_friction_escalates',
    category: 'coaching_overhaul',
    severity: 'major',
    title: 'Internal Reports of Friction Between Coaching Staff and Players',
    description: "Sources inside the org are reporting serious friction. The divide between {playerName} and the coaching staff has become impossible to ignore.",
    conditions: [
      { type: 'flag_active', flag: 'locker_room_divide' },
      { type: 'flag_active', flag: 'star_coach_conflict_{playerId}', playerSelector: 'condition_match' },
      { type: 'player_morale_below', threshold: 45, playerSelector: 'any' },
    ],
    probability: 80,
    choices: [
      {
        id: 'back_coach_bench_star',
        text: 'Back the Coach — Bench the Star',
        description: "Management publicly backs the coach. The star is moved to reserve.",
        effects: [
          { target: 'move_to_reserve', effectPlayerSelector: 'triggering' },
          { target: 'clear_flag', flag: 'coaching_authority_undermined' },
          { target: 'team_chemistry', delta: -5 },
          { target: 'team_hype', delta: 8 },
        ],
        outcomeText: "The decisive move makes headlines. The coach's authority is restored, but the locker room is unsettled.",
      },
      {
        id: 'soften_structure',
        text: 'Soften the Structure',
        description: "The coaching staff eases the strict regimen to reduce friction.",
        effects: [
          { target: 'clear_flag', flag: 'strict_regime_active' },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'clear_flag', flag: 'coaching_authority_undermined' },
          { target: 'team_hype', delta: -3 },
        ],
        outcomeText: "The tension drops, but critics note the coach blinked first. The narrative shifts.",
      },
      {
        id: 'emergency_team_meeting',
        text: 'Call an Emergency Team Meeting',
        description: "Everyone gets in a room to air it out. Unpredictable but necessary.",
        effects: [
          { target: 'clear_flag', flag: 'star_coach_conflict_{playerId}' },
          { target: 'set_flag', flag: 'system_buyin_path_active', flagDuration: 45 },
        ],
        outcomeText: "The meeting clears the air between star and coach. Whether the peace holds remains to be seen.",
      },
    ],
  },

  {
    id: 'coaching_overhaul_crisis_point',
    category: 'coaching_overhaul',
    severity: 'major',
    title: 'Coaching Staff and Players Reach Breaking Point',
    description: "The situation has become untenable. The conflict between {playerName} and the coaching staff has paralyzed the team. A decision must be made.",
    conditions: [
      { type: 'flag_active', flag: 'star_coach_conflict_{playerId}', playerSelector: 'condition_match' },
      { type: 'flag_active', flag: 'coaching_authority_undermined' },
      { type: 'player_morale_below', threshold: 40, playerSelector: 'any' },
    ],
    probability: 85,
    effects: [
      { target: 'set_flag', flag: 'coaching_overhaul_failed', flagDuration: 90 },
    ],
    autoResolveEffects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -10 },
      { target: 'team_chemistry', delta: -10 },
      { target: 'clear_flag', flag: 'coaching_overhaul_active' },
      { target: 'clear_flag', flag: 'strict_regime_active' },
      { target: 'clear_flag', flag: 'star_coach_conflict_{playerId}' },
      { target: 'clear_flag', flag: 'locker_room_divide' },
      { target: 'clear_flag', flag: 'coaching_authority_undermined' },
    ],
    choices: [
      {
        id: 'trade_star',
        text: 'Management Backs Coach — Trade the Star',
        description: "The org sides with the coach. The star is made available for trade.",
        effects: [
          { target: 'set_flag', flag: 'player_trade_requested_{playerId}', flagDuration: 30 },
          { target: 'clear_flag', flag: 'coaching_overhaul_active' },
          { target: 'clear_flag', flag: 'strict_regime_active' },
          { target: 'clear_flag', flag: 'star_coach_conflict_{playerId}' },
          { target: 'clear_flag', flag: 'locker_room_divide' },
          { target: 'clear_flag', flag: 'coaching_authority_undermined' },
        ],
        outcomeText: "The trade request sends shockwaves. The coach survives, but at the cost of the franchise player.",
      },
      {
        id: 'coach_on_notice',
        text: 'Management Sides With Players — Coach on Notice',
        description: "Management publicly criticizes the coach's handling of the situation.",
        effects: [
          { target: 'set_flag', flag: 'coach_hot_seat', flagDuration: 30 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 8 },
          { target: 'team_chemistry', delta: 5 },
          { target: 'clear_flag', flag: 'coaching_overhaul_active' },
          { target: 'clear_flag', flag: 'strict_regime_active' },
          { target: 'clear_flag', flag: 'star_coach_conflict_{playerId}' },
          { target: 'clear_flag', flag: 'locker_room_divide' },
          { target: 'clear_flag', flag: 'coaching_authority_undermined' },
        ],
        outcomeText: "Players feel vindicated. The coach is on thin ice, but the locker room breathes again.",
      },
      {
        id: 'mutual_reset',
        text: 'Mutual Reset — Both Compromise',
        description: "Management brokers a compromise. Both sides give something up.",
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'set_flag', flag: 'coaching_system_peak', flagDuration: 20 },
          { target: 'clear_flag', flag: 'coaching_overhaul_active' },
          { target: 'clear_flag', flag: 'strict_regime_active' },
          { target: 'clear_flag', flag: 'star_coach_conflict_{playerId}' },
          { target: 'clear_flag', flag: 'locker_room_divide' },
          { target: 'clear_flag', flag: 'coaching_authority_undermined' },
        ],
        outcomeText: "Neither side got everything they wanted, but the team can function again. A small piece of the system survives.",
      },
    ],
  },

  {
    id: 'coaching_overhaul_triumphant',
    category: 'coaching_overhaul',
    severity: 'minor',
    title: "The System Has Arrived — Team Looks Fundamentally Reborn",
    description: "Back-to-back wins. Analysts are calling this team a different beast. The coaching overhaul has produced exactly what the org hoped for.",
    conditions: [
      { type: 'flag_active', flag: 'coaching_system_peak' },
      { type: 'team_win_streak', streakLength: 2 },
      { type: 'flag_not_active', flag: 'coaching_overhaul_failed' },
    ],
    probability: 70,
    effects: [
      { target: 'set_flag', flag: 'coaching_overhaul_succeeded', flagDuration: 90 },
      { target: 'clear_flag', flag: 'coaching_overhaul_active' },
      { target: 'clear_flag', flag: 'strict_regime_active' },
      { target: 'clear_flag', flag: 'system_buyin_path_active' },
      { target: 'clear_flag', flag: 'coaching_system_peak' },
      { target: 'player_stat', effectPlayerSelector: 'all', stat: 'stamina', delta: 3 },
      { target: 'player_stat', effectPlayerSelector: 'all', stat: 'mental', delta: 3 },
      { target: 'team_chemistry', delta: 10 },
      { target: 'team_hype', delta: 10 },
      { target: 'team_sponsor_trust', delta: 5 },
    ],
  },

  {
    id: 'extended_coach_media_interview',
    category: 'coaching_overhaul',
    severity: 'minor',
    title: "Coach Speaks Out: 'Championship Teams Rely on Repeatable Systems'",
    description: "In a wide-ranging media interview, the new head coach laid out their philosophy — drawing praise from analysts and a pointed internal reaction.",
    conditions: [
      { type: 'flag_active', flag: 'coaching_overhaul_active' },
      { type: 'flag_not_active', flag: 'coaching_authority_undermined' },
      { type: 'min_season_day', threshold: 14 },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      { target: 'team_hype', delta: 5 },
      { target: 'player_morale', effectPlayerSelector: 'star_player', delta: -3 },
      { target: 'set_flag', flag: 'media_narrative_coaching_debate', flagDuration: 14 },
    ],
  },

  {
    id: 'coaching_overhaul_fallout_aftermath',
    category: 'coaching_overhaul',
    severity: 'minor',
    title: 'Fallout from Coaching Experiment Continues to Ripple',
    description: "The failed coaching overhaul isn't just a memory — back-to-back losses have reignited criticism from sponsors and media.",
    conditions: [
      { type: 'flag_active', flag: 'coaching_overhaul_failed' },
      { type: 'team_loss_streak', streakLength: 2 },
    ],
    probability: 60,
    cooldownDays: 14,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -5 },
      { target: 'team_sponsor_trust', delta: -5 },
      { target: 'team_hype', delta: -5 },
    ],
  },
];
