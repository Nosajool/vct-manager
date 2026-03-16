import type { DramaEventTemplate } from '../../types/drama';

export const PLAYER_EGO_EVENTS: DramaEventTemplate[] = [
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
      { type: 'no_recent_match' },
      {
        type: 'player_morale_below',
        threshold: 60,
        playerSelector: 'any',
      },
      { type: 'scrim_count_min', threshold: 3 },
    ],
    probability: 30,
    cooldownDays: 3,
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
    cooldownDays: 3,
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
    id: 'forced_off_agent',
    category: 'player_ego',
    severity: 'minor',
    title: 'Playing Outside Their Comfort Zone',
    description: '{playerName} has been put on agents they\'re clearly uncomfortable with. You can see it affecting their performance and their mood.',
    conditions: [
      { type: 'no_recent_match' },
      {
        type: 'player_morale_below',
        threshold: 55,
        playerSelector: 'any',
      },
      { type: 'scrim_count_min', threshold: 3 },
      { type: 'random_chance', chance: 40 },
    ],
    probability: 50,
    cooldownDays: 3,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -8,
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
    cooldownDays: 3,
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

];
