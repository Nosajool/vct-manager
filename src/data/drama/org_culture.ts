import type { DramaEventTemplate } from '../../types/drama';

export const ORG_CULTURE_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // HOME VISIT ARC (player-scoped, flags use {playerId})
  // ==========================================================================

  {
    id: 'home_visit_request',
    category: 'org_culture',
    severity: 'major',
    title: 'Home Visit Request',
    description:
      "{playerName} has approached the coaching staff — they haven't seen family in months and are asking if they can fly home for a few days. It's a personal request, and how the org responds will say a lot.",
    conditions: [
      { type: 'player_on_active_roster', playerSelector: 'condition_match' },
      { type: 'flag_not_active', flag: 'home_visit_paid_{playerId}' },
      { type: 'flag_not_active', flag: 'home_visit_approved_{playerId}' },
      { type: 'flag_not_active', flag: 'home_visit_denied_{playerId}' },
      { type: 'random_chance', chance: 30 },
    ],
    probability: 60,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'pay_for_flights',
        text: 'Cover everything — flights, hotel, the works',
        description: "The org pays for the trip entirely. Players notice when an org puts its money where its mouth is.",
        effects: [
          { target: 'team_budget', delta: -8000 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 15 },
          { target: 'team_chemistry', delta: 5 },
          { target: 'move_to_reserve', effectPlayerSelector: 'triggering' },
          { target: 'set_flag', flag: 'home_visit_paid_{playerId}', flagDuration: 10 },
          { target: 'set_flag', flag: 'org_generous' },
        ],
        outcomeText:
          "The org covers every expense without hesitation. {playerName} is visibly moved — word travels fast in team houses. The whole roster takes notice.",
      },
      {
        id: 'approve_unpaid',
        text: 'Approve the trip — they cover their own costs',
        description: 'You give permission but the player pays their own way. Better than nothing.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 5 },
          { target: 'move_to_reserve', effectPlayerSelector: 'triggering' },
          { target: 'set_flag', flag: 'home_visit_approved_{playerId}', flagDuration: 8 },
        ],
        outcomeText:
          "{playerName} books the flights themselves. They're grateful for the time off, though the financial burden sits in the back of their mind.",
      },
      {
        id: 'deny_request',
        text: "Deny the request — competition prep comes first",
        description: 'Hard no. The team needs to stay focused.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -20 },
          { target: 'team_chemistry', delta: -5 },
          { target: 'set_flag', flag: 'home_visit_denied_{playerId}', flagDuration: 30 },
        ],
        outcomeText:
          "{playerName} absorbs the news quietly. They don't push back, but something has shifted. The team house feels a little more tense.",
      },
    ],
  },

  {
    id: 'home_visit_missed_connection',
    category: 'org_culture',
    severity: 'minor',
    title: 'Missed Connecting Flight',
    description:
      '{playerName} hit a connection delay on the way back. A day of prep is already gone.',
    conditions: [
      {
        type: 'or',
        anyOf: [
          { type: 'flag_active', flag: 'home_visit_paid_{playerId}' },
          { type: 'flag_active', flag: 'home_visit_approved_{playerId}' },
        ],
      },
      { type: 'random_chance', chance: 35 },
    ],
    probability: 70,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_form', effectPlayerSelector: 'triggering', delta: -10 },
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -5 },
      { target: 'set_flag', flag: 'home_visit_delayed_{playerId}', flagDuration: 5 },
    ],
  },

  {
    id: 'home_visit_prep_missed',
    category: 'org_culture',
    severity: 'minor',
    title: 'Delayed Return Costs Prep Time',
    description:
      '{playerName} made it back but missed key scrim sessions. They look a step behind in practice today.',
    conditions: [
      { type: 'flag_active', flag: 'home_visit_delayed_{playerId}' },
    ],
    probability: 85,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_form', effectPlayerSelector: 'triggering', delta: -10 },
      { target: 'team_chemistry', delta: -5 },
      { target: 'move_to_active', effectPlayerSelector: 'triggering' },
    ],
  },

  {
    id: 'home_visit_return_refreshed',
    category: 'org_culture',
    severity: 'minor',
    title: 'Back Home, Recharged',
    description:
      '{playerName} returned from the trip looking re-energized. Sometimes players just need to go home.',
    conditions: [
      {
        type: 'or',
        anyOf: [
          { type: 'flag_active', flag: 'home_visit_paid_{playerId}' },
          { type: 'flag_active', flag: 'home_visit_approved_{playerId}' },
        ],
      },
      { type: 'flag_not_active', flag: 'home_visit_delayed_{playerId}' },
    ],
    probability: 85,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 10 },
      { target: 'player_form', effectPlayerSelector: 'triggering', delta: 5 },
      { target: 'move_to_active', effectPlayerSelector: 'triggering' },
    ],
  },

  // ==========================================================================
  // ORG CULTURE / CHICKEN NUGGET ARC (team-scoped)
  // ==========================================================================

  {
    id: 'equipment_request_denied',
    category: 'org_culture',
    severity: 'major',
    title: 'Equipment Request',
    description:
      "One of your players wants new peripherals — a new mouse, monitor, maybe a headset. For pros, gear matters. The org's response matters more.",
    conditions: [
      { type: 'team_budget_below', threshold: 50000 },
      { type: 'flag_not_active', flag: 'equipment_covered' },
    ],
    probability: 55,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'buy_anything',
        text: 'Get them whatever they want',
        description: 'Full peripheral budget. No questions asked.',
        effects: [
          { target: 'team_budget', delta: -5000 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 10 },
          { target: 'player_form', effectPlayerSelector: 'triggering', delta: 3 },
          { target: 'set_flag', flag: 'equipment_covered', flagDuration: 90 },
        ],
        outcomeText:
          "A fresh setup arrives within days. The player is locked in. The rest of the roster makes a mental note.",
      },
      {
        id: 'reasonable_limit',
        text: 'Approve a reasonable budget',
        description: "Cover the essentials, not the premium tier.",
        effects: [
          { target: 'team_budget', delta: -2000 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 5 },
        ],
        outcomeText:
          "The player gets most of what they wanted. It's not everything, but it's enough. They move on.",
      },
      {
        id: 'deny_equipment',
        text: "Deny the request — use what you have",
        description: 'Budget is tight. The gear works fine.',
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -15 },
          { target: 'set_flag', flag: 'equipment_denied_{playerId}', flagDuration: 60 },
        ],
        outcomeText:
          "The player says nothing. But they remember. Cheap orgs have long memories too — from the other direction.",
      },
    ],
  },

  {
    id: 'late_salary_payment',
    category: 'org_culture',
    severity: 'major',
    title: 'Payroll Delay',
    description:
      "The org's cash flow has hit a rough patch. Payroll is due and the numbers aren't there. Players haven't been paid yet, and they're starting to notice.",
    conditions: [
      { type: 'team_budget_below', threshold: 30000 },
      { type: 'random_chance', chance: 50 },
    ],
    probability: 70,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'liquidate_pay',
        text: 'Pay on time — sell assets to cover it',
        description: 'Players get paid. The org takes the hit.',
        effects: [
          { target: 'team_budget', delta: -20000 },
          { target: 'player_morale', effectPlayerSelector: 'all', delta: 5 },
        ],
        outcomeText:
          "Salaries go out on schedule. Players never know anything was wrong. Sometimes that's exactly the point.",
      },
      {
        id: 'delay_with_explanation',
        text: "Delay — explain the situation honestly",
        description: "Tell the players what's happening. They'll respect transparency.",
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -15 },
          { target: 'team_chemistry', delta: -10 },
          { target: 'set_flag', flag: 'late_pay_scandal', flagDuration: 30 },
        ],
        outcomeText:
          "You hold a team meeting and lay it out plainly. The room goes quiet. They appreciate honesty, but trust has taken a hit. Someone's going to tell their agent.",
      },
      {
        id: 'promise_bonus',
        text: 'Promise a bonus when things stabilize',
        description: "Buy time with a promise. It might work, it might not.",
        effects: [
          { target: 'player_morale', effectPlayerSelector: 'all', delta: -10 },
          { target: 'set_flag', flag: 'pay_bonus_promised', flagDuration: 60 },
        ],
        outcomeText:
          "You tell everyone it'll be made right. Half of them believe you. The other half start checking their contracts.",
      },
    ],
  },

  {
    id: 'housing_stipend_complaint',
    category: 'org_culture',
    severity: 'minor',
    title: 'Housing Situation Getting Old',
    description:
      "Players are venting — quietly at first, then less quietly. The housing stipend doesn't cover what it used to, and the team house is showing its age.",
    conditions: [
      { type: 'team_budget_below', threshold: 60000 },
      { type: 'flag_not_active', flag: 'housing_covered' },
      { type: 'flag_not_active', flag: 'chicken_nugget_org' },
    ],
    probability: 45,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: -8 },
      { target: 'team_chemistry', delta: -5 },
    ],
  },

  {
    id: 'org_housing_upgrade',
    category: 'org_culture',
    severity: 'minor',
    title: 'Housing Upgrade',
    description:
      "The org commits to a proper team house upgrade — new furniture, better internet, the whole package. It's small in the grand scheme of things, but players remember when an org actually invests in them.",
    conditions: [
      { type: 'team_budget_above', threshold: 100000 },
      { type: 'flag_not_active', flag: 'housing_covered' },
    ],
    probability: 40,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'player_morale', effectPlayerSelector: 'all', delta: 10 },
      { target: 'team_chemistry', delta: 5 },
      { target: 'set_flag', flag: 'housing_covered', flagDuration: 180 },
    ],
  },

  {
    id: 'chicken_nugget_meme_spreading',
    category: 'org_culture',
    severity: 'minor',
    title: 'Chicken Nugget Org',
    description:
      "Someone posted. Now Reddit has a new meme. Your org is the chicken nugget org — underpaid, under-resourced, and apparently subsisting on fast food budgets. The community finds it hilarious.",
    conditions: [
      { type: 'team_budget_below', threshold: 40000 },
      { type: 'flag_not_active', flag: 'chicken_nugget_org' },
    ],
    probability: 35,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_sponsor_trust', delta: -5 },
      { target: 'team_hype', delta: -5 },
      { target: 'set_flag', flag: 'chicken_nugget_org', flagDuration: 45 },
    ],
    escalateDays: 5,
    escalationTemplateId: 'embrace_the_nuggets',
  },

  {
    id: 'embrace_the_nuggets',
    category: 'org_culture',
    severity: 'major',
    title: 'To Embrace or Not to Embrace',
    description:
      "The chicken nugget meme has reached peak velocity. A coach's tweet is going viral. Players are tagged in memes hourly. The community is watching to see how the org responds — and it's becoming a statement.",
    conditions: [
      { type: 'flag_active', flag: 'chicken_nugget_org' },
    ],
    probability: 90,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'embrace_meme',
        text: 'Lean in — players bring nuggets on stage',
        description: 'Turn the joke into a brand moment. The crowd will love it.',
        effects: [
          { target: 'team_hype', delta: 20 },
          { target: 'team_sponsor_trust', delta: -5 },
          { target: 'set_flag', flag: 'nugget_embraced' },
          { target: 'clear_flag', flag: 'chicken_nugget_org' },
        ],
        outcomeText:
          "Your players show up to the next LAN with a literal 20-piece nugget box. The crowd erupts. It's chaotic, it's perfect, and somehow it works. The brand people are less thrilled.",
      },
      {
        id: 'respond_seriously',
        text: 'Put out a serious statement',
        description: 'Address the concerns directly. It kills the joke.',
        effects: [
          { target: 'team_hype', delta: -10 },
          { target: 'team_sponsor_trust', delta: 5 },
          { target: 'clear_flag', flag: 'chicken_nugget_org' },
        ],
        outcomeText:
          "The org releases a measured response about player welfare and investment commitments. The meme dies. So does the entertainment.",
      },
      {
        id: 'ignore_it',
        text: 'Say nothing — ignore the whole thing',
        description: 'Silence. Let it run its course.',
        effects: [],
        outcomeText:
          "The org stays silent. The meme continues to simmer. Probably fine.",
      },
    ],
  },
];
