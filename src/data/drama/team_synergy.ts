import type { DramaEventTemplate } from '../../types/drama';

export const TEAM_SYNERGY_EVENTS: DramaEventTemplate[] = [
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
      { type: 'no_recent_match' },
      { type: 'team_chemistry_below', threshold: 60 },
      { type: 'scrim_count_min', threshold: 10 },
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
      { type: 'no_recent_match' },
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

];
