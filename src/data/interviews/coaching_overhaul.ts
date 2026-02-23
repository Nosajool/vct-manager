import type { InterviewTemplate } from '../../types/interview';

export const COACHING_OVERHAUL_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // COACHING OVERHAUL ARC (6 templates)
  // ==========================================================================

  {
    id: 'crisis_coach_dismissal_response',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'coaching_overhaul_active' }],
    prompt: "You've made the decision to change coaches mid-season. What's driving that call?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We needed a change.',
        quote: "This wasn't a reactive decision — it was the right one. Sometimes you have to make hard calls to protect the ceiling of this team. We're doing that now.",
        effects: {
          hype: 3,
          setsFlags: [{ key: 'coach_change_backed_publicly', durationDays: 14 }],
        },
      },
      {
        tone: 'HUMBLE',
        label: "It was a hard call. We own it.",
        quote: "I won't pretend this was easy. We owe it to the players and our fans to be honest — we needed a new direction, and that starts with us taking ownership of this change.",
        effects: {
          sponsorTrust: 2,
          morale: 1,
          setsFlags: [{ key: 'org_owns_change', durationDays: 14 }],
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'The results speak for themselves.',
        quote: "Look at where we were. Look at where we need to be. The results speak for themselves.",
        effects: {
          dramaChance: 10,
          fanbase: -2,
        },
      },
    ],
  },

  {
    id: 'crisis_star_player_on_new_coach',
    context: 'CRISIS',
    subjectType: 'player',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'coaching_overhaul_active' }],
    prompt: "Your team just changed coaches. How are you feeling about the transition?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'I adapt. Always have.',
        quote: "Change is part of this game. I've been through rosters, metas, everything. I adapt. Always have. This is no different.",
        effects: {
          morale: 3,
          setsFlags: [{ key: 'star_bought_in_{playerId}', durationDays: 30 }],
        },
        personalityWeights: {
          FAME_SEEKER: 2,
          STABLE: 2,
          BIG_STAGE: 1,
          TEAM_FIRST: 1,
          INTROVERT: 0,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Change is hard, but we work through it.',
        quote: "It's a transition. Nobody said it was going to be easy. But this team has always found ways to work through adversity together.",
        effects: {
          morale: 2,
          dramaChance: 5,
        },
        personalityWeights: {
          TEAM_FIRST: 2,
          STABLE: 2,
          INTROVERT: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'I focus on what I control.',
        quote: "Coaching decisions are above my pay grade. I focus on what I can control — my performance, my prep, my mindset. Everything else is noise.",
        effects: {
          hype: 2,
          setsFlags: [{ key: 'star_skeptical_{playerId}', durationDays: 21 }],
        },
        personalityWeights: {
          BIG_STAGE: 2,
          FAME_SEEKER: 1,
          INTROVERT: 1,
          TEAM_FIRST: 0,
          STABLE: 0,
        },
      },
    ],
  },

  {
    id: 'pre_match_new_regime_check',
    context: 'PRE_MATCH',
    subjectType: 'coach',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'strict_regime_active' }],
    prompt: "You've implemented a noticeably stricter practice structure. What's the philosophy?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Elite performance requires elite discipline.',
        quote: "You don't get to the top by being comfortable. Elite performance requires elite discipline, and every player in that room has signed up for that standard.",
        effects: {
          hype: 3,
          dramaChance: 5,
          setsFlags: [{ key: 'coach_backing_structure', durationDays: 14 }],
        },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Every player here is a professional. We reinforced that.',
        quote: "Every player here is a professional — they know what it takes. We didn't change who they are, we reinforced it. The structure is just clarity.",
        effects: {
          morale: 2,
          sponsorTrust: 2,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Talent without structure is wasted potential.',
        quote: "I've seen incredible talent go nowhere because there was no system around it. Talent without structure is wasted potential. We're not wasting potential here.",
        effects: {
          morale: 1,
          fanbase: 2,
        },
      },
    ],
  },

  {
    id: 'post_match_system_working',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'coaching_system_peak' }],
    prompt: "The team looks completely transformed. What changed?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We trusted the process. Players committed.',
        quote: "We trusted the process. The players committed to a new system, put in the work, and now you're seeing what that looks like. This is what we built toward.",
        effects: {
          hype: 5,
          fanbase: 3,
          sponsorTrust: 2,
        },
      },
      {
        tone: 'HUMBLE',
        label: 'Credit goes to the players. They bought into a hard system.',
        quote: "Credit goes entirely to the players. They bought into a system that asked a lot of them, and they delivered. I'm just proud to work with this group.",
        effects: {
          morale: 3,
          fanbase: 3,
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'We took it one day at a time.',
        quote: "Honestly? We took it one day at a time. We didn't try to change everything overnight. Small improvements compounded and here we are.",
        effects: {
          morale: 2,
          hype: 2,
        },
      },
    ],
  },

  {
    id: 'crisis_star_conflict_public',
    context: 'CRISIS',
    subjectType: 'player',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'star_coach_conflict_{playerId}' }],
    prompt: "There are reports of tension between you and the coaching staff. Care to address that?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'I keep things in-house.',
        quote: "Whatever happens in the practice facility stays in the practice facility. I'm not going to air internal stuff in front of a microphone.",
        effects: {
          morale: 1,
          dramaChance: 5,
        },
        personalityWeights: {
          STABLE: 2,
          INTROVERT: 2,
          TEAM_FIRST: 1,
          FAME_SEEKER: 0,
          BIG_STAGE: 0,
        },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'I want to play my game. Full stop.',
        quote: "I'll be direct: I want to play my game. I was brought here because of what I do. If there's friction, it's because I refuse to water that down. Full stop.",
        effects: {
          hype: 5,
          fanbase: 3,
          dramaChance: 15,
          setsFlags: [{ key: 'star_conflict_public', durationDays: 7 }],
        },
        personalityWeights: {
          FAME_SEEKER: 2,
          BIG_STAGE: 2,
          INTROVERT: 0,
          TEAM_FIRST: 0,
          STABLE: 0,
        },
      },
      {
        tone: 'HUMBLE',
        label: "We have different visions. We're working through it.",
        quote: "Me and the coaching staff have different visions on some things — that's real. But that doesn't mean we can't work through it. We're professionals.",
        effects: {
          morale: 2,
          sponsorTrust: 1,
        },
        personalityWeights: {
          TEAM_FIRST: 2,
          STABLE: 1,
          INTROVERT: 1,
          BIG_STAGE: 0,
          FAME_SEEKER: 0,
        },
      },
    ],
  },

  {
    id: 'crisis_coaching_overhaul_fallout',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'always',
    conditions: [{ type: 'flag_active', flag: 'coaching_overhaul_failed' }],
    prompt: "The coaching experiment didn't work out. What do you say to your fans and sponsors?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'I take full responsibility for this call.',
        quote: "This call was mine. The decision to shake up the coaching structure mid-season was my call, and it didn't pan out. I take full responsibility for that — our fans and sponsors deserve nothing less.",
        effects: {
          sponsorTrust: 3,
          morale: -2,
          setsFlags: [{ key: 'org_owns_failure', durationDays: 14 }],
        },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'We tried something ambitious. We move forward.',
        quote: "We tried something ambitious. It didn't work the way we hoped. In this sport you have to take risks to compete at the top — we knew that going in, and we move forward.",
        effects: {
          hype: 1,
          fanbase: -3,
        },
      },
      {
        tone: 'CONFIDENT',
        label: "We'll rebuild from this. This team isn't done.",
        quote: "We stumbled. I'm not going to pretend otherwise. But I know what this team is capable of, and one rough stretch doesn't define us. We rebuild, and we come back stronger.",
        effects: {
          morale: 5,
          fanbase: 2,
          hype: 3,
        },
      },
    ],
  },
];
