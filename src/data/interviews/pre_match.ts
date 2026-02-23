import type { InterviewTemplate } from '../../types/interview';

export const PRE_MATCH_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // PRE_MATCH (5 templates)
  // ==========================================================================

  {
    id: 'pre_standard',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "How are you feeling heading into today's match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're ready to win",
        quote: "We've put in the work. The team is sharp and we know exactly what we need to do. Expect a strong showing from us today.",
        effects: { hype: 3, morale: 2, rivalryDelta: 1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Take it one game at a time',
        quote: "It's going to be a tough match. We respect our opponents and we're just focused on executing our game plan.",
        effects: { morale: 1, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let's see what happens",
        quote: "We'll let our play speak for itself. No predictions from me — just going to head in and compete.",
        effects: {},
      },
    ],
  },

  {
    id: 'pre_playoff',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'pre_playoff',
    prompt: 'This is a playoff match — how does the pressure feel different?',
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We thrive under pressure',
        quote: "Playoffs are what you grind all season for. We're ready. Every player on this roster has worked toward this moment.",
        effects: { hype: 5, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Staying grounded',
        quote: "We're not changing anything. Same preparation, same mindset. It's just another match — we have to believe that.",
        effects: { morale: 2, sponsorTrust: 2 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We're hunting a title",
        quote: "We didn't come here to make up the numbers. We're going deep in this tournament and I'm not entertaining any other outcome.",
        effects: { hype: 6, morale: 3, rivalryDelta: 2, dramaChance: 10 },
      },
    ],
  },

  {
    id: 'pre_rival',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'rivalry_active',
    prompt: "You're facing a team you have history with. What does this match mean to you?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: 'We have a score to settle',
        quote: "They know what they did. We haven't forgotten and we're going to remind them of that today on the server.",
        effects: { hype: 6, rivalryDelta: 8, morale: 3, dramaChance: 15, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 14 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Respect the rivalry',
        quote: "It's always a great match when we play these guys. The history between our teams pushes both sides to bring their absolute best.",
        effects: { fanbase: 2, hype: 3, rivalryDelta: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Just another opponent',
        quote: "Every team gets the same preparation from us. We're not going to let any narrative distract from our process.",
        effects: { morale: 1 },
      },
    ],
  },

  {
    id: 'pre_losing_streak',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'loss_streak_2plus',
    prompt: "The team has been struggling lately. How do you respond to concerns about your direction?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'I take responsibility',
        quote: "The results haven't been good enough. That starts with me. I'm re-evaluating our preparation and I take full accountability.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: -1, dramaChance: 5 },
      },
      {
        tone: 'CONFIDENT',
        label: 'The turnaround starts today',
        quote: "We're not going to let a rough patch define us. I believe in this roster and today is where we start showing everyone why.",
        effects: { hype: 3, morale: 4 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Trust the process',
        quote: "Results fluctuate. What matters is how we respond. We've identified the issues and we're working through them.",
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'pre_win_streak',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'win_streak_2plus',
    prompt: "The team is on a roll. Is there any danger of complacency creeping in?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Staying hungry',
        quote: "We're proud of the form we're in, but we're not celebrating anything yet. The moment you get comfortable is when things slip.",
        effects: { morale: 2, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "We're just getting started",
        quote: "Complacency? This team doesn't know the word. We're locked in and we want more. The best is still ahead of us.",
        effects: { hype: 5, morale: 3, fanbase: 2 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'The streak keeps going',
        quote: "We're not stopping here. Every team in this league should be watching us carefully right now.",
        effects: { hype: 6, rivalryDelta: 2, dramaChance: 8 },
      },
    ],
  },


  // ==========================================================================
  // COACH — PRE_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'pre_coach_standard',
    context: 'PRE_MATCH',
    subjectType: 'coach',
    condition: 'always',
    prompt: "Your team is about to play. What tactical adjustments are you emphasizing heading into this match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've drilled this all week",
        quote: "We identified their tendencies and we've prepared counters for all of them. The players know exactly what to do. I'm expecting a clean performance.",
        effects: { morale: 2, hype: 2, sponsorTrust: 1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Adapting in real time',
        quote: "Every opponent forces you to think on your feet. We have a solid game plan but we're ready to adjust as the match develops.",
        effects: { morale: 1, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "That's for us to know",
        quote: "I'm not giving anything away before the match. What I'll say is the team is prepared and we'll be ready for whatever comes.",
        effects: {},
      },
    ],
  },

  {
    id: 'pre_coach_rival',
    context: 'PRE_MATCH',
    subjectType: 'coach',
    condition: 'rivalry_active',
    prompt: "This is a rematch against a familiar opponent. How does your preparation differ for a team you know this well?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: 'We know every habit they have',
        quote: "Playing a team multiple times means you have their playbook memorized. We know their tendencies better than they might realize.",
        effects: { hype: 3, morale: 2, rivalryDelta: 3 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Familiar opponents keep you sharp',
        quote: "Rematches are always interesting — both sides know each other, so the adjustments matter even more. We've put in the extra work.",
        effects: { morale: 2, fanbase: 1, rivalryDelta: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'We focus on ourselves',
        quote: "Honestly, we spend most of our prep time on what we can control. We have our system and we trust it regardless of the opponent.",
        effects: { morale: 1 },
      },
    ],
  },


  // ==========================================================================
  // PLAYER — PRE_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'pre_player_standard',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'always',
    prompt: "How are you personally feeling heading into today's match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I'm locked in",
        quote: "Honestly, I feel great. My mechanics have been sharp in practice and I'm just looking forward to getting out there and competing.",
        effects: { morale: 3, hype: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Focused and ready',
        quote: "I've been doing my preparation and I'm in a good headspace. You don't want to get too hyped up — just stay grounded and play your game.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let the match speak for me",
        quote: "I'll show you how I'm feeling when the server goes live. No point in talking about it — just want to play.",
        effects: { hype: 1 },
      },
    ],
  },

  {
    id: 'pre_player_streak',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'win_streak_2plus',
    prompt: "You've been in incredible form lately. How do you stay focused when things are going this well?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Take it one match at a time',
        quote: "Streaks can mess with your head if you let them. I just try to focus on the next map, the next round. That's all I can control.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "I'm in my bag right now",
        quote: "I won't pretend otherwise — I feel really confident right now. Everything is clicking and I want to keep that momentum going.",
        effects: { morale: 3, hype: 4, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Team is playing great',
        quote: "It's not just me — everyone is playing well and it makes everything easier. When the team is rolling, individual stats follow.",
        effects: { morale: 2, fanbase: 1 },
      },
    ],
  },

];
