import type { DramaEventTemplate } from '../../types/drama';

export const MAP_POOL_EVENTS: DramaEventTemplate[] = [
  {
    id: 'map_pool_forced_weakness',
    category: 'map_pool',
    severity: 'minor',
    title: 'Forced Onto Weak Map',
    description: 'The team had to play on one of their weakest maps and it showed. Players are frustrated by the veto outcome.',
    conditions: [
      { type: 'map_pool_played_weak_map' },
      { type: 'team_loss_streak', streakLength: 1 },
      { type: 'random_chance', chance: 30 },
    ],
    probability: 30,
    cooldownDays: 7,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -5 },
      { target: 'set_flag', flag: 'map_pool_weakness_exposed', flagDuration: 5 },
    ],
  },
  {
    id: 'map_pool_crisis',
    category: 'map_pool',
    severity: 'major',
    title: 'Map Pool Crisis',
    description: "The team's limited map pool has become a strategic liability. Opponents are successfully banning around their comfort zones, leaving them exposed.",
    conditions: [
      { type: 'map_pool_overall_below', mapPoolThreshold: 40 },
      { type: 'team_loss_streak', streakLength: 2 },
      { type: 'random_chance', chance: 25 },
    ],
    probability: 25,
    cooldownDays: 14,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -10 },
      { target: 'team_chemistry', delta: -5 },
      { target: 'set_flag', flag: 'map_pool_crisis_active', flagDuration: 10 },
    ],
  },
];
