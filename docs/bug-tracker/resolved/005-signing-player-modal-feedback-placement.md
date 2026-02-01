# BUG-005: Signing player modal feedback appears at top instead of bottom

**Priority:** Low
**Status:** Resolved
**Component:** Contract Negotiation Modal / Roster Management

---

## Description

When submitting a contract offer for a free agent player, the "Offer Rejected" feedback message appears at the top of the modal instead of near the bottom where the user took the action. This forces users to scroll back up to see the result of their action, creating poor UX.

### Current Behavior

1. User scrolls down to the bottom of the modal to review offer and click "Submit Offer"
2. User clicks "Submit Offer" button
3. Rejection feedback appears at the very top of the modal
4. User must scroll back up to see the feedback message

### Expected Behavior

1. User scrolls down to the bottom of the modal to review offer and click "Submit Offer"
2. User clicks "Submit Offer" button
3. Rejection feedback appears near the bottom of the modal (above or near the action buttons)
4. User can immediately see the result without scrolling

---

## Impact

- Poor user experience when negotiating contracts
- Users may miss rejection feedback if they don't scroll up
- Interrupts the natural flow of reviewing offer → submitting → seeing result

---

## Steps to Reproduce

1. Start a new game or load an existing save with available budget
2. Navigate to Roster → Free Agents tab
3. Select a high-rated free agent (expensive expectations)
4. Click "Negotiate Contract" to open the modal
5. Scroll down to the bottom and submit a low offer (likely to be rejected)
6. Observe that the "Offer Rejected" message appears at the top of the modal
7. Note that you have to scroll back up to see the feedback

---

## Root Cause Analysis

In `src/components/roster/ContractNegotiationModal.tsx`, the feedback message is rendered immediately after the modal header:

```tsx
{/* Success/Error Message */}
{result && (
  <div className={`mx-6 mt-4 p-4 rounded-lg ...`}>
    <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
      {result.success ? 'Contract Signed!' : 'Offer Rejected'}
    </p>
    ...
  </div>
)}
```

This placement makes sense for success messages (user might want to see confirmation before closing), but creates poor UX for rejections since the user is at the bottom when they submit.

---

## Proposed Fix

### Option 1: Contextual Feedback Placement
- Move rejection feedback to appear near the action buttons at the bottom
- Keep success feedback at the top (for confirmation before modal closes)
- Show both locations when appropriate

### Option 2: Always Show at Bottom
- Move all feedback (success and rejection) to appear above the action buttons
- Ensures consistent UX regardless of outcome

### Option 3: Scroll to Feedback
- Keep current placement but automatically scroll to show the feedback
- Less ideal as it interrupts user flow

**Recommended:** Option 1 (contextual placement) - Success at top for confirmation, rejection at bottom for immediate feedback.

### Code Changes Required

1. **Modify feedback rendering logic** in `ContractNegotiationModal.tsx`:
   - Render success message in current location (after header)
   - Render rejection message near action buttons (before the Actions div)

2. **Consider duplicate display** for complex rejections that need both detailed reasoning (top) and immediate feedback (bottom)

---

## Related Files

- `src/components/roster/ContractNegotiationModal.tsx` - Main modal component
- `src/services/ContractService.ts` - Contract negotiation logic

---

## Notes

This follows the general UX principle that feedback should appear near the action that triggered it. The current implementation works well for success cases but fails for rejection cases due to the modal's length and scrolling behavior.
