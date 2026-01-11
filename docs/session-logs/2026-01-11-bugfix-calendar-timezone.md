# Bugfix: Calendar Date Selection Off-by-One Error - Session Log

**Date:** 2026-01-11
**Type:** Bug Fix
**Status:** Complete

## Issue

Two related bugs in the new visual calendar on the Schedule page:
1. Clicking on a date in the calendar would highlight/select the previous day instead
2. The "Simulate Match" button did not appear on match days

## Root Cause

JavaScript's `new Date("YYYY-MM-DD")` parses date strings as **UTC midnight**. In timezones behind UTC (like US timezones), this causes the date to shift to the previous day when converted to local time.

For example:
- `new Date("2025-01-01")` creates `2025-01-01 00:00:00 UTC`
- In PST (UTC-8), this displays as `2024-12-31 16:00:00` local time
- `toDateString()` returns "Tue Dec 31 2024" instead of "Wed Jan 01 2025"

The code was using:
- `cursor.toISOString().split('T')[0]` - converts to UTC before extracting date
- `new Date(dateStr).toDateString()` comparisons - parses as UTC, displays as local
- `Date.getTime()` comparisons between dates parsed differently

## Files Modified

- `src/components/calendar/MonthCalendar.tsx`
- `src/components/calendar/DayDetailPanel.tsx`

## Fix

Changed all date handling to use **string comparisons** in YYYY-MM-DD format instead of Date object comparisons:

### MonthCalendar.tsx

```typescript
// Before: UTC conversion caused off-by-one
const dateStr = cursor.toISOString().split('T')[0];
isToday: cursorCopy.getTime() === currentDateObj.getTime(),

// After: Local timezone formatting + string comparison
const dateYear = cursor.getFullYear();
const dateMonth = String(cursor.getMonth() + 1).padStart(2, '0');
const dateDay = String(cursor.getDate()).padStart(2, '0');
const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;
isToday: dateStr === currentDateStr,
```

### DayDetailPanel.tsx

```typescript
// Before: Date object comparison with timezone issues
const isToday = timeProgression.isSameDay(selectedDate, currentDate);
const dayEvents = events.filter((e) => timeProgression.isSameDay(e.date, selectedDate));

// After: String comparison avoids timezone conversion
const selectedDateStr = getDateString(selectedDate); // splits on 'T', takes first part
const isToday = selectedDateStr === currentDateStr;
const dayEvents = events.filter((e) => getDateString(e.date) === selectedDateStr);
```

## Key Insight

When working with date strings in JavaScript:
- **Don't** use `new Date("YYYY-MM-DD")` for comparisons - it parses as UTC
- **Don't** use `toISOString()` to format local dates - it converts to UTC
- **Do** use string comparisons when dates are already in YYYY-MM-DD format
- **Do** use `getFullYear()`, `getMonth()`, `getDate()` for local date formatting

## Testing Notes

- Click on January 1 in calendar - should show January 1 events (not December 31)
- Navigate to a match day and click on it - "Simulate Match" button should appear
- Works correctly in all timezones
