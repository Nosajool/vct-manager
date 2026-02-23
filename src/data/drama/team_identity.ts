import type { DramaEventTemplate } from '../../types/drama';

export const TEAM_IDENTITY_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // TEAM IDENTITY (14 templates — Phase 4a/4b)
  // Sets and reacts to team-level identity flags
  // ==========================================================================

  {
    id: 'identity_star_carry_emerges',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Star Carry Identity Emerges',
    description: '{playerName} is playing at a level well above their teammates right now. {teamName}\'s identity is crystallizing around carrying them to victories.',
    conditions: [
      {
        type: 'player_form_above',
        threshold: 75,
        playerSelector: 'star_player',
      },
      {
        type: 'team_chemistry_below',
        threshold: 65,
      },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'team_identity_star_carry',
        flagDuration: 30,
      },
    ],
  },

  {
    id: 'identity_balanced_recognized',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Balanced Team Identity Recognized',
    description: '{teamName} is playing as a cohesive unit. No single star — just five players who make each other better. The results are showing.',
    conditions: [
      {
        type: 'team_chemistry_above',
        threshold: 70,
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'team_identity_balanced',
        flagDuration: 30,
      },
    ],
  },

  {
    id: 'identity_resilient_earned',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Resilient Identity Earned',
    description: '{teamName} keeps finding ways to win from adversity. Everyone saw them as done — and they\'ve proven everyone wrong.',
    conditions: [
      {
        type: 'bracket_position',
        bracketPosition: 'lower',
      },
      {
        type: 'team_win_streak',
        streakLength: 3,
      },
    ],
    probability: 50,
    cooldownDays: 21,
    effects: [
      {
        target: 'set_flag',
        flag: 'team_identity_resilient',
        flagDuration: 60,
      },
      {
        target: 'clear_flag',
        flag: 'team_identity_fragile',
      },
    ],
  },

  {
    id: 'identity_fragile_exposed',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Fragile Identity Exposed',
    description: '{teamName} came in with high expectations — and cracks are showing. The losses are exposing how much of this team\'s confidence was built on momentum.',
    conditions: [
      {
        type: 'player_morale_below',
        threshold: 45,
        playerSelector: 'any',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'team_identity_fragile',
        flagDuration: 30,
      },
      {
        target: 'clear_flag',
        flag: 'team_identity_balanced',
      },
    ],
  },

  // --- Phase 4b: Identity-reactive events ---

  {
    id: 'star_carry_friction',
    category: 'player_ego',
    severity: 'major',
    title: 'Star Carry Friction',
    description: '{playerName} has been quietly absorbing the weight of carrying this team — and someone isn\'t comfortable with that dynamic. The team-first voices in the locker room are getting louder.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_star_carry',
        playerSelector: 'star_player',
      },
      {
        type: 'player_personality',
        personality: 'TEAM_FIRST',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 14,
    choices: [
      {
        id: 'redistribute_roles',
        text: 'Redistribute responsibilities',
        description: 'Break the star dependency — build a flatter structure',
        effects: [
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'star_player',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'team_identity_star_carry',
          },
        ],
        outcomeText: 'The locker room breathes easier. The star player feels the shift — not hostile, but noticeable. The team starts solving problems collectively again.',
      },
      {
        id: 'back_the_carry',
        text: 'Back the star carry structure',
        description: 'Commit to the identity — ask the team to trust the process',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'star_player',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: -6,
          },
          {
            target: 'set_flag',
            flag: 'team_identity_star_carry',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You tell the room to trust the system. The star player responds — elevated, focused. The team-first voices go quiet, for now. Results will determine whether this was the right call.',
      },
      {
        id: 'acknowledge_both',
        text: 'Acknowledge the tension without resolving it',
        description: 'Validate both perspectives — keep the conversation open',
        effects: [
          {
            target: 'team_chemistry',
            delta: 2,
          },
          {
            target: 'set_flag',
            flag: 'star_carry_tension_unresolved',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You name the dynamic without forcing a resolution. Some appreciate the honesty. Others wanted a cleaner answer. The underlying tension remains — you\'ve just made it visible.',
      },
    ],
  },

  {
    id: 'balanced_team_tested',
    category: 'team_synergy',
    severity: 'major',
    title: 'Balanced Team Tested',
    description: '{teamName}\'s harmony has been their edge this tournament — but elimination pressure is a different kind of test. You need to decide how to hold the team together when it matters most.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_balanced',
      },
      {
        type: 'elimination_risk',
      },
    ],
    probability: 60,
    cooldownDays: 21,
    choices: [
      {
        id: 'lean_on_chemistry',
        text: 'Lean into what got you here',
        description: 'Trust the collective — no panic, no changes',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'team_identity_balanced',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You remind the team: nothing changes. The same system that brought you here is what you trust now. The players visibly relax. This is a group that knows how to perform together.',
      },
      {
        id: 'elevate_one_player',
        text: 'Give one player the spotlight',
        description: 'Under pressure, let your best player lead',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'star_player',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'team_identity_balanced',
          },
          {
            target: 'set_flag',
            flag: 'team_identity_star_carry',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You identify the person the team can rally behind and point to them. It shifts the energy — but the balanced identity you built starts to fracture under that weight.',
      },
      {
        id: 'open_team_meeting',
        text: 'Have an open team meeting',
        description: 'Let everyone voice what they\'re feeling before the match',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 3,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'team_identity_balanced',
            flagDuration: 45,
          },
        ],
        outcomeText: 'The meeting is honest, even uncomfortable at moments. But something clears in the room. Players speak who rarely do. When it ends, the team feels closer — and more prepared for what\'s ahead.',
      },
    ],
  },

  {
    id: 'resilient_spirit_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Resilient Spirit Moment',
    description: '{teamName} just won again. The comeback narrative is no longer just a story — it\'s becoming a defining truth about this squad.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_resilient',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 50,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 5,
      },
      {
        target: 'team_chemistry',
        delta: 3,
      },
      {
        target: 'set_flag',
        flag: 'arc_mod_resilient_{playerId}',
        flagDuration: 21,
      },
    ],
  },

  {
    id: 'fragile_crisis_point',
    category: 'external_pressure',
    severity: 'major',
    title: 'Fragile Crisis Point',
    description: '{teamName} is in freefall. The losses have compounded and the mood has turned dark. This team needs a reset — or it risks becoming a cautionary tale.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_fragile',
      },
      {
        type: 'team_loss_streak',
        streakLength: 3,
      },
    ],
    probability: 70,
    cooldownDays: 21,
    choices: [
      {
        id: 'emergency_reset',
        text: 'Call an emergency team reset',
        description: 'Clear the schedule and address the root issues directly',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'clear_flag',
            flag: 'team_identity_fragile',
          },
          {
            target: 'set_flag',
            flag: 'team_crisis_reset',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You cancel practice and bring everyone into a room. No film, no Xs and Os — just people. What comes out is messy and uncomfortable. But something loosens. The team isn\'t fixed — but they\'re honest again.',
      },
      {
        id: 'double_down_on_work',
        text: 'Double down on preparation',
        description: 'More practice, more film, more structure',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'team_identity_fragile',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You push harder. The team follows — exhausted, mechanical, going through motions. The numbers look right. The energy doesn\'t. Sometimes more work is the answer. Sometimes it\'s avoidance.',
      },
      {
        id: 'give_players_agency',
        text: 'Give players agency over the response',
        description: 'Let the team decide how they want to address it',
        effects: [
          {
            target: 'team_chemistry',
            delta: 6,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 4,
          },
          {
            target: 'set_flag',
            flag: 'player_led_recovery',
            flagDuration: 21,
          },
          {
            target: 'clear_flag',
            flag: 'team_identity_fragile',
          },
        ],
        outcomeText: 'You step back and ask the players what they need. Someone speaks first — then another. The conversation finds its own shape. Leadership emerges from unexpected places. You might not direct this recovery, but it\'s happening.',
      },
    ],
    escalateDays: 7,
    escalationTemplateId: 'collapse_risk',
  },

  {
    id: 'identity_shift_star_to_balanced',
    category: 'breakthrough',
    severity: 'major',
    title: 'Identity Shift: Star to Balanced',
    description: '{teamName} is on a win streak and the chemistry has never been higher. {playerName} is starting to distribute the credit — and it\'s changing how the team operates.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_star_carry',
      },
      {
        type: 'team_chemistry_above',
        threshold: 75,
      },
      {
        type: 'team_win_streak',
        streakLength: 3,
      },
    ],
    probability: 45,
    cooldownDays: 21,
    choices: [
      {
        id: 'encourage_the_shift',
        text: 'Encourage the identity evolution',
        description: 'Let the team grow into collective ownership',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 6,
          },
          {
            target: 'clear_flag',
            flag: 'team_identity_star_carry',
          },
          {
            target: 'set_flag',
            flag: 'team_identity_balanced',
            flagDuration: 45,
          },
        ],
        outcomeText: 'You name what\'s happening: the team is maturing. The star player doesn\'t shrink — they expand. Everyone rises. The identity shifts, and the squad feels more complete for it.',
      },
      {
        id: 'maintain_the_carry_structure',
        text: 'Keep the star carry structure',
        description: 'What\'s working — don\'t change the formula',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'star_player',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'team_identity_star_carry',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You pull back from the evolution — it\'s working, why change it? The star player appreciates the clarity. The team follows. It might be the right call. Or you might have stopped something beautiful from happening.',
      },
      {
        id: 'let_it_evolve_naturally',
        text: 'Let it evolve without forcing it',
        description: 'Watch — and trust the team to find its own shape',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'team_identity_balanced',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You step back and observe. The identity isn\'t decided by you — it\'s decided by the team in small moments, in who passes the ball, in who speaks up. You give it space to breathe.',
      },
    ],
  },

  {
    id: 'identity_media_fragile',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Media Pushes Fragile Narrative',
    description: 'The narrative around {teamName} has turned. Media coverage is focused on fragility, early hype, and whether this team can handle pressure. The noise is reaching the locker room.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_fragile',
      },
    ],
    probability: 45,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: -4,
      },
      {
        target: 'set_flag',
        flag: 'media_narrative_fragile',
        flagDuration: 14,
      },
    ],
  },

  {
    id: 'identity_media_resilient',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Media Celebrates Resilience Narrative',
    description: 'The comeback story is writing itself. Media coverage of {teamName} has shifted from doubt to admiration. The narrative is now working in your favor.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_resilient',
      },
    ],
    probability: 45,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 4,
      },
      {
        target: 'set_flag',
        flag: 'media_narrative_resilient',
        flagDuration: 14,
      },
    ],
  },

  {
    id: 'star_carry_pressure_wave',
    category: 'player_ego',
    severity: 'minor',
    title: 'Star Carry Feels the Weight',
    description: '{playerName} is starting to feel the cost of carrying this team. The morale dip is subtle — but visible to anyone paying close attention.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_star_carry',
      },
      {
        type: 'player_morale_below',
        threshold: 50,
        playerSelector: 'star_player',
      },
    ],
    probability: 50,
    cooldownDays: 7,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'star_player',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'arc_mod_fragile_{playerId}',
        flagDuration: 14,
      },
    ],
  },

  {
    id: 'balanced_chemistry_peak',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Balanced Team Peaks',
    description: '{teamName} has reached a rare level of synchronicity. Practice is crisp, communication is effortless, and everyone knows exactly what their role is.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_balanced',
      },
      {
        type: 'team_chemistry_above',
        threshold: 80,
      },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 5,
      },
      {
        target: 'team_chemistry',
        delta: 3,
      },
      {
        target: 'set_flag',
        flag: 'team_peak_cohesion',
        flagDuration: 21,
      },
    ],
  },

  {
    id: 'fragile_first_fight_back',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Fragile Team Fights Back',
    description: 'Against all expectations, {teamName} has strung together consecutive wins. The fragile narrative is cracking — but the team knows how quickly it can return.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'team_identity_fragile',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 60,
    cooldownDays: 7,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 6,
      },
      {
        target: 'team_chemistry',
        delta: 4,
      },
      {
        target: 'clear_flag',
        flag: 'team_identity_fragile',
      },
    ],
  },

  // ==========================================================================
  // KICKOFF FLAG CONSEQUENCES (3 events — consume org_high_expectations,
  // manager_development_focused, manager_underdog_mindset)
  // ==========================================================================

  {
    id: 'pressure_championship_mandate',
    category: 'external_pressure',
    severity: 'major',
    title: 'The Mandate Questioned',
    description: 'After declaring championship-or-bust ambitions at the start of the season, {teamName}\'s stumble has the media demanding answers.',
    conditions: [
      { type: 'flag_active', flag: 'org_high_expectations' },
      { type: 'team_loss_streak', streakLength: 1 },
    ],
    probability: 50,
    cooldownDays: 14,
    choices: [
      {
        id: 'reaffirm',
        text: 'Stand by the standard',
        description: 'Publicly double down on championship expectations',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 3 },
          { target: 'set_flag', flag: 'org_pressure_doubled', flagDuration: 21 },
        ],
        outcomeText: 'The boldness lands with the fanbase and the team rallies around it — but now there\'s nowhere to hide if results don\'t come.',
      },
      {
        id: 'reframe',
        text: 'Reframe as a process goal',
        description: 'Acknowledge the standard while shifting focus to the journey',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'clear_flag', flag: 'org_high_expectations' },
        ],
        outcomeText: 'The adjustment in tone takes pressure off the roster. You\'ve traded some of the hype for steadiness.',
      },
      {
        id: 'deflect',
        text: 'Redirect to the next match',
        description: 'Refuse to engage with the narrative pressure',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 2 },
        ],
        outcomeText: 'The press conference ends without resolution. The question doesn\'t go away — it just waits for the next result.',
      },
    ],
  },

  {
    id: 'development_breakthrough_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Development Paying Off',
    description: 'The practice focus is showing results. {playerName} has been putting in the work and it\'s starting to translate.',
    conditions: [
      { type: 'flag_active', flag: 'manager_development_focused' },
      { type: 'scrim_count_min', threshold: 5 },
      { type: 'no_recent_match' },
    ],
    probability: 40,
    cooldownDays: 10,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
      { target: 'team_chemistry', delta: 5 },
      { target: 'set_flag', flag: 'development_visible_progress', flagDuration: 14 },
    ],
  },

  {
    id: 'underdog_media_doubt',
    category: 'external_pressure',
    severity: 'major',
    title: 'The Analysts Write Them Off',
    description: 'Multiple analysts and casters are publicly dismissing {teamName}\'s playoff chances. The underdog tag has become a punchline.',
    conditions: [
      { type: 'flag_active', flag: 'manager_underdog_mindset' },
      { type: 'team_loss_streak', streakLength: 1 },
    ],
    probability: 45,
    cooldownDays: 14,
    choices: [
      {
        id: 'use_as_fuel',
        text: 'Use it as fuel',
        description: 'Channel the disrespect into motivation',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 8 },
          { target: 'set_flag', flag: 'underdog_chip_active', flagDuration: 21 },
        ],
        outcomeText: 'The locker room comes alive. Everyone has seen the takes. That energy is real — now it needs results to sustain it.',
      },
      {
        id: 'acknowledge',
        text: 'Acknowledge the doubts honestly',
        description: 'Validate the criticism and commit to earned respect',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -2 },
          { target: 'team_chemistry', delta: 7 },
        ],
        outcomeText: 'The honesty lands well internally. Players appreciate not being fed false confidence. The chemistry in practice improves.',
      },
      {
        id: 'stay_quiet',
        text: 'Say nothing publicly',
        description: 'Ignore the noise and stay in your own lane',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 3 },
        ],
        outcomeText: 'No bulletin board material given or taken. The team continues in quiet focus.',
      },
    ],
  },

];
