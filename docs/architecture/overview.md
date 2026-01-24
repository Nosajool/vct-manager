# VCT Manager Game - Overview

## Overview

This document provides a comprehensive technical specification for the VCT Manager game. Due to its length, the content has been organized into focused architecture documents:

### 📋 **Core Architecture**
**[View: `docs/architecture/core-architecture.md`](docs/architecture/core-architecture.md)**
- Project overview and technology stack
- Architectural principles and directory structure
- Complete TypeScript type definitions for all game entities

### 🔧 **Implementation Details**
**[View: `docs/architecture/implementation-details.md`](docs/architecture/implementation-details.md)**
- State management patterns and Zustand store structure
- Engine classes and service layer patterns
- Persistence strategy and error handling
- Development phases, key decisions, and lessons learned

---

## Quick Reference

### Technology Stack
- **Frontend**: React 18+ with TypeScript
- **Build**: Vite
- **State**: Zustand with IndexedDB persistence
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library

### Core Architecture Pattern
```
Engine (Pure Logic) → Services (Orchestration) → Store (State) → UI (Presentation)
```

### Key Game Systems
- **Match Simulation**: Probabilistic team strength calculations
- **Tournament Management**: Swiss-to-playoff brackets, triple elimination
- **Player Development**: Training with stat improvements and fatigue
- **Economy**: Sponsorships, contracts, loans, salary payments
- **Scrim System**: Map practice, relationships, competitive depth
- **VLR Integration**: Real player stats and team rosters
