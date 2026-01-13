# 2026-01-12: Schedule Page - Auto-Select Current Day

## Issue
When navigating to the Schedule page, the DayDetailPanel showed "Select a date to view details" instead of automatically displaying today's events.

## Fix
Modified `src/pages/Schedule.tsx` to initialize `selectedDate` with `calendar.currentDate` instead of `null`. This ensures the current day is automatically selected when viewing the Schedule page.

## Change
```tsx
// Before
const [selectedDate, setSelectedDate] = useState<string | null>(null);

// After
const [selectedDate, setSelectedDate] = useState<string>(calendar.currentDate);
```

The `selectedDate` state was moved after the `calendar` store hook to avoid TypeScript errors about using a variable before it's declared.

## Result
The Schedule page now loads with today's date pre-selected in the DayDetailPanel, showing current day events and available activities (Training, Scrim) without requiring the user to manually select a date.
