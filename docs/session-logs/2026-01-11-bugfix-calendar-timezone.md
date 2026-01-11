# Bugfix: Calendar Date Selection Off-by-One Error - Session Log

**Date:** 2026-01-11
**Type:** Bug Fix
**Status:** Complete

## Issue

Multiple timezone-related bugs in the calendar system:
1. Clicking on a date in the calendar would highlight/select the previous day instead
2. The "Simulate Match" button did not appear on match days
3. Header displayed "Dec 31, 2025" instead of "Jan 1, 2026" at game start
4. DayDetailPanel sidebar showed wrong date when clicking calendar days
5. Time controls (+1 Day, +1 Week, Next Match) didn't update the selected date

## Root Cause

JavaScript's `new Date("YYYY-MM-DD")` and `new Date("YYYY-MM-DDTHH:MM:SS.sssZ")` parse date strings as **UTC**. In timezones behind UTC (like US timezones), this causes the date to shift to the previous day when converted to local time.

For example:
- `new Date("2026-01-01")` creates `2026-01-01 00:00:00 UTC`
- In PST (UTC-8), this displays as `2025-12-31 16:00:00` local time
- `toDateString()` returns "Wed Dec 31 2025" instead of "Thu Jan 01 2026"

The code was using:
- `cursor.toISOString().split('T')[0]` - converts to UTC before extracting date
- `new Date(dateStr).toDateString()` comparisons - parses as UTC, displays as local
- `new Date(isoDate)` in formatDate functions - same UTC parsing issue
- `date-fns format(new Date(date), ...)` - same issue in Header component

## Files Modified

- `src/components/calendar/MonthCalendar.tsx`
- `src/components/calendar/DayDetailPanel.tsx`
- `src/engine/calendar/TimeProgression.ts`
- `src/components/layout/Header.tsx`
- `src/components/shared/SaveLoadModal.tsx`
- `src/pages/Schedule.tsx`

## Fix

### 1. MonthCalendar.tsx - Local Date Formatting

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

### 2. DayDetailPanel.tsx - String Comparisons

```typescript
// Before: Date object comparison with timezone issues
const isToday = timeProgression.isSameDay(selectedDate, currentDate);
const dayEvents = events.filter((e) => timeProgression.isSameDay(e.date, selectedDate));

// After: String comparison avoids timezone conversion
const selectedDateStr = getDateString(selectedDate); // splits on 'T', takes first part
const isToday = selectedDateStr === currentDateStr;
const dayEvents = events.filter((e) => getDateString(e.date) === selectedDateStr);
```

### 3. TimeProgression.ts - parseAsLocalDate Helper

```typescript
// New helper method to parse dates as local time
private parseAsLocalDate(dateStr: string): Date {
  // Extract YYYY-MM-DD portion from either "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS.sssZ"
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Updated formatDate to use the helper
formatDate(isoDate: string): string {
  const date = this.parseAsLocalDate(isoDate);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
```

### 4. Header.tsx - Local Date Parsing

```typescript
// Added helper function
function parseAsLocalDate(dateStr: string): Date {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Updated formatting
const formattedDate = currentDate
  ? format(parseAsLocalDate(currentDate), 'MMM dd, yyyy')
  : 'Not Started';
```

### 5. Schedule.tsx - Time Advancement Updates Selection

```typescript
// Before: Only updated if selected date was in the past
const handleTimeAdvanced = (result: TimeAdvanceResult) => {
  setLastAdvanceResult(result);
  if (selectedDate && new Date(selectedDate) < new Date(calendar.currentDate)) {
    setSelectedDate(calendar.currentDate);
  }
  setTimeout(() => setLastAdvanceResult(null), 3000);
};

// After: Always update to new current date
const handleTimeAdvanced = (result: TimeAdvanceResult) => {
  setLastAdvanceResult(result);
  // Always update selected date and view date to the new current date
  setSelectedDate(result.newDate);
  setViewDate(result.newDate);
  setTimeout(() => setLastAdvanceResult(null), 3000);
};
```

## Key Insight

When working with date strings in JavaScript:
- **Don't** use `new Date("YYYY-MM-DD")` for display - it parses as UTC
- **Don't** use `new Date(isoString)` for display - same issue
- **Don't** use `toISOString()` to format local dates - it converts to UTC
- **Do** extract the date portion and create with `new Date(year, month-1, day)` for local time
- **Do** use string comparisons when dates are already in YYYY-MM-DD format
- **Do** use `getFullYear()`, `getMonth()`, `getDate()` for local date formatting

## Testing Notes

- Header should show "Jan 01, 2026" at game start (not "Dec 31, 2025")
- Click on January 1 in calendar - sidebar should show "Thu, Jan 1, 2026"
- Click +1 Day - calendar should highlight and show the new current date
- Click +1 Week - same behavior
- Click Next Match - calendar should jump to and highlight the match date
- Works correctly in all timezones
