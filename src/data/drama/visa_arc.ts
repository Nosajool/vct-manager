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
    severity: 'major',
    title: 'Last-Minute Visa Approval!',
    description: "Breaking news — {playerName}'s visa has been approved. They can rejoin the active roster immediately. How do you handle the return?",
    conditions: [
      { type: 'flag_active', flag: 'visa_delayed_{playerId}', playerSelector: 'condition_match' },
      { type: 'flag_not_active', flag: 'visa_tournament_missed_{playerId}', playerSelector: 'condition_match' },
      { type: 'tournament_active' },
    ],
    probability: 40,
    probabilityBoostedBy: [
      { flag: 'visa_expedited_{playerId}', boost: 35 },
    ],
    cooldownDays: 3,
    choices: [
      {
        id: 'celebrate_return_publicly',
        text: 'Announce the return publicly',
        description: 'Make a statement. The player is back and the whole scene should know it.',
        effects: [
          { target: 'move_to_active', effectPlayerSelector: 'triggering' },
          { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
          { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 10 },
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'set_flag', flag: 'visa_player_returned_{playerId}', flagDuration: 7 },
        ],
        outcomeText: "The announcement generates buzz and the team's energy spikes. Sponsors are pleased with the positive optics.",
      },
      {
        id: 'reintegrate_quietly',
        text: 'Bring them back quietly',
        description: 'No fanfare — just get them back in the rotation without disrupting the team rhythm.',
        effects: [
          { target: 'move_to_active', effectPlayerSelector: 'triggering' },
          { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
          { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 8 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'set_flag', flag: 'visa_player_returned_{playerId}', flagDuration: 7 },
        ],
        outcomeText: "The low-key return keeps team dynamics stable. The substitute transition feels natural rather than abrupt.",
      },
      {
        id: 'credit_the_substitute',
        text: 'Welcome them back while crediting the substitute',
        description: "Balance the moment — honor both the returning player and the substitute who stepped up.",
        effects: [
          { target: 'move_to_active', effectPlayerSelector: 'triggering' },
          { target: 'clear_flag', flag: 'visa_delayed_{playerId}' },
          { target: 'clear_flag', flag: 'substitute_taking_over_{playerId}' },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'team_chemistry', delta: 7 },
          { target: 'team_sponsor_trust', delta: 2 },
          { target: 'set_flag', flag: 'visa_player_returned_{playerId}', flagDuration: 7 },
        ],
        outcomeText: "Both players feel valued and the team's chemistry gets a meaningful boost from the inclusive messaging.",
      },
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
    probability: 60,
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
      { type: 'match_result', threshold: 1 },
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
      { type: 'match_result', threshold: 1 },
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


  {
    id: 'underdog_narrative_pays_off',
    category: 'visa_arc',
    severity: 'major',
    title: 'Underdog Story Breaks Through',
    description: "The substitute lineup just won, and the underdog narrative is gaining real traction. Media and fans are rallying behind {teamName}'s resilience. How do you handle the moment?",
    conditions: [
      { type: 'flag_active', flag: 'team_underdog_refocus' },
      { type: 'team_win_streak', streakLength: 1 },
    ],
    probability: 65,
    cooldownDays: 7,
    choices: [
      {
        id: 'lean_into_media',
        text: 'Lean into the narrative — ride the wave',
        description: 'Amplify the underdog story publicly and let the momentum build.',
        effects: [
          { target: 'team_hype', delta: 8 },
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'set_flag', flag: 'underdog_narrative_viral', flagDuration: 14 },
          { target: 'clear_flag', flag: 'team_underdog_refocus' },
        ],
        outcomeText: "The org leans in hard. Clips go viral, sponsors take notice, and the media can't stop talking about {teamName}'s grit.",
      },
      {
        id: 'shield_team_from_noise',
        text: 'Shield the team — stay focused internally',
        description: 'Keep the narrative out of the locker room and protect team concentration.',
        effects: [
          { target: 'team_chemistry', delta: 6 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'clear_flag', flag: 'team_underdog_refocus' },
        ],
        outcomeText: "You keep the energy inside the building. The team stays grounded and the chemistry tightens — this group knows what they're doing.",
      },
      {
        id: 'honor_missing_player',
        text: 'Honor the missing player publicly',
        description: 'Make sure the absent player is part of the story — this win is for them.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 10 },
          { target: 'team_chemistry', delta: 8 },
          { target: 'set_flag', flag: 'underdog_narrative_viral', flagDuration: 14 },
          { target: 'clear_flag', flag: 'team_underdog_refocus' },
        ],
        outcomeText: "You dedicate the moment to the missing player. The entire team feels it — and the gesture resonates far beyond the locker room.",
      },
    ],
  },

  {
    id: 'underdog_narrative_stalls',
    category: 'visa_arc',
    severity: 'minor',
    title: 'Underdog Story Runs Out of Steam',
    description: "Back-to-back losses have deflated the feel-good narrative. The substitute lineup is struggling, and the initial energy has faded.",
    conditions: [
      { type: 'flag_active', flag: 'team_underdog_refocus' },
      { type: 'team_loss_streak', streakLength: 2 },
    ],
    probability: 70,
    cooldownDays: 7,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -6 },
      { target: 'team_hype', delta: -5 },
      { target: 'team_chemistry', delta: -4 },
      { target: 'clear_flag', flag: 'team_underdog_refocus' },
    ],
  },

  {
    id: 'visa_reform_audit',
    category: 'visa_arc',
    severity: 'major',
    title: 'Reform Audit Complete',
    description: "The internal review window for the org's administrative reforms is closing. Sponsors and the community are waiting to see what actually changed. How does {teamName} present the results?",
    conditions: [
      { type: 'flag_active', flag: 'visa_admin_reformed' },
      { type: 'random_chance', chance: 70 },
    ],
    probability: 80,
    cooldownDays: 5,
    choices: [
      {
        id: 'publish_concrete_results',
        text: 'Publish concrete reform results',
        description: 'Release specific policy changes and process documentation publicly.',
        effects: [
          { target: 'team_sponsor_trust', delta: 10 },
          { target: 'set_flag', flag: 'visa_process_certified', flagDuration: 60 },
          { target: 'clear_flag', flag: 'visa_admin_reformed' },
        ],
        outcomeText: "The org releases detailed documentation of the new processes. Sponsors are impressed by the transparency, and the community sees real accountability.",
      },
      {
        id: 'vague_positive_statement',
        text: 'Release a vague positive statement',
        description: 'Acknowledge the review with optimistic language but no specifics.',
        effects: [
          { target: 'team_sponsor_trust', delta: 1 },
          { target: 'team_chemistry', delta: -3 },
          { target: 'clear_flag', flag: 'visa_admin_reformed' },
        ],
        outcomeText: "The statement reads more like PR than accountability. Internally the team notices the lack of substance, and sponsors file it away.",
      },
      {
        id: 'admit_reform_incomplete',
        text: 'Admit the reform is still incomplete',
        description: 'Be honest that the process changes are not yet fully implemented.',
        effects: [
          { target: 'team_sponsor_trust', delta: -8 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -5 },
          { target: 'set_flag', flag: 'visa_admin_failure_recurring', flagDuration: 21 },
          { target: 'clear_flag', flag: 'visa_admin_reformed' },
        ],
        outcomeText: "The admission of incompleteness is honest but damaging. Sponsors pull back on trust, and the team questions whether the org can get its house in order.",
      },
    ],
  },

];
