import type { DramaEventTemplate } from '../../types/drama';

export const META_RUMORS_EVENTS: DramaEventTemplate[] = [
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
        type: 'min_season_day',
        threshold: 20,
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
      {
        type: 'min_season_day',
        threshold: 30,
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
  // PATCH-DRIVEN DRAMA (2 templates)
  // ==========================================================================

  {
    id: 'meta_star_agent_nerfed',
    category: 'meta_rumors',
    severity: 'major',
    title: "Star Player's Agent Nerfed",
    description: 'A recent patch has nerfed {playerName}\'s signature agent. The team needs to decide how to handle this.',
    conditions: [
      { type: 'agent_is_meta_nerfed', playerSelector: 'star_player' },
      { type: 'flag_active', flag: 'patch_active' },
      { type: 'random_chance', chance: 85 },
    ],
    probability: 85,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'trust_adapt',
        text: 'Trust them to adapt on their own',
        description: 'Give the player space to figure out their new role without interference.',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'star_player',
            delta: -5,
          },
        ],
        outcomeText: '{playerName} appreciates the confidence but feels the pressure. They\'ll need time to find their footing on the new meta.',
      },
      {
        id: 'force_assignment',
        text: 'Assign them a new agent immediately',
        description: 'Force a quick pivot before bad habits form — but it may feel dismissive.',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'star_player',
            delta: -12,
          },
          {
            target: 'set_flag',
            flag: 'forced_agent_swap',
            flagDuration: 21,
          },
        ],
        outcomeText: '{playerName} complies but visibly disagrees. The transition is fast, but the resentment simmers.',
      },
      {
        id: 'team_vote',
        text: 'Let the team vote on the approach',
        description: 'Democratic decision-making builds buy-in and strengthens team cohesion.',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'meta_crisis_resolved',
            flagDuration: 60,
          },
        ],
        outcomeText: 'The team rallies together. {playerName} feels supported and the vote becomes a bonding moment.',
      },
    ],
  },

  {
    id: 'meta_adaptation_crisis',
    category: 'meta_rumors',
    severity: 'minor',
    title: 'Struggling to Adapt',
    description: 'The team is stumbling since the patch dropped. Losses are piling up and confidence is low.',
    conditions: [
      { type: 'flag_active', flag: 'patch_active' },
      { type: 'team_loss_streak', streakLength: 2 },
      { type: 'flag_not_active', flag: 'meta_crisis_resolved' },
      { type: 'random_chance', chance: 60 },
    ],
    probability: 60,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'meta_adaptation_struggling',
        flagDuration: 10,
      },
    ],
  },

];
