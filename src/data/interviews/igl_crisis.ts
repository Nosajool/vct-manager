import type { InterviewTemplate } from '../../types/interview';

export const IGL_CRISIS_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // IGL CRISIS ARC (8 templates)
  // ==========================================================================

  {
    id: 'crisis_igl_on_notice',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'igl_on_notice' }],
    prompt: "Internal reports say your IGL is under scrutiny. What's the actual situation?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Nothing unusual',
        quote: "We give feedback to all our players — nothing unusual here. We hold everyone to a high standard.",
        effects: {
          sponsorTrust: 1,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Honest about expectations',
        quote: "We've had direct conversations with them. We expect improvement, and I believe they're capable of delivering it.",
        effects: {
          dramaChance: 5,
        },
      },
      {
        tone: 'CONFIDENT',
        label: 'Full backing',
        quote: "I have full confidence in them. That hasn't changed. They have my complete support.",
        effects: {
          morale: 3,
          setsFlags: [{ key: 'interview_manager_backed_igl', durationDays: 14 }],
        },
      },
    ],
  },

  {
    id: 'crisis_igl_changes_looming',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'igl_replacement_considered' }],
    prompt: "There's speculation you're looking for a new shot-caller. Can you say anything?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Pure speculation',
        quote: "Pure speculation. We're focused on our current roster and what we can build together.",
        effects: {
          hype: -1,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Acknowledge process',
        quote: "We explore everything internally. That's our job. Every org does this — we just don't talk about it publicly.",
        effects: {
          sponsorTrust: 2,
        },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'Results only',
        quote: "The only thing that matters is results on the server. Everything else is noise we don't have time for.",
        effects: {
          morale: 2,
          hype: 1,
        },
      },
    ],
  },

  {
    id: 'post_loss_igl_under_fire',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    conditions: [
      {
        type: 'or',
        anyOf: [
          { type: 'flag_active', flag: 'igl_on_notice' },
          { type: 'flag_active', flag: 'igl_doubles_down' },
        ],
      },
    ],
    prompt: "Another loss. Are these mid-round issues structural, or is this fixable?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Back the IGL',
        quote: "These are solvable problems. We have the right leader to fix them. I'm not going to throw anyone under the bus after one match.",
        effects: {
          morale: 3,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Film room will answer',
        quote: "We're working through some things. The film room will show us the answers — I want to understand it before I speak on it.",
        effects: {
          dramaChance: 5,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Every team faces this',
        quote: "Every team goes through stretches like this. We'll figure it out. That's what pre-season is for.",
        effects: {
          morale: -2,
        },
      },
    ],
  },

  {
    id: 'post_win_igl_silences_critics',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    conditions: [{ type: 'flag_active', flag: 'igl_redemption_path' }],
    prompt: "Your IGL has faced real criticism lately, but the team won today. What changed?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Credit the IGL',
        quote: "They put their head down and adjusted. That's what great leaders do — they don't make excuses, they make changes.",
        effects: {
          morale: 5,
          hype: 3,
          setsFlags: [{ key: 'interview_igl_praised_after_win', durationDays: 14 }],
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Credit the team',
        quote: "The whole team raised their level. Everyone contributed to this win. It was a collective effort.",
        effects: {
          morale: 3,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Step in the right direction',
        quote: "One win doesn't end the conversation, but it's a step in the right direction. We keep working.",
        effects: {
          sponsorTrust: 2,
        },
      },
    ],
  },

  {
    id: 'crisis_leadership_change_explained',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [
      {
        type: 'or',
        anyOf: [
          { type: 'flag_active', flag: 'igl_removed' },
          { type: 'flag_active', flag: 'igl_manually_reassigned' },
        ],
      },
    ],
    prompt: "A new IGL is calling the shots. Why now, and why this player?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: 'Performance-driven',
        quote: "The results weren't there. We made a decision in the team's best interest. That's the job.",
        effects: {
          hype: -2,
          sponsorTrust: 3,
        },
      },
      {
        tone: 'CONFIDENT',
        label: 'Future-focused',
        quote: "This is about what's right for our ceiling, not a criticism of what came before. We're building toward something.",
        effects: {
          morale: 2,
          hype: 2,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Protect the former IGL',
        quote: "This was a mutual conversation. Both players handled it professionally. We're grateful for everything they contributed.",
        effects: {
          sponsorTrust: 3,
          morale: 3,
        },
      },
    ],
  },

  {
    id: 'post_match_shared_calling',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'any',
    conditions: [{ type: 'flag_active', flag: 'shared_calling_enabled' }],
    prompt: "You've moved to a shared shot-calling model. What's the reasoning, and how is it working?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Unlocking creativity',
        quote: "Distributing responsibility unlocks creativity we were bottling up. It's been a positive shift for how we approach rounds.",
        effects: {
          morale: 2,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Work in progress',
        quote: "We needed more voices involved in the process. It's a work in progress, but the intent is right.",
        effects: {
          dramaChance: 3,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Early days',
        quote: "Early days. Ask me again in three matches and I'll have a real answer for you.",
        effects: {
          sponsorTrust: 1,
        },
      },
    ],
  },

  {
    id: 'crisis_leadership_instability',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'leadership_instability' }],
    prompt: "The team looks unsettled since the IGL change. How do you stabilize this?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We get through it together',
        quote: "Change is hard. We're in it, and we'll get through it together. This group has dealt with harder things.",
        effects: {
          morale: 3,
        },
      },
      {
        tone: 'BLAME_SELF',
        label: 'Own the decision',
        quote: "I made this call. If it's not working yet, that's on me to fix. The accountability starts at the top.",
        effects: {
          sponsorTrust: 3,
          dramaChance: 5,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Normal adjustment',
        quote: "The instability people are seeing is the normal adjustment process. Give it time — this will settle.",
        effects: {
          morale: -2,
        },
      },
    ],
  },

  {
    id: 'post_win_igl_redemption_player',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    conditions: [{ type: 'flag_active', flag: 'igl_redemption_achieved' }],
    prompt: "You've been through months of criticism. You just won. What kept you going?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Never doubted myself',
        quote: "I never doubted myself, even when others did. This is why you grind. The work always shows eventually.",
        effects: {
          morale: 5,
          hype: 5,
        },
        personalityWeights: {
          FAME_SEEKER: 2,
          BIG_STAGE: 2,
          TEAM_FIRST: 0,
          STABLE: 1,
          INTROVERT: 0,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Did it for the team',
        quote: "My teammates never wavered in their belief in me. I did it for them. That kept me grounded every single day.",
        effects: {
          morale: 4,
        },
        personalityWeights: {
          TEAM_FIRST: 2,
          STABLE: 1,
          INTROVERT: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Blocked out the noise',
        quote: "I stopped reading the noise a long time ago. Just do the work. The results follow when you stay in the process.",
        effects: {
          morale: 3,
        },
        personalityWeights: {
          STABLE: 2,
          INTROVERT: 2,
          TEAM_FIRST: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
    ],
  },

  {
    id: 'crisis_igl_playing_under_endorsement_pressure',
    context: 'CRISIS',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'igl_backed_by_management' }],
    prompt: "Management has publicly staked their reputation on you as IGL. How do you carry that?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'It fuels me',
        quote: "It fuels me. When people believe in you that loudly, you don't waste it. I'm going to prove every word right.",
        effects: {
          morale: 5,
          hype: 4,
        },
        personalityWeights: {
          FAME_SEEKER: 2,
          BIG_STAGE: 2,
          TEAM_FIRST: 1,
          STABLE: 1,
          INTROVERT: 0,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'I carry it lightly',
        quote: "I carry it lightly. The best way to honor that backing is to keep my head down and lead well — not think about it every round.",
        effects: {
          morale: 4,
          sponsorTrust: 3,
        },
        personalityWeights: {
          STABLE: 2,
          TEAM_FIRST: 2,
          INTROVERT: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I don't think about it",
        quote: "Honestly? I don't think about it. You can't call rounds with that kind of weight on your mind. I just play.",
        effects: {
          morale: 2,
        },
        personalityWeights: {
          INTROVERT: 2,
          STABLE: 1,
          TEAM_FIRST: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
    ],
  },

  {
    id: 'crisis_former_igl_in_coaching_role',
    context: 'CRISIS',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'igl_transitioned_to_coach' }],
    prompt: "You've moved from calling rounds to a strategic assistant role. How are you adjusting to not being the one on the mic?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Different kind of satisfaction',
        quote: "There's a different kind of satisfaction in shaping the game from the outside. When a call I worked on with the team lands perfectly, I feel that.",
        effects: {
          morale: 4,
          setsFlags: [{ key: 'igl_coaching_transition_smooth', durationDays: 30 }],
        },
        personalityWeights: {
          TEAM_FIRST: 2,
          STABLE: 2,
          INTROVERT: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
      {
        tone: 'CONFIDENT',
        label: 'My voice still shapes every round',
        quote: "I'm still in every round — just differently. My reads go into the prep, the vod review, the strat board. The mic changed, the impact didn't.",
        effects: {
          morale: 4,
          hype: 3,
        },
        personalityWeights: {
          FAME_SEEKER: 2,
          BIG_STAGE: 2,
          STABLE: 1,
          TEAM_FIRST: 1,
          INTROVERT: 0,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Still learning',
        quote: "Still learning what this role really means. It's a big shift. I don't have it all figured out yet — and that's okay.",
        effects: {
          morale: -2,
          fanbase: 4,
          dramaChance: 5,
        },
        personalityWeights: {
          INTROVERT: 2,
          STABLE: 1,
          TEAM_FIRST: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
    ],
  },

];
