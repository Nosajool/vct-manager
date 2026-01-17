# BUG-006: Footer should indicate fan-made status and non-affiliation with Riot Games

**Priority:** High
**Status:** Open
**Component:** Layout/Footer

---

## Description

The footer currently only displays "VCT Manager" without any indication that this is a fan-made game not affiliated with Riot Games. Given that the game uses Valorant-related terminology, organization names, player names, map names, and plans to include agent names and gun names in the future, the footer should clearly state that this is a fan-made, non-profit project with no official affiliation.

### Current Behavior

Footer displays: "VCT Manager"

### Expected Behavior

Footer should display clear disclaimers indicating:
- This is a fan-made game
- Not affiliated with Riot Games
- Not for profit
- No official endorsement

---

## Impact

- **Legal risk:** Without clear disclaimers, users might assume official affiliation with Riot Games
- **Trademark concerns:** Use of "VCT", player names, team names, and future agent/gun names without disclaimers could lead to confusion
- **Community expectations:** Players should understand this is an unofficial fan project

---

## Steps to Reproduce

1. Start the application
2. Scroll to the bottom of any page
3. Observe the footer text shows only "VCT Manager" without disclaimers

---

## Root Cause Analysis

The footer in `src/components/layout/Layout.tsx` contains only basic branding text without legal disclaimers. As the game incorporates more Valorant intellectual property (player names, agent names, gun names, map names), clear disclaimers become increasingly important.

---

## Proposed Fix

### Option 1: Comprehensive Footer Disclaimer
Update footer text to: "VCT Manager - Fan-made game, not affiliated with Riot Games. Not for profit."

### Option 2: Multi-line Disclaimer
```
VCT Manager
Fan-made game • Not affiliated with Riot Games • Not for profit
```

### Option 3: Minimal but Clear
"VCT Manager (Fan-made, not affiliated with Riot Games)"

**Recommended:** Option 1 - Single line, clear, comprehensive disclaimer.

### Code Changes Required

1. **Update Layout.tsx footer text:**
   ```tsx
   <footer className="bg-vct-darker border-t border-vct-gray/20 py-3">
     <div className="max-w-7xl mx-auto px-4 text-center text-vct-gray text-xs">
       VCT Manager - Fan-made game, not affiliated with Riot Games. Not for profit.
     </div>
   </footer>
   ```

2. **Consider additional disclaimer locations:**
   - About page (if exists)
   - Game loading screen
   - Setup wizard
   - README file

---

## Related Files

- `src/components/layout/Layout.tsx` - Main footer component

---

## Notes

This addresses potential trademark and copyright concerns by clearly establishing:
1. Fan-made nature of the project
2. Lack of official affiliation with Riot Games
3. Non-profit status
4. No commercial intent

The disclaimer should be visible on every page to ensure users are consistently aware of the game's unofficial status.
