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
        effectPlayerSelector: 'triggering',
        delta: -10,
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
      {
        type: 'player_morale_below',
        threshold: 50,
        playerSelector: 'any',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'star_player',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            effectPlayerSelector: 'star_player',
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
            effectPlayerSelector: 'star_player',
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
            effectPlayerSelector: 'star_player',
            delta: 5,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            effectPlayerSelector: 'star_player',
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
      {
        type: 'player_morale_below',
        threshold: 40,
        playerSelector: 'any',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
        delta: -8,
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
            effectPlayerSelector: 'all',
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
            delta: -10,
          },
          {
            target: 'set_flag',
            flag: 'players_separated',
            flagDuration: 14,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -20,
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
            delta: -20,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -10,
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
        delta: 10,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: 10,
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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
        effectPlayerSelector: 'all',
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
        effectPlayerSelector: 'all',
        delta: 5,
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
        playerSelector: 'any'
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
        effectPlayerSelector: 'triggering',
        delta: -20,
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
        effectPlayerSelector: 'random',
        delta: -15,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'random',
        delta: -15,
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
            delta: -50,
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
            effectPlayerSelector: 'all',
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
        playerSelector: 'any'
      },
    ],
    probability: 20,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
      {
        target: 'player_stat',
        stat: 'mechanics',
        effectPlayerSelector: 'triggering',
        delta: 5,
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
        playerSelector: 'any'
      },
    ],
    probability: 10,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_stat',
        stat: 'igl',
        effectPlayerSelector: 'triggering',
        delta: 5,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 5,
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
        effectPlayerSelector: 'all',
        delta: 5,
      },
      {
        target: 'team_chemistry',
        delta: 5,
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
      {
        type: 'player_morale_above',
        threshold: 50,
        playerSelector: 'any',
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
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 3,
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
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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
        playerSelector: 'star_player'
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'any',
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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
        playerSelector: 'any'
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'triggering',
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
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
            delta: 8,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'all',
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
            effectPlayerSelector: 'all',
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

  // ==========================================================================
  // INTERVIEW-BRIDGE EVENTS (5 new events — interview flags → earned drama)
  // ==========================================================================

  {
    id: 'igl_shotcalling_questioned',
    category: 'team_synergy',
    severity: 'major',
    title: "IGL's Shot-Calling Under Scrutiny",
    description: "A player's public comments about the game plan have put the IGL's shot-calling under the spotlight. The locker room is tense.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_blamed_teammates',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 85,
    cooldownDays: 14,
    oncePerSeason: false,
    choices: [
      {
        id: 'back_igl',
        text: 'Back the IGL publicly',
        description: 'Issue a statement of full confidence in their shot-calling',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'any',
            delta: 15,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'manager_backed_igl',
            flagDuration: 21,
          },
          {
            target: 'clear_flag',
            flag: 'interview_blamed_teammates',
          },
        ],
        outcomeText: "You publicly affirm the IGL's authority. The IGL's confidence returns, though the player who made the comments feels sidelined.",
      },
      {
        id: 'closed_door_meeting',
        text: 'Call a closed-door meeting',
        description: 'Address the tension privately with everyone present',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'interview_blamed_teammates',
          },
          {
            target: 'trigger_event',
            eventTemplateId: 'synergy_comms_breakdown',
          },
        ],
        outcomeText: 'You bring the team together for a frank conversation. The air clears somewhat, though underlying tensions still simmer.',
      },
      {
        id: 'reduce_igl_authority',
        text: 'Quietly reduce IGL authority',
        description: 'Shift more mid-round calling to the coach',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'any',
            delta: -15,
          },
          {
            target: 'team_chemistry',
            delta: -10,
          },
          {
            target: 'set_flag',
            flag: 'igl_authority_undermined',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You shift calling duties away from the IGL. They notice immediately. The team dynamic grows fragile.',
        triggersEventId: 'synergy_leadership_vacuum',
      },
    ],
    escalateDays: 14,
    escalationTemplateId: 'synergy_leadership_vacuum',
  },

  {
    id: 'contract_year_ultimatum',
    category: 'player_ego',
    severity: 'major',
    title: 'Contract Year Ultimatum',
    description: "{playerName}'s agent has called mid-season citing market value and demanding a contract extension — at double the current salary.",
    conditions: [
      {
        type: 'player_contract_expiring',
        contractYearsThreshold: 1,
      },
      {
        type: 'player_personality',
        personality: 'FAME_SEEKER',
      },
      {
        type: 'player_stat_above',
        stat: 'mechanics',
        threshold: 70,
        playerSelector: 'any',
      },
    ],
    probability: 70,
    cooldownDays: 21,
    choices: [
      {
        id: 'extend_premium',
        text: 'Extend at a premium',
        description: 'Sign them to a new contract above market rate',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 20,
          },
          {
            target: 'team_budget',
            delta: -6000,
          },
          {
            target: 'set_flag',
            flag: 'contract_extended_{playerId}',
            flagDuration: 60,
          },
        ],
        outcomeText: '{playerName} signs a premium extension. They are locked in and energised. It cost you, but the roster is stable.',
      },
      {
        id: 'promise_renegotiation',
        text: 'Promise to renegotiate after the tournament',
        description: 'Buy time — link extension talks to performance',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'contract_extension_promised_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: '{playerName} reluctantly agrees to wait. Their focus is divided, and every loss now carries extra weight.',
      },
      {
        id: 'explore_trade_value',
        text: 'Quietly explore trade value',
        description: 'See what the market looks like before committing',
        effects: [
          {
            target: 'set_flag',
            flag: 'player_on_market_{playerId}',
            flagDuration: 21,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
        ],
        outcomeText: 'You discreetly probe the transfer market. If word leaks, the fallout could be severe.',
        triggersEventId: 'pressure_rival_poaching',
      },
    ],
  },

  {
    id: 'silent_tilt',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Silent Tilt',
    description: 'No tweets. No complaints. But your assistant coach flags it: {playerName} seems mentally checked out. Stats are quietly declining.',
    conditions: [
      {
        type: 'player_personality',
        personality: 'INTROVERT',
      },
      {
        type: 'player_morale_below',
        threshold: 40,
        playerSelector: 'any',
      },
      {
        type: 'player_form_below',
        threshold: 50,
        playerSelector: 'any',
      },
    ],
    probability: 65,
    cooldownDays: 14,
    choices: [
      {
        id: 'schedule_psychologist',
        text: 'Schedule a sports psychologist',
        description: 'Bring in professional mental health support',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'team_budget',
            delta: -500,
          },
          {
            target: 'set_flag',
            flag: 'psych_support_given_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: '{playerName} quietly opens up in sessions. It takes time, but they begin to find their footing again.',
      },
      {
        id: 'give_week_off',
        text: 'Give them a week off practice',
        description: 'Reduce training load and let them decompress',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'reduced_training_time',
            flagDuration: 7,
          },
        ],
        outcomeText: '{playerName} appreciates the space. They return calmer, if slightly rustier mechanically.',
      },
      {
        id: 'push_harder',
        text: 'Push harder — they will snap out of it',
        description: 'Increase pressure to force a breakthrough',
        effects: [
          {
            target: 'random_chance',
          } as never,
          {
            target: 'set_flag',
            flag: 'burnout_risk_high',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You demand more. Sometimes pressure breeds clarity — and sometimes it breaks people.',
      },
    ],
  },

  {
    id: 'rival_trash_talk_escalation',
    category: 'external_pressure',
    severity: 'major',
    title: 'Trash Talk Escalation',
    description: 'The rival team responded publicly to your pre-match comments. Social media is buzzing and both fanbases are fired up.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_trash_talked_rival',
      },
    ],
    probability: 90,
    cooldownDays: 21,
    choices: [
      {
        id: 'respond_aggressively',
        text: 'Fire back harder',
        description: 'Escalate the war of words',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'rivalry_scorched_earth',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You double down and the internet explodes. Your fans are hyped — but if you lose the next match, the fall will be hard.',
      },
      {
        id: 'stay_classy',
        text: 'Stay classy, no comment',
        description: 'Take the high road and focus on the game',
        effects: [
          {
            target: 'clear_flag',
            flag: 'interview_trash_talked_rival',
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 2,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: 'You rise above it. Some fans are disappointed, but the team feels more focused. The narrative dies down.',
      },
      {
        id: 'meme_it',
        text: 'Meme it — laugh it off',
        description: 'Turn the situation into content',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'rivalry_scorched_earth',
            flagDuration: 14,
          },
        ],
        outcomeText: 'Your social team turns the rival response into comedy gold. Fanbase surges. The rival org is not amused.',
      },
    ],
  },

  {
    id: 'rebuild_or_reload',
    category: 'external_pressure',
    severity: 'major',
    title: 'Rebuild or Reload?',
    description: "After another early exit, your assistant coach sends you a private message: \"This roster has peaked. We need to think hard about the future.\"",
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 45,
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'commit_to_roster',
        text: 'Commit to the current roster',
        description: 'Reaffirm belief in the team and push forward together',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'management_committed_to_roster',
            flagDuration: 60,
          },
        ],
        outcomeText: 'You send a message of full commitment. Players rally. Whether this was the right call will be answered on the server.',
      },
      {
        id: 'evaluate_moves',
        text: 'Begin evaluating roster moves',
        description: 'Open the door to transfers and roster changes',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'transfer_window_scouting',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You acknowledge the assistant coach\'s concerns. Uncertainty spreads through the roster — everyone wonders if they\'re on the chopping block.',
      },
      {
        id: 'fire_assistant_coach',
        text: 'Fire the assistant coach',
        description: 'Remove the dissenting voice from the staff',
        effects: [
          {
            target: 'team_budget',
            delta: -3000,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
        ],
        outcomeText: 'You let the assistant coach go. The message to the team is clear, but losing experienced staff always has a cost.',
      },
    ],
  },

  // ==========================================================================
  // CHAIN CLOSERS — Consuming orphaned flags from earlier decisions
  // ==========================================================================

  {
    id: 'ego_role_demand_resurfaced',
    category: 'player_ego',
    severity: 'major',
    title: 'Deferred Demand Resurfaces',
    description: "{playerName} hasn't forgotten the conversation you put off. They're back — and this time they're not asking politely.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'ego_role_demand_delayed_{playerId}',
      },
      {
        type: 'player_morale_below',
        threshold: 45,
        playerSelector: 'any',
      },
    ],
    probability: 85,
    cooldownDays: 7,
    choices: [
      {
        id: 'accommodate_now',
        text: 'Accommodate now — late is better than never',
        description: 'Give them the role change they originally asked for',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
          },
        ],
        outcomeText: "{playerName} is relieved, though the delay still stings. They accept the role change and get back to work. Chemistry takes a small hit as teammates adjust.",
      },
      {
        id: 'refuse_again',
        text: 'Refuse again — hold the line',
        description: 'Stick to your original decision',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -15,
          },
          {
            target: 'set_flag',
            flag: 'ego_role_demand_refused_{playerId}',
            flagDuration: 21,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
          },
        ],
        outcomeText: "{playerName}'s frustration turns to resentment. You've drawn a line, but it may cost you later.",
        triggersEventId: 'ego_trade_request',
      },
      {
        id: 'offer_compromise',
        text: 'Offer a middle ground',
        description: 'Find a hybrid that gives them partial what they need',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 2,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
          },
        ],
        outcomeText: "You carve out space for {playerName} to shine in specific scenarios. It's not exactly what they wanted, but it's enough to keep the peace for now.",
      },
    ],
  },

  {
    id: 'ego_promise_broken',
    category: 'player_ego',
    severity: 'major',
    title: 'Broken Promise',
    description: "{playerName} is watching. You promised changes weeks ago — but nothing has shifted. They're done being patient.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'ego_promise_made_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 75,
    cooldownDays: 7,
    choices: [
      {
        id: 'make_changes_now',
        text: 'Deliver on the promise immediately',
        description: 'Follow through — better late than never',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'ego_promise_made_{playerId}',
          },
        ],
        outcomeText: "You finally deliver on your word. {playerName} appreciates it, though they remember how long they had to wait. The team adjusts.",
      },
      {
        id: 'apologize_and_delay',
        text: 'Apologize and ask for more time',
        description: 'Acknowledge the failure and buy one last extension',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
        ],
        outcomeText: "{playerName} listens, but you can see the trust fading. This is the last extension they'll give you.",
        triggersEventId: 'ego_trade_request',
      },
      {
        id: 'deny_the_promise',
        text: 'Claim circumstances have changed',
        description: "Revisit whether the original promise was ever realistic",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -20,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'ego_promise_made_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'ego_role_demand_refused_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: "{playerName} is furious. You've torched whatever goodwill remained. Expect a formal trade request soon.",
        triggersEventId: 'ego_trade_request',
      },
    ],
  },

  {
    id: 'roster_departure_shockwave',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Departure Shockwave',
    description: "The locker room hasn't processed {playerName}'s exit. Everyone is quieter than usual — and wondering if they're next.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'player_trade_requested_{playerId}',
      },
    ],
    probability: 90,
    cooldownDays: 14,
    effects: [
      {
        target: 'team_chemistry',
        delta: -10,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: -8,
      },
      {
        target: 'set_flag',
        flag: 'roster_instability',
        flagDuration: 14,
      },
    ],
  },

  {
    id: 'separation_boiling_point',
    category: 'team_synergy',
    severity: 'major',
    title: "Separation Isn't Working",
    description: "Keeping the two players apart has only let the tension fester. The rest of the team is visibly choosing sides.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'players_separated',
      },
      {
        type: 'team_chemistry_below',
        threshold: 50,
      },
    ],
    probability: 80,
    cooldownDays: 14,
    choices: [
      {
        id: 'force_reconciliation',
        text: 'Force a reconciliation',
        description: 'Lock them in a room until they work it out',
        effects: [
          {
            target: 'team_chemistry',
            delta: 12,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'players_separated',
          },
        ],
        outcomeText: "It's uncomfortable, but the forced conversation clears the air. They won't be best friends, but they can compete on the same server again.",
      },
      {
        id: 'transfer_one',
        text: 'Move one player out',
        description: 'Accept that this relationship is unrecoverable',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'players_separated',
          },
          {
            target: 'set_flag',
            flag: 'roster_instability',
            flagDuration: 14,
          },
        ],
        outcomeText: "You part ways with one of them. The immediate tension dissolves, but the team needs time to find its rhythm again.",
      },
      {
        id: 'restructure_hierarchy',
        text: 'Restructure team hierarchy',
        description: 'Give each player clearly defined lanes to reduce overlap',
        effects: [
          {
            target: 'team_chemistry',
            delta: 7,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
          {
            target: 'clear_flag',
            flag: 'players_separated',
          },
        ],
        outcomeText: "By clearly defining roles, the two players no longer need to compete for the same space. The tension doesn't vanish, but it becomes manageable.",
      },
    ],
  },

  {
    id: 'burnout_crisis_breaking_point',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Breaking Point',
    description: "{playerName} has hit a wall. After weeks of relentless grinding, your assistant coach flags it: they can't continue at this pace.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'burnout_risk_high',
      },
      {
        type: 'random_chance',
        chance: 40,
        playerSelector: 'any',
      },
    ],
    probability: 65,
    cooldownDays: 10,
    choices: [
      {
        id: 'immediate_rest',
        text: 'Pull them from practice immediately',
        description: 'Mandatory rest — no negotiations',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'burnout_risk_high',
          },
          {
            target: 'set_flag',
            flag: 'wellness_break_taken',
            flagDuration: 7,
          },
        ],
        outcomeText: "{playerName} steps back from practice. A week later, they return quieter but steadier. Sometimes slowing down is the fastest way forward.",
      },
      {
        id: 'bring_in_psychologist',
        text: 'Bring in a sports psychologist',
        description: 'Address the root cause with professional support',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_budget',
            delta: -2000,
          },
          {
            target: 'clear_flag',
            flag: 'burnout_risk_high',
          },
          {
            target: 'set_flag',
            flag: 'psych_support_given_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: "The sessions reveal patterns {playerName} wasn't even aware of. It's an investment in the long game — and it shows.",
      },
      {
        id: 'push_through_anyway',
        text: "Remind them what's at stake",
        description: 'Keep the pressure on — results are on the line',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -20,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
        ],
        outcomeText: "{playerName} grits through it, but something breaks. You can see it in their play. The short-term work rate isn't worth what you're watching.",
      },
    ],
  },

  {
    id: 'coach_credibility_crisis',
    category: 'team_synergy',
    severity: 'major',
    title: 'Coach Credibility Crisis',
    description: "Players are openly questioning the coaching staff's involvement in shot-calling. After another loss, the murmurs have reached you directly.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'coach_micromanaging',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 70,
    cooldownDays: 10,
    choices: [
      {
        id: 'restore_player_agency',
        text: 'Restore player autonomy',
        description: 'Step back and trust the players to make the calls',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'clear_flag',
            flag: 'coach_micromanaging',
          },
        ],
        outcomeText: "You loosen the reins. The team exhales. In the next practice, the energy is noticeably different — players are calling with conviction again.",
      },
      {
        id: 'double_down',
        text: 'Defend the system publicly',
        description: "Stand firm — the process is correct, the results aren't there yet",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'igl_authority_undermined',
            flagDuration: 21,
          },
        ],
        outcomeText: "You stand firm. Players go quiet — not because they agree, but because they've stopped fighting it. That silence is more worrying than the complaints.",
      },
      {
        id: 'hybrid_delegation',
        text: 'Delegate by situation type',
        description: 'Coach handles macro strategy; players handle mid-round',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
          {
            target: 'clear_flag',
            flag: 'coach_micromanaging',
          },
          {
            target: 'set_flag',
            flag: 'leadership_established',
            flagDuration: 21,
          },
        ],
        outcomeText: "You draw clearer lines. Players feel trusted where it counts most — mid-round. The structure isn't perfect, but the locker room settles.",
      },
    ],
  },

  {
    id: 'public_backing_backfire',
    category: 'external_pressure',
    severity: 'major',
    title: 'Public Backing Backfired',
    description: "You put yourself on the line publicly — and then the team lost. The same fans who nodded along are now using your words against you.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'public_backing_risk',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 80,
    cooldownDays: 14,
    choices: [
      {
        id: 'double_down',
        text: 'Stay the course — one loss changes nothing',
        description: "Refuse to walk back your public stance",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'public_backing_risk',
            flagDuration: 7,
          },
        ],
        outcomeText: "You refuse to flinch. Players respect the loyalty, but the media is circling. You're all-in now — another loss and it gets ugly.",
      },
      {
        id: 'temper_expectations',
        text: 'Recalibrate the narrative publicly',
        description: 'Acknowledge the loss and walk back the bold claims',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
          {
            target: 'team_chemistry',
            delta: -2,
          },
          {
            target: 'clear_flag',
            flag: 'public_backing_risk',
          },
        ],
        outcomeText: "You dial back the rhetoric. It feels like a step back, but the pressure lifts. Players quietly appreciate the breathing room.",
      },
      {
        id: 'redirect_to_motivation',
        text: 'Channel the criticism into fuel',
        description: 'Use the backlash to galvanize the room internally',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'public_backing_risk',
          },
        ],
        outcomeText: "You read the worst posts in a team meeting. The room goes from embarrassed to galvanized. Sometimes the best motivator is a hater with a platform.",
      },
    ],
  },

  {
    id: 'loyalty_decision_deadline',
    category: 'external_pressure',
    severity: 'major',
    title: 'Loyalty Test: Decision Time',
    description: "The rival org's offer window is closing. {playerName} needs to give them an answer — and they've come to you first asking what staying would look like.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'loyalty_tested_{playerId}',
      },
    ],
    probability: 85,
    cooldownDays: 14,
    choices: [
      {
        id: 'match_the_offer',
        text: 'Match the rival offer',
        description: 'Show with numbers that you value them',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'team_budget',
            delta: -5000,
          },
          {
            target: 'clear_flag',
            flag: 'loyalty_tested_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'contract_extended_{playerId}',
            flagDuration: 60,
          },
        ],
        outcomeText: "{playerName} signs the new deal. They feel valued. The org feels the financial strain — but the roster stays intact and focused.",
      },
      {
        id: 'let_them_go',
        text: 'Wish them well',
        description: 'Let them take the rival offer',
        effects: [
          {
            target: 'team_chemistry',
            delta: -12,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'loyalty_tested_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'roster_instability',
            flagDuration: 21,
          },
        ],
        outcomeText: "{playerName} departs for the rival org. The handshake is warm but the room is stunned. Now you need to rebuild around the gap they leave.",
      },
      {
        id: 'appeal_once_more',
        text: 'Make one final emotional appeal',
        description: 'Remind them what this team means beyond the money',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'loyalty_tested_{playerId}',
          },
        ],
        outcomeText: "{playerName} stays — for now. They turned down the money, but you'd better make sure they don't regret the choice.",
      },
    ],
  },

  {
    id: 'contract_promise_ultimatum',
    category: 'player_ego',
    severity: 'major',
    title: 'Contract Promise Expires',
    description: "The deadline you implicitly agreed to has passed. {playerName}'s agent has sent a final notice: extend now, or they explore the open market.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'contract_extension_promised_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 80,
    cooldownDays: 14,
    choices: [
      {
        id: 'extend_now',
        text: 'Sign the extension now',
        description: 'Honor the original spirit of the promise',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 18,
          },
          {
            target: 'team_budget',
            delta: -4000,
          },
          {
            target: 'clear_flag',
            flag: 'contract_extension_promised_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'contract_extended_{playerId}',
            flagDuration: 60,
          },
        ],
        outcomeText: "{playerName} signs the extension. The distraction is gone. They play with a visible weight lifted off their shoulders.",
      },
      {
        id: 'link_to_results',
        text: 'Link the deal to upcoming performance',
        description: 'Demand a strong result before committing',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
        ],
        outcomeText: "{playerName} is frustrated but accepts the conditional terms. Every match now carries contract implications — the pressure is palpable.",
        triggersEventId: 'contract_year_ultimatum',
      },
      {
        id: 'explore_replacements',
        text: 'Quietly scout for replacements',
        description: 'See if the market has better value at their position',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -15,
          },
          {
            target: 'team_chemistry',
            delta: -10,
          },
          {
            target: 'clear_flag',
            flag: 'contract_extension_promised_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'player_on_market_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: "Word leaks, as it always does. {playerName} finds out you were shopping replacements. The fallout is immediate.",
        triggersEventId: 'ego_trade_request',
      },
    ],
  },

  // ==========================================================================
  // PERSONALITY-DRIVEN EVENTS
  // ==========================================================================

  {
    id: 'big_stage_anxiety',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Regular Season Malaise',
    description: "{playerName} plays their best when everything is on the line — but regular season matches have them visibly disengaged. They're saving themselves for the moments that matter.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'BIG_STAGE',
      },
      {
        type: 'player_morale_below',
        threshold: 65,
        playerSelector: 'any',
      },
      {
        type: 'random_chance',
        chance: 35,
        playerSelector: 'any',
      },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -8,
      },
      {
        target: 'player_form',
        effectPlayerSelector: 'triggering',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'big_stage_disengaged_{playerId}',
        flagDuration: 10,
      },
    ],
  },

  {
    id: 'big_stage_playoff_ignition',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Playoff Mode Activated',
    description: "The moment the bracket was set, something flipped in {playerName}. Practice intensity is up, focus is sharp. They're exactly who you need them to be right now.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'BIG_STAGE',
      },
      {
        type: 'season_phase',
        phase: 'stage1_playoffs',
      },
      {
        type: 'random_chance',
        chance: 50,
        playerSelector: 'any',
      },
    ],
    probability: 60,
    cooldownDays: 30,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 15,
      },
      {
        target: 'player_form',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
      {
        target: 'player_stat',
        stat: 'mental',
        effectPlayerSelector: 'triggering',
        delta: 3,
      },
    ],
  },

  {
    id: 'stable_player_roster_resistance',
    category: 'player_ego',
    severity: 'major',
    title: 'Stability Pushback',
    description: "{playerName} is one of the most grounded players on your roster — and they've heard about the scouting activity. They come to you directly: am I part of this team's future?",
    conditions: [
      {
        type: 'player_personality',
        personality: 'STABLE',
      },
      {
        type: 'flag_active',
        flag: 'transfer_window_scouting',
      },
    ],
    probability: 70,
    cooldownDays: 14,
    choices: [
      {
        id: 'reassure_them',
        text: "Reassure them — they're not going anywhere",
        description: 'Give a direct, honest answer',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
        ],
        outcomeText: "{playerName} nods, satisfied. Their groundedness steadies the whole room. Other players notice you were straight with them and respect it.",
      },
      {
        id: 'acknowledge_uncertainty',
        text: 'Be honest — all options remain open',
        description: "Tell them the truth even if it's uncomfortable",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'loyalty_tested_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: "{playerName} takes it with grace — that's who they are. But you can see them recalibrate internally. A STABLE player forced into instability is a slow-burning risk.",
      },
      {
        id: 'give_leadership_role',
        text: 'Offer them a leadership role',
        description: "Make them an anchor for what you're building",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 18,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'leadership_established',
            flagDuration: 30,
          },
        ],
        outcomeText: "You ask {playerName} to be the steady center this team needs. They light up quietly — that's exactly the kind of purpose they play for.",
      },
    ],
  },

  {
    id: 'team_first_leadership_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Team Player Steps Up',
    description: "{playerName} pulled aside two struggling teammates after practice and ran a private session with them. No announcement. No fanfare. Just work.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'TEAM_FIRST',
      },
      {
        type: 'team_chemistry_above',
        threshold: 60,
      },
      {
        type: 'random_chance',
        chance: 20,
        playerSelector: 'any',
      },
    ],
    probability: 30,
    cooldownDays: 14,
    effects: [
      {
        target: 'team_chemistry',
        delta: 8,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: 5,
      },
      {
        target: 'player_stat',
        stat: 'mental',
        effectPlayerSelector: 'triggering',
        delta: 3,
      },
    ],
  },

  {
    id: 'introvert_confidence_crisis',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Public Criticism Hits Different',
    description: "Public criticism rarely lands the same way for everyone. For {playerName}, it's clearly landed hard — your assistant coach reports they've been isolating themselves and their play has quietly regressed.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'INTROVERT',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
      {
        type: 'random_chance',
        chance: 30,
        playerSelector: 'any',
      },
    ],
    probability: 55,
    cooldownDays: 14,
    choices: [
      {
        id: 'private_check_in',
        text: 'Have a quiet one-on-one',
        description: 'No agenda, no pressure — just check in',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 4,
          },
        ],
        outcomeText: "The conversation is short, but it lands. {playerName} didn't need advice — they needed to feel seen. You gave them that.",
      },
      {
        id: 'shield_from_media',
        text: 'Shield them from external noise',
        description: 'Limit their media obligations and social media exposure',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'psych_support_given_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: "You reduce their public exposure. Shielded from the noise, {playerName} slowly finds their footing again. Their play quietly returns to form.",
      },
      {
        id: 'push_through_together',
        text: 'Encourage them to confront it',
        description: 'Believe public confidence-building will help',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
        ],
        outcomeText: "For most players, facing it head-on works. For {playerName}, it's too much too fast. The public confidence-building backfires, and they retreat further.",
      },
    ],
  },

  // ==========================================================================
  // STAT-BASED EVENTS
  // ==========================================================================

  {
    id: 'igl_effectiveness_crisis',
    category: 'team_synergy',
    severity: 'major',
    title: 'Shot-Calling in Crisis',
    description: "Mid-round calls have been consistently wrong for weeks. Players are hesitating on comms, second-guessing every decision. The team is playing scared.",
    conditions: [
      {
        type: 'player_stat_below',
        stat: 'igl',
        threshold: 45,
        playerSelector: 'any',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 65,
    cooldownDays: 14,
    choices: [
      {
        id: 'targeted_igl_coaching',
        text: 'Invest in targeted IGL coaching',
        description: 'Bring in a specialist to improve their decision-making',
        effects: [
          {
            target: 'player_stat',
            stat: 'igl',
            effectPlayerSelector: 'any',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_budget',
            delta: -2000,
          },
        ],
        outcomeText: "The specialist sessions are demanding, but {playerName} is a sharper caller by the end of it. The team starts trusting the calls again.",
      },
      {
        id: 'rotate_igl',
        text: 'Try rotating shot-callers',
        description: 'Let the team find who calls best under pressure',
        effects: [
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'igl_authority_undermined',
            flagDuration: 14,
          },
        ],
        outcomeText: "Different voices emerge. Some calls are better, some worse. The instability is real, but so is the talent you're uncovering.",
      },
      {
        id: 'simplify_playbook',
        text: 'Simplify the calling system',
        description: 'Reduce cognitive load with fewer, clearer options',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 2,
          },
          {
            target: 'player_stat',
            stat: 'igl',
            effectPlayerSelector: 'any',
            delta: 3,
          },
        ],
        outcomeText: "A simpler system means fewer catastrophic call failures. Progress is measured, but the team stops imploding on itself mid-round.",
      },
    ],
  },

  {
    id: 'mental_fortitude_tested',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Mental Fortitude Tested',
    description: "{playerName} has been tilting hard after close losses. The mental side of the game is becoming a liability.",
    conditions: [
      {
        type: 'player_stat_below',
        stat: 'mental',
        threshold: 40,
        playerSelector: 'any',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -12,
      },
      {
        target: 'player_form',
        effectPlayerSelector: 'triggering',
        delta: -8,
      },
      {
        target: 'set_flag',
        flag: 'mental_tilt_{playerId}',
        flagDuration: 7,
      },
    ],
  },

  {
    id: 'clutch_player_pressure_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Clutch Factor Emerging',
    description: "{playerName} has been delivering in the moments that matter most. Their ability to perform under pressure is becoming a defining trait.",
    conditions: [
      {
        type: 'player_stat_above',
        stat: 'clutch',
        threshold: 70,
        playerSelector: 'any',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 40,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
      {
        target: 'player_stat',
        stat: 'clutch',
        effectPlayerSelector: 'triggering',
        delta: 2,
      },
      {
        target: 'team_chemistry',
        delta: 5,
      },
    ],
  },
];
