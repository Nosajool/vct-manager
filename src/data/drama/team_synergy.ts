import type { DramaEventTemplate } from '../../types/drama';

export const TEAM_SYNERGY_EVENTS: DramaEventTemplate[] = [

  // ==========================================================================
  // ARC 1: "Lost in Translation"
  //
  // An import player starts reverting to their native language under scrim
  // pressure. Teammates miss callouts. Rounds are dropped not from skill gaps
  // but from communication gaps.
  //
  // synergy_lang_barrier (minor, arc-entry)
  //   → [7d escalation] synergy_comms_restructure (major, terminal)
  //
  // synergy_lang_performance_impact fires independently while flag active
  // ==========================================================================

  {
    id: 'synergy_lang_barrier',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Lost in Translation',
    description: 'Under pressure in scrims, {playerName} has been defaulting to their native language for mid-round calls. The rest of the roster can\'t process the information fast enough. Rounds are being dropped on the back of missed callouts.',
    conditions: [
      { type: 'player_is_import', playerSelector: 'condition_match' },
      { type: 'team_chemistry_below', threshold: 60 },
      { type: 'scrim_count_min', threshold: 8 },
      { type: 'flag_not_active', flag: 'synergy_lang_resolved' },
    ],
    probability: 55,
    cooldownDays: 14,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -6 },
      { target: 'set_flag', flag: 'synergy_lang_active_{playerId}', flagDuration: 21 },
    ],
    escalateDays: 7,
    escalationTemplateId: 'synergy_comms_restructure',
  },

  {
    id: 'synergy_lang_performance_impact',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Communication Gaps Showing',
    description: 'r/ValorantCompetitive is noticing your team\'s coordination issues. "Their mid-round defaults look confused lately" is getting upvoted. Internally you know exactly why.',
    conditions: [
      { type: 'flag_active', flag: 'synergy_lang_active_{playerId}', playerSelector: 'condition_match' },
      { type: 'random_chance', chance: 50 },
    ],
    probability: 70,
    cooldownDays: 10,
    socialFormat: {
      platform: 'reddit',
      handle: 'r/ValorantCompetitive',
      flavorReactions: { upvotes: 1700 },
    },
    effects: [
      { target: 'team_chemistry', delta: -5 },
    ],
  },

  {
    id: 'synergy_comms_restructure',
    category: 'team_synergy',
    severity: 'major',
    title: 'The Comms Meeting',
    description: 'You\'ve pulled the roster together. {playerName} is in the room. Everyone knows what this is about. How you handle this sets the tone for how the team treats language and communication going forward.',
    conditions: [
      { type: 'flag_active', flag: 'synergy_lang_active_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 90,
    cooldownDays: 7,
    effects: [
      { target: 'set_flag', flag: 'synergy_lang_resolved', flagDuration: 30 },
    ],
    choices: [
      {
        id: 'english_mandate',
        text: 'English-only in comms — no exceptions',
        description: 'Set a hard policy: all callouts and mid-round calls in English',
        effects: [
          { target: 'team_chemistry', delta: -8 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
          { target: 'set_flag', flag: 'synergy_comms_mandate', flagDuration: 14 },
          { target: 'clear_flag', flag: 'synergy_lang_active_{playerId}' },
        ],
        outcomeText: 'You lay it out clearly: English in comms, always. {playerName} understands. It\'s uncomfortable and they\'ll struggle at first — but the team at least knows what to expect.',
      },
      {
        id: 'bilingual_analyst',
        text: 'Hire a bilingual analyst to bridge the gap',
        description: 'Invest in the communication infrastructure',
        effects: [
          { target: 'team_budget', delta: -8000 },
          { target: 'team_chemistry', delta: 8 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 5 },
          { target: 'clear_flag', flag: 'synergy_lang_active_{playerId}' },
        ],
        outcomeText: 'You bring in an analyst who can work both languages and help translate callout systems. It costs, but the team starts clicking in scrims within the week.',
      },
      {
        id: 'reduce_call_burden',
        text: 'Adjust their role to reduce call responsibility',
        description: 'Keep them in a role where execution matters more than verbal leadership',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'set_flag', flag: 'synergy_role_adjusted_{playerId}', flagDuration: 21 },
          { target: 'clear_flag', flag: 'synergy_lang_active_{playerId}' },
        ],
        outcomeText: 'You restructure their responsibilities — fewer callouts, more execution. {playerName} feels sidelined but understands the reasoning. The comms clean up. Something else may surface.',
      },
    ],
    autoResolveEffects: [
      { target: 'team_chemistry', delta: -10 },
      { target: 'clear_flag', flag: 'synergy_lang_active_{playerId}' },
    ],
  },

  // ==========================================================================
  // ARC 2: "Meta Disconnect"
  //
  // The team is split between two competitive philosophies — structured
  // default-based play vs loose, read-based chaos. Real on rosters with mixed
  // regional backgrounds or players who came up in different metas.
  //
  // synergy_playstyle_clash (minor, arc-entry)
  //   → [7d escalation] synergy_philosophy_confrontation (major, terminal)
  // ==========================================================================

  {
    id: 'synergy_playstyle_clash',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Different Schools of Thought',
    description: 'The losses are exposing a divide that was always there. Some players want structure — defaults, discipline, late-round setups. Others want to run chaos and read the game in real time. In scrims, both approaches are getting called in the same round and neither is working.',
    conditions: [
      { type: 'team_chemistry_below', threshold: 60 },
      { type: 'team_loss_streak', streakLength: 2 },
      { type: 'flag_not_active', flag: 'synergy_philosophy_resolved' },
    ],
    probability: 50,
    cooldownDays: 14,
    effects: [
      { target: 'team_chemistry', delta: -5 },
      { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -3 },
      { target: 'set_flag', flag: 'synergy_style_conflict', flagDuration: 14 },
    ],
    escalateDays: 7,
    escalationTemplateId: 'synergy_philosophy_confrontation',
  },

  {
    id: 'synergy_philosophy_confrontation',
    category: 'team_synergy',
    severity: 'major',
    title: 'Pick a Side',
    description: 'The divide has broken into the open. In the VOD review, two players got into it over whether the team should be running structured setups or reading opponents and going rogue. Everyone else in the room went quiet. You need to make a call.',
    conditions: [
      { type: 'flag_active', flag: 'synergy_style_conflict' },
    ],
    probability: 90,
    cooldownDays: 7,
    socialFormat: {
      platform: 'reddit',
      handle: 'r/ValorantCompetitive',
      flavorReactions: { upvotes: 4200 },
    },
    effects: [
      { target: 'set_flag', flag: 'synergy_philosophy_resolved', flagDuration: 45 },
    ],
    choices: [
      {
        id: 'commit_to_structure',
        text: 'Commit to structure: defaults, discipline',
        description: 'Build around disciplined execution and late-round setups',
        effects: [
          { target: 'player_stat', stat: 'igl', effectPlayerSelector: 'triggering', delta: 3 },
          { target: 'team_chemistry', delta: 5 },
          { target: 'player_morale', effectPlayerSelector: 'star_player', delta: -8 },
          { target: 'clear_flag', flag: 'synergy_style_conflict' },
          { target: 'set_flag', flag: 'team_committed_structure', flagDuration: 30 },
        ],
        outcomeText: 'You tell the room: the system wins games, not individuals. The IGL nods. The fraggers go quiet. Structure starts taking hold in scrims — but some players feel like the leash is on.',
      },
      {
        id: 'give_fraggers_freedom',
        text: 'Give the fraggers creative freedom',
        description: 'Trust your mechanical talent to read and react',
        effects: [
          { target: 'player_stat', stat: 'mechanics', effectPlayerSelector: 'star_player', delta: 3 },
          { target: 'set_flag', flag: 'team_rep_hype', flagDuration: 10 },
          { target: 'team_chemistry', delta: -8 },
          { target: 'clear_flag', flag: 'synergy_style_conflict' },
        ],
        outcomeText: 'You give them the freedom they\'re asking for. The highlight plays come — and so do the chaotic losses. Wins feel explosive. Losses feel uncontrolled.',
      },
      {
        id: 'hybrid_system',
        text: 'Build a hybrid: structure with freedom inside it',
        description: 'Define the framework, then let players express within it',
        effects: [
          { target: 'team_chemistry', delta: 10 },
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 3 },
          { target: 'clear_flag', flag: 'synergy_style_conflict' },
        ],
        outcomeText: 'You spend two weeks building a system that gives fraggers room to read within a defined structure. It\'s slower to develop. But when it clicks, it looks like the best of both worlds.',
      },
    ],
    autoResolveEffects: [
      { target: 'team_chemistry', delta: -8 },
      { target: 'clear_flag', flag: 'synergy_style_conflict' },
    ],
  },

];
