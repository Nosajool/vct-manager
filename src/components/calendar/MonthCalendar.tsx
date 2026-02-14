// MonthCalendar - Visual month grid calendar component

import { useMemo } from 'react';
import type { CalendarEvent } from '../../types';

interface MonthCalendarProps {
  currentDate: string;
  viewDate: string;
  events: CalendarEvent[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange: (date: string) => void;
}

interface DayCell {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

// Get event dot color based on type
function getEventColor(type: string): string {
  switch (type) {
    case 'match':
      return 'bg-vct-red';
    case 'tournament_start':
    case 'tournament_end':
      return 'bg-purple-500';
    case 'salary_payment':
      return 'bg-yellow-500';
    case 'scheduled_training':
      return 'bg-blue-500';
    case 'scheduled_scrim':
      return 'bg-orange-500';
    case 'rest_day':
      return 'bg-green-500';
    default:
      return 'bg-vct-gray';
  }
}

export function MonthCalendar({
  currentDate,
  viewDate,
  events,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: MonthCalendarProps) {
  // Parse the view date to get month/year
  const viewMonth = useMemo(() => {
    const d = new Date(viewDate);
    return { month: d.getMonth(), year: d.getFullYear() };
  }, [viewDate]);

  // Generate calendar days for the month
  const calendarDays = useMemo((): DayCell[] => {
    const days: DayCell[] = [];
    const { month, year } = viewMonth;

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday before (or on) the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on the Saturday after (or on) the last day
    const endDate = new Date(lastDay);
    const daysUntilSaturday = 6 - endDate.getDay();
    endDate.setDate(endDate.getDate() + daysUntilSaturday);

    // Normalize date strings for comparison (extract YYYY-MM-DD)
    const currentDateStr = currentDate.split('T')[0];
    const selectedDateStr = selectedDate?.split('T')[0] || null;

    // Build the day cells
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      // Format date as YYYY-MM-DD in local timezone (not UTC)
      const dateYear = cursor.getFullYear();
      const dateMonth = String(cursor.getMonth() + 1).padStart(2, '0');
      const dateDay = String(cursor.getDate()).padStart(2, '0');
      const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;

      // Find events for this day (compare by date string to avoid timezone issues)
      const dayEvents = events.filter((e) => {
        const eventDateStr = e.date.split('T')[0];
        return eventDateStr === dateStr;
      });

      days.push({
        date: dateStr,
        dayNumber: cursor.getDate(),
        isCurrentMonth: cursor.getMonth() === month,
        isToday: dateStr === currentDateStr,
        isSelected: dateStr === selectedDateStr,
        events: dayEvents,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [viewMonth, currentDate, selectedDate, events]);

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Navigate to previous month
  const goToPrevMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(formatLocalDate(d));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(formatLocalDate(d));
  };

  // Navigate to current date
  const goToToday = () => {
    onMonthChange(currentDate);
    onDateSelect(currentDate);
  };

  // Format month/year for header
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewMonth.year, viewMonth.month);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewMonth]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 text-vct-gray hover:text-vct-light hover:bg-vct-gray/20 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-vct-light">{monthYearLabel}</h2>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs bg-vct-gray/20 text-vct-gray hover:text-vct-light rounded transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 text-vct-gray hover:text-vct-light hover:bg-vct-gray/20 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-vct-gray py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const hasEvents = day.events.length > 0;
          const uniqueEventTypes = [...new Set(day.events.map((e) => e.type))];

          return (
            <button
              key={day.date}
              onClick={() => onDateSelect(day.date)}
              className={`
                relative p-2 min-h-[60px] rounded transition-colors text-left
                ${day.isCurrentMonth ? 'hover:bg-vct-gray/20' : 'opacity-40'}
                ${day.isSelected ? 'bg-vct-red/20 border border-vct-red' : 'border border-transparent'}
                ${day.isToday && !day.isSelected ? 'bg-vct-gray/10 border border-vct-gray/50' : ''}
              `}
            >
              {/* Day number */}
              <span
                className={`
                  text-sm font-medium
                  ${day.isToday ? 'text-vct-red font-bold' : day.isCurrentMonth ? 'text-vct-light' : 'text-vct-gray/50'}
                `}
              >
                {day.dayNumber}
              </span>

              {/* Event indicators */}
              {hasEvents && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
                  {uniqueEventTypes.slice(0, 3).map((type, idx) => (
                    <span
                      key={idx}
                      className={`w-2 h-2 rounded-full ${getEventColor(type)}`}
                      title={type}
                    />
                  ))}
                  {uniqueEventTypes.length > 3 && (
                    <span className="text-xs text-vct-gray">+{uniqueEventTypes.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-vct-gray/20 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-vct-red" />
          <span className="text-vct-gray">Match</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-vct-gray">Tournament</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-vct-gray">Salary</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-vct-gray">Scrim</span>
        </div>
      </div>
    </div>
  );
}
