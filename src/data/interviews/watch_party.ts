import type { InterviewTemplate } from '../../types/interview';

export const WATCH_PARTY_TEMPLATES: InterviewTemplate[] = [
  {
    id: 'watch_party_tactical_impressions',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "Your team watched an opponent's match yesterday. What were your tactical takeaways from studying their gameplay?",
    options: [
      {
        tone: 'RESPECTFUL',
        label: 'They have clear strengths to respect',
        quote: "There's real craft in how they structure their defaults. We mapped out three tendencies that will shape our prep. You don't dismiss a team playing that cleanly.",
        effects: { morale: 1, hype: 2, fanbase: 1, dramaChance: 0, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'CONFIDENT',
        label: 'We found the gaps we needed',
        quote: "Every team has patterns they fall back on under pressure. We found theirs. I'm not going to give it away, but we left that session with a very clear plan.",
        effects: { morale: 2, hype: 4, dramaChance: 5, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Still processing what we saw',
        quote: "It takes more than one session to fully digest what a team is doing. We'll keep analyzing before we commit to any conclusions.",
        effects: { morale: 1, dramaChance: 5, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_strategy_impact',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "Has what you watched changed how you're approaching the next stage of the season?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'It reminded us we can always learn',
        quote: "Good tape keeps you honest. There were moments where they executed something we haven't seen before. That keeps us from getting too comfortable.",
        effects: { morale: 2, fanbase: 2, sponsorTrust: 1, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'CONFIDENT',
        label: 'We have a plan and it holds',
        quote: "We knew what to look for going in, and what we saw validated our approach. The adjustments are small. Our core game plan is solid.",
        effects: { morale: 3, hype: 3, fanbase: 1, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We're raising our intensity in response",
        quote: "If anything, watching that match made me want to push harder. We can't afford to be reactive — we need to dictate the terms before they get a chance to.",
        effects: { morale: 1, hype: 4, dramaChance: 8, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_standout_moment',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "Was there a specific play or moment from the match you watched that stood out to you?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'One clutch told us everything we needed',
        quote: "There was a 1v3 mid-round that said more about their mental game than any stat. We've been talking about that moment in every session since. It's a reference point now.",
        effects: { morale: 2, hype: 3, dramaChance: 0, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'HUMBLE',
        label: 'The team execution was genuinely impressive',
        quote: "There was a retake sequence where all five executed on the same read simultaneously. I showed our players that clip and said — that's the level we're chasing.",
        effects: { morale: 3, fanbase: 2, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'd rather not give them free film study",
        quote: "I know what we took away from it. I'd prefer to keep that internal. You don't give opponents your notes before you step on the server.",
        effects: { morale: 1, fanbase: 1, dramaChance: 5, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_confidence_check',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "After watching a potential opponent, does your confidence heading into the next stage go up or down?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Up — we match up well against that style',
        quote: "The way they play suits us. I walked out of that session feeling like we're genuinely built to beat this kind of team. The data backs it up.",
        effects: { morale: 3, hype: 3, fanbase: 2, dramaChance: 3, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'HUMBLE',
        label: "Steady — it's always more complicated than it looks",
        quote: "I never walk out of tape study feeling overly comfortable. You respect every opponent, you prepare for every outcome. Confidence comes from preparation, not assumptions.",
        effects: { morale: 2, fanbase: 2, sponsorTrust: 1, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'I focus on us, not them',
        quote: "We can't control what another team does. What I focus on is whether we're hitting our own benchmarks. That's the only confidence that matters.",
        effects: { morale: 1, hype: 1, dramaChance: 5, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_map_study',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "Did watching that match reveal anything about how teams are approaching the current map pool?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're already ahead of the meta curve",
        quote: "The map tendencies we saw confirmed what we've been working on for weeks. We're already building toward the answer before most teams have noticed the question.",
        effects: { morale: 2, hype: 4, fanbase: 1, dramaChance: 3, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'HUMBLE',
        label: 'There are things we need to sharpen',
        quote: "We have work to do on a couple of maps. Seeing how a top team navigates them was a useful wake-up call. Better to confront it now than mid-series.",
        effects: { morale: 1, fanbase: 2, sponsorTrust: 1, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'RESPECTFUL',
        label: 'The meta is evolving in interesting ways',
        quote: "There's a real creativity at the highest level right now. The way teams are adapting their side structures is genuinely fascinating — and it raises the bar for everyone.",
        effects: { morale: 2, hype: 2, fanbase: 2, dramaChance: 0, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_player_response',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "How did your players react to the film session? Were they motivated or unsettled by what they saw?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "They're fired up and ready",
        quote: "I watched their faces during the session. There was focus, there was hunger. If anything, it lit a fire. That's exactly what a good watch party should do.",
        effects: { morale: 3, hype: 3, fanbase: 1, dramaChance: 0, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'HUMBLE',
        label: 'Mixed — we had an honest conversation afterward',
        quote: "There were moments that challenged them. Some were motivated, some needed time to process. We had a real conversation after. That kind of honesty builds something.",
        effects: { morale: 2, fanbase: 2, dramaChance: 5, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "They're hungry to prove something",
        quote: "Nobody in that room wanted to just take notes. They want to be on the server, proving we belong at that level. I'd rather manage that energy than try to create it.",
        effects: { morale: 1, hype: 4, dramaChance: 8, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_team_chemistry',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "The team you watched seemed to have strong cohesion in-game. Is team chemistry something you prioritize in your own preparation?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Our chemistry is our competitive edge",
        quote: "You can have individual talent, but it doesn't matter if five people aren't reading the same situation the same way. We've invested in that kind of synergy and it shows.",
        effects: { morale: 2, fanbase: 2, hype: 2, dramaChance: 0, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'HUMBLE',
        label: 'It takes time and we keep working at it',
        quote: "Good chemistry isn't given, it's earned. We saw how clean their communication looked on tape. That's a standard we hold ourselves to — and we're still building toward it.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Results matter more than perception",
        quote: "I worry less about how we look on the outside and more about whether we're executing when it counts. Chemistry shows up in clutch rounds, not in highlight compilations.",
        effects: { morale: 1, hype: 1, dramaChance: 5, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },

  {
    id: 'watch_party_opponent_respect',
    context: 'WATCH_PARTY',
    subjectType: 'manager',
    prompt: "You've watched a potential opponent closely. How much do you respect them as competition heading into this next phase?",
    options: [
      {
        tone: 'RESPECTFUL',
        label: "They've earned respect through results",
        quote: "I don't have to like an opponent to acknowledge they've done the work. They're performing at a high level and we'll treat that seriously. Any other approach would be foolish.",
        effects: { morale: 1, fanbase: 3, sponsorTrust: 1, dramaChance: 0, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'CONFIDENT',
        label: 'Respect them, but back ourselves',
        quote: "I respect what they've built. I also know what we have in this room. This isn't a mismatch — this is a good match, and those are the ones worth winning.",
        effects: { morale: 3, hype: 3, fanbase: 1, dramaChance: 3, clearsFlags: ['downtime_interview_pending'] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Respect is earned on the server, not in interviews",
        quote: "I'll give them all the credit they want after we play. Right now, my job is to make sure we go in believing we're going to win. That's the only mindset that wins titles.",
        effects: { morale: 2, hype: 4, dramaChance: 8, clearsFlags: ['downtime_interview_pending'] },
      },
    ],
  },
];
