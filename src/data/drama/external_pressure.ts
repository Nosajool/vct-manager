import type { DramaEventTemplate } from '../../types/drama';

export const EXTERNAL_PRESSURE_EVENTS: DramaEventTemplate[] = [

  // ==========================================================================
  // ARC: "The Analyst Writeoff → Backfire"
  //
  // Analysts or prominent community voices publicly declare the team has no
  // path forward. The manager's response determines whether confidence builds
  // or credibility gets burned.
  //
  // pressure_analyst_writeoff (major)
  //   "clap back" choice → sets public_backing_risk (7d)
  //     → [loss + flag] pressure_backing_backfire (major, arc-connected)
  //
  // Inspired by: DRX Champions 2022 (written off, won it all),
  // NRG being dismissed before every major run.
  // ==========================================================================

  {
    id: 'pressure_analyst_writeoff',
    category: 'external_pressure',
    severity: 'major',
    title: 'Written Off',
    description: 'A prominent analyst just posted their tournament power rankings. Your team isn\'t in the top half. The quote getting passed around: "They\'re not a real contender this split — the gap between them and the top teams is too large to close." Your players have seen it.',
    conditions: [
      { type: 'team_loss_streak', streakLength: 2 },
    ],
    probability: 60,
    cooldownDays: 10,
    socialFormat: {
      platform: 'twitter',
      handle: '@VCTAnalyst',
      flavorReactions: { likes: 8700, retweets: 1900 },
    },
    choices: [
      {
        id: 'use_as_fuel',
        text: 'Use it as fuel — say nothing',
        description: 'Let the team see the disrespect and let it simmer',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 8 },
          { target: 'set_flag', flag: 'rally_against_narrative', flagDuration: 14 },
        ],
        outcomeText: 'You print the ranking and pin it in the team room. No speech. The players look at it, look at each other. Something shifts.',
      },
      {
        id: 'clap_back',
        text: 'Clap back publicly',
        description: 'Reply directly — put your credibility on the line',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 5 },
          { target: 'set_flag', flag: 'public_backing_risk', flagDuration: 7 },
        ],
        outcomeText: 'You reply: "Noted. See you at the end of the split." It gets 4k likes. The team loves it. Now you have to back it up.',
      },
      {
        id: 'agree_rebuild',
        text: 'Acknowledge it — we\'re building',
        description: 'Take the pressure off by reframing expectations',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -5 },
          { target: 'set_flag', flag: 'org_acknowledged_rebuild', flagDuration: 14 },
        ],
        outcomeText: 'You post: "We\'re in a growth phase. The results will come." Sponsors appreciate the honesty. Some players feel like you gave up on them.',
      },
    ],
  },

  {
    id: 'pressure_backing_backfire',
    category: 'external_pressure',
    severity: 'major',
    title: 'The Tweet Aged Badly',
    description: 'Your "see you at the end of the split" reply is getting ratioed. The loss brought everyone back to the thread. "This aged terribly" is the top quote-tweet with 6k likes. The team has gone quiet in the group chat.',
    conditions: [
      { type: 'flag_active', flag: 'public_backing_risk' },
      { type: 'team_loss_streak', streakLength: 1 },
    ],
    probability: 85,
    cooldownDays: 7,
    socialFormat: {
      platform: 'reddit',
      handle: 'r/ValorantCompetitive',
      flavorReactions: { upvotes: 5300 },
    },
    choices: [
      {
        id: 'double_down',
        text: 'Double down — we\'re still believing',
        description: 'Refuse to walk it back. Conviction or delusion?',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -5 },
          { target: 'set_flag', flag: 'public_backing_risk', flagDuration: 7 },
        ],
        outcomeText: 'You stay quiet online but tell the team in person: we\'re not folding. Some of them believe it. Others are starting to look at the exit.',
      },
      {
        id: 'walk_it_back',
        text: 'Walk it back gracefully',
        description: 'Acknowledge the moment, move on with class',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 3 },
          { target: 'set_flag', flag: 'manager_accountability_shown', flagDuration: 14 },
          { target: 'clear_flag', flag: 'public_backing_risk' },
        ],
        outcomeText: 'You post: "Fair. We fell short. We\'ll earn the right to talk again." The community respects it. Internally, the team resets.',
      },
      {
        id: 'go_dark',
        text: 'Go dark — no more social media',
        description: 'Log off and let the results do the talking',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 5 },
          { target: 'set_flag', flag: 'manager_media_blackout', flagDuration: 14 },
          { target: 'clear_flag', flag: 'public_backing_risk' },
        ],
        outcomeText: 'You delete the app. The team notices. There\'s something clarifying about removing the noise entirely.',
      },
    ],
  },

  // ==========================================================================
  // STANDALONE: "Fan Approval Crisis"
  //
  // Community confidence has collapsed. The org needs a public response.
  // manager_accountability_shown flag is now read by arc_aware interview template.
  // ==========================================================================

  {
    id: 'fan_approval_crisis',
    category: 'external_pressure',
    severity: 'major',
    title: 'Fan Approval Crisis',
    description: 'The subreddit is in full meltdown. "Fire everyone," "this org is a joke," "I\'ve given up on this team" — the top posts are all variations on the same theme. Sponsor DMs are starting to come in asking if everything is okay.',
    conditions: [
      { type: 'team_fanbase_below', threshold: 28 },
    ],
    probability: 70,
    cooldownDays: 14,
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
        description: 'Post a public statement — own it',
        effects: [
          { target: 'set_flag', flag: 'manager_accountability_shown', flagDuration: 14 },
        ],
        outcomeText: 'You write a real statement. No PR spin, no excuses. The community response is mixed — some appreciate the transparency, others aren\'t buying it yet. But trust starts moving in the right direction.',
      },
      {
        id: 'crisis_results_only',
        text: 'Let results speak',
        description: 'Stay silent. Wins will fix this faster than words',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 3 },
        ],
        outcomeText: 'No statement. Just work. The players feel the weight of every match now.',
      },
      {
        id: 'crisis_point_to_schedule',
        text: 'Point to the schedule and roster situation',
        description: 'Contextualize the results — there are real explanations here',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -3 },
          { target: 'set_flag', flag: 'org_pressure', flagDuration: 7 },
        ],
        outcomeText: 'You lay out the context — injuries, schedule density, roster transitions. The community mostly doesn\'t care. "Excuses" is the word getting attached to your name now.',
      },
    ],
  },

  // ==========================================================================
  // STANDALONE: "Hype Cycle Collapse"
  //
  // The org and community built the team up as a real contender.
  // Two losses later and the narrative flips overnight.
  // Inspired by: Sentinels 2022, NRG championship windows.
  // ==========================================================================

  {
    id: 'fan_expectations_collapse',
    category: 'external_pressure',
    severity: 'major',
    title: 'Hype Cycle Collapse',
    description: 'Three weeks ago the community was calling you a dark horse champion. Today the same accounts are posting "I knew something was off." The pivot from hype to autopsy happened in a single news cycle. VCT Insider has already framed the losses as "the inevitable correction."',
    conditions: [
      { type: 'team_fanbase_above', threshold: 78 },
      { type: 'team_loss_streak', streakLength: 2 },
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
        text: 'Own the standard — we came to win',
        description: 'Acknowledge the expectations and commit to meeting them',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -3 },
          { target: 'set_flag', flag: 'org_pressure', flagDuration: 10 },
        ],
        outcomeText: 'You own it. The team hears you. Now there\'s nowhere to hide — every match feels like an audition.',
      },
      {
        id: 'expectations_reset',
        text: 'Reset expectations publicly',
        description: 'Remind fans that every team goes through patches',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 4 },
        ],
        outcomeText: 'Some fans are frustrated — they want fire and brimstone, not measured takes. But the pressure on the team decreases. They can breathe again.',
      },
      {
        id: 'go_dark',
        text: 'Stay off socials entirely',
        description: 'Log off. The noise is making things worse',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 6 },
          { target: 'set_flag', flag: 'manager_media_blackout', flagDuration: 7 },
        ],
        outcomeText: 'No tweets, no statements, no engagement with the discourse. The team notices the silence from the top. Something about it feels steadying.',
      },
    ],
  },

];
