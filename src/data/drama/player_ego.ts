import type { DramaEventTemplate } from '../../types/drama';

export const PLAYER_EGO_EVENTS: DramaEventTemplate[] = [

  // ==========================================================================
  // ARC A: "The Star Can't Adapt"
  //
  // A high-mechanics player is being asked to play off-meta/sentinel agents
  // for team comp. Their public identity (clip culture, Twitter brand) turns
  // an internal tension into an external story.
  //
  // ego_sentinel_request (minor, arc-entry)
  //   → [7d escalation] ego_private_confrontation (major)
  //       "accommodate"    → arc cleared, chemistry cost
  //       "hold the line"  → ego_demand_refused_{playerId}
  //         → [escalation] ego_goes_public (major, terminal)
  //       "middle ground"  → ego_compromise_{playerId}, arc cleared
  //
  // ego_clip_culture_pressure fires independently while flag active
  // ==========================================================================

  {
    id: 'ego_sentinel_request',
    category: 'player_ego',
    severity: 'minor',
    title: 'Playing Outside Their Identity',
    description: '{playerName} has been running sentinel and initiator agents in scrims to fill a team comp gap. They\'re not saying anything yet — but you can see it in their energy. This isn\'t their game.',
    conditions: [
      { type: 'no_recent_match' },
      { type: 'player_stat_above', stat: 'mechanics', threshold: 72, playerSelector: 'any' },
      { type: 'scrim_count_min', threshold: 3 },
      { type: 'flag_not_active', flag: 'ego_goes_public_{playerId}' },
      { type: 'flag_not_active', flag: 'ego_sentinel_request_{playerId}' },
    ],
    probability: 45,
    cooldownDays: 14,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -8 },
      { target: 'set_flag', flag: 'ego_sentinel_request_{playerId}', flagDuration: 21 },
    ],
    escalateDays: 7,
    escalationTemplateId: 'ego_private_confrontation',
  },

  {
    id: 'ego_clip_culture_pressure',
    category: 'player_ego',
    severity: 'minor',
    title: 'The Comments Section',
    description: 'A highlight reel of {playerName}\'s signature agent plays is making the rounds on r/ValorantCompetitive. "Why isn\'t {playerName} playing their actual agent?" is the top comment with 2.3k upvotes. They\'ve seen it.',
    conditions: [
      { type: 'flag_active', flag: 'ego_sentinel_request_{playerId}', playerSelector: 'condition_match' },
      { type: 'random_chance', chance: 50 },
    ],
    probability: 70,
    cooldownDays: 14,
    socialFormat: {
      platform: 'reddit',
      handle: 'r/ValorantCompetitive',
      flavorReactions: { upvotes: 2300 },
    },
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
    ],
  },

  {
    id: 'ego_private_confrontation',
    category: 'player_ego',
    severity: 'major',
    title: 'The Conversation',
    description: '{playerName} corners you after practice. They\'ve seen the clips, read the comments. "I\'m not built for this. Everyone can see it — even the community." They want their agents back.',
    conditions: [
      { type: 'flag_active', flag: 'ego_sentinel_request_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 90,
    cooldownDays: 7,
    choices: [
      {
        id: 'accommodate',
        text: 'Give them their agent back',
        description: 'Adjust the team comp around their strengths',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 12 },
          { target: 'team_chemistry', delta: -5 },
          { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
          { target: 'set_flag', flag: 'ego_appeased_{playerId}', flagDuration: 14 },
        ],
        outcomeText: '{playerName} visibly relaxes. They\'re back on their agents and ready to perform. Some teammates quietly wonder if you just let one player dictate the comp.',
      },
      {
        id: 'hold_the_line',
        text: 'The system needs this from you',
        description: 'Hold firm — the team comp requires this role',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
          { target: 'set_flag', flag: 'ego_demand_refused_{playerId}', flagDuration: 21 },
        ],
        outcomeText: '{playerName} nods, says nothing, and walks out of the room. You\'ve made the right tactical call. Whether they accept it is another question.',
      },
      {
        id: 'middle_ground',
        text: 'Find a middle ground',
        description: 'Negotiate — a comp that works for everyone',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 3 },
          { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
          { target: 'set_flag', flag: 'ego_compromise_{playerId}', flagDuration: 14 },
        ],
        outcomeText: 'You spend an hour at the whiteboard together. Their main agent on certain maps, the support role on others. Uneasy truce — but a truce.',
      },
    ],
    escalateDays: 14,
    escalationTemplateId: 'ego_goes_public',
    autoResolveEffects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -8 },
      { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
    ],
  },

  {
    id: 'ego_goes_public',
    category: 'player_ego',
    severity: 'major',
    title: 'The Subtweet',
    description: '{playerName} posts without warning: "Sometimes you\'re asked to be something you\'re not. Trust the process, right? 🙂" r/ValorantCompetitive connects the dots in minutes. 847 comments.',
    conditions: [
      { type: 'flag_active', flag: 'ego_demand_refused_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 85,
    cooldownDays: 7,
    socialFormat: {
      platform: 'twitter',
      flavorReactions: { likes: 12400, retweets: 2100 },
    },
    effects: [
      { target: 'set_flag', flag: 'ego_goes_public_{playerId}', flagDuration: 30 },
    ],
    choices: [
      {
        id: 'back_them_publicly',
        text: 'Back them publicly',
        description: 'Reply in support — you\'re on their side',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 10 },
          { target: 'team_chemistry', delta: -8 },
          { target: 'set_flag', flag: 'manager_backed_player_public', flagDuration: 14 },
          { target: 'clear_flag', flag: 'ego_demand_refused_{playerId}' },
          { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
        ],
        outcomeText: 'You reply: "We\'re aligned. Change is hard but {playerName} is committed." The community reads between the lines. You\'ve just reversed your own call in public.',
      },
      {
        id: 'no_comment',
        text: 'No comment',
        description: 'Say nothing — let it blow over',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
          { target: 'set_flag', flag: 'manager_stayed_silent_ego', flagDuration: 7 },
          { target: 'clear_flag', flag: 'ego_demand_refused_{playerId}' },
          { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
        ],
        outcomeText: 'You say nothing. The speculation runs another 48 hours before the next match story takes over. Internally, nothing is resolved.',
      },
      {
        id: 'address_it',
        text: 'Address it: the team comes first',
        description: 'Make a public statement — this is a team decision',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -8 },
          { target: 'set_flag', flag: 'interview_addressed_ego_public', flagDuration: 14 },
          { target: 'clear_flag', flag: 'ego_demand_refused_{playerId}' },
          { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
        ],
        outcomeText: 'You put out a statement: roster decisions are made for the team, not for any individual. {playerName} goes quiet. The community respects the directness, even if they don\'t all agree.',
      },
    ],
    autoResolveEffects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
      { target: 'clear_flag', flag: 'ego_demand_refused_{playerId}' },
      { target: 'clear_flag', flag: 'ego_sentinel_request_{playerId}' },
    ],
  },

  // ==========================================================================
  // ARC C: "The Founding Player Problem"
  //
  // Long-tenured player in their contract year with declining form.
  // The loyalty tension makes this harder than it should be.
  //
  // ego_veteran_form_declining (minor, arc-entry)
  //   → [10d escalation] ego_veteran_loyalty_question (major, terminal)
  //       "re-sign"        → keeps them, team boost, soft liability remains
  //       "bench role"     → ego_veteran_benched_{playerId}, locker room tension
  //       "let them go"    → org_made_hard_call, roster opens
  // ==========================================================================

  {
    id: 'ego_veteran_form_declining',
    category: 'player_ego',
    severity: 'minor',
    title: 'The Numbers Don\'t Lie',
    description: '{playerName} has been with the org longer than almost anyone. But the film doesn\'t lie — their form is slipping and their contract is almost up. Younger players are consistently outperforming them in scrims. The conversation you\'ve been putting off is coming.',
    conditions: [
      { type: 'player_contract_expiring', contractYearsThreshold: 1 },
      { type: 'player_form_below', threshold: 50, playerSelector: 'any' },
      { type: 'min_season_day', threshold: 30 },
      { type: 'flag_not_active', flag: 'ego_veteran_decision_made_{playerId}' },
    ],
    probability: 60,
    cooldownDays: 14,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
      { target: 'set_flag', flag: 'ego_veteran_sunset_{playerId}', flagDuration: 30 },
    ],
    escalateDays: 10,
    escalationTemplateId: 'ego_veteran_loyalty_question',
  },

  {
    id: 'ego_veteran_loyalty_question',
    category: 'player_ego',
    severity: 'major',
    title: 'The Hardest Conversation',
    description: '{playerName}\'s contract expires in weeks. Re-signing them is the comfortable choice. The right choice might not be. They\'ve given everything to this org — but the game has moved on.',
    conditions: [
      { type: 'flag_active', flag: 'ego_veteran_sunset_{playerId}', playerSelector: 'condition_match' },
    ],
    probability: 90,
    cooldownDays: 7,
    effects: [
      { target: 'set_flag', flag: 'ego_veteran_decision_made_{playerId}', flagDuration: 60 },
    ],
    choices: [
      {
        id: 'resign',
        text: 'Re-sign: they built this',
        description: 'Loyalty means something. Give them another year.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 15 },
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: 5 },
          { target: 'player_contract_extension', effectPlayerSelector: 'triggering', contractYearsToAdd: 1, contractSalaryMultiplier: 1.1 },
          { target: 'clear_flag', flag: 'ego_veteran_sunset_{playerId}' },
        ],
        outcomeText: 'You re-sign them. The team hears about it and the mood lifts — everyone knows this player deserved that. What happens on the server next season is a different question.',
      },
      {
        id: 'bench_role',
        text: 'Offer a bench/support role',
        description: 'Keep them in the org but step them back from starting',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -15 },
          { target: 'team_chemistry', delta: -5 },
          { target: 'set_flag', flag: 'ego_veteran_benched_{playerId}', flagDuration: 21 },
          { target: 'clear_flag', flag: 'ego_veteran_sunset_{playerId}' },
        ],
        outcomeText: '{playerName} sits with it for a day, then accepts. They\'ll mentor the younger players. The locker room feels the awkwardness — everyone knows what this means.',
      },
      {
        id: 'let_them_go',
        text: 'Thank them and let them go',
        description: 'Make the hard call. Their story here is done.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all_team', delta: -10 },
          { target: 'team_chemistry', delta: -5 },
          { target: 'set_flag', flag: 'org_made_hard_call', flagDuration: 14 },
          { target: 'clear_flag', flag: 'ego_veteran_sunset_{playerId}' },
        ],
        outcomeText: 'You tell them the org is moving in a new direction. They handle it with class. The team is quiet for a few days. A roster spot opens up.',
      },
    ],
    autoResolveEffects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
      { target: 'player_contract_extension', effectPlayerSelector: 'triggering', contractYearsToAdd: 1, contractSalaryMultiplier: 1.0 },
      { target: 'clear_flag', flag: 'ego_veteran_sunset_{playerId}' },
    ],
  },

];
