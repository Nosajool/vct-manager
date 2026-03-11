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
    cooldownDays: 3,
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
    cooldownDays: 3,
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
    cooldownDays: 3,
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

  // ==========================================================================
  // COVE INCIDENT ARC — viral drama event
  // ==========================================================================
  {
    id: 'cove_meme_viral',
    category: 'cove_incident',
    severity: 'major',
    title: 'The Cove Goes Viral',
    description: "Clip compilations of the Harbor play are dominating VCT socials. Every stream is running the Cove as a meme template. 'Just run Cove' is now the answer to every question in your team's chat.",
    conditions: [
      { type: 'flag_active', flag: 'cove_meme_unaddressed' },
      { type: 'random_chance', chance: 75 },
    ],
    probability: 75,
    requiresPlayerTeam: true,
    cooldownDays: 3,
    choices: [
      {
        id: 'lean_into_meme',
        text: 'Lean into it — sell "Cove Gaming" merch',
        description: "If you can't beat the meme, monetize it. The org posts a tongue-in-cheek tweet and the community eats it up.",
        effects: [
          { target: 'team_hype', delta: 8 },
          { target: 'team_sponsor_trust', delta: -3 },
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 4 },
          { target: 'clear_flag', flag: 'cove_meme_unaddressed' },
          { target: 'set_flag', flag: 'cove_meme_resolved_leaned_in', flagDuration: 90 },
        ],
        outcomeText: "The org posts a \"Cove Gaming\" graphic on Twitter. It gets 20k retweets in six hours. Sponsors are confused but the fans are delighted. The player who ran Harbor becomes a cult hero.",
      },
      {
        id: 'player_addresses_it',
        text: 'Have the player address it directly on stream',
        description: "Let the player own the moment. A self-aware explanation tends to land well with fans — and takes the heat off you.",
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 3 },
          { target: 'team_chemistry', delta: 4 },
          { target: 'team_sponsor_trust', delta: 2 },
          { target: 'clear_flag', flag: 'cove_meme_unaddressed' },
          { target: 'set_flag', flag: 'cove_meme_resolved_player_owned', flagDuration: 90 },
        ],
        outcomeText: "The player goes live and says, 'Yeah, the Cove got cooked. I believed in it. I regret nothing.' Chat explodes with Pog emotes. The incident becomes a fan-favorite story rather than a controversy.",
      },
      {
        id: 'stay_silent',
        text: 'Say nothing — let it die on its own',
        description: "Don't feed the beast. Some memes fade in a week if you ignore them. Some don't.",
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -4 },
          { target: 'team_sponsor_trust', delta: -5 },
          { target: 'set_flag', flag: 'cove_meme_ignored', flagDuration: 30 },
        ],
        outcomeText: "You say nothing. The meme doesn't die. A week later a rival manager makes a 'no Cove in our comp' joke at a press conference. The crowd loses it. You watch from the corner of the room.",
      },
    ],
  },

];
