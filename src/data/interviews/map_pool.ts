import type { InterviewTemplate } from '../../types/interview';

export const MAP_POOL_INTERVIEW_TEMPLATES: InterviewTemplate[] = [
  // ============================================================
  // PRE_MATCH — no condition
  // ============================================================
  {
    id: 'pre_map_veto_philosophy',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    prompt: 'Walk us through your map veto philosophy going into today.',
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Dictate the veto',
        quote: "We know exactly what we want and what we don't. We're not reacting to them — we're making them react to us.",
        effects: { hype: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Trust the process',
        quote: "It's about finding the best possible battlefield for our system. We study our opponents, stay disciplined, and trust the scouting.",
        effects: { hype: 1, morale: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Keep it vague',
        quote: "We have our process. I'd rather not give them any extra scouting in an interview. You'll see how it plays out.",
        effects: { hype: 1 },
      },
    ],
  },

  // ============================================================
  // PRE_MATCH — map_pool_played_strong_map
  // ============================================================
  {
    id: 'pre_map_strong_pick',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    prompt: "You're playing on one of your strongest maps today. What's the gameplan heading in?",
    conditions: [{ type: 'map_pool_played_strong_map' }],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Embrace the edge',
        quote: "This is where we do our best work. We've played hundreds of rounds here — I expect us to control the pace from the opening gun.",
        effects: { hype: 4, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Stay grounded',
        quote: "Playing your own map is never as easy as it looks from the outside. We still have to earn it. But yeah — we feel good about today.",
        effects: { hype: 2, morale: 1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Credit the opponent',
        quote: "They'll have prepped for this. We know that. But we've got more depth on this map than almost anyone — so let's find out.",
        effects: { hype: 2, rivalryDelta: 2 },
      },
    ],
  },

  // ============================================================
  // PRE_MATCH — map_pool_played_weak_map
  // ============================================================
  {
    id: 'pre_map_weak_forced',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    prompt: "You're heading into a map that's historically been a challenge for your squad. How have you been approaching the prep?",
    conditions: [{ type: 'map_pool_played_weak_map' }],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Flip the narrative',
        quote: "Every map in the pool is a learning opportunity. We've put in the reps this week — I'd rather be tested here than dodge it forever.",
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Keep it simple',
        quote: "We know it's not our strongest. We've focused on simplifying our gameplan and leaning on communication over complex setups.",
        effects: { hype: 1, morale: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Redirect to execution',
        quote: "Veto is part of the game. You can't always get your map. What matters is how you respond on the day.",
        effects: { hype: 1 },
      },
    ],
  },

  // ============================================================
  // PRE_MATCH — map_pool_overall_below
  // ============================================================
  {
    id: 'pre_map_pool_depth',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    prompt: "Map pool depth has been a talking point around your team. Is that something that weighs on you heading into matches?",
    conditions: [{ type: 'map_pool_overall_below' }],
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Reframe the narrative',
        quote: "Every team has stronger and weaker maps. We've chosen to go deep on fewer maps rather than spread thin across all of them. It's a philosophy, not a weakness.",
        effects: { hype: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Acknowledge and commit',
        quote: "It's a real concern and we're not hiding from it. We're working on it. But that work happens in the server, not in interviews.",
        effects: { morale: 1 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'Own the gap',
        quote: "It's on me to build a system that plays more maps at a high level. We're not there yet. That's something I think about every single day.",
        effects: { morale: -2, hype: -1 },
      },
    ],
  },

  // ============================================================
  // PRE_MATCH — map_pool_has_scrim_data
  // ============================================================
  {
    id: 'pre_map_scrim_prep',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    prompt: "You've logged serious scrim time on today's map recently. What's been the focus of that work?",
    conditions: [{ type: 'map_pool_has_scrim_data' }],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'The prep is there',
        quote: "We've stress-tested a lot of reads over the past few weeks. The answers are in the system — now it's about executing under pressure.",
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Still learning',
        quote: "Scrims give you data, not certainty. We've made progress, but there's still a lot we're figuring out. That's the honest answer.",
        effects: { hype: 1, morale: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Keep the cards close',
        quote: "I'm not going to detail exactly what we've been working on. The answers are in the game today.",
        effects: { hype: 1 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH win — map_pool_played_weak_map
  // ============================================================
  {
    id: 'post_win_weak_map',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'win',
    prompt: "You just won on a map that hasn't always been kind to you. What clicked today?",
    conditions: [{ type: 'map_pool_played_weak_map' }],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'The prep paid off',
        quote: "The prep paid off. We put in serious scrim time and it showed. This was a statement — we don't have weak maps anymore.",
        effects: { hype: 5, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Credit the players',
        quote: "Honestly, the players executed under pressure better than I could've asked. A win is a win, but we know there's still work to do.",
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: 'Send a message',
        quote: "Maybe teams should stop comfort-picking that for us. We figured it out. Next.",
        effects: { hype: 4, morale: 2, rivalryDelta: 5 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH win — map_pool_played_strong_map
  // ============================================================
  {
    id: 'post_win_strong_map',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'win',
    prompt: "You took care of business on your map pick. Were you confident coming in?",
    conditions: [{ type: 'map_pool_played_strong_map' }],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Exactly as planned',
        quote: "Yeah. We've won on this map in conditions way more hostile than today. Confidence was high — we trusted the preparation.",
        effects: { hype: 4, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Never take it for granted',
        quote: "You can never take a comfort map for granted. We've dropped matches on maps we should've won. Today we were professional.",
        effects: { hype: 2, morale: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Acknowledge the fight',
        quote: "They pushed us harder than I expected, honestly. Credit to them. But our depth on this map carries — we had answers when it mattered.",
        effects: { hype: 3, morale: 2, rivalryDelta: 2 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH win — map_pool_has_scrim_data
  // ============================================================
  {
    id: 'post_win_scrim_payoff',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'win',
    prompt: "Some of the setups you ran today looked like the result of a lot of deliberate work. Who's been driving that?",
    conditions: [{ type: 'map_pool_has_scrim_data' }],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Collective effort',
        quote: "It's the whole room, honestly. When you put in that many hours on a map, you start finding edges nobody else has. That's what you saw today.",
        effects: { hype: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Give it to the process',
        quote: "The credit goes to everyone who showed up to those late-night scrim sessions. That work isn't glamorous, but today is why you do it.",
        effects: { hype: 3, morale: 4 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Protect the playbook',
        quote: "I'm not going to break down the film right here. But yeah — that stuff doesn't come from thin air.",
        effects: { hype: 2 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH loss — map_pool_played_weak_map
  // ============================================================
  {
    id: 'post_loss_weak_map',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'loss',
    prompt: "You dropped a map that's been a known weak point for you. Should the veto have gone differently?",
    conditions: [{ type: 'map_pool_played_weak_map' }],
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'Own the veto',
        quote: "That's on me. I made a call and it didn't work. Losing on that map hurts twice as much when you know you handed it to them.",
        effects: { morale: -3, hype: -2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Accept the lesson',
        quote: "We knew coming in it would be hard. We didn't execute well enough to overcome that. That's the reality. We'll use it.",
        effects: { morale: -1, hype: -1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Move forward',
        quote: "We made our decision and I stand by the logic behind it. It didn't go our way today. Doesn't change how we approach it next time.",
        effects: { morale: -1 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH loss — map_pool_played_strong_map
  // ============================================================
  {
    id: 'post_loss_strong_map',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'loss',
    prompt: "Losing your own map pick is a tough result. What happened out there?",
    conditions: [{ type: 'map_pool_played_strong_map' }],
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'On the prep',
        quote: "We were passive when we shouldn't have been. On our map, we should be dictating the pace. That's on me — we prepped the wrong way.",
        effects: { morale: -3, hype: -3 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Credit the opponent',
        quote: "Credit to them. They studied us well and had answers we didn't expect. It hurts losing there, but respect where it's due.",
        effects: { morale: -1, hype: -1, rivalryDelta: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'No map is safe',
        quote: "It exposes that no map is ever really safe. We need to be more adaptable, even on our own picks.",
        effects: { morale: -2, hype: -2 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH loss — map_pool_overall_below
  // ============================================================
  {
    id: 'post_loss_pool_depth',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'loss',
    prompt: "Map pool has come up as a limiting factor for this team repeatedly. How do you fix it?",
    conditions: [{ type: 'map_pool_overall_below' }],
    options: [
      {
        tone: 'HUMBLE',
        label: 'Commit to the work',
        quote: "There's no shortcut. You build a map pool through repetition, through film, through being honest about where you're weak. We have to do that.",
        effects: { morale: -1, hype: -2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Point to other factors',
        quote: "Look, the map pool is a factor. But today's loss had a lot of contributors. I don't want to make it the headline when there's more to unpack.",
        effects: { morale: -1 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'System failure',
        quote: "I've been too narrow in what I've asked from this team. That's a coaching issue. I need to push us into uncomfortable territory more often.",
        effects: { morale: -4, hype: -3 },
      },
    ],
  },

  // ============================================================
  // GENERAL — no condition
  // ============================================================
  {
    id: 'general_map_pool_state',
    context: 'GENERAL',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    prompt: "How do you feel about the current map pool? Anything you'd want rotated out?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We can play them all',
        quote: "I actually like the current pool. It rewards teams that put in systematic work across the board. We've been doing that.",
        effects: { hype: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Some struggle more than others',
        quote: "There are maps we'd prefer not to see. Every team has them. But my job is to make sure those preferences don't become liabilities.",
        effects: { hype: 1 },
      },
      {
        tone: 'TRASH_TALK',
        label: 'Call out a map',
        quote: "If I'm being honest? There are one or two maps that feel more like coin flips than strategy. But I guess that's good for the viewers.",
        effects: { hype: 3, fanbase: 2 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH any — map_pool_attribute_below (retakes)
  // ============================================================
  {
    id: 'post_attr_retakes',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'any',
    prompt: "Your team struggled to win rounds after losing first contact today. Is retake defense something you've been working on?",
    conditions: [{ type: 'map_pool_attribute_below', mapPoolAttribute: 'retakes', mapPoolThreshold: 40 }],
    options: [
      {
        tone: 'HUMBLE',
        label: 'Acknowledge the gap',
        quote: "Yeah, it's an area we need to develop. Retakes are hard — you're down a player or two in a compressed site. We need cleaner reads and better utility usage.",
        effects: { morale: -1, hype: -1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Context matters',
        quote: "Some of those rounds, the plants were difficult positions to work with. But yes — retake discipline is something we look at every film session.",
        effects: { hype: -1 },
      },
      {
        tone: 'CONFIDENT',
        label: 'It\'s being addressed',
        quote: "We know what to fix. The work is happening. You don't always see the improvements immediately, but they're coming.",
        effects: { morale: 1, hype: 1 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH any — map_pool_attribute_below (executes)
  // ============================================================
  {
    id: 'post_attr_executes',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'any',
    prompt: "Your attack-side execution looked disjointed at times today. Is your execute game on this map still a work in progress?",
    conditions: [{ type: 'map_pool_attribute_below', mapPoolAttribute: 'executes', mapPoolThreshold: 40 }],
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'Execution failures',
        quote: "That's on me for the setups we gave them. Our executes need to be sharper — the timing, the utility, the entry reads. All of it.",
        effects: { morale: -2, hype: -2 },
      },
      {
        tone: 'HUMBLE',
        label: 'In progress',
        quote: "We're still building out our attack side on this map. We have structure, but we're not quite at the level of execution we want yet.",
        effects: { morale: -1, hype: -1 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Read-dependent day',
        quote: "Some of it was them making good reads — give credit. But our fundamentals are sound. A few cleanups and we'll be where we need to be.",
        effects: { hype: 1 },
      },
    ],
  },

  // ============================================================
  // POST_MATCH any — map_pool_attribute_below (antiStrat)
  // ============================================================
  {
    id: 'post_attr_antiStrat',
    context: 'POST_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'map_pool',
    matchOutcome: 'loss',
    prompt: "It seemed like the opponent had reads on everything you ran on {mapName}. How much of your prep is about breaking their system versus running your own?",
    conditions: [{ type: 'map_pool_attribute_below', mapPoolAttribute: 'antiStrat', mapPoolThreshold: 40 }],
    options: [
      {
        tone: 'HUMBLE',
        label: 'They out-prepped us',
        quote: "Credit to them — they came prepared. We leaned too hard on our own system and didn't adjust. That's something we need to get better at.",
        effects: { morale: -2, hype: -2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'It\'s a process',
        quote: "Anti-stratting takes time. You need VODs, you need patterns, you need reps against teams. We're building that intel bank.",
        effects: { hype: -1 },
      },
      {
        tone: 'CONFIDENT',
        label: 'We\'ll have answers next time',
        quote: "Now we know exactly how they want to play. That's information we didn't have before. Next time it's a different conversation.",
        effects: { morale: 1, hype: 1 },
      },
    ],
  },
];
