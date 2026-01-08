# VCT Manager - Getting Started Guide

## Quick Start with Claude Code

### Step 1: Initialize Project (5 minutes)

```bash
# Create project directory
mkdir vct-manager
cd vct-manager

# Start Claude Code
claude-code
```

**First Prompt to Claude Code:**
```
Hi! We're building VCT Manager - a Valorant esports management game.

I have a complete technical specification. Let me share the key points:

1. Tech stack: Vite + React 18 + TypeScript + Zustand + Dexie + Tailwind
2. Architecture: Engine (logic) → Services (orchestration) → Store (state) → UI (presentation)
3. No backend - everything runs in browser with IndexedDB storage

Let's start by:
1. Creating a new Vite + React + TypeScript project
2. Installing dependencies
3. Setting up the basic directory structure

Please run: npm create vite@latest . -- --template react-ts
```

### Step 2: Install Dependencies

**Prompt:**
```
Great! Now install these dependencies:

Production:
- zustand (state management)
- dexie (IndexedDB wrapper)
- date-fns (date utilities)

Dev dependencies:
- @types/node
- prettier
- eslint

Run: npm install zustand dexie date-fns
Run: npm install -D @types/node prettier eslint

Then set up Tailwind CSS following the official Vite guide.
```

### Step 3: Create Directory Structure

**Prompt:**
```
Create this directory structure:

src/
├── engine/         # Pure game logic
│   ├── player/
│   ├── team/
│   ├── match/
│   ├── competition/
│   └── calendar/
├── store/          # Zustand state
│   ├── slices/
│   └── index.ts
├── services/       # Orchestration
├── db/             # IndexedDB
├── types/          # TypeScript types
├── components/     # React components
│   ├── layout/
│   ├── roster/
│   ├── match/
│   └── shared/
├── pages/          # Top-level routes
└── utils/

Also create:
docs/
├── ARCHITECTURE.md
├── CODING_STANDARDS.md
└── session-logs/
```

### Step 4: Set Up Git

**Prompt:**
```
Initialize Git and create initial commit:

1. Create .gitignore with: node_modules, dist, .env, .DS_Store
2. Run: git init
3. Run: git add .
4. Run: git commit -m "Initial commit: Project setup"

Then show me the git status.
```

### Step 5: Create Core Types

**Prompt:**
```
Let's create the core type definitions. Create src/types/player.ts with:

export interface PlayerStats {
  mechanics: number;      // 0-100: Aim and gunplay
  igl: number;           // 0-100: In-game leadership
  mental: number;        // 0-100: Composure under pressure
  clutch: number;        // 0-100: Performance in 1vX
  vibes: number;         // 0-100: Team morale contribution
  lurking: number;       // 0-100: Solo play ability
  entry: number;         // 0-100: First contact aggression
  support: number;       // 0-100: Utility usage
  stamina: number;       // 0-100: Consistency
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  region: 'Americas' | 'EMEA' | 'Pacific' | 'China';
  teamId: string | null;
  stats: PlayerStats;
  form: number;
  morale: number;
  potential: number;
  contract: {
    salary: number;
    yearsRemaining: number;
    endDate: Date;
  } | null;
  careerStats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
  };
}

Follow this same pattern for Team, Match, Tournament types.
Reference the full spec for complete type definitions.
```

---

## Development Workflow

### Daily Session Pattern

1. **Start Session** (2 min)
```
Hi Claude Code! Continuing VCT Manager development.

Current phase: Phase 1 - Roster Management
Last session: [check docs/session-logs/latest.md]

Today's goal: [specific feature]

Please read docs/ARCHITECTURE.md for context.
```

2. **Build Feature** (30-60 min)
```
Let's implement [Feature]:

1. Create types in src/types/
2. Create engine class in src/engine/
3. Create store slice in src/store/slices/
4. Create service in src/services/
5. Create UI in src/components/

Start with types and engine. Follow the architecture patterns
from existing code.
```

3. **Test** (10-15 min)
```
Add unit tests for the engine class:
- Test case 1: [description]
- Test case 2: [description]
- Edge case: [description]

Run npm test and fix any failures.
```

4. **Manual Testing** (5-10 min)
YOU do this:
- Run `npm run dev`
- Click through the feature
- Check console for errors
- Test edge cases

5. **Iterate** (as needed)
```
I tested and found these issues:
1. [issue description]
2. [console error]

Can you fix these?
```

6. **Commit** (2 min)
```bash
git add src/components/roster/ src/services/PlayerService.ts
git commit -m "feat: Add roster management UI and player service"
```

7. **End Session** (2 min)
```
Please create a session summary in docs/session-logs/2026-01-08.md:

1. What we built
2. Files modified
3. What's working
4. Known issues
5. Next steps
```

---

## Phase-by-Phase Approach

### Phase 0: Foundation (Week 1)

**Goal:** Get basic infrastructure working

**Checklist:**
- [ ] Project setup complete
- [ ] Dependencies installed
- [ ] Directory structure created
- [ ] Git initialized
- [ ] Core types defined (Player, Team, Match)
- [ ] Basic Zustand store with one slice
- [ ] Dexie database schema
- [ ] Save/load functionality working
- [ ] Simple UI shell (header, nav, content area)

**End State:** Can save and load a game state with mock data

### Phase 1: Roster Management (Week 2)

**Goal:** Manage players and team roster

**Features:**
- [ ] Player generator (procedural for now)
- [ ] Player database (400+ players across regions)
- [ ] Roster view (active 5 + reserves)
- [ ] Free agent list
- [ ] Sign player flow
- [ ] Release player flow
- [ ] Basic contract system
- [ ] Player stats display

**End State:** Can view roster, sign/release players, see stats

### Phase 2: Match Simulation (Week 3)

**Goal:** Simulate matches with realistic results

**Features:**
- [ ] MatchSimulator engine (probabilistic)
- [ ] Team strength calculation
- [ ] Map simulation (best of 3)
- [ ] Player performance stats (K/D/A, ACS)
- [ ] Match result display
- [ ] Match history view
- [ ] Player form updates after matches

**End State:** Can simulate matches and see results

### Phase 3: Calendar System (Week 4)

**Goal:** Time progression and scheduling

**Features:**
- [ ] Calendar state (current date, season)
- [ ] Event scheduler
- [ ] Advance day/week UI
- [ ] Jump to next match
- [ ] Training system (basic)
- [ ] Weekly salary payments
- [ ] Off-day activities

**End State:** Can progress through time and train players

### Phase 4: Competition Structure (Week 5-6)

**Goal:** Full tournament system

**Features:**
- [ ] Tournament bracket generation
- [ ] Single elimination brackets
- [ ] Double elimination brackets
- [ ] Triple elimination brackets
- [ ] Bracket advancement after matches
- [ ] Tournament standings
- [ ] Prize money distribution
- [ ] Season schedule generation

**End State:** Can play through full VCT season

### Phase 5: Economy (Week 7)

**Goal:** Financial management

**Features:**
- [ ] Finance tracking
- [ ] Monthly revenue (sponsorships, merch)
- [ ] Monthly expenses (salaries, facilities)
- [ ] Prize money
- [ ] Loan system (if bankrupt)
- [ ] Sponsorship deals
- [ ] Budget forecasting

**End State:** Must manage finances to stay solvent

### Phase 6: Polish (Week 8+)

**Goal:** Enhance experience

**Features:**
- [ ] Team chemistry system
- [ ] Advanced training (coaches, focus areas)
- [ ] AI team improvements
- [ ] Better UI/UX
- [ ] Mobile responsiveness
- [ ] Performance optimizations
- [ ] Bug fixes

**End State:** Polished, enjoyable game ready to share

---

## Common Scenarios & Solutions

### Scenario 1: Claude Code Creates Wrong Pattern

**Problem:** Engine class is accessing the store

**Solution:**
```
This violates our architecture. Engine classes should never access the store.

Please refactor:
1. Remove the store import
2. Pass data as parameters instead
3. Return the result
4. Let the service handle store updates

Example:
// ❌ Bad
class Engine {
  compute() {
    const data = useGameStore.getState().data;
  }
}

// ✅ Good
class Engine {
  compute(data: Data) {
    // Pure computation
    return result;
  }
}
```

### Scenario 2: State Not Updating

**Problem:** UI doesn't reflect changes after action

**Solution:**
```
The state update isn't working. Let's debug:

1. Add console.log in the service to confirm it's called
2. Check if the store slice has the update method
3. Verify the selector in the component is correct
4. Make sure the update is immutable (creating new object)

Show me the service code, store slice, and component.
```

### Scenario 3: Performance Issues

**Problem:** Simulation is slow

**Solution:**
```
The match simulation is taking too long. Let's optimize:

1. Add performance.mark() to measure time
2. Check if we're doing unnecessary calculations
3. Consider memoizing expensive operations
4. Batch state updates if doing multiple

Show me the simulator code and we'll profile it.
```

### Scenario 4: Save/Load Broken

**Problem:** Game won't load saved state

**Solution:**
```
The save/load is failing. Common issues:

1. Circular references (check data is normalized)
2. Date objects not serializing (convert to ISO strings)
3. Functions in state (store only data)
4. IndexedDB quota exceeded (compress old data)

Show me the error and the save/load code.
```

---

## Quick Reference Commands

### Development
```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Lint code
```

### Git
```bash
git status           # Check status
git add .            # Stage all changes
git commit -m "..."  # Commit with message
git log --oneline    # View history
git diff             # See changes
```

### Claude Code
```
"Read docs/ARCHITECTURE.md"          # Load context
"Show me src/engine/match/..."       # View file
"Run npm test"                       # Execute command
"What files changed since last commit?" # Git status
"Create src/types/player.ts"         # Create file
```

---

## When Things Go Wrong

### Emergency Checklist

1. **Check Console:** Are there any errors?
2. **Check Git:** `git status` - what changed?
3. **Check Tests:** `npm test` - are tests passing?
4. **Reload Page:** Clear browser cache
5. **Check Store:** Use Redux DevTools to inspect state
6. **Read Error:** Don't panic - errors tell you what's wrong
7. **Ask Claude Code:** Paste the full error message

### Recovery Options

**If code is broken:**
```bash
git diff                    # See what changed
git checkout -- file.ts     # Revert one file
git reset --hard HEAD       # Revert everything (careful!)
```

**If game state is corrupted:**
- Load a save slot
- Clear IndexedDB (Application tab in DevTools)
- Start new game

**If totally stuck:**
- Take a break
- Read the architecture doc
- Ask Claude Code to review the code
- Commit what works, start fresh on the broken part

---

## Success Metrics

You'll know you're on track when:

✅ Each phase is complete before moving to next
✅ Tests are passing
✅ No console errors
✅ Features work as expected
✅ Code follows architecture patterns
✅ Git history is clean
✅ You're having fun building it!

---

## Ready to Build?

Start with Phase 0 and work through systematically. Don't skip phases - each builds on the previous one.

The architecture is solid. The plan is clear. You've got Claude Code to help with implementation. 

Now go build something awesome! 🚀

**First command:**
```bash
mkdir vct-manager && cd vct-manager && claude-code
```

**First prompt:**
See "Step 1: Initialize Project" above.

Good luck! 🎮
