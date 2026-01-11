// CalendarView Component - Displays current date and upcoming events

import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';

interface CalendarViewProps {
  showFullSchedule?: boolean;
  maxEvents?: number;
}

export function CalendarView({ showFullSchedule = false, maxEvents = 5 }: CalendarViewProps) {
  const calendar = useGameStore((state) => state.calendar);
  const getUpcomingEvents = useGameStore((state) => state.getUpcomingEvents);
  const teams = useGameStore((state) => state.teams);
  const setActiveView = useGameStore((state) => state.setActiveView);

  const upcomingEvents = getUpcomingEvents(maxEvents);

  // Get event type styling
  const getEventStyle = (type: string): { bg: string; text: string; label: string } => {
    switch (type) {
      case 'match':
        return { bg: 'bg-vct-red/20', text: 'text-vct-red', label: 'Match' };
      case 'salary_payment':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Salary' };
      case 'training_available':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Training' };
      case 'rest_day':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Rest' };
      case 'tournament_start':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Tournament' };
      case 'tournament_end':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Tournament' };
      default:
        return { bg: 'bg-vct-gray/20', text: 'text-vct-gray', label: 'Event' };
    }
  };

  // Get event description
  const getEventDescription = (event: typeof upcomingEvents[0]): string => {
    const data = event.data as Record<string, unknown>;

    switch (event.type) {
      case 'match': {
        const homeTeamName = data?.homeTeamName as string || teams[data?.homeTeamId as string]?.name || 'TBD';
        const awayTeamName = data?.awayTeamName as string || teams[data?.awayTeamId as string]?.name || 'TBD';
        return `${homeTeamName} vs ${awayTeamName}`;
      }
      case 'salary_payment':
        return 'Monthly salaries due';
      case 'training_available':
        return 'Training session available';
      case 'rest_day':
        return 'Scheduled rest day';
      case 'tournament_start':
        return `${data?.tournamentName || 'Tournament'} begins`;
      case 'tournament_end':
        return `${data?.tournamentName || 'Tournament'} ends`;
      default:
        return event.type.replace(/_/g, ' ');
    }
  };

  // Format relative date
  const getRelativeDate = (eventDate: string): string => {
    const days = timeProgression.getDaysDifference(calendar.currentDate, eventDate);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'In 1 week' : `In ${weeks} weeks`;
  };

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      {/* Current Date Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-vct-gray uppercase tracking-wider">Current Date</p>
            <p className="text-xl font-bold text-vct-light">
              {timeProgression.formatDate(calendar.currentDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-vct-gray">Season {calendar.currentSeason}</p>
            <p className="text-sm text-vct-light capitalize">
              {calendar.currentPhase.replace(/([0-9]+)/g, ' $1')}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-sm font-semibold text-vct-gray mb-2">Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-vct-gray/60 italic">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => {
              const style = getEventStyle(event.type);
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded bg-vct-darker"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-vct-light">
                      {getEventDescription(event)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-vct-gray">
                      {getRelativeDate(event.date)}
                    </span>
                    <p className="text-xs text-vct-gray/60">
                      {timeProgression.formatDateShort(event.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Show More Link */}
      {showFullSchedule && upcomingEvents.length >= maxEvents && (
        <div className="mt-3 pt-2 border-t border-vct-gray/10">
          <button
            onClick={() => setActiveView('schedule')}
            className="text-sm text-vct-red hover:text-vct-red/80 transition-colors"
          >
            View Full Schedule
          </button>
        </div>
      )}
    </div>
  );
}
