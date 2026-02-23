import type { DramaEventTemplate } from '../../types/drama';

export const VISA_ARC_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // VISA DRAMA ARC (7 templates)
  // ==========================================================================

  {
    id: 'visa_processing_warning',
    category: 'visa_arc',
    severity: 'minor',
    title: 'Visa Processing Warning',
    description: "{teamName}'s org has flagged potential delays in {playerName}'s tournament travel documentation. Admin is monitoring the situation.",
    conditions: [
      { type: 'tournament_active' },
      { type: 'min_season_day', threshold: 1 },
      { type: 'player_is_import', playerSelector: 'condition_match' },
    ],
    probability: 75,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'visa_application_pending_{playerId}',
        flagDuration: 21,
      },
    ],
    escalateDays: 7,
    escalationTemplateId: 'visa_delay_crisis',
  },

  {
    id: 'visa_delay_crisis',
    category: 'visa_arc',
    severity: 'major',
    title: 'Visa Crisis: Player Grounded',
    description: "{playerName}'s visa processing has hit a critical delay. They cannot travel to the tournament venue. You must decide how to handle this immediately.",
    conditions: [
      { type: 'flag_active', flag: 'visa_application_pending_{playerId}', playerSelector: 'condition_match' },
      { type: 'tournament_active' },
    ],
    probability: 90,
    escalateDays: 7,
    escalationTemplateId: 'visa_tournament_missed',
    choices: [
      {
        id: 'field_substitute_quietly',
        text: 'Field emergency substitute (quietly)',
        description: 'Handle the roster swap internally without public comment.',
        effects: [
          { target: 'move_to_reserve', effectPlayerSelector: 'triggering' },
          { target: 'set_flag', flag: 'substitute_taking_over_{playerId}', flagDuration: 21 },
          { target: 'set_flag', flag: 'visa_delayed_{playerId}', flagDuration: 21 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -5 },
          { target: 'clear_flag', flag: 'visa_application_pending_{playerId}' },
        ],
        outcomeText: "The org moves quickly behind the scenes, fielding a substitute without public statement. Internally the team is shaken, but the show must go on.",
      },
      {
        id: 'lobby_expedited_approval',
        text: 'Lobby for expedited approval',
        description: 'Spend org resources to push the visa through official channels faster.',
        effects: [
          { target: 'move_to_reserve', effectPlayerSelector: 'triggering' },
          { target: 'set_flag', flag: 'substitute_taking_over_{playerId}', flagDuration: 21 },
          { target: 'set_flag', flag: 'visa_delayed_{playerId}', flagDuration: 21 },
          { target: 'team_budget', delta: -10000 },
          { target: 'set_flag', flag: 'visa_expedited_{playerId}', flagDuration: 10 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 3 },
          { target: 'clear_flag', flag: 'visa_application_pending_{playerId}' },
        ],
        outcomeText: "Significant resources are committed to pushing the visa through. The player appreciates the effort, but results aren't guaranteed.",
      },
      {
        id: 'release_public_statement',
        text: 'Release a public statement',
        description: 'Publicly acknowledge the visa situation to get ahead of the story.',
        effects: [
          { target: 'move_to_reserve', effectPlayerSelector: 'triggering' },
          { target: 'set_flag', flag: 'substitute_taking_over_{playerId}', flagDuration: 21 },
          { target: 'set_flag', flag: 'visa_delayed_{playerId}', flagDuration: 21 },
          { target: 'set_flag', flag: 'visa_public_attention', flagDuration: 14 },
          { target: 'team_sponsor_trust', delta: -5 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -3 },
          { target: 'clear_flag', flag: 'visa_application_pending_{playerId}' },
        ],
        outcomeText: "The org goes public — fans rally around the player, but admin scrutiny increases and sponsors are watching closely.",
      },
    ],
  },

  {
    id: 'visa_approved_lastminute',
    category: 'visa_arc',
    severity: 'minor',
    title: 'Last-Minute Visa Approval!',
    description: "Breaking news — {playerName}'s visa has been approved. They can rejoin the active roster immediately.",
    conditions: [
      { type: 'flag_active', flag: 'visa_delayed_{playerId}', playerSelector: 'condition_match' },
      { type: 'flag_not_active', flag: 'visa_tournament_missed_{playerId}', playerSelector: 'condition_match' },
      { type: 'tournament_active' },
    ],
    probability: 25,
    cooldownDays: 3,
    effects: [
      { target: 'move_to_active', effectPlayerSelector: 'triggering' },
      { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
      { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
      { target: 'player_morale', effectPlayerSelector: 'all', delta: 8 },
      { target: 'team_sponsor_trust', delta: 3 },
      { target: 'set_flag', flag: 'visa_player_returned_{playerId}', flagDuration: 7 },
    ],
  },

  {
    id: 'visa_tournament_missed',
    category: 'visa_arc',
    severity: 'major',
    title: 'Tournament Opportunity Lost',
    description: "{playerName}'s visa situation has not resolved in time. They have definitively missed tournament participation. How does the org respond publicly?",
    conditions: [
      { type: 'flag_active', flag: 'visa_delayed_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 90,
    durationDays: 14,
    effects: [
      { target: 'set_flag', flag: 'visa_tournament_missed_{playerId}', flagDuration: 90 },
    ],
    autoResolveEffects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -10 },
      { target: 'team_sponsor_trust', delta: -10 },
      { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
      { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
    ],
    choices: [
      {
        id: 'internal_accountability_review',
        text: 'Launch internal accountability review',
        description: 'Commit to a formal internal process review to prevent future occurrences.',
        effects: [
          { target: 'set_flag', flag: 'visa_admin_review', flagDuration: 30 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
          { target: 'team_budget', delta: -5000 },
          { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
          { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
        ],
        outcomeText: "The org commits to a full internal review. It signals seriousness but the process is costly and morale takes a hit.",
      },
      {
        id: 'public_apology_support',
        text: 'Issue public apology and support the player',
        description: 'Put the player front and center — the org failed them, not the other way around.',
        effects: [
          { target: 'set_flag', flag: 'visa_public_apology', flagDuration: 14 },
          { target: 'team_sponsor_trust', delta: -8 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -3 },
          { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
          { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
        ],
        outcomeText: "The public apology generates empathy for the player, but sponsors see org disorganization and trust erodes.",
      },
      {
        id: 'refocus_substitute_narrative',
        text: 'Refocus the narrative on the substitute lineup',
        description: "Shift attention to the team's resilience and the substitute's opportunity.",
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'set_flag', flag: 'team_underdog_refocus', flagDuration: 21 },
          { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
          { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
        ],
        outcomeText: "The team rallies around the substitute narrative. Morale lifts and chemistry tightens as everyone refocuses on what's ahead.",
      },
    ],
  },

  {
    id: 'substitute_spotlight_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Substitute Steps Up',
    description: "The substitute lineup just secured a win. The emergency decision is looking inspired — the team's depth is showing.",
    conditions: [
      { type: 'flag_active', flag: 'substitute_taking_over_{playerId}', playerSelector: 'condition_match' },
      { type: 'team_win_streak', streakLength: 1 },
    ],
    probability: 55,
    cooldownDays: 7,
    effects: [
      { target: 'team_chemistry', delta: 5 },
      { target: 'team_sponsor_trust', delta: 5 },
      { target: 'set_flag', flag: 'substitute_proving_ground', flagDuration: 14 },
    ],
  },

  {
    id: 'substitute_struggles_under_pressure',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Substitute Feeling the Pressure',
    description: "The substitute lineup dropped a match. Playing without the full roster is taking its toll on team cohesion.",
    conditions: [
      { type: 'flag_active', flag: 'substitute_taking_over_{playerId}', playerSelector: 'condition_match' },
      { type: 'team_loss_streak', streakLength: 1 },
      { type: 'random_chance', chance: 40 },
    ],
    probability: 45,
    cooldownDays: 7,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -5 },
      { target: 'team_chemistry', delta: -3 },
    ],
  },

  {
    id: 'visa_admin_failure_backlash',
    category: 'visa_arc',
    severity: 'major',
    title: 'Admin Failure Goes Public',
    description: "The org's admission of administrative failure has triggered a broader backlash. Sponsors are asking questions and fans are demanding answers.",
    conditions: [
      { type: 'flag_active', flag: 'visa_public_attention' },
    ],
    probability: 80,
    cooldownDays: 3,
    choices: [
      {
        id: 'announce_formal_process_review',
        text: 'Announce formal process review',
        description: 'Commit publicly to structural changes in how the org handles admin.',
        effects: [
          { target: 'team_budget', delta: -15000 },
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'set_flag', flag: 'visa_admin_reformed', flagDuration: 30 },
        ],
        outcomeText: "Committing to a formal review costs money but earns sponsor confidence. The org is seen as taking accountability seriously.",
      },
      {
        id: 'keep_internal_no_comment',
        text: 'Keep it internal, no further comment',
        description: "Don't feed the story — handle it privately and let it blow over.",
        effects: [
          { target: 'team_sponsor_trust', delta: -8 },
          { target: 'team_chemistry', delta: -3 },
        ],
        outcomeText: "The silence reads as deflection. Sponsors lose further trust and the team feels the org isn't fighting for them.",
      },
      {
        id: 'redirect_tournament_performance',
        text: 'Redirect focus to tournament performance',
        description: "Let the team's results on stage answer the critics.",
        effects: [
          { target: 'team_hype', delta: 5 },
          { target: 'team_sponsor_trust', delta: -5 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -3 },
        ],
        outcomeText: "The pivot to performance creates short-term hype but sponsors and fans see through the deflection. Morale dips from the lack of resolution.",
      },
    ],
  },

];
