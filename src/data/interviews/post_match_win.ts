import type { InterviewTemplate } from '../../types/interview';

export const POST_MATCH_WIN_TEMPLATES: InterviewTemplate[] = [
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

];
