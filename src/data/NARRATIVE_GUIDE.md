# Narrative Event Guide: Interviews & Drama

This guide is for future Claude Code sessions working on the interview/drama narrative systems. It covers how to design, write, and wire new interview templates and drama events that create persistent, branching storylines.

---

## Core Loop

The narrative engine works like choose-your-own-adventure with **delayed consequences**:

```
Interview option chosen
  → sets a drama flag (setsFlags in InterviewEffects)
  → days pass
  → DramaEngine evaluates conditions each day
  → flag_active condition fires
  → Drama event triggers (probability check)
  → Manager makes a choice
  → effects apply: stats, morale, chemistry, budget, more flags
  → new drama events can trigger from those flags
```

The key insight: **interview choices are seeds, drama events are harvests**. Nothing needs to resolve immediately.

---

## File Map

| File | Purpose |
|------|---------|
| `src/types/interview.ts` | Types for interview templates, options, effects, `TournamentMatchContext` |
| `src/types/drama.ts` | Types for drama conditions, effects, events; also `DRAMA_CONSTANTS` |
| `src/data/interviewTemplates.ts` | The `INTERVIEW_TEMPLATES` array — add new templates here |
| `src/data/dramaEvents.ts` | The `DRAMA_EVENT_TEMPLATES` array — add new drama events here |
| `src/services/InterviewService.ts` | Applies flag effects; filters options by personality; `winIds`/`lossIds` lists |
| `src/services/CalendarService.ts` | Computes `TournamentMatchContext` from bracket, passes to InterviewService |
| `src/services/DramaService.ts` | Builds `DramaGameStateSnapshot` including `tournamentContext` |
| `src/engine/drama/DramaConditionEvaluator.ts` | Evaluates conditions during daily drama tick |

---

## Interview Templates

### Structure

```typescript
{
  id: 'unique_snake_case_id',          // string, no spaces
  context: 'PRE_MATCH' | 'POST_MATCH' | 'CRISIS' | 'KICKOFF',
  subjectType: 'manager' | 'player' | 'coach',
  condition?: InterviewCondition,       // gates when it can appear
  requiresActiveFlag?: string,          // template only eligible if this flag is active
  prompt: string,                       // the reporter's question
  options: InterviewOption[],           // exactly 3 options
}
```

### Available `condition` values

| Value | When it fires |
|-------|--------------|
| `'always'` | Any time this context occurs |
| `'pre_playoff'` | Playoff match upcoming |
| `'rivalry_active'` | Rival team is opponent |
| `'loss_streak_2plus'` | Team lost 2+ in a row |
| `'loss_streak_3plus'` | Team lost 3+ in a row |
| `'win_streak_2plus'` | Team won 2+ in a row |
| `'drama_active'` | Any drama event currently active |
| `'sponsor_trust_low'` | Sponsor trust below threshold |
| `'lower_bracket'` | Team is currently in the lower bracket (Phase 1) |
| `'upper_bracket'` | Team is in the upper bracket (Phase 1) |
| `'elimination_risk'` | One more loss ends the tournament (Phase 1) |
| `'grand_final'` | This is the grand final match (Phase 1) |
| `'opponent_dropped_from_upper'` | Current opponent just dropped from upper bracket (Phase 1) |
| `'team_identity_star_carry'` | `team_identity_star_carry` drama flag is active (Phase 4) |
| `'team_identity_resilient'` | `team_identity_resilient` drama flag is active (Phase 4) |
| `'team_identity_fragile'` | `team_identity_fragile` drama flag is active (Phase 4) |

### POST_MATCH template selection — important

POST_MATCH templates are narrowed to win or loss pools by ID. **Any new POST_MATCH template must have its ID added to `winIds` or `lossIds` in `InterviewService.ts`** or it will never fire.

```typescript
// In InterviewService.ts, inside checkPostMatchInterview():
const winIds = ['post_win_dominant', ..., 'your_new_win_template_id'];
const lossIds = ['post_loss_standard', ..., 'your_new_loss_template_id'];
```

PRE_MATCH and CRISIS templates are not filtered this way — they use all passing candidates.

### Option structure

```typescript
{
  tone: InterviewTone,
  label: string,                  // Short UI label ("Stay confident")
  quote: string,                  // What the person says verbatim
  personalityWeights?: Partial<Record<PlayerPersonality, number>>,
  // 0 = option hidden, 0.5 = less likely, 1 = normal, 2 = preferred
  // Only applies when subjectType === 'player'. Ignored for manager/coach.
  requiresFlags?: string[],       // Option only shown if ALL these flags active
  effects: InterviewEffects,
}
```

### InterviewEffects fields

```typescript
{
  morale?: number,           // All player morale delta
  fanbase?: number,          // reputation.fanbase delta
  hype?: number,             // reputation.hypeLevel delta
  sponsorTrust?: number,     // reputation.sponsorTrust delta
  rivalryDelta?: number,     // Rivalry intensity with opponent
  dramaChance?: number,      // 0-100: random chance to trigger a drama event
  targetPlayerIds?: string[], // If set, morale only hits these players
  setsFlags?: Array<{ key: string; durationDays: number }>,
  clearsFlags?: string[],
}
```

### Available `InterviewTone` values

`CONFIDENT` | `RESPECTFUL` | `TRASH_TALK` | `DEFLECTIVE` | `BLAME_SELF` | `BLAME_TEAM` | `HUMBLE` | `AGGRESSIVE`

### Available `PlayerPersonality` values (for `personalityWeights`)

`FAME_SEEKER` | `TEAM_FIRST` | `BIG_STAGE` | `INTROVERT` | `STABLE`

---

## Drama Event Templates

### Structure

```typescript
{
  id: 'unique_snake_case_id',
  category: DramaCategory,
  severity: 'minor' | 'major',
  title: string,
  description: string,          // Supports {playerName}, {teamName} placeholders
  conditions: DramaCondition[], // ALL must pass
  probability: number,          // 0-100: base probability when conditions met
  cooldownDays?: number,        // Days before this template can fire again
  oncePerSeason?: boolean,
  requiresPlayerTeam?: boolean,
  // For minor events (auto-apply):
  effects?: DramaEffect[],
  // For major events (player chooses):
  choices?: DramaChoice[],
  // Escalation if unresolved:
  escalateDays?: number,
  escalationTemplateId?: string,
  durationDays?: number,
  autoResolveEffects?: DramaEffect[],
}
```

### `DramaCategory` values

`player_ego` | `team_synergy` | `external_pressure` | `practice_burnout` | `breakthrough` | `meta_rumors`

### Condition types reference

```typescript
// Player stat checks
{ type: 'player_stat_below', stat: 'mechanics', threshold: 50, playerSelector: 'any' }
{ type: 'player_stat_above', stat: 'mechanics', threshold: 75, playerSelector: 'star_player' }
{ type: 'player_morale_below', threshold: 40, playerSelector: 'any' }
{ type: 'player_morale_above', threshold: 70, playerSelector: 'star_player' }
{ type: 'player_form_below', threshold: 50, playerSelector: 'any' }
{ type: 'player_form_above', threshold: 60, playerSelector: 'any' }

// Team state
{ type: 'team_chemistry_below', threshold: 55 }
{ type: 'team_chemistry_above', threshold: 70 }
{ type: 'team_win_streak', streakLength: 3 }
{ type: 'team_loss_streak', streakLength: 2 }

// Game state
{ type: 'season_phase', phase: 'stage1' | 'stage2' | 'playoffs' | 'champions' }
{ type: 'tournament_active' }
{ type: 'match_result' }
{ type: 'player_injured' }

// Drama state
{ type: 'flag_active', flag: 'some_flag_key' }    // The interview bridge
{ type: 'category_on_cooldown', category: 'player_ego' }
{ type: 'recent_event_count' }

// Player archetype checks
{ type: 'player_personality', personality: 'INTROVERT' }
{ type: 'player_contract_expiring', contractYearsThreshold: 1 }  // default 1

// Tournament bracket checks (Phase 1)
{ type: 'bracket_position', bracketPosition: 'upper' | 'lower' }
{ type: 'elimination_risk' }   // true if snapshot.tournamentContext.eliminationRisk

// Season timing checks
{ type: 'min_season_day', threshold: 8 }  // Day 1 = first day of season; blocks event in week 1

// Random
{ type: 'random_chance', chance: 20 }  // 0-100
```

### `PlayerSelector` values (for conditions)

`all` | `any` | `specific` | `star_player` | `lowest_morale` | `newest` | `random`

### Effect structure

```typescript
{
  target: DramaEffectTarget,
  effectPlayerSelector?: EffectPlayerSelector,
  playerId?: string,        // with 'specific' selector
  stat?: keyof PlayerStats | 'morale' | 'form' | 'chemistry' | 'budget',
  delta?: number,           // relative change
  absoluteValue?: number,   // set exact value
  flag?: string,            // for set_flag / clear_flag
  flagDuration?: number,    // days, for set_flag
  eventTemplateId?: string, // for trigger_event
  escalationTemplateId?: string, // for escalate_event
}
```

### `DramaEffectTarget` values

```
player_morale | player_form | player_stat
team_chemistry | team_budget
set_flag | clear_flag | add_cooldown
trigger_event | escalate_event
```

### `EffectPlayerSelector` values (for effects)

`triggering` | `all` | `all_team` | `random_teammate` | `specific` | `star_player` | `random` | `any`

### `PlayerStats` keys (valid for `stat` field)

Check `src/types/player.ts` for the full list. Common ones: `mechanics`, `igl`, `mental`, `physical`, `teamwork`.

---

## Choice structure (major events)

```typescript
{
  id: 'unique_choice_id',
  text: string,           // Short label shown in UI
  description?: string,   // Tooltip/extra context
  effects: DramaEffect[],
  outcomeText: string,    // Narrative shown after choosing
  triggersEventId?: string, // Immediately chains to this drama template
}
```

---

## Tournament Context System (Phase 1)

### How it flows

`CalendarService` computes a `TournamentMatchContext` from the active tournament bracket and passes it to `InterviewService.checkPostMatchInterview()` and `checkPreMatchInterview()`. `DramaService.buildSnapshot()` populates `snapshot.tournamentContext` for drama condition evaluation.

```typescript
interface TournamentMatchContext {
  bracketPosition: 'upper' | 'lower' | null  // null = group stage / non-bracket
  eliminationRisk: boolean                    // one more loss = eliminated
  isGrandFinal: boolean
  opponent?: {
    teamId: string
    droppedFromUpper: boolean    // opponent just came from upper bracket
    recentWinStreak: number
    rivalryLevel: number         // 0-100 from RivalrySlice
  }
}
```

### Tournament conditions in drama events

Use `bracket_position` and `elimination_risk` condition types (not `flag_active`):
```typescript
// Lower bracket check
{ type: 'bracket_position', bracketPosition: 'lower' }

// Elimination risk check
{ type: 'elimination_risk' }
```

### Tournament conditions in interview templates

Use the `condition` field on the template:
```typescript
{ condition: 'lower_bracket' }          // maps to context.bracketPosition === 'lower'
{ condition: 'elimination_risk' }       // maps to context.eliminationRisk
{ condition: 'grand_final' }            // maps to context.isGrandFinal
{ condition: 'opponent_dropped_from_upper' } // maps to context.opponent.droppedFromUpper
```

To combine a tournament condition with a flag gate, use `condition` for the bracket check and `requiresActiveFlag` for the flag:
```typescript
{
  condition: 'lower_bracket',
  requiresActiveFlag: 'team_identity_resilient',
  // fires only when: in lower bracket AND team_identity_resilient flag active
}
```

---

## Arc System (Phase 2)

### Overview

Each player can have one active **primary arc** and optional **arc modifiers**. These are implemented as drama flags — no new store types. The arc system seeds interview responses and unlocks arc-specific drama events.

### Primary arc flags

One active per player at a time. Set by arc entry drama events. Duration: 45–60 days.

| Flag | Meaning | Entry condition |
|------|---------|----------------|
| `arc_redemption_{playerId}` | Doubted player seeking validation | FAME_SEEKER + loss streak 2 |
| `arc_prodigy_{playerId}` | Rising talent under rapid spotlight | `prodigy_hype_{playerId}` + win streak 2 |
| `arc_contender_{playerId}` | Established player, winning expectations | win streak 3 + upper bracket + high morale |
| `arc_fallen_{playerId}` | Former star in decline | loss streak 3 + low morale |
| `arc_veteran_legacy_{playerId}` | Experienced player chasing final chapter | contract expiring + `veteran_championship_pact` flag |
| `arc_identity_{playerId}` | Role uncertain, finding their place | loss streak 2 + low chemistry |

### Arc modifier flags

Can coexist with a primary arc. Duration: 14–21 days.

| Flag | Meaning |
|------|---------|
| `arc_mod_momentum_{playerId}` | Riding a wave of results |
| `arc_mod_fragile_{playerId}` | Confidence shaky, one bad result away from spiral |
| `arc_mod_resilient_{playerId}` | Fighting back after adversity |
| `arc_mod_underdog_{playerId}` | Playing with a chip on shoulder |
| `arc_mod_clutch_{playerId}` | Recently performed under pressure |

Note: Some arc modifier flags also appear in bare form (`arc_mod_momentum`, `arc_mod_resilient`) for team-level modifiers set by interview options.

### Arc entry events (in dramaEvents.ts)

```
arc_entry_redemption  — sets arc_redemption_{playerId}
arc_entry_prodigy     — sets arc_prodigy_{playerId}
arc_entry_contender   — sets arc_contender_{playerId}
arc_entry_fallen      — sets arc_fallen_{playerId}
arc_entry_veteran_legacy — sets arc_veteran_legacy_{playerId}
arc_entry_identity    — sets arc_identity_{playerId}
```

### Arc-gated interview templates

Use `requiresActiveFlag` to gate templates on an arc flag. These templates fire regardless of win/loss — they respond to the arc state:

```typescript
{
  id: 'post_arc_redemption_win',
  context: 'POST_MATCH',
  requiresActiveFlag: 'arc_redemption_{playerId}',
  // ...
}
```

---

## Team Identity System (Phase 4)

### Overview

Team-level identity flags (no `{playerId}` suffix) are set by detection drama events and read by interview templates and reactive drama events. They represent how the team's narrative identity has crystallized.

### Team identity flags

| Flag | Meaning | Set by | Duration |
|------|---------|--------|---------|
| `team_identity_star_carry` | One player morale/form significantly above team average | `identity_star_carry_emerges` | 30 days |
| `team_identity_balanced` | High chemistry + low morale variance — cohesive unit | `identity_balanced_recognized` | 30 days |
| `team_identity_resilient` | Won from lower bracket position | `identity_resilient_earned` | 60 days |
| `team_identity_fragile` | Was high hype, now losing — confidence shaken | `identity_fragile_exposed` | 30 days |

### Detection events (Phase 4a)

These minor events detect and set identity flags from game state:

| Event ID | Conditions | Effect |
|----------|-----------|--------|
| `identity_star_carry_emerges` | star form > 75 + chemistry < 65 | sets `team_identity_star_carry` |
| `identity_balanced_recognized` | chemistry > 70 + win streak ≥ 2 | sets `team_identity_balanced` |
| `identity_resilient_earned` | lower bracket + win streak ≥ 3 | sets `team_identity_resilient`, clears fragile |
| `identity_fragile_exposed` | any morale < 45 + loss streak ≥ 2 | sets `team_identity_fragile`, clears balanced |

### Reactive events (Phase 4b)

Major and minor events that react to identity flags being active:

```
star_carry_friction         — major: TEAM_FIRST friction + loss streak
balanced_team_tested        — major: elimination pressure tests harmony
identity_shift_star_to_balanced — major: identity evolution choice
fragile_crisis_point        — major: crisis when fragile + 3-loss streak
resilient_spirit_moment     — minor: morale boost on win streak
identity_media_fragile      — minor: sets media_narrative_fragile flag
identity_media_resilient    — minor: sets media_narrative_resilient flag
star_carry_pressure_wave    — minor: star morale cost when < 50 morale
balanced_chemistry_peak     — minor: peak cohesion reward
fragile_first_fight_back    — minor: clears fragile on first win streak
```

### Using team identity in interview templates

Team identity conditions are checked against `activeFlags` in the store:
```typescript
// Condition on template — fires when flag is active
{ condition: 'team_identity_star_carry' }

// As requiresActiveFlag — combine with another condition
{
  condition: 'lower_bracket',
  requiresActiveFlag: 'team_identity_resilient',
}
```

Note: `team_identity_balanced` has no InterviewCondition value — gate it using `requiresActiveFlag: 'team_identity_balanced'` combined with another condition (e.g. `win_streak_2plus`).

---

## Flag Naming Conventions

Flags are the connective tissue of the narrative. Name them clearly:

| Pattern | Purpose | Example |
|---------|---------|---------|
| `interview_*` | Set by interview options | `interview_blamed_teammates` |
| `manager_*` | Manager decisions | `manager_backed_igl` |
| `rivalry_*` | Rivalry state | `rivalry_scorched_earth` |
| `contract_*` | Contract situations | `contract_extended_{playerId}` |
| `org_*` | Org-level signals | `org_open_to_trade` |
| `psych_*` | Mental health interventions | `psych_support_given_{playerId}` |
| `ego_*` | Player ego events | `ego_underutilized_{playerId}` |
| `prodigy_*` | Breakout moments | `prodigy_hype_{playerId}` |
| `arc_*_{playerId}` | Player narrative arc (primary) | `arc_redemption_{playerId}` |
| `arc_mod_*_{playerId}` | Player arc modifier | `arc_mod_momentum_{playerId}` |
| `team_identity_*` | Team-level identity (no playerId) | `team_identity_resilient` |
| `media_narrative_*` | External media framing | `media_narrative_fragile` |
| `player_on_market_{playerId}` | Trade/poaching state | — |
| `transfer_window_*` | Roster evaluation | `transfer_window_scouting` |

Use `{playerId}` in flag keys when the flag is specific to one player (the drama system resolves it at runtime). Use bare string keys for team-level flags.

---

## Design Patterns

### Pattern 1: Interview → Drama Bridge

The core CYOA mechanic. An interview option plants a flag; a drama event reads it.

**Step 1** — add `setsFlags` to an interview option:
```typescript
// in interviewTemplates.ts
{
  tone: 'BLAME_TEAM',
  label: 'Some players need to step up',
  quote: '...',
  personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 1.5, TEAM_FIRST: 0, INTROVERT: 0 },
  effects: {
    morale: -3,
    setsFlags: [{ key: 'interview_blamed_teammates', durationDays: 21 }],
  },
}
```

**Step 2** — add a drama event gated on that flag:
```typescript
// in dramaEvents.ts
{
  id: 'igl_shotcalling_questioned',
  conditions: [
    { type: 'flag_active', flag: 'interview_blamed_teammates' },
    { type: 'team_loss_streak', streakLength: 2 },
  ],
  probability: 85,
  // ...
}
```

### Pattern 2: Flag-conditional interview template

Only shown when a specific flag is active (uses `requiresActiveFlag` on the template):
```typescript
{
  id: 'post_rivalry_trash_talk_loss',
  context: 'POST_MATCH',
  condition: 'rivalry_active',
  requiresActiveFlag: 'interview_trash_talked_rival',
  prompt: 'After your comments before the match, this loss must sting...',
  options: [ /* ... */ ],
}
```

### Pattern 3: Drama escalation chain

Minor event sets a flag → major event reads it → choice triggers another event:

```
burnout_overtraining (minor)
  sets flag: training_effectiveness_penalty_{playerId}
  → escalates to: burnout_grind_culture (major)
    choice "let them grind"
      sets: burnout_risk_high
      → next daily tick can trigger burnout_wellness_check
```

Implement with `escalateDays` + `escalationTemplateId` on the first event, or `triggersEventId` on a choice.

### Pattern 4: Personality-gated options

For player interviews, lock options that don't fit the personality:

```typescript
// TEAM_FIRST players never blame teammates
personalityWeights: { TEAM_FIRST: 0, INTROVERT: 0, FAME_SEEKER: 2, BIG_STAGE: 1.5, STABLE: 0.5 }

// FAME_SEEKER players prefer the spotlight
personalityWeights: { FAME_SEEKER: 2, BIG_STAGE: 2, TEAM_FIRST: 0.5, INTROVERT: 0.5, STABLE: 1 }
```

Rules:
- `0` = hidden (must have ≥2 options surviving, or filter is skipped)
- `1` = normal
- `2` = preferred (shown first if options are sorted in the future)
- Only applies when `subjectType === 'player'`

### Pattern 5: Contract/personality-gated drama

Use the condition types for archetype-specific stories:

```typescript
conditions: [
  { type: 'player_contract_expiring', contractYearsThreshold: 1 },
  { type: 'player_personality', personality: 'FAME_SEEKER' },
  { type: 'player_stat_above', stat: 'mechanics', threshold: 70, playerSelector: 'any' },
]
```

### Pattern 6: Arc seeding

Seed a player arc via a detection drama event, then gate interviews and follow-up events on the arc flag:

```
1. arc_entry_redemption (minor drama event)
   conditions: [FAME_SEEKER personality, loss streak 2]
   effect: set arc_redemption_{playerId} (45 days)

2. post_arc_redemption_pressure (interview template)
   requiresActiveFlag: 'arc_redemption_{playerId}'
   context: PRE_MATCH
   // Reporter asks about proving doubters wrong

3. arc_redemption_moment (major drama event)
   conditions: [flag_active arc_redemption_{playerId}, arc_mod_momentum_{playerId}, upper bracket]
   // Manager decision: let player claim the moment or stay humble
```

Key: the arc flag must have long enough duration (45–60 days) to allow the progression to unfold naturally.

### Pattern 7: Team identity gating

Detection events set team identity flags; reactive events and interview templates read them:

```
1. identity_star_carry_emerges (minor drama event)
   conditions: [star form > 75, chemistry < 65]
   effect: set team_identity_star_carry (30 days)

2. pre_star_carry_identity (interview template)
   condition: 'team_identity_star_carry'
   context: PRE_MATCH
   // Reporter asks about building around one player

3. star_carry_friction (major drama event)
   conditions: [flag_active team_identity_star_carry, TEAM_FIRST personality, loss streak 2]
   // Manager decides whether to redistribute or double down
```

Identity flags are team-level (no `{playerId}` suffix). One flag can be active while another is absent — they're independent signals.

### Pattern 8: Tournament context gating

Combine bracket conditions with drama flags for context-aware narratives:

```
// Drama event: only fires in lower bracket
conditions: [
  { type: 'bracket_position', bracketPosition: 'lower' },
  { type: 'team_win_streak', streakLength: 3 },
  { type: 'flag_active', flag: 'team_identity_fragile' },  // optional additional gate
]

// Interview template: fires on win in lower bracket when resilient
{
  condition: 'lower_bracket',
  requiresActiveFlag: 'team_identity_resilient',
  context: 'POST_MATCH',
  // Add ID to winIds in InterviewService.ts
}
```

---

## Existing Flag Reference

These flags are already used in the system. Don't duplicate their meaning:

| Flag | Set by | Read by |
|------|--------|---------|
| `interview_blamed_teammates` | `post_loss_blame_team` option | `igl_shotcalling_questioned` drama |
| `interview_trash_talked_rival` | `pre_rival` trash talk option | `rival_trash_talk_escalation` drama, `post_rivalry_trash_talk_loss` interview |
| `manager_backed_igl` | `post_loss_igl_blamed` interview, `igl_shotcalling_questioned` drama | future events |
| `rivalry_scorched_earth` | `post_rivalry_trash_talk_loss` interview, `rival_trash_talk_escalation` drama | future events |
| `org_open_to_trade` | `pre_contract_pressure` interview | future events |
| `contract_extended_{playerId}` | `contract_year_ultimatum` drama | future events |
| `contract_extension_promised_{playerId}` | `contract_year_ultimatum` drama | future events |
| `player_on_market_{playerId}` | `contract_year_ultimatum` drama | `pressure_rival_poaching` drama |
| `transfer_window_scouting` | `rebuild_or_reload` drama | future events |
| `management_committed_to_roster` | `rebuild_or_reload` drama | future events |
| `igl_authority_undermined` | `igl_shotcalling_questioned` drama | future events |
| `psych_support_given_{playerId}` | `silent_tilt` drama | future events |
| `reduced_training_time` | `burnout_grind_culture`, `silent_tilt` drama | future events |
| `burnout_risk_high` | `burnout_grind_culture`, `silent_tilt` drama | future events |
| `ego_underutilized_{playerId}` | `ego_underutilized` drama | `ego_role_demand` drama |
| `ego_role_demand_refused_{playerId}` | `ego_role_demand` drama | `ego_trade_request` drama |
| `prodigy_hype_{playerId}` | `breakthrough_prodigy_moment` drama | `arc_entry_prodigy` drama |
| `player_trade_requested_{playerId}` | `ego_trade_request` drama | future events |
| `leadership_established` | `synergy_leadership_vacuum` drama | future events |
| `interview_veteran_legacy_hinted` | `post_player_veteran_return` interview | `veteran_legacy_reckoning` drama |
| `veteran_championship_pact` | `veteran_legacy_reckoning` drama, `historic_win_expectations_spike` drama | `pre_championship_pact_pressure` interview |
| `veteran_considering_retirement` | `veteran_legacy_reckoning` drama | future events |
| `ego_media_distraction_{playerId}` | `post_player_veteran_return` interview, `prodigy_sponsor_offer` drama | future events |
| `prodigy_org_share_deal` | `prodigy_sponsor_offer` drama | future events |
| `interview_mid_bracket_grind` | `pre_triple_elim_fatigue` interview | `triple_elim_wall` drama |
| `igl_seeking_redemption` | `igl_community_scapegoat` drama, `post_igl_public_pressure` interview | `post_igl_redemption_chance` interview |
| `interview_historic_win` | `post_win_historic_milestone` interview, `elimination_miracle_run` drama | `historic_win_expectations_spike` drama |
| `org_milestone_celebrated` | `historic_win_expectations_spike` drama | future events |
| `org_championship_mandate` | `historic_win_expectations_spike` drama | future events |
| `elimination_run_momentum` | `elimination_survival_spark` drama | `elimination_miracle_run` drama |
| `meta_adaptation_in_progress` | `regional_playstyle_debate` drama | future events |
| `interview_lower_bracket_narrative` | bracket-aware interview options | future drama events |
| `poaching_decision_pending_{playerId}` | `veteran_legacy_reckoning` drama | future events |
| **Arc primary flags (Phase 2)** | | |
| `arc_redemption_{playerId}` | `arc_entry_redemption` drama | arc interview templates, arc progression dramas |
| `arc_prodigy_{playerId}` | `arc_entry_prodigy` drama | arc interview templates, arc progression dramas |
| `arc_contender_{playerId}` | `arc_entry_contender` drama | arc interview templates, arc progression dramas |
| `arc_fallen_{playerId}` | `arc_entry_fallen` drama | arc interview templates |
| `arc_veteran_legacy_{playerId}` | `arc_entry_veteran_legacy` drama | arc interview templates |
| `arc_identity_{playerId}` | `arc_entry_identity` drama | arc interview templates |
| **Arc modifier flags (Phase 2)** | | |
| `arc_mod_momentum_{playerId}` | arc progression dramas, some interview options | arc resolution events |
| `arc_mod_fragile_{playerId}` | arc progression dramas | arc resilience events |
| `arc_mod_resilient_{playerId}` | arc progression dramas, `resilient_spirit_moment` | future arc events |
| `arc_mod_underdog_{playerId}` | `arc_entry_fallen` drama, some interview options | future arc events |
| `arc_mod_clutch_{playerId}` | arc progression dramas | future arc events |
| `arc_mod_momentum` | bracket-aware interview options (team-level) | future events |
| `arc_mod_resilient` | bracket-aware interview options (team-level) | future events |
| **Team identity flags (Phase 4)** | | |
| `org_high_expectations` | `kickoff_season_opener` CONFIDENT option | `pressure_championship_mandate` drama, `pre_high_expectations_pressure` interview, `crisis_championship_mandate_streak` interview |
| `manager_development_focused` | `kickoff_season_opener` RESPECTFUL option | `development_breakthrough_moment` drama, `post_win_development_focus` interview |
| `manager_underdog_mindset` | `kickoff_season_opener` HUMBLE option | `underdog_media_doubt` drama, `pre_underdog_narrative` interview |
| `org_pressure_doubled` | `pressure_championship_mandate` "Stand by" choice | future external pressure events |
| `development_visible_progress` | `development_breakthrough_moment` minor event | future player growth events |
| `underdog_chip_active` | `underdog_media_doubt` "Use as fuel" choice | future resilience/comeback events |
| `team_identity_star_carry` | `kickoff_season_opener` CONFIDENT option, `identity_star_carry_emerges` drama | `star_carry_friction`, `identity_shift_star_to_balanced`, interview templates |
| `team_identity_balanced` | `kickoff_season_opener` RESPECTFUL option, `identity_balanced_recognized` drama | `balanced_team_tested`, `balanced_chemistry_peak`, interview templates |
| `team_identity_resilient` | `kickoff_season_opener` HUMBLE option, `identity_resilient_earned` drama | `resilient_spirit_moment`, `identity_media_resilient`, interview templates |
| `team_identity_fragile` | `identity_fragile_exposed` drama | `fragile_crisis_point`, `identity_media_fragile`, interview templates |
| `star_carry_tension_unresolved` | `star_carry_friction` drama | future events |
| `team_crisis_reset` | `fragile_crisis_point` drama | future events |
| `player_led_recovery` | `fragile_crisis_point` drama | future events |
| `team_peak_cohesion` | `balanced_chemistry_peak` drama | future events |
| `media_narrative_fragile` | `identity_media_fragile` drama | future events |
| `media_narrative_resilient` | `identity_media_resilient` drama | future events |

---

## Probabilities and Balance

From `DRAMA_CONSTANTS` in `src/types/drama.ts`:

- **Max 3 events per day total**
- **Max 5 minor events per week**
- **Min 2 days between major events**
- Category cooldown boost: if a category hasn't fired in 5+ days, probability × 2.0

**Probability guidelines:**
- Minor random events: `5–20`
- Minor conditional events: `25–40`
- Major events with strong conditions: `55–85`
- Major events gated on a specific flag: `80–90` (they should almost always fire — they were earned)

**Cooldown guidelines (from actual defaults):**
- `player_ego`: 7 days
- `team_synergy`: 7 days
- `external_pressure`: 10 days
- `practice_burnout`: 5 days
- `breakthrough`: 7 days
- `meta_rumors`: 7 days

---

## What NOT to do

- **Don't make choices that feel identical** — each of 3 choices should have a meaningfully different risk/reward tradeoff.
- **Don't resolve stories in one event** — prefer a minor event setting a flag → major event 3–7 days later.
- **Don't set flags without planning a reader** — if you add `setsFlags`, sketch the drama event that will consume it.
- **Don't use morale deltas above ±20 on a single effect** — the scale is 0–100, small changes matter more narratively.
- **Don't add `requiresActiveFlag` to an interview template without also ensuring the flag can actually be set** — trace the whole path.
- **Don't use `player_stat` as a condition stat name** — use the actual stat key (`mechanics`, `igl`, `mental`, etc.).
- **Don't forget to add POST_MATCH template IDs to `winIds`/`lossIds` in `InterviewService.ts`** — they will silently never fire otherwise.
- **Scrim leak scandal and veteran/rookie rivalry are intentionally out of scope** — they require data structures not yet in `DramaGameStateSnapshot`.

---

## Quick Recipe: New Storyline Arc

1. **Pick an emotional premise** (e.g. "star player starts tweeting cryptically about needing a new challenge")
2. **Design the interview seed**: which interview context, which subject type, what personality weights, what flag does the aggressive option set?
3. **Design the follow-up drama event**: what conditions besides the flag make it feel earned? (loss streak? low chemistry? specific phase?)
4. **Design 3 choices** for the drama event — aggressive/risky, cautious/diplomatic, avoidant — each with different flag consequences
5. **Optionally**: add a flag-conditional interview template that appears *after* the drama choice, letting the manager face press questions about their decision
6. **Add to the arrays**: `INTERVIEW_TEMPLATES` and `DRAMA_EVENT_TEMPLATES`

Example arc skeleton:
```
"star cryptic tweets"
  interview: post_player_win with FAME_SEEKER weight
    option "I'm always open to new opportunities"
      setsFlags: [{ key: 'player_hinted_departure', durationDays: 14 }]

  drama: player_departure_rumors
    conditions: [flag_active: player_hinted_departure, player_contract_expiring]
    choices:
      A) Public extension announcement → clears flag, morale +15, budget -5000
      B) "Focus on the game" deflection → flag persists, triggers pressure_rival_poaching
      C) Grant meeting with other org → sets player_exploring_market, morale team -5

  interview (flag-conditional): pre_match_departure_questions
    requiresActiveFlag: player_hinted_departure
    prompt: "Fans are asking if [player] will be here next season..."
    options: confident they stay | acknowledge uncertainty | deflect
```
