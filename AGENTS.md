# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Development Commands

### Build & Quality Gates
```bash
npm run build         # Build project (runs TypeScript check + Vite build)
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

### Development
```bash
npm run dev           # Start development server
npm run fetch-vlr     # Fetch VLR data (script)
```

## Architecture & Code Style

### Project Structure
```
src/
├── engine/           # Pure business logic (no dependencies)
├── services/         # Orchestration layer
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
├── components/      # React components (by feature)
├── pages/           # Top-level page components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── db/             # IndexedDB schema and operations
```

### Code Style Guidelines

#### TypeScript & Types
- **Strict TypeScript enabled** - All code must pass strict type checking
- Use interfaces for object shapes, types for unions/primitives
- Prefer explicit return types for public functions
- Use `type` for utility types, `interface` for object contracts
- All types exported from `src/types/index.ts`

#### Import Organization
```typescript
// 1. React and related libraries
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

// 2. Internal types (alphabetical)
import type { Player, Team } from '../../types';

// 3. Internal modules (alphabetical, relative)
import { useGameStore } from '../../store';
import { PlayerService } from '../../services';
```

#### Naming Conventions
- **Files**: PascalCase for components (PlayerCard.tsx), camelCase for utilities (playerUtils.ts)
- **Components**: PascalCase (PlayerCard, TeamList)
- **Functions/Variables**: camelCase (calculateStats, currentPlayer)
- **Types/Interfaces**: PascalCase (PlayerStats, MatchResult)
- **Constants**: UPPER_SNAKE_CASE (MAX_PLAYERS, DEFAULT_REGION)
- **Enums**: PascalCase (Region, MatchStatus)

#### React Components
```typescript
// Component file structure
import React, { useState, useEffect } from 'react';
import type { Player } from '../../types';
import { usePlayerTeam } from '../../store';

interface PlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
}

export function PlayerCard({ player, onSelect }: PlayerCardProps) {
  // Component logic
  return <div>...</div>;
}
```

#### State Management (Zustand)
```typescript
// Slice pattern
interface PlayerSlice {
  players: Record<string, Player>;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  players: {},
  addPlayer: (player) => set((state) => ({
    players: { ...state.players, [player.id]: player }
  })),
  // ...
});
```

#### Service Layer Pattern
```typescript
// Pure functions, no side effects in engines
export class MatchSimulator {
  static simulateMatch(team1: Team, team2: Team): MatchResult {
    // Pure simulation logic
  }
}

// Services orchestrate engines and handle state
export class MatchService {
  static simulateAndStore(team1Id: string, team2Id: string) {
    const result = MatchSimulator.simulateMatch(team1, team2);
    useGameStore.getState().addMatchResult(result);
  }
}
```

#### Error Handling
- Use descriptive error messages with context
- Service methods return `{ success: boolean; error?: string; data?: T }`
- Components display user-friendly error messages
- Throw errors only for truly exceptional circumstances

#### Styling (Tailwind CSS)
- Use VCT color palette: `vct-red`, `vct-dark`, `vct-darker`, `vct-gray`, `vct-light`
- Prefer utility classes over custom CSS
- Use responsive prefixes: `sm:`, `md:`, `lg:`
- Component-specific styling should be minimal

#### File Organization
- Export components from index files: `export { PlayerCard } from './PlayerCard'`
- Keep related files in feature directories
- Engine files contain pure logic, no imports from React/store
- Services handle orchestration between engines and store

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed):
   ```bash
   npm run lint
   npm run build
   ```
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Key Project Patterns

### Engine → Service → Store → UI Flow
1. **Engine**: Pure business logic, no external dependencies
2. **Service**: Orchestrates engines, handles state updates
3. **Store**: Centralized state management with Zustand
4. **UI**: React components that read from store, dispatch to services

### Persistence Strategy
- IndexedDB via Dexie for local storage
- Auto-save every 5 minutes to slot 0
- Manual saves to slots 1-3
- Store middleware handles serialization

### Development Phases
The project follows phase-based development:
- Phase 0: Foundation (store, types, basic UI)
- Phase 1: Roster management
- Phase 2: Match simulation
- Phase 3: Calendar system
- Phase 4: Competition structure
- Phase 5: Economy system
- Phase 6: Scrim system
- Phase 7: Schedule system

