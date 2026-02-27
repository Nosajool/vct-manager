import type { InterviewTemplate } from '../../types/interview';

export const AGENT_STRATEGY_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // POST_MATCH — WIN, double controller composition
  // ==========================================================================
  {
    id: 'post_comp_double_controller',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    prompt: "You deployed a double-smokes lineup today. What was the thinking behind that?",
    conditions: [
      { type: 'composition_type', compositionPattern: 'double_controller' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Map control was everything',
        quote: "Map control was everything on that map. Two controllers gave us total vision denial — the opponent couldn't set up a single execute without us knowing exactly where they were.",
        effects: { hype: 5, fanbase: 3, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Credit to the players',
        quote: "The players suggested it, honestly. It worked — credit to them for reading the meta and having the confidence to run something unconventional.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Comp matters less than execution',
        quote: "The comp matters less than the execution. Our utility usage was what won rounds — any lineup works when the team is disciplined about it.",
        effects: { fanbase: 2, morale: 2 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — LOSS, no initiator composition
  // ==========================================================================
  {
    id: 'post_comp_no_initiator',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    prompt: "You had no initiator today — no flashes, no recon. Did that hurt your ability to gather info?",
    conditions: [
      { type: 'composition_type', compositionPattern: 'no_initiator' },
    ],
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'We were flying blind',
        quote: "Yes, in hindsight we were flying blind too often. Without recon or flashes, we were guessing on too many executes. We'll revisit that lineup.",
        effects: { morale: -2, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Calculated risk, bad reads',
        quote: "It was a calculated risk. The reads just weren't there today — that's not the comp's fault. We'd make the same call again with better execution.",
        effects: { morale: -1, fanbase: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'Our coordination couldn\'t compensate',
        quote: "Probably. We thought our coordination could compensate for the lack of flashes and intel. It couldn't today. We have adjustments to make.",
        effects: { morale: -1, fanbase: 2, sponsorTrust: 2 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — ANY, player on off-preferred agent
  // ==========================================================================
  {
    id: 'post_comp_off_role',
    context: 'POST_MATCH',
    subjectType: 'manager',
    prompt: "One of your players was on an agent we don't usually see them on. What prompted that choice?",
    conditions: [
      { type: 'player_off_preferred_agent' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Flexibility is a weapon',
        quote: "Flexibility is a weapon. Predictable lineups get anti-stratted. When opponents don't know what to expect from our players, they can't prepare for us.",
        effects: { hype: 4, fanbase: 3, morale: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Still finding the right fit',
        quote: "We're still finding the right fit for everyone. It's a work in progress — the player committed fully and that's all I can ask for at this stage.",
        effects: { morale: 2, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Agent picks are internal',
        quote: "Agent picks are an internal decision — what matters is how we played around it. I don't want to over-explain our prep process publicly.",
        effects: { fanbase: 1, morale: 1 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — WIN, aggressive playstyle
  // ==========================================================================
  {
    id: 'post_strat_aggressive_win',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    prompt: "You played with incredible pace today — full-sends, constant pressure. Is that sustainable?",
    conditions: [
      { type: 'team_playstyle', playstyle: 'aggressive' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: "That's our identity",
        quote: "That's our identity. Teams can't handle sustained aggression when it's executed correctly. We don't slow down — we make opponents adapt to us.",
        effects: { hype: 6, fanbase: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Some reads were lucky',
        quote: "We got some reads right and some were lucky, I'll be honest. I won't pretend every push was perfect. The aggression is real, but so is the margin for error.",
        effects: { morale: 3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: 'Let them figure out how to stop it',
        quote: "Let them figure out how to stop it. It worked today, it'll work next time too. We play to win, not to play it safe.",
        effects: { hype: 7, rivalryDelta: 3, fanbase: 3, dramaChance: 12 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — LOSS, aggressive playstyle
  // ==========================================================================
  {
    id: 'post_strat_aggressive_loss',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    prompt: "Your team plays aggressive, but today it seemed like opponents were ready for it. Thoughts?",
    conditions: [
      { type: 'team_playstyle', playstyle: 'aggressive' },
    ],
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'We were too readable',
        quote: "We were too readable. We pushed the same timings too often and they had the answer every time. That's on my preparation — I need to give the team more variety.",
        effects: { morale: -2, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Aggression was right, fundamentals weren\'t',
        quote: "The aggression was right — our fundamentals just didn't hold up under pressure. When individual plays miss, aggression looks reckless. It wasn't the strategy.",
        effects: { morale: -1, fanbase: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'Back to the drawing board',
        quote: "They anti-stratted us and we didn't adapt quickly enough. We need to be less predictable. Back to the drawing board — that's competitive Valorant.",
        effects: { morale: -1, fanbase: 2, sponsorTrust: 2 },
      },
    ],
  },

  // ==========================================================================
  // PRE_MATCH — aggressive playstyle
  // ==========================================================================
  {
    id: 'pre_strat_aggressive',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    prompt: "You're known for a high-tempo, aggressive style. How does that translate in a high-stakes match?",
    conditions: [
      { type: 'team_playstyle', playstyle: 'aggressive' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Pressure creates mistakes',
        quote: "Pressure creates mistakes. We force the pace and let opponents crumble. The bigger the stage, the more they hesitate — and that's when we punish.",
        effects: { hype: 5, fanbase: 3, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Smart aggression, not blind aggression',
        quote: "We pick our spots. Blind aggression doesn't win matches — smart aggression does. The tempo is a tool, not a plan.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'We adapt to the opponent',
        quote: "Depends on the opponent. If they're passive, we'll punish it. If not, we adapt. High-stakes matches reward whoever reads the game better.",
        effects: { fanbase: 3, morale: 2, hype: 2 },
      },
    ],
  },

  // ==========================================================================
  // PRE_MATCH — risky economy discipline
  // ==========================================================================
  {
    id: 'pre_strat_risky_economy',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    prompt: "You're not afraid to force-buy even when credits are low. Does that rattle opponents or hurt your consistency?",
    conditions: [
      { type: 'team_economy_discipline', economyDiscipline: 'risky' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: "We don't play scared",
        quote: "We don't play scared. A force that wins disrupts their entire game plan — suddenly their full-buy round means nothing. Momentum is worth more than credits.",
        effects: { hype: 5, fanbase: 3, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Trying to be smarter about it',
        quote: "I'll be honest — we're trying to be smarter about it. Force-buys are a last resort. We're working on discipline, but we don't want to play predictably either.",
        effects: { morale: 2, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'Passive play loses tempo',
        quote: "You control the game by staying aggressive. Playing for a full-buy every round gives opponents the rhythm. We dictate the pace — even on a pistol.",
        effects: { hype: 4, fanbase: 3, morale: 2, dramaChance: 8 },
      },
    ],
  },
];
