import type { DramaEventTemplate } from '../../types/drama';

export const IGL_CRISIS_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // IGL UNDER FIRE ARC (5 templates)
  // ==========================================================================

  // Event 1: Mid-Round Doubt (triggers when IGL underperforming + team losing)
  {
    id: 'igl_midround_doubt',
    category: 'igl_crisis',
    severity: 'major',
    title: 'Mid-Round Doubt',
    description:
      "During film review, several players quietly question {playerName}'s mid-round calls after another stalled attack half. The fragging is there, but the reads aren't clicking.",
    conditions: [
      { type: 'team_loss_streak', streakLength: 2 },
      { type: 'min_season_day', threshold: 7 },
      { type: 'player_stat_below', stat: 'igl', threshold: 75, playerSelector: 'igl_player' },
    ],
    probability: 60,
    cooldownDays: 21,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'back_igl_publicly',
        text: "Back {playerName} publicly — leadership needs stability.",
        description: 'Publicly support the IGL to maintain team stability.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 8 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'set_flag', flag: 'igl_backed_by_management', flagDuration: 14 },
        ],
        outcomeText:
          "You publicly back {playerName}'s leadership. The team appreciates the clarity, though some still have private doubts.",
      },
      {
        id: 'private_warning',
        text: "Warn {playerName} privately — improve or we reconsider.",
        description: 'Give the IGL a private ultimatum to improve.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
          { target: 'set_flag', flag: 'igl_on_notice', flagDuration: 21 },
        ],
        outcomeText:
          "You meet privately with {playerName}. They understand the stakes and promise to adjust their approach.",
      },
      {
        id: 'open_discussion',
        text: 'Open the floor — let players challenge calls constructively.',
        description: 'Allow the team to discuss calling openly.',
        effects: [
          { target: 'team_chemistry', delta: 5 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -2 },
          { target: 'set_flag', flag: 'shared_caller_experiment', flagDuration: 14 },
        ],
        outcomeText:
          'The discussion gets heated but productive. Some players step up with ideas, and the IGL agrees to listen more.',
      },
    ],
  },

  // Event 2: Reddit Backlash (escalation from igl_on_notice)
  {
    id: 'igl_reddit_backlash',
    category: 'igl_crisis',
    severity: 'major',
    title: 'Reddit Analysts Call for Change',
    description:
      "Clips of questionable rotations and stalled attacks have gone viral. Fans are asking if {playerName} should still be calling the shots.",
    conditions: [
      { type: 'flag_active', flag: 'igl_on_notice' },
      { type: 'team_loss_streak', streakLength: 3 },
    ],
    probability: 75,
    cooldownDays: 14,
    choices: [
      {
        id: 'ignore_noise',
        text: "Ignore the noise — social media doesn't call our strats.",
        description: 'Dismiss the criticism publicly and focus on results.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 3 },
          { target: 'team_hype', delta: -3 },
          { target: 'set_flag', flag: 'igl_doubles_down', flagDuration: 21 },
        ],
        outcomeText:
          "You tell the media you'll let your results speak for themselves. Fans see it as defensive, but the IGL appreciates the backing.",
      },
      {
        id: 'consider_replacement',
        text: 'Quietly explore alternative shot-callers.',
        description: 'Start looking for internal or external IGL options.',
        effects: [
          { target: 'team_chemistry', delta: -5 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
          { target: 'set_flag', flag: 'igl_replacement_considered', flagDuration: 30 },
        ],
        outcomeText:
          'The org starts quietly surveying the roster for calling alternatives. Word gets around, and the IGL senses the shift.',
      },
      {
        id: 'strip_midround_control',
        text: 'Let another player handle mid-rounding.',
        description: 'Implement shared calling to reduce IGL burden.',
        effects: [
          { target: 'player_stat', effectPlayerSelector: 'triggering', stat: 'igl', delta: -3 },
          { target: 'set_flag', flag: 'shared_calling_enabled', flagDuration: 21 },
        ],
        outcomeText:
          'You split mid-round calling duties. It takes time to gel, but it could unlock the team is struggling.',
      },
    ],
  },

  // Event 3: Leadership Decision (fork point)
  {
    id: 'igl_leadership_decision',
    category: 'igl_crisis',
    severity: 'major',
    title: 'Leadership Decision',
    description:
      "Management must decide whether {playerName} continues as IGL. The team is at a crossroads — stick with current leadership or make a change?",
    conditions: [
      { type: 'flag_active', flag: 'igl_replacement_considered' },
    ],
    probability: 90,
    cooldownDays: 30,
    choices: [
      {
        id: 'keep_igl',
        text: "Keep {playerName} as IGL.",
        description: 'Commit to the current IGL and back them fully.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 10 },
          { target: 'team_chemistry', delta: 5 },
          { target: 'clear_flag', flag: 'igl_on_notice' },
          { target: 'clear_flag', flag: 'igl_replacement_considered' },
          { target: 'set_flag', flag: 'igl_redemption_path', flagDuration: 30 },
        ],
        outcomeText:
          "You commit to {playerName}. They respond with renewed determination — it's do or die now.",
      },
      {
        id: 'reassign_igl',
        text: 'Reassign IGL duties to another player.',
        description: 'Promote a new in-game leader from the roster.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
          { target: 'team_chemistry', delta: -8 },
          { target: 'clear_flag', flag: 'igl_on_notice' },
          { target: 'clear_flag', flag: 'igl_replacement_considered' },
          { target: 'set_flag', flag: 'igl_removed', flagDuration: 30 },
        ],
        outcomeText:
          "The switch is made. The new IGL has potential but needs time, and the former IGL is clearly hurt by the demotion.",
      },
      {
        id: 'transition_to_coach',
        text: 'Move {playerName} into a strategic assistant role.',
        description: 'Transition the IGL to coaching while keeping them in the org.',
        effects: [
          { target: 'player_stat', effectPlayerSelector: 'triggering', stat: 'igl', delta: -3 },
          { target: 'set_flag', flag: 'igl_transitioned_to_coach', flagDuration: 60 },
          { target: 'team_chemistry', delta: 3 },
          { target: 'clear_flag', flag: 'igl_on_notice' },
          { target: 'clear_flag', flag: 'igl_replacement_considered' },
        ],
        outcomeText:
          "{playerName} accepts a strategic coaching role. It's a graceful exit that keeps their knowledge in the org.",
      },
    ],
  },

  // Event 4a: Redemption (follow-up if IGL kept and team performs well)
  {
    id: 'igl_redemption',
    category: 'igl_crisis',
    severity: 'minor',
    title: 'Silencing the Doubters',
    description:
      "After weeks of scrutiny, {playerName} has led the team to crucial victories. The narrative has shifted — critics are now calling the IGL a 'different player.'",
    conditions: [
      { type: 'flag_active', flag: 'igl_redemption_path' },
      { type: 'team_win_streak', streakLength: 2 },
    ],
    probability: 70,
    cooldownDays: 7,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 10 },
      { target: 'team_hype', delta: 8 },
      { target: 'team_chemistry', delta: 5 },
      { target: 'clear_flag', flag: 'igl_redemption_path' },
      { target: 'set_flag', flag: 'igl_redemption_achieved', flagDuration: 30 },
    ],
  },

  // Event 4b: Collapse (follow-up if IGL removed and team struggles)
  {
    id: 'igl_collapse',
    category: 'igl_crisis',
    severity: 'minor',
    title: 'Leadership Vacuum',
    description:
      "The leadership change hasn't worked out. The team is struggling without {playerName}'s experience, and the org is questioning the decision.",
    conditions: [
      { type: 'flag_active', flag: 'igl_removed' },
      { type: 'team_loss_streak', streakLength: 2 },
    ],
    probability: 60,
    cooldownDays: 7,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -8 },
      { target: 'team_chemistry', delta: -10 },
      { target: 'clear_flag', flag: 'igl_removed' },
      { target: 'set_flag', flag: 'leadership_instability', flagDuration: 30 },
    ],
  },
];
