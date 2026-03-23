import type { InterviewTemplate } from '../../types/interview';

export const OPPONENT_AWARENESS_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // OPPONENT-AWARENESS TEMPLATES (Phase 3. 8 templates)
  // Conditions: rivalry_active, opponent_dropped_from_upper, lower_bracket,
  //             elimination_risk. Some gated by conditions[].
  // POST_MATCH IDs added to InterviewService winIds/lossIds for routing.
  // ==========================================================================

  // 1. pre_rivalry_rematch_lower. PRE_MATCH rivalry in survival context
  {
    id: 'pre_rivalry_rematch_lower',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You're facing a rival team with real history between you. And now it's survival for at least one side. Does that history add fuel, or does it complicate the focus?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "History makes this personal",
        quote: "Good luck. You're gonna need it.",
        effects: { hype: 5, rivalryDelta: 6, morale: 3, dramaChance: 12, setsFlags: [{ key: 'rivalry_rematch_stakes', durationDays: 7 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: "Rivalry aside, we respect what they've built",
        quote: "This team is here because they've earned it. We have history, but I don't want that becoming a distraction. The bracket doesn't care about storylines. You have to win.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's just the next match",
        quote: "People want to make this about the rivalry. It's not. It's a match in a tournament bracket and we need to win it. Everything else is noise.",
        effects: { morale: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Pure respect for their player',
        quote: "{rivalPlayerName} is the most good looking Valorant player ever. They are the only one in history to get it popping. Genetically, a chad on and off the server.",
        effects: { fanbase: 3, hype: 4, rivalryDelta: 2 },
      },
    ],
  },

  // 2. pre_revenge_match_scorched. PRE_MATCH scorched-earth revenge narrative
  {
    id: 'pre_revenge_match_scorched',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'external_pressure',
    conditions: [{ type: 'flag_active', flag: 'rivalry_scorched_earth' }, { type: 'has_rivalry' }],
    prompt: "Things got personal between these organizations earlier. Now you're meeting again with tournament lives on the line. Can you keep the emotion from becoming a liability?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "The emotion is the fuel",
        quote: "What happened between us is still fresh. Good. I want my players to remember exactly how that felt. Use it. Channel it. That's not a liability. That's a weapon.",
        effects: { hype: 6, rivalryDelta: 8, morale: 4, dramaChance: 15, setsFlags: [{ key: 'rivalry_revenge_match_active', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "We have to separate the narrative from the game",
        quote: "I've spoken with the players. We acknowledge what happened, we've processed it. Now we play our game. The best response to what they said is winning, not burning the place down.",
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

  // 3. pre_mutual_elimination_battle. PRE_MATCH both teams under the gun
  {
    id: 'pre_mutual_elimination_battle',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'opponent_from_upper' }],
    prompt: "Your opponent fell from the upper bracket and now faces the same elimination pressure you've been carrying. Two teams, everything to lose. What does a match like that look like from inside?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've been here. They're just arriving.",
        quote: "We've been living under elimination pressure for matches now. They're getting introduced to it today. That experience is a real advantage. We know exactly what survival looks like.",
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
        label: "Desperation is dangerous. But so are we",
        quote: "They're backed into a corner and that makes them dangerous. Good. We're not looking for an easy path anyway. We're going to put them away and keep climbing.",
        effects: { hype: 5, morale: 3, rivalryDelta: 2, dramaChance: 8 },
      },
    ],
  },

  // 4. pre_opponent_on_run. PRE_MATCH facing a team with momentum
  {
    id: 'pre_opponent_on_run',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'external_pressure',
    conditions: [
      { type: 'bracket_position', bracketPosition: 'lower' },
      { type: 'opponent_win_streak', minStreak: 2 },
    ],
    prompt: "The team you're facing has been on a strong run. Consecutive wins, clear momentum behind them. How do you prepare a team to break an opponent who's clearly in form?",
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
        quote: "When a team is in form, you study why. Not to copy it. To find where the seams are. Every strong run has a pattern. Our preparation is about finding what disrupts theirs.",
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

  // 5. pre_rivalry_lower_player. PRE_MATCH player in rivalry survival match
  {
    id: 'pre_rivalry_lower_player',
    context: 'PRE_MATCH',
    subjectType: 'player',
    narrativeCategory: 'player_ego',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "Facing a rival when it's do-or-die. Does the history between these teams add to your focus, or is this just another match you need to win?",
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
        quote: "Once you're on the server, it's just about rounds. All the history, the emotions. You have to park that. If you let it in, you start making decisions based on feeling instead of reads.",
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

  // 6. post_upset_momentum_shift. POST_MATCH after beating a team on a run (→ winIds)
  {
    id: 'post_upset_momentum_shift',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "You just beat a team that had real momentum behind them coming into this tournament. What does pulling off a result like that do for this team's belief in itself?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Now everyone knows what we're capable of",
        quote: "We didn't just win a match. We sent a signal. Every team still in this tournament saw what happened today. I hope they're paying attention.",
        effects: { hype: 6, morale: 4, fanbase: 3, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "It proves the work is paying off",
        quote: "I'm proud of how this team prepared. We went in with a specific plan against a team that had momentum on their side. And we executed. That's what good preparation looks like.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "One win at a time. We keep moving",
        quote: "Great result. Now we reset. The bracket doesn't reward you for celebrating too long. We'll take the win, debrief, and come back focused on the next match.",
        effects: { morale: 3, sponsorTrust: 2 },
      },
    ],
  },

  // 7. post_rivalry_win. POST_MATCH after beating a rival
  {
    id: 'post_rivalry_win',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You just beat a rival team. After everything the two teams have been through. What does a result like this mean to you beyond the win itself?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is what we came here for",
        quote: "Forgive me lord, but I love watching their smiles fade.",
        attribution: "Real quote",
        effects: { hype: 6, morale: 4, fanbase: 4, rivalryDelta: 5 },
      },
      {
        tone: 'RESPECTFUL',
        label: "They pushed us to play our best",
        quote: "This team brought everything. The history between us sharpened us coming in and we needed every bit of that edge today. I have genuine respect for what they built. This result doesn't change that.",
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

  // ---- NEW TEMPLATES ----

  // pre_rivalry_guarantee. PRE_MATCH, manager, has_rivalry
  {
    id: 'pre_rivalry_guarantee',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You're facing a team with real history against you. Feeling confident heading in?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We are not losing to them. Guaranteed",
        quote: "We are not losing to {rivalTeamName}. 100%. I can guarantee you that.",
        effects: { hype: 5, rivalryDelta: 5, dramaChance: 10, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 7 }] },
      },
      {
        tone: 'TRASH_TALK',
        label: "Good luck to them",
        quote: "Good luck, you're gonna need it.",
        effects: { hype: 3, rivalryDelta: 3, dramaChance: 8, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 5 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll let the match do the talking",
        quote: "I'll let the match do the talking.",
        effects: { morale: 1 },
      },
    ],
  },

  // pre_rivalry_org_dismissal. PRE_MATCH, manager, has_rivalry
  {
    id: 'pre_rivalry_org_dismissal',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "How do you assess this rival organization heading into today's match?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "Good humans, bad players",
        quote: "I think they're good humans. They're just dog shit players.",
        attribution: "Real quote",
        effects: { hype: 4, rivalryDelta: 5, dramaChance: 12, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 7 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "They've had to prove me wrong",
        quote: "I thought {rivalTeamName} was some kind of fried chicken company. They've had to prove me wrong.",
        effects: { hype: 5, rivalryDelta: 6, fanbase: 1, dramaChance: 15, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 7 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: "They've earned their place",
        quote: "They've earned their place here. We'll see what happens on the server.",
        effects: { morale: 1, fanbase: 1 },
      },
    ],
  },

  // pre_tournament_exclusion_threat. PRE_MATCH, manager, has_rivalry, is_playoff_match
  {
    id: 'pre_tournament_exclusion_threat',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }, { type: 'is_playoff_match' }],
    prompt: "If you win today, you essentially end their tournament. Any message for them?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "A tournament without them",
        quote: "We'll show you a {tournamentName} without {rivalTeamName}.",
        effects: { hype: 5, rivalryDelta: 6, dramaChance: 12, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 7 }] },
      },
      {
        tone: 'CONFIDENT',
        label: "Eliminations are part of the bracket",
        quote: "Eliminations are part of the bracket. We're focused on advancing.",
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I have a game plan, not a message",
        quote: "I don't have a message for them. I have a game plan.",
        effects: { morale: 2 },
      },
    ],
  },

  // pre_champ_dismissal. PRE_MATCH, manager, has_rivalry
  // TODO switch this to tournament winner
  {
    id: 'pre_champ_dismissal',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "Your opponent is a former Champs winner. Does that legacy add pressure to this match?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "I wasn't playing when they won",
        quote: "I wasn't playing when they won Champs.",
        effects: { hype: 3, rivalryDelta: 4, dramaChance: 8, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 7 }] },
      },
      {
        tone: 'CONFIDENT',
        label: "Past wins don't win today's match",
        quote: "Past Champs wins don't win today's match.",
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "That legacy means something",
        quote: "That legacy means something. We'll have to be at our best.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
    ],
  },

  // pre_match_player_callout. PRE_MATCH, player, has_rivalry, personality-gated
  {
    id: 'pre_match_player_callout',
    context: 'PRE_MATCH',
    subjectType: 'player',
    narrativeCategory: 'player_ego',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "Is there an individual matchup on the other team you're personally motivated to win?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "I'm sending him to the graveyard",
        quote: "I'm going to send {rivalPlayerName} to the graveyard if he peeks me.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0 },
        effects: { hype: 4, rivalryDelta: 4, dramaChance: 10, setsFlags: [{ key: 'interview_player_called_out_rival', durationDays: 5 }] },
      },
      {
        tone: 'TRASH_TALK',
        label: "Come to LA with a sign",
        quote: "Come to LA with a sign that says '{rivalPlayerName} my daddy'. Ask your org for a ticket and sit in the crowd cheering for the man who created you.",
        personalityWeights: { FAME_SEEKER: 3, BIG_STAGE: 2.5, STABLE: 0, INTROVERT: 0, TEAM_FIRST: 0 },
        effects: { hype: 6, rivalryDelta: 8, dramaChance: 18, setsFlags: [{ key: 'interview_player_called_out_rival', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I want to beat the whole team",
        quote: "I want to beat the whole team, not just one guy.",
        personalityWeights: { STABLE: 2.5, TEAM_FIRST: 2.5, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2, sponsorTrust: 1 },
      },
    ],
  },

  // post_rivalry_win_player_callout. POST_MATCH, player, win, has_rivalry
  {
    id: 'post_rivalry_win_player_callout',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'player_ego',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "Big win over a rival. What was going through your head when it ended?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "This kid is retiring after this game",
        quote: "Yo, what I just did to {rivalPlayerName}. This kid is retiring after this game.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2 },
        effects: { hype: 5, rivalryDelta: 6, fanbase: 2, dramaChance: 15 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Are you okay???",
        quote: "{rivalPlayerName}, ARE YOU OKAYYYY???",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 1.5 },
        effects: { hype: 4, rivalryDelta: 5, fanbase: 2, dramaChance: 12 },
      },
      {
        tone: 'HUMBLE',
        label: "Team effort, prepared and executed",
        quote: "It was a team effort. We came in prepared and executed.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
    ],
  },

  // post_win_opponent_whiff_callout. POST_MATCH, player, win, has_rivalry
  {
    id: 'post_win_opponent_whiff_callout',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'player_ego',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "There were a few moments where the opposing players really struggled. Did you notice that in the moment?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "Call them out",
        quote: "You're 14! How are you missing that?",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2 },
        effects: { hype: 4, rivalryDelta: 6, fanbase: 2, dramaChance: 14 },
      },
      {
        tone: 'CONFIDENT',
        label: "We put them in hard spots",
        quote: "We put them in positions where there was no good answer. That's the game plan working.",
        personalityWeights: { STABLE: 1.5, BIG_STAGE: 1.5 },
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "Those moments happen",
        quote: "Those moments happen in high-pressure games. We've all been there.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2 },
        effects: { morale: 2, fanbase: 1, rivalryDelta: -1 },
      },
    ],
  },

  // post_rivalry_tier_promotion. POST_MATCH, player, win, has_rivalry
  {
    id: 'post_rivalry_tier_promotion',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'player_ego',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You've had history with {rivalPlayerName} from earlier in your career. What does tonight mean?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "Welcome to tier 1",
        quote: "Owned {rivalPlayerName} in tier 2. Welcome to tier 1.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2 },
        effects: { hype: 5, rivalryDelta: 5, fanbase: 2, dramaChance: 12 },
      },
      {
        tone: 'CONFIDENT',
        label: "I always believed I belonged here",
        quote: "I always believed I belonged at this level. Now I'm proving it.",
        personalityWeights: { FAME_SEEKER: 1.5, BIG_STAGE: 1.5, STABLE: 1 },
        effects: { hype: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "I learned from those earlier matches",
        quote: "I learned a lot from those earlier matches. This is the next step.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1.5 },
        effects: { morale: 3, sponsorTrust: 2 },
      },
    ],
  },

  // post_international_upset_win. POST_MATCH, manager, win, opponent_from_upper / is_playoff_match
  {
    id: 'post_international_upset_win',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    conditions: [{ type: 'opponent_from_upper' }],
    prompt: "You just knocked out an international powerhouse. What does that prove about this team?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Welcome to {regionName}",
        quote: "Welcome to {regionName}.",
        effects: { hype: 6, morale: 4, fanbase: 4, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "It validates all the work",
        quote: "We've been building toward this. It validates all the work.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Eyes on the next one",
        quote: "Tournament isn't over. Eyes on the next one.",
        effects: { morale: 3, hype: 2 },
      },
    ],
  },

  // post_win_rival_disrespect_ignition. POST_MATCH, player, win, has_rivalry
  {
    id: 'post_win_rival_disrespect_ignition',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "You looked dialed in from the second half onward. What switched?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "It became personal",
        quote: "I saw {rivalTeamName} smiling after the first half of {mapName} and that was enough for it to become personal to me.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2.5, STABLE: 0, TEAM_FIRST: 1 },
        effects: { hype: 5, rivalryDelta: 8, morale: 3, dramaChance: 12, setsFlags: [{ key: 'rivalry_scorched_earth', durationDays: 14 }] },
      },
      {
        tone: 'CONFIDENT',
        label: "We made the adjustments",
        quote: "We saw what wasn't working and fixed it at halftime. The second half was ours.",
        personalityWeights: { STABLE: 2, INTROVERT: 1 },
        effects: { hype: 3, morale: 3, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "The team pulled me through",
        quote: "I was struggling early but my teammates kept things stable. When I got going, it was because they gave me the foundation to build on.",
        personalityWeights: { TEAM_FIRST: 2, INTROVERT: 1.5, FAME_SEEKER: 0 },
        effects: { morale: 4, fanbase: 3 },
      },
    ],
  },

  // post_win_rival_pointed_at_me. POST_MATCH, player, win, has_rivalry
  {
    id: 'post_win_rival_pointed_at_me',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "Was there a specific moment during the match that personally got you locked in?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "He kept pointing at me",
        quote:
          "When I played on {mapName}, suddenly I saw {rivalPlayerName} keep pointing at me and standing up at me, and I just didn't understand why dude. I had like 11 kills, I didn't even do anything on the map.\n\nHe kept pointing at me, so I took it as a challenge and carried that into the next maps. That's why it was fun, I guess, because it's like I wanted to prove something, you know.",
        personalityWeights: { BIG_STAGE: 2.5, FAME_SEEKER: 2, STABLE: 0.5, INTROVERT: 0 },
        effects: { hype: 5, rivalryDelta: 7, morale: 3, dramaChance: 10 },
      },
      {
        tone: 'CONFIDENT',
        label: "I just stayed in my game",
        quote: "I wasn't thinking about {rivalPlayerName} or anyone else. I just played my game and let the scoreboard do the talking.",
        personalityWeights: { STABLE: 2, BIG_STAGE: 1.5, TEAM_FIRST: 1 },
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "The team energy carried me",
        quote: "I wasn't at my best early, but the guys kept me grounded. When it clicked, it was because everyone around me was locked in.",
        personalityWeights: { TEAM_FIRST: 2.5, INTROVERT: 1.5, FAME_SEEKER: 0 },
        effects: { morale: 4, fanbase: 2 },
      },
    ],
  },

  // pre_star_player_threat_assessment. PRE_MATCH, manager
  {
    id: 'pre_star_player_threat_assessment',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'external_pressure',
    prompt: "Your opponent has one player who's clearly operating on a different level. How does that shape your approach?",
    options: [
      {
        tone: 'RESPECTFUL',
        label: "Elite in their role, but one player doesn't make a team",
        quote: "I think {rivalPlayerName} is probably the best in their role that I've ever seen. I tip my hat to them. But overall. I don't really have a read on how they play as a team. {rivalPlayerName} kind of steals the show when you watch their matches.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: "Only one player can shoot",
        quote: "They are easy to beat. Only {rivalPlayerName} can shoot.",
        effects: { hype: 4, rivalryDelta: 5, dramaChance: 12, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 6 }] },
      },
      {
        tone: 'CONFIDENT',
        label: "They're very beatable",
        quote: "{rivalTeamName} are not a super team. They are very beatable.",
        effects: { hype: 4, morale: 3 },
      },
    ],
  },

  // pre_confident_spectator. PRE_MATCH, player
  {
    id: 'pre_confident_spectator',
    context: 'PRE_MATCH',
    subjectType: 'player',
    narrativeCategory: 'player_ego',
    prompt: "What's your mindset heading into this match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I'm just here for the show",
        quote: "I'm just there to watch the show and enjoy my popcorn.",
        personalityWeights: { BIG_STAGE: 2.5, FAME_SEEKER: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { hype: 4, morale: 3, fanbase: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: "They talk too much",
        quote: "I want to play {rivalTeamName} because {rivalPlayerName} talks too much.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 1.5, STABLE: 0, INTROVERT: 0, TEAM_FIRST: 0 },
        effects: { hype: 5, rivalryDelta: 5, dramaChance: 12, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 5 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Don't shittalk or you're in for a bad game",
        quote: "Don't shittalk {rivalTeamName} or else you're in for a bad game. I'm just focused on our execution.",
        personalityWeights: { STABLE: 2.5, INTROVERT: 2, TEAM_FIRST: 1.5, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, sponsorTrust: 2 },
      },
    ],
  },

  // post_star_player_analysis. POST_MATCH, player, any outcome
  {
    id: 'post_star_player_analysis',
    context: 'POST_MATCH',
    subjectType: 'player',
    narrativeCategory: 'external_pressure',
    prompt: "What was it like dealing with {rivalPlayerName} in that match?",
    options: [
      {
        tone: 'HUMBLE',
        label: "He plays a completely different game",
        quote: "The coaches were trying to prep us for two days on how to play against {rivalPlayerName}. It's very difficult. He plays a whole different game of VALORANT. I was so far away and he just one-bullets me with the shotgun. I don't even know how that's possible, but well played.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "His pace and decision-making is elite",
        quote: "When you experience a pace that quick in the actual server, it can feel pretty overwhelming. {rivalPlayerName} is pretty creative. His pathing and on-the-fly decision-making is very strong. We were one bullet away from a 1v3 and winning. So tough luck.",
        personalityWeights: { STABLE: 2, TEAM_FIRST: 1.5, INTROVERT: 1, BIG_STAGE: 1 },
        effects: { morale: 2, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Why is he so good? He's bald.",
        quote: "Why is he so good? He's bald.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2.5, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { hype: 4, fanbase: 3, dramaChance: 8 },
      },
    ],
  },

  // post_win_speedrun_callout. POST_MATCH, manager, win, has_rivalry
  {
    id: 'post_win_speedrun_callout',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'has_rivalry' }],
    prompt: "That was a dominant performance. Anything to say to {rivalTeamName}?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "Is this their speedrun content?",
        quote: "You guys think {rivalTeamName} is posting this game to their speedrunning YouTube?",
        effects: { hype: 5, rivalryDelta: 6, fanbase: 2, dramaChance: 14, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 5 }] },
      },
      {
        tone: 'CONFIDENT',
        label: "Hope the VOD is useful",
        quote: "Welcome to the bracket. Hope the VOD is useful.",
        effects: { hype: 4, morale: 3, rivalryDelta: 3, dramaChance: 8 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "The scoreboard says it all",
        quote: "I'll let the scoreboard do the talking.",
        effects: { morale: 2, hype: 2 },
      },
    ],
  },

  // post_win_duo_carry. POST_MATCH, player, win
  {
    id: 'post_win_duo_carry',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "You and {starPlayerName} were everywhere tonight. How did that come together?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "They just needed us",
        quote: "They just needed me and {starPlayerName}. Now we're here.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { hype: 5, morale: 3, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "My teammates are sick. Not actually sick",
        quote: "Fortunately, my teammates are sick. Not sick as in ill, we're not ill, don't worry. I mean sick at the game.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, fanbase: 4, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "The whole team executed",
        quote: "The whole team executed. I don't think it was about any one pairing.",
        personalityWeights: { INTROVERT: 2.5, TEAM_FIRST: 2, STABLE: 1.5, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, sponsorTrust: 2 },
      },
    ],
  },

  // post_win_agent_mission. POST_MATCH, manager, win
  {
    id: 'post_win_agent_mission',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "What was the story behind today's agent picks?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Helping our player complete the mission",
        quote: "We wanted to put {starPlayerName} on something new. We're helping him complete his mission of playing every single agent. He has one more left. Maybe you'll see it in this tournament.",
        effects: { hype: 4, fanbase: 3, morale: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: "Angles they couldn't prepare for",
        quote: "We picked agents that gave us angles they couldn't prepare for.",
        effects: { hype: 4, morale: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Right call for the map",
        quote: "It was the right call for the map. That's all I'll say.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
    ],
  },

  // pre_international_callout. PRE_MATCH, player
  {
    id: 'pre_international_callout',
    context: 'PRE_MATCH',
    subjectType: 'player',
    narrativeCategory: 'tournament_drama',
    prompt: "What's your message going up against an international roster today?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: "Get ready to learn Chinese",
        quote: "Get ready to learn Chinese, buddy.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2, STABLE: 0, INTROVERT: 0, TEAM_FIRST: 0 },
        effects: { hype: 5, rivalryDelta: 4, dramaChance: 13, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 5 }] },
      },
      {
        tone: 'TRASH_TALK',
        label: "Every other team is bad",
        quote: "It's only {rivalTeamName}. Every other team is bad.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 1.5, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0 },
        effects: { hype: 4, rivalryDelta: 4, dramaChance: 10, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 5 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: "International competition raises everyone's game",
        quote: "International competition raises everyone's game. We have to be sharp.",
        personalityWeights: { STABLE: 2.5, TEAM_FIRST: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
    ],
  },

  // 8. post_lower_bracket_survival_player. POST_MATCH player survived elimination (→ winIds)
  {
    id: 'post_lower_bracket_survival_player',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    narrativeCategory: 'tournament_drama',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "You just kept this team's tournament alive in the lower bracket. Describe what it actually feels like to survive a match where the other option was going home.",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is where we perform",
        quote: "I know people thought we might not make it. I didn't. My teammates didn't. When you've prepared the way we have, high-stakes matches aren't bigger. They're just matches. And we win matches.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 1, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 4, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "Stay present. One round at a time",
        quote: "Survival matches are emotional. You feel everything. I kept it simple. Just do your job, one round, one call at a time. We all did that. That's why we're still here.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 14 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Ask me when the tournament's over",
        quote: "Right now I'm just trying to recover and think about the next one. The feeling of surviving. I'll have time to process that later. We're still in it. That's what matters.",
        personalityWeights: { INTROVERT: 3, STABLE: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, fanbase: 2 },
      },
    ],
  },

  // pre_opponent_roster_praise. PRE_MATCH generic opponent roster awareness
  {
    id: 'pre_opponent_roster_praise',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    narrativeCategory: 'external_pressure',
    prompt: "What's your read on the team you're facing today?",
    options: [
      {
        tone: 'RESPECTFUL',
        label: "They have some of the best talent in the region",
        quote: "This team have the greatest set of raw aimers in {regionName}, perhaps even the world. {iglPlayerName} is genius IGL who knows how to keep his team calm when the going gets tough. {player1Name} is just the best raw aimer in {regionName}. {player2Name} is one of the best {preferredAgentRole} players in {regionName}. {player3Name} will pull out a clutch out of nowhere.",
        effects: { fanbase: 2, sponsorTrust: 2, rivalryDelta: -2 },
      },
      {
        tone: 'CONFIDENT',
        label: "They're good. But so are we",
        quote: "They have real talent. We respect that. But we've prepared for every one of them and we believe in our system.",
        effects: { morale: 2, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We focus on ourselves",
        quote: "We don't spend too much time on the opponent. We trust our prep and play our game.",
        effects: { morale: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: "Their IGL's genius is one simple tactic",
        quote: "{iglPlayerName} is a tactical genius. They are best known for their signature tactic {player1Name} go kill.",
        effects: { hype: 3, rivalryDelta: 3, dramaChance: 8 },
      },
      {
        tone: 'TRASH_TALK',
        label: "High IQ, zero aim",
        quote: "{iglPlayerName} was a Dungeons and Dragons character who rolled a natural 20 on intelligence and a natural 1 on aim.",
        effects: { hype: 4, rivalryDelta: 4, dramaChance: 10 },
      },
    ],
  },

];
