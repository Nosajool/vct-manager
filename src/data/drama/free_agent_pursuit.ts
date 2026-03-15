import type { DramaEventTemplate } from '../../types/drama';

export const FREE_AGENT_PURSUIT_EVENTS: DramaEventTemplate[] = [
  {
    id: 'fap_legend_returns',
    category: 'free_agent_pursuit',
    severity: 'minor',
    title: 'Veteran Eyes Your Team',
    description: 'Word is getting around that {playerName} is open to a comeback — and they\'ve been watching your results.',
    conditions: [
      { type: 'team_win_streak', streakLength: 2 },
      { type: 'random_chance', chance: 35 },
    ],
    probability: 40,
    requiresPlayerTeam: true,
    effects: [
      { target: 'free_agent_interest', interestDelta: 20 },
    ],
    cooldownDays: 14,
  },
  {
    id: 'fap_rival_circling',
    category: 'free_agent_pursuit',
    severity: 'major',
    title: 'Rival Team Making Moves',
    description: 'A rival org is reportedly in talks with a free agent you\'ve had your eye on. The window to act is narrowing.',
    conditions: [
      { type: 'player_is_free_agent' },
      { type: 'random_chance', chance: 25 },
    ],
    probability: 50,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'accelerate',
        text: 'Accelerate Outreach ($30K)',
        description: 'Spend $30K to fast-track engagement and boost interest.',
        effects: [
          { target: 'team_budget', delta: -30000 },
          { target: 'free_agent_interest', interestDelta: 15 },
        ],
        outcomeText: 'Your team moves quickly, securing a meeting before the rival can close the deal.',
      },
      {
        id: 'hold',
        text: 'Hold Off',
        description: 'Wait and see if the rival secures the player first.',
        effects: [
          { target: 'set_flag', flag: 'rival_pressure_{playerId}', flagDuration: 7 },
        ],
        outcomeText: 'You hold back, but the rival continues to apply pressure.',
      },
    ],
    cooldownDays: 10,
  },
  {
    id: 'fap_friends_on_team',
    category: 'free_agent_pursuit',
    severity: 'minor',
    title: 'A Familiar Face',
    description: '{playerName} has been chatting with {teammateName}. He seems interested in the team dynamic.',
    conditions: [
      { type: 'player_is_free_agent' },
      { type: 'random_chance', chance: 40 },
    ],
    probability: 50,
    requiresPlayerTeam: true,
    effects: [
      { target: 'free_agent_interest', interestDelta: 10 },
    ],
    cooldownDays: 14,
  },
  {
    id: 'fap_facility_tour_viral',
    category: 'free_agent_pursuit',
    severity: 'minor',
    title: 'Facility Tour Goes Viral',
    description: 'Clips from a recent facility visit are spreading. Free agents in your region are taking notice.',
    conditions: [
      { type: 'team_budget_above', threshold: 60 },
      { type: 'random_chance', chance: 30 },
    ],
    probability: 45,
    requiresPlayerTeam: true,
    effects: [
      { target: 'free_agent_interest', interestDelta: 5 },
    ],
    cooldownDays: 21,
  },
  {
    id: 'fap_cold_shoulder',
    category: 'free_agent_pursuit',
    severity: 'minor',
    title: 'Not Ready for Offers',
    description: 'A high-profile free agent has publicly stated they\'re not entertaining offers right now. The market cools.',
    conditions: [
      { type: 'free_agent_interest_below', threshold: 35 },
      { type: 'random_chance', chance: 20 },
    ],
    probability: 40,
    requiresPlayerTeam: true,
    effects: [
      { target: 'set_flag', flag: 'fa_market_cooling', flagDuration: 10 },
    ],
    cooldownDays: 21,
  },
];
