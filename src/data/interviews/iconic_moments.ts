import type { InterviewTemplate } from '../../types/interview';

export const ICONIC_MOMENTS_INTERVIEW_TEMPLATES: InterviewTemplate[] = [
  // ==========================================================================
  // Sage wall boost on Sunset (PRX Jinggg @ Masters Toronto 2025 Grand Final)
  // Requires: Raze + Sage played, Sunset played
  // ==========================================================================
  {
    id: 'iconic_sage_boost_sunset',
    context: 'POST_MATCH',
    subjectType: 'manager',
    prompt:
      "That Sage wall boost to an unexpected angle on Sunset mid — was that planned, or did it happen in the moment?",
    conditions: [
      { type: 'agent_played', agentName: 'Raze' },
      { type: 'agent_played', agentName: 'Sage' },
      { type: 'map_played', mapName: 'Sunset' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Drilled it for two weeks',
        quote:
          "Drilled it for two weeks. When you have a Sage and a Raze, you have to ask which walls haven't been launch pads yet. Sunset mid was the answer. The execution was perfect.",
        effects: {
          hype: 7,
          fanbase: 5,
          morale: 3,
          setsFlags: [{ key: 'iconic_boost_hyped', durationDays: 7 }],
        },
      },
      {
        tone: 'HUMBLE',
        label: "Pure in-game genius",
        quote:
          "Pure in-game genius from the players — I can't take credit for that one. That kind of creativity can't be coached. You just give them space to make those calls and try not to get in the way.",
        effects: { morale: 5, fanbase: 4, sponsorTrust: 2 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Not giving away the strat book",
        quote:
          "I'm not giving away our strat book here. Let's just say we don't run anything we haven't thought about.",
        effects: { hype: 3, fanbase: 2, rivalryDelta: 2, dramaChance: 8 },
      },
    ],
  },

  // ==========================================================================
  // Omen fake TP on Breeze (PRX Jinggg @ Masters Santiago 2026 vs NRG)
  // Requires: Omen played, Breeze played
  // ==========================================================================
  {
    id: 'iconic_omen_fake_tp_breeze',
    context: 'POST_MATCH',
    subjectType: 'manager',
    prompt:
      "The Omen ultimate on Breeze — it looked like a teleport that never committed. Was that a deliberate mind game, or something else entirely?",
    conditions: [
      { type: 'agent_played', agentName: 'Omen' },
      { type: 'map_played', mapName: 'Breeze' },
    ],
    options: [
      {
        tone: 'CONFIDENT',
        label: 'Bait the rotation, punish',
        quote:
          "Completely deliberate. The read was that they'd over-rotate the moment they heard the TP sound. We baited the rotation and punished them on the other side. That's the kind of macro play that wins rounds on Breeze.",
        effects: {
          hype: 8,
          fanbase: 5,
          rivalryDelta: 2,
          setsFlags: [{ key: 'iconic_fake_tp_hyped', durationDays: 7 }],
        },
      },
      {
        tone: 'HUMBLE',
        label: "Misclick that accidentally worked",
        quote:
          "Honestly? Misclick. The TP got cancelled mid-cast — full panic from the player. But the sound cue still went out, the rotation happened anyway, and somehow it worked. Mission failed successfully.",
        effects: { morale: 4, fanbase: 6, hype: 5 },
      },
      {
        tone: 'DEFLECTIVE',
        label: "Whatever it looked like, it worked",
        quote:
          "Whatever it looked like, it worked. That's all I'll say.",
        effects: { hype: 4, fanbase: 3, dramaChance: 6 },
      },
    ],
  },
];
