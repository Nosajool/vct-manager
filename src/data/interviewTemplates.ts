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
    requiresActiveFlag: 'veteran_championship_pact',
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
    requiresActiveFlag: 'prodigy_hype_{playerId}',
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
    requiresActiveFlag: 'igl_authority_undermined',
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
    requiresActiveFlag: 'igl_seeking_redemption',
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

  // ==========================================================================
  // BRACKET-AWARE TEMPLATES (Phase 1 — 10 templates)
  // Conditions: lower_bracket, upper_bracket, elimination_risk, grand_final,
  //             opponent_dropped_from_upper
  // ==========================================================================

  // 1. lower_bracket_dropped — POST_MATCH after falling to lower bracket
  {
    id: 'lower_bracket_dropped',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'lower_bracket',
    prompt: "You've been sent to the lower bracket. No more safety net. How does the team regroup from here?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Lower bracket is where legends are made",
        quote: "Every great run has a detour through adversity. We needed this wake-up call. You'll see a different side of this team from here on out.",
        effects: { hype: 4, morale: 3, fanbase: 2, setsFlags: [{ key: 'interview_lower_bracket_narrative', durationDays: 21 }] },
      },
      {
        tone: 'BLAME_SELF',
        label: "That was on me — we'll be ready",
        quote: "The game plan didn't hold up and I take that on myself. I owe this team a better performance from the coaching side. We'll be sharper starting with the next match.",
        effects: { fanbase: 3, sponsorTrust: 2, morale: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We reset and earn our way back",
        quote: "The upper bracket path is closed for us now. That's fine. We earn our way back one match at a time, and every team we beat along the way will know we meant business.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
    ],
  },

  // 2. lower_bracket_survival — PRE_MATCH when surviving in lower bracket on a streak
  {
    id: 'lower_bracket_survival',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'lower_bracket',
    prompt: "You've kept your tournament run alive through consecutive wins in the lower bracket. What's driving this team right now?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've found something down here",
        quote: "The lower bracket strips everything away. No comfort zone, no margin for error. And somehow this team keeps answering. I genuinely believe we're hitting our peak at the right time.",
        effects: { hype: 5, morale: 4, fanbase: 2, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "One match, one mindset",
        quote: "We're not thinking about the journey — just the next match. That's the only thing that keeps you alive in lower bracket: absolute focus on what's directly in front of you.",
        effects: { morale: 3, sponsorTrust: 2, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 14 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We thrive when the stakes are highest",
        quote: "Some teams crumble when every match is elimination. Not us. This environment brings out the version of this team that I always knew existed.",
        effects: { hype: 6, fanbase: 3, rivalryDelta: 1, dramaChance: 8 },
      },
    ],
  },

  // 3. elimination_risk_pre — PRE_MATCH must-win framing
  {
    id: 'elimination_risk_pre',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'elimination_risk',
    prompt: "One more loss and your tournament is over. How do you prepare a team for a match with everything on the line?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Must-win matches are our specialty",
        quote: "We've been in do-or-die situations before and we know what it takes. I'd rather be in this position — backs against the wall — than cruise through to a final we haven't earned.",
        effects: { hype: 5, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We're going to give everything we have",
        quote: "There's a simplicity to elimination matches that I actually appreciate. You go out and play your absolute best. No overthinking. Just compete.",
        effects: { morale: 3, sponsorTrust: 2, setsFlags: [{ key: 'interview_lower_bracket_narrative', durationDays: 14 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Elimination doesn't scare us",
        quote: "We didn't come to this tournament to go home quietly. Every player in that room knows what's at stake. They'll show you what they're made of today.",
        effects: { hype: 6, fanbase: 3, morale: 3, dramaChance: 8 },
      },
    ],
  },

  // 4. grand_final_pre — PRE_MATCH legacy/history framing
  {
    id: 'grand_final_pre',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'grand_final',
    prompt: "This is the grand final. You've made it to the biggest match of the tournament. What does it mean to stand here?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We earned this — now we take it",
        quote: "Every match we've played, every decision we've made this tournament has pointed to today. We're ready. I don't want to say much more than that — let the match do the talking.",
        effects: { hype: 6, morale: 5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "It's a privilege and a responsibility",
        quote: "For some of these players, this is the biggest match of their careers. I want them to soak in that feeling and then channel it. We've worked too long for this to be paralyzed by it.",
        effects: { morale: 4, sponsorTrust: 3, fanbase: 4 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We didn't come this far to lose now",
        quote: "This team has clawed through everything this tournament threw at us. There is no version of today where we don't fight for every single round. We're leaving everything on the server.",
        effects: { hype: 7, morale: 4, rivalryDelta: 2, dramaChance: 5 },
      },
    ],
  },

  // 5. grand_final_post_win — POST_MATCH triumph framing
  {
    id: 'grand_final_post_win',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'grand_final',
    prompt: "You're champions. After everything this team went through to get here — what does this moment mean?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is exactly who we are",
        quote: "People will remember what happened today. We weren't just here to compete — we came here to win. And we did. This is the standard we hold ourselves to from now on.",
        effects: { hype: 9, fanbase: 8, morale: 6, setsFlags: [{ key: 'interview_grand_final_champion', durationDays: 30 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm just so proud of this group",
        quote: "I keep looking around at these players. They gave everything — not just today, but all season. This championship belongs to every person who fought for this team. I couldn't be prouder.",
        effects: { fanbase: 9, morale: 6, sponsorTrust: 5 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let this sink in before we talk about what's next",
        quote: "There will be time to analyze this. Right now I just want these players to feel it. Moments like this are why you dedicate your career to this game.",
        effects: { fanbase: 7, morale: 5, hype: 4 },
      },
    ],
  },

  // 6. grand_final_post_loss — POST_MATCH gracious defeat / revenge setup
  {
    id: 'grand_final_post_loss',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'grand_final',
    prompt: "You made the grand final and fell short at the last step. How do you walk away from something like this?",
    options: [
      {
        tone: 'HUMBLE',
        label: "We'll be back for this",
        quote: "This is the hardest thing to process — knowing how close we came. But I refuse to let this team feel like they failed. They made the grand final. That matters. And we'll be back.",
        effects: { fanbase: 5, morale: 4, sponsorTrust: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: "This pain becomes our fuel",
        quote: "Remember this feeling. I want every player on this team to carry it. Because next time we're in this position, we're going to know exactly what it cost us to lose — and we won't let it happen again.",
        effects: { hype: 4, morale: 4, fanbase: 3, setsFlags: [{ key: 'interview_grand_final_loss_fuel', durationDays: 30 }] },
      },
      {
        tone: 'BLAME_SELF',
        label: "I owe this team a championship",
        quote: "These players deserved to lift that trophy today. I'll spend a long time thinking about what I could have done differently. I owe them that honesty — and I owe them another shot.",
        effects: { fanbase: 4, sponsorTrust: 3, morale: 2, dramaChance: 8 },
      },
    ],
  },

  // 7. upper_bracket_confidence — PRE_MATCH commanding narrative
  {
    id: 'upper_bracket_confidence',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'upper_bracket',
    prompt: "You're still in the upper bracket with an extra life if you need it. How do you keep the team hungry without getting comfortable?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Upper bracket is where we belong",
        quote: "This is where we want to be. The comfort we have isn't complacency — it's confidence built from results. We stay up here by being better than everyone else in front of us.",
        effects: { hype: 4, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We're not looking past anyone",
        quote: "I don't talk about the safety net. The moment you start thinking about what happens if you lose is the moment you start losing. We're focused completely on what's ahead.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "We want to stay on this side of the bracket",
        quote: "Nobody in this building wants to go to the lower bracket. That's the honest truth. It's not fear — it's hunger. We're going to fight to stay where we are.",
        effects: { hype: 5, morale: 3, rivalryDelta: 1, dramaChance: 5 },
      },
    ],
  },

  // 8. opponent_dropped_from_upper_pre — PRE_MATCH psychological edge framing
  {
    id: 'opponent_dropped_from_upper_pre',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'opponent_dropped_from_upper',
    prompt: "Your next opponent just dropped from the upper bracket. They're experienced and hungry — does that change your approach at all?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "They're wounded — we finish it",
        quote: "Teams that drop from the upper bracket come in desperate. That desperation is an edge they have — but it's also a weakness we can exploit. We've prepared for exactly this kind of opponent.",
        effects: { hype: 5, rivalryDelta: 3, morale: 2, dramaChance: 10 },
      },
      {
        tone: 'RESPECTFUL',
        label: "Desperation makes them dangerous",
        quote: "You don't underestimate a team with their back against the wall. They'll play with nothing to lose and everything to gain. We have to match that intensity and be sharper in every key moment.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Same preparation regardless of where they came from",
        quote: "We prepare the same way every match. Where they came from in the bracket doesn't change how we approach the film or the practice sessions. We focus on our game.",
        effects: { morale: 2 },
      },
    ],
  },

  // 9. lower_bracket_vs_dropped_opponent — PRE_MATCH both teams desperate
  {
    id: 'lower_bracket_vs_dropped_opponent',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'lower_bracket',
    prompt: "You're in the lower bracket, and your opponent just dropped from the upper. Two teams under the gun — what does that dynamic bring out?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've been surviving longer — we're ready for this",
        quote: "We've been living in elimination pressure since we dropped. They're just getting introduced to it. That experience matters. We're conditioned for exactly this kind of match.",
        effects: { hype: 5, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "No favors in a match like this",
        quote: "Two teams who both needed to fight to stay alive. Neither side is getting a gift today. I expect everything from my players — because we'll need everything to get through.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "They fell — we stayed alive. That gap matters.",
        quote: "There's a reason they're on this side of the bracket now. We're going to use every bit of the momentum we've built. Today we show the difference between a team that belongs here and one that slipped.",
        effects: { hype: 6, rivalryDelta: 3, morale: 3, dramaChance: 10 },
      },
    ],
  },

  // 10. comeback_lower_bracket_run — POST_MATCH iron will narrative after extended lower bracket run
  {
    id: 'comeback_lower_bracket_run',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'lower_bracket',
    prompt: "Match after match, elimination on the line each time — and this team keeps winning. How do you describe what you've witnessed from this roster through this lower bracket run?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is what we're built for",
        quote: "Every match they've played down here has required everything they had. And they've delivered. This isn't a fluke — this is who we are. Every team left in this tournament should be watching.",
        effects: { hype: 7, morale: 5, fanbase: 4, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "The bracket tested us and we didn't break",
        quote: "I've coached teams that found reasons to fold under this kind of pressure. These players never even considered it. What they've shown through this run — I'll be honest, it's exceeded everything I hoped for.",
        effects: { morale: 5, sponsorTrust: 3, fanbase: 5, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 21 }] },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Nobody believed in us — and we didn't need them to",
        quote: "People wrote us off when we dropped to lower bracket. That's fine. We play for each other, not for outside validation. And we are still here. Every team we've beaten can tell you what that looks like up close.",
        effects: { hype: 8, fanbase: 5, morale: 4, rivalryDelta: 1 },
      },
    ],
  },

  // ==========================================================================
  // ARC-AWARE INTERVIEW TEMPLATES (Phase 2 — 10 templates)
  // All gated by requiresActiveFlag using arc flag conventions.
  // Arc flags: arc_redemption_{playerId}, arc_prodigy_{playerId},
  //   arc_contender_{playerId}, arc_fallen_{playerId},
  //   arc_veteran_legacy_{playerId}, arc_identity_{playerId}
  // Modifiers: arc_mod_momentum_{playerId}, arc_mod_fragile_{playerId},
  //   arc_mod_resilient_{playerId}, arc_mod_underdog_{playerId},
  //   arc_mod_clutch_{playerId}
  // ==========================================================================

  {
    id: 'pre_arc_redemption_push',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'pre_playoff',
    requiresActiveFlag: 'arc_redemption_{playerId}',
    prompt: "You've spoken about wanting to prove yourself this season. With the playoffs here, does that motivation feel like fuel — or pressure?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is exactly what I needed",
        quote: "I've been waiting for this. The regular season built toward something and I feel it. Pressure turns into fuel when you believe in what you're doing — and right now I believe completely.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "I try not to think about it that way",
        quote: "Honestly, I try not to frame it as proving anything. When you play for validation you make bad decisions. I just want to play the best version of my game and let that be enough.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll show you when I play",
        quote: "I'd rather not talk about what I need to prove. The match is where that conversation happens. Everything else is just noise until the server goes live.",
        personalityWeights: { INTROVERT: 2.5, STABLE: 1, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2, hype: 1 },
      },
    ],
  },

  {
    id: 'post_arc_fragile_honesty',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'loss_streak_2plus',
    requiresActiveFlag: 'arc_mod_fragile_{playerId}',
    prompt: "You've had a difficult stretch and this was another tough result. There's a visible weight on you right now. How are you actually doing?",
    options: [
      {
        tone: 'BLAME_SELF',
        label: "I'm not where I need to be",
        quote: "I won't hide it. I'm not performing the way this team needs. I know what I'm capable of and I'm not hitting it right now. That's on me to fix and I'm working on it.",
        personalityWeights: { STABLE: 2, TEAM_FIRST: 1.5, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0.5 },
        effects: { morale: 2, fanbase: 3, hype: 2, setsFlags: [{ key: 'arc_mod_resilient_{playerId}', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm going through something but I'm still here",
        quote: "It's been a rough stretch. I'm not going to pretend otherwise. But I keep showing up because this team deserves that from me. I trust the process — I've just got to keep at it.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 1.5, INTROVERT: 2, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Focus on the team, not me",
        quote: "I appreciate the question but this isn't about me. The team needs better results and I need to contribute more to that. What's going on inside? That stays private.",
        personalityWeights: { INTROVERT: 3, TEAM_FIRST: 1, STABLE: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 2 },
      },
    ],
  },

  {
    id: 'pre_arc_contender_expectations',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'elimination_risk',
    requiresActiveFlag: 'arc_contender_{playerId}',
    prompt: "Your team came in with championship expectations. Now you're one loss from going home. How do you manage expectations when the gap between narrative and reality is this sharp?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Expectations don't change — we deliver today",
        quote: "We don't renegotiate standards because the path got harder. This team came here to win a championship and we're still capable of doing that. Today starts that answer.",
        effects: { hype: 4, morale: 4, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "We refocus on what we can control",
        quote: "Expectations are conversation for the offseason. Right now there's one match in front of us and we're going to pour everything into it. The narrative takes care of itself if we perform.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: "I set expectations — it's on me to back them up",
        quote: "I was vocal about what I believed this team could achieve. That pressure lives with me as the manager. My players shouldn't feel that weight today. I'll carry it — they just need to compete.",
        effects: { fanbase: 4, sponsorTrust: 2, morale: 3 },
      },
    ],
  },

  {
    id: 'post_arc_momentum_confidence',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'win_streak_2plus',
    requiresActiveFlag: 'arc_mod_momentum_{playerId}',
    prompt: "You've been in outstanding form. There's a real feeling right now that something special is happening. What does this stretch feel like from the inside?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Everything is clicking right now",
        quote: "Honestly? I feel unstoppable. I know that sounds like a lot but every decision I'm making is the right one. I'm in a rhythm and I want to protect it by not overthinking it.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 4, hype: 5, fanbase: 3, setsFlags: [{ key: 'arc_mod_momentum_{playerId}', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm focused on not wasting it",
        quote: "When form hits like this, the worst thing you can do is talk about it. I just want to stay in the moment and keep delivering. The team is counting on this version of me right now.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'm just playing my game",
        quote: "I haven't changed anything. Same prep, same mindset. I just try to play as simply as possible and trust that my reads are right. When you stop second-guessing yourself, things start clicking.",
        personalityWeights: { INTROVERT: 2, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, hype: 2 },
      },
    ],
  },

  {
    id: 'pre_arc_underdog_chip',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'always',
    requiresActiveFlag: 'arc_mod_underdog_{playerId}',
    prompt: "Not many people expected you to still be here. Has that changed how you think about yourself — or this tournament?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "The doubt was the best thing for me",
        quote: "Everyone who counted us out? I've kept a list. Not out of bitterness — out of gratitude. You needed that to wake something up in me. I play differently when no one believes in me.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, TEAM_FIRST: 0.5, INTROVERT: 0 },
        effects: { morale: 4, hype: 5, fanbase: 2, rivalryDelta: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "I stopped caring about what others expect",
        quote: "At a certain point you let go of the outside narrative and play for yourself and your teammates. That was freeing. I'm not trying to prove anyone wrong — I'm just here to compete.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I try not to focus on other people's narratives",
        quote: "The expectations others have for me are noise. I don't play for predictions or rankings. I play because I want to win. Everything else is irrelevant the moment the match starts.",
        personalityWeights: { INTROVERT: 2.5, STABLE: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3 },
      },
    ],
  },

  {
    id: 'post_arc_resilient_pride',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'lower_bracket',
    requiresActiveFlag: 'arc_mod_resilient_{playerId}',
    prompt: "You've watched one of your players come back from real adversity through this tournament run. What have you seen in them that the stats don't capture?",
    options: [
      {
        tone: 'HUMBLE',
        label: "Their character showed when things were hardest",
        quote: "The numbers will never tell you what it took for them to keep showing up when everything was against them. That kind of mental strength — you can't coach it. I'm incredibly proud of who they've been through this.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'CONFIDENT',
        label: "I always believed they'd find this version of themselves",
        quote: "I never stopped believing in them, even when it looked rough from the outside. The player I've seen in this tournament is the one I signed up for. They've finally given themselves permission to be that.",
        effects: { morale: 5, hype: 3, fanbase: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Let them tell that story — it's not mine to tell",
        quote: "I'm not going to narrate their journey for them. What they've done through this tournament has been remarkable and they deserve to own it entirely. Ask them.",
        effects: { morale: 3, fanbase: 2 },
      },
    ],
  },

  {
    id: 'pre_arc_prodigy_pressure',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'pre_playoff',
    requiresActiveFlag: 'arc_prodigy_{playerId}',
    prompt: "Everyone has been calling you the next big thing since this tournament started. Heading into a playoff match — does the label help or does it start to feel like a weight?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I want to live up to it and then some",
        quote: "I've heard the comparisons and the predictions and honestly? I want to exceed every single one of them. The label is motivation. Let people expect great things — I'll deliver them.",
        personalityWeights: { FAME_SEEKER: 3, BIG_STAGE: 2, STABLE: 0, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 4, hype: 5, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "I try not to think about what people call me",
        quote: "Prodigy, breakout star — whatever. Labels come and go. What matters is what I do in the rounds. I just focus on competing and let others write the story.",
        personalityWeights: { TEAM_FIRST: 1.5, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, sponsorTrust: 2, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's noise I've learned to tune out",
        quote: "Early on it got in my head a little, but I've learned to turn the noise off. My process is the same today as it was in scrims last month. The stakes don't change the preparation.",
        personalityWeights: { INTROVERT: 2, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, hype: 1 },
      },
    ],
  },

  {
    id: 'pre_arc_veteran_legacy_focus',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'grand_final',
    requiresActiveFlag: 'arc_veteran_legacy_{playerId}',
    prompt: "You've been chasing something like this for a long time. Standing at the grand final — what does this moment feel like compared to everything that came before?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Everything I've built has led here",
        quote: "Every tournament, every season, every time I had to start over — it all pointed to a moment like this. I'm not nervous. I'm grateful. And I'm going to make sure it counts.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 1, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 5, hype: 6, fanbase: 4, setsFlags: [{ key: 'interview_veteran_legacy_hinted', durationDays: 21 }] },
      },
      {
        tone: 'HUMBLE',
        label: "I'm trying not to make it bigger than the match",
        quote: "You don't want to be so absorbed in the weight of the moment that you forget to actually compete. I'm aware of what this means, but right now the only thing that matters is this match.",
        personalityWeights: { TEAM_FIRST: 2, STABLE: 2, INTROVERT: 1, BIG_STAGE: 0.5, FAME_SEEKER: 0 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll process it after. Right now I just want to play",
        quote: "The career retrospective can wait until after the trophy is decided. I've spent a lot of years getting here and I'm not going to let the emotion of the moment take me out of competing. We win first. Then we reflect.",
        personalityWeights: { INTROVERT: 2, STABLE: 2, TEAM_FIRST: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0 },
        effects: { morale: 4, hype: 2 },
      },
    ],
  },

  {
    id: 'post_arc_fallen_reflection',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'loss_streak_2plus',
    requiresActiveFlag: 'arc_fallen_{playerId}',
    prompt: "This has been a difficult stretch for you personally. Some are saying this might not be the same player we saw a year ago. How do you respond to that?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "They're going to be wrong",
        quote: "Anyone writing my career summary right now is going to have to update it. I know who I am and what I'm capable of. This stretch isn't the definition — it's a detour. I'll get back to where I belong.",
        personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 3, hype: 3, fanbase: 2 },
      },
      {
        tone: 'HUMBLE',
        label: "I'm being honest with myself about where I'm at",
        quote: "I'm not going to argue with the results. I haven't been playing well enough. But I've been through hard patches before and I know what it takes to come out the other side. I'm still fighting.",
        personalityWeights: { TEAM_FIRST: 1.5, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'BLAME_SELF',
        label: "They're not wrong — and that's going to change",
        quote: "The form isn't there right now. I know it, the team knows it, and apparently the whole scene knows it. I'm not going to defend a performance level I haven't been hitting. But this version of me isn't the final version.",
        personalityWeights: { STABLE: 2, TEAM_FIRST: 1.5, INTROVERT: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 2, fanbase: 4, hype: 2, setsFlags: [{ key: 'arc_mod_underdog_{playerId}', durationDays: 14 }] },
      },
    ],
  },

  {
    id: 'pre_arc_clutch_expectation',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'always',
    requiresActiveFlag: 'arc_mod_clutch_{playerId}',
    prompt: "You've built a reputation for delivering in the biggest moments this tournament. Does knowing that change how you approach pressure situations — or does it just add to the weight?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "I want the ball in the clutch",
        quote: "Put me in. Seriously. I've been in those situations enough now that they don't feel like pressure — they feel like opportunity. I want to be the one making the calls when it matters most.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 4, hype: 4, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "The team delivers — I just try to do my part",
        quote: "Clutch reputation is a team thing. I'm in positions to make big plays because my teammates set them up. I'd rather be known as someone who made everyone else better in the key moments.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1, FAME_SEEKER: 0, BIG_STAGE: 0.5 },
        effects: { morale: 3, fanbase: 2, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Reputation doesn't win rounds — execution does",
        quote: "People talk about clutch moments but the truth is you just try to make the right call every time. Whether it's a pressure situation or not, the preparation is the same. Execute the fundamentals.",
        personalityWeights: { STABLE: 2, INTROVERT: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0.5, BIG_STAGE: 0 },
        effects: { morale: 3, sponsorTrust: 1 },
      },
    ],
  },

  // ==========================================================================
  // OPPONENT-AWARENESS TEMPLATES (Phase 3 — 8 templates)
  // Conditions: rivalry_active, opponent_dropped_from_upper, lower_bracket,
  //             elimination_risk. Some gated by requiresActiveFlag.
  // POST_MATCH IDs added to InterviewService winIds/lossIds for routing.
  // ==========================================================================

  // 1. pre_rivalry_rematch_lower — PRE_MATCH rivalry in survival context
  {
    id: 'pre_rivalry_rematch_lower',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'rivalry_active',
    prompt: "You're facing a rival team with real history between you — and now it's survival for at least one side. Does that history add fuel, or does it complicate the focus?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "History makes this personal",
        quote: "Every match we've played against this team has had layers to it. Add elimination pressure on top? This isn't just a bracket match. This is a statement. And we intend to make it.",
        effects: { hype: 5, rivalryDelta: 6, morale: 3, dramaChance: 12, setsFlags: [{ key: 'rivalry_rematch_stakes', durationDays: 7 }] },
      },
      {
        tone: 'RESPECTFUL',
        label: "Rivalry aside, we respect what they've built",
        quote: "This team is here because they've earned it. We have history, but I don't want that becoming a distraction. The bracket doesn't care about storylines — you have to win.",
        effects: { morale: 3, fanbase: 2, hype: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's just the next match",
        quote: "People want to make this about the rivalry. It's not. It's a match in a tournament bracket and we need to win it. Everything else is noise.",
        effects: { morale: 2 },
      },
    ],
  },

  // 2. pre_revenge_match_scorched — PRE_MATCH scorched-earth revenge narrative
  {
    id: 'pre_revenge_match_scorched',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'rivalry_active',
    requiresActiveFlag: 'rivalry_scorched_earth',
    prompt: "Things got personal between these organizations earlier. Now you're meeting again with tournament lives on the line. Can you keep the emotion from becoming a liability?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "The emotion is the fuel",
        quote: "What happened between us is still fresh. Good. I want my players to remember exactly how that felt. Use it. Channel it. That's not a liability — that's a weapon.",
        effects: { hype: 6, rivalryDelta: 8, morale: 4, dramaChance: 15, setsFlags: [{ key: 'rivalry_revenge_match_active', durationDays: 7 }] },
      },
      {
        tone: 'HUMBLE',
        label: "We have to separate the narrative from the game",
        quote: "I've spoken with the players. We acknowledge what happened, we've processed it — now we play our game. The best response to what they said is winning, not burning the place down.",
        effects: { morale: 3, sponsorTrust: 3, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'll let the match do the talking",
        quote: "Everyone wants a quote about the rivalry. I'm not giving them one. You'll see everything we have to say when the server goes live.",
        effects: { morale: 2, hype: 3 },
      },
    ],
  },

  // 3. pre_mutual_elimination_battle — PRE_MATCH both teams under the gun
  {
    id: 'pre_mutual_elimination_battle',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'opponent_dropped_from_upper',
    prompt: "Your opponent fell from the upper bracket and now faces the same elimination pressure you've been carrying. Two teams, everything to lose — what does a match like that look like from inside?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "We've been here. They're just arriving.",
        quote: "We've been living under elimination pressure for matches now. They're getting introduced to it today. That experience is a real advantage — we know exactly what survival looks like.",
        effects: { hype: 4, morale: 4, fanbase: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "Two teams fighting for their tournament lives",
        quote: "This is the bracket giving you its hardest challenge. A team that was playing well in the upper bracket, now with nothing to lose. We have to be prepared for the best version of them.",
        effects: { morale: 3, fanbase: 2, sponsorTrust: 1 },
      },
      {
        tone: 'AGGRESSIVE',
        label: "Desperation is dangerous — but so are we",
        quote: "They're backed into a corner and that makes them dangerous. Good. We're not looking for an easy path anyway. We're going to put them away and keep climbing.",
        effects: { hype: 5, morale: 3, rivalryDelta: 2, dramaChance: 8 },
      },
    ],
  },

  // 4. pre_opponent_on_run — PRE_MATCH facing a team with momentum
  {
    id: 'pre_opponent_on_run',
    context: 'PRE_MATCH',
    subjectType: 'manager',
    condition: 'lower_bracket',
    prompt: "The team you're facing has been on a strong run — consecutive wins, clear momentum behind them. How do you prepare a team to break an opponent who's clearly in form?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Every streak ends eventually",
        quote: "We're not intimidated by someone else's run. We've been in this bracket long enough to know that momentum shifts. Our job is to be the team that ends theirs.",
        effects: { hype: 4, morale: 3, fanbase: 2 },
      },
      {
        tone: 'RESPECTFUL',
        label: "We study what's making them click",
        quote: "When a team is in form, you study why. Not to copy it — to find where the seams are. Every strong run has a pattern. Our preparation is about finding what disrupts theirs.",
        effects: { morale: 3, sponsorTrust: 2, fanbase: 1 },
      },
      {
        tone: 'HUMBLE',
        label: "We focus entirely on our own execution",
        quote: "The more you fixate on your opponent's form, the more you take your eye off your own game. We know what we need to do. If we execute our system, the momentum question answers itself.",
        effects: { morale: 4, sponsorTrust: 2 },
      },
    ],
  },

  // 5. pre_rivalry_lower_player — PRE_MATCH player in rivalry survival match
  {
    id: 'pre_rivalry_lower_player',
    context: 'PRE_MATCH',
    subjectType: 'player',
    condition: 'rivalry_active',
    prompt: "Facing a rival when it's do-or-die — does the history between these teams add to your focus, or is this just another match you need to win?",
    options: [
      {
        tone: 'AGGRESSIVE',
        label: "I want to be the one who ends their run",
        quote: "I won't pretend the rivalry doesn't mean something to me. I want to be on the server when we knock them out. That's honest.",
        personalityWeights: { FAME_SEEKER: 2.5, BIG_STAGE: 2, STABLE: 0.5, INTROVERT: 0, TEAM_FIRST: 0.5 },
        effects: { morale: 3, hype: 4, rivalryDelta: 5, dramaChance: 10 },
      },
      {
        tone: 'HUMBLE',
        label: "The bracket doesn't care about rivalries",
        quote: "Once you're on the server, it's just about rounds. All the history, the emotions — you have to park that. If you let it in, you start making decisions based on feeling instead of reads.",
        personalityWeights: { STABLE: 2.5, TEAM_FIRST: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I just want to keep our tournament alive",
        quote: "I'm focused on the team, not on who we're facing. We're here to win. That's the only thing on my mind going into this.",
        personalityWeights: { INTROVERT: 2.5, TEAM_FIRST: 2, STABLE: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3 },
      },
    ],
  },

  // 6. post_upset_momentum_shift — POST_MATCH after beating a team on a run (→ winIds)
  {
    id: 'post_upset_momentum_shift',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
    prompt: "You just beat a team that had real momentum behind them coming into this tournament. What does pulling off a result like that do for this team's belief in itself?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "Now everyone knows what we're capable of",
        quote: "We didn't just win a match — we sent a signal. Every team still in this tournament saw what happened today. I hope they're paying attention.",
        effects: { hype: 6, morale: 4, fanbase: 3, setsFlags: [{ key: 'arc_mod_momentum', durationDays: 14 }] },
      },
      {
        tone: 'HUMBLE',
        label: "It proves the work is paying off",
        quote: "I'm proud of how this team prepared. We went in with a specific plan against a team that had momentum on their side — and we executed. That's what good preparation looks like.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 3 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "One win at a time — we keep moving",
        quote: "Great result. Now we reset. The bracket doesn't reward you for celebrating too long. We'll take the win, debrief, and come back focused on the next match.",
        effects: { morale: 3, sponsorTrust: 2 },
      },
    ],
  },

  // 7. post_rivalry_win_elimination — POST_MATCH after eliminating a rival (→ winIds)
  {
    id: 'post_rivalry_win_elimination',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'rivalry_active',
    prompt: "You just eliminated a rival from this tournament. After everything the two teams have been through — what does a result like this mean beyond the bracket points?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is what we came here for",
        quote: "I'm not going to be humble about it. We wanted to be the team that sent them home. The rivalry has been defined by big moments and today was ours. The players earned that.",
        effects: { hype: 6, morale: 4, fanbase: 4, rivalryDelta: 5 },
      },
      {
        tone: 'RESPECTFUL',
        label: "They pushed us to play our best",
        quote: "This team brought everything. The rivalry sharpened us coming in and we needed every bit of that edge today. I have genuine respect for what they built — this result doesn't change that.",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "We're thinking about what comes next",
        quote: "I'm proud of the result. But the tournament isn't over and I don't want this team spending energy on today. There's still work ahead.",
        effects: { morale: 3, hype: 2 },
      },
    ],
  },

  // 8. post_lower_bracket_survival_player — POST_MATCH player survived elimination (→ winIds)
  {
    id: 'post_lower_bracket_survival_player',
    context: 'POST_MATCH',
    subjectType: 'player',
    condition: 'lower_bracket',
    prompt: "You just kept this team's tournament alive in the lower bracket. Describe what it actually feels like to survive a match where the other option was going home.",
    options: [
      {
        tone: 'CONFIDENT',
        label: "This is where we perform",
        quote: "I know people thought we might not make it. I didn't. My teammates didn't. When you've prepared the way we have, high-stakes matches aren't bigger — they're just matches. And we win matches.",
        personalityWeights: { BIG_STAGE: 3, FAME_SEEKER: 2, STABLE: 1, INTROVERT: 0, TEAM_FIRST: 1 },
        effects: { morale: 4, hype: 4, fanbase: 3 },
      },
      {
        tone: 'HUMBLE',
        label: "Stay present — one round at a time",
        quote: "Survival matches are emotional. You feel everything. I kept it simple — just do your job, one round, one call at a time. We all did that. That's why we're still here.",
        personalityWeights: { TEAM_FIRST: 2.5, STABLE: 2, INTROVERT: 1.5, FAME_SEEKER: 0.5, BIG_STAGE: 0.5 },
        effects: { morale: 4, fanbase: 3, sponsorTrust: 2, setsFlags: [{ key: 'arc_mod_resilient', durationDays: 14 }] },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Ask me when the tournament's over",
        quote: "Right now I'm just trying to recover and think about the next one. The feeling of surviving — I'll have time to process that later. We're still in it. That's what matters.",
        personalityWeights: { INTROVERT: 3, STABLE: 1.5, TEAM_FIRST: 1, FAME_SEEKER: 0, BIG_STAGE: 0 },
        effects: { morale: 3, fanbase: 2 },
      },
    ],
  },

  // Arc 5: Historic First Title — seed interview
  {
    id: 'post_win_historic_milestone',
    context: 'POST_MATCH',
    subjectType: 'manager',
    condition: 'always',
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
];
