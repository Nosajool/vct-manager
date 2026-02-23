import type { DramaEventTemplate } from '../../types/drama';

export const ARC_SYSTEM_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // NEW MAJOR EVENTS (Enhanced Drama System)
  // ==========================================================================

  {
    id: 'breakthrough_prodigy_moment',
    category: 'breakthrough',
    severity: 'major',
    title: 'Prodigy Moment',
    description: '{playerName} just pulled off an incredible play in scrims that has everyone talking. This could be their breakout moment.',
    conditions: [
      { type: 'no_recent_match' },
      {
        type: 'random_chance',
        chance: 20,
      },
      {
        type: 'player_morale_above',
        threshold: 50,
        playerSelector: 'any',
      },
      { type: 'scrim_count_min', threshold: 8 },
    ],
    probability: 35,
    cooldownDays: 7,
    choices: [
      {
        id: 'spotlight',
        text: 'Put them in the spotlight',
        description: 'Feature them in social media and team content',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'prodigy_hype_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} thrives under the attention and continues to impress. The hype is building, but can they handle the pressure?',
      },
      {
        id: 'keep_grounded',
        text: 'Keep them grounded',
        description: 'Downplay the hype and focus on fundamentals',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: 'You remind {playerName} that one play doesn\'t make a career. They appreciate the level-headed approach and stay focused on improvement.',
      },
      {
        id: 'team_credit',
        text: 'Credit the team',
        description: 'Emphasize team play over individual brilliance',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 2,
          },
        ],
        outcomeText: 'You highlight how the team enabled the play. {playerName} stays humble, and the whole roster feels valued.',
      },
    ],
  },

  {
    id: 'meta_shift_confirmed',
    category: 'meta_rumors',
    severity: 'major',
    title: 'Meta Shift Confirmed',
    description: 'Riot just dropped a major patch. The meta is shifting significantly and teams are scrambling to adapt.',
    conditions: [
      {
        type: 'random_chance',
        chance: 25,
      },
      {
        type: 'min_season_day',
        threshold: 30,
      },
    ],
    probability: 40,
    cooldownDays: 7,
    choices: [
      {
        id: 'embrace_change',
        text: 'Embrace the change',
        description: 'Dive into the new meta immediately',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'meta_early_adopter',
            flagDuration: 14,
          },
        ],
        outcomeText: 'The team rallies around the challenge. You\'re among the first to master the new meta, gaining a competitive edge.',
      },
      {
        id: 'wait_and_see',
        text: 'Wait and see',
        description: 'Let other teams experiment first',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'meta_conservative',
            flagDuration: 10,
          },
        ],
        outcomeText: 'You take a cautious approach. The team feels uncertain while watching others adapt faster, but you avoid costly early mistakes.',
      },
      {
        id: 'hybrid_approach',
        text: 'Hybrid approach',
        description: 'Blend old fundamentals with new strategies',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 2,
          },
        ],
        outcomeText: 'You find a balanced path forward. The team adapts at a measured pace, building on what already works.',
      },
    ],
  },

  {
    id: 'pressure_rival_poaching',
    category: 'external_pressure',
    severity: 'major',
    title: 'Rival Poaching Attempt',
    description: 'Word has leaked that a rival organization is trying to poach {playerName}. They\'re offering a significant contract upgrade.',
    conditions: [
      {
        type: 'random_chance',
        chance: 15,
        playerSelector: 'star_player'
      },
    ],
    probability: 35,
    cooldownDays: 10,
    choices: [
      {
        id: 'counter_offer',
        text: 'Make a counter-offer',
        description: 'Match or exceed the rival offer',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'team_budget',
            delta: -8000,
          },
          {
            target: 'clear_flag',
            flag: 'poaching_attempt_{playerId}',
          },
        ],
        outcomeText: '{playerName} is thrilled with the new contract and commits long-term. It\'s expensive, but you\'ve secured a key player.',
      },
      {
        id: 'appeal_loyalty',
        text: 'Appeal to loyalty',
        description: 'Remind them of team culture and goals',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'loyalty_tested_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You make an emotional case for staying. {playerName} is moved by the pitch, but you can tell the rival offer is still tempting.',
      },
      {
        id: 'wish_them_well',
        text: 'Let them explore',
        description: 'Give them freedom to make the best choice',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'poaching_decision_pending_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You take the high road and let {playerName} decide freely. They appreciate the respect, but the uncertainty lingers.',
      },
    ],
  },

  {
    id: 'synergy_leadership_vacuum',
    category: 'team_synergy',
    severity: 'major',
    title: 'Leadership Vacuum',
    description: 'The team lacks clear leadership. Mid-round calls are inconsistent and players are unsure who to follow.',
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 55,
      },
      {
        type: 'random_chance',
        chance: 20,
      },
    ],
    probability: 45,
    cooldownDays: 7,
    choices: [
      {
        id: 'appoint_leader',
        text: 'Appoint a leader',
        description: 'Designate someone as the clear IGL',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_stat',
            stat: 'igl',
            effectPlayerSelector: 'any',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'leadership_established',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You designate a clear leader. The team rallies around them, and in-game communication becomes much crisper.',
      },
      {
        id: 'democratic_calls',
        text: 'Democratic approach',
        description: 'Let leadership emerge naturally through discussion',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
        ],
        outcomeText: 'You encourage collaborative decision-making. It takes longer to find clarity, but everyone feels heard.',
      },
      {
        id: 'coach_calls',
        text: 'Coach makes calls',
        description: 'Take direct control of strategy calls',
        effects: [
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -2,
          },
          {
            target: 'set_flag',
            flag: 'coach_micromanaging',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You step in and make the calls yourself. It provides structure but some players feel stifled.',
      },
    ],
  },

  {
    id: 'ego_social_media_incident',
    category: 'player_ego',
    severity: 'major',
    title: 'Social Media Incident',
    description: '{playerName} posted something controversial on social media. It\'s blowing up and reflects poorly on the team.',
    conditions: [
      {
        type: 'random_chance',
        chance: 15,
        playerSelector: 'any'
      },
    ],
    probability: 35,
    cooldownDays: 7,
    choices: [
      {
        id: 'damage_control',
        text: 'Immediate damage control',
        description: 'Issue an apology and delete the post',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'social_media_apology_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} issues an apology and deletes the post. The situation is contained, but they\'re embarrassed.',
      },
      {
        id: 'stand_by_them',
        text: 'Stand by them',
        description: 'Support their right to express themselves',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'controversial_stance',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You publicly back {playerName}. They\'re grateful, but sponsors are unhappy and some teammates question your judgment.',
      },
      {
        id: 'private_reprimand',
        text: 'Private reprimand',
        description: 'Address it internally without public statement',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -2,
          },
          {
            target: 'team_chemistry',
            delta: 2,
          },
        ],
        outcomeText: 'You handle it behind closed doors. {playerName} understands they crossed a line, and the team moves forward quietly.',
      },
    ],
  },

  {
    id: 'burnout_wellness_check',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Wellness Check',
    description: 'Multiple players are showing signs of serious burnout. Mental health is becoming a real concern.',
    conditions: [
      {
        type: 'random_chance',
        chance: 20,
      },
      {
        type: 'min_season_day',
        threshold: 20,
      }
    ],
    probability: 40,
    cooldownDays: 5,
    choices: [
      {
        id: 'mandatory_break',
        text: 'Mandatory team break',
        description: 'Cancel practice for several days',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 15,
          },
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'set_flag',
            flag: 'wellness_break_taken',
            flagDuration: 7,
          },
        ],
        outcomeText: 'You shut down practice and mandate rest. Players return refreshed and grateful for the intervention.',
      },
      {
        id: 'bring_specialist',
        text: 'Bring in a specialist',
        description: 'Hire a sports psychologist',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 8,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'all',
            delta: 3,
          },
          {
            target: 'team_budget',
            delta: -3000,
          },
        ],
        outcomeText: 'You bring in a mental health professional. The sessions help players develop better coping strategies.',
      },
      {
        id: 'push_through',
        text: 'Push through it',
        description: 'Encourage mental toughness and perseverance',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'burnout_crisis_ignored',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You tell them to tough it out. Players are frustrated by the lack of support, and the burnout deepens.',
      },
    ],
  },

  // ==========================================================================
  // INTERVIEW-BRIDGE EVENTS (5 new events — interview flags → earned drama)
  // ==========================================================================

  {
    id: 'igl_shotcalling_questioned',
    category: 'team_synergy',
    severity: 'major',
    title: "IGL's Shot-Calling Under Scrutiny",
    description: "A player's public comments about the game plan have put the IGL's shot-calling under the spotlight. The locker room is tense.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_blamed_teammates',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 85,
    cooldownDays: 14,
    oncePerSeason: false,
    choices: [
      {
        id: 'back_igl',
        text: 'Back the IGL publicly',
        description: 'Issue a statement of full confidence in their shot-calling',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'any',
            delta: 15,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'manager_backed_igl',
            flagDuration: 21,
          },
          {
            target: 'clear_flag',
            flag: 'interview_blamed_teammates',
          },
        ],
        outcomeText: "You publicly affirm the IGL's authority. The IGL's confidence returns, though the player who made the comments feels sidelined.",
      },
      {
        id: 'closed_door_meeting',
        text: 'Call a closed-door meeting',
        description: 'Address the tension privately with everyone present',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'interview_blamed_teammates',
          },
          {
            target: 'trigger_event',
            eventTemplateId: 'synergy_comms_breakdown',
          },
        ],
        outcomeText: 'You bring the team together for a frank conversation. The air clears somewhat, though underlying tensions still simmer.',
      },
      {
        id: 'reduce_igl_authority',
        text: 'Quietly reduce IGL authority',
        description: 'Shift more mid-round calling to the coach',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'any',
            delta: -15,
          },
          {
            target: 'team_chemistry',
            delta: -10,
          },
          {
            target: 'set_flag',
            flag: 'igl_authority_undermined',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You shift calling duties away from the IGL. They notice immediately. The team dynamic grows fragile.',
        triggersEventId: 'synergy_leadership_vacuum',
      },
    ],
    escalateDays: 14,
    escalationTemplateId: 'synergy_leadership_vacuum',
  },

  {
    id: 'contract_year_ultimatum',
    category: 'player_ego',
    severity: 'major',
    title: 'Contract Year Ultimatum',
    description: "{playerName}'s agent has called mid-season citing market value and demanding a contract extension — at double the current salary.",
    conditions: [
      {
        type: 'min_season_day',
        threshold: 8,  // Can't fire in first 7 days (week 1)
      },
      {
        type: 'player_contract_expiring',
        contractYearsThreshold: 1,
      },
      {
        type: 'player_personality',
        personality: 'FAME_SEEKER',
      },
      {
        type: 'player_stat_above',
        stat: 'mechanics',
        threshold: 70,
        playerSelector: 'any',
      },
    ],
    probability: 70,
    cooldownDays: 21,
    choices: [
      {
        id: 'extend_premium',
        text: 'Extend at a premium',
        description: 'Sign them to a new contract above market rate',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 20,
          },
          {
            target: 'team_budget',
            delta: -6000,
          },
          {
            target: 'set_flag',
            flag: 'contract_extended_{playerId}',
            flagDuration: 60,
          },
        ],
        outcomeText: '{playerName} signs a premium extension. They are locked in and energised. It cost you, but the roster is stable.',
      },
      {
        id: 'promise_renegotiation',
        text: 'Promise to renegotiate after the tournament',
        description: 'Buy time — link extension talks to performance',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'contract_extension_promised_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: '{playerName} reluctantly agrees to wait. Their focus is divided, and every loss now carries extra weight.',
      },
      {
        id: 'explore_trade_value',
        text: 'Quietly explore trade value',
        description: 'See what the market looks like before committing',
        effects: [
          {
            target: 'set_flag',
            flag: 'player_on_market_{playerId}',
            flagDuration: 21,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
        ],
        outcomeText: 'You discreetly probe the transfer market. If word leaks, the fallout could be severe.',
        triggersEventId: 'pressure_rival_poaching',
      },
    ],
  },

  {
    id: 'silent_tilt',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Silent Tilt',
    description: 'No tweets. No complaints. But your assistant coach flags it: {playerName} seems mentally checked out. Stats are quietly declining.',
    conditions: [
      {
        type: 'player_personality',
        personality: 'INTROVERT',
      },
      {
        type: 'player_morale_below',
        threshold: 40,
        playerSelector: 'any',
      },
      {
        type: 'player_form_below',
        threshold: 50,
        playerSelector: 'any',
      },
    ],
    probability: 65,
    cooldownDays: 14,
    choices: [
      {
        id: 'schedule_psychologist',
        text: 'Schedule a sports psychologist',
        description: 'Bring in professional mental health support',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'team_budget',
            delta: -500,
          },
          {
            target: 'set_flag',
            flag: 'psych_support_given_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: '{playerName} quietly opens up in sessions. It takes time, but they begin to find their footing again.',
      },
      {
        id: 'give_week_off',
        text: 'Give them a week off practice',
        description: 'Reduce training load and let them decompress',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'reduced_training_time',
            flagDuration: 7,
          },
        ],
        outcomeText: '{playerName} appreciates the space. They return calmer, if slightly rustier mechanically.',
      },
      {
        id: 'push_harder',
        text: 'Push harder — they will snap out of it',
        description: 'Increase pressure to force a breakthrough',
        effects: [
          {
            target: 'random_chance',
          } as never,
          {
            target: 'set_flag',
            flag: 'burnout_risk_high',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You demand more. Sometimes pressure breeds clarity — and sometimes it breaks people.',
      },
    ],
  },

  {
    id: 'rival_trash_talk_escalation',
    category: 'external_pressure',
    severity: 'major',
    title: 'Trash Talk Escalation',
    description: 'The rival team responded publicly to your pre-match comments. Social media is buzzing and both fanbases are fired up.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_trash_talked_rival',
      },
    ],
    probability: 90,
    cooldownDays: 21,
    choices: [
      {
        id: 'respond_aggressively',
        text: 'Fire back harder',
        description: 'Escalate the war of words',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'rivalry_scorched_earth',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You double down and the internet explodes. Your fans are hyped — but if you lose the next match, the fall will be hard.',
      },
      {
        id: 'stay_classy',
        text: 'Stay classy, no comment',
        description: 'Take the high road and focus on the game',
        effects: [
          {
            target: 'clear_flag',
            flag: 'interview_trash_talked_rival',
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 2,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: 'You rise above it. Some fans are disappointed, but the team feels more focused. The narrative dies down.',
      },
      {
        id: 'meme_it',
        text: 'Meme it — laugh it off',
        description: 'Turn the situation into content',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'rivalry_scorched_earth',
            flagDuration: 14,
          },
        ],
        outcomeText: 'Your social team turns the rival response into comedy gold. Fanbase surges. The rival org is not amused.',
      },
    ],
  },

  {
    id: 'rebuild_or_reload',
    category: 'external_pressure',
    severity: 'major',
    title: 'Rebuild or Reload?',
    description: "After another early exit, your assistant coach sends you a private message: \"This roster has peaked. We need to think hard about the future.\"",
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 45,
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'commit_to_roster',
        text: 'Commit to the current roster',
        description: 'Reaffirm belief in the team and push forward together',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'management_committed_to_roster',
            flagDuration: 60,
          },
        ],
        outcomeText: 'You send a message of full commitment. Players rally. Whether this was the right call will be answered on the server.',
      },
      {
        id: 'evaluate_moves',
        text: 'Begin evaluating roster moves',
        description: 'Open the door to transfers and roster changes',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'transfer_window_scouting',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You acknowledge the assistant coach\'s concerns. Uncertainty spreads through the roster — everyone wonders if they\'re on the chopping block.',
      },
      {
        id: 'fire_assistant_coach',
        text: 'Fire the assistant coach',
        description: 'Remove the dissenting voice from the staff',
        effects: [
          {
            target: 'team_budget',
            delta: -3000,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
        ],
        outcomeText: 'You let the assistant coach go. The message to the team is clear, but losing experienced staff always has a cost.',
      },
    ],
  },

  // ==========================================================================
  // CHAIN CLOSERS — Consuming orphaned flags from earlier decisions
  // ==========================================================================

  {
    id: 'ego_role_demand_resurfaced',
    category: 'player_ego',
    severity: 'major',
    title: 'Deferred Demand Resurfaces',
    description: "{playerName} hasn't forgotten the conversation you put off. They're back — and this time they're not asking politely.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'ego_role_demand_delayed_{playerId}',
      },
      {
        type: 'player_morale_below',
        threshold: 45,
        playerSelector: 'any',
      },
    ],
    probability: 85,
    cooldownDays: 7,
    choices: [
      {
        id: 'accommodate_now',
        text: 'Accommodate now — late is better than never',
        description: 'Give them the role change they originally asked for',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
          },
        ],
        outcomeText: "{playerName} is relieved, though the delay still stings. They accept the role change and get back to work. Chemistry takes a small hit as teammates adjust.",
      },
      {
        id: 'refuse_again',
        text: 'Refuse again — hold the line',
        description: 'Stick to your original decision',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -15,
          },
          {
            target: 'set_flag',
            flag: 'ego_role_demand_refused_{playerId}',
            flagDuration: 21,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
          },
        ],
        outcomeText: "{playerName}'s frustration turns to resentment. You've drawn a line, but it may cost you later.",
        triggersEventId: 'ego_trade_request',
      },
      {
        id: 'offer_compromise',
        text: 'Offer a middle ground',
        description: 'Find a hybrid that gives them partial what they need',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 2,
          },
          {
            target: 'clear_flag',
            flag: 'ego_role_demand_delayed_{playerId}',
          },
        ],
        outcomeText: "You carve out space for {playerName} to shine in specific scenarios. It's not exactly what they wanted, but it's enough to keep the peace for now.",
      },
    ],
  },

  {
    id: 'ego_promise_broken',
    category: 'player_ego',
    severity: 'major',
    title: 'Broken Promise',
    description: "{playerName} is watching. You promised changes weeks ago — but nothing has shifted. They're done being patient.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'ego_promise_made_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 75,
    cooldownDays: 7,
    choices: [
      {
        id: 'make_changes_now',
        text: 'Deliver on the promise immediately',
        description: 'Follow through — better late than never',
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
            flag: 'ego_promise_made_{playerId}',
          },
        ],
        outcomeText: "You finally deliver on your word. {playerName} appreciates it, though they remember how long they had to wait. The team adjusts.",
      },
      {
        id: 'apologize_and_delay',
        text: 'Apologize and ask for more time',
        description: 'Acknowledge the failure and buy one last extension',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
        ],
        outcomeText: "{playerName} listens, but you can see the trust fading. This is the last extension they'll give you.",
        triggersEventId: 'ego_trade_request',
      },
      {
        id: 'deny_the_promise',
        text: 'Claim circumstances have changed',
        description: "Revisit whether the original promise was ever realistic",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -20,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'ego_promise_made_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'ego_role_demand_refused_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: "{playerName} is furious. You've torched whatever goodwill remained. Expect a formal trade request soon.",
        triggersEventId: 'ego_trade_request',
      },
    ],
  },

  {
    id: 'roster_departure_shockwave',
    category: 'team_synergy',
    severity: 'minor',
    title: 'Departure Shockwave',
    description: "The locker room hasn't processed {playerName}'s exit. Everyone is quieter than usual — and wondering if they're next.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'player_trade_requested_{playerId}',
      },
    ],
    probability: 90,
    cooldownDays: 14,
    effects: [
      {
        target: 'team_chemistry',
        delta: -10,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: -8,
      },
      {
        target: 'set_flag',
        flag: 'roster_instability',
        flagDuration: 14,
      },
    ],
  },

  {
    id: 'separation_boiling_point',
    category: 'team_synergy',
    severity: 'major',
    title: "Separation Isn't Working",
    description: "Keeping the two players apart has only let the tension fester. The rest of the team is visibly choosing sides.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'players_separated',
      },
      {
        type: 'team_chemistry_below',
        threshold: 50,
      },
    ],
    probability: 80,
    cooldownDays: 14,
    choices: [
      {
        id: 'force_reconciliation',
        text: 'Force a reconciliation',
        description: 'Lock them in a room until they work it out',
        effects: [
          {
            target: 'team_chemistry',
            delta: 12,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'players_separated',
          },
        ],
        outcomeText: "It's uncomfortable, but the forced conversation clears the air. They won't be best friends, but they can compete on the same server again.",
      },
      {
        id: 'transfer_one',
        text: 'Move one player out',
        description: 'Accept that this relationship is unrecoverable',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'players_separated',
          },
          {
            target: 'set_flag',
            flag: 'roster_instability',
            flagDuration: 14,
          },
        ],
        outcomeText: "You part ways with one of them. The immediate tension dissolves, but the team needs time to find its rhythm again.",
      },
      {
        id: 'restructure_hierarchy',
        text: 'Restructure team hierarchy',
        description: 'Give each player clearly defined lanes to reduce overlap',
        effects: [
          {
            target: 'team_chemistry',
            delta: 7,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
          {
            target: 'clear_flag',
            flag: 'players_separated',
          },
        ],
        outcomeText: "By clearly defining roles, the two players no longer need to compete for the same space. The tension doesn't vanish, but it becomes manageable.",
      },
    ],
  },

  {
    id: 'burnout_crisis_breaking_point',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Breaking Point',
    description: "{playerName} has hit a wall. After weeks of relentless grinding, your assistant coach flags it: they can't continue at this pace.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'burnout_risk_high',
      },
      {
        type: 'random_chance',
        chance: 40,
        playerSelector: 'any',
      },
    ],
    probability: 65,
    cooldownDays: 10,
    choices: [
      {
        id: 'immediate_rest',
        text: 'Pull them from practice immediately',
        description: 'Mandatory rest — no negotiations',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'burnout_risk_high',
          },
          {
            target: 'set_flag',
            flag: 'wellness_break_taken',
            flagDuration: 7,
          },
        ],
        outcomeText: "{playerName} steps back from practice. A week later, they return quieter but steadier. Sometimes slowing down is the fastest way forward.",
      },
      {
        id: 'bring_in_psychologist',
        text: 'Bring in a sports psychologist',
        description: 'Address the root cause with professional support',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_budget',
            delta: -2000,
          },
          {
            target: 'clear_flag',
            flag: 'burnout_risk_high',
          },
          {
            target: 'set_flag',
            flag: 'psych_support_given_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: "The sessions reveal patterns {playerName} wasn't even aware of. It's an investment in the long game — and it shows.",
      },
      {
        id: 'push_through_anyway',
        text: "Remind them what's at stake",
        description: 'Keep the pressure on — results are on the line',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -20,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
        ],
        outcomeText: "{playerName} grits through it, but something breaks. You can see it in their play. The short-term work rate isn't worth what you're watching.",
      },
    ],
  },

  {
    id: 'coach_credibility_crisis',
    category: 'team_synergy',
    severity: 'major',
    title: 'Coach Credibility Crisis',
    description: "Players are openly questioning the coaching staff's involvement in shot-calling. After another loss, the murmurs have reached you directly.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'coach_micromanaging',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 70,
    cooldownDays: 10,
    choices: [
      {
        id: 'restore_player_agency',
        text: 'Restore player autonomy',
        description: 'Step back and trust the players to make the calls',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'clear_flag',
            flag: 'coach_micromanaging',
          },
        ],
        outcomeText: "You loosen the reins. The team exhales. In the next practice, the energy is noticeably different — players are calling with conviction again.",
      },
      {
        id: 'double_down',
        text: 'Defend the system publicly',
        description: "Stand firm — the process is correct, the results aren't there yet",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'set_flag',
            flag: 'igl_authority_undermined',
            flagDuration: 21,
          },
        ],
        outcomeText: "You stand firm. Players go quiet — not because they agree, but because they've stopped fighting it. That silence is more worrying than the complaints.",
      },
      {
        id: 'hybrid_delegation',
        text: 'Delegate by situation type',
        description: 'Coach handles macro strategy; players handle mid-round',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
          {
            target: 'clear_flag',
            flag: 'coach_micromanaging',
          },
          {
            target: 'set_flag',
            flag: 'leadership_established',
            flagDuration: 21,
          },
        ],
        outcomeText: "You draw clearer lines. Players feel trusted where it counts most — mid-round. The structure isn't perfect, but the locker room settles.",
      },
    ],
  },

  {
    id: 'public_backing_backfire',
    category: 'external_pressure',
    severity: 'major',
    title: 'Public Backing Backfired',
    description: "You put yourself on the line publicly — and then the team lost. The same fans who nodded along are now using your words against you.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'public_backing_risk',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 80,
    cooldownDays: 3,
    choices: [
      {
        id: 'double_down',
        text: 'Stay the course — one loss changes nothing',
        description: "Refuse to walk back your public stance",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'public_backing_risk',
            flagDuration: 7,
          },
        ],
        outcomeText: "You refuse to flinch. Players respect the loyalty, but the media is circling. You're all-in now — another loss and it gets ugly.",
      },
      {
        id: 'temper_expectations',
        text: 'Recalibrate the narrative publicly',
        description: 'Acknowledge the loss and walk back the bold claims',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -3,
          },
          {
            target: 'team_chemistry',
            delta: -2,
          },
          {
            target: 'clear_flag',
            flag: 'public_backing_risk',
          },
        ],
        outcomeText: "You dial back the rhetoric. It feels like a step back, but the pressure lifts. Players quietly appreciate the breathing room.",
      },
      {
        id: 'redirect_to_motivation',
        text: 'Channel the criticism into fuel',
        description: 'Use the backlash to galvanize the room internally',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'public_backing_risk',
          },
        ],
        outcomeText: "You read the worst posts in a team meeting. The room goes from embarrassed to galvanized. Sometimes the best motivator is a hater with a platform.",
      },
    ],
  },

  {
    id: 'loyalty_decision_deadline',
    category: 'external_pressure',
    severity: 'major',
    title: 'Loyalty Test: Decision Time',
    description: "The rival org's offer window is closing. {playerName} needs to give them an answer — and they've come to you first asking what staying would look like.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'loyalty_tested_{playerId}',
      },
    ],
    probability: 85,
    cooldownDays: 14,
    choices: [
      {
        id: 'match_the_offer',
        text: 'Match the rival offer',
        description: 'Show with numbers that you value them',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'team_budget',
            delta: -5000,
          },
          {
            target: 'clear_flag',
            flag: 'loyalty_tested_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'contract_extended_{playerId}',
            flagDuration: 60,
          },
        ],
        outcomeText: "{playerName} signs the new deal. They feel valued. The org feels the financial strain — but the roster stays intact and focused.",
      },
      {
        id: 'let_them_go',
        text: 'Wish them well',
        description: 'Let them take the rival offer',
        effects: [
          {
            target: 'team_chemistry',
            delta: -12,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'loyalty_tested_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'roster_instability',
            flagDuration: 21,
          },
        ],
        outcomeText: "{playerName} departs for the rival org. The handshake is warm but the room is stunned. Now you need to rebuild around the gap they leave.",
      },
      {
        id: 'appeal_once_more',
        text: 'Make one final emotional appeal',
        description: 'Remind them what this team means beyond the money',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'loyalty_tested_{playerId}',
          },
        ],
        outcomeText: "{playerName} stays — for now. They turned down the money, but you'd better make sure they don't regret the choice.",
      },
    ],
  },

  {
    id: 'contract_promise_ultimatum',
    category: 'player_ego',
    severity: 'major',
    title: 'Contract Promise Expires',
    description: "The deadline you implicitly agreed to has passed. {playerName}'s agent has sent a final notice: extend now, or they explore the open market.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'contract_extension_promised_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
    ],
    probability: 80,
    cooldownDays: 14,
    choices: [
      {
        id: 'extend_now',
        text: 'Sign the extension now',
        description: 'Honor the original spirit of the promise',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 18,
          },
          {
            target: 'team_budget',
            delta: -4000,
          },
          {
            target: 'clear_flag',
            flag: 'contract_extension_promised_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'contract_extended_{playerId}',
            flagDuration: 60,
          },
        ],
        outcomeText: "{playerName} signs the extension. The distraction is gone. They play with a visible weight lifted off their shoulders.",
      },
      {
        id: 'link_to_results',
        text: 'Link the deal to upcoming performance',
        description: 'Demand a strong result before committing',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
        ],
        outcomeText: "{playerName} is frustrated but accepts the conditional terms. Every match now carries contract implications — the pressure is palpable.",
        triggersEventId: 'contract_year_ultimatum',
      },
      {
        id: 'explore_replacements',
        text: 'Quietly scout for replacements',
        description: 'See if the market has better value at their position',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -15,
          },
          {
            target: 'team_chemistry',
            delta: -10,
          },
          {
            target: 'clear_flag',
            flag: 'contract_extension_promised_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'player_on_market_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: "Word leaks, as it always does. {playerName} finds out you were shopping replacements. The fallout is immediate.",
        triggersEventId: 'ego_trade_request',
      },
    ],
  },

  // ==========================================================================
  // PERSONALITY-DRIVEN EVENTS
  // ==========================================================================

  {
    id: 'big_stage_anxiety',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Regular Season Malaise',
    description: "{playerName} plays their best when everything is on the line — but regular season matches have them visibly disengaged. They're saving themselves for the moments that matter.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'BIG_STAGE',
      },
      {
        type: 'player_morale_below',
        threshold: 65,
        playerSelector: 'any',
      },
      {
        type: 'random_chance',
        chance: 35,
        playerSelector: 'any',
      },
    ],
    probability: 40,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -8,
      },
      {
        target: 'player_form',
        effectPlayerSelector: 'triggering',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'big_stage_disengaged_{playerId}',
        flagDuration: 10,
      },
    ],
  },

  {
    id: 'big_stage_playoff_ignition',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Playoff Mode Activated',
    description: "The moment the bracket was set, something flipped in {playerName}. Practice intensity is up, focus is sharp. They're exactly who you need them to be right now.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'BIG_STAGE',
      },
      {
        type: 'season_phase',
        phase: 'stage1_playoffs',
      },
      {
        type: 'random_chance',
        chance: 50,
        playerSelector: 'any',
      },
    ],
    probability: 60,
    cooldownDays: 30,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 15,
      },
      {
        target: 'player_form',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
      {
        target: 'player_stat',
        stat: 'mental',
        effectPlayerSelector: 'triggering',
        delta: 3,
      },
    ],
  },

  {
    id: 'stable_player_roster_resistance',
    category: 'player_ego',
    severity: 'major',
    title: 'Stability Pushback',
    description: "{playerName} is one of the most grounded players on your roster — and they've heard about the scouting activity. They come to you directly: am I part of this team's future?",
    conditions: [
      {
        type: 'player_personality',
        personality: 'STABLE',
      },
      {
        type: 'flag_active',
        flag: 'transfer_window_scouting',
      },
    ],
    probability: 70,
    cooldownDays: 14,
    choices: [
      {
        id: 'reassure_them',
        text: "Reassure them — they're not going anywhere",
        description: 'Give a direct, honest answer',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
        ],
        outcomeText: "{playerName} nods, satisfied. Their groundedness steadies the whole room. Other players notice you were straight with them and respect it.",
      },
      {
        id: 'acknowledge_uncertainty',
        text: 'Be honest — all options remain open',
        description: "Tell them the truth even if it's uncomfortable",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'loyalty_tested_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: "{playerName} takes it with grace — that's who they are. But you can see them recalibrate internally. A STABLE player forced into instability is a slow-burning risk.",
      },
      {
        id: 'give_leadership_role',
        text: 'Offer them a leadership role',
        description: "Make them an anchor for what you're building",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 18,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'leadership_established',
            flagDuration: 30,
          },
        ],
        outcomeText: "You ask {playerName} to be the steady center this team needs. They light up quietly — that's exactly the kind of purpose they play for.",
      },
    ],
  },

  {
    id: 'team_first_leadership_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Team Player Steps Up',
    description: "{playerName} pulled aside two struggling teammates after practice and ran a private session with them. No announcement. No fanfare. Just work.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'TEAM_FIRST',
      },
      {
        type: 'team_chemistry_above',
        threshold: 60,
      },
      {
        type: 'random_chance',
        chance: 20,
        playerSelector: 'any',
      },
    ],
    probability: 30,
    cooldownDays: 14,
    effects: [
      {
        target: 'team_chemistry',
        delta: 8,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'all',
        delta: 5,
      },
      {
        target: 'player_stat',
        stat: 'mental',
        effectPlayerSelector: 'triggering',
        delta: 3,
      },
    ],
  },

  {
    id: 'introvert_confidence_crisis',
    category: 'practice_burnout',
    severity: 'major',
    title: 'Public Criticism Hits Different',
    description: "Public criticism rarely lands the same way for everyone. For {playerName}, it's clearly landed hard — your assistant coach reports they've been isolating themselves and their play has quietly regressed.",
    conditions: [
      {
        type: 'player_personality',
        personality: 'INTROVERT',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
      {
        type: 'random_chance',
        chance: 30,
        playerSelector: 'any',
      },
    ],
    probability: 55,
    cooldownDays: 14,
    choices: [
      {
        id: 'private_check_in',
        text: 'Have a quiet one-on-one',
        description: 'No agenda, no pressure — just check in',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 4,
          },
        ],
        outcomeText: "The conversation is short, but it lands. {playerName} didn't need advice — they needed to feel seen. You gave them that.",
      },
      {
        id: 'shield_from_media',
        text: 'Shield them from external noise',
        description: 'Limit their media obligations and social media exposure',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'psych_support_given_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: "You reduce their public exposure. Shielded from the noise, {playerName} slowly finds their footing again. Their play quietly returns to form.",
      },
      {
        id: 'push_through_together',
        text: 'Encourage them to confront it',
        description: 'Believe public confidence-building will help',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
        ],
        outcomeText: "For most players, facing it head-on works. For {playerName}, it's too much too fast. The public confidence-building backfires, and they retreat further.",
      },
    ],
  },

  // ==========================================================================
  // STAT-BASED EVENTS
  // ==========================================================================

  {
    id: 'igl_effectiveness_crisis',
    category: 'team_synergy',
    severity: 'major',
    title: 'Shot-Calling in Crisis',
    description: "Mid-round calls have been consistently wrong for weeks. Players are hesitating on comms, second-guessing every decision. The team is playing scared.",
    conditions: [
      {
        type: 'player_stat_below',
        stat: 'igl',
        threshold: 45,
        playerSelector: 'any',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 65,
    cooldownDays: 14,
    choices: [
      {
        id: 'targeted_igl_coaching',
        text: 'Invest in targeted IGL coaching',
        description: 'Bring in a specialist to improve their decision-making',
        effects: [
          {
            target: 'player_stat',
            stat: 'igl',
            effectPlayerSelector: 'any',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_budget',
            delta: -2000,
          },
        ],
        outcomeText: "The specialist sessions are demanding, but {playerName} is a sharper caller by the end of it. The team starts trusting the calls again.",
      },
      {
        id: 'rotate_igl',
        text: 'Try rotating shot-callers',
        description: 'Let the team find who calls best under pressure',
        effects: [
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'igl_authority_undermined',
            flagDuration: 14,
          },
        ],
        outcomeText: "Different voices emerge. Some calls are better, some worse. The instability is real, but so is the talent you're uncovering.",
      },
      {
        id: 'simplify_playbook',
        text: 'Simplify the calling system',
        description: 'Reduce cognitive load with fewer, clearer options',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 2,
          },
          {
            target: 'player_stat',
            stat: 'igl',
            effectPlayerSelector: 'any',
            delta: 3,
          },
        ],
        outcomeText: "A simpler system means fewer catastrophic call failures. Progress is measured, but the team stops imploding on itself mid-round.",
      },
    ],
  },

  {
    id: 'mental_fortitude_tested',
    category: 'practice_burnout',
    severity: 'minor',
    title: 'Mental Fortitude Tested',
    description: "{playerName} has been tilting hard after close losses. The mental side of the game is becoming a liability.",
    conditions: [
      {
        type: 'player_stat_below',
        stat: 'mental',
        threshold: 40,
        playerSelector: 'any',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -12,
      },
      {
        target: 'player_form',
        effectPlayerSelector: 'triggering',
        delta: -8,
      },
      {
        target: 'set_flag',
        flag: 'mental_tilt_{playerId}',
        flagDuration: 7,
      },
    ],
  },

  {
    id: 'clutch_player_pressure_moment',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Clutch Factor Emerging',
    description: "{playerName} has been delivering in the moments that matter most. Their ability to perform under pressure is becoming a defining trait.",
    conditions: [
      {
        type: 'player_stat_above',
        stat: 'clutch',
        threshold: 70,
        playerSelector: 'any',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 40,
    cooldownDays: 10,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
      {
        target: 'player_stat',
        stat: 'clutch',
        effectPlayerSelector: 'triggering',
        delta: 2,
      },
      {
        target: 'team_chemistry',
        delta: 5,
      },
    ],
  },

  // ==========================================================================
  // KICKOFF TOURNAMENT ARCS — DRAMA EVENTS
  // ==========================================================================

  // Arc 1: Veteran Legacy Pressure
  {
    id: 'veteran_legacy_reckoning',
    category: 'breakthrough',
    severity: 'major',
    title: 'The Weight of Legacy',
    description: "{playerName} has been reflecting publicly on what remains of their career — and now, facing what could be a defining moment, they've asked for a private meeting. The question in the room is unspoken but impossible to ignore: is this the run?",
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_veteran_legacy_hinted',
      },
      {
        type: 'player_stat_above',
        stat: 'mechanics',
        threshold: 65,
        playerSelector: 'star_player',
      },
    ],
    probability: 85,
    cooldownDays: 14,
    oncePerSeason: true,
    choices: [
      {
        id: 'championship_commitment',
        text: 'Make a public title pact',
        description: "Announce publicly that you're committing everything to a championship run together. The spotlight will be enormous.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'set_flag',
            flag: 'veteran_championship_pact',
            flagDuration: 60,
          },
          {
            target: 'clear_flag',
            flag: 'interview_veteran_legacy_hinted',
          },
        ],
        outcomeText: "{playerName} commits publicly to a final championship run. The fanbase erupts — but the pressure that comes with those words is now immense. Every result will be measured against this moment.",
      },
      {
        id: 'private_support',
        text: 'Back them quietly — no circus',
        description: "Tell them they have your full support without making it a media event. Let results carry the story.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: 4,
          },
          {
            target: 'clear_flag',
            flag: 'interview_veteran_legacy_hinted',
          },
        ],
        outcomeText: "You and {playerName} share a quiet moment of understanding. No spotlight, no ceremony — just a handshake and renewed purpose. The team senses something settled without knowing what was said.",
      },
      {
        id: 'honest_conversation',
        text: 'Discuss a mentorship transition',
        description: "Gently raise the idea of a player-coach role that uses their experience differently, reducing their competitive burden.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'veteran_considering_retirement',
            flagDuration: 30,
          },
        ],
        outcomeText: "{playerName} goes quiet. The idea clearly unsettles them — but they promise to think it over. The locker room senses that something shifted in that room, even if no one knows what.",
      },
    ],
  },

  // Arc 2: Breakout Star — Personal Sponsor Offer
  {
    id: 'prodigy_sponsor_offer',
    category: 'external_pressure',
    severity: 'major',
    title: 'Life-Changing Offer',
    description: "A major brand has reached out directly to {playerName} with a personal sponsorship deal — independent of any team arrangement. They've brought it to you privately, excited but clearly uncertain how to navigate it. The number is serious.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'prodigy_hype_{playerId}',
      },
      {
        type: 'player_stat_above',
        stat: 'mechanics',
        threshold: 70,
        playerSelector: 'any',
      },
      {
        type: 'random_chance',
        chance: 45,
      },
    ],
    probability: 65,
    cooldownDays: 14,
    oncePerSeason: true,
    choices: [
      {
        id: 'negotiate_team_cut',
        text: 'Require a team revenue share',
        description: "Support the deal but make clear that an org percentage is standard. Keeps everyone aligned financially.",
        effects: [
          {
            target: 'team_budget',
            delta: 5000,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'prodigy_org_share_deal',
            flagDuration: 21,
          },
        ],
        outcomeText: "The arrangement is negotiated — the org takes a cut. {playerName} accepts, though they aren't thrilled. The team benefits financially. The star feels slightly constrained, but the relationship remains intact.",
      },
      {
        id: 'full_support',
        text: 'Support them fully — no conditions',
        description: "This is their moment. A happy, motivated star lifts the whole team.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'set_flag',
            flag: 'ego_media_distraction_{playerId}',
            flagDuration: 14,
          },
          {
            target: 'clear_flag',
            flag: 'prodigy_hype_{playerId}',
          },
        ],
        outcomeText: "{playerName} is overwhelmed with gratitude. The deal is signed. Their profile skyrockets. For now the energy is contagious — though distractions may follow when the content calendar starts filling up.",
      },
      {
        id: 'decline_carefully',
        text: 'Encourage them to wait for a bigger moment',
        description: "The timing isn't right. Once you win something real, the offers will be larger.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'prodigy_hype_{playerId}',
          },
        ],
        outcomeText: "{playerName} listens. Disappointment shows in their face for the rest of the day. A window that doesn't always stay open has been closed — you hope the championship you're promising them is worth it.",
      },
    ],
  },

  // Arc 3: Triple-Elimination Mental Fatigue
  {
    id: 'triple_elim_wall',
    category: 'practice_burnout',
    severity: 'major',
    title: 'The Elimination Wall',
    description: "After surviving multiple consecutive must-win matches, the team is visibly hitting a wall. {playerName} and others are showing signs of physical and mental fatigue — practice sessions are shorter, focus is fragmenting, and another must-win match looms.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_mid_bracket_grind',
      },
      {
        type: 'player_form_below',
        threshold: 55,
        playerSelector: 'any',
      },
    ],
    probability: 80,
    cooldownDays: 10,
    choices: [
      {
        id: 'forced_rest',
        text: 'Cut practice — recovery only',
        description: "No film sessions tonight. Rest, food, sleep. Go in fresh rather than over-prepared.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 8,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'set_flag',
            flag: 'reduced_training_time',
            flagDuration: 7,
          },
        ],
        outcomeText: "The team visibly exhales. Morale lifts the moment they realize they're being treated like humans, not machines. The preparation is lighter — but the energy walking into that match is something different.",
      },
      {
        id: 'mental_coach',
        text: 'Bring in sports psychologist tonight',
        description: "Call in the performance consultant. Tonight is about mindset, not mechanics.",
        effects: [
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'interview_mid_bracket_grind',
          },
        ],
        outcomeText: "The session is unexpectedly powerful. Players open up about pressure they've been carrying silently. It doesn't solve the fatigue, but it clears something heavy from the room. They arrive to match day lighter.",
      },
      {
        id: 'grind_through',
        text: 'Push through — the work matters most',
        description: "You didn't survive three elimination rounds to go soft now. Keep reviewing, keep drilling.",
        effects: [
          {
            target: 'player_form',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: -6,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'burnout_risk_high',
            flagDuration: 10,
          },
        ],
        outcomeText: "The session runs late. Clips are reviewed, callouts are rehearsed, adjustments are made. The work is undeniably there — but so is the exhaustion. You'll know soon if the tradeoff was worth it.",
      },
    ],
  },

  // Arc 4: IGL Community Scapegoat
  {
    id: 'igl_community_scapegoat',
    category: 'external_pressure',
    severity: 'major',
    title: 'Public Villain',
    description: "Fan forums, social media, and content creators have coalesced around a harsh verdict: your IGL is the reason the team is struggling. The pressure has become impossible to ignore — {playerName} arrived to practice looking hollow, visibly distracted by the discourse. Something has to be addressed.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'igl_authority_undermined',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
      {
        type: 'player_morale_below',
        threshold: 55,
        playerSelector: 'any',
      },
    ],
    probability: 75,
    cooldownDays: 14,
    choices: [
      {
        id: 'public_defense',
        text: 'Defend them publicly',
        description: "Issue a statement. Speak on stream. Your IGL has your complete confidence — say it loudly.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'set_flag',
            flag: 'manager_backed_igl',
            flagDuration: 21,
          },
        ],
        outcomeText: "Your backing generates controversy but gives {playerName} real breathing room. Some fans respect the loyalty. Others call it blind management. For now, {playerName} sits straighter in scrims and the team senses the clarity.",
        triggersEventId: 'public_backing_backfire',
      },
      {
        id: 'internal_protection',
        text: 'Shield them internally — say nothing publicly',
        description: "Don't feed the discourse. Check in daily and quietly adjust responsibilities to cover exposed weaknesses.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: "The silence reads as avoidance to the public — but the locker room knows differently. {playerName} plays with less weight this week. The team adapts quietly, covering gaps without announcing it.",
      },
      {
        id: 'redistribute_quietly',
        text: 'Quietly redistribute shot-calling duties',
        description: "Without a public statement, shift more in-game calls to others. Protect the team result by reducing pressure on one person.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -10,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'igl_authority_undermined',
          },
          {
            target: 'set_flag',
            flag: 'igl_seeking_redemption',
            flagDuration: 14,
          },
        ],
        outcomeText: "{playerName} notices the shift before you can frame it. The conversation is difficult. They don't quit — but something in their eyes changes. The team's calls are cleaner. The cost is still being calculated.",
      },
    ],
  },

  // Arc 5: Historic Win — Expectations Spike
  {
    id: 'historic_win_expectations_spike',
    category: 'external_pressure',
    severity: 'major',
    title: 'The Weight of History',
    description: "The historic result has set off a chain reaction. Sponsor calls are flooding in. Media requests have tripled. And in the locker room, an unspoken pressure has taken root — what if we can't do it again? {playerName} confided to a teammate: 'Everyone is watching us now.'",
    conditions: [
      {
        type: 'flag_active',
        flag: 'interview_historic_win',
      },
      {
        type: 'tournament_active',
      },
    ],
    probability: 85,
    cooldownDays: 21,
    oncePerSeason: true,
    choices: [
      {
        id: 'embrace_spotlight',
        text: 'Embrace the spotlight — full media tour',
        description: "Lean into the moment. The exposure builds the org's brand and demonstrates your arrival at the top.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'org_milestone_celebrated',
            flagDuration: 14,
          },
        ],
        outcomeText: "The team becomes a household name overnight. The org is thrilled with the exposure. The players are exhausted and slightly overwhelmed — but for now the energy in every room they walk into is electric.",
      },
      {
        id: 'protect_the_bubble',
        text: 'Protect the team from distractions',
        description: "Controlled media access only. The team that won needs to be the team that competes next week.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 6,
          },
          {
            target: 'clear_flag',
            flag: 'interview_historic_win',
          },
        ],
        outcomeText: "You draw a line around the team. The press questions your handling. Inside the bubble, the team is calm, focused, and grateful. The work continues — and that normalcy is exactly what they needed.",
      },
      {
        id: 'channel_hunger',
        text: "Use history as fuel — raise the target immediately",
        description: "One speech: 'Now that you know what winning feels like, is one enough?' Redirect the emotion forward.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 4,
          },
          {
            target: 'set_flag',
            flag: 'org_championship_mandate',
            flagDuration: 30,
          },
        ],
        outcomeText: "The room goes quiet after you speak. Then someone nods. The hunger is redirected — this team does not want to be a one-hit wonder. Training intensity lifts the next morning without you having to say another word.",
      },
    ],
  },

  // Arc 6: Underdog Miracle Run — minor spark event
  {
    id: 'elimination_survival_spark',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Backs Against the Wall',
    description: "After surviving another must-win elimination match, something has visibly shifted in this team. The near-death experience of bracket play has lit a fire that regular-season pressure never could.",
    conditions: [
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
      {
        type: 'tournament_active',
      },
      {
        type: 'random_chance',
        chance: 35,
      },
    ],
    probability: 50,
    cooldownDays: 7,
    effects: [
      {
        target: 'player_form',
        effectPlayerSelector: 'all_team',
        delta: 8,
      },
      {
        target: 'team_chemistry',
        delta: 5,
      },
      {
        target: 'set_flag',
        flag: 'elimination_run_momentum',
        flagDuration: 10,
      },
    ],
  },

  // Arc 6: Underdog Miracle Run — major culmination
  {
    id: 'elimination_miracle_run',
    category: 'breakthrough',
    severity: 'major',
    title: 'Miracle Run Territory',
    description: "Multiple survival moments have crystallized into something tangible: this team genuinely believes they cannot be eliminated. {playerName} gave an impromptu speech before practice that had teammates in tears. Something rare is happening in this prac room and everyone can feel it.",
    conditions: [
      {
        type: 'flag_active',
        flag: 'elimination_run_momentum',
      },
      {
        type: 'team_chemistry_above',
        threshold: 60,
        playerSelector: 'any',
      },
      {
        type: 'tournament_active',
      },
    ],
    probability: 70,
    cooldownDays: 14,
    oncePerSeason: true,
    choices: [
      {
        id: 'let_it_breathe',
        text: 'Step back — let it grow on its own',
        description: "Don't over-coach this moment. They found something themselves. Trust it.",
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 8,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'random',
            delta: 12,
          },
          {
            target: 'clear_flag',
            flag: 'elimination_run_momentum',
          },
        ],
        outcomeText: "You step back and watch something rare unfold. Players organize their own film sessions. Everyone arrives early. The belief is self-sustaining — a managed fire that doesn't need your oxygen to keep burning.",
      },
      {
        id: 'channel_into_structure',
        text: 'Convert the belief into tactical discipline',
        description: "Emotion is fuel. Now convert it into preparation that can survive deep bracket play.",
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_form',
            effectPlayerSelector: 'all_team',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'management_committed_to_roster',
            flagDuration: 21,
          },
        ],
        outcomeText: "You redirect the energy into the most focused practice block the team has had all season. The belief is still burning — but now it has a blueprint. This team is dangerous and organized.",
      },
      {
        id: 'make_bold_statement',
        text: 'Declare publicly — this team is not going home',
        description: "Announce your intent. Let everyone watching know what's about to happen.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'interview_historic_win',
            flagDuration: 14,
          },
        ],
        outcomeText: "The statement lands across social media. Opponents take notice. Inside the team there's a mix of excitement and weight — 'now we have to back this up.' The pressure is chosen, and that makes all the difference.",
      },
    ],
  },

  // Arc 7: Regional Playstyle Identity Crisis
  {
    id: 'regional_playstyle_debate',
    category: 'meta_rumors',
    severity: 'major',
    title: 'Foreign Meta Envy',
    description: "After reviewing tournament footage, a vocal faction within the team — led by {playerName} — is pushing hard for a complete overhaul of your regional playstyle. 'We're playing last year's game. Look at what they're doing across regions — we need to adapt or we'll keep falling short.'",
    conditions: [
      {
        type: 'tournament_active',
      },
      {
        type: 'team_chemistry_below',
        threshold: 65,
      },
      {
        type: 'player_stat_above',
        stat: 'igl',
        threshold: 60,
        playerSelector: 'any',
      },
      {
        type: 'random_chance',
        chance: 30,
      },
    ],
    probability: 55,
    cooldownDays: 14,
    choices: [
      {
        id: 'full_adoption',
        text: 'Commit to the new approach entirely',
        description: "Run full international-style practice blocks. Rebuild the system from the ground up.",
        effects: [
          {
            target: 'team_chemistry',
            delta: -10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: -5,
          },
          {
            target: 'set_flag',
            flag: 'meta_adaptation_in_progress',
            flagDuration: 21,
          },
        ],
        outcomeText: "The overhaul begins. Players built on structure struggle. But {playerName} is energized, running sessions with an enthusiasm the team hasn't seen before. It will get messier before it gets better — the question is whether better comes in time.",
      },
      {
        id: 'hybrid_merge',
        text: 'Build a hybrid — adapt without abandoning identity',
        description: "Take what works from their meta without throwing out your regional DNA.",
        effects: [
          {
            target: 'team_chemistry',
            delta: 3,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 3,
          },
          {
            target: 'player_stat',
            stat: 'igl',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'meta_adaptation_in_progress',
            flagDuration: 14,
          },
        ],
        outcomeText: "You task {playerName} with proposing specific adaptations. The result is a creative hybrid that feels genuinely fresh — not a copy, not a rejection. Something that belongs to this team and no one else.",
      },
      {
        id: 'trust_regional_identity',
        text: 'Double down on your regional identity',
        description: "You built something here for a reason. Evolution is constant, but chasing another region's success is a trap.",
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
        ],
        outcomeText: "{playerName} accepts the decision without argument — but their disappointment is visible through the rest of practice. For now the team is more settled and cohesive. The debate about adaptation has only been postponed.",
      },
    ],
  },

  // ==========================================================================
  // ARC SYSTEM — ENTRY EVENTS (6 events)
  // Sets primary arc flags. All minor (no choices), player-triggered.
  // Arc flag conventions:
  //   Primary (30-90 days, one per player): arc_redemption_{playerId},
  //     arc_prodigy_{playerId}, arc_contender_{playerId},
  //     arc_fallen_{playerId}, arc_veteran_legacy_{playerId},
  //     arc_identity_{playerId}
  // ==========================================================================

  {
    id: 'arc_entry_redemption',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Redemption Arc Begins',
    description: '{playerName} is carrying the weight of recent losses personally. You can see it in how they carry themselves — they need something to prove.',
    conditions: [
      {
        type: 'player_personality',
        personality: 'FAME_SEEKER',
        playerSelector: 'any',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 40,
    cooldownDays: 21,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_redemption_{playerId}',
        flagDuration: 45,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -8,
      },
    ],
  },

  {
    id: 'arc_entry_prodigy',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Prodigy Arc Recognized',
    description: 'The hype around {playerName} has reached a tipping point. Analysts, fans, and opposing coaches are all tracking them. This is no longer a fluke — this is a rising star.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'prodigy_hype_{playerId}',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 70,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_prodigy_{playerId}',
        flagDuration: 45,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 8,
      },
    ],
  },

  {
    id: 'arc_entry_contender',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Contender Arc Emerges',
    description: '{playerName} has been one of the most consistent performers through this winning run. The narrative around them is shifting — they\'re no longer just a solid player, they\'re someone expected to carry.',
    conditions: [
      {
        type: 'team_win_streak',
        streakLength: 3,
      },
      {
        type: 'bracket_position',
        bracketPosition: 'upper',
      },
      {
        type: 'player_morale_above',
        threshold: 65,
        playerSelector: 'star_player',
      },
    ],
    probability: 55,
    cooldownDays: 21,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_contender_{playerId}',
        flagDuration: 60,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'star_player',
        delta: 10,
      },
    ],
  },

  {
    id: 'arc_entry_fallen',
    category: 'player_ego',
    severity: 'minor',
    title: 'Fallen Arc Sets In',
    description: '{playerName} used to be the player everyone pointed to. Lately the numbers have dropped, the confidence is gone, and you can see they feel it. Something needs to shift before this gets worse.',
    conditions: [
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
      {
        type: 'player_morale_below',
        threshold: 50,
        playerSelector: 'star_player',
      },
    ],
    probability: 45,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_fallen_{playerId}',
        flagDuration: 30,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'star_player',
        delta: -8,
      },
    ],
  },

  {
    id: 'arc_entry_veteran_legacy',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Veteran Legacy Arc Activated',
    description: 'The tournament pressure has collided with everything {playerName} has been building toward. Everyone who\'s followed their career is watching. This feels like a final-chapter moment.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'veteran_championship_pact',
      },
      {
        type: 'elimination_risk',
      },
    ],
    probability: 80,
    cooldownDays: 30,
    oncePerSeason: true,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_veteran_legacy_{playerId}',
        flagDuration: 60,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -5,
      },
    ],
  },

  {
    id: 'arc_entry_identity',
    category: 'player_ego',
    severity: 'minor',
    title: 'Identity Crisis Arc',
    description: '{playerName} looks lost right now — not from lack of effort but from lack of clarity. Their role, their voice on the team, their sense of where they fit: all of it feels uncertain.',
    conditions: [
      {
        type: 'team_chemistry_below',
        threshold: 50,
      },
      {
        type: 'player_morale_below',
        threshold: 55,
        playerSelector: 'any',
      },
      {
        type: 'random_chance',
        chance: 30,
      },
    ],
    probability: 30,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_identity_{playerId}',
        flagDuration: 30,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -5,
      },
    ],
  },

  // ==========================================================================
  // ARC SYSTEM — PROGRESSION EVENTS (9 events)
  // Modifies existing arcs via modifier flags. Mix of minor and major.
  // Modifier flags (14-30 days): arc_mod_momentum_{playerId},
  //   arc_mod_fragile_{playerId}, arc_mod_resilient_{playerId},
  //   arc_mod_underdog_{playerId}, arc_mod_clutch_{playerId}
  // ==========================================================================

  {
    id: 'arc_momentum_surge',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Momentum Surge',
    description: '{playerName}\'s redemption run has hit its stride. The wins are stacking up and you can see the weight lifting off them. Something has clicked.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_redemption_{playerId}',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 60,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_mod_momentum_{playerId}',
        flagDuration: 14,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
    ],
  },

  {
    id: 'arc_fragile_crack',
    category: 'player_ego',
    severity: 'minor',
    title: 'Contender Shows Cracks',
    description: '{playerName} has been handling the expectation of being the team\'s key performer, but back-to-back losses are exposing the pressure underneath. The confident exterior has started to slip.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_contender_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_mod_fragile_{playerId}',
        flagDuration: 14,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -10,
      },
    ],
  },

  // ==========================================================================
  // OPPONENT AWARENESS EVENTS (Phase 3 — 6 events)
  // Conditions: flag_active (rivalry_scorched_earth), bracket_position,
  //             elimination_risk, team_win_streak, tournament_active
  // ==========================================================================

  // 1. opponent_mental_edge — rivalry noise seeps into camp before lower bracket match
  {
    id: 'opponent_mental_edge',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Opponent Narrative in Your Camp',
    description: 'The media won\'t let go of the rivalry. Your players are being asked about the rival organization in every post-match interview and social interaction. The opponent\'s narrative is starting to take up space inside {teamName}\'s mental preparation.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'rivalry_scorched_earth',
      },
      {
        type: 'bracket_position',
        bracketPosition: 'lower',
      },
    ],
    probability: 55,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: -5,
      },
      {
        target: 'set_flag',
        flag: 'rivalry_media_distraction',
        flagDuration: 10,
      },
    ],
    requiresPlayerTeam: true,
  },

  // 2. revenge_match_tension — major choice when a player can't let go before elimination match
  {
    id: 'revenge_match_tension',
    category: 'player_ego',
    severity: 'major',
    title: 'Revenge Match Pressure',
    description: '{playerName} pulled you aside before practice. The upcoming match against the rival team is different for them — there\'s unfinished business they haven\'t been able to let go of. They want to channel it, but you can see the weight it\'s carrying.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'rivalry_scorched_earth',
      },
      {
        type: 'elimination_risk',
      },
    ],
    probability: 70,
    cooldownDays: 30,
    choices: [
      {
        id: 'channel_the_fire',
        text: 'Channel the emotion into focus',
        description: 'Help them use the rivalry tension as fuel rather than distraction',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_clutch_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: 'The conversation shifts something. {playerName} stops carrying it as a burden and starts carrying it as a purpose. They go into the match with a clarity that\'s almost frightening to watch.',
      },
      {
        id: 'clear_the_slate',
        text: 'Ask them to set the history aside',
        description: 'Redirect focus entirely to execution, not the rivalry narrative',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'rivalry_narrative_managed',
            flagDuration: 7,
          },
        ],
        outcomeText: '{playerName} appreciates the honesty. The rivalry noise quiets. The locker room feels calmer going in — focused on rounds, not on payback.',
      },
      {
        id: 'let_it_ride',
        text: 'Give them space to manage it their own way',
        description: 'Let them process the emotion privately — trust they know themselves',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -3,
          },
          {
            target: 'team_chemistry',
            delta: 2,
          },
        ],
        outcomeText: 'You give them the space. {playerName} heads into the match carrying everything they came in with. Whether it helps or hurts will become clear on the server.',
      },
    ],
    requiresPlayerTeam: true,
  },

  // 3. upset_victim_media_frenzy — momentum narrative builds after consecutive tournament wins
  {
    id: 'upset_victim_media_frenzy',
    category: 'external_pressure',
    severity: 'minor',
    title: 'Upset Narrative Builds',
    description: 'The media is running with the story. Analysts are calling the recent results one of the tournament\'s biggest surprises. The coverage is positive — but the sudden spotlight has a weight that {teamName} is only now beginning to feel.',
    conditions: [
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
      {
        type: 'tournament_active',
      },
    ],
    probability: 45,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 5,
      },
      {
        target: 'set_flag',
        flag: 'arc_mod_momentum',
        flagDuration: 14,
      },
      {
        target: 'set_flag',
        flag: 'upset_narrative_active',
        flagDuration: 10,
      },
    ],
    requiresPlayerTeam: true,
  },

  // 4. rematch_spotlight — major event when scorched-earth rivalry collides with lower bracket
  {
    id: 'rematch_spotlight',
    category: 'external_pressure',
    severity: 'major',
    title: "The Rematch Everyone's Watching",
    description: 'Word has gotten out that an opponent with major rivalry history is potentially on a collision course with {teamName} again. Fans, analysts, and broadcast are locked into the rematch narrative — and it hasn\'t even been confirmed yet.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'rivalry_scorched_earth',
      },
      {
        type: 'bracket_position',
        bracketPosition: 'lower',
      },
      {
        type: 'random_chance',
        chance: 60,
      },
    ],
    probability: 80,
    cooldownDays: 30,
    choices: [
      {
        id: 'lean_into_narrative',
        text: 'Embrace the spotlight',
        description: 'Use the media attention to galvanize the team',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_momentum',
            flagDuration: 14,
          },
        ],
        outcomeText: 'The team leans into the story. There\'s something energizing about being at the center of the narrative — every player steps into the bracket feeling like they\'re playing in front of the whole world. The pressure becomes fuel.',
      },
      {
        id: 'control_the_narrative',
        text: 'Manage the media carefully',
        description: 'Brief the team, control messaging, limit distraction',
        effects: [
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'rivalry_narrative_managed',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You handle the press with care. The team stays focused and the external noise stays external. They go in grounded — no extra weight, just preparation and purpose.',
      },
      {
        id: 'shut_it_out_completely',
        text: 'Full media blackout',
        description: 'No interviews, no engagement — complete silence',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'all_team',
            delta: -5,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: 'The blackout creates its own story — the silence becomes part of the narrative. Players feel protected from the noise, but some quietly wonder if the withdrawal signals anxiety rather than focus.',
      },
    ],
    requiresPlayerTeam: true,
  },

  // 5. lower_bracket_belief — consecutive lower bracket wins spark genuine team belief
  {
    id: 'lower_bracket_belief',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Lower Bracket Believers',
    description: 'After consecutive wins in the lower bracket, something has shifted in {teamName}\'s energy. What started as survival mode has evolved into genuine belief. You can hear it in how they talk about the upcoming match — not "can we win" but "we\'re going to win."',
    conditions: [
      {
        type: 'bracket_position',
        bracketPosition: 'lower',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 60,
    cooldownDays: 14,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 8,
      },
      {
        target: 'team_chemistry',
        delta: 3,
      },
      {
        target: 'set_flag',
        flag: 'arc_mod_resilient',
        flagDuration: 21,
      },
    ],
    requiresPlayerTeam: true,
  },

  // 6. rival_eliminated_mixed_feelings — rival eliminated; satisfaction mixed with strange hollowness
  {
    id: 'rival_eliminated_mixed_feelings',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Rivals Out — Mixed Emotions',
    description: 'Word spreads fast: the rival organization is out of the tournament. For some of your players it\'s pure satisfaction. For others there\'s a strange hollowness — they wanted to be the ones to do it, or they realize the rivalry had been sharpening their focus all along.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'rivalry_scorched_earth',
      },
      {
        type: 'team_win_streak',
        streakLength: 1,
      },
    ],
    probability: 50,
    cooldownDays: 30,
    effects: [
      {
        target: 'player_morale',
        effectPlayerSelector: 'all_team',
        delta: 5,
      },
      {
        target: 'set_flag',
        flag: 'rival_eliminated_this_tournament',
        flagDuration: 30,
      },
    ],
    requiresPlayerTeam: true,
  },

  {
    id: 'arc_resilience_forged',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Resilience Forged Under Fire',
    description: '{playerName} was in a fragile headspace, and this was an elimination match. They could have cracked. They didn\'t. Something hardened in them today.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_mod_fragile_{playerId}',
        playerSelector: 'condition_match'
      },
      {
        type: 'elimination_risk',
      },
      {
        type: 'team_win_streak',
        streakLength: 1,
      },
    ],
    probability: 65,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_mod_resilient_{playerId}',
        flagDuration: 21,
      },
      {
        target: 'clear_flag',
        flag: 'arc_mod_fragile_{playerId}',
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 15,
      },
    ],
  },

  {
    id: 'arc_underdog_awakening',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Underdog Awakening',
    description: '{playerName} has been written off by most of the scene. But these recent wins have reignited something. They\'re not playing with desperation anymore — they\'re playing with defiance.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_fallen_{playerId}',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 55,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_mod_underdog_{playerId}',
        flagDuration: 21,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 10,
      },
    ],
  },

  {
    id: 'arc_clutch_reputation',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Clutch Reputation Established',
    description: '{playerName} keeps showing up in the moments that define matches. It\'s not luck — it\'s a pattern. The team has started looking to them when things are on the line.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_contender_{playerId}',
      },
      {
        type: 'team_win_streak',
        streakLength: 3,
      },
    ],
    probability: 45,
    cooldownDays: 14,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_mod_clutch_{playerId}',
        flagDuration: 21,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 8,
      },
      {
        target: 'team_chemistry',
        delta: 5,
      },
    ],
  },

  {
    id: 'arc_contender_to_fallen',
    category: 'player_ego',
    severity: 'major',
    title: 'Contender Falls',
    description: '{playerName} built real expectations this tournament and now three straight losses have eroded all of it. The team is struggling and so is their standing within it. How you handle this moment will define whether they have a path back.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_contender_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 3,
      },
    ],
    probability: 70,
    cooldownDays: 21,
    choices: [
      {
        id: 'acknowledge_the_fall',
        text: 'Have an honest conversation with them',
        description: 'Acknowledge the slump openly and reset expectations together',
        effects: [
          {
            target: 'clear_flag',
            flag: 'arc_contender_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'arc_fallen_{playerId}',
            flagDuration: 30,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: '{playerName} appreciates the honesty. The standards conversation hurts, but they\'d rather have clarity than be strung along. They\'re not done — they just need to rebuild.',
      },
      {
        id: 'protect_their_confidence',
        text: 'Shield them from the pressure',
        description: 'Keep expectations publicly high — protect their confidence privately',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_fragile_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: 'You hold the public line on their potential. Internally, {playerName} senses the gap between what\'s being said and what\'s being felt. The pressure hasn\'t disappeared — it\'s just been postponed.',
      },
      {
        id: 'redistribute_burden',
        text: 'Redistribute the team burden',
        description: 'Take pressure off by elevating other players\' roles',
        effects: [
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -8,
          },
          {
            target: 'clear_flag',
            flag: 'arc_contender_{playerId}',
          },
        ],
        outcomeText: 'The team responds well to the restructure. {playerName} feels demoted even if nothing official has changed. The team is more balanced, but something personal has shifted for them.',
      },
    ],
  },

  {
    id: 'arc_prodigy_overexposure',
    category: 'player_ego',
    severity: 'minor',
    title: 'Prodigy Overexposure',
    description: '{playerName} has been the story all tournament. But losses have a way of flipping narratives fast. The same media building them up is now picking apart every round. The weight of expectation is showing.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_prodigy_{playerId}',
      },
      {
        type: 'team_loss_streak',
        streakLength: 1,
      },
      {
        type: 'player_morale_below',
        threshold: 60,
        playerSelector: 'any',
      },
    ],
    probability: 50,
    cooldownDays: 10,
    effects: [
      {
        target: 'set_flag',
        flag: 'arc_mod_fragile_{playerId}',
        flagDuration: 14,
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: -12,
      },
    ],
  },

  {
    id: 'arc_veteran_final_chapter',
    category: 'external_pressure',
    severity: 'major',
    title: 'Veteran\'s Final Chapter',
    description: '{playerName} is still in the upper bracket, still contending, and everyone knows what this tournament represents for their career. The final chapter framing has taken over the conversation. You need to decide how to position it.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_veteran_legacy_{playerId}',
      },
      {
        type: 'bracket_position',
        bracketPosition: 'upper',
      },
    ],
    probability: 65,
    cooldownDays: 21,
    oncePerSeason: true,
    choices: [
      {
        id: 'lean_into_legacy',
        text: 'Lean into the legacy narrative',
        description: 'Embrace the final chapter framing publicly',
        effects: [
          {
            target: 'set_flag',
            flag: 'interview_veteran_legacy_hinted',
            flagDuration: 30,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
        ],
        outcomeText: '{playerName} steps into the narrative with full conviction. The fanbase responds with intensity — but some teammates feel they\'re playing in someone else\'s story now. The energy is electric and fragile in equal measure.',
      },
      {
        id: 'redirect_to_team',
        text: 'Redirect the story to the team',
        description: 'Deflect individual narrative, emphasize collective goal',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -3,
          },
        ],
        outcomeText: '{playerName} publicly frames the tournament as a team mission. They carry that unsaid private weight themselves. The team bonds over the shared goal, and the legacy narrative recedes — for now.',
      },
      {
        id: 'let_it_unfold',
        text: 'Let it unfold naturally',
        description: 'Don\'t position anything — just compete',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_momentum_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} plays without declared intent. The performances will say what words won\'t. There\'s something freeing about it — and dangerously compelling to watch.',
      },
    ],
  },

  {
    id: 'arc_identity_clarification',
    category: 'breakthrough',
    severity: 'minor',
    title: 'Identity Clarified',
    description: '{playerName} has found their footing. The stretch of uncertainty is ending — their role on the team is clearer, their confidence is returning, and you can see it in how they move in practice.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_identity_{playerId}',
      },
      {
        type: 'team_win_streak',
        streakLength: 2,
      },
    ],
    probability: 65,
    cooldownDays: 14,
    effects: [
      {
        target: 'clear_flag',
        flag: 'arc_identity_{playerId}',
      },
      {
        target: 'player_morale',
        effectPlayerSelector: 'triggering',
        delta: 15,
      },
      {
        target: 'team_chemistry',
        delta: 5,
      },
    ],
  },

  // ==========================================================================
  // ARC SYSTEM — RESOLUTION EVENTS (5 events)
  // Major events with meaningful choices that close or transform arcs.
  // ==========================================================================

  {
    id: 'arc_redemption_moment',
    category: 'breakthrough',
    severity: 'major',
    title: 'Redemption Within Reach',
    description: '{playerName} has built real momentum through this tournament while carrying a redemption narrative. They\'re in the upper bracket, performing at their best, and the moment to close the story is close. They come to you privately: do they own the arc, or keep their head down?',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_redemption_{playerId}',
      },
      {
        type: 'flag_active',
        flag: 'arc_mod_momentum_{playerId}',
      },
      {
        type: 'bracket_position',
        bracketPosition: 'upper',
      },
    ],
    probability: 75,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'claim_the_arc',
        text: 'Tell them to own it',
        description: 'Encourage them to publicly claim the redemption moment',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 12,
          },
          {
            target: 'clear_flag',
            flag: 'arc_redemption_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'arc_contender_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: '{playerName} steps forward with the conviction that something real has changed. The fanbase and media pick it up immediately. The redemption arc closes — and a contender arc opens. The story is just getting interesting.',
      },
      {
        id: 'stay_humble',
        text: 'Tell them to stay quiet and keep performing',
        description: 'The work speaks — don\'t let the narrative distract',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_resilient_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: '{playerName} keeps their head down. The arc doesn\'t get its public moment — but their teammates respect the quiet conviction. Something is being built here that\'s more durable than a media narrative.',
      },
      {
        id: 'credit_the_team',
        text: 'Redirect — frame it as a team triumph',
        description: 'Deflect the personal narrative onto collective achievement',
        effects: [
          {
            target: 'team_chemistry',
            delta: 10,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'all',
            delta: 4,
          },
        ],
        outcomeText: '{playerName} channels their redemption energy into team pride. It\'s generous — maybe too generous. The arc doesn\'t close cleanly. Something personal is left unresolved, but the team is stronger for their selflessness.',
      },
    ],
  },

  {
    id: 'arc_contender_championship_test',
    category: 'breakthrough',
    severity: 'major',
    title: 'Contender\'s Championship Test',
    description: '{playerName} has a clutch reputation and they\'re in the grand final. Every contender arc builds to a moment like this. The question isn\'t whether they belong here — it\'s whether they can finish it.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_contender_{playerId}',
      },
      {
        type: 'flag_active',
        flag: 'arc_mod_clutch_{playerId}',
      },
      {
        type: 'bracket_position',
        bracketPosition: 'upper',
      },
    ],
    probability: 80,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'embrace_the_moment',
        text: 'Tell them this is what they\'ve been built for',
        description: 'Full confidence — put the weight of the moment on their shoulders',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_momentum_{playerId}',
            flagDuration: 14,
          },
        ],
        outcomeText: '{playerName} takes the weight with both hands. You can see it in warm-up — they\'re locked in like never before. Win or lose, they\'re going to make this moment count.',
      },
      {
        id: 'distribute_the_pressure',
        text: 'Tell them it\'s a team effort — don\'t carry it alone',
        description: 'Lower individual stakes to keep them clear-headed',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
        ],
        outcomeText: 'You ease the individual burden. {playerName} plays free — and that freedom transfers through the whole team. The contender arc won\'t get its singular heroic moment, but the performance might be even better for it.',
      },
      {
        id: 'acknowledge_the_stakes',
        text: 'Be honest — this is the moment that defines the arc',
        description: 'Name what this match means clearly and trust them to handle it',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'interview_veteran_legacy_hinted',
            flagDuration: 21,
          },
          {
            target: 'team_chemistry',
            delta: 3,
          },
        ],
        outcomeText: 'The conversation is direct and serious. {playerName} thanks you for not softening it. They walk into warm-up with clear eyes — and the weight of every match they\'ve played to get here sitting visibly on their shoulders.',
      },
    ],
  },

  {
    id: 'arc_fallen_pivot',
    category: 'player_ego',
    severity: 'major',
    title: 'Fallen Star at a Crossroads',
    description: '{playerName} fought back from being written off and has built real resilience through this run. Now they\'re at a decision point: reinvent their identity on this team or consider whether a change of scenery is what they actually need.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_fallen_{playerId}',
      },
      {
        type: 'flag_active',
        flag: 'arc_mod_resilient_{playerId}',
      },
    ],
    probability: 70,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'reinvent_role',
        text: 'Build a new role for them here',
        description: 'Work together to define a new identity within the team',
        effects: [
          {
            target: 'clear_flag',
            flag: 'arc_fallen_{playerId}',
          },
          {
            target: 'clear_flag',
            flag: 'arc_mod_resilient_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'arc_identity_{playerId}',
            flagDuration: 30,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 10,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
        ],
        outcomeText: '{playerName} commits to the rebuild. It\'s not the version of themselves they imagined — but it\'s real, and it\'s theirs. The team has a player who chose to stay and fight for something. That matters.',
      },
      {
        id: 'explore_options',
        text: 'Acknowledge they might need a fresh start',
        description: 'Open the conversation about a move elsewhere',
        effects: [
          {
            target: 'set_flag',
            flag: 'poaching_decision_pending_{playerId}',
            flagDuration: 21,
          },
          {
            target: 'team_chemistry',
            delta: -8,
          },
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
        ],
        outcomeText: 'The conversation is respectful and honest. {playerName} doesn\'t feel pushed out — they feel seen. But the rest of the team senses something shifted. The uncertainty is real now.',
      },
      {
        id: 'challenge_them_to_prove_it',
        text: 'Challenge them — prove they belong here',
        description: 'Raise the competitive standard rather than managing around it',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: -5,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_underdog_{playerId}',
            flagDuration: 21,
          },
        ],
        outcomeText: 'The challenge stings. {playerName} is quiet in the days that follow — but practice intensity picks up. Something in them has decided to answer instead of walk away.',
      },
    ],
  },

  {
    id: 'arc_prodigy_breakout',
    category: 'breakthrough',
    severity: 'major',
    title: 'Prodigy Breakout Moment',
    description: '{playerName} has strung together three straight wins while carrying a prodigy arc. The scene is watching closely. This is the moment where the narrative either crystallizes into something real or starts to fracture under scrutiny.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_prodigy_{playerId}',
      },
      {
        type: 'team_win_streak',
        streakLength: 3,
      },
    ],
    probability: 65,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'own_the_spotlight',
        text: 'Tell them to embrace the moment',
        description: 'Full send — let them step into the spotlight they\'ve earned',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'set_flag',
            flag: 'arc_mod_momentum_{playerId}',
            flagDuration: 21,
          },
          {
            target: 'team_chemistry',
            delta: -5,
          },
          {
            target: 'clear_flag',
            flag: 'arc_prodigy_{playerId}',
          },
          {
            target: 'set_flag',
            flag: 'arc_contender_{playerId}',
            flagDuration: 45,
          },
        ],
        outcomeText: '{playerName} steps forward and the room shifts around them. They\'ve crossed the threshold from prodigy to contender. Some teammates feel the change immediately. The prodigy arc is over — something bigger has started.',
      },
      {
        id: 'stay_hungry',
        text: 'Tell them the work isn\'t finished',
        description: 'Keep them locked in — the prodigy phase isn\'t over yet',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'player_stat',
            stat: 'mental',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
        ],
        outcomeText: '{playerName} takes the advice seriously. No celebration, no grand declaration. The prodigy arc extends — deepening rather than resolving. There\'s something more dangerous being built here.',
      },
      {
        id: 'protect_from_overexposure',
        text: 'Limit their media exposure — protect the development',
        description: 'Shield them from the hype cycle and keep the focus on performance',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'clear_flag',
            flag: 'prodigy_hype_{playerId}',
          },
          {
            target: 'player_stat',
            stat: 'mechanics',
            effectPlayerSelector: 'triggering',
            delta: 3,
          },
        ],
        outcomeText: 'You run interference on the media cycle. {playerName} notices the protection and focuses entirely on the game. The hype fades slightly — and they quietly get better because of it.',
      },
    ],
  },

  {
    id: 'arc_veteran_legacy_decision',
    category: 'external_pressure',
    severity: 'major',
    title: 'The Legacy Decision',
    description: '{playerName} has been riding a momentum wave through this tournament while carrying the weight of everything their career has built. Win or lose, conversations about next season are coming. They want to have the real one with you now.',
    conditions: [
      {
        type: 'flag_active',
        flag: 'arc_veteran_legacy_{playerId}',
      },
      {
        type: 'flag_active',
        flag: 'arc_mod_momentum_{playerId}',
      },
    ],
    probability: 75,
    cooldownDays: 30,
    oncePerSeason: true,
    choices: [
      {
        id: 'commit_to_one_more_year',
        text: 'Commit to extending the journey together',
        description: 'Tell them you want them back and the chapter isn\'t finished',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 15,
          },
          {
            target: 'team_chemistry',
            delta: 5,
          },
          {
            target: 'set_flag',
            flag: 'veteran_championship_pact',
            flagDuration: 90,
          },
        ],
        outcomeText: 'The room feels different after the conversation. {playerName} carries themselves with renewed purpose — not desperation, conviction. The rest of the team picks up on it. This chapter isn\'t over.',
      },
      {
        id: 'honor_their_decision',
        text: 'Let them decide on their own terms',
        description: 'Give them full autonomy over the legacy question',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 8,
          },
          {
            target: 'team_chemistry',
            delta: -3,
          },
          {
            target: 'set_flag',
            flag: 'poaching_decision_pending_{playerId}',
            flagDuration: 30,
          },
        ],
        outcomeText: 'You tell {playerName} the decision belongs to them entirely. They appreciate the respect. The rest of the team doesn\'t know what was discussed — and that ambiguity has a weight of its own.',
      },
      {
        id: 'make_it_about_the_team',
        text: 'Redirect the conversation to this tournament first',
        description: 'Table the legacy talk — focus on winning now',
        effects: [
          {
            target: 'player_morale',
            effectPlayerSelector: 'triggering',
            delta: 5,
          },
          {
            target: 'team_chemistry',
            delta: 8,
          },
          {
            target: 'set_flag',
            flag: 'interview_lower_bracket_narrative',
            flagDuration: 21,
          },
        ],
        outcomeText: 'You close the future conversation and bring everything back to now. {playerName} respects the discipline. For the next few matches, the legacy question goes quiet — and both of you feel lighter for it.',
      },
    ],
  },

];
