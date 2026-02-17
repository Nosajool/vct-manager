// Drama Event Template Catalog
// Defines narrative event templates that can trigger during gameplay
// Referenced by the drama system to create dynamic storylines

import type { DramaEventTemplate } from '../types/drama';

// ============================================================================
// DRAMA EVENT TEMPLATES
// ============================================================================

/**
 * Event template catalog with ~20 initial drama events across all categories
 *
 * Categories:
 * - PLAYER EGO: Individual player conflicts and demands
 * - TEAM SYNERGY: Team dynamics and chemistry issues
 * - EXTERNAL PRESSURE: Fan/org/media pressures
 * - PRACTICE/BURNOUT: Training fatigue and motivation
 * - BREAKTHROUGH: Positive growth moments
 * - META RUMORS: Game meta shifts and rumors
 */
export const DRAMA_EVENT_TEMPLATES: DramaEventTemplate[] = [
  // ==========================================================================
  // PLAYER EGO (4 templates)
  // ==========================================================================

  {
    id: 'ego_underutilized',
    category: 'player_ego',
    severity: 'minor',
    title: 'Feeling Underutilized',
    description: '{playerName} feels they\'re not being utilized effectively in scrims and wants more opportunities to shine.',
    conditions: [
      {
        type: 'player_morale_below',
        threshold: 60,
        playerSelector: 'any',
      },
    ],
    probability: 30,
    cooldownDays: 7,
    effects: [
      {
        target: 'player_morale',
        playerSelector: 'any',
        delta: -3,
      },
      {
        target: 'set_flag',
        flag: 'ego_underutilized_{playerId}',
        flagDuration: 14,
      },
    ],
    escalateDays: 7,
    escalationTemplateId: 'ego_role_demand',
  },

  {
    id: 'ego_role_demand',
    category: 'player_ego',
    severity: 'major',
    title: 'Role Change Demand',
    description: '{playerName} has approached you privately, demanding a role change. They believe they could contribute more in a different position.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'ego_underutilized_{playerId}',
      },
    ],
    probability: 80,
    cooldownDays: 10,
    choices: [
      {
        id: 'accommodate',
        text: 'Accommodate their request',
        description: 'Work with them to find a new role that fits',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'specific',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'ego_underutilized_{playerId}',
          },
        ],
        outcomeText: '{playerName} appreciates your flexibility and is eager to prove themselves in their new role, though some teammates are skeptical of the change.',
      },
      {
        id: 'refuse',
        text: 'Refuse the request',
        description: 'Stand firm on current roster roles',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'specific',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'ego_role_demand_refused_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: '{playerName} is frustrated with your decision. The rest of the team respects the stability, but you\'ll need to monitor the situation closely.',
        triggersEventId: 'ego_trade_request',
      },
      {
        id: 'delay',
        text: 'Promise to revisit later',
        description: 'Buy time and see if the issue resolves',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'specific',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} reluctantly accepts to wait, but you can tell this isn\'t fully resolved. Better keep an eye on their mood.',
      },
    ],
    escalateDays: 14,
    escalationTemplateId: 'ego_trade_request',
  },

  {
    id: 'ego_star_player',
    category: 'player_ego',
    severity: 'major',
    title: 'Star Player Mentality',
    description: '{playerName} has been dominating in practice. Now they want the team to build strategies around their playstyle and hero pool.',
    conditions: [
      {
        type: 'player_stat_above',
        stat: 'mechanics',
        threshold: 75,
        playerSelector: 'star_player',
      },
      {
        type: 'player_morale_above',
        threshold: 60,
        playerSelector: 'star_player',
      },
    ],
    probability: 35,
    cooldownDays: 10,
    choices: [
      {
        id: 'lean_into_star',
        text: 'Build around them',
        description: 'Design strategies to maximize their impact',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'star_player',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            playerSelector: 'star_player',
            delta: 3,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
        ],
        outcomeText: '{playerName} is thrilled and plays with renewed confidence. Some teammates feel overshadowed, but results will tell if this gamble pays off.',
      },
      {
        id: 'shut_it_down',
        text: 'Keep team-focused approach',
        description: 'Emphasize balanced team play over individual stars',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'star_player',
            delta: -12,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
        ],
        outcomeText: 'You emphasize that this is a team game. {playerName} is clearly disappointed, but the rest of the roster appreciates the egalitarian approach.',
      },
      {
        id: 'compromise',
        text: 'Find middle ground',
        description: 'Incorporate their strengths without going all-in',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'star_player',
            delta: 5,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            playerSelector: 'star_player',
            delta: 1,
          },
          {
            target: 'team_chemistry',
            delta: -2,
          },
        ],
        outcomeText: 'You work with {playerName} to find opportunities that play to their strengths without alienating the team. It\'s not perfect, but it\'s workable.',
      },
    ],
  },

  {
    id: 'ego_trade_request',
    category: 'player_ego',
    severity: 'major',
    title: 'Trade Request',
    description: '{playerName} has had enough. They\'ve formally requested a trade and are threatening to sit out if their demands aren\'t met.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'ego_role_demand_refused_{playerId}',
      },
    ],
    probability: 60,
    cooldownDays: 10,
    choices: [
      {
        id: 'negotiate',
        text: 'Negotiate with them',
        description: 'Try to salvage the relationship',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'specific',
            delta: 8,
          },
          {
            target: 'team_budget',
            delta: -5000,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_refused_{playerId}',
          },
        ],
        outcomeText: 'After some tense conversations and financial concessions, {playerName} agrees to stay. It cost you, but the roster stays intact.',
      },
      {
        id: 'let_them_go',
        text: 'Grant the trade request',
        description: 'Part ways and move on',
        effects: [
          {
            target: 'set_flag',
            flag: 'player_trade_requested_{playerId}',
            flagDuration: 7,
          },
          {
            target: 'team_chemistry',
            delta: -10,
          },
        ],
        outcomeText: 'You decide to part ways with {playerName}. The team is shaken by the departure, and you\'ll need to find a replacement quickly.',
      },
      {
        id: 'promise_changes',
        text: 'Promise improvements',
        description: 'Commit to addressing their concerns',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'specific',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'ego_promise_made_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You promise to make real changes. {playerName} is cautiously optimistic, but they\'ll be watching closely to see if you follow through.',
      },
    ],
  },

  // ==========================================================================
  // TEAM SYNERGY (3 templates)
  // ==========================================================================

  {
    id: 'synergy_comms_breakdown',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Communication Breakdown',
    description: 'Scrims have been sloppy lately. Players are talking over each other and missing crucial callouts.',
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 60,
      },
    ],
    probability: 35,
    cooldownDays: 7,
    effects: [
      {
        target: 'team_chemistry',
        delta: -3,
      },
    ],
  },

  {
    id: 'synergy_chemistry_clash',
    category: 'team_synergy',
    severity: 'major',
    title: 'Personality Clash',
    description: 'Two of your players have been clashing constantly. The tension is affecting the entire team\'s performance.',
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 55,
      },
    ],
    probability: 50,
    cooldownDays: 10,
    choices: [
      {
        id: 'mediate',
        text: 'Mediate a conversation',
        description: 'Get them in a room to work it out',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 3,
          },
        ],
        outcomeText: 'You facilitate a productive conversation. It\'s awkward at first, but they find common ground. The team atmosphere improves noticeably.',
      },
      {
        id: 'separate',
        text: 'Separate them in practice',
        description: 'Keep them apart during drills and scrims',
        effects: [
          {
            target: 'team_chemistry',
            delta: -2,
          },
          {
            target: 'set_flag',
            flag: 'players_separated',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You restructure practice to minimize their interactions. It reduces conflict but feels like a band-aid solution.',
      },
      {
        id: 'ignore',
        text: 'Let them work it out',
        description: 'Sometimes conflict resolves naturally',
        effects: [
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: -2,
          },
        ],
        outcomeText: 'You decide not to intervene. The tension persists and starts affecting other players. Maybe you should have acted sooner.',
      },
    ],
  },

  {
    id: 'synergy_momentum',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Team Momentum',
    description: 'Practice has been electric. {teamName} is playing with exceptional chemistry and energy right now.',
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
    cooldownDays: 5,
    effects: [
      {
        target: 'team_chemistry',
        delta: 2,
      },
      {
        target: 'player_morale',
        playerSelector: 'all',
        delta: 2,
      },
    ],
  },

  // ==========================================================================
  // EXTERNAL PRESSURE (3 templates)
  // ==========================================================================

  {
    id: 'pressure_fan_backlash',
    category: 'external_pressure',
    severity: 'major',
    title: 'Fan Backlash',
    description: 'Social media is brutal right now. Fans are questioning {teamName}\'s performance and calling for changes.',
    conditions: [
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 60,
    cooldownDays: 10,
    choices: [
      {
        id: 'public_confidence',
        text: 'Show public confidence',
        description: 'Defend the team publicly on social media',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'public_backing_risk',
            flagDuration: 7,
          },
        ],
        outcomeText: 'Your public support rallies the team, but you\'ve put yourself on the line. If results don\'t improve, the backlash could intensify.',
      },
      {
        id: 'internal_focus',
        text: 'Focus on internal work',
        description: 'Ignore the noise and double down on practice',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 3,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
        ],
        outcomeText: 'You shield the team from the negativity and focus on improvement. The team appreciates the quiet support and gets back to work.',
      },
      {
        id: 'roster_rumors',
        text: 'Hint at roster changes',
        description: 'Suggest changes might be coming',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'roster_change_teased',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You subtly hint that roster moves are on the table. Fans calm down a bit, but now your players are anxious about their jobs.',
      },
    ],
  },

  {
    id: 'pressure_org_expectations',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Organizational Pressure',
    description: 'Management has sent you a reminder about performance expectations. They\'re watching closely.',
    conditions: [
      {
        type: 'season_phase',
        phase: 'stage1',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 30,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        playerSelector: 'all',
        delta: -2,
      },
    ],
  },

  {
    id: 'pressure_media_hype',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Media Spotlight',
    description: 'The media can\'t get enough of {teamName} right now. Positive coverage and fan excitement are building.',
    conditions: [
      {
        type: 'team_win_streak',
        streakLength: 3,
      },
    ],
    probability: 45,
    cooldownDays: 7,
    effects: [
      {
        target: 'player_morale',
        playerSelector: 'all',
        delta: 1,
      },
    ],
  },

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
      {
        type: 'random_chance',
        chance: 15,
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
        playerSelector: 'any',
        delta: -2,
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
        playerSelector: 'random',
        delta: -2,
      },
      {
        target: 'player_morale',
        playerSelector: 'random',
        delta: -2,
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
            playerSelector: 'all',
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
            playerSelector: 'all',
            delta: -8,
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
            playerSelector: 'all',
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

  // ==========================================================================
  // BREAKTHROUGH (3 templates)
  // ==========================================================================

  {
    id: 'breakthrough_growth',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Unexpected Growth',
    description: '{playerName} has shown surprising improvement recently. Their potential is really starting to shine through.',
    conditions: [
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
        playerSelector: 'any',
        delta: 3,
      },
      {
        target: 'player_stat',
        stat: 'mechanics',
        playerSelector: 'any',
        delta: 2,
      },
    ],
  },

  {
    id: 'breakthrough_role_click',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Role Mastery',
    description: '{playerName} has really clicked in their current role. Something just connected for them.',
    conditions: [
      {
        type: 'random_chance',
        chance: 10,
      },
    ],
    probability: 10,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_stat',
        stat: 'igl',
        playerSelector: 'any',
        delta: 2,
      },
      {
        target: 'player_morale',
        playerSelector: 'any',
        delta: 2,
      },
    ],
  },

  {
    id: 'breakthrough_scrim_upset',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Scrim Upset Victory',
    description: '{teamName} just dominated a scrim against a much stronger opponent. The energy is infectious.',
    conditions: [
      {
        type: 'team_chemistry_above',
        threshold: 50,
      },
      {
        type: 'random_chance',
        chance: 12,
      },
    ],
    probability: 12,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        playerSelector: 'all',
        delta: 3,
      },
      {
        target: 'team_chemistry',
        delta: 1,
      },
    ],
  },

  // ==========================================================================
  // META RUMORS (2 templates)
  // ==========================================================================

  {
    id: 'meta_agent_nerf',
    category: 'meta_rumors',
    severity: 'minor',
    title: 'Agent Meta Rumors',
    description: 'Word on the street is that Riot might be changing some agent balance. Teams are speculating about the meta shift.',
    conditions: [
      {
        type: 'season_phase',
        phase: 'stage1',
      },
      {
        type: 'random_chance',
        chance: 8,
      },
    ],
    probability: 8,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'meta_shift_rumored',
        flagDuration: 7,
      },
    ],
  },

  {
    id: 'meta_faster_executes',
    category: 'meta_rumors',
    severity: 'minor',
    title: 'Evolving Meta',
    description: 'Top teams are experimenting with faster, more aggressive executes. The meta might be shifting.',
    conditions: [
      {
        type: 'random_chance',
        chance: 6,
      },
    ],
    probability: 6,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'meta_aggressive_buff',
        flagDuration: 7,
      },
    ],
  },

  // ==========================================================================
  // NEW MAJOR EVENTS (Enhanced Drama System)
  // ==========================================================================

  {
    id: 'breakthrough_prodigy_moment',
    category: 'breakthrough',
    severity: 'major',
    title: 'Prodigy Moment',
    description: '{playerName} just pulled off an incredible play in scrims that has everyone talking. This could be their breakout moment.',
    conditions: [
      {
        type: 'random_chance',
        chance: 20,
      },
    ],
    probability: 35,
    cooldownDays: 7,
    choices: [
      {
        id: 'spotlight',
        text: 'Put them in the spotlight',
        description: 'Feature them in social media and team content',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            playerSelector: 'any',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'prodigy_hype_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} thrives under the attention and continues to impress. The hype is building, but can they handle the pressure?',
      },
      {
        id: 'keep_grounded',
        text: 'Keep them grounded',
        description: 'Downplay the hype and focus on fundamentals',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 5,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            playerSelector: 'any',
            delta: 2,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: 'You remind {playerName} that one play doesn\'t make a career. They appreciate the level-headed approach and stay focused on improvement.',
      },
      {
        id: 'team_credit',
        text: 'Credit the team',
        description: 'Emphasize team play over individual brilliance',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 2,
          },
        ],
        outcomeText: 'You highlight how the team enabled the play. {playerName} stays humble, and the whole roster feels valued.',
      },
    ],
  },

  {
    id: 'meta_shift_confirmed',
    category: 'meta_rumors',
    severity: 'major',
    title: 'Meta Shift Confirmed',
    description: 'Riot just dropped a major patch. The meta is shifting significantly and teams are scrambling to adapt.',
    conditions: [
      {
        type: 'random_chance',
        chance: 25,
      },
    ],
    probability: 40,
    cooldownDays: 7,
    choices: [
      {
        id: 'embrace_change',
        text: 'Embrace the change',
        description: 'Dive into the new meta immediately',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'meta_early_adopter',
            flagDuration: 14,
          },
        ],
        outcomeText: 'The team rallies around the challenge. You\'re among the first to master the new meta, gaining a competitive edge.',
      },
      {
        id: 'wait_and_see',
        text: 'Wait and see',
        description: 'Let other teams experiment first',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'meta_conservative',
            flagDuration: 10,
          },
        ],
        outcomeText: 'You take a cautious approach. The team feels uncertain while watching others adapt faster, but you avoid costly early mistakes.',
      },
      {
        id: 'hybrid_approach',
        text: 'Hybrid approach',
        description: 'Blend old fundamentals with new strategies',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 2,
          },
        ],
        outcomeText: 'You find a balanced path forward. The team adapts at a measured pace, building on what already works.',
      },
    ],
  },

  {
    id: 'pressure_rival_poaching',
    category: 'external_pressure',
    severity: 'major',
    title: 'Rival Poaching Attempt',
    description: 'Word has leaked that a rival organization is trying to poach {playerName}. They\'re offering a significant contract upgrade.',
    conditions: [
      {
        type: 'random_chance',
        chance: 15,
      },
    ],
    probability: 35,
    cooldownDays: 10,
    choices: [
      {
        id: 'counter_offer',
        text: 'Make a counter-offer',
        description: 'Match or exceed the rival offer',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 12,
          },
          {
            target: 'team_budget',
            delta: -8000,
          },
          {
            target: 'clear_flag',
            flag: 'poaching_attempt_{playerId}',
          },
        ],
        outcomeText: '{playerName} is thrilled with the new contract and commits long-term. It\'s expensive, but you\'ve secured a key player.',
      },
      {
        id: 'appeal_loyalty',
        text: 'Appeal to loyalty',
        description: 'Remind them of team culture and goals',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'loyalty_tested_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You make an emotional case for staying. {playerName} is moved by the pitch, but you can tell the rival offer is still tempting.',
      },
      {
        id: 'wish_them_well',
        text: 'Let them explore',
        description: 'Give them freedom to make the best choice',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'poaching_decision_pending_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You take the high road and let {playerName} decide freely. They appreciate the respect, but the uncertainty lingers.',
      },
    ],
  },

  {
    id: 'synergy_leadership_vacuum',
    category: 'team_synergy',
    severity: 'major',
    title: 'Leadership Vacuum',
    description: 'The team lacks clear leadership. Mid-round calls are inconsistent and players are unsure who to follow.',
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 55,
      },
      {
        type: 'random_chance',
        chance: 20,
      },
    ],
    probability: 45,
    cooldownDays: 7,
    choices: [
      {
        id: 'appoint_leader',
        text: 'Appoint a leader',
        description: 'Designate someone as the clear IGL',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_stat',
            stat: 'igl',
            playerSelector: 'any',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'leadership_established',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You designate a clear leader. The team rallies around them, and in-game communication becomes much crisper.',
      },
      {
        id: 'democratic_calls',
        text: 'Democratic approach',
        description: 'Let leadership emerge naturally through discussion',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 3,
          },
        ],
        outcomeText: 'You encourage collaborative decision-making. It takes longer to find clarity, but everyone feels heard.',
      },
      {
        id: 'coach_calls',
        text: 'Coach makes calls',
        description: 'Take direct control of strategy calls',
        effects: [
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: -2,
          },
          {
            target: 'set_flag',
            flag: 'coach_micromanaging',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You step in and make the calls yourself. It provides structure but some players feel stifled.',
      },
    ],
  },

  {
    id: 'ego_social_media_incident',
    category: 'player_ego',
    severity: 'major',
    title: 'Social Media Incident',
    description: '{playerName} posted something controversial on social media. It\'s blowing up and reflects poorly on the team.',
    conditions: [
      {
        type: 'random_chance',
        chance: 15,
      },
    ],
    probability: 35,
    cooldownDays: 7,
    choices: [
      {
        id: 'damage_control',
        text: 'Immediate damage control',
        description: 'Issue an apology and delete the post',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'social_media_apology_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} issues an apology and deletes the post. The situation is contained, but they\'re embarrassed.',
      },
      {
        id: 'stand_by_them',
        text: 'Stand by them',
        description: 'Support their right to express themselves',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'controversial_stance',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You publicly back {playerName}. They\'re grateful, but sponsors are unhappy and some teammates question your judgment.',
      },
      {
        id: 'private_reprimand',
        text: 'Private reprimand',
        description: 'Address it internally without public statement',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'any',
            delta: -2,
          },
          {
            target: 'team_chemistry',
            delta: 2,
          },
        ],
        outcomeText: 'You handle it behind closed doors. {playerName} understands they crossed a line, and the team moves forward quietly.',
      },
    ],
  },

  {
    id: 'burnout_wellness_check',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Wellness Check',
    description: 'Multiple players are showing signs of serious burnout. Mental health is becoming a real concern.',
    conditions: [
      {
        type: 'random_chance',
        chance: 20,
      },
    ],
    probability: 40,
    cooldownDays: 5,
    choices: [
      {
        id: 'mandatory_break',
        text: 'Mandatory team break',
        description: 'Cancel practice for several days',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 15,
          },
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'set_flag',
            flag: 'wellness_break_taken',
            flagDuration: 7,
          },
        ],
        outcomeText: 'You shut down practice and mandate rest. Players return refreshed and grateful for the intervention.',
      },
      {
        id: 'bring_specialist',
        text: 'Bring in a specialist',
        description: 'Hire a sports psychologist',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: 8,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            playerSelector: 'all',
            delta: 3,
          },
          {
            target: 'team_budget',
            delta: -3000,
          },
        ],
        outcomeText: 'You bring in a mental health professional. The sessions help players develop better coping strategies.',
      },
      {
        id: 'push_through',
        text: 'Push through it',
        description: 'Encourage mental toughness and perseverance',
        effects: [
          {
            target: 'player_morale',
            playerSelector: 'all',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'burnout_crisis_ignored',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You tell them to tough it out. Players are frustrated by the lack of support, and the burnout deepens.',
      },
    ],
  },
];
