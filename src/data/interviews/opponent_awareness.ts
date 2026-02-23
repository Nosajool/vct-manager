import type { InterviewTemplate } from '../../types/interview';

export const OPPONENT_AWARENESS_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // OPPONENT-AWARENESS TEMPLATES (Phase 3 — 8 templates)
  // Conditions: rivalry_active, opponent_dropped_from_upper, lower_bracket,
  //             elimination_risk. Some gated by conditions[].
  // POST_MATCH IDs added to InterviewService winIds/lossIds for routing.
  // ==========================================================================

  // 1. pre_rivalry_rematch_lower — PRE_MATCH rivalry in survival context
  {
    id: 'pre_rivalry_rematch_lower',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You're facing a rival team with real history between you — and now it's survival for at least one side. Does that history add fuel, or does it complicate the focus?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "History makes this personal",
        quote: "Every match we've played against this team has had layers to it. Add elimination pressure on top? This isn't just a bracket match. This is a statement. And we intend to make it.",
        effects: { hype: 5, rivalryDelta: 6, morale: 3, dramaChance: 12, setsFlags: [{ key: 'rivalry_rematch_stakes', durationDays: 7 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: "Rivalry aside, we respect what they've built",
        quote: "This team is here because they've earned it. We have history, but I don't want that becoming a distraction. The bracket doesn't care about storylines — you have to win.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's just the next match",
        quote: "People want to make this about the rivalry. It's not. It's a match in a tournament bracket and we need to win it. Everything else is noise.",
        effects: { morale: 2 },
      },
    ],
  },

  // 2. pre_revenge_match_scorched — PRE_MATCH scorched-earth revenge narrative
  {
    id: 'pre_revenge_match_scorched',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'rivalry_scorched_earth' }, { type: 'has_rivalry' }],
    prompt: "Things got personal between these organizations earlier. Now you're meeting again with tournament lives on the line. Can you keep the emotion from becoming a liability?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "The emotion is the fuel",
        quote: "What happened between us is still fresh. Good. I want my players to remember exactly how that felt. Use it. Channel it. That's not a liability — that's a weapon.",
        effects: { hype: 6, rivalryDelta: 8, morale: 4, dramaChance: 15, setsFlags: [{ key: 'rivalry_revenge_match_active', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "We have to separate the narrative from the game",
        quote: "I've spoken with the players. We acknowledge what happened, we've processed it — now we play our game. The best response to what they said is winning, not burning the place down.",
        effects: { morale: 3, sponsorTrust: 3, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll let the match do the talking",
        quote: "Everyone wants a quote about the rivalry. I'm not giving them one. You'll see everything we have to say when the server goes live.",
        effects: { morale: 2, hype: 3 },
      },
    ],
  },

  // 3. pre_mutual_elimination_battle — PRE_MATCH both teams under the gun
  {
    id: 'pre_mutual_elimination_battle',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'opponent_from_upper' }],
    prompt: "Your opponent fell from the upper bracket and now faces the same elimination pressure you've been carrying. Two teams, everything to lose — what does a match like that look like from inside?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've been here. They're just arriving.",
        quote: "We've been living under elimination pressure for matches now. They're getting introduced to it today. That experience is a real advantage — we know exactly what survival looks like.",
        effects: { hype: 4, morale: 4, fanbase: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "Two teams fighting for their tournament lives",
        quote: "This is the bracket giving you its hardest challenge. A team that was playing well in the upper bracket, now with nothing to lose. We have to be prepared for the best version of them.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Desperation is dangerous — but so are we",
        quote: "They're backed into a corner and that makes them dangerous. Good. We're not looking for an easy path anyway. We're going to put them away and keep climbing.",
        effects: { hype: 5, morale: 3, rivalryDelta: 2, dramaChance: 8 },
      },
    ],
  },

  // 4. pre_opponent_on_run — PRE_MATCH facing a team with momentum
  {
    id: 'pre_opponent_on_run',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "The team you're facing has been on a strong run — consecutive wins, clear momentum behind them. How do you prepare a team to break an opponent who's clearly in form?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Every streak ends eventually",
        quote: "We're not intimidated by someone else's run. We've been in this bracket long enough to know that momentum shifts. Our job is to be the team that ends theirs.",
        effects: { hype: 4, morale: 3, fanbase: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "We study what's making them click",
        quote: "When a team is in form, you study why. Not to copy it — to find where the seams are. Every strong run has a pattern. Our preparation is about finding what disrupts theirs.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We focus entirely on our own execution",
        quote: "The more you fixate on your opponent's form, the more you take your eye off your own game. We know what we need to do. If we execute our system, the momentum question answers itself.",
        effects: { morale: 4, sponsorTrust: 2 },
      },
    ],
  },

  // 5. pre_rivalry_lower_player — PRE_MATCH player in rivalry survival match
  {
    id: 'pre_rivalry_lower_player',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "Facing a rival when it's do-or-die — does the history between these teams add to your focus, or is this just another match you need to win?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "I want to be the one who ends their run",
        quote: "I won't pretend the rivalry doesn't mean something to me. I want to be on the server when we knock them out. That's honest.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 3, hype: 4, rivalryDelta: 5, dramaChance: 10 },
      },
      {
        tone: 'HUMBLE',
        label: "The bracket doesn't care about rivalries",
        quote: "Once you're on the server, it's just about rounds. All the history, the emotions — you have to park that. If you let it in, you start making decisions based on feeling instead of reads.",
        personalityWeights: { STABLE: 2.5, TEAM_FIRST: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I just want to keep our tournament alive",
        quote: "I'm focused on the team, not on who we're facing. We're here to win. That's the only thing on my mind going into this.",
        personalityWeights: { INTROVERT: 2.5, TEAM_FIRST: 2, STABLE: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3 },
      },
    ],
  },

  // 6. post_upset_momentum_shift — POST_MATCH after beating a team on a run (→ winIds)
  {
    id: 'post_upset_momentum_shift',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    prompt: "You just beat a team that had real momentum behind them coming into this tournament. What does pulling off a result like that do for this team's belief in itself?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Now everyone knows what we're capable of",
        quote: "We didn't just win a match — we sent a signal. Every team still in this tournament saw what happened today. I hope they're paying attention.",
        effects: { hype: 6, morale: 4, fanbase: 3, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "It proves the work is paying off",
        quote: "I'm proud of how this team prepared. We went in with a specific plan against a team that had momentum on their side — and we executed. That's what good preparation looks like.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "One win at a time — we keep moving",
        quote: "Great result. Now we reset. The bracket doesn't reward you for celebrating too long. We'll take the win, debrief, and come back focused on the next match.",
        effects: { morale: 3, sponsorTrust: 2 },
      },
    ],
  },

  // 7. post_rivalry_win_elimination — POST_MATCH after eliminating a rival (→ winIds)
  {
    id: 'post_rivalry_win_elimination',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You just eliminated a rival from this tournament. After everything the two teams have been through — what does a result like this mean beyond the bracket points?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is what we came here for",
        quote: "I'm not going to be humble about it. We wanted to be the team that sent them home. The rivalry has been defined by big moments and today was ours. The players earned that.",
        effects: { hype: 6, morale: 4, fanbase: 4, rivalryDelta: 5 },
      },
      {
        tone: 'RESPECTFUL',
        label: "They pushed us to play our best",
        quote: "This team brought everything. The rivalry sharpened us coming in and we needed every bit of that edge today. I have genuine respect for what they built — this result doesn't change that.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We're thinking about what comes next",
        quote: "I'm proud of the result. But the tournament isn't over and I don't want this team spending energy on today. There's still work ahead.",
        effects: { morale: 3, hype: 2 },
      },
    ],
  },

  // 8. post_lower_bracket_survival_player — POST_MATCH player survived elimination (→ winIds)
  {
    id: 'post_lower_bracket_survival_player',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "You just kept this team's tournament alive in the lower bracket. Describe what it actually feels like to survive a match where the other option was going home.",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is where we perform",
        quote: "I know people thought we might not make it. I didn't. My teammates didn't. When you've prepared the way we have, high-stakes matches aren't bigger — they're just matches. And we win matches.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 1, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 4, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "Stay present — one round at a time",
        quote: "Survival matches are emotional. You feel everything. I kept it simple — just do your job, one round, one call at a time. We all did that. That's why we're still here.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 14 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Ask me when the tournament's over",
        quote: "Right now I'm just trying to recover and think about the next one. The feeling of surviving — I'll have time to process that later. We're still in it. That's what matters.",
        personalityWeights: { INTROVERT: 3, STABLE: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, fanbase: 2 },
      },
    ],
  },

];
