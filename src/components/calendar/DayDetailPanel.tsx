// DayDetailPanel - Shows details for a selected calendar day

import type { CalendarEvent } from '../../types';
import { timeProgression } from '../../engine/calendar';

interface DayDetailPanelProps {
  selectedDate: string;
  currentDate: string;
  events: CalendarEvent[];
  teams: Record<string, { id: string; name: string }>;
  playerTeamId: string | null;
  onSimulateMatch: (matchId: string) => void;
  onTrainingClick: () => void;
  onScrimClick: () => void;
  isSimulating: boolean;
}

// Get event styling based on type
function getEventStyle(type: string): { bg: string; text: string; label: string } {
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
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Tournament Start' };
    case 'tournament_end':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Tournament End' };
    case 'scrim_available':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Scrim' };
    default:
      return { bg: 'bg-vct-gray/20', text: 'text-vct-gray', label: 'Event' };
  }
}

// Helper to extract YYYY-MM-DD from a date string (handles both ISO and plain dates)
function getDateString(date: string): string {
  return date.split('T')[0];
}

export function DayDetailPanel({
  selectedDate,
  currentDate,
  events,
  teams,
  playerTeamId,
  onSimulateMatch,
  onTrainingClick,
  onScrimClick,
  isSimulating,
}: DayDetailPanelProps) {
  // Compare dates by their YYYY-MM-DD string to avoid timezone issues
  const selectedDateStr = getDateString(selectedDate);
  const currentDateStr = getDateString(currentDate);
  const isToday = selectedDateStr === currentDateStr;
  const isPast = selectedDateStr < currentDateStr;
  const dayEvents = events.filter((e) => {
    return getDateString(e.date) === selectedDateStr;
  });

  // Check if there's a match today (for disabling training)
  const hasMatch = dayEvents.some((e) => e.type === 'match' && !e.processed);

  // Format the selected date
  const formattedDate = timeProgression.formatDate(selectedDate);

  // Get relative day text
  const getRelativeDay = () => {
    const diff = timeProgression.getDaysDifference(currentDate, selectedDate);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 1) return `In ${diff} days`;
    return `${Math.abs(diff)} days ago`;
  };

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-vct-light">{formattedDate}</h3>
          <p className={`text-sm ${isToday ? 'text-vct-red font-medium' : 'text-vct-gray'}`}>
            {getRelativeDay()}
          </p>
        </div>
        {isToday && (
          <span className="px-2 py-1 bg-vct-red/20 text-vct-red text-xs font-medium rounded">
            Current Day
          </span>
        )}
      </div>

      {/* Events list */}
      {dayEvents.length > 0 ? (
        <div className="space-y-3">
          {dayEvents.map((event) => {
            const style = getEventStyle(event.type);
            const data = event.data as Record<string, unknown>;

            // Render match event specially
            if (event.type === 'match') {
              const homeTeamId = data?.homeTeamId as string;
              const awayTeamId = data?.awayTeamId as string;
              const homeTeam = teams[homeTeamId];
              const awayTeam = teams[awayTeamId];
              const matchId = data?.matchId as string;
              const isTournament = !!data?.tournamentId;

              return (
                <div
                  key={event.id}
                  className="bg-vct-darker border border-vct-gray/20 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {isTournament && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                          Tournament
                        </span>
                      )}
                      {event.processed && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="text-center flex-1">
                      <p className={`font-semibold ${homeTeamId === playerTeamId ? 'text-vct-red' : 'text-vct-light'}`}>
                        {homeTeam?.name || 'TBD'}
                      </p>
                    </div>
                    <div className="px-3 text-vct-gray text-sm">vs</div>
                    <div className="text-center flex-1">
                      <p className={`font-semibold ${awayTeamId === playerTeamId ? 'text-vct-red' : 'text-vct-light'}`}>
                        {awayTeam?.name || 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Simulate button - only if today and not processed */}
                  {isToday && !event.processed && matchId && (
                    <button
                      onClick={() => onSimulateMatch(matchId)}
                      disabled={isSimulating}
                      className="w-full mt-2 px-4 py-2 bg-vct-red hover:bg-vct-red/80 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
                    >
                      {isSimulating ? 'Simulating...' : 'Simulate Match'}
                    </button>
                  )}

                  {/* Message for future matches */}
                  {!isToday && !isPast && !event.processed && (
                    <p className="mt-2 text-center text-sm text-vct-gray">
                      Advance time to this day to simulate
                    </p>
                  )}
                </div>
              );
            }

            // Render other event types
            return (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-vct-darker rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-sm text-vct-light">
                    {getEventDescription(event, teams)}
                  </span>
                </div>
                {event.processed && (
                  <span className="text-xs text-green-400">Completed</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-vct-gray italic">No events scheduled</p>
      )}

      {/* Available activities for today */}
      {isToday && (
        <div className="mt-4 pt-4 border-t border-vct-gray/20">
          <h4 className="text-sm font-medium text-vct-gray mb-3">Available Activities</h4>
          <div className="flex gap-2">
            <button
              onClick={onTrainingClick}
              disabled={hasMatch}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                hasMatch
                  ? 'bg-vct-gray/10 text-vct-gray/50 cursor-not-allowed'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              Training
            </button>
            <button
              onClick={onScrimClick}
              disabled={hasMatch}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                hasMatch
                  ? 'bg-vct-gray/10 text-vct-gray/50 cursor-not-allowed'
                  : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
              }`}
            >
              Scrim
            </button>
          </div>
          {hasMatch && (
            <p className="mt-2 text-xs text-vct-gray text-center">
              Training and scrims unavailable on match day
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function for event descriptions
function getEventDescription(event: CalendarEvent, teams: Record<string, { name: string }>): string {
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
    case 'scrim_available':
      return 'Scrim session available';
    default:
      return event.type.replace(/_/g, ' ');
  }
}
