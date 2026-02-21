// Interview Template Catalog
// ~16 templates covering PRE_MATCH, POST_MATCH (win/loss), and CRISIS contexts
// Each template has exactly 3 options with varied tones

import type { InterviewTemplate } from '../types/interview';

export const INTERVIEW_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // PRE_MATCH (5 templates)
  // ==========================================================================

  {
    id: 'pre_standard',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "How are you feeling heading into today's match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We're ready to win",
        quote: "We've put in the work. The team is sharp and we know exactly what we need to do. Expect a strong showing from us today.",
        effects: { hype: 3, morale: 2, rivalryDelta: 1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Take it one game at a time',
        quote: "It's going to be a tough match. We respect our opponents and we're just focused on executing our game plan.",
        effects: { morale: 1, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let's see what happens",
        quote: "We'll let our play speak for itself. No predictions from me — just going to head in and compete.",
        effects: {},
      },
    ],
  },

  {
    id: 'pre_playoff',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'pre_playoff',
    prompt: 'This is a playoff match — how does the pressure feel different?',
    options: [
      {
        tone: 'CONFIDENT',
        label: 'We thrive under pressure',
        quote: "Playoffs are what you grind all season for. We're ready. Every player on this roster has worked toward this moment.",
        effects: { hype: 5, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Staying grounded',
        quote: "We're not changing anything. Same preparation, same mindset. It's just another match — we have to believe that.",
        effects: { morale: 2, sponsorTrust: 2 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We're hunting a title",
        quote: "We didn't come here to make up the numbers. We're going deep in this tournament and I'm not entertaining any other outcome.",
        effects: { hype: 6, morale: 3, rivalryDelta: 2, dramaChance: 10 },
      },
    ],
  },

  {
    id: 'pre_rival',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'rivalry_active',
    prompt: "You're facing a team you have history with. What does this match mean to you?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: 'We have a score to settle',
        quote: "They know what they did. We haven't forgotten and we're going to remind them of that today on the server.",
        effects: { hype: 6, rivalryDelta: 8, morale: 3, dramaChance: 15, setsFlags: [{ key: 'interview_trash_talked_rival', durationDays: 14 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Respect the rivalry',
        quote: "It's always a great match when we play these guys. The history between our teams pushes both sides to bring their absolute best.",
        effects: { fanbase: 2, hype: 3, rivalryDelta: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Just another opponent',
        quote: "Every team gets the same preparation from us. We're not going to let any narrative distract from our process.",
        effects: { morale: 1 },
      },
    ],
  },

  {
    id: 'pre_losing_streak',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'loss_streak_2plus',
    prompt: "The team has been struggling lately. How do you respond to concerns about your direction?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'I take responsibility',
        quote: "The results haven't been good enough. That starts with me. I'm re-evaluating our preparation and I take full accountability.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: -1, dramaChance: 5 },
      },
      {
        tone: 'CONFIDENT',
        label: 'The turnaround starts today',
        quote: "We're not going to let a rough patch define us. I believe in this roster and today is where we start showing everyone why.",
        effects: { hype: 3, morale: 4 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Trust the process',
        quote: "Results fluctuate. What matters is how we respond. We've identified the issues and we're working through them.",
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'pre_win_streak',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'win_streak_2plus',
    prompt: "The team is on a roll. Is there any danger of complacency creeping in?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Staying hungry',
        quote: "We're proud of the form we're in, but we're not celebrating anything yet. The moment you get comfortable is when things slip.",
        effects: { morale: 2, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "We're just getting started",
        quote: "Complacency? This team doesn't know the word. We're locked in and we want more. The best is still ahead of us.",
        effects: { hype: 5, morale: 3, fanbase: 2 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'The streak keeps going',
        quote: "We're not stopping here. Every team in this league should be watching us carefully right now.",
        effects: { hype: 6, rivalryDelta: 2, dramaChance: 8 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — WIN (4 templates)
  // ==========================================================================

  {
    id: 'post_win_dominant',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "That was a commanding performance. What clicked for the team today?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Everything fired on all cylinders',
        quote: "When we play our game at that level, we're very hard to beat. The preparation was there and the team executed perfectly.",
        effects: { hype: 6, fanbase: 4, morale: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Credit to the whole team',
        quote: "It was a team effort from start to finish. Every player did their job. I'm proud of the discipline and focus they showed.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: "We showed who's best",
        quote: "That's the standard we hold ourselves to. Hopefully that sends a message to the rest of the field.",
        effects: { hype: 7, rivalryDelta: 3, fanbase: 3, dramaChance: 12 },
      },
    ],
  },

  {
    id: 'post_win_close',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "It went down to the wire. How did you stay composed in the clutch moments?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'We never doubted ourselves',
        quote: "Close matches test your character. I was calm because I trusted my players. They showed real mental strength today.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Our opponent made it tough',
        quote: "Full credit to them — they pushed us hard. We had to dig deep but ultimately our preparation gave us the edge.",
        effects: { fanbase: 2, morale: 3, hype: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: 'Close games are our specialty',
        quote: "We've been in those situations before. When it mattered most, we had the answers. That's what separates good teams from great ones.",
        effects: { hype: 4, morale: 3, fanbase: 3 },
      },
    ],
  },

  {
    id: 'post_win_comeback',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "You came back from a serious deficit. What did you say to the team at halftime?",
    options: [
      {
        tone: 'CONFIDENT',
        label: 'I told them to believe',
        quote: "I told them: we've got 12 rounds left and one run can change everything. They went out and proved me right.",
        effects: { hype: 7, morale: 5, fanbase: 4 },
      },
      {
        tone: 'HUMBLE',
        label: 'The players did it themselves',
        quote: "Honestly? I kept it simple. These guys knew what to do — they just needed to trust themselves. The fight came from them.",
        effects: { morale: 5, fanbase: 4, sponsorTrust: 3 },
      },
      {
        tone: 'AGGRESSIVE',
        label: 'We refused to lose',
        quote: "I told them losing wasn't an option. Not today. And they went out there and made sure it wasn't.",
        effects: { hype: 8, morale: 4, fanbase: 5, rivalryDelta: 2 },
      },
    ],
  },

  {
    id: 'post_win_upset',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "Not many people gave you a chance today. How does it feel to prove the doubters wrong?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "We knew we'd win",
        quote: "The doubters fuel us. We never saw ourselves as underdogs. Remember this result because it won't be the last time we shock people.",
        effects: { hype: 8, fanbase: 5, morale: 4, rivalryDelta: 3, dramaChance: 10 },
      },
      {
        tone: 'HUMBLE',
        label: 'One match at a time',
        quote: "We blocked out the narrative and focused on our game. I'm glad we could deliver for our fans, but this is just one result.",
        effects: { fanbase: 5, morale: 4, sponsorTrust: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: 'This team has always been underrated',
        quote: "I've believed in this roster from day one. The outside world is catching up to what we already knew.",
        effects: { hype: 6, fanbase: 4, morale: 5 },
      },
    ],
  },

  // ==========================================================================
  // POST_MATCH — LOSS (4 templates)
  // ==========================================================================

  {
    id: 'post_loss_standard',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "Tough loss today. What do you take away from this performance?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'I take responsibility',
        quote: "The preparation wasn't good enough. I'll be looking at myself first. We'll go back to the drawing board and come back stronger.",
        effects: { fanbase: 2, sponsorTrust: 2, morale: -1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'They were the better team today',
        quote: "They executed better than us in the key moments. Credit to them. We'll study this and learn from it.",
        effects: { morale: 1, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'On to the next one',
        quote: "We're not going to dwell on a single result. There are still matches to play and we're focused forward.",
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'post_loss_blame_team',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'always',
    prompt: "That loss was hard to watch. Were you frustrated with how the team performed today?",
    options: [
      {
        tone: 'BLAME_TEAM',
        label: 'Some players need to step up',
        quote: "Honestly? There are moments where I feel like I'm doing my part and others aren't. That needs to change.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 1.5, TEAM_FIRST: 0, INTROVERT: 0, STABLE: 0.5 },
        effects: { morale: -3, dramaChance: 15, setsFlags: [{ key: 'interview_blamed_teammates', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "It's on all of us",
        quote: "We all have to be better. Losses like this happen when the whole team isn't executing, myself included.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 1.5, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 1 },
        effects: { morale: 2, sponsorTrust: 1, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We move on together",
        quote: "It wasn't our day. Pointing fingers doesn't help. We'll get back to work and fix it as a unit.",
        effects: { morale: 1 },
      },
    ],
  },

  {
    id: 'post_loss_close',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "It came down to the wire. Painful to lose by such a small margin — what happened?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'Preparation let us down',
        quote: "In close matches, every small edge matters. We left some things on the table today — that's on me to fix.",
        effects: { fanbase: 2, sponsorTrust: 2, morale: -1 },
      },
      {
        tone: 'HUMBLE',
        label: 'We gave everything',
        quote: "The players fought hard. Losing a close one hurts, but I'm not disappointed in the effort. We just need sharper execution.",
        effects: { morale: 2, fanbase: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "We'll get them next time",
        quote: "We were right there. The gap between us is thin and we know it. Next time the result goes our way.",
        effects: { morale: 3, hype: 1, rivalryDelta: 1 },
      },
    ],
  },

  {
    id: 'post_loss_blowout',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "That was a heavy loss. How do you keep morale up after a result like this?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: 'This falls on me',
        quote: "I won't have my players take the heat for today. The game plan failed and that's my responsibility. I'll fix it.",
        effects: { fanbase: 3, sponsorTrust: 1, morale: 2, dramaChance: 5 },
      },
      {
        tone: 'BLAME_TEAM',
        label: "We didn't compete",
        quote: "That wasn't good enough — from anyone. I expect more from this roster and I'll make sure we have that conversation internally.",
        effects: { morale: -4, dramaChance: 20, hype: -2 },
      },
      {
        tone: 'HUMBLE',
        label: 'Reset and rebuild',
        quote: "Bad days happen. What defines a team is the response. We'll take our medicine, learn from this, and come back with something to prove.",
        effects: { morale: 1, fanbase: 1, sponsorTrust: 1 },
      },
    ],
  },

  {
    id: 'post_loss_elimination',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'pre_playoff',
    prompt: "That's an elimination. What do you say to your players and fans right now?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Thank you for believing in us',
        quote: "To our fans: thank you. To the players: you gave everything. We fell short but the work we put in this season matters. We'll be back.",
        effects: { fanbase: 4, sponsorTrust: 3, morale: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: 'I owe the team better',
        quote: "These players deserved better preparation. That's on me. I'll spend the offseason making sure we never feel like this again.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: 1, dramaChance: 8 },
      },
      {
        tone: 'CONFIDENT',
        label: "We'll come back hungrier",
        quote: "This pain is fuel. Remember how this feels. We're going to spend the offseason building something that can go all the way.",
        effects: { hype: 3, morale: 3, fanbase: 2 },
      },
    ],
  },

  // ==========================================================================
  // CRISIS (3 templates)
  // ==========================================================================

  {
    id: 'crisis_loss_streak',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'loss_streak_3plus',
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
    condition: 'drama_active',
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
    condition: 'sponsor_trust_low',
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
  // COACH — PRE_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'pre_coach_standard',
    context: 'PRE_MATCH',
    subjectType: 'coach',
    condition: 'always',
    prompt: "Your team is about to play. What tactical adjustments are you emphasizing heading into this match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've drilled this all week",
        quote: "We identified their tendencies and we've prepared counters for all of them. The players know exactly what to do. I'm expecting a clean performance.",
        effects: { morale: 2, hype: 2, sponsorTrust: 1 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Adapting in real time',
        quote: "Every opponent forces you to think on your feet. We have a solid game plan but we're ready to adjust as the match develops.",
        effects: { morale: 1, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "That's for us to know",
        quote: "I'm not giving anything away before the match. What I'll say is the team is prepared and we'll be ready for whatever comes.",
        effects: {},
      },
    ],
  },

  {
    id: 'pre_coach_rival',
    context: 'PRE_MATCH',
    subjectType: 'coach',
    condition: 'rivalry_active',
    prompt: "This is a rematch against a familiar opponent. How does your preparation differ for a team you know this well?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: 'We know every habit they have',
        quote: "Playing a team multiple times means you have their playbook memorized. We know their tendencies better than they might realize.",
        effects: { hype: 3, morale: 2, rivalryDelta: 3 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'Familiar opponents keep you sharp',
        quote: "Rematches are always interesting — both sides know each other, so the adjustments matter even more. We've put in the extra work.",
        effects: { morale: 2, fanbase: 1, rivalryDelta: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'We focus on ourselves',
        quote: "Honestly, we spend most of our prep time on what we can control. We have our system and we trust it regardless of the opponent.",
        effects: { morale: 1 },
      },
    ],
  },

  // ==========================================================================
  // COACH — POST_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'post_coach_win',
    context: 'POST_MATCH',
    subjectType: 'coach',
    condition: 'always',
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
    condition: 'always',
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
  // COACH — CRISIS (2 templates)
  // ==========================================================================

  {
    id: 'crisis_coach_streak',
    context: 'CRISIS',
    subjectType: 'coach',
    condition: 'loss_streak_3plus',
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
    condition: 'drama_active',
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
  // PLAYER — PRE_MATCH (2 templates)
  // ==========================================================================

  {
    id: 'pre_player_standard',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'always',
    prompt: "How are you personally feeling heading into today's match?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I'm locked in",
        quote: "Honestly, I feel great. My mechanics have been sharp in practice and I'm just looking forward to getting out there and competing.",
        effects: { morale: 3, hype: 3 },
      },
      {
        tone: 'HUMBLE',
        label: 'Focused and ready',
        quote: "I've been doing my preparation and I'm in a good headspace. You don't want to get too hyped up — just stay grounded and play your game.",
        effects: { morale: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let the match speak for me",
        quote: "I'll show you how I'm feeling when the server goes live. No point in talking about it — just want to play.",
        effects: { hype: 1 },
      },
    ],
  },

  {
    id: 'pre_player_streak',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'win_streak_2plus',
    prompt: "You've been in incredible form lately. How do you stay focused when things are going this well?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Take it one match at a time',
        quote: "Streaks can mess with your head if you let them. I just try to focus on the next map, the next round. That's all I can control.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'CONFIDENT',
        label: "I'm in my bag right now",
        quote: "I won't pretend otherwise — I feel really confident right now. Everything is clicking and I want to keep that momentum going.",
        effects: { morale: 3, hype: 4, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: 'Team is playing great',
        quote: "It's not just me — everyone is playing well and it makes everything easier. When the team is rolling, individual stats follow.",
        effects: { morale: 2, fanbase: 1 },
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
    condition: 'always',
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
    condition: 'always',
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
  // PLAYER — CRISIS (2 templates)
  // ==========================================================================

  {
    id: 'crisis_player_drama',
    context: 'CRISIS',
    subjectType: 'player',
    condition: 'drama_active',
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
    condition: 'loss_streak_3plus',
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

  // ==========================================================================
  // FLAG-CONDITIONAL TEMPLATES (3 templates)
  // Only surfaced when specific drama flags are active
  // ==========================================================================

  {
    id: 'post_loss_igl_blamed',
    context: 'CRISIS',
    subjectType: 'manager',
    condition: 'drama_active',
    requiresActiveFlag: 'interview_blamed_teammates',
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
    condition: 'always',
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
    condition: 'rivalry_active',
    requiresActiveFlag: 'interview_trash_talked_rival',
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
    condition: 'drama_active',
    requiresActiveFlag: 'transfer_window_scouting',
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
    condition: 'drama_active',
    requiresActiveFlag: 'burnout_risk_high',
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
    condition: 'drama_active',
    requiresActiveFlag: 'org_open_to_trade',
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
    condition: 'drama_active',
    requiresActiveFlag: 'igl_authority_undermined',
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
    condition: 'drama_active',
    requiresActiveFlag: 'burnout_crisis_ignored',
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
    condition: 'pre_playoff',
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
    condition: 'loss_streak_2plus',
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
];
