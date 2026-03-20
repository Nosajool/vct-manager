import type { DramaEventTemplate } from '../../types/drama';

export const EXTERNAL_PRESSURE_EVENTS: DramaEventTemplate[] = [
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
        streakLength: 2,
      },
    ],
    probability: 60,
    cooldownDays: 3,
    socialFormat: {
      platform: 'reddit',
      handle: 'r/ValorantCompetitive',
      flavorReactions: { upvotes: 4200 },
    },
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
    cooldownDays: 3,
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
    cooldownDays: 3,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: 5,
      },
    ],
  },

  {
    id: 'fan_approval_crisis',
    category: 'external_pressure',
    severity: 'major',
    title: 'Fan Approval Crisis',
    description: 'Fan approval has hit rock bottom. The community is openly questioning the org\'s direction and calling for major changes.',
    conditions: [
      {
        type: 'team_fanbase_below',
        threshold: 28,
      },
    ],
    probability: 70,
    cooldownDays: 14,
    oncePerSeason: false,
    requiresPlayerTeam: true,
    socialFormat: {
      platform: 'reddit',
      handle: 'r/ValorantCompetitive',
      flavorReactions: { upvotes: 7800 },
    },
    choices: [
      {
        id: 'crisis_address_directly',
        text: 'Address fans directly',
        description: 'Post a public apology and accountability statement',
        effects: [
          {
            target: 'team_hype',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'manager_accountability_shown',
            flagDuration: 14,
          },
        ],
        outcomeText: 'The community appreciates the transparency. Trust starts to rebuild, slowly.',
      },
      {
        id: 'crisis_results_only',
        text: 'Let results speak',
        description: 'Stay silent — wins will fix this faster than words',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
        ],
        outcomeText: 'No statement, just work. The players feel the pressure to deliver.',
      },
      {
        id: 'crisis_blame_meta',
        text: 'Blame the meta',
        description: 'Publicly attribute struggles to the current patch',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'org_pressure',
            flagDuration: 7,
          },
        ],
        outcomeText: 'Fans aren\'t buying it. The excuse tour just made things worse.',
      },
    ],
  },

  {
    id: 'fan_expectations_too_high',
    category: 'external_pressure',
    severity: 'major',
    title: 'Unrealistic Expectations',
    description: 'After a streak of success, fans have built {teamName} up to near-mythical status. Any stumble now feels catastrophic to the community.',
    conditions: [
      {
        type: 'team_fanbase_above',
        threshold: 78,
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 65,
    cooldownDays: 10,
    requiresPlayerTeam: true,
    socialFormat: {
      platform: 'twitter',
      handle: '@VCTInsider',
      flavorReactions: { likes: 12400, retweets: 3200 },
    },
    choices: [
      {
        id: 'expectations_embrace',
        text: 'Embrace the standard',
        description: 'Acknowledge the expectations and commit to meeting them',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'org_pressure',
            flagDuration: 10,
          },
        ],
        outcomeText: 'You own it. Now there\'s nowhere to hide — the team feels the weight of every match.',
      },
      {
        id: 'expectations_reset',
        text: 'Reset expectations',
        description: 'Publicly recalibrate — remind fans every team goes through rough patches',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 4,
          },
        ],
        outcomeText: 'Some fans are frustrated, but the pressure on the team decreases. They can breathe again.',
      },
    ],
  },

];
