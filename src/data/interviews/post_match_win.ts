import type { InterviewTemplate } from '../../types/interview';

export const POST_MATCH_WIN_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // POST_MATCH — WIN (4 templates)
  // ==========================================================================

  {
    id: 'post_win_dominant',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
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
      {
        tone: 'AGGRESSIVE',
        label: "That's f****** Valorant right there",
        quote: "That's f****** Valorant right there. None of that pansy a** d*** tugging slow disciplined default smile for the camera bulls***, men knife the defuser, men run it down every round.",
        effects: { hype: 9, fanbase: 5, dramaChance: 18, rivalryDelta: 2 },
      },
    ],
  },

  {
    id: 'post_win_close',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
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
      {
        tone: 'TRASH_TALK',
        label: 'Shoutout to the bank robber',
        quote: "Last week I saw {rivalPlayerName} while in line at the bank. He was wearing 13 rolexes and a chain made out of protein powder so I asked how he had so much money. He said \"WATCH THIS\", pulled out a glock and robbed the bank for $31,203. Then he double updrafted and dashed out of the store...",
        effects: { hype: 8, fanbase: 4, dramaChance: 20, rivalryDelta: 2 },
      },
    ],
  },

  {
    id: 'post_win_comeback',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "You came back from a serious deficit on {mapName}. What did you say to the team at halftime?",
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
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
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

  {
    id: 'post_win_star_dominant',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "What made {starPlayerName} so impossible to stop today?",
    options: [
      {
        tone: 'CONFIDENT',
        label: "There's just no answer for them",
        quote: "There's 5 {starPlayerName}s to clutch. You just can't lose. You kill 1 {starPlayerName} and there's 4 {starPlayerName}s left, meaning you lose. You kill 2 {starPlayerName}s and there's 3 {starPlayerName}s left, meaning you lose hard. You kill 3 {starPlayerName}s and there's 2 {starPlayerName}s left meaning you lose even harder — unwinnable.",
        effects: { hype: 8, fanbase: 5, morale: 4 },
      },
      {
        tone: 'HUMBLE',
        label: 'The team set them up perfectly',
        quote: "When the team plays through {starPlayerName} like that, it puts the opponent in an impossible spot. Credit to everyone for creating the space.",
        effects: { morale: 5, fanbase: 3, sponsorTrust: 2 },
      },
      {
        tone: 'TRASH_TALK',
        label: "Good luck stopping that",
        quote: "I genuinely don't know what you'd do against {starPlayerName} on a day like that. There's no answer. That's just our reality right now.",
        effects: { hype: 7, fanbase: 4, dramaChance: 10, rivalryDelta: 2 },
      },
    ],
  },

  {
    id: 'post_win_opponent_assessment',
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "Any thoughts on {rivalTeamName}'s performance today?",
    options: [
      {
        tone: 'TRASH_TALK',
        label: 'They just need to work on everything',
        quote: "{rivalTeamName} is fantastic, they just need to work on communication, aim, map awareness, crosshair placement, eco management, pistol aim, awp flicks, grenade spots, pop flashes, positioning, bomb plant positions, retake ability, spray, skill use, control and getting kills.",
        effects: { hype: 8, fanbase: 3, dramaChance: 18, rivalryDelta: 4 },
      },
      {
        tone: 'RESPECTFUL',
        label: 'They competed well',
        quote: "{rivalTeamName} gave us a real game. Credit to them — they're a strong team and I have a lot of respect for how they compete.",
        effects: { fanbase: 4, sponsorTrust: 3, morale: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "I'm focused on us",
        quote: "I don't really spend much time analyzing the other team after the fact. We got the win, we're moving on. That's it.",
        effects: { sponsorTrust: 2, morale: 2 },
      },
    ],
  },


  {
    id: 'post_win_igl_trust',
    context: 'POST_MATCH',
    subjectType: 'player',
    subjectRole: 'igl',
    matchOutcome: 'win',
    narrativeCategory: 'breakthrough',
    prompt: "Big win today. As the IGL, what does this result mean to you?",
    options: [
      {
        tone: 'HUMBLE',
        label: 'Shoutout to the org',
        quote: "Shoutout to my coach and manager for building a system where they believe in their IGL, goated ORG.....",
        effects: { morale: 4, fanbase: 3, sponsorTrust: 3 },
      },
      {
        tone: 'CONFIDENT',
        label: 'The system is working',
        quote: "When the org trusts the IGL's calls, this is what happens. The team executes because they trust the process we've built.",
        effects: { morale: 3, hype: 4, fanbase: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "It's all about the players",
        quote: "I just give the calls. These players are the ones who execute under pressure. They make me look good out there.",
        effects: { morale: 5, fanbase: 3 },
      },
    ],
  },

];
