// Tournament Context Interviews
// Always-on bookends that narrate tournament progression.
// These are generated dynamically (not stored in INTERVIEW_TEMPLATES).
// Pre-match: injected at the START of the press conference queue.
// Post-match: injected at the END of the press conference queue.

import type { InterviewOption, PendingInterview, TournamentMatchContext } from '../../types/interview';

// ============================================================================
// Helpers
// ============================================================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

function qualifiesForClause(qualifiesFor: string | undefined): string {
  return qualifiesFor ? ` and won't be qualifying for ${qualifiesFor}` : '';
}

function makePending(
  id: string,
  prompt: string,
  options: InterviewOption[],
  matchId?: string,
): PendingInterview {
  return {
    templateId: id,
    context: 'PRE_MATCH',
    subjectType: 'manager',
    matchId,
    prompt,
    options,
  };
}

function makePostPending(
  id: string,
  prompt: string,
  options: InterviewOption[],
  matchId?: string,
): PendingInterview {
  return {
    templateId: id,
    context: 'POST_MATCH',
    subjectType: 'manager',
    matchId,
    prompt,
    options,
  };
}

// ============================================================================
// Pre-match option sets
// ============================================================================

const PRE_OPTIONS_READY: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'Ready to compete',
    quote: 'We\'ve prepared for this. The team is locked in and ready to show what we can do.',
    effects: { morale: 2, hype: 1 },
  },
  {
    tone: 'HUMBLE',
    label: 'Take it one match at a time',
    quote: 'We just focus on our own game. Whatever happens, we give everything we have.',
    effects: { morale: 1 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Trust the process',
    quote: 'I don\'t look too far ahead. We execute our gameplan and let the results follow.',
    effects: { dramaChance: 3 },
  },
];

const PRE_OPTIONS_READY_B: InterviewOption[] = [
  {
    tone: 'AGGRESSIVE',
    label: 'Here to take what\'s ours',
    quote: 'We\'re not here to participate. We\'re here to win. Everyone in that bracket should know that.',
    effects: { morale: 3, hype: 2, rivalryDelta: 5 },
  },
  {
    tone: 'HUMBLE',
    label: 'Stay focused on the process',
    quote: 'We don\'t concern ourselves with expectations. We show up, we compete, and we see where that takes us.',
    effects: { morale: 1, sponsorTrust: 2 },
  },
  {
    tone: 'CONFIDENT',
    label: 'Sharp and ready',
    quote: 'The team feels good. We\'ve done the work and I genuinely believe we\'re peaking at the right time.',
    effects: { morale: 2, hype: 1 },
  },
];

const PRE_OPTIONS_PRESSURE: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'Embrace the pressure',
    quote: 'This is exactly the moment we train for. Pressure brings out the best in us.',
    effects: { morale: 3, hype: 2 },
  },
  {
    tone: 'HUMBLE',
    label: 'Stay composed',
    quote: 'We just stay composed and play our game. Nothing changes.',
    effects: { morale: 1 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Block out the noise',
    quote: 'I don\'t think about brackets or stakes. Match by match.',
    effects: { dramaChance: 5 },
  },
];

const PRE_OPTIONS_PRESSURE_B: InterviewOption[] = [
  {
    tone: 'TRASH_TALK',
    label: 'We want this more',
    quote: 'I\'ve seen our opponent play. They\'re good. But I don\'t think they want it as badly as we do. We\'re going to make that clear.',
    effects: { morale: 3, hype: 3, rivalryDelta: 10 },
  },
  {
    tone: 'RESPECTFUL',
    label: 'Acknowledge what\'s at stake',
    quote: 'This is a massive match and I won\'t pretend otherwise. Both teams earned this moment. We\'ll give it everything we have.',
    effects: { morale: 2, sponsorTrust: 3 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Don\'t overthink it',
    quote: 'At some point you have to stop analyzing and just play. That\'s our mindset going in.',
    effects: { dramaChance: 4 },
  },
];

const PRE_OPTIONS_SURVIVAL: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'We thrive under pressure',
    quote: 'Lower bracket is where champions are made. We\'re not done.',
    effects: { morale: 3, hype: 2 },
  },
  {
    tone: 'HUMBLE',
    label: 'Hungry to survive',
    quote: 'We have a lot to prove. Every match in the lower bracket means everything.',
    effects: { morale: 2 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Focus on the next match',
    quote: 'We don\'t look at where we are in the bracket. We look at the team in front of us.',
    effects: { dramaChance: 3 },
  },
];

const PRE_OPTIONS_SURVIVAL_B: InterviewOption[] = [
  {
    tone: 'AGGRESSIVE',
    label: 'We\'re not done yet',
    quote: 'People wrote us off when we dropped to the lower bracket. Good. That\'s exactly the fuel we needed.',
    effects: { morale: 3, hype: 2, rivalryDelta: 5 },
  },
  {
    tone: 'HUMBLE',
    label: 'Every match earns the next',
    quote: 'We haven\'t earned anything yet. Each win in the lower bracket is borrowed time. We know that and we\'re okay with it.',
    effects: { morale: 2, sponsorTrust: 2 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Ignore the bracket noise',
    quote: 'Lower bracket, upper bracket — I honestly don\'t care. There\'s a match in front of us and we\'re going to win it.',
    effects: { dramaChance: 4 },
  },
];

const PRE_OPTIONS_GRAND_FINAL: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'We came here to win',
    quote: 'This is why we put in the work. Grand final stage — this is our moment.',
    effects: { morale: 4, hype: 3 },
  },
  {
    tone: 'HUMBLE',
    label: 'Grateful to be here',
    quote: 'It\'s an incredible feeling just to be in the grand final. But we\'re here to win it.',
    effects: { morale: 2, hype: 1 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Just another match',
    quote: 'Grand final or not, it\'s five versus five. We approach it the same way.',
    effects: { dramaChance: 5 },
  },
];

const PRE_OPTIONS_GRAND_FINAL_B: InterviewOption[] = [
  {
    tone: 'TRASH_TALK',
    label: 'We\'re the better team',
    quote: 'We\'ve earned the right to say it — we\'re the best team in this tournament. Tomorrow, we\'re going to prove it.',
    effects: { morale: 4, hype: 4, rivalryDelta: 15 },
  },
  {
    tone: 'HUMBLE',
    label: 'Grateful for the journey',
    quote: 'This whole run has been unreal. Whatever happens tomorrow, this team has already made me proud. But we\'re not done.',
    effects: { morale: 3, hype: 2, sponsorTrust: 3 },
  },
  {
    tone: 'RESPECTFUL',
    label: 'Respect the opponent, compete to win',
    quote: 'Our opponent is excellent — they wouldn\'t be in the grand final otherwise. We respect that. And we\'re going to compete with everything we have.',
    effects: { morale: 2, hype: 1, sponsorTrust: 4 },
  },
];

// ============================================================================
// Post-match (win) option sets
// ============================================================================

const POST_WIN_OPTIONS_ADVANCE: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'Building momentum',
    quote: 'That\'s the standard we set for ourselves. We keep building and keep winning.',
    effects: { morale: 3, hype: 2 },
  },
  {
    tone: 'HUMBLE',
    label: 'Relief and focus',
    quote: 'Happy to get the win. We reset quickly — there\'s still a lot of work to do.',
    effects: { morale: 1 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'On to the next',
    quote: 'Good result. We\'ll review the footage and get ready for whoever\'s next.',
    effects: { dramaChance: 3 },
  },
];

const POST_WIN_OPTIONS_ADVANCE_B: InterviewOption[] = [
  {
    tone: 'AGGRESSIVE',
    label: 'We\'re not stopping here',
    quote: 'That\'s one. We came here with a goal and that match was a step toward it. We don\'t slow down.',
    effects: { morale: 3, hype: 2, rivalryDelta: 5 },
  },
  {
    tone: 'RESPECTFUL',
    label: 'Hard-earned win',
    quote: 'Our opponent made us work for that. Credit to them — this was a real test and I think it made us better.',
    effects: { morale: 2, sponsorTrust: 3, fanbase: 2 },
  },
  {
    tone: 'CONFIDENT',
    label: 'Exactly what we trained for',
    quote: 'That\'s what we look like when we\'re locked in. We knew we had it in us. Now we keep that level.',
    effects: { morale: 3, hype: 2 },
  },
];

const POST_WIN_OPTIONS_LOWER_B: InterviewOption[] = [
  {
    tone: 'AGGRESSIVE',
    label: 'We clawed our way back',
    quote: 'Nobody in the lower bracket wanted it more than us today. We fought for every round. That\'s who we are.',
    effects: { morale: 3, hype: 2, rivalryDelta: 5 },
  },
  {
    tone: 'HUMBLE',
    label: 'One match at a time',
    quote: 'We can\'t think too far ahead. There\'s another match coming and we need to be ready for it. Just grateful to still be here.',
    effects: { morale: 2, sponsorTrust: 2 },
  },
  {
    tone: 'TRASH_TALK',
    label: 'Lower bracket run incoming',
    quote: 'People forget where we came from. We\'re going to remind them. This lower bracket run is just getting started.',
    effects: { morale: 3, hype: 3, rivalryDelta: 8, fanbase: 3 },
  },
];

const POST_WIN_OPTIONS_QUALIFY: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'We earned this',
    quote: 'That\'s what we trained for. We\'re not done yet — there\'s still a tournament to win.',
    effects: { morale: 4, hype: 3, fanbase: 5 },
  },
  {
    tone: 'HUMBLE',
    label: 'Overwhelmed and grateful',
    quote: 'It hasn\'t fully sunk in yet. This team fought incredibly hard to get here. I\'m so proud.',
    effects: { morale: 3, hype: 2, fanbase: 4 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Eyes on the next match',
    quote: 'We celebrate tonight, but tomorrow we get back to work. This was a step, not the finish line.',
    effects: { morale: 2, dramaChance: 3 },
  },
];

const POST_WIN_OPTIONS_GRAND_FINAL: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'We deserve this',
    quote: 'Champions. That\'s what we came here for. Every sacrifice was worth it.',
    effects: { morale: 5, hype: 5, fanbase: 10 },
  },
  {
    tone: 'HUMBLE',
    label: 'Grateful and overwhelmed',
    quote: 'I don\'t even have words right now. This team — they gave everything. I\'m so proud.',
    effects: { morale: 3, hype: 3, fanbase: 8 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Credit to the team',
    quote: 'It wasn\'t about me. This team carried us to the finish line. They earned this.',
    effects: { morale: 4, hype: 2, fanbase: 6 },
  },
];

// ============================================================================
// Post-match (loss) option sets
// ============================================================================

const POST_LOSS_OPTIONS_LOWER: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'Eyes forward',
    quote: 'We learn from every match. This team is hungry and we\'re not done.',
    effects: { morale: 2, hype: 1 },
  },
  {
    tone: 'HUMBLE',
    label: 'Take it one match at a time',
    quote: 'It hurts, but we reset and focus on what\'s next.',
    effects: { morale: 1 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Process over results',
    quote: 'I don\'t dwell on the bracket. We play our game and see where it takes us.',
    effects: { morale: -1, dramaChance: 5 },
  },
];

const POST_LOSS_OPTIONS_LOWER_B: InterviewOption[] = [
  {
    tone: 'BLAME_SELF',
    label: 'That\'s on me',
    quote: 'I have to be honest — today wasn\'t good enough and a lot of that falls on my preparation and my decisions. The players showed up. I didn\'t give them what they needed.',
    effects: { morale: -1, sponsorTrust: 4, dramaChance: 3 },
  },
  {
    tone: 'AGGRESSIVE',
    label: 'We\'ll hit back harder',
    quote: 'That result stings. But we don\'t fold. We go back to the drawing board and we come out swinging next time.',
    effects: { morale: 2, hype: 1, rivalryDelta: 5 },
  },
  {
    tone: 'HUMBLE',
    label: 'Acknowledge and reset',
    quote: 'They outplayed us today. There\'s no other way to say it. We have to be humble enough to accept that and grow from it.',
    effects: { morale: 1, sponsorTrust: 2 },
  },
];

const POST_LOSS_OPTIONS_ELIMINATED: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'We\'ll be back stronger',
    quote: 'This hurts. But we learn, we grow, and we come back with something to prove.',
    effects: { morale: 1, hype: -1 },
  },
  {
    tone: 'HUMBLE',
    label: 'Accepting the result',
    quote: 'They were better today. We have to be honest with ourselves and use this as fuel.',
    effects: { morale: -1 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Look inward',
    quote: 'We didn\'t execute at the level we needed to. That\'s on us to fix.',
    effects: { morale: -2, dramaChance: 8 },
  },
];

const POST_LOSS_OPTIONS_ELIMINATED_B: InterviewOption[] = [
  {
    tone: 'BLAME_SELF',
    label: 'Full accountability',
    quote: 'I\'m not going to hide behind excuses. We weren\'t good enough this tournament. I wasn\'t good enough. That\'s the honest truth and it starts with me.',
    effects: { morale: -2, sponsorTrust: 5, dramaChance: 4 },
  },
  {
    tone: 'RESPECTFUL',
    label: 'Credit where it\'s due',
    quote: 'The teams that went further deserved it. We have to be honest — they were better. We take that on the chin and use it to motivate what comes next.',
    effects: { morale: -1, sponsorTrust: 3 },
  },
  {
    tone: 'AGGRESSIVE',
    label: 'We\'ll be back with a point to prove',
    quote: 'This is not how our story ends. We\'re going to use this elimination as the starting point for something bigger. Remember this feeling.',
    effects: { morale: 1, hype: 1, rivalryDelta: 5 },
  },
];

const PRE_OPTIONS_OPENING: InterviewOption[] = [
  {
    tone: 'HUMBLE',
    label: 'A lifelong dream',
    quote: 'This has been my dream for a very long time. It means a lot to be here now where I watched my heroes grow up.',
    effects: { morale: 2, hype: 1, fanbase: 2 },
  },
  {
    tone: 'CONFIDENT',
    label: 'Ready to make a statement',
    quote: "It's the first game of the season and you want to start off hot so... I think it is a pretty big deal if we beat them.",
    effects: { morale: 2, hype: 2 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Just enjoy the moment',
    quote: "It's always going to be fun seeing people across the stage screaming and yelling at them, who knows?",
    effects: { dramaChance: 4 },
  },
];

const PRE_OPTIONS_OPENING_B: InterviewOption[] = [
  {
    tone: 'CONFIDENT',
    label: 'Dream come true, here to prove it',
    quote: "I can't wait for the tournament to start because it's a dream come true to be here with the best teams in the region. Everything about this is exciting to me, I just want to face every single team in the league and prove what I can do.",
    effects: { morale: 3, hype: 2, fanbase: 2 },
  },
  {
    tone: 'HUMBLE',
    label: 'Excited for the competition',
    quote: "I'm the most excited to play against the best teams in {regionName} which has been one of the strongest regions for Valorant. I believe it's going to be a fantastic tournament and I can't wait for it to start.",
    effects: { morale: 2, sponsorTrust: 2 },
  },
  {
    tone: 'DEFLECTIVE',
    label: 'Just deliver',
    quote: 'Hopefully we deliver a banger match.',
    effects: { dramaChance: 3 },
  },
  {
    tone: 'TRASH_TALK',
    label: 'Hope we destroy them',
    quote: "Obviously, I want to win. {teamName} has a good structure. Both teams have a lot of fire power. But I hope we just destroy them.",
    effects: { morale: 3, hype: 3, rivalryDelta: 10 },
  },
];

// ============================================================================
// Pre-match generator
// ============================================================================

export function generateTournamentContextPreMatchInterview(
  context: TournamentMatchContext,
): PendingInterview | null {
  const name = context.tournamentDisplayName ?? 'the tournament';
  const wins = context.teamRecord?.wins ?? 0;
  const losses = context.teamRecord?.losses ?? 0;
  const round = context.roundNumber ?? 1;

  const vars = {
    tournamentName: name,
    wins,
    losses,
    roundNumber: round,
    qualifiesFor: context.qualifiesFor ?? '',
    teamName: context.opponent?.teamName ?? 'them',
    regionName: context.regionName ?? 'the region',
  };

  // Grand final
  if (context.isGrandFinal) {
    const prompt = pick([
      interpolate('This is the grand final of {tournamentName}. What does this moment mean to you?', vars),
      interpolate('You\'ve made it to the grand final of {tournamentName}. How does the team feel heading in?', vars),
      interpolate('Grand final of {tournamentName} — the biggest match of the tournament. What\'s the mindset?', vars),
    ]);
    return makePending('tc_pre_grand_final', prompt, pick([PRE_OPTIONS_GRAND_FINAL, PRE_OPTIONS_GRAND_FINAL_B]), context.opponent?.teamId);
  }

  // Opening match
  if (context.isOpeningMatch) {
    const prompt = pick([
      interpolate('This is your first match of {tournamentName}. What does this moment mean to you going in?', vars),
      interpolate('Today kicks off your {tournamentName} campaign. How does the team feel heading into this opening match?', vars),
      interpolate('You\'re about to play the first match of {tournamentName}. What\'s the preparation been like this week?', vars),
    ]);
    const rawOptions = pick([PRE_OPTIONS_OPENING, PRE_OPTIONS_OPENING_B]);
    const options = rawOptions.map((opt) => ({ ...opt, quote: interpolate(opt.quote, vars) }));
    return makePending('tc_pre_opening', prompt, options, context.opponent?.teamId);
  }

  // Bracket final — qualifying stakes
  if (context.isBracketFinal && context.qualifiesFor) {
    const prompt = pick([
      interpolate('Winning this match means qualifying for {qualifiesFor}. What does that mean to you and your team?', vars),
      interpolate('You\'re one win away from {qualifiesFor}. How does the team prepare for a match this significant?', vars),
      interpolate('This match could send you to {qualifiesFor}. How do you handle the weight of what\'s at stake?', vars),
    ]);
    return makePending('tc_pre_bracket_final', prompt, pick([PRE_OPTIONS_PRESSURE, PRE_OPTIONS_PRESSURE_B]), context.opponent?.teamId);
  }

  // Lower bracket — elimination risk
  if (context.bracketPosition === 'lower' && context.eliminationRisk) {
    const prompt = pick([
      interpolate('You\'re in the lower bracket of {tournamentName} with a {wins}-{losses} record. One more loss and you\'re out. How do you prepare for a match this high-stakes?', vars),
      interpolate('This is an elimination match for your team in {tournamentName}. Win or go home — what\'s the mentality in the server room?', vars),
      interpolate('Win or you\'re done. That\'s the reality in {tournamentName} right now. How does the team handle that pressure?', vars),
    ]);
    return makePending('tc_pre_lower_elimination', prompt, pick([PRE_OPTIONS_PRESSURE, PRE_OPTIONS_PRESSURE_B]), context.opponent?.teamId);
  }

  // Lower bracket — still alive
  if (context.bracketPosition === 'lower') {
    const prompt = pick([
      interpolate('You\'re fighting through the lower bracket of {tournamentName} at {wins}-{losses}. What\'s the approach going into this one?', vars),
      interpolate('Lower bracket of {tournamentName}, round {roundNumber}. You\'ve survived so far — what keeps the team focused?', vars),
      interpolate('Another lower bracket match in {tournamentName}. You\'re still alive at {wins}-{losses}. What does this match mean to the team?', vars),
    ]);
    return makePending('tc_pre_lower_survival', prompt, pick([PRE_OPTIONS_SURVIVAL, PRE_OPTIONS_SURVIVAL_B]), context.opponent?.teamId);
  }

  // Middle bracket
  if (context.bracketPosition === 'middle') {
    const prompt = pick([
      interpolate('You\'re in the middle bracket of {tournamentName} with a {wins}-{losses} record. How does the team stay focused after the setback?', vars),
      interpolate('Middle bracket of {tournamentName}, round {roundNumber}. You\'ve still got a path forward — what\'s the mindset?', vars),
      interpolate('You dropped to the middle bracket in {tournamentName}. What does the team need to do to keep the run alive?', vars),
    ]);
    return makePending('tc_pre_middle_bracket', prompt, pick([PRE_OPTIONS_SURVIVAL, PRE_OPTIONS_SURVIVAL_B]), context.opponent?.teamId);
  }

  // Upper bracket — not grand final, not opening
  if (context.bracketPosition === 'upper') {
    const prompt = pick([
      interpolate('You\'re in the upper bracket of {tournamentName} heading into round {roundNumber}. How is the team feeling after the results so far?', vars),
      interpolate('Upper bracket of {tournamentName}, {wins}-{losses} in the tournament. What are the expectations going into this match?', vars),
      interpolate('You\'re still undefeated in {tournamentName} heading into this match. How do you maintain that focus?', vars),
    ]);
    return makePending('tc_pre_upper_bracket', prompt, pick([PRE_OPTIONS_READY, PRE_OPTIONS_READY_B]), context.opponent?.teamId);
  }

  // Swiss / league stage (bracketPosition === null)
  if (context.teamRecord) {
    const prompt = pick([
      interpolate('You\'re {wins}-{losses} in {tournamentName} heading into this match. What does the team need to do to move forward?', vars),
      interpolate('At {wins}-{losses} in {tournamentName}, how important is this match to your tournament hopes?', vars),
      interpolate('Your record stands at {wins}-{losses} in {tournamentName}. Walk us through the preparation for today.', vars),
    ]);
    return makePending('tc_pre_record_based', prompt, pick([PRE_OPTIONS_READY, PRE_OPTIONS_READY_B]), context.opponent?.teamId);
  }

  return null;
}

// ============================================================================
// Post-match generator
// ============================================================================

export function generateTournamentContextPostMatchInterview(
  context: TournamentMatchContext,
  won: boolean,
): PendingInterview | null {
  const name = context.tournamentDisplayName ?? 'the tournament';
  const wins = context.teamRecord?.wins ?? 0;
  const losses = context.teamRecord?.losses ?? 0;
  const qualifiesForStr = context.qualifiesFor;

  const vars = {
    tournamentName: name,
    wins,
    losses,
    roundNumber: context.roundNumber ?? 1,
    qualifiesFor: qualifiesForStr ?? '',
    qualifiesForClause: qualifiesForClause(qualifiesForStr),
  };

  if (won) {
    // Grand final win
    if (context.isGrandFinal) {
      const prompt = pick([
        interpolate('You\'ve just won {tournamentName}! What does this championship mean to you?', vars),
        interpolate('{tournamentName} champions. Soak it in — what are you feeling right now?', vars),
        interpolate('You are the {tournamentName} champions. What was the key to winning it all?', vars),
      ]);
      return makePostPending('tc_post_win_grand_final', prompt, POST_WIN_OPTIONS_GRAND_FINAL);
    }

    // Win — opening match
    if (context.isOpeningMatch) {
      const prompt = pick([
        interpolate('You open your {tournamentName} campaign with a win. How does it feel to get that first one?', vars),
        interpolate('Strong start to {tournamentName} — you\'re 1-0 in the tournament. What did that match show about your team?', vars),
        interpolate('First match, first win in {tournamentName}. What\'s the biggest takeaway from that performance?', vars),
      ]);
      return makePostPending('tc_post_win_first_match', prompt, pick([POST_WIN_OPTIONS_ADVANCE, POST_WIN_OPTIONS_ADVANCE_B]));
    }

    // Win — bracket final (qualifies for next event)
    if (context.isBracketFinal && qualifiesForStr) {
      const prompt = pick([
        interpolate('Congratulations! You\'ve qualified for {qualifiesFor}! What does it mean to your team to reach that stage?', vars),
        interpolate('That win books your ticket to {qualifiesFor}! Are you excited for what\'s next?', vars),
        interpolate('You\'re going to {qualifiesFor}! Let that sink in — what are you feeling right now?', vars),
      ]);
      return makePostPending('tc_post_win_bracket_final', prompt, POST_WIN_OPTIONS_QUALIFY);
    }

    // Win — lower bracket
    if (context.bracketPosition === 'lower') {
      const prompt = pick([
        interpolate('You survive another match in the lower bracket of {tournamentName} — now {wins}-{losses}. The run continues. What\'s next?', vars),
        interpolate('Lower bracket, another win. You\'re {wins}-{losses} in {tournamentName} and still in it. What keeps the team resilient?', vars),
        interpolate('You stay alive in the lower bracket of {tournamentName}. That makes you {wins}-{losses} in the tournament. What did this match mean?', vars),
      ]);
      return makePostPending('tc_post_win_lower_advancing', prompt, pick([POST_WIN_OPTIONS_ADVANCE, POST_WIN_OPTIONS_LOWER_B]));
    }

    // Win — middle bracket
    if (context.bracketPosition === 'middle') {
      const prompt = pick([
        interpolate('You stay alive in the middle bracket of {tournamentName} — now {wins}-{losses}. The fight continues. What\'s next?', vars),
        interpolate('Another win in the middle bracket of {tournamentName}. You\'re {wins}-{losses} and still in it. What keeps the team going?', vars),
        interpolate('Middle bracket, another win. You\'re {wins}-{losses} in {tournamentName} and not done yet. What did this match mean?', vars),
      ]);
      return makePostPending('tc_post_win_middle_advancing', prompt, pick([POST_WIN_OPTIONS_ADVANCE, POST_WIN_OPTIONS_LOWER_B]));
    }

    // Win — upper bracket
    if (context.bracketPosition === 'upper') {
      const prompt = pick([
        interpolate('That win keeps you in the upper bracket — you\'re now {wins}-{losses} in {tournamentName}. What\'s the mood in the server room right now?', vars),
        interpolate('Solid performance. You advance in the upper bracket of {tournamentName} with a {wins}-{losses} record. What did this match teach you?', vars),
        interpolate('Another upper bracket win in {tournamentName}. You\'re {wins}-{losses}. How does the team feel about where you\'re sitting?', vars),
      ]);
      return makePostPending('tc_post_win_upper_advancing', prompt, pick([POST_WIN_OPTIONS_ADVANCE, POST_WIN_OPTIONS_ADVANCE_B]));
    }

    // Win — Swiss / league stage
    const prompt = pick([
      interpolate('You improve to {wins}-{losses} in {tournamentName}. How important was that win for your tournament positioning?', vars),
      interpolate('{wins}-{losses} in {tournamentName} now. Walk us through what went well in that match.', vars),
      interpolate('Good result — you\'re {wins}-{losses} in {tournamentName}. What does this mean for where you stand in the tournament?', vars),
    ]);
    return makePostPending('tc_post_win_swiss', prompt, pick([POST_WIN_OPTIONS_ADVANCE, POST_WIN_OPTIONS_ADVANCE_B]));

  } else {
    // Loss — elimination
    if (context.eliminationRisk) {
      const prompt = pick([
        interpolate('Your team has been eliminated from {tournamentName}{qualifiesForClause}. That\'s a devastating result — what are you taking away from this?', vars),
        interpolate('That\'s it for {tournamentName}. You finish with a {wins}-{losses} record. What went wrong?', vars),
        interpolate('The run is over in {tournamentName}. Eliminated at {wins}-{losses}. What\'s the honest reflection on this campaign?', vars),
      ]);
      return makePostPending('tc_post_loss_eliminated', prompt, pick([POST_LOSS_OPTIONS_ELIMINATED, POST_LOSS_OPTIONS_ELIMINATED_B]));
    }

    // Loss — grand final (runner-up)
    if (context.isGrandFinal) {
      const prompt = pick([
        interpolate('You came so close — runner-up in {tournamentName}. What went wrong in that final match?', vars),
        interpolate('Grand final of {tournamentName} — and it slipped away. How does the team process a result like this?', vars),
        interpolate('Second place in {tournamentName}. You made it to the end but couldn\'t close it out. What\'s the feeling in the team right now?', vars),
      ]);
      return makePostPending('tc_post_loss_grand_final', prompt, pick([POST_LOSS_OPTIONS_ELIMINATED, POST_LOSS_OPTIONS_ELIMINATED_B]));
    }

    // Loss — dropped from upper bracket
    if (context.bracketPosition === 'upper') {
      const dropsTo = context.tournamentType === 'kickoff' ? 'middle' : 'lower';
      const prompt = pick([
        interpolate(`That loss sends you to the ${dropsTo} bracket of {tournamentName}. You\'re still alive but the margin for error just got smaller. What changes are you making?`, vars),
        interpolate(`You drop to the ${dropsTo} bracket with a {wins}-{losses} record in {tournamentName}. How does the team respond to adversity?`, vars),
        interpolate(`From upper to ${dropsTo} bracket in {tournamentName} — that\'s a tough result at {wins}-{losses}. What\'s the mindset now?`, vars),
      ]);
      return makePostPending('tc_post_loss_dropped_to_lower', prompt, pick([POST_LOSS_OPTIONS_LOWER, POST_LOSS_OPTIONS_LOWER_B]));
    }

    // Loss — dropped from middle bracket
    if (context.bracketPosition === 'middle') {
      const prompt = pick([
        interpolate('That loss sends you to the lower bracket of {tournamentName}. You\'re {wins}-{losses} — one more loss and you\'re out. What changes?', vars),
        interpolate('You drop from the middle to the lower bracket in {tournamentName}. At {wins}-{losses}, the margin for error is gone. How does the team respond?', vars),
        interpolate('From middle to lower bracket in {tournamentName} — that\'s a tough result at {wins}-{losses}. What\'s the mindset now?', vars),
      ]);
      return makePostPending('tc_post_loss_middle_dropped', prompt, pick([POST_LOSS_OPTIONS_LOWER, POST_LOSS_OPTIONS_LOWER_B]));
    }

    // Loss — lower bracket, survived
    if (context.bracketPosition === 'lower') {
      const prompt = pick([
        interpolate('Tough loss in the lower bracket of {tournamentName}. You\'re {wins}-{losses} and still alive — but barely. What does the team need to fix?', vars),
        interpolate('That one hurt. You drop to {wins}-{losses} in the lower bracket of {tournamentName}. How do you recover mentally before the next match?', vars),
        interpolate('Still in {tournamentName} but it\'s getting tighter — {wins}-{losses} in the lower bracket. What went wrong today?', vars),
      ]);
      return makePostPending('tc_post_loss_lower_survival', prompt, pick([POST_LOSS_OPTIONS_LOWER, POST_LOSS_OPTIONS_LOWER_B]));
    }

    // Loss — opening match
    if (context.isOpeningMatch) {
      const prompt = pick([
        interpolate('That\'s a rough start to {tournamentName} — you fall to 0-1. How does the team regroup from this?', vars),
        interpolate('You open {tournamentName} with a loss. What\'s the conversation in the locker room after that?', vars),
        interpolate('0-1 after your first match in {tournamentName}. What went wrong and how quickly can you fix it?', vars),
      ]);
      return makePostPending('tc_post_loss_first_match', prompt, pick([POST_LOSS_OPTIONS_LOWER, POST_LOSS_OPTIONS_LOWER_B]));
    }

    // Loss — Swiss / league stage
    const prompt = pick([
      interpolate('You fall to {wins}-{losses} in {tournamentName}. How does that affect your confidence going forward?', vars),
      interpolate('A loss drops you to {wins}-{losses} in {tournamentName}. What adjustments need to happen?', vars),
      interpolate('{wins}-{losses} in {tournamentName} after that result. Where does the team go from here?', vars),
    ]);
    return makePostPending('tc_post_loss_swiss', prompt, pick([POST_LOSS_OPTIONS_LOWER, POST_LOSS_OPTIONS_LOWER_B]));
  }
}
