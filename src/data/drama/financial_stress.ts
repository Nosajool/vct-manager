import type { DramaEventTemplate } from '../../types/drama';

export const FINANCIAL_STRESS_EVENTS: DramaEventTemplate[] = [
  // ==========================================================================
  // STAGE 1 — WARNING (1-2 consecutive negative months)
  // ==========================================================================

  {
    id: 'financial_stress_sponsor_warning',
    category: 'financial_stress',
    severity: 'minor',
    title: 'Sponsor Performance Review',
    description:
      '{sponsorName} has flagged declining results in their quarterly review. They\'re asking about your competitive outlook.',
    conditions: [
      { type: 'consecutive_negative_months_above', threshold: 1 },
    ],
    probability: 60,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_sponsor_trust', delta: -10 },
      { target: 'set_flag', flag: 'sponsor_on_notice', flagDuration: 30 },
    ],
  },

  {
    id: 'financial_stress_board_memo',
    category: 'financial_stress',
    severity: 'minor',
    title: 'Board Budget Memo',
    description:
      'The front office has circulated a memo expressing concern about the team\'s finances. Costs need to come down.',
    conditions: [
      { type: 'consecutive_negative_months_above', threshold: 2 },
    ],
    probability: 70,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'team_hype', delta: -5 },
      { target: 'set_flag', flag: 'board_watching', flagDuration: 60 },
    ],
  },

  // ==========================================================================
  // STAGE 2 — RESTRICTED (3 consecutive negative months)
  // ==========================================================================

  {
    id: 'financial_stress_emergency_review',
    category: 'financial_stress',
    severity: 'major',
    title: 'Emergency Budget Review',
    description:
      'The board has called an emergency meeting. Three consecutive months of losses have them demanding action.',
    conditions: [
      { type: 'consecutive_negative_months_above', threshold: 3 },
    ],
    probability: 80,
    cooldownDays: 3,
    oncePerSeason: true,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'austerity_cuts',
        text: 'Implement austerity cuts',
        description: 'Cut costs across the board. Players will feel it.',
        effects: [
          { target: 'set_flag', flag: 'austerity_mode', flagDuration: 90 },
          { target: 'team_chemistry', delta: -5 },
        ],
        outcomeText:
          'The board approves the austerity plan. Travel budgets shrink, facility usage is rationed, and the team house atmosphere tightens. Players notice. They always notice.',
      },
      {
        id: 'emergency_loan',
        text: 'Take emergency loan',
        description: "Borrow to buy time. The interest will sting later.",
        effects: [
          { target: 'set_flag', flag: 'emergency_loan_requested' },
          { target: 'team_hype', delta: 5 },
        ],
        outcomeText:
          'The org secures emergency financing. The immediate pressure eases, but the debt clock starts ticking. At least players can stop worrying — for now.',
      },
      {
        id: 'turnaround_promise',
        text: 'Promise turnaround by next tournament',
        description: 'Rally the troops with a public commitment. Better not miss.',
        effects: [
          { target: 'set_flag', flag: 'turnaround_promised', flagDuration: 60 },
          { target: 'team_hype', delta: 10 },
        ],
        outcomeText:
          'You go public with a confident statement about the team\'s trajectory. Community reaction is mixed. The board gave you one tournament to prove it. The clock is running.',
      },
    ],
  },

  {
    id: 'financial_stress_star_demands',
    category: 'financial_stress',
    severity: 'major',
    title: 'Star Player Smells Blood',
    description:
      "{playerName}'s agent has called. They know about the financial situation and want a new deal signed before things get worse.",
    conditions: [
      { type: 'consecutive_negative_months_above', threshold: 3 },
      { type: 'flag_active', flag: 'board_watching' },
      { type: 'player_contract_expiring', contractYearsThreshold: 1, playerSelector: 'star_player' },
    ],
    probability: 65,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'sign_premium',
        text: 'Sign at premium (+30%)',
        description: 'Lock them in. Pay the premium. Keep the roster stable.',
        effects: [
          { target: 'team_budget', delta: -75000 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: 20 },
        ],
        outcomeText:
          'The deal is done. {playerName} is signed and visibly relieved. It cost you, but roster continuity has its own value when everything else is uncertain.',
      },
      {
        id: 'stall_promises',
        text: 'Stall with promises',
        description: "Buy time. Hope the finances improve before they force the issue.",
        effects: [
          { target: 'set_flag', flag: 'contract_stalled', flagDuration: 45 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -10 },
        ],
        outcomeText:
          'You tell {playerName} the org is working on it. They hear "no" in everything you don\'t say. Their agent starts making calls.',
      },
      {
        id: 'put_on_market',
        text: 'Put them on the market',
        description: 'Cut the cord. Recoup transfer value before the contract expires.',
        effects: [
          { target: 'set_flag', flag: 'player_on_market', flagDuration: 60 },
          { target: 'player_morale', effectPlayerSelector: 'triggering', delta: -20 },
        ],
        outcomeText:
          'Word leaks in 48 hours — these things always do. {playerName} is devastated. The locker room is tense. The transfer window is now your lifeline.',
      },
    ],
  },

  // ==========================================================================
  // STAGE 3 — CRITICAL (5+ consecutive negative months)
  // ==========================================================================

  {
    id: 'financial_stress_investor_offer',
    category: 'financial_stress',
    severity: 'major',
    title: 'Investor Acquisition Offer',
    description:
      "A private equity firm has approached the org about a controlling stake. It would solve the money problems — but they have opinions about the roster.",
    conditions: [
      { type: 'consecutive_negative_months_above', threshold: 5 },
    ],
    probability: 75,
    cooldownDays: 3,
    oncePerSeason: false,
    requiresPlayerTeam: true,
    choices: [
      {
        id: 'accept_majority',
        text: 'Accept — sell majority stake',
        description: 'Full acquisition. The money problems end. So does your autonomy.',
        effects: [
          { target: 'team_budget', delta: 500000 },
          { target: 'set_flag', flag: 'investor_control' },
          { target: 'team_hype', delta: 15 },
        ],
        outcomeText:
          'The deal closes. The org\'s financial bleeding stops overnight. The new owners send a memo about "roster optimization priorities." You wonder what that means for your players.',
      },
      {
        id: 'negotiate_minority',
        text: 'Negotiate partial stake',
        description: 'Take the money but retain control. A compromise — everyone gives something up.',
        effects: [
          { target: 'team_budget', delta: 200000 },
          { target: 'set_flag', flag: 'investor_minority' },
          { target: 'team_hype', delta: 5 },
        ],
        outcomeText:
          'You negotiate a minority stake deal. The org gets a cash injection; the investors get a seat at the table. You retain control — for now. These arrangements have a way of evolving.',
      },
      {
        id: 'decline_offer',
        text: 'Decline — find another way',
        description: 'Protect the vision. Figure the rest out later.',
        effects: [
          { target: 'team_hype', delta: -5 },
        ],
        outcomeText:
          'You turn them down. The team\'s independence stays intact. So does the financial pressure. Everyone in the building knows you just passed on the lifeboat.',
      },
    ],
  },

  // ==========================================================================
  // RECOVERY — Board pressure lifts when finances improve
  // ==========================================================================

  {
    id: 'financial_stress_recovery',
    category: 'financial_stress',
    severity: 'minor',
    title: 'Financial Recovery Signal',
    description:
      "After a tough stretch, the team's cash position is improving. The board has relaxed.",
    conditions: [
      { type: 'consecutive_negative_months_above', threshold: 0 },
      { type: 'flag_active', flag: 'board_watching' },
    ],
    probability: 90,
    cooldownDays: 3,
    requiresPlayerTeam: true,
    effects: [
      { target: 'clear_flag', flag: 'board_watching' },
      { target: 'team_hype', delta: 5 },
    ],
  },
];
