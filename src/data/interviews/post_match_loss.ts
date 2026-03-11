import type { InterviewTemplate } from '../../types/interview';

export const POST_MATCH_LOSS_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // POST_MATCH — LOSS (4 templates)
  // ==========================================================================

  {
    id: 'post_loss_standard',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    prompt: "Tough loss today. What do you take away from this performance?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'I take responsibility',
        quote: "The preparation wasn't good enough. I'll be looking at myself first. We'll go back to the drawing board and come back stronger.",
        effects: { fanbase: 2, sponsorTrust: 2, morale: -1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'They were the better team today',
        quote: "They executed better than us in the key moments. Credit to them. We'll study this and learn from it.",
        effects: { morale: 1, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'On to the next one',
        quote: "We're not going to dwell on a single result. There are still matches to play and we're focused forward.",
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'post_loss_blame_team',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'loss',
    narrativeCategory: 'player_ego',
    prompt: "That loss was hard to watch. Were you frustrated with how the team performed today?",
    options: [
      {
        tone: 'BLAME_TEAM',
        label: 'Some players need to step up',
        quote: "Honestly? There are moments where I feel like I'm doing my part and others aren't. That needs to change.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 1.5, TEAM_FIRST: 0, INTROVERT: 0, STABLE: 0.5 },
        effects: { morale: -3, dramaChance: 15, setsFlags: [{ key: 'interview_blamed_teammates', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "It's on all of us",
        quote: "We all have to be better. Losses like this happen when the whole team isn't executing, myself included.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 1.5, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 1 },
        effects: { morale: 2, sponsorTrust: 1, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We move on together",
        quote: "It wasn't our day. Pointing fingers doesn't help. We'll get back to work and fix it as a unit.",
        effects: { morale: 1 },
      },
    ],
  },

  {
    id: 'post_loss_close',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    prompt: "It came down to the wire. Painful to lose by such a small margin — what happened?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'Preparation let us down',
        quote: "In close matches, every small edge matters. We left some things on the table today — that's on me to fix.",
        effects: { fanbase: 2, sponsorTrust: 2, morale: -1 },
      },
      {
        tone: 'HUMBLE',
        label: 'We gave everything',
        quote: "The players fought hard. Losing a close one hurts, but I'm not disappointed in the effort. We just need sharper execution.",
        effects: { morale: 2, fanbase: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "We'll get them next time",
        quote: "We were right there. The gap between us is thin and we know it. Next time the result goes our way.",
        effects: { morale: 3, hype: 1, rivalryDelta: 1 },
      },
    ],
  },

  {
    id: 'post_loss_blowout',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    prompt: "That was a heavy loss. How do you keep morale up after a result like this?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'This falls on me',
        quote: "I won't have my players take the heat for today. The game plan failed and that's my responsibility. I'll fix it.",
        effects: { fanbase: 3, sponsorTrust: 1, morale: 2, dramaChance: 5 },
      },
      {
        tone: 'BLAME_TEAM',
        label: "We didn't compete",
        quote: "That wasn't good enough — from anyone. I expect more from this roster and I'll make sure we have that conversation internally.",
        effects: { morale: -4, dramaChance: 20, hype: -2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Reset and rebuild',
        quote: "Bad days happen. What defines a team is the response. We'll take our medicine, learn from this, and come back with something to prove.",
        effects: { morale: 1, fanbase: 1, sponsorTrust: 1 },
      },
    ],
  },

  {
    id: 'post_loss_elimination',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    conditions: [{ type: 'is_playoff_match' }],
    prompt: "That's an elimination. What do you say to your players and fans right now?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Thank you for believing in us',
        quote: "To our fans: thank you. To the players: you gave everything. We fell short but the work we put in this season matters. We'll be back.",
        effects: { fanbase: 4, sponsorTrust: 3, morale: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'I owe the team better',
        quote: "These players deserved better preparation. That's on me. I'll spend the offseason making sure we never feel like this again.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: 1, dramaChance: 8 },
      },
      {
        tone: 'CONFIDENT',
        label: "We'll come back hungrier",
        quote: "This pain is fuel. Remember how this feels. We're going to spend the offseason building something that can go all the way.",
        effects: { hype: 3, morale: 3, fanbase: 2 },
      },
    ],
  },

  {
    id: 'post_loss_clutch_defense',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    prompt: "You were in a 2v2 situation in the deciding round. Some people online are going to question that. What's your response?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "You try it then",
        quote: "I mean what the f*** do you want me to do? We're in a 2 vs 2 against f****** brazilians. Why don't you try it? One of them's bald for god's sake. No shot we win that.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 1.5, STABLE: 0, TEAM_FIRST: 0.5 },
        effects: { hype: 3, morale: -1, fanbase: 1, dramaChance: 15 },
      },
      {
        tone: 'BLAME_SELF',
        label: "I should have found a way",
        quote: "I had a chance to make it happen and I didn't. I'll go back and figure out what I could have done differently. That's on me.",
        personalityWeights: { STABLE: 2, TEAM_FIRST: 2, INTROVERT: 1.5, FAME_SEEKER: 0 },
        effects: { morale: -1, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "The odds were just against us",
        quote: "Those are situations where sometimes you're on the wrong end of the math. We fought every round regardless — we just couldn't convert.",
        effects: { morale: 1 },
      },
    ],
  },

  // post_loss_elimination_message — POST_MATCH, manager, loss
  {
    id: 'post_loss_elimination_message',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    conditions: [{ type: 'is_playoff_match' }],
    prompt: "Any words for the fans after the tournament ends here?",
    options: [
      {
        tone: 'HUMBLE',
        label: "We don't care — we'll only improve",
        quote: "I know people are happy we're eliminated. But we don't care. We'll only improve.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Can I not answer this question?",
        quote: "Um... I don't know how to say it. Can I not answer this question? I'd rather not answer.",
        effects: { morale: 1, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Perfect Tech Pause. GG.",
        quote: "Perfect Tech Pause. GG.",
        effects: { hype: 2, fanbase: 2, dramaChance: 8 },
      },
    ],
  },

  {
    id: 'post_loss_opponent_apology',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    narrativeCategory: 'external_pressure',
    prompt: "You seemed confident coming into this one. After seeing what they brought today — did you have enough respect for this opponent?",
    options: [
      {
        tone: 'HUMBLE',
        label: "I owe them an apology",
        quote: "I owe you an apology. I wasn't familiar with your game.",
        effects: { fanbase: 3, sponsorTrust: 3, morale: 1, rivalryDelta: -3 },
      },
      {
        tone: 'RESPECTFUL',
        label: "They surprised us today",
        quote: "Full credit to them — they came in with something we hadn't fully prepared for. That team is better than I gave them credit for going in.",
        effects: { fanbase: 2, sponsorTrust: 2, morale: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We respected them — prep let us down",
        quote: "I always respect every opponent. The issue wasn't underestimating them — it was that our prep for their specific style wasn't sharp enough.",
        effects: { morale: 1, dramaChance: 5 },
      },
    ],
  },

];
