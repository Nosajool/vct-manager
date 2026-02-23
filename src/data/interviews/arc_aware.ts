import type { InterviewTemplate } from '../../types/interview';

export const ARC_AWARE_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // COACH — POST_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'post_coach_win',
    context: 'POST_MATCH',
    subjectType: 'coach',
    matchOutcome: 'win',
    prompt: "Great result today. What did the team execute particularly well from a tactical standpoint?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'The players bought in completely',
        quote: "When your players trust the system, moments like this happen. Credit to them — they executed a difficult game plan without hesitation.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: 'The prep paid off exactly as planned',
        quote: "We put a lot of hours into preparing for their style and it showed. The team executed at a really high level and it was genuinely a joy to watch.",
        effects: { hype: 3, morale: 3, fanbase: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Tight match, good adjustments',
        quote: "Our opponent is well-coached so nothing came easy. What I'm most proud of is how quickly our players adapted when they shifted their approach.",
        effects: { morale: 2, fanbase: 2, sponsorTrust: 1 },
      },
    ],
  },

  {
    id: 'post_coach_loss',
    context: 'POST_MATCH',
    subjectType: 'coach',
    matchOutcome: 'loss',
    prompt: "Tough result today. What tactical adjustments will you be making going forward?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'I got outcoached today',
        quote: "I have to be honest — their coach had answers for things I thought would work. I'll go back to the film and make sure we're better prepared next time.",
        effects: { fanbase: 2, sponsorTrust: 2, morale: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We'll get the details right",
        quote: "There are a few areas I want to revisit this week. The fundamentals are solid — it's the execution under pressure that we need to sharpen.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Lots to look at on film',
        quote: "We'll get in the review room and identify the key moments. I'd rather not make sweeping statements before I've had a proper look.",
        effects: { morale: 1 },
      },
    ],
  },


  // ==========================================================================
  // PLAYER — POST_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'post_player_win',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    prompt: "Strong performance from you today. What clicked for you personally in this match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'I was reading the game well',
        quote: "Everything felt natural today. I was making the right calls, hitting my shots, trusting my instincts. These are the days you play for.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, TEAM_FIRST: 0.5, INTROVERT: 0.5, STABLE: 1 },
        effects: { morale: 4, hype: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'The team set me up to succeed',
        quote: "My teammates made my job way easier today. When everyone communicates and plays together like that, it lifts everyone's individual performance.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 1.5, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Our opponent pushed us',
        quote: "Competing against good players brings out the best in you. They made us work for every advantage and I think that sharpened our play.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
    ],
  },

  {
    id: 'post_player_loss',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'loss',
    prompt: "It was a tough day for the team. How are you personally processing this loss?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: "I need to be better",
        quote: "I'm not happy with how I played. There were moments where I could have made a difference and I didn't. I'll go back and work on it.",
        effects: { morale: 2, fanbase: 2, hype: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "It hurts, but we learn",
        quote: "Losses like this sting. But you can't let it break you — you have to look at it honestly and figure out what to fix. That's the process.",
        effects: { morale: 2, sponsorTrust: 1, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We'll bounce back",
        quote: "Bad days happen. I'd rather not dwell on it too much. We'll train hard this week and come back with something to prove.",
        effects: { morale: 2 },
      },
    ],
  },


  // ==========================================================================
  // FLAG-CONDITIONAL TEMPLATES (3 templates)
  // Only surfaced when specific drama flags are active
  // ==========================================================================

  {
    id: 'post_loss_igl_blamed',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'interview_blamed_teammates' }, { type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "One of your players seemed to imply the game plan was the issue. Is there a communication breakdown between you and your IGL?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'I back my IGL completely',
        quote: "That player's comments don't reflect the team's view. Our IGL has my full confidence and the team's. We're aligned.",
        effects: { morale: 2, sponsorTrust: 1, setsFlags: [{ key: 'manager_backed_igl', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: 'We had an internal conversation',
        quote: "Every team has moments of friction. We addressed it internally and we're past it. I expect better communication from everyone going forward.",
        effects: { morale: 1, fanbase: 1, dramaChance: 8 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Individual opinions happen in tough times',
        quote: "Losses can make people say things in the heat of the moment. We don't assign blame publicly. That stays in the room.",
        effects: { morale: 1 },
      },
    ],
  },

  {
    id: 'pre_contract_pressure',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    prompt: "With contract situations looming for some of your players, how do you keep the focus on winning rather than off-field noise?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're aligned — extensions will come",
        quote: "Contract talks are a normal part of team management. My players know they're valued here. We'll handle the business side when the time is right.",
        effects: { morale: 3, sponsorTrust: 2, setsFlags: [{ key: 'org_contract_confidence', durationDays: 14 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Focused on results, not contracts',
        quote: "Contracts are between the org and the players. Right now we're focused on performing. Everything else is noise.",
        effects: { morale: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'We explore all our options',
        quote: "I won't commit to anything publicly. We evaluate all options, including bringing in the right fit for the team's future.",
        effects: { morale: -2, fanbase: 1, hype: 1, dramaChance: 10, setsFlags: [{ key: 'org_open_to_trade', durationDays: 21 }] },
      },
    ],
  },

  {
    id: 'post_rivalry_trash_talk_loss',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    conditions: [{ type: 'flag_active', flag: 'interview_trash_talked_rival' }, { type: 'has_rivalry' }],
    prompt: "After your comments before the match, this loss must be painful. Any regrets about what you said?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "I stand by every word",
        quote: "Nothing I said was wrong. Today's result doesn't change how I feel about that team. We'll meet again.",
        effects: { morale: -5, rivalryDelta: 10, fanbase: 2, setsFlags: [{ key: 'rivalry_scorched_earth', durationDays: 30 }] },
      },
      {
        tone: 'HUMBLE',
        label: 'I should have let the game talk',
        quote: "In hindsight, the energy was better spent on preparation. Lesson learned. I'll keep my thoughts private going forward.",
        effects: { morale: 1, fanbase: 2, sponsorTrust: 2, clearsFlags: ['interview_trash_talked_rival'] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Results speak louder than words",
        quote: "We don't need to revisit what was said. We need to look at our own performance and come back better.",
        effects: { morale: 2 },
      },
    ],
  },


  // ==========================================================================
  // ADDITIONAL FLAG-CONDITIONAL TEMPLATES
  // Surfaces when specific drama flags are active — closes orphaned flag chains
  // ==========================================================================

  {
    id: 'crisis_transfer_window_active',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'transfer_window_scouting' }, { type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "Reports suggest your org is actively scouting the transfer market. How do your current players square with that?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "Every org evaluates constantly",
        quote: "Evaluating options is normal professional practice. My players know where I stand — we talk internally. Reading too much into this helps nobody.",
        effects: { morale: -1, fanbase: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "The core of this team isn't going anywhere",
        quote: "We look at the market like any competitive org does. But I want to be clear: the players I believe in know they have my full support. That doesn't change.",
        effects: { morale: 3, sponsorTrust: 2, setsFlags: [{ key: 'management_committed_to_roster', durationDays: 30 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We're building a winner — whatever it takes",
        quote: "I'm not going to apologize for wanting to win. If there are moves that make this team better, I'm going to look at them. That's the job.",
        effects: { morale: -3, hype: 2, dramaChance: 12 },
      },
    ],
  },

  {
    id: 'crisis_burnout_pressure',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'burnout_risk_high' }, { type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "There are concerns that your team's training schedule is affecting player health and wellbeing. How do you respond?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "The players set the pace",
        quote: "No one is forcing anyone to stay late. These players have an extraordinary work ethic and I respect that. We monitor everyone closely.",
        effects: { morale: -2, sponsorTrust: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We're making adjustments",
        quote: "Honestly, we may have pushed too hard. Player health is non-negotiable. We're re-evaluating our practice structure starting this week.",
        effects: { morale: 4, fanbase: 2, sponsorTrust: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: "Elite competition requires sacrifice",
        quote: "Winning at this level demands everything. Every player on this roster signed up for that challenge. We're building something real, and that takes commitment.",
        effects: { morale: -5, hype: 3, dramaChance: 15 },
      },
    ],
  },

  {
    id: 'crisis_roster_exploration_fallout',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'org_open_to_trade' }, { type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "Players are reportedly unsettled following your earlier comments about roster flexibility. Looking back, was that a mistake?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "My words were taken out of context",
        quote: "What I said was about building the best team possible long-term. That's always been our goal. I regret that it was misread.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "I should have framed that better",
        quote: "Looking back, that wasn't the right time or language. My players deserve better clarity from me. I'll be speaking with each of them individually.",
        effects: { morale: 5, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Good players don't worry about their spots",
        quote: "If you're performing, there's nothing to be unsettled about. That's true of every team at every level. Focus on winning and the rest takes care of itself.",
        effects: { morale: -4, hype: 2, dramaChance: 10 },
      },
    ],
  },

  {
    id: 'crisis_igl_authority_undermined',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'igl_authority_undermined' }, { type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "Reports suggest your IGL's shot-calling authority has been significantly reduced. How does that change your team's dynamic?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "Shot-calling structures always evolve",
        quote: "We're always refining how we make in-game decisions. That's not specific to one player — it's about finding what works best for the team at any given moment.",
        effects: { morale: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "We made the right call for the team",
        quote: "When something isn't producing results, you adjust. Our IGL is still a core part of what we do — just in a more clearly defined role now.",
        effects: { morale: -2, hype: 2, sponsorTrust: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We're working through a transition",
        quote: "It's been an adjustment for everyone. I take responsibility for navigating it. We're committed to finding the right structure and I have full faith in our process.",
        effects: { morale: 3, fanbase: 2, dramaChance: 5 },
      },
    ],
  },

  {
    id: 'crisis_burnout_crisis_ignored_fallout',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'burnout_crisis_ignored' }, { type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "Multiple sources suggest your team pushed through serious burnout warning signs. Players weren't given adequate support — what happened?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: "I got it wrong — I should have acted sooner",
        quote: "In hindsight, I prioritized results over people. That's a mistake I own entirely. We're making immediate changes to how we support our players.",
        effects: { fanbase: 4, morale: 3, sponsorTrust: 2, dramaChance: 5 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Players had every resource available to them",
        quote: "We offered support structures and they were available to anyone who needed them. I can't force players to ask for help — but we'll review our approach.",
        effects: { morale: -2, sponsorTrust: -1 },
      },
      {
        tone: 'CONFIDENT',
        label: "The team is stronger for it",
        quote: "Elite teams go through hard stretches. We came out the other side and I believe that process built something real. The players understand that too.",
        effects: { morale: -3, hype: 2, dramaChance: 12 },
      },
    ],
  },


  // ==========================================================================
  // PLAYER — PLAYOFF / PERSONALITY-WEIGHTED (2 templates)
  // ==========================================================================

  {
    id: 'pre_player_big_stage',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'is_playoff_match' }],
    prompt: "This is a playoff match. Some players feel the pressure differently — how does a high-stakes environment affect you personally?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is where I belong",
        quote: "Honestly? I've been waiting for this all season. Regular matches are fine but this — the crowd, everything on the line — this is when I come alive.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "Pressure is a privilege",
        quote: "Being here — in a playoff match — is something a lot of players work their whole careers toward. I don't take that lightly. I just want to do it justice.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1.5, BIG_STAGE: 0.5, FAME_SEEKER: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I treat it like any other match",
        quote: "The more I think about the stakes, the more I overthink. So I run the same prep, the same warmup, the same mindset. Trust the routine and let the game happen.",
        personalityWeights: { INTROVERT: 2, STABLE: 1.5, TEAM_FIRST: 1, BIG_STAGE: 0, FAME_SEEKER: 0.5 },
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'post_player_loss_introvert',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'loss',
    conditions: [{ type: 'team_loss_streak', streakLength: 2 }],
    prompt: "You've been quiet through this rough stretch. How are you really processing what's happening with the team right now?",
    options: [
      {
        tone: 'HUMBLE',
        label: "I'm working through it privately",
        quote: "I don't process things out loud. I go home, I review the footage, I figure out where I failed and I fix it. That's how I'm built.",
        personalityWeights: { INTROVERT: 3, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, sponsorTrust: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: "I haven't been good enough",
        quote: "I'm not going to make excuses. My numbers don't reflect what I'm capable of. I owe this team better and I'm going to deliver it.",
        personalityWeights: { STABLE: 1.5, TEAM_FIRST: 2, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0.5 },
        effects: { morale: 2, fanbase: 3, hype: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "The team doesn't need me to talk — it needs me to play",
        quote: "My job isn't to give speeches. It's to show up and perform. That's what I'm focused on. Everything else is noise.",
        personalityWeights: { INTROVERT: 2.5, STABLE: 1, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2 },
      },
    ],
  },


  // ==========================================================================
  // BRACKET-AWARE TEMPLATES (Phase 1 — 10 templates)
  // Conditions: lower_bracket, upper_bracket, elimination_risk, grand_final,
  //             opponent_dropped_from_upper
  // ==========================================================================

  // 1. lower_bracket_dropped — POST_MATCH after falling to lower bracket
  {
    id: 'lower_bracket_dropped',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "You've been sent to the lower bracket. No more safety net. How does the team regroup from here?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Lower bracket is where legends are made",
        quote: "Every great run has a detour through adversity. We needed this wake-up call. You'll see a different side of this team from here on out.",
        effects: { hype: 4, morale: 3, fanbase: 2, setsFlags: [{ key: 'interview_lower_bracket_narrative', durationDays: 21 }] },
      },
      {
        tone: 'BLAME_SELF',
        label: "That was on me — we'll be ready",
        quote: "The game plan didn't hold up and I take that on myself. I owe this team a better performance from the coaching side. We'll be sharper starting with the next match.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We reset and earn our way back",
        quote: "The upper bracket path is closed for us now. That's fine. We earn our way back one match at a time, and every team we beat along the way will know we meant business.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
    ],
  },

  // 2. lower_bracket_survival — PRE_MATCH when surviving in lower bracket on a streak
  {
    id: 'lower_bracket_survival',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "You've kept your tournament run alive through consecutive wins in the lower bracket. What's driving this team right now?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've found something down here",
        quote: "The lower bracket strips everything away. No comfort zone, no margin for error. And somehow this team keeps answering. I genuinely believe we're hitting our peak at the right time.",
        effects: { hype: 5, morale: 4, fanbase: 2, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "One match, one mindset",
        quote: "We're not thinking about the journey — just the next match. That's the only thing that keeps you alive in lower bracket: absolute focus on what's directly in front of you.",
        effects: { morale: 3, sponsorTrust: 2, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 14 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We thrive when the stakes are highest",
        quote: "Some teams crumble when every match is elimination. Not us. This environment brings out the version of this team that I always knew existed.",
        effects: { hype: 6, fanbase: 3, rivalryDelta: 1, dramaChance: 8 },
      },
    ],
  },

  // 3. elimination_risk_pre — PRE_MATCH must-win framing
  {
    id: 'elimination_risk_pre',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'elimination_risk' }],
    prompt: "One more loss and your tournament is over. How do you prepare a team for a match with everything on the line?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Must-win matches are our specialty",
        quote: "We've been in do-or-die situations before and we know what it takes. I'd rather be in this position — backs against the wall — than cruise through to a final we haven't earned.",
        effects: { hype: 5, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We're going to give everything we have",
        quote: "There's a simplicity to elimination matches that I actually appreciate. You go out and play your absolute best. No overthinking. Just compete.",
        effects: { morale: 3, sponsorTrust: 2, setsFlags: [{ key: 'interview_lower_bracket_narrative', durationDays: 14 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Elimination doesn't scare us",
        quote: "We didn't come to this tournament to go home quietly. Every player in that room knows what's at stake. They'll show you what they're made of today.",
        effects: { hype: 6, fanbase: 3, morale: 3, dramaChance: 8 },
      },
    ],
  },

  // 4. grand_final_pre — PRE_MATCH legacy/history framing
  {
    id: 'grand_final_pre',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'is_grand_final' }],
    prompt: "This is the grand final. You've made it to the biggest match of the tournament. What does it mean to stand here?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We earned this — now we take it",
        quote: "Every match we've played, every decision we've made this tournament has pointed to today. We're ready. I don't want to say much more than that — let the match do the talking.",
        effects: { hype: 6, morale: 5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "It's a privilege and a responsibility",
        quote: "For some of these players, this is the biggest match of their careers. I want them to soak in that feeling and then channel it. We've worked too long for this to be paralyzed by it.",
        effects: { morale: 4, sponsorTrust: 3, fanbase: 4 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We didn't come this far to lose now",
        quote: "This team has clawed through everything this tournament threw at us. There is no version of today where we don't fight for every single round. We're leaving everything on the server.",
        effects: { hype: 7, morale: 4, rivalryDelta: 2, dramaChance: 5 },
      },
    ],
  },

  // 5. grand_final_post_win — POST_MATCH triumph framing
  {
    id: 'grand_final_post_win',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    conditions: [{ type: 'is_grand_final' }],
    prompt: "You're champions. After everything this team went through to get here — what does this moment mean?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is exactly who we are",
        quote: "People will remember what happened today. We weren't just here to compete — we came here to win. And we did. This is the standard we hold ourselves to from now on.",
        effects: { hype: 9, fanbase: 8, morale: 6, setsFlags: [{ key: 'interview_grand_final_champion', durationDays: 30 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm just so proud of this group",
        quote: "I keep looking around at these players. They gave everything — not just today, but all season. This championship belongs to every person who fought for this team. I couldn't be prouder.",
        effects: { fanbase: 9, morale: 6, sponsorTrust: 5 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let this sink in before we talk about what's next",
        quote: "There will be time to analyze this. Right now I just want these players to feel it. Moments like this are why you dedicate your career to this game.",
        effects: { fanbase: 7, morale: 5, hype: 4 },
      },
    ],
  },

  // 6. grand_final_post_loss — POST_MATCH gracious defeat / revenge setup
  {
    id: 'grand_final_post_loss',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    conditions: [{ type: 'is_grand_final' }],
    prompt: "You made the grand final and fell short at the last step. How do you walk away from something like this?",
    options: [
      {
        tone: 'HUMBLE',
        label: "We'll be back for this",
        quote: "This is the hardest thing to process — knowing how close we came. But I refuse to let this team feel like they failed. They made the grand final. That matters. And we'll be back.",
        effects: { fanbase: 5, morale: 4, sponsorTrust: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: "This pain becomes our fuel",
        quote: "Remember this feeling. I want every player on this team to carry it. Because next time we're in this position, we're going to know exactly what it cost us to lose — and we won't let it happen again.",
        effects: { hype: 4, morale: 4, fanbase: 3, setsFlags: [{ key: 'interview_grand_final_loss_fuel', durationDays: 30 }] },
      },
      {
        tone: 'BLAME_SELF',
        label: "I owe this team a championship",
        quote: "These players deserved to lift that trophy today. I'll spend a long time thinking about what I could have done differently. I owe them that honesty — and I owe them another shot.",
        effects: { fanbase: 4, sponsorTrust: 3, morale: 2, dramaChance: 8 },
      },
    ],
  },

  // 7. upper_bracket_confidence — PRE_MATCH commanding narrative
  {
    id: 'upper_bracket_confidence',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'bracket_position', bracketPosition: 'upper' }],
    prompt: "You're still in the upper bracket with an extra life if you need it. How do you keep the team hungry without getting comfortable?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Upper bracket is where we belong",
        quote: "This is where we want to be. The comfort we have isn't complacency — it's confidence built from results. We stay up here by being better than everyone else in front of us.",
        effects: { hype: 4, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We're not looking past anyone",
        quote: "I don't talk about the safety net. The moment you start thinking about what happens if you lose is the moment you start losing. We're focused completely on what's ahead.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We want to stay on this side of the bracket",
        quote: "Nobody in this building wants to go to the lower bracket. That's the honest truth. It's not fear — it's hunger. We're going to fight to stay where we are.",
        effects: { hype: 5, morale: 3, rivalryDelta: 1, dramaChance: 5 },
      },
    ],
  },

  // 8. opponent_dropped_from_upper_pre — PRE_MATCH psychological edge framing
  {
    id: 'opponent_dropped_from_upper_pre',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'opponent_from_upper' }],
    prompt: "Your next opponent just dropped from the upper bracket. They're experienced and hungry — does that change your approach at all?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "They're wounded — we finish it",
        quote: "Teams that drop from the upper bracket come in desperate. That desperation is an edge they have — but it's also a weakness we can exploit. We've prepared for exactly this kind of opponent.",
        effects: { hype: 5, rivalryDelta: 3, morale: 2, dramaChance: 10 },
      },
      {
        tone: 'RESPECTFUL',
        label: "Desperation makes them dangerous",
        quote: "You don't underestimate a team with their back against the wall. They'll play with nothing to lose and everything to gain. We have to match that intensity and be sharper in every key moment.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Same preparation regardless of where they came from",
        quote: "We prepare the same way every match. Where they came from in the bracket doesn't change how we approach the film or the practice sessions. We focus on our game.",
        effects: { morale: 2 },
      },
    ],
  },

  // 9. lower_bracket_vs_dropped_opponent — PRE_MATCH both teams desperate
  {
    id: 'lower_bracket_vs_dropped_opponent',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "You're in the lower bracket, and your opponent just dropped from the upper. Two teams under the gun — what does that dynamic bring out?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've been surviving longer — we're ready for this",
        quote: "We've been living in elimination pressure since we dropped. They're just getting introduced to it. That experience matters. We're conditioned for exactly this kind of match.",
        effects: { hype: 5, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "No favors in a match like this",
        quote: "Two teams who both needed to fight to stay alive. Neither side is getting a gift today. I expect everything from my players — because we'll need everything to get through.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "They fell — we stayed alive. That gap matters.",
        quote: "There's a reason they're on this side of the bracket now. We're going to use every bit of the momentum we've built. Today we show the difference between a team that belongs here and one that slipped.",
        effects: { hype: 6, rivalryDelta: 3, morale: 3, dramaChance: 10 },
      },
    ],
  },

  // 10. comeback_lower_bracket_run — POST_MATCH iron will narrative after extended lower bracket run
  {
    id: 'comeback_lower_bracket_run',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    conditions: [{ type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "Match after match, elimination on the line each time — and this team keeps winning. How do you describe what you've witnessed from this roster through this lower bracket run?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is what we're built for",
        quote: "Every match they've played down here has required everything they had. And they've delivered. This isn't a fluke — this is who we are. Every team left in this tournament should be watching.",
        effects: { hype: 7, morale: 5, fanbase: 4, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "The bracket tested us and we didn't break",
        quote: "I've coached teams that found reasons to fold under this kind of pressure. These players never even considered it. What they've shown through this run — I'll be honest, it's exceeded everything I hoped for.",
        effects: { morale: 5, sponsorTrust: 3, fanbase: 5, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 21 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Nobody believed in us — and we didn't need them to",
        quote: "People wrote us off when we dropped to lower bracket. That's fine. We play for each other, not for outside validation. And we are still here. Every team we've beaten can tell you what that looks like up close.",
        effects: { hype: 8, fanbase: 5, morale: 4, rivalryDelta: 1 },
      },
    ],
  },


  // ==========================================================================
  // ARC-AWARE INTERVIEW TEMPLATES (Phase 2 — 10 templates)
  // All gated by conditions[] using arc flag conventions.
  // Arc flags: arc_redemption_{playerId}, arc_prodigy_{playerId},
  //   arc_contender_{playerId}, arc_fallen_{playerId},
  //   arc_veteran_legacy_{playerId}, arc_identity_{playerId}
  // Modifiers: arc_mod_momentum_{playerId}, arc_mod_fragile_{playerId},
  //   arc_mod_resilient_{playerId}, arc_mod_underdog_{playerId},
  //   arc_mod_clutch_{playerId}
  // ==========================================================================

  {
    id: 'pre_arc_redemption_push',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'arc_redemption_{playerId}' }, { type: 'is_playoff_match' }],
    prompt: "You've spoken about wanting to prove yourself this season. With the playoffs here, does that motivation feel like fuel — or pressure?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is exactly what I needed",
        quote: "I've been waiting for this. The regular season built toward something and I feel it. Pressure turns into fuel when you believe in what you're doing — and right now I believe completely.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "I try not to think about it that way",
        quote: "Honestly, I try not to frame it as proving anything. When you play for validation you make bad decisions. I just want to play the best version of my game and let that be enough.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll show you when I play",
        quote: "I'd rather not talk about what I need to prove. The match is where that conversation happens. Everything else is just noise until the server goes live.",
        personalityWeights: { INTROVERT: 2.5, STABLE: 1, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2, hype: 1 },
      },
    ],
  },

  {
    id: 'post_arc_fragile_honesty',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'loss',
    conditions: [{ type: 'flag_active', flag: 'arc_mod_fragile_{playerId}' }, { type: 'team_loss_streak', streakLength: 2 }],
    prompt: "You've had a difficult stretch and this was another tough result. There's a visible weight on you right now. How are you actually doing?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: "I'm not where I need to be",
        quote: "I won't hide it. I'm not performing the way this team needs. I know what I'm capable of and I'm not hitting it right now. That's on me to fix and I'm working on it.",
        personalityWeights: { STABLE: 2, TEAM_FIRST: 1.5, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0.5 },
        effects: { morale: 2, fanbase: 3, hype: 2, setsFlags: [{ key: 'arc_mod_resilient_{playerId}', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm going through something but I'm still here",
        quote: "It's been a rough stretch. I'm not going to pretend otherwise. But I keep showing up because this team deserves that from me. I trust the process — I've just got to keep at it.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 1.5, INTROVERT: 2, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Focus on the team, not me",
        quote: "I appreciate the question but this isn't about me. The team needs better results and I need to contribute more to that. What's going on inside? That stays private.",
        personalityWeights: { INTROVERT: 3, TEAM_FIRST: 1, STABLE: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'pre_arc_contender_expectations',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'arc_contender_{playerId}' }, { type: 'elimination_risk' }],
    prompt: "Your team came in with championship expectations. Now you're one loss from going home. How do you manage expectations when the gap between narrative and reality is this sharp?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Expectations don't change — we deliver today",
        quote: "We don't renegotiate standards because the path got harder. This team came here to win a championship and we're still capable of doing that. Today starts that answer.",
        effects: { hype: 4, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We refocus on what we can control",
        quote: "Expectations are conversation for the offseason. Right now there's one match in front of us and we're going to pour everything into it. The narrative takes care of itself if we perform.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: "I set expectations — it's on me to back them up",
        quote: "I was vocal about what I believed this team could achieve. That pressure lives with me as the manager. My players shouldn't feel that weight today. I'll carry it — they just need to compete.",
        effects: { fanbase: 4, sponsorTrust: 2, morale: 3 },
      },
    ],
  },

  {
    id: 'post_arc_momentum_confidence',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'win',
    conditions: [{ type: 'flag_active', flag: 'arc_mod_momentum_{playerId}' }, { type: 'team_win_streak', streakLength: 2 }],
    prompt: "You've been in outstanding form. There's a real feeling right now that something special is happening. What does this stretch feel like from the inside?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Everything is clicking right now",
        quote: "Honestly? I feel unstoppable. I know that sounds like a lot but every decision I'm making is the right one. I'm in a rhythm and I want to protect it by not overthinking it.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 4, hype: 5, fanbase: 3, setsFlags: [{ key: 'arc_mod_momentum_{playerId}', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm focused on not wasting it",
        quote: "When form hits like this, the worst thing you can do is talk about it. I just want to stay in the moment and keep delivering. The team is counting on this version of me right now.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'm just playing my game",
        quote: "I haven't changed anything. Same prep, same mindset. I just try to play as simply as possible and trust that my reads are right. When you stop second-guessing yourself, things start clicking.",
        personalityWeights: { INTROVERT: 2, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, hype: 2 },
      },
    ],
  },

  {
    id: 'pre_arc_underdog_chip',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'arc_mod_underdog_{playerId}' }],
    prompt: "Not many people expected you to still be here. Has that changed how you think about yourself — or this tournament?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "The doubt was the best thing for me",
        quote: "Everyone who counted us out? I've kept a list. Not out of bitterness — out of gratitude. You needed that to wake something up in me. I play differently when no one believes in me.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, TEAM_FIRST: 0.5, INTROVERT: 0 },
        effects: { morale: 4, hype: 5, fanbase: 2, rivalryDelta: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "I stopped caring about what others expect",
        quote: "At a certain point you let go of the outside narrative and play for yourself and your teammates. That was freeing. I'm not trying to prove anyone wrong — I'm just here to compete.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I try not to focus on other people's narratives",
        quote: "The expectations others have for me are noise. I don't play for predictions or rankings. I play because I want to win. Everything else is irrelevant the moment the match starts.",
        personalityWeights: { INTROVERT: 2.5, STABLE: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3 },
      },
    ],
  },

  {
    id: 'post_arc_resilient_pride',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    conditions: [{ type: 'flag_active', flag: 'arc_mod_resilient_{playerId}' }, { type: 'bracket_position', bracketPosition: 'lower' }],
    prompt: "You've watched one of your players come back from real adversity through this tournament run. What have you seen in them that the stats don't capture?",
    options: [
      {
        tone: 'HUMBLE',
        label: "Their character showed when things were hardest",
        quote: "The numbers will never tell you what it took for them to keep showing up when everything was against them. That kind of mental strength — you can't coach it. I'm incredibly proud of who they've been through this.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: "I always believed they'd find this version of themselves",
        quote: "I never stopped believing in them, even when it looked rough from the outside. The player I've seen in this tournament is the one I signed up for. They've finally given themselves permission to be that.",
        effects: { morale: 5, hype: 3, fanbase: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let them tell that story — it's not mine to tell",
        quote: "I'm not going to narrate their journey for them. What they've done through this tournament has been remarkable and they deserve to own it entirely. Ask them.",
        effects: { morale: 3, fanbase: 2 },
      },
    ],
  },

  {
    id: 'pre_arc_prodigy_pressure',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'arc_prodigy_{playerId}' }, { type: 'is_playoff_match' }],
    prompt: "Everyone has been calling you the next big thing since this tournament started. Heading into a playoff match — does the label help or does it start to feel like a weight?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I want to live up to it and then some",
        quote: "I've heard the comparisons and the predictions and honestly? I want to exceed every single one of them. The label is motivation. Let people expect great things — I'll deliver them.",
        personalityWeights: { FAME_SEEKER: 3, BIG_STAGE: 2, STABLE: 0, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 4, hype: 5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "I try not to think about what people call me",
        quote: "Prodigy, breakout star — whatever. Labels come and go. What matters is what I do in the rounds. I just focus on competing and let others write the story.",
        personalityWeights: { TEAM_FIRST: 1.5, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's noise I've learned to tune out",
        quote: "Early on it got in my head a little, but I've learned to turn the noise off. My process is the same today as it was in scrims last month. The stakes don't change the preparation.",
        personalityWeights: { INTROVERT: 2, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, hype: 1 },
      },
    ],
  },

  {
    id: 'pre_arc_veteran_legacy_focus',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'arc_veteran_legacy_{playerId}' }, { type: 'is_grand_final' }],
    prompt: "You've been chasing something like this for a long time. Standing at the grand final — what does this moment feel like compared to everything that came before?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Everything I've built has led here",
        quote: "Every tournament, every season, every time I had to start over — it all pointed to a moment like this. I'm not nervous. I'm grateful. And I'm going to make sure it counts.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 1, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 5, hype: 6, fanbase: 4, setsFlags: [{ key: 'interview_veteran_legacy_hinted', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm trying not to make it bigger than the match",
        quote: "You don't want to be so absorbed in the weight of the moment that you forget to actually compete. I'm aware of what this means, but right now the only thing that matters is this match.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll process it after. Right now I just want to play",
        quote: "The career retrospective can wait until after the trophy is decided. I've spent a lot of years getting here and I'm not going to let the emotion of the moment take me out of competing. We win first. Then we reflect.",
        personalityWeights: { INTROVERT: 2, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0 },
        effects: { morale: 4, hype: 2 },
      },
    ],
  },

  {
    id: 'post_arc_fallen_reflection',
    context: 'POST_MATCH',
    subjectType: 'player',
    matchOutcome: 'loss',
    conditions: [{ type: 'flag_active', flag: 'arc_fallen_{playerId}' }, { type: 'team_loss_streak', streakLength: 2 }],
    prompt: "This has been a difficult stretch for you personally. Some are saying this might not be the same player we saw a year ago. How do you respond to that?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "They're going to be wrong",
        quote: "Anyone writing my career summary right now is going to have to update it. I know who I am and what I'm capable of. This stretch isn't the definition — it's a detour. I'll get back to where I belong.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 3, hype: 3, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "I'm being honest with myself about where I'm at",
        quote: "I'm not going to argue with the results. I haven't been playing well enough. But I've been through hard patches before and I know what it takes to come out the other side. I'm still fighting.",
        personalityWeights: { TEAM_FIRST: 1.5, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: "They're not wrong — and that's going to change",
        quote: "The form isn't there right now. I know it, the team knows it, and apparently the whole scene knows it. I'm not going to defend a performance level I haven't been hitting. But this version of me isn't the final version.",
        personalityWeights: { STABLE: 2, TEAM_FIRST: 1.5, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 2, fanbase: 4, hype: 2, setsFlags: [{ key: 'arc_mod_underdog_{playerId}', durationDays: 14 }] },
      },
    ],
  },

  {
    id: 'pre_arc_clutch_expectation',
    context: 'PRE_MATCH',
    subjectType: 'player',
    conditions: [{ type: 'flag_active', flag: 'arc_mod_clutch_{playerId}' }],
    prompt: "You've built a reputation for delivering in the biggest moments this tournament. Does knowing that change how you approach pressure situations — or does it just add to the weight?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I want the ball in the clutch",
        quote: "Put me in. Seriously. I've been in those situations enough now that they don't feel like pressure — they feel like opportunity. I want to be the one making the calls when it matters most.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 4, hype: 4, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "The team delivers — I just try to do my part",
        quote: "Clutch reputation is a team thing. I'm in positions to make big plays because my teammates set them up. I'd rather be known as someone who made everyone else better in the key moments.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Reputation doesn't win rounds — execution does",
        quote: "People talk about clutch moments but the truth is you just try to make the right call every time. Whether it's a pressure situation or not, the preparation is the same. Execute the fundamentals.",
        personalityWeights: { STABLE: 2, INTROVERT: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0 },
        effects: { morale: 3, sponsorTrust: 1 },
      },
    ],
  },

];
