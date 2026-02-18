// Interview Template Catalog
// ~16 templates covering PRE_MATCH, POST_MATCH (win/loss), and CRISIS contexts
// Each template has exactly 3 options with varied tones

import type { InterviewTemplate } from '../types/interview';

export const INTERVIEW_TEMPLATES: InterviewTemplate[] = [
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
        effects: { hype: 6, rivalryDelta: 8, morale: 3, dramaChance: 15 },
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
  // POST_MATCH — WIN (4 templates)
  // ==========================================================================

  {
    id: 'post_win_dominant',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "That was a commanding performance. What clicked for the team today?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Everything fired on all cylinders',
        quote: "When we play our game at that level, we're very hard to beat. The preparation was there and the team executed perfectly.",
        effects: { hype: 6, fanbase: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Credit to the whole team',
        quote: "It was a team effort from start to finish. Every player did their job. I'm proud of the discipline and focus they showed.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: "We showed who's best",
        quote: "That's the standard we hold ourselves to. Hopefully that sends a message to the rest of the field.",
        effects: { hype: 7, rivalryDelta: 3, fanbase: 3, dramaChance: 12 },
      },
    ],
  },

  {
    id: 'post_win_close',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "It went down to the wire. How did you stay composed in the clutch moments?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'We never doubted ourselves',
        quote: "Close matches test your character. I was calm because I trusted my players. They showed real mental strength today.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Our opponent made it tough',
        quote: "Full credit to them — they pushed us hard. We had to dig deep but ultimately our preparation gave us the edge.",
        effects: { fanbase: 2, morale: 3, hype: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Close games are our specialty',
        quote: "We've been in those situations before. When it mattered most, we had the answers. That's what separates good teams from great ones.",
        effects: { hype: 4, morale: 3, fanbase: 3 },
      },
    ],
  },

  {
    id: 'post_win_comeback',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "You came back from a serious deficit. What did you say to the team at halftime?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'I told them to believe',
        quote: "I told them: we've got 12 rounds left and one run can change everything. They went out and proved me right.",
        effects: { hype: 7, morale: 5, fanbase: 4 },
      },
      {
        tone: 'HUMBLE',
        label: 'The players did it themselves',
        quote: "Honestly? I kept it simple. These guys knew what to do — they just needed to trust themselves. The fight came from them.",
        effects: { morale: 5, fanbase: 4, sponsorTrust: 3 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'We refused to lose',
        quote: "I told them losing wasn't an option. Not today. And they went out there and made sure it wasn't.",
        effects: { hype: 8, morale: 4, fanbase: 5, rivalryDelta: 2 },
      },
    ],
  },

  {
    id: 'post_win_upset',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "Not many people gave you a chance today. How does it feel to prove the doubters wrong?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "We knew we'd win",
        quote: "The doubters fuel us. We never saw ourselves as underdogs. Remember this result because it won't be the last time we shock people.",
        effects: { hype: 8, fanbase: 5, morale: 4, rivalryDelta: 3, dramaChance: 10 },
      },
      {
        tone: 'HUMBLE',
        label: 'One match at a time',
        quote: "We blocked out the narrative and focused on our game. I'm glad we could deliver for our fans, but this is just one result.",
        effects: { fanbase: 5, morale: 4, sponsorTrust: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: 'This team has always been underrated',
        quote: "I've believed in this roster from day one. The outside world is catching up to what we already knew.",
        effects: { hype: 6, fanbase: 4, morale: 5 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — LOSS (4 templates)
  // ==========================================================================

  {
    id: 'post_loss_standard',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
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
    id: 'post_loss_close',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
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
    condition: 'always',
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
    condition: 'pre_playoff',
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

  // ==========================================================================
  // CRISIS (3 templates)
  // ==========================================================================

  {
    id: 'crisis_loss_streak',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'loss_streak_3plus',
    prompt: "Three straight losses. There are growing calls for roster changes. How do you respond?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We stand behind this roster',
        quote: "I'm not making panic moves. I believe in these players and we're going to work through this together. Patience.",
        effects: { morale: 4, sponsorTrust: -2, hype: -1, dramaChance: 10 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'All options are on the table',
        quote: "We're continuously evaluating everything. I won't rule anything out, but I also won't rush decisions that affect people's livelihoods.",
        effects: { morale: -2, fanbase: 1, dramaChance: 15 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'The system needs to change',
        quote: "The roster isn't the problem — the system around them is. I'm overhauling our approach and this team will look different soon.",
        effects: { fanbase: 3, sponsorTrust: 1, morale: -1, dramaChance: 12 },
      },
    ],
  },

  {
    id: 'crisis_drama_spike',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'drama_active',
    prompt: "Reports of internal tension have leaked publicly. Can you address the locker room situation?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "That's private team business",
        quote: "I'm not going to comment on internal matters. Every team deals with challenges. We handle things in-house and that's that.",
        effects: { morale: 1, fanbase: -1, sponsorTrust: -1 },
      },
      {
        tone: 'HUMBLE',
        label: "We're working through it",
        quote: "I won't pretend everything is perfect. Teams go through periods of friction. We're addressing it head-on and I'm confident we'll come out stronger.",
        effects: { fanbase: 2, morale: 2, sponsorTrust: 1, dramaChance: 8 },
      },
      {
        tone: 'CONFIDENT',
        label: 'This will make us closer',
        quote: "Conflict forges stronger bonds when handled right. We're having real conversations. This team is going to come out of this united.",
        effects: { morale: 3, fanbase: 2, hype: 1, dramaChance: 5 },
      },
    ],
  },

  {
    id: 'crisis_sponsor',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'sponsor_trust_low',
    prompt: "With results declining, are you concerned about your sponsorship relationships?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We deliver long-term value',
        quote: "Our partners understand that esports is a marathon. We have a strong relationship built on more than short-term results.",
        effects: { sponsorTrust: 4, fanbase: 1, hype: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'We have to earn back their trust',
        quote: "We're not taking any partnership for granted. We know we need to perform and we're going to show our sponsors we're worth believing in.",
        effects: { sponsorTrust: 3, morale: 1, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Those conversations stay private',
        quote: "I don't discuss our commercial relationships publicly. What I can say is we're focused on winning, which takes care of everything else.",
        effects: { sponsorTrust: 1, morale: 1 },
      },
    ],
  },
];
