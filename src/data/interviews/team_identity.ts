import type { InterviewTemplate } from '../../types/interview';

export const TEAM_IDENTITY_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // TEAM IDENTITY (Phase 4b — 6 templates)
  // ==========================================================================

  // PRE_MATCH identity templates

  // 1. pre_star_carry_identity — fires when team_identity_star_carry flag active
  {
    id: 'pre_star_carry_identity',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'team_identity_star_carry',
    prompt: "It looks like this team is being built around one player's performance right now. Is that a conscious decision — or just where the form is taking you?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We play through our best player",
        quote: "When someone is performing at that level, you build around it. It's not a crutch — it's smart game management. The rest of the team understands their role in that.",
        effects: { hype: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "The team enables the individual",
        quote: "I'd push back on that framing a little. Every player on this roster creates the conditions for that performance to happen. It's still a team effort — it just shows up differently in the stats.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I focus on outcomes, not narratives",
        quote: "What I care about is results. If the way we're playing produces them, I'm not going to apologize for it or over-explain it. We'll see how it looks after the match.",
        effects: { morale: 1 },
      },
    ],
  },

  // 2. pre_balanced_confidence — fires on win_streak_2plus when team_identity_balanced flag active
  {
    id: 'pre_balanced_confidence',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'win_streak_2plus',
    requiresActiveFlag: 'team_identity_balanced',
    prompt: "Your team has been remarkably consistent. Chemistry clearly isn't an issue — how do you maintain that cohesion heading into a high-stakes match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Consistency is a culture thing",
        quote: "You don't manufacture this in a week. We've been building this environment deliberately — the way we communicate, the way we hold each other accountable. It shows up in the results.",
        effects: { morale: 4, hype: 3, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We just focus on the process",
        quote: "Honestly, we don't talk about chemistry much — we just do the things that produce it. Good preparation, honest communication, trusting each other in the moment. It compounds over time.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Ask me that after today",
        quote: "Every match is a new test. I don't take any of it for granted — consistency doesn't mean permanent. We'll see today whether what we've built holds up.",
        effects: { morale: 2 },
      },
    ],
  },

  // 3. pre_fragile_narrative — fires when team_identity_fragile flag active
  {
    id: 'pre_fragile_narrative',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'team_identity_fragile',
    prompt: "There's a growing narrative that this team crumbles under pressure. Early hype, disappointing results. How do you respond to that characterization?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "We'll let the match answer that",
        quote: "I could give you a long response, but it wouldn't satisfy anyone who's already made up their mind. We've heard the criticism. Now we're going to play. Watch.",
        effects: { hype: 4, morale: 3, dramaChance: 10 },
      },
      {
        tone: 'BLAME_SELF',
        label: "We haven't been good enough",
        quote: "It's a fair critique. We haven't performed to the standard we set for ourselves. I'm not going to spin that. What I can tell you is the team is aware of it and we're working on it.",
        effects: { morale: 2, sponsorTrust: 3, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "External narratives don't change our preparation",
        quote: "We don't talk about what's being said outside. Our focus is on the match, the opponent, the execution. Media narratives are for people who aren't in the building.",
        effects: { morale: 2 },
      },
    ],
  },

  // POST_MATCH identity templates (IDs must be added to winIds/lossIds in InterviewService)

  // 4. post_resilient_lower_bracket — POST_MATCH win, lower_bracket + team_identity_resilient
  {
    id: 'post_resilient_lower_bracket',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'lower_bracket',
    matchOutcome: 'win',
    requiresActiveFlag: 'team_identity_resilient',
    prompt: "This team just keeps finding ways to survive in the lower bracket. What is it about this group that makes you resilient when elimination is on the line?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've been here before",
        quote: "Adversity doesn't break us — it clarifies us. Every time we've been written off, we've found a way. I don't think that's a coincidence anymore. That's who we are.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 1, TEAM_FIRST: 1, INTROVERT: 0 },
        effects: { morale: 5, hype: 5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "We trust each other in those moments",
        quote: "When it's elimination, you go back to basics. Trust your teammates. Trust the calls. Don't spiral. We've built enough together that those habits kick in when we need them most.",
        personalityWeights: { TEAM_FIRST: 3, STABLE: 2, INTROVERT: 2, BIG_STAGE: 0.5, FAME_SEEKER: 0.5 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2, setsFlags: [{ key: 'arc_mod_resilient_{playerId}', durationDays: 21 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We just keep playing",
        quote: "I don't analyze it while it's happening. You just compete. When it's over you can think about what it means. Right now I'm just glad we're still in it.",
        personalityWeights: { INTROVERT: 3, STABLE: 2, TEAM_FIRST: 1, BIG_STAGE: 0, FAME_SEEKER: 0 },
        effects: { morale: 3, fanbase: 2 },
      },
    ],
  },

  // 5. post_star_carry_spotlight — POST_MATCH win, team_identity_star_carry (player interview)
  {
    id: 'post_star_carry_spotlight',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'team_identity_star_carry',
    matchOutcome: 'win',
    prompt: "Your team is leaning heavily on your individual performance right now. Is that a role you're comfortable carrying — or does it add pressure you didn't sign up for?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I want the ball in pressure moments",
        quote: "This is what I've trained for. When the team needs a play, I want to be the person making it. I'm not running from that responsibility — I'm embracing it.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 3, STABLE: 1, TEAM_FIRST: 0, INTROVERT: 0 },
        effects: { morale: 5, hype: 4, fanbase: 2, dramaChance: 8 },
      },
      {
        tone: 'HUMBLE',
        label: "The team makes my plays possible",
        quote: "I appreciate the kind framing, but the team is doing more than people realize. My numbers look the way they do because of how everyone else is playing around me. This is still a collective.",
        personalityWeights: { TEAM_FIRST: 3, STABLE: 2, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'm just trying to contribute",
        quote: "I don't think about it in those terms. I just focus on my preparation, execute my role, and trust the team to do the same. Whatever the narrative becomes after that — that's for other people to figure out.",
        personalityWeights: { INTROVERT: 3, STABLE: 2, TEAM_FIRST: 1, BIG_STAGE: 0, FAME_SEEKER: 0 },
        effects: { morale: 3 },
      },
    ],
  },

  // 6. post_fragile_elimination — POST_MATCH loss, elimination_risk + team_identity_fragile
  {
    id: 'post_fragile_elimination',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'elimination_risk',
    matchOutcome: 'loss',
    requiresActiveFlag: 'team_identity_fragile',
    prompt: "With everything on the line, the cracks in this team are showing. What needs to change — and do you believe this group can actually make those changes before it's too late?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: "I take responsibility for where we are",
        quote: "This is on me as much as anyone. The environment we're playing in, the decisions made — I own my part in this. What I can tell you is the team isn't giving up, and neither am I.",
        effects: { morale: 3, sponsorTrust: 3, fanbase: 2, clearsFlags: ['media_narrative_fragile'] },
      },
      {
        tone: 'CONFIDENT',
        label: "We have one more push in us",
        quote: "I believe in this team. Not because it's easy to say — but because I've seen what they're capable of when it clicks. We need to execute. The ability is there. It's about bringing it out.",
        effects: { hype: 3, morale: 4, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We'll have full conversations internally",
        quote: "There are things I need to address with the team that aren't appropriate to discuss publicly. What I can say is that we're aware of what needs to happen and we're taking it seriously.",
        effects: { morale: 2, sponsorTrust: 2 },
      },
    ],
  },

  // Arc 5: Historic First Title — seed interview
  {
    id: 'post_win_historic_milestone',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    matchOutcome: 'win',
    prompt: "This could be the most significant result in this organization's history. What does this moment mean for everyone who has been part of this journey?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is validation — and just the beginning",
        quote: "We've been building toward something like this. This is validation — of the roster, the coaching staff, the org's vision. And this is just the beginning of what we intend to do.",
        effects: { hype: 8, fanbase: 6, morale: 5, setsFlags: [{ key: 'interview_historic_win', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "This is for everyone who believed",
        quote: "I keep thinking of everyone who worked to make this possible — players, staff, the fans who stuck with us through the tough stretches. This result belongs to all of them.",
        effects: { fanbase: 7, morale: 4, sponsorTrust: 4 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let's take a moment before thinking about what's next",
        quote: "It's a beautiful moment right now. I don't want to over-analyze it. Let's just take a breath and feel this before the next chapter starts.",
        effects: { fanbase: 5, morale: 4, hype: 3 },
      },
    ],
  },


  // ==========================================================================
  // KICKOFF FLAG CONSEQUENCES (4 templates — gate on org_high_expectations,
  // manager_development_focused, manager_underdog_mindset)
  // ==========================================================================

  {
    id: 'pre_high_expectations_pressure',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'always',
    requiresActiveFlag: 'org_high_expectations',
    prompt: "You set a high bar at the start of the season. Does that statement feel like motivation or pressure heading into today's match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "The standard hasn't changed",
        quote: "We said what we said. Every match is a step toward that goal. Today is no different.",
        effects: { hype: 3, morale: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's fuel, not pressure",
        quote: "We don't carry it as pressure. The team uses it as a north star. That's how it was always intended.",
        effects: { morale: 3, dramaChance: 5 },
      },
      {
        tone: 'HUMBLE',
        label: 'We take it one match at a time',
        quote: "The season goal is there. But you can't win the whole thing in one match. So today, we focus on today.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
    ],
  },

  {
    id: 'post_win_development_focus',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    matchOutcome: 'win',
    requiresActiveFlag: 'manager_development_focused',
    prompt: "You've talked about a development-first philosophy this season. Does a win like this feel like validation of that approach?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'This is what patient development looks like',
        quote: "Exactly. We didn't rush. We trusted the process and the players. Wins like this are the payoff.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'The players deserve the credit',
        quote: "I believe in the approach, but it's the players who actually put it into practice. This is their win.",
        effects: { morale: 4, sponsorTrust: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'One step at a time',
        quote: "We still have a long way to go. This is encouraging but we're not getting ahead of ourselves.",
        effects: { morale: 2, sponsorTrust: 2 },
      },
    ],
  },

  {
    id: 'pre_underdog_narrative',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'always',
    requiresActiveFlag: 'manager_underdog_mindset',
    prompt: "Most analysts aren't picking your team to go deep this season. How do you use that heading into today?",
    options: [
      {
        tone: 'HUMBLE',
        label: "We like it that way",
        quote: "Low expectations? Fine by us. We'll keep our heads down and let the bracket tell the story.",
        effects: { morale: 4, hype: 2, dramaChance: 5 },
      },
      {
        tone: 'CONFIDENT',
        label: "They'll change their minds",
        quote: "They're welcome to keep sleeping on us. Every time we prove a doubter wrong, this team gets stronger.",
        effects: { hype: 5, morale: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We don't watch the analysis",
        quote: "I genuinely don't follow what analysts say about us. We're too busy preparing. That's probably why we're still here.",
        effects: { morale: 3, sponsorTrust: 1 },
      },
    ],
  },

  {
    id: 'crisis_championship_mandate_streak',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'loss_streak_3plus',
    requiresActiveFlag: 'org_high_expectations',
    prompt: "You declared you'd be in the finals at the start of the season. Three straight losses in — how do you justify that statement now?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "The season isn't over",
        quote: "Three losses doesn't erase a full season of work. The standard is still there. We'll get back to it.",
        effects: { morale: 3, hype: 2, dramaChance: 15 },
      },
      {
        tone: 'HUMBLE',
        label: "We need to earn it, not declare it",
        quote: "Looking back, maybe we spoke too soon. We need to show it on the server — not in press conferences.",
        effects: { morale: 2, fanbase: -1, clearsFlags: ['org_high_expectations'] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'm focused on the next match",
        quote: "I'm not going to re-litigate what I said months ago. There are matches left. That's where my head is.",
        effects: { morale: 1 },
      },
    ],
  },

];
