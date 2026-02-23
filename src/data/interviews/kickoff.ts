import type { InterviewTemplate } from '../../types/interview';

export const KICKOFF_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // KICKOFF (1 template — fires once at season start)
  // ==========================================================================

  {
    id: 'kickoff_season_opener',
    context: 'KICKOFF',
    subjectType: 'manager',
    prompt: "You've just taken the helm for the 2026 VCT season. What message do you want to send to the league?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're here to win",
        quote: "We're not here to participate. Every team in this league should expect to see us in the finals. That's the standard we're setting — starting today.",
        effects: {
          hype: 5,
          fanbase: 3,
          dramaChance: 10,
          setsFlags: [
            { key: 'org_high_expectations', durationDays: 90 },
            { key: 'team_identity_star_carry', durationDays: 60 },
          ],
        },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Build something together',
        quote: "We've got a talented group and a lot of work ahead of us. My focus is on building a team that plays for each other — something this region can be proud of.",
        effects: {
          morale: 3,
          sponsorTrust: 2,
          setsFlags: [
            { key: 'manager_development_focused', durationDays: 90 },
            { key: 'team_identity_balanced', durationDays: 60 },
          ],
        },
      },
      {
        tone: 'HUMBLE',
        label: "We'll let our play speak",
        quote: "Honestly? I'm not here to make promises. We're going to put in the work, stay humble, and when we're deep in the bracket, you'll understand why we didn't say much today.",
        effects: {
          morale: 2,
          dramaChance: 5,
          setsFlags: [
            { key: 'team_identity_resilient', durationDays: 60 },
            { key: 'manager_underdog_mindset', durationDays: 90 },
          ],
        },
      },
    ],
  },


  // ==========================================================================
  // KICKOFF TOURNAMENT ARCS — INTERVIEW SEEDS & FLAG-CONDITIONAL RESPONSES
  // ==========================================================================

  // Arc 1: Veteran Legacy Pressure — seed interview
  {
    id: 'post_player_veteran_return',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'always',
    prompt: "You've been competing at the top level for years. What does a win like this mean at this stage of your career?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Proving I still belong here",
        quote: "This is what it's about — proving I still belong here. Every championship I chase now feels bigger than the last. I'm not done and I intend to remind everyone of that.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 0.5, TEAM_FIRST: 0.5, INTROVERT: 0 },
        effects: { morale: 2, hype: 4, fanbase: 2, setsFlags: [{ key: 'interview_veteran_legacy_hinted', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "The work paid off — that's all",
        quote: "Honestly, it just means the work paid off. I've been around long enough to know wins don't last — you have to stay hungry and keep earning them.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 1.5, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Legacy? I'm just focused on next match",
        quote: "I don't think too much about legacy. There's another match to prepare for. Right now I just want to keep contributing to this team and let everything else sort itself out.",
        personalityWeights: { INTROVERT: 2, STABLE: 1.5, TEAM_FIRST: 1, BIG_STAGE: 0, FAME_SEEKER: 0.5 },
        effects: { morale: 2 },
      },
    ],
  },

  // Arc 1: Veteran Legacy Pressure — flag-conditional follow-up
  {
    id: 'pre_championship_pact_pressure',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'pre_playoff',
    conditions: [{ type: 'flag_active', flag: 'veteran_championship_pact' }],
    prompt: "You publicly committed to a final championship run with your veteran player. With the pressure that puts on everyone, how are they actually holding up?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "They thrive on pressure like this",
        quote: "That's exactly the kind of player they are — the bigger the moment, the more focused they get. The commitment was real and they're delivering on it every day in practice.",
        effects: { hype: 3, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "One match at a time — always",
        quote: "We've talked about managing expectations. The commitment is real but we're taking it one match at a time. Legacy is written by results, not words.",
        effects: { morale: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I meant what I said — ask me after we win",
        quote: "I'm not going to revisit that statement in the press. I meant every word and we're acting on it every day. Let the result do the talking.",
        effects: { morale: 1, hype: 1 },
      },
    ],
  },

  // Arc 2: Breakout Star Hype — flag-conditional interview after prodigy_hype fires
  {
    id: 'post_player_breakout_media',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'prodigy_hype_{playerId}' }],
    prompt: "Your name is everywhere right now — analysts, fans, sponsors are all talking about you. How do you handle becoming the story?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is what I've worked for",
        quote: "Honestly? I love it. This is what I've worked toward. I want to be the name that defines what this team — and this region — is capable of.",
        personalityWeights: { FAME_SEEKER: 3, BIG_STAGE: 2, STABLE: 0, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { hype: 6, fanbase: 4, morale: -3, setsFlags: [{ key: 'ego_media_distraction_{playerId}', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I try not to read it",
        quote: "It's flattering but I genuinely try not to read it. My job is to help this team win, not manage my social media presence. The hype doesn't win rounds.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'm just focused on the next match",
        quote: "The hype cycle isn't something I can control. I can only control how I play. So that's where my head stays.",
        personalityWeights: { INTROVERT: 3, STABLE: 1, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2 },
      },
    ],
  },

  // Arc 3: Triple-Elimination Mental Fatigue — seed interview
  {
    id: 'pre_triple_elim_fatigue',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'loss_streak_2plus',
    prompt: "Your team has had to fight through the elimination bracket to stay alive. Physically and mentally, how are they holding up heading into this must-win match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Battle-hardened — we're sharper for it",
        quote: "Every match we've survived has stress-tested us. The teams that fall apart under elimination pressure aren't in our situation. We've been forged by this bracket.",
        effects: { morale: 3, hype: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "It's taken a toll, but I believe in their resilience",
        quote: "There's no hiding it — the schedule has taken a toll. But I've seen what these players are made of when it counts. I'm not worried.",
        effects: { morale: 2, sponsorTrust: 1, setsFlags: [{ key: 'interview_mid_bracket_grind', durationDays: 14 }] },
      },
      {
        tone: 'BLAME_SELF',
        label: "I should have managed their load better",
        quote: "In hindsight, I could have managed their workload better in earlier rounds. Now I'm asking them to dig even deeper. That's on me and I'll make it right.",
        effects: { fanbase: 2, morale: -1, dramaChance: 8, setsFlags: [{ key: 'interview_mid_bracket_grind', durationDays: 14 }] },
      },
    ],
  },

  // Arc 4: IGL Community Scapegoat — flag-conditional player interview
  {
    id: 'post_igl_public_pressure',
    context: 'CRISIS',
    subjectType: 'player',
    condition: 'drama_active',
    conditions: [{ type: 'flag_active', flag: 'igl_authority_undermined' }],
    prompt: "Fans have been extremely vocal about in-game leadership this tournament. How do you block out community criticism when you're already under match pressure?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Critics are background noise",
        quote: "You get to a point where the critics are background noise. I trust my process and my teammates trust me — that's what matters. The discourse doesn't get in the server with us.",
        personalityWeights: { BIG_STAGE: 2, FAME_SEEKER: 1.5, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "Some of it hits — but I keep coming back",
        quote: "It's hard, honestly. The community has opinions and some of them hit. But I keep coming back to: are my teammates still in the fight? If yes, then so am I.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 3, sponsorTrust: 1 },
      },
      {
        tone: 'BLAME_SELF',
        label: "Some of the criticism is fair",
        quote: "I'll be honest — some of the criticism is fair. I can be better. I'm not asking for patience for my ego. I'm asking for it because this team deserves the best version of me.",
        personalityWeights: { STABLE: 1.5, TEAM_FIRST: 1.5, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0 },
        effects: { morale: 2, fanbase: 4, hype: 2, setsFlags: [{ key: 'igl_seeking_redemption', durationDays: 21 }] },
      },
    ],
  },

  // Arc 4: IGL Redemption — flag-conditional follow-up
  {
    id: 'post_igl_redemption_chance',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'igl_seeking_redemption' }],
    prompt: "You spoke earlier about wanting to earn back trust through results. After today's performance, do you feel like you're getting there?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Today I showed what I'm capable of",
        quote: "Today I showed what I'm capable of. I'm not the player the critics wanted to write off. And I'm not done proving it.",
        personalityWeights: { BIG_STAGE: 2, FAME_SEEKER: 1.5, STABLE: 1, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 5, hype: 3, fanbase: 2, clearsFlags: ['igl_seeking_redemption'] },
      },
      {
        tone: 'HUMBLE',
        label: "Getting there — but the work isn't done",
        quote: "I'm getting there. But I won't feel fully back until we win something that actually matters. One good performance isn't the answer.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 3, sponsorTrust: 1 },
      },
      {
        tone: 'BLAME_SELF',
        label: "Progress, but still things to fix",
        quote: "It's progress, but I know I still have things to fix. I'm not celebrating one good match. The work continues.",
        personalityWeights: { STABLE: 1.5, TEAM_FIRST: 1.5, INTROVERT: 1.5, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 2, fanbase: 2 },
      },
    ],
  },

];
