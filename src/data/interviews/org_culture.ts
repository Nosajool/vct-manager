import type { InterviewTemplate } from '../../types/interview';

const RAW_ORG_CULTURE_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // ORG CULTURE ARC (4 interview templates)
  // ==========================================================================

  {
    id: 'post_home_visit_morale',
    context: 'POST_MATCH',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'home_visit_paid_{playerId}' }],
    prompt:
      "We heard the org flew one of your players home to see family. What does that say about how you run this team?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Players first',
        quote:
          "People come before performance. If your player needs to go home, you make it happen. The results speak for themselves.",
        effects: { fanbase: 8, sponsorTrust: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "It's just the right thing",
        quote:
          "Honestly, it wasn't a decision — it was obvious. These players are far from home for most of the year. The least we can do is help when it matters.",
        effects: { fanbase: 10, morale: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Keep it private',
        quote:
          "We don't really talk publicly about internal team logistics. What happens in the team house stays there.",
        effects: {},
      },
    ],
  },

  {
    id: 'post_home_visit_chaos',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'home_visit_delayed_{playerId}' }],
    prompt:
      "Your player missed prep time after travel issues. Are you regretting the decision to send them home?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "No regrets",
        quote:
          "Flights get delayed. That's travel. We don't regret the decision for a second — the team's mental health matters more than a single scrim session.",
        effects: { morale: 4, fanbase: 5 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'Should have planned better',
        quote:
          "We should have built in a buffer day. That's a logistics error on our part, and we'll learn from it.",
        effects: { sponsorTrust: -3, fanbase: 4 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Everyone handles travel issues',
        quote:
          "Missed connections happen to every team. This isn't unique to us and I think the framing of this question is a little unfair.",
        effects: { hype: -3 },
      },
    ],
  },

  {
    id: 'chicken_nugget_press_question',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'chicken_nugget_org' }],
    prompt:
      "The chicken nugget meme is all over social media. Players from other teams are tagging you in posts. How do you respond?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: 'Own it, defiantly',
        quote:
          "You know what? Nuggets are great. Twenty-piece, ranch dipping sauce, no apologies. We're chicken nugget org and we're coming for your spot.",
        effects: { fanbase: 15, hype: 10, sponsorTrust: -8 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Pivot to results',
        quote:
          "I'm focused on what happens inside the server. What Twitter thinks about our org's catering choices is frankly not something I have time for.",
        effects: { hype: -3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Address it seriously',
        quote:
          "I understand the optics. We're committed to improving player welfare and that's something I take personally. We have work to do.",
        effects: { sponsorTrust: 5, fanbase: -5, morale: -3 },
      },
    ],
  },

  {
    id: 'org_generosity_question',
    context: 'GENERAL',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'org_generous' }],
    prompt:
      "Players around the league have been talking about what this org does differently. What makes you stand out as a place people want to play for?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We invest in people',
        quote:
          "We invest in our players as people first — their mental health, their families, their lives outside the game. The wins follow from that. It's not complicated.",
        effects: { fanbase: 10, sponsorTrust: 5, morale: 5 },
      },
      {
        tone: 'HUMBLE',
        label: "We're just doing what's right",
        quote:
          "I don't think we're doing anything special — we're just doing what any decent employer should do. The bar shouldn't be that low, but here we are.",
        effects: { fanbase: 8, hype: 5 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let the players speak for themselves",
        quote:
          "Ask them. I don't want to be the one bragging about this. If they feel supported, that means more than anything I could say.",
        effects: { fanbase: 6, morale: 3 },
      },
    ],
  },
];

export const ORG_CULTURE_INTERVIEWS: InterviewTemplate[] = RAW_ORG_CULTURE_TEMPLATES.map(
  (t) => ({ ...t, narrativeCategory: 'org_culture' as const })
);
