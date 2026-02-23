import type { InterviewTemplate } from '../../types/interview';

export const CRISIS_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // CRISIS (3 templates)
  // ==========================================================================

  {
    id: 'crisis_loss_streak',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'team_loss_streak', streakLength: 3 }],
    prompt: "Three straight losses. There are growing calls for roster changes. How do you respond?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We stand behind this roster',
        quote: "I'm not making panic moves. I believe in these players and we're going to work through this together. Patience.",
        effects: { morale: 4, sponsorTrust: -2, hype: -1, dramaChance: 10 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'All options are on the table',
        quote: "We're continuously evaluating everything. I won't rule anything out, but I also won't rush decisions that affect people's livelihoods.",
        effects: { morale: -2, fanbase: 1, dramaChance: 15 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'The system needs to change',
        quote: "The roster isn't the problem — the system around them is. I'm overhauling our approach and this team will look different soon.",
        effects: { fanbase: 3, sponsorTrust: 1, morale: -1, dramaChance: 12 },
      },
    ],
  },

  {
    id: 'crisis_drama_spike',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "Reports of internal tension have leaked publicly. Can you address the locker room situation?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "That's private team business",
        quote: "I'm not going to comment on internal matters. Every team deals with challenges. We handle things in-house and that's that.",
        effects: { morale: 1, fanbase: -1, sponsorTrust: -1 },
      },
      {
        tone: 'HUMBLE',
        label: "We're working through it",
        quote: "I won't pretend everything is perfect. Teams go through periods of friction. We're addressing it head-on and I'm confident we'll come out stronger.",
        effects: { fanbase: 2, morale: 2, sponsorTrust: 1, dramaChance: 8 },
      },
      {
        tone: 'CONFIDENT',
        label: 'This will make us closer',
        quote: "Conflict forges stronger bonds when handled right. We're having real conversations. This team is going to come out of this united.",
        effects: { morale: 3, fanbase: 2, hype: 1, dramaChance: 5 },
      },
    ],
  },

  {
    id: 'crisis_sponsor',
    context: 'CRISIS',
    subjectType: 'manager',
    conditions: [{ type: 'flag_active', flag: 'sponsor_trust_low' }],
    prompt: "With results declining, are you concerned about your sponsorship relationships?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We deliver long-term value',
        quote: "Our partners understand that esports is a marathon. We have a strong relationship built on more than short-term results.",
        effects: { sponsorTrust: 4, fanbase: 1, hype: 1 },
      },
      {
        tone: 'HUMBLE',
        label: 'We have to earn back their trust',
        quote: "We're not taking any partnership for granted. We know we need to perform and we're going to show our sponsors we're worth believing in.",
        effects: { sponsorTrust: 3, morale: 1, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Those conversations stay private',
        quote: "I don't discuss our commercial relationships publicly. What I can say is we're focused on winning, which takes care of everything else.",
        effects: { sponsorTrust: 1, morale: 1 },
      },
    ],
  },


  // ==========================================================================
  // COACH — CRISIS (2 templates)
  // ==========================================================================

  {
    id: 'crisis_coach_streak',
    context: 'CRISIS',
    subjectType: 'coach',
    conditions: [{ type: 'team_loss_streak', streakLength: 3 }],
    prompt: "Three straight losses. Are you questioning your tactical approach at this point?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'The system is sound',
        quote: "I believe in what we're doing. Results haven't gone our way but the underlying work is there. We're one performance away from flipping this.",
        effects: { morale: 3, sponsorTrust: -1, hype: 1 },
      },
      {
        tone: 'BLAME_SELF',
        label: "I'm overhauling our approach",
        quote: "Three losses is a pattern you have to take seriously. I'm re-examining our preparation, our in-game systems, all of it. Something needs to change.",
        effects: { fanbase: 2, morale: 1, dramaChance: 8 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We're working through it",
        quote: "Every team hits rough patches. What matters is how we respond in training this week. I'd rather let the next result do the talking.",
        effects: { morale: 1 },
      },
    ],
  },

  {
    id: 'crisis_coach_drama',
    context: 'CRISIS',
    subjectType: 'coach',
    conditions: [{ type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "There are reports of player frustration with the coaching staff's methods. How do you respond to that?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: 'Team dynamics stay internal',
        quote: "I'm not going to address rumors. What I'll say is that high-level competition creates pressure and that's part of the job for everyone involved.",
        effects: { morale: 1, fanbase: -1 },
      },
      {
        tone: 'HUMBLE',
        label: "I'm listening and adjusting",
        quote: "Feedback from players is valuable. If something in our process isn't working for the team, it's my job to fix that. We're having those conversations.",
        effects: { morale: 3, fanbase: 2, dramaChance: 5 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Pressure brings out the best',
        quote: "A demanding environment is part of developing elite players. We have high standards and we're going to keep them. That's what produces results.",
        effects: { morale: -1, hype: 2, dramaChance: 12 },
      },
    ],
  },


  // ==========================================================================
  // PLAYER — CRISIS (2 templates)
  // ==========================================================================

  {
    id: 'crisis_player_drama',
    context: 'CRISIS',
    subjectType: 'player',
    conditions: [{ type: 'or', anyOf: [{ type: 'player_morale_below', threshold: 30 }, { type: 'flag_active', flag: 'crisis_active' }] }],
    prompt: "There are reports of internal tension within the team. How is the locker room actually holding up?",
    options: [
      {
        tone: 'DEFLECTIVE',
        label: "We keep it in-house",
        quote: "Every team has disagreements. That's normal. We don't air our business publicly — we handle it as a team and move forward.",
        effects: { morale: 1, fanbase: -1 },
      },
      {
        tone: 'HUMBLE',
        label: "It's been a tough stretch",
        quote: "I won't lie — it's been challenging. But I think adversity either breaks a team or makes it stronger. I'm choosing to believe in the second one.",
        effects: { morale: 3, fanbase: 2, hype: 1, dramaChance: 5 },
      },
      {
        tone: 'CONFIDENT',
        label: "The bond is still there",
        quote: "Outside noise doesn't get into our team environment. We care about each other and that's more important than any rough patch.",
        effects: { morale: 3, hype: 2, dramaChance: 8 },
      },
    ],
  },

  {
    id: 'crisis_player_morale',
    context: 'CRISIS',
    subjectType: 'player',
    conditions: [{ type: 'team_loss_streak', streakLength: 3 }],
    prompt: "After this difficult stretch, how do you personally stay motivated and keep your own confidence up?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Trust the work you put in',
        quote: "You go back to basics. Remember why you started, remember the hours you've put in. A bad run doesn't erase what you know you're capable of.",
        effects: { morale: 4, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "Losing streaks end eventually",
        quote: "I've been through bad stretches before. You just keep showing up and doing the work. Eventually things start clicking again.",
        effects: { morale: 4, hype: 3, fanbase: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: "I have to raise my level",
        quote: "Part of getting out of a slump is being honest with yourself about where you're falling short. I'm looking at my own game hard right now.",
        effects: { morale: 2, fanbase: 2, hype: 2 },
      },
    ],
  },

];
