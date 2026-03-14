import type { DramaEventTemplate } from '../../types/drama';

export const COACHING_BEEF_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // ENTRY — minor toast
  // ==========================================================================

  {
    id: 'coach_beef_snub_incident',
    category: 'coaching_beef',
    severity: 'minor',
    title: 'The handshake that wasn\'t',
    description:
      'On-stage after the match, the rival coach walked right past your hand. It might have been nothing. The broadcast caught it.',
    conditions: [
      { type: 'tournament_active' },
      { type: 'has_rivalry' },
      { type: 'flag_not_active', flag: 'coaching_beef_arc_active' },
    ],
    probability: 40,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_hype', delta: 3 },
      { target: 'set_flag', flag: 'coaching_beef_arc_active', flagDuration: 35 },
    ],
    escalateDays: 3,
    escalationTemplateId: 'coach_beef_media_storm',
  },

  // ==========================================================================
  // MAJOR — media storm (arc branching point)
  // ==========================================================================

  {
    id: 'coach_beef_media_storm',
    category: 'coaching_beef',
    severity: 'major',
    title: 'The clip is everywhere. Now they want your statement.',
    description:
      'The handshake snub from the post-match stage has hit socials. Every broadcast panel is running the clip in slow motion. The rival coach hasn\'t said anything publicly — but someone from their org just liked a very pointed tweet.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_arc_active' },
    ],
    probability: 75,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'accuse_publicly',
        text: 'Go on record — accuse them of scrim leaks',
        description: 'Turn the snub into a full accusation. Name it publicly.',
        effects: [
          { target: 'team_hype', delta: 8 },
          { target: 'team_sponsor_trust', delta: -4 },
          { target: 'set_flag', flag: 'coaching_beef_accused_public', flagDuration: 21 },
        ],
        outcomeText:
          'The statement drops at 11pm. By morning it\'s the top post in every community. The rival org hasn\'t responded. Your players are buzzing — not all of them in a good way.',
      },
      {
        id: 'stay_vague',
        text: 'Stay vague — fuel the speculation',
        description: 'Let the community do the work. Don\'t confirm or deny.',
        effects: [
          { target: 'team_hype', delta: 4 },
          { target: 'set_flag', flag: 'coaching_beef_media_speculation', flagDuration: 14 },
        ],
        outcomeText:
          '"We\'re focused on what happens on the server." The non-answer lands louder than a statement would have. The thread hits 2k replies.',
      },
      {
        id: 'squash_it',
        text: 'Squash it — reach out and make it right',
        description: 'Professionalism wins. Address it directly with the rival coach.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 5 },
          { target: 'team_sponsor_trust', delta: 6 },
          { target: 'clear_flag', flag: 'coaching_beef_arc_active' },
        ],
        outcomeText:
          'The DM conversation stays private. A joint statement goes out two days later — "mutual respect, moving forward." The community is mildly disappointed. The team feels lighter.',
      },
    ],
  },

  // ==========================================================================
  // PATH A — Public Accusation
  // ==========================================================================

  {
    id: 'coach_beef_prove_it_or_retire',
    category: 'coaching_beef',
    severity: 'major',
    title: '"Prove it or retire."',
    description:
      'The rival coach has responded — and they didn\'t hold back. A three-paragraph post ending with a direct challenge. The community is demanding your next move.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_accused_public' },
    ],
    probability: 80,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'reveal_evidence',
        text: 'Reveal the evidence',
        description: 'Put the receipts out. Timestamps, clips, the works.',
        effects: [
          { target: 'team_hype', delta: 10 },
          { target: 'team_sponsor_trust', delta: -3 },
          { target: 'set_flag', flag: 'coaching_beef_evidence_submitted', flagDuration: 21 },
        ],
        outcomeText:
          'The evidence drops in a twitlonger. Timestamps, partial VOD references, a paper trail. Whether it\'s enough to prove anything is unclear — but the community is treating it like a trial.',
      },
      {
        id: 'double_down',
        text: 'Double down — make it personal',
        description: 'Take the gloves off. Don\'t provide evidence, just escalate.',
        effects: [
          { target: 'team_hype', delta: 15 },
          { target: 'team_sponsor_trust', delta: -10 },
          { target: 'set_flag', flag: 'coaching_beef_no_evidence', flagDuration: 21 },
        ],
        outcomeText:
          '"You want evidence? Come win a match first." The quote goes instantly viral. Your sponsors are calling your agent. Three players asked the team manager if this is normal.',
      },
      {
        id: 'quietly_backtrack',
        text: 'Quietly backtrack',
        description: 'Walk it back. Take the L quietly.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -10 },
          { target: 'team_sponsor_trust', delta: 3 },
          { target: 'set_flag', flag: 'coaching_beef_credibility_hit', flagDuration: 14 },
          { target: 'clear_flag', flag: 'coaching_beef_accused_public' },
        ],
        outcomeText:
          'The updated statement is careful and says nothing. The community reads through it instantly. Your players find out through Twitter. The locker room is quiet in the worst way.',
      },
    ],
  },

  {
    id: 'coach_beef_riot_investigates',
    category: 'coaching_beef',
    severity: 'minor',
    title: 'Riot opens a review',
    description:
      'The league office has acknowledged the scrim leak allegations and opened a formal review. No timeline, no public statements — just a confirmation that it\'s being looked into.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_evidence_submitted' },
    ],
    probability: 80,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_sponsor_trust', delta: 4 },
      { target: 'team_hype', delta: 5 },
    ],
  },

  {
    id: 'coach_beef_unfounded_fallout',
    category: 'coaching_beef',
    severity: 'minor',
    title: 'The receipts didn\'t hold up',
    description:
      'The community verdict is in and it\'s not good. The timeline has holes. The clips are ambiguous. The rival org released a counter-statement that landed clean.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_no_evidence' },
    ],
    probability: 80,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_sponsor_trust', delta: -6 },
      { target: 'team_hype', delta: -5 },
      { target: 'team_chemistry', delta: -4 },
    ],
  },

  // ==========================================================================
  // PATH B — Simmering speculation
  // ==========================================================================

  {
    id: 'coach_beef_personal_escalation',
    category: 'coaching_beef',
    severity: 'major',
    title: 'It\'s not about scrim leaks anymore',
    description:
      'The rival coach just posted a photo from your shared org days — captioned "this is who gives lectures on integrity." The photo is real. The community is losing it.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_media_speculation' },
    ],
    probability: 75,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'blast_them_public',
        text: 'Blast them publicly',
        description: 'Take it to the timeline. Full send.',
        effects: [
          { target: 'team_hype', delta: 12 },
          { target: 'team_sponsor_trust', delta: -8 },
          { target: 'set_flag', flag: 'coaching_beef_rivalry_intensified', flagDuration: 30 },
          { target: 'clear_flag', flag: 'coaching_beef_media_speculation' },
        ],
        outcomeText:
          'The thread goes nuclear. Seven tweets. Each one worse than the last. Your team finds out by reading it like everyone else. The rivalry is now officially personal.',
      },
      {
        id: 'file_riot_complaint',
        text: 'File a complaint with Riot',
        description: 'Let the process handle it. Escalate through official channels.',
        effects: [
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'team_hype', delta: 2 },
          { target: 'clear_flag', flag: 'coaching_beef_media_speculation' },
        ],
        outcomeText:
          'The complaint is filed quietly. A league rep responds within 48 hours. Your statement: "We\'re letting the process work." The community respects it even if they\'re bored by it.',
      },
      {
        id: 'rise_above',
        text: 'Rise above it',
        description: 'Don\'t dignify it with a response. Let it play out.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 6 },
          { target: 'team_chemistry', delta: 5 },
          { target: 'set_flag', flag: 'coaching_beef_high_ground', flagDuration: 14 },
          { target: 'clear_flag', flag: 'coaching_beef_media_speculation' },
        ],
        outcomeText:
          'No statement. No reply. Three days later, in a post-match interview, you say: "We\'re focused on what matters." The clip quietly goes viral in the right circles.',
      },
    ],
  },

  {
    id: 'coach_beef_cold_war_ongoing',
    category: 'coaching_beef',
    severity: 'minor',
    title: 'The cold war has a body count',
    description:
      'Two weeks of public hostility between coaching staffs and the circuit is starting to feel it. Match previews lead with the beef. Players from both teams are answering questions about it at every presser.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_rivalry_intensified' },
    ],
    probability: 75,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_hype', delta: 6 },
      { target: 'team_sponsor_trust', delta: -4 },
    ],
  },

  {
    id: 'coach_beef_moral_victory',
    category: 'coaching_beef',
    severity: 'minor',
    title: 'The high road has better optics',
    description:
      'The rival coach posted again. You didn\'t respond. The community noticed. An analyst account broke down the timeline and your restraint is getting more coverage than the original incident.',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_high_ground' },
    ],
    probability: 75,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_hype', delta: 6 },
      { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 5 },
      { target: 'team_chemistry', delta: 4 },
    ],
  },
];
