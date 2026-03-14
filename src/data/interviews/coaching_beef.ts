import type { InterviewTemplate } from '../../types/interview';

const RAW_COACHING_BEEF_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // PRE_MATCH — coaching_beef_arc_active (media asks about on-stage incidents)
  // ==========================================================================

  {
    id: 'pre_match_coaching_beef_incident',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'coaching_beef_arc_active' }],
    prompt:
      'The clip from the post-match stage is still circulating. Did something happen between you and the rival coaching staff, or is the internet reading too much into it?',
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Deflect — focus on the match',
        quote:
          "I don't know what clip you're talking about and honestly, I don't care. We have a match today. That's the only thing I'm thinking about.",
        effects: { morale: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Address it directly',
        quote:
          "There are things that happen between coaching staffs that don't make it into press conferences. What I'll say is this — I know what I saw, and I know what was done. When the time is right, this will all make sense.",
        effects: { hype: 5, dramaChance: 10 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'Trash talk the rival coach',
        quote:
          "They know what they did. The handshake isn't even the part I care about. You want the real story? Keep watching.",
        effects: { hype: 8, sponsorTrust: -4, dramaChance: 20, rivalryDelta: 10 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — coaching_beef_accused_public, no evidence yet
  // ==========================================================================

  {
    id: 'post_match_coaching_beef_accused',
    context: 'POST_MATCH',
    subjectType: 'manager',
    conditions: [
      { type: 'flag_active', flag: 'coaching_beef_accused_public' },
      { type: 'flag_not_active', flag: 'coaching_beef_evidence_submitted' },
    ],
    prompt:
      "You went public with the scrim leak accusations and still no evidence has surfaced. The rival coach is calling it defamation. Where does this go from here?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Double down — the evidence is coming',
        quote:
          "The evidence exists. What we're deciding is the right moment and the right format to surface it. Patience.",
        effects: { hype: 4, dramaChance: 15 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Go quiet on it',
        quote:
          "I said what I said. We're letting the process run its course. Next question.",
        effects: { morale: -3, sponsorTrust: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Express regret for the escalation',
        quote:
          "There are things I would have done differently in terms of how I communicated this. What I believe happened — that hasn't changed. But the way it came out wasn't ideal.",
        effects: { morale: -5, sponsorTrust: 6 },
      },
    ],
  },

  // ==========================================================================
  // GENERAL (CRISIS) — is the feud a distraction?
  // ==========================================================================

  {
    id: 'crisis_coaching_beef_distraction',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'coaching_beef_arc_active' }],
    prompt:
      'With everything happening off-server between coaching staffs, there are real concerns about whether this feud is becoming a distraction for your players. How do you respond to that?',
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "Deny it's affecting the team",
        quote:
          "My job is to make sure none of this reaches the players. That's what I'm doing. They show up, they compete — that part is locked in.",
        effects: { morale: 2, hype: -2 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Embrace the drama as fuel',
        quote:
          "Honestly? There's nothing that focuses a team like having a common enemy. We're not distracted — we're motivated. Watch us play.",
        effects: { hype: 7, morale: 5, sponsorTrust: -3, dramaChance: 12 },
      },
      {
        tone: 'HUMBLE',
        label: 'Professional response — acknowledge and move on',
        quote:
          "It's a situation. We're managing it. The team is professional enough to separate what happens in the ecosystem from what happens on the server. That's the job.",
        effects: { sponsorTrust: 5, morale: 2 },
      },
    ],
  },
];

export const COACHING_BEEF_TEMPLATES: InterviewTemplate[] =
  RAW_COACHING_BEEF_TEMPLATES.map((t) => ({ ...t, narrativeCategory: 'coaching_beef' as const }));
