import type { InterviewTemplate } from '../../types/interview';

export const SCRIM_SHARING_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // SCRIM SHARING SCANDAL ARC (5 templates)
  // ==========================================================================

  {
    id: 'crisis_scrim_leak_public',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'scrim_accuse_public' }],
    prompt: "You've gone on record claiming your scrim footage was shared with an opponent. That's a serious accusation — what's your evidence?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Stand firm on the evidence',
        quote: "We have timestamps, VOD clips, and a timeline that no one has been able to explain away. I'm not walking this back. We're waiting for a response.",
        effects: {
          hype: 5,
          setsFlags: [{ key: 'interview_scrim_double_down', durationDays: 14 }],
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Walk it back slightly',
        quote: "Look, we're concerned about what we observed. We're not pointing fingers at anyone specifically — we just want answers from the league.",
        effects: {
          morale: -3,
          sponsorTrust: 3,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Call for systemic reform',
        quote: "This isn't just about us. If scrim footage is being weaponized across this scene, the entire competitive ecosystem suffers. We're asking for clearer standards for everyone.",
        effects: {
          hype: 5,
          fanbase: 4,
          setsFlags: [{ key: 'interview_scrim_reform_call', durationDays: 21 }],
        },
      },
    ],
  },

  {
    id: 'pre_match_scrim_controversy',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [
      {
        type: 'or',
        anyOf: [
          { type: 'flag_active', flag: 'scrim_accuse_public' },
          { type: 'flag_active', flag: 'scrim_accused_active' },
        ],
      },
    ],
    prompt: "There are allegations circulating about scrim VOD leaks. How is the team staying focused heading into this match?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Tunnel vision on the match',
        quote: "We've put all of that outside noise behind us. When we walk into the server, none of that matters. We're here to compete.",
        effects: { morale: 3 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Acknowledge the noise',
        quote: "It's been a distracting week, I won't pretend otherwise. But this team is resilient. We've had harder conversations than the ones happening on Twitter.",
        effects: { hype: 2, morale: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Use it as fuel',
        quote: "Honestly? The controversy has made this team angrier and more focused than I've seen them in months. Watch what we do today.",
        effects: { morale: 5, hype: 4, dramaChance: 10 },
      },
    ],
  },

  {
    id: 'pre_match_intel_burden',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'scrim_intel_accepted' }],
    prompt: "Your scouting report on this opponent has been unusually detailed. Where are you getting your reads on them?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Credit your analysts',
        quote: "We have an excellent analysis team. They've done an incredible job breaking down every public VOD available. That's what you're seeing.",
        effects: { sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Stay vague about sources',
        quote: "We do our homework. I'm not going to share our process with anyone who might be watching.",
        effects: { morale: -2, dramaChance: 8 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Confident but careful',
        quote: "We've put in the preparation. This team knows what they're walking into today and we're ready for whatever comes.",
        effects: { morale: 2, hype: 1 },
      },
    ],
  },

  {
    id: 'pre_match_principled_stance',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'scrim_intel_declined' }],
    prompt: "There are stories going around about prep shortcuts in this circuit. Where do you personally draw the line?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Draw the line clearly',
        quote: "The line is the same for everyone — you prepare with what you earn. VODs your team played in, film your staff breaks down, knowledge you build. Anything else is a shortcut that eventually costs you more than it gives.",
        effects: {
          morale: 5,
          sponsorTrust: 3,
          setsFlags: [{ key: 'interview_scrim_principled', durationDays: 21 }],
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Stay vague',
        quote: "Every org has their own standards. I can only speak to what we do here.",
        effects: { morale: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'Call out the culture',
        quote: "Let's be honest about what's happening in this scene. The gray areas that everyone pretends don't exist — they do exist, and they hurt teams that actually respect the rules.",
        effects: {
          hype: 6,
          sponsorTrust: -4,
          dramaChance: 15,
          setsFlags: [{ key: 'interview_scrim_called_out_culture', durationDays: 14 }],
        },
      },
    ],
  },

  {
    id: 'crisis_scrim_under_fire',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'scrim_deny_forceful' }],
    prompt: "You've denied these allegations strongly. But the rival coach says they have screenshots. What happens if they're right?",
    options: [
      {
        tone: 'CONFIDENT',
        label: '"They\'re not right"',
        quote: "They're not right. I'm not preparing a contingency answer for something that didn't happen. Show the screenshots or stop talking.",
        effects: {
          hype: 4,
          morale: 3,
          sponsorTrust: -3,
          setsFlags: [{ key: 'interview_scrim_double_down', durationDays: 14 }],
        },
      },
      {
        tone: 'AGGRESSIVE',
        label: '"Then show us"',
        quote: "If they have screenshots, this conversation ends immediately — put them out. Every day they wait is a day the community should be asking why they're still sitting on them.",
        effects: {
          hype: 6,
          dramaChance: 20,
        },
      },
      {
        tone: 'HUMBLE',
        label: '"Let Riot decide"',
        quote: "We've told our side. We're going to let Riot review whatever evidence is presented. That's the process. I trust the process.",
        effects: {
          sponsorTrust: 4,
          morale: -2,
        },
      },
    ],
  },
];
