# MatchResult Conversion Utility Usage

This document provides examples of how to use the `matchResultUtils` functions to integrate the MatchResult modal with components that display match history.

## Overview

The utility provides three main functions:

1. `getMatchForResult` - Convert a MatchResult to its corresponding Match object
2. `canDisplayMatchResult` - Check if a result can be displayed in the modal
3. `getMatchDisplayData` - Get all display data needed for a match result

## Basic Usage in MatchHistorySection

Here's how to integrate the MatchResult modal with click-to-view functionality:

```tsx
import { useState } from 'react';
import { useGameStore } from '../../store';
import { getMatchForResult } from '../../utils/matchResultUtils';
import { MatchResult as MatchResultModal } from '../match/MatchResult';
import type { Match, MatchResult } from '../../types';

function MatchHistorySection({ matchHistory, teamId, teams }) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const store = useGameStore.getState();

  const handleMatchClick = (result: MatchResult) => {
    const match = getMatchForResult(result, store);
    if (match) {
      setSelectedMatch(match);
    }
  };

  const handleCloseModal = () => {
    setSelectedMatch(null);
  };

  return (
    <>
      <div className="match-history">
        {matchHistory.map((result) => (
          <div
            key={result.matchId}
            onClick={() => handleMatchClick(result)}
            className="cursor-pointer hover:bg-vct-darker/50"
          >
            {/* Match display content */}
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedMatch && (
        <MatchResultModal
          match={selectedMatch}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
```

## Advanced Usage with Display Data

For more complex scenarios where you need team names and other display data:

```tsx
import { getMatchDisplayData } from '../../utils/matchResultUtils';

function MatchHistoryItem({ result }) {
  const store = useGameStore.getState();
  const displayData = getMatchDisplayData(result, store);

  if (!displayData) {
    return <div>Match data unavailable</div>;
  }

  const { match, teamAName, teamBName, isWin } = displayData;

  return (
    <div onClick={() => openModal(match)}>
      <span>{teamAName}</span>
      <span>vs</span>
      <span>{teamBName}</span>
      <span className={isWin(match.teamAId) ? 'win' : 'loss'}>
        {result.scoreTeamA} - {result.scoreTeamB}
      </span>
    </div>
  );
}
```

## Validation Before Display

To check if a result can be displayed before attempting to show it:

```tsx
import { canDisplayMatchResult } from '../../utils/matchResultUtils';

function MatchHistorySection({ matchHistory }) {
  const store = useGameStore.getState();

  // Filter out results that can't be displayed
  const displayableHistory = matchHistory.filter((result) =>
    canDisplayMatchResult(result, store)
  );

  return (
    <div>
      {displayableHistory.map((result) => (
        <MatchHistoryItem key={result.matchId} result={result} />
      ))}
    </div>
  );
}
```

## Error Handling

The utilities handle errors gracefully:

- `getMatchForResult` returns `null` if the match is not found
- `canDisplayMatchResult` returns `false` if match or teams are missing
- `getMatchDisplayData` returns `null` if any required data is missing

Always check for null returns before using the data:

```tsx
const match = getMatchForResult(result, store);
if (!match) {
  console.error('Failed to load match data');
  return;
}

// Safe to use match here
setSelectedMatch(match);
```

## Integration Checklist

When integrating the modal:

1. ✅ Import the utility function
2. ✅ Add state to track selected match
3. ✅ Add click handler to match history items
4. ✅ Call `getMatchForResult` with the clicked result
5. ✅ Check for null return value
6. ✅ Set state to show the modal
7. ✅ Render the MatchResult modal conditionally
8. ✅ Implement onClose handler to clear state

## TypeScript Types

The utilities are fully typed:

```typescript
function getMatchForResult(
  result: MatchResult,
  store: GameStore
): Match | null;

function canDisplayMatchResult(
  result: MatchResult,
  store: GameStore
): boolean;

function getMatchDisplayData(
  result: MatchResult,
  store: GameStore
): {
  match: Match;
  teamAName: string;
  teamBName: string;
  isWin: (teamId: string) => boolean;
} | null;
```
