import type { InterviewTemplate } from '../../types/interview';

export const GENERAL_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // GENERAL — MANAGER (4 templates)
  // ==========================================================================

  {
    id: 'general_practice_culture',
    context: 'GENERAL',
    subjectType: 'manager',
    prompt: "We hear your team puts in long practice hours. How do you balance intensity with player well-being off the server?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Intensity breeds excellence',
        quote: "Elite performance doesn't happen by accident. We work hard, yes — but every hour has a purpose. Our players understand that dedication now means results later.",
        effects: { hype: 2, morale: -1, sponsorTrust: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'We listen to the players',
        quote: "Sustainable success means taking care of the people doing the work. We monitor load carefully and the players have real input on how we structure our days.",
        effects: { morale: 3, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'It varies week to week',
        quote: "There's no single formula. Some weeks we push hard, some weeks we pull back. It depends on where we are in the calendar and what the team needs.",
        effects: { morale: 1, dramaChance: 5 },
      },
    ],
  },

  {
    id: 'general_mid_season_goals',
    context: 'GENERAL',
    subjectType: 'manager',
    prompt: "Midway through the season, how would you grade the team's performance against your pre-season goals?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're tracking where we need to be",
        quote: "Honestly? I feel good about where we are. The results we've built have put us in a position to compete for what we came here to win.",
        effects: { hype: 3, fanbase: 2, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Some things we got right, some we need to fix',
        quote: "We've had highs and lows. The honest assessment is that we've grown in areas I hoped we would, but there are clear things we need to sharpen up before the stretch run.",
        effects: { fanbase: 2, sponsorTrust: 1, dramaChance: 5 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We're raising our own bar",
        quote: "The goals we set in January weren't good enough. We've reset them. This team has more potential than I originally calculated and we're going to push it.",
        effects: { hype: 4, morale: 1, dramaChance: 8 },
      },
    ],
  },

  {
    id: 'general_roster_chemistry',
    context: 'GENERAL',
    subjectType: 'manager',
    conditions: [{ type: 'team_chemistry_above', threshold: 70 }],
    prompt: "The cohesion in your lineup has been noticeable. What's behind the chemistry you've built?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'It took real time and investment',
        quote: "Chemistry isn't something you buy or manufacture. We spent months building trust — in practice, in team environments, in the conversations nobody sees. It shows now because of that work.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: 'We made the right roster calls',
        quote: "The pieces fit because we were deliberate about who we brought in. When you recruit for character alongside skill, this is what you get.",
        effects: { hype: 3, sponsorTrust: 2, morale: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'The players deserve credit',
        quote: "I can put structure around it but ultimately chemistry comes from the players choosing to invest in each other. That's on them and I'm proud of how they've shown up.",
        effects: { morale: 4, fanbase: 3 },
      },
    ],
  },

  {
    id: 'general_team_identity',
    context: 'GENERAL',
    subjectType: 'manager',
    prompt: "How would you describe the identity of this team — the way you want people to talk about you by the end of the year?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Relentless and hard to beat',
        quote: "I want people to say that facing us is exhausting — that we never let up, never get rattled, and always find a way. That's the standard we're building toward.",
        effects: { hype: 3, morale: 2, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Thoughtful and adaptable',
        quote: "I want people to see a team that doesn't rely on one trick or one carry. We read the game and adjust. That's harder to build, but it's also harder to shut down.",
        effects: { sponsorTrust: 2, fanbase: 2, morale: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'The team nobody wanted to face',
        quote: "At the end of this year, I want every opponent to dread drawing us in bracket. Not because we're flashy — because we're a problem. That's what we're building.",
        effects: { hype: 4, rivalryDelta: 5, morale: 2, dramaChance: 5 },
      },
    ],
  },

  // ==========================================================================
  // GENERAL — PLAYER (3 templates)
  // ==========================================================================

  {
    id: 'general_player_growth',
    context: 'GENERAL',
    subjectType: 'player',
    prompt: "You've been with this organization for a while now. What's the biggest way you've grown as a competitor?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'My mental game has matured',
        quote: "Mechanically I've always been solid. But learning to stay even in tough moments — not spiking emotionally when things go wrong — that's been the real evolution.",
        effects: { morale: 3, fanbase: 2, hype: 1 },
        personalityWeights: { Methodical: 2, Stoic: 2, Volatile: 0 },
      },
      {
        tone: 'CONFIDENT',
        label: 'My role clarity is better than ever',
        quote: "I know exactly who I am in this team now. Early on I was trying to do everything. Now I focus on what I'm best at and I do it at a high level consistently.",
        effects: { hype: 3, morale: 2 },
        personalityWeights: { Methodical: 2, Stoic: 1, Charismatic: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "I've learned to lead in-game",
        quote: "I take more ownership now. If something's not working mid-round, I'm calling it out and pushing for the adjustment. That leadership piece has opened up a new level for me.",
        effects: { hype: 2, morale: 2, dramaChance: 5 },
        personalityWeights: { Volatile: 2, Charismatic: 2, Methodical: 0 },
      },
    ],
  },

  {
    id: 'general_player_travel',
    context: 'GENERAL',
    subjectType: 'player',
    prompt: "The tournament circuit is brutal on travel. How do you keep your performance consistent through the grind?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "You learn what works for you",
        quote: "It's a lot of trial and error. Sleep routines, diet, keeping the same warm-up wherever you are. You develop systems and stick to them even when everything else is chaos.",
        effects: { morale: 2, fanbase: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "It's genuinely exhausting sometimes",
        quote: "I won't pretend it's easy. There are days where the fatigue is real and you just have to compete through it. The team helps — when you're running on empty, you lean on each other.",
        effects: { morale: 2, fanbase: 3, hype: 1 },
        personalityWeights: { Stoic: 0, Volatile: 2, Methodical: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "I thrive in high-stakes environments",
        quote: "Honestly, the bigger the event, the more locked in I get. The travel is noise. When you step on stage and the stakes are real, that sharpens everything.",
        effects: { hype: 3, morale: 3, fanbase: 2 },
        personalityWeights: { Charismatic: 2, Volatile: 1, Stoic: 1 },
      },
    ],
  },

  {
    id: 'general_player_upcoming_hype',
    context: 'GENERAL',
    subjectType: 'player',
    prompt: "There's a lot of excitement around what this team could do in upcoming competition. What has you most fired up heading into the next stretch?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're peaking at the right time",
        quote: "The timing feels right. We've been putting in the work and it's coming together. I genuinely believe we're going to turn some heads in the coming weeks.",
        effects: { hype: 4, morale: 3, fanbase: 2 },
        personalityWeights: { Charismatic: 2, Volatile: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'We have unfinished business',
        quote: "We've had moments this season where we left results on the table. That feeling doesn't go away. It's fuel. We know what we're capable of and we haven't fully shown it yet.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
        personalityWeights: { Methodical: 2, Stoic: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'I just want to compete',
        quote: "I try not to get too caught up in hype cycles. What gets me fired up is the competition itself — solving the game at the highest level with teammates I trust.",
        effects: { morale: 2, fanbase: 1 },
        personalityWeights: { Stoic: 2, Methodical: 1, Charismatic: 0 },
      },
    ],
  },
];
