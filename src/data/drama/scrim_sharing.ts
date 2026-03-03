import type { DramaEventTemplate } from '../../types/drama';

export const SCRIM_SHARING_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // BRANCH A — VICTIM ARC: "They're using our strats"
  // ==========================================================================

  {
    id: 'scrim_leak_suspicion_emerges',
    category: 'scrim_sharing',
    severity: 'minor',
    title: 'Something Doesn\'t Add Up',
    description: 'Your coaching staff has flagged something suspicious — the opponent walked into your last match knowing exactly where to be. The timing matches your scrim schedule too closely to be coincidence.',
    conditions: [
      { type: 'scrim_vod_risk_above', threshold: 45 },
      { type: 'scrim_count_min', threshold: 8 },
      { type: 'tournament_active' },
      { type: 'flag_not_active', flag: 'scrim_leak_arc_active' },
    ],
    probability: 18,
    cooldownDays: 5,
    requiresPlayerTeam: true,
    effects: [
      { target: 'set_flag', flag: 'scrim_leak_arc_active', flagDuration: 35 },
    ],
    escalateDays: 3,
    escalationTemplateId: 'scrim_leak_confrontation',
  },

  {
    id: 'scrim_leak_confrontation',
    category: 'scrim_sharing',
    severity: 'major',
    title: 'The Evidence Is There',
    description: 'Your assistant coach has compiled timestamps matching your scrim VOD from last week against a coach who played your next opponent. You have enough to make a case — or enough to quietly change your strats and move on.',
    conditions: [
      { type: 'flag_active', flag: 'scrim_leak_arc_active' },
    ],
    probability: 88,
    choices: [
      {
        id: 'go_public',
        text: 'Go public with the accusation',
        description: 'Take the evidence to the community and let the scene judge.',
        effects: [
          { target: 'team_hype', delta: 6 },
          { target: 'team_sponsor_trust', delta: -8 },
          { target: 'set_flag', flag: 'scrim_accuse_public', flagDuration: 21 },
          { target: 'clear_flag', flag: 'scrim_leak_arc_active' },
        ],
        outcomeText: 'You post the clips. Within hours it\'s everywhere — VCT Twitter is talking about nothing else. The community is divided, but everyone knows your name.',
        triggersEventId: 'scrim_public_fallout',
      },
      {
        id: 'investigate_quietly',
        text: 'Investigate quietly before escalating',
        description: 'Compile more evidence before going public — or decide this isn\'t worth it.',
        effects: [
          { target: 'set_flag', flag: 'scrim_investigate_quietly', flagDuration: 14 },
          { target: 'clear_flag', flag: 'scrim_leak_arc_active' },
        ],
        outcomeText: 'You keep the findings internal. Your analysts begin a deeper review. The next two weeks will determine whether this goes further.',
      },
      {
        id: 'adjust_and_move_on',
        text: 'Adjust your strats and move on',
        description: 'Don\'t feed the drama — change your playbook and make their intel worthless.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -3 },
          { target: 'set_flag', flag: 'scrim_leak_accepted', flagDuration: 10 },
          { target: 'clear_flag', flag: 'scrim_leak_arc_active' },
        ],
        outcomeText: 'You swallow it. The team adjusts the book — but there\'s a quiet anger in the building that takes days to fade.',
      },
    ],
  },

  {
    id: 'scrim_public_fallout',
    category: 'scrim_sharing',
    severity: 'minor',
    title: 'Controversy Ignites Online',
    description: 'The accusation has gone viral. Community figures are taking sides and media outlets are asking for comment. The narrative is gaining momentum.',
    conditions: [
      { type: 'flag_active', flag: 'scrim_accuse_public' },
    ],
    probability: 95,
    cooldownDays: 7,
    effects: [
      { target: 'set_flag', flag: 'media_narrative_scrim_controversy', flagDuration: 21 },
    ],
    probabilityBoostedBy: [
      { flag: 'scrim_accuse_public', boost: 25 },
    ],
  },

  {
    id: 'scrim_investigation_result',
    category: 'scrim_sharing',
    severity: 'major',
    title: 'Investigation Complete',
    description: 'Your coaching staff has finished their internal review. The findings are on the table.',
    conditions: [
      { type: 'flag_active', flag: 'scrim_investigate_quietly' },
    ],
    probability: 80,
    escalateDays: 7,
    choices: [
      {
        id: 'report_to_league',
        text: 'Evidence found — escalate to league',
        description: 'Submit your findings through official channels and let Riot handle it.',
        effects: [
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'set_flag', flag: 'scrim_reported_to_league', flagDuration: 30 },
          { target: 'clear_flag', flag: 'scrim_investigate_quietly' },
        ],
        outcomeText: 'You file a formal report with Riot. Whether they act on it is another question — but you\'ve done the right thing.',
      },
      {
        id: 'inconclusive_drop',
        text: 'Results inconclusive — drop it',
        description: 'The evidence isn\'t airtight. Pushing further could make you look paranoid.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -3 },
          { target: 'clear_flag', flag: 'scrim_investigate_quietly' },
        ],
        outcomeText: 'Nothing definitive. The team absorbs the frustration of not knowing, and quietly updates the book.',
      },
      {
        id: 'drop_completely',
        text: 'Drop it entirely',
        description: 'This scene runs on trust. Not every suspicion is worth the drama it creates.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -2 },
          { target: 'clear_flag', flag: 'scrim_investigate_quietly' },
        ],
        outcomeText: 'You let it go. Some of the staff disagree, but you\'ve decided the cost of escalating outweighs the benefit.',
      },
    ],
  },

  // ==========================================================================
  // BRANCH B — MORAL DILEMMA: "Someone's offering us their strats"
  // ==========================================================================

  {
    id: 'scrim_intel_offer',
    category: 'scrim_sharing',
    severity: 'major',
    title: 'An Offer You Shouldn\'t Consider',
    description: 'A message arrives through unofficial channels — someone with connections to your next opponent is willing to share their scrim VODs for the right price. No one would know.',
    conditions: [
      { type: 'scrim_vod_risk_above', threshold: 30 },
      { type: 'scrim_count_min', threshold: 5 },
      { type: 'tournament_active' },
      { type: 'flag_not_active', flag: 'scrim_intel_accepted' },
      { type: 'flag_not_active', flag: 'scrim_intel_offer_resolved' },
    ],
    probability: 14,
    cooldownDays: 7,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'accept_intel',
        text: 'Accept the offer',
        description: 'This is the scene. Everyone finds edges wherever they can.',
        effects: [
          { target: 'set_flag', flag: 'scrim_intel_accepted', flagDuration: 21 },
          { target: 'set_flag', flag: 'scrim_intel_offer_resolved', flagDuration: 7 },
        ],
        outcomeText: 'The files land in your inbox that night. You tell yourself this is just prep. But you know what it is.',
      },
      {
        id: 'decline_intel',
        text: 'Delete and move on',
        description: 'You know where this road leads.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'team_sponsor_trust', delta: 3 },
          { target: 'set_flag', flag: 'scrim_intel_declined', flagDuration: 14 },
          { target: 'set_flag', flag: 'scrim_intel_offer_resolved', flagDuration: 7 },
        ],
        outcomeText: 'You delete the message. The team never knows it existed. That feels right.',
      },
      {
        id: 'report_intel_to_league',
        text: 'Report it to the league',
        description: 'If someone\'s offering this to you, they\'re offering it to others.',
        effects: [
          { target: 'team_hype', delta: 8 },
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'set_flag', flag: 'scrim_reported_to_league', flagDuration: 30 },
          { target: 'set_flag', flag: 'scrim_intel_offer_resolved', flagDuration: 7 },
        ],
        outcomeText: 'You forward the message to Riot with a full record of the exchange. Whether they act on it is up to them.',
        triggersEventId: 'scrim_league_response',
      },
    ],
  },

  {
    id: 'scrim_league_response',
    category: 'scrim_sharing',
    severity: 'major',
    title: 'Riot Has Acknowledged Your Report',
    description: 'Riot has acknowledged your report. The question is whether they\'ll actually do anything about it.',
    conditions: [
      { type: 'flag_active', flag: 'scrim_reported_to_league' },
    ],
    probability: 85,
    choices: [
      {
        id: 'push_for_sanctions',
        text: 'Push for formal sanctions',
        description: 'This needs teeth. Without enforcement, nothing changes.',
        effects: [
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'set_flag', flag: 'scrim_league_sanctions_pushed', flagDuration: 21 },
          { target: 'clear_flag', flag: 'scrim_reported_to_league' },
        ],
        outcomeText: 'You go on record pushing for formal league action. Riot says they\'re "reviewing the situation." The community watches.',
      },
      {
        id: 'let_riot_handle',
        text: 'Let Riot handle it their way',
        description: 'You\'ve done your part. Trust the process.',
        effects: [
          { target: 'set_flag', flag: 'scrim_league_deferred', flagDuration: 14 },
          { target: 'clear_flag', flag: 'scrim_reported_to_league' },
        ],
        outcomeText: 'Riot thanks you for the report and says they\'ll handle it internally. Two weeks later there\'s no announcement.',
      },
      {
        id: 'make_league_report_public',
        text: 'Make it public',
        description: 'If the league won\'t act, the community will pressure them to.',
        effects: [
          { target: 'team_hype', delta: 6 },
          { target: 'team_sponsor_trust', delta: -8 },
          { target: 'set_flag', flag: 'scrim_accuse_public', flagDuration: 21 },
          { target: 'clear_flag', flag: 'scrim_reported_to_league' },
        ],
        outcomeText: 'You release a statement detailing what you reported and what happened — or didn\'t happen — next.',
      },
    ],
  },

  // ==========================================================================
  // BRANCH C — DEFENSE ARC: "They're saying it was us"
  // ==========================================================================

  {
    id: 'scrim_accused_by_rival',
    category: 'scrim_sharing',
    severity: 'minor',
    title: 'A Rival Points Fingers',
    description: 'A rival team is dropping hints on social media about a VOD leak — and the timing lines up with your schedule. Your name hasn\'t been said yet, but everyone knows who they\'re talking about.',
    conditions: [
      { type: 'scrim_vod_risk_above', threshold: 50 },
      { type: 'has_rivalry' },
      { type: 'flag_not_active', flag: 'scrim_accused_active' },
      { type: 'flag_not_active', flag: 'scrim_leak_arc_active' },
    ],
    probability: 12,
    cooldownDays: 7,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_hype', delta: -8 },
      { target: 'team_sponsor_trust', delta: -5 },
      { target: 'set_flag', flag: 'scrim_accused_active', flagDuration: 21 },
    ],
    escalateDays: 3,
    escalationTemplateId: 'scrim_defending_accusations',
  },

  {
    id: 'scrim_defending_accusations',
    category: 'scrim_sharing',
    severity: 'major',
    title: 'Your Name Is In the Thread',
    description: 'The rival coach has gone further — screenshots are circulating. Your coaching staff is furious. The community is waiting for your response.',
    conditions: [
      { type: 'flag_active', flag: 'scrim_accused_active' },
    ],
    probability: 88,
    choices: [
      {
        id: 'deny_forceful',
        text: 'Deny publicly and demand evidence',
        description: 'Go on record. Make them back it up or retract it.',
        effects: [
          { target: 'team_hype', delta: 5 },
          { target: 'set_flag', flag: 'scrim_deny_forceful', flagDuration: 14 },
          { target: 'set_flag', flag: 'rivalry_intensified', flagDuration: 30 },
          { target: 'clear_flag', flag: 'scrim_accused_active' },
        ],
        outcomeText: 'You post a response demanding they name you directly and provide proof. The rivalry just reached a new level.',
      },
      {
        id: 'request_mediation',
        text: 'Request a mediated meeting',
        description: 'Handle this off Twitter. A private conversation might resolve more than a public war.',
        effects: [
          { target: 'team_chemistry', delta: 5 },
          { target: 'set_flag', flag: 'scrim_mediated_discussion', flagDuration: 14 },
          { target: 'clear_flag', flag: 'scrim_accused_active' },
        ],
        outcomeText: 'You reach out privately through shared contacts. The meeting is tense but professional. No resolution — but no escalation either.',
      },
      {
        id: 'dare_to_name',
        text: 'Challenge them to name you directly',
        description: 'Call the bluff. Either they have proof or they\'re just stirring drama.',
        effects: [
          { target: 'team_hype', delta: 10 },
          { target: 'set_flag', flag: 'scrim_dare_to_name', flagDuration: 10 },
          { target: 'set_flag', flag: 'rivalry_intensified', flagDuration: 30 },
          { target: 'clear_flag', flag: 'scrim_accused_active' },
        ],
        outcomeText: 'You post four words: "Say our name, then." The thread explodes. The rival hasn\'t responded yet.',
      },
    ],
  },
];
