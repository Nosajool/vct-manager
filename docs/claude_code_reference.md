# VCT Manager - Claude Code Quick Reference

## Starting Each Session

**Always begin with:**
```
Hi Claude Code! We're building VCT Manager - a Valorant esports management game.

Please read these files first:
1. docs/ARCHITECTURE.md - Full technical specification
2. docs/DEVELOPMENT_PHASES.md - Current phase checklist

Current phase: [Phase X: Feature Name]

Today we're working on: [specific feature]
```

---

## Architecture Rules (Remind Claude if Violated)

### Engine Layer (`src/engine/`)
✅ Pure TypeScript classes
✅ No React imports
✅ No store access
✅ Pure functions only
✅ Return new objects
❌ No side effects
❌ No DOM manipulation

**Template:**
```typescript
export class EngineClass {
  public compute(input: Input): Output {
    // Pure computation
    return result;
  }
}
```

### Service Layer (`src/services/`)
✅ Can access store
✅ Orchestrates engine + state
✅ Handles side effects
✅ Called by UI
❌ No business logic (that's in engine)

**Template:**
```typescript
export class ServiceClass {
  doAction(params: Params): void {
    // 1. Get data from store
    const data = useGameStore.getState().getData();
    
    // 2. Call engine
    const result = engine.compute(data);
    
    // 3. Update store
    useGameStore.getState().updateData(result);
    
    // 4. Side effects
    useGameStore.getState().triggerSideEffect();
  }
}
```

### Store Layer (`src/store/slices/`)
✅ Zustand slices
✅ Immutable updates
✅ Normalized data (IDs, not objects)
✅ Actions + selectors

**Template:**
```typescript
export interface DomainSlice {
  entities: Record<string, Entity>;
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  getEntity: (id: string) => Entity | undefined;
}

export const createDomainSlice: StateCreator<DomainSlice> = (set, get) => ({
  entities: {},
  
  addEntity: (entity) => set((state) => ({
    entities: { ...state.entities, [entity.id]: entity }
  })),
  
  updateEntity: (id, updates) => set((state) => ({
    entities: {
      ...state.entities,
      [id]: { ...state.entities[id], ...updates }
    }
  })),
  
  getEntity: (id) => get().entities[id],
});
```

### UI Layer (`src/components/`)
✅ Presentation only
✅ Read from store
✅ Call services
❌ No business logic
❌ No direct store mutations

**Template:**
```typescript
export function Component() {
  const data = useGameStore(state => state.getData());
  
  const handleAction = () => {
    service.doAction(params);
  };
  
  return (
    <div>
      {/* Render data */}
      <button onClick={handleAction}>Action</button>
    </div>
  );
}
```

---

## Common Prompts for Claude Code

### Creating a New Feature

```
We need to create [Feature Name]. Following our architecture:

1. Create types in src/types/[domain].ts
2. Create engine class in src/engine/[domain]/[ClassName].ts
3. Create store slice in src/store/slices/[domain]Slice.ts
4. Create service in src/services/[Domain]Service.ts
5. Create UI components in src/components/[domain]/

Start with the types and engine class. Follow the templates from 
existing code (reference: src/engine/player/PlayerGenerator.ts).
```

### Debugging Issues

```
I'm seeing this error: [paste error]

Steps I took:
1. [what you did]
2. [what happened]

Console output: [paste logs]

Can you investigate and fix?
```

### Code Review

```
Let's review the code against our architecture:

1. Does the engine class have any React dependencies? (should be NO)
2. Does the engine class access the store? (should be NO)
3. Are all state updates immutable? (should be YES)
4. Is data normalized (IDs not objects)? (should be YES)
5. Does the UI component contain business logic? (should be NO)

Check each of these and refactor if needed.
```

### Adding Tests

```
Create unit tests for [ClassName]:

Test cases:
1. [test case 1]
2. [test case 2]
3. Edge case: [edge case]

Run npm test and make sure all pass.
```

---

## Key Patterns to Maintain

### 1. Normalized Data (No Circular References)

❌ **Bad:**
```typescript
interface Team {
  players: Player[];  // Nested objects
}
interface Player {
  team: Team;  // Circular!
}
```

✅ **Good:**
```typescript
interface Team {
  playerIds: string[];  // IDs only
}
interface Player {
  teamId: string;  // ID only
}

// Get full data via selector
function getTeamWithPlayers(teamId: string) {
  const team = store.getState().entities.teams[teamId];
  const players = team.playerIds.map(id => 
    store.getState().entities.players[id]
  );
  return { ...team, players };
}
```

### 2. Immutable Updates

❌ **Bad:**
```typescript
state.team.players.push(newPlayer);  // Mutation!
state.team.budget = 1000;  // Mutation!
```

✅ **Good:**
```typescript
set(state => ({
  team: {
    ...state.team,
    playerIds: [...state.team.playerIds, newPlayer.id],
    budget: 1000
  }
}));
```

### 3. Error Handling

✅ **Always handle errors gracefully:**
```typescript
try {
  const result = riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  useGameStore.getState().setError(error.message);
  return { success: false, error: error.message };
}
```

### 4. Loading States

✅ **Show progress for bulk operations:**
```typescript
// Single operation - instant
matchService.simulateMatch(matchId);

// Bulk operation - show progress
useGameStore.setState({ isSimulating: true });
for (let i = 0; i < matches.length; i++) {
  useGameStore.setState({
    bulkSimulation: {
      current: i + 1,
      total: matches.length,
      status: `Simulating match ${i+1}...`
    }
  });
  matchService.simulateMatch(matches[i].id);
}
useGameStore.setState({ isSimulating: false });
```

---

## Git Workflow

### Feature Development
```bash
git checkout develop
git checkout -b feature/[feature-name]
# Work with Claude Code
git add [files]
git commit -m "feat: [description]"
git checkout develop
git merge feature/[feature-name]
```

### Commit Messages
```
feat: Add new feature
fix: Fix bug
refactor: Restructure code
docs: Update documentation
test: Add tests
chore: Maintenance
```

### Deployment
```bash
git checkout main
git merge develop
git push origin main
# GitHub Actions auto-deploys
```

---

## Testing Checklist

After Claude Code builds a feature:

### Unit Tests (Claude can run)
- [ ] Tests created for engine classes
- [ ] All tests pass (`npm test`)
- [ ] Edge cases covered

### Manual Testing (You do)
- [ ] Start dev server (`npm run dev`)
- [ ] Click through the feature
- [ ] Check console for errors
- [ ] Verify state updates correctly
- [ ] Test on mobile viewport

### Integration (Both)
- [ ] Feature works with existing features
- [ ] No console warnings
- [ ] Performance is acceptable
- [ ] Save/load works

---

## Common Issues & Solutions

### Issue: Store not updating UI
**Solution:** Make sure component is subscribed to correct slice
```typescript
// ❌ Wrong - creates new selector each render
const data = useGameStore(state => state.entities.players);

// ✅ Right - stable selector
const selectPlayers = (state) => state.entities.players;
const players = useGameStore(selectPlayers);
```

### Issue: Circular reference in save
**Solution:** Verify all relationships use IDs, not nested objects

### Issue: State changes don't persist
**Solution:** Check auto-save middleware is configured correctly

### Issue: Performance lag
**Solution:** 
1. Use React.memo for expensive components
2. Use stable selectors
3. Batch state updates

---

## Phase Checklist Quick Reference

### Phase 0: Foundation
- [ ] Project setup
- [ ] Git + GitHub Actions
- [ ] Core types defined
- [ ] Store structure
- [ ] Save/load working

### Phase 1: Roster Management
- [ ] Player generation
- [ ] Player slice
- [ ] Team slice
- [ ] Roster UI
- [ ] Contract system

### Phase 2: Match Simulation
- [ ] MatchSimulator (Phase 1)
- [ ] Match slice
- [ ] Match result UI
- [ ] Player stats display

### Phase 3: Calendar
- [ ] Calendar slice
- [ ] Time progression
- [ ] Event scheduling
- [ ] Training system

### Phase 4: Competition
- [ ] Bracket generation
- [ ] Tournament engine
- [ ] Tournament UI
- [ ] Standings

### Phase 5: Economy
- [ ] Finance tracking
- [ ] Salary system
- [ ] Prize money
- [ ] Sponsorships

### Phase 6: Polish
- [ ] Chemistry system
- [ ] Advanced training
- [ ] AI improvements
- [ ] UX polish

---

## Session End Checklist

Before ending each Claude Code session:

```
Please create a session summary:

1. What we built today
2. Files created/modified
3. What's working
4. Known issues
5. Next steps

Save to: docs/session-logs/[DATE].md
```

Then commit your work:
```bash
git add .
git commit -m "feat: [what was built]"
git push origin [branch-name]
```

---

## Emergency Recovery

If something breaks badly:

1. **Check git status:** `git status`
2. **See what changed:** `git diff`
3. **Revert if needed:** `git checkout -- [file]`
4. **Load last save:** Use in-game load feature
5. **Ask Claude Code:** Paste error + what you did

Remember: Auto-save happens weekly, so you won't lose much progress!
