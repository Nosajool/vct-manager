import type { InterviewTemplate } from '../../types/interview';

export const VISA_ARC_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // VISA DRAMA ARC (6 templates)
  // ==========================================================================

  {
    id: 'crisis_visa_admin_response',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'visa_delay_active',
    requiresActiveFlag: 'visa_delayed_{playerId}',
    prompt: "Fans are questioning your team's preparation. How did this visa situation happen?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Blame bureaucracy',
        quote: "International esports travel has unpredictable bureaucracy. We followed every process correctly — some things are simply outside our control.",
        effects: {
          hype: -2,
          setsFlags: [{ key: 'interview_deflected_visa_blame', durationDays: 14 }],
        },
      },
      {
        tone: 'BLAME_SELF',
        label: 'Accept full responsibility',
        quote: "Our org failed to anticipate this. We should have had contingency plans in place months ago. We take full responsibility for this outcome.",
        effects: {
          sponsorTrust: -5,
          fanbase: 5,
          setsFlags: [{ key: 'interview_admitted_admin_failure', durationDays: 21 }],
        },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'Redirect to performance',
        quote: "We're focused on competing with the players we have here. The team is ready. That's the story.",
        effects: {
          morale: 3,
          hype: 2,
          setsFlags: [{ key: 'interview_redirected_visa_focus', durationDays: 14 }],
        },
      },
    ],
  },

  {
    id: 'pre_substitute_lineup_start',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'always',
    requiresActiveFlag: 'substitute_taking_over',
    prompt: "Your substitute is stepping in for a tournament match. What's your message to them?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "It's their moment",
        quote: "They've trained for this exact moment. I have full confidence in them — go out there and show the world what you can do.",
        effects: { morale: 5 },
      },
      {
        tone: 'HUMBLE',
        label: 'Acknowledge the ask',
        quote: "It's a massive ask on short notice, but we believe in them completely. The team has their back.",
        effects: { hype: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Stay professional',
        quote: "We prepare every player to be ready. Next question.",
        effects: { morale: -2 },
      },
    ],
  },

  {
    id: 'post_sub_win_depth_shown',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    matchOutcome: 'win',
    requiresActiveFlag: 'substitute_taking_over',
    prompt: "The substitute lineup just won. What does this say about your roster depth?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'System vindicated',
        quote: "This is proof of the system we've built. Every player on this roster is ready to compete at the highest level. Tonight showed that.",
        effects: {
          fanbase: 5,
          setsFlags: [{ key: 'interview_praised_sub_depth', durationDays: 14 }],
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Good sign, not conclusion',
        quote: "One win doesn't define depth. But it's a great sign of what this team is capable of when adversity hits.",
        effects: { sponsorTrust: 3 },
      },
      {
        tone: 'BLAME_TEAM',
        label: 'Stay measured',
        quote: "We'll see — let's not get ahead of ourselves. There's more to prove before I'll start talking about depth.",
        effects: { morale: -3 },
      },
    ],
  },

  {
    id: 'post_sub_loss_pressure_mounts',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    matchOutcome: 'loss',
    requiresActiveFlag: 'substitute_taking_over',
    prompt: "You're playing without your main roster. Is the team holding together?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Keep moving',
        quote: "The situation is what it is. We keep moving. No excuses.",
        effects: { morale: -2 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'Own the outcome',
        quote: "I have to take responsibility for the roster we're fielding right now. That's on me.",
        effects: { sponsorTrust: -5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Character test',
        quote: "These moments test character. We'll find out what we're made of — and I believe this group has what it takes.",
        effects: { morale: 3 },
      },
    ],
  },

  {
    id: 'crisis_player_watches_sidelines',
    context: 'CRISIS',
    subjectType: 'player',
    condition: 'visa_delay_active',
    requiresActiveFlag: 'visa_delayed_{playerId}',
    prompt: "You're watching your team compete without you. How are you handling this?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Stay focused on resolution',
        quote: "I'm just focused on getting everything resolved so I can be back with my team. That's all I can control right now.",
        effects: { morale: 3 },
        personalityWeights: {
          STABLE: 2,
          INTROVERT: 2,
          TEAM_FIRST: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Support from the sidelines',
        quote: "It's tough, but my teammates are out there fighting for all of us. I couldn't be more proud of what they're doing.",
        effects: {
          morale: -3,
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
        tone: 'AGGRESSIVE',
        label: "This situation is unacceptable",
        quote: "I should be out there. This is my team, my tournament. This situation is unacceptable and I want everyone to know that.",
        effects: {
          morale: 5,
          sponsorTrust: -3,
          setsFlags: [{ key: 'interview_player_frustrated_visa', durationDays: 14 }],
        },
        personalityWeights: {
          FAME_SEEKER: 2,
          BIG_STAGE: 2,
          INTROVERT: 0,
          TEAM_FIRST: 0,
          STABLE: 0,
        },
      },
    ],
  },

  {
    id: 'post_main_player_returns',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    matchOutcome: 'any',
    requiresActiveFlag: 'visa_player_returned_{playerId}',
    prompt: "Your player is back after missing tournament time. What does their return mean for the team?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Back to full strength',
        quote: "We're back to full strength. No excuses now — this team is ready to show what we can really do.",
        effects: { morale: 5, hype: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Everyone earned respect',
        quote: "Having them back is huge, but I want to be clear — the substitute earned the respect of everyone in that locker room. This is a stronger team now.",
        effects: { morale: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Glad to have options',
        quote: "We're just glad to have everyone available and healthy. More options is always good.",
        effects: { fanbase: 2 },
      },
    ],
  },

];
