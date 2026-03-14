import type { InterviewTemplate } from '../../types/interview';

const AGENT_STRATEGY_TEMPLATES_RAW: InterviewTemplate[] = [
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
  // PRE_MATCH — active patch (meta shift)
  // ==========================================================================
  {
    id: 'pre_patch_notes_adaptation',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    prompt: "A patch dropped recently that changed the meta significantly. How is your team adapting going into today's match?",
    conditions: [
      { type: 'flag_active', flag: 'patch_active' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We adapt faster than anyone',
        quote: "Meta shifts are where preparation separates contenders from pretenders. We've already rebuilt our approach — I like our position going into this.",
        effects: { hype: 5, morale: 3, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Still finding our footing',
        quote: "Honestly, it's an adjustment. The patch changes a lot for us. We're being honest about that internally and working through it day by day.",
        effects: { morale: 2, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Patches affect everyone equally',
        quote: "Every team is dealing with the same patch. We're not going to overthink it — our fundamentals don't change based on ability tweaks.",
        effects: { morale: 2, fanbase: 1 },
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

  // ==========================================================================
  // POST_MATCH — LOSS, patch active + player off preferred agent
  // ==========================================================================
  {
    id: 'post_patch_star_player_nerfed',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    prompt: "One of your players wasn't on their usual agent today — some say the patch forced it. Did that affect your performance?",
    conditions: [
      { type: 'flag_active', flag: 'patch_active' },
      { type: 'player_off_preferred_agent' },
    ],
    options: [
      {
        tone: 'BLAME_SELF',
        label: "We weren't ready for the change",
        quote: "Truthfully, we weren't fully adapted yet. The patch took one of our best tools away and we haven't found a clean replacement. That's on the coaching staff — I need to give the team better options.",
        effects: { morale: -3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Not making excuses',
        quote: "I'm not going to use the patch as an excuse. Every team deals with the same environment. We just didn't execute well enough today.",
        effects: { morale: -1, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'We need more reps on new agents',
        quote: "It showed. When players are on agents they haven't fully developed, it affects their confidence. We need more practice time on the alternatives.",
        effects: { morale: -2, fanbase: 2, sponsorTrust: 2 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — Harbor played (Cove Incident arc)
  // ==========================================================================
  {
    id: 'post_harbor_cove_incident',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'any',
    prompt: "One of your players ran Harbor today, and the community is already calling it 'the Cove moment.' Was that call intentional — and are you prepared to defend it?",
    conditions: [
      { type: 'agent_played', agentName: 'Harbor' },
      { type: 'flag_not_active', flag: 'cove_interview_cooldown' },
    ],
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "The Cove did its job",
        quote: "I'm not going to get into the theology of Harbor viability with Reddit. The Cove blocked the spike defuse, the round happened, we moved on. Next question.",
        effects: {
          fanbase: 2,
          hype: 3,
          setsFlags: [
            { key: 'cove_interview_cooldown', durationDays: 30 },
            { key: 'cove_meme_unaddressed', durationDays: 5 },
          ],
        },
      },
      {
        tone: 'HUMBLE',
        label: "It was a read that didn't fully land",
        quote: "Look — Harbor on that map was a calculated read on their setup. Was it the cleanest execution? No. Is the player being roasted for it? Apparently yes. We'll reflect, we'll adjust. The player worked hard and that matters.",
        effects: {
          morale: 3,
          fanbase: 4,
          sponsorTrust: 2,
          setsFlags: [
            { key: 'cove_interview_cooldown', durationDays: 30 },
            { key: 'cove_incident_acknowledged', durationDays: 5 },
          ],
        },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Harbor is underrated and I'll die on this hill",
        quote: "I love this team's creativity. Harbor's kit has legitimate utility and our player played it well. The people saying it was a throw have never coordinated a retake in their lives. We don't pick agents for the crowd.",
        effects: {
          hype: 6,
          fanbase: 3,
          dramaChance: 10,
          setsFlags: [
            { key: 'cove_interview_cooldown', durationDays: 30 },
            { key: 'cove_manager_defended', durationDays: 5 },
          ],
        },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — WIN, patch active
  // ==========================================================================
  {
    id: 'post_patch_win_meta_adapted',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    prompt: "You won after a significant patch. Does this show your team handles meta shifts better than the field?",
    conditions: [
      { type: 'flag_active', flag: 'patch_active' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: "We live in the new meta",
        quote: "We don't complain about patches — we exploit them. Our team found the updated power picks faster than anyone. That's a competitive edge we'll keep pressing.",
        effects: { hype: 6, morale: 4, fanbase: 4 },
      },
      {
        tone: 'HUMBLE',
        label: 'A lot of hard work this week',
        quote: "It's been a difficult week of preparation. The players put in extra hours to rework our approach. This win belongs to their dedication, not the patch.",
        effects: { morale: 5, fanbase: 3, sponsorTrust: 3 },
      },
      {
        tone: 'TRASH_TALK',
        label: "Opponents weren't ready",
        quote: "Our opponents clearly didn't do their homework on the patch. We did. That's the difference between teams that adapt and teams that lose.",
        effects: { hype: 7, rivalryDelta: 4, fanbase: 3, dramaChance: 12 },
      },
    ],
  },
];

// ==========================================================================
// New agent mastery interview templates
// ==========================================================================
const AGENT_MASTERY_TEMPLATES_RAW: InterviewTemplate[] = [
  // ==========================================================================
  // POST_MATCH — player has hit 90+ mastery on main agent
  // ==========================================================================
  {
    id: 'post_agent_mastery_milestone',
    context: 'POST_MATCH',
    subjectType: 'manager',
    prompt: "Some analysts are saying your player has become one of the region's most refined players on that agent. What does that level of mastery mean for your team?",
    conditions: [
      { type: 'player_agent_mastery_above', masteryThreshold: 88 },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: "Mastery is identity",
        quote: "When a player owns an agent that completely — when the kit is an extension of their instincts — it changes how opponents have to prepare. You can't just ban an agent and neutralize a player at that level of mastery.",
        effects: { hype: 6, fanbase: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "Long road to get here",
        quote: "It took a lot of reps. A lot of matches where it wasn't perfect. Watching him grow into this agent has been one of the highlights of my season. The team is better for it.",
        effects: { morale: 5, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "One agent doesn't win series",
        quote: "I appreciate the recognition, but mastery on one agent means nothing if the team around it isn't executing. We win as five, not as one.",
        effects: { fanbase: 2, morale: 3 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — LOSS, patch forced off high-mastery agent
  // ==========================================================================
  {
    id: 'post_mastery_forced_off_agent',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    prompt: "Your player has spent months mastering their signature agent, and now the patch has changed how viable it is. Does that hurt more than a normal loss?",
    conditions: [
      { type: 'flag_active', flag: 'patch_active' },
      { type: 'player_agent_mastery_above', masteryThreshold: 75 },
      { type: 'player_off_preferred_agent' },
    ],
    options: [
      {
        tone: 'BLAME_SELF',
        label: "We over-relied on that identity",
        quote: "That's on me. I built too much of our game around one player's agent identity and didn't prepare alternatives deeply enough. When the meta moved, we were exposed. We need to rebuild that mastery on new agents — fast.",
        effects: { morale: -3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "Mastery takes time to transfer",
        quote: "What took hundreds of matches to build doesn't transfer overnight. We're asking the player to rebuild something that took a full year — in two weeks. The team is handling it better than I could've hoped, but today showed the gap.",
        effects: { morale: -2, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "The agent isn't dead, just different",
        quote: "The agent isn't dead — the patch changed the ceiling, not the floor. We'll adjust the playstyle around it. The player's mastery is still there. Today was about reads, not the agent.",
        effects: { morale: -1, fanbase: 2 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — LOSS, players on low-mastery agents
  // ==========================================================================
  {
    id: 'post_low_mastery_comp_loss',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'loss',
    prompt: "Your lineup today had players on agents we don't typically see from them. Was the comfort factor a real issue in how this series went?",
    conditions: [
      { type: 'player_off_preferred_agent' },
      { type: 'team_avg_mastery_below', masteryThreshold: 55 },
    ],
    options: [
      {
        tone: 'BLAME_SELF',
        label: "We asked too much too soon",
        quote: "We asked players to perform at a high level on agents they haven't fully internalized. The mastery gap was real — you could see it in the decision-making under pressure. That's a coaching problem. I need to give the team more runway on new picks.",
        effects: { morale: -3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "Building mastery takes time",
        quote: "There's a reason players spend hundreds of hours on their mains. We were running agents we've only practiced for a few weeks against a team that's been playing their comp for months. The difference showed.",
        effects: { morale: -2, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Mechanics were there, reads weren't",
        quote: "The mechanics were fine — it was the game sense that lagged. When you're not fully comfortable, you rely on muscle memory and it wasn't there for the reads. That'll come with more reps.",
        effects: { morale: -1, fanbase: 1 },
      },
    ],
  },

  // ==========================================================================
  // PRE_MATCH — player on signature agent streak (6+ consecutive)
  // ==========================================================================
  {
    id: 'pre_signature_agent_pressure',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    prompt: "Your player has been on the same agent for their last six-plus matches. Opponents are starting to build entire game plans around countering that. Are you concerned about being readable?",
    conditions: [
      { type: 'player_signature_agent_streak', streakThreshold: 6 },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: "Let them prepare — we'll still win",
        quote: "You can gameplan around the agent all you want. When mastery is that deep, you're not just countering a pick — you're trying to counter a player's instincts. Good luck with that.",
        effects: { hype: 6, fanbase: 4, morale: 3, dramaChance: 8 },
      },
      {
        tone: 'HUMBLE',
        label: "Diversifying the threat",
        quote: "It's something we're actively working on. The player has invested heavily in this agent — that mastery is real. But we don't want to become a one-dimensional threat. We're building depth.",
        effects: { morale: 3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Readable to who?",
        quote: "I don't think the concern is as large as outsiders make it. Predictability matters less when the execution is elite. Every team knows what we're going to do — very few can stop it.",
        effects: { hype: 4, fanbase: 3, morale: 2 },
      },
    ],
  },
];

export const AGENT_STRATEGY_TEMPLATES: InterviewTemplate[] = [
  ...AGENT_STRATEGY_TEMPLATES_RAW,
  ...AGENT_MASTERY_TEMPLATES_RAW,
].map(
  (t) => ({
    ...t,
    narrativeCategory: (t.id === 'post_harbor_cove_incident' ? 'cove_incident' : 'meta_rumors') as 'cove_incident' | 'meta_rumors',
  })
);
