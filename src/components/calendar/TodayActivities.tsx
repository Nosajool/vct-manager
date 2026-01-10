// TodayActivities Component - Shows available activities for the current day

import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import { scrimService } from '../../services';
import { SCRIM_CONSTANTS } from '../../types/scrim';
import type { CalendarEvent } from '../../types';

interface TodayActivitiesProps {
  onMatchClick?: (matchEvent: CalendarEvent) => void;
  onTrainingClick?: () => void;
  onScrimClick?: () => void;
}

export function TodayActivities({ onMatchClick, onTrainingClick, onScrimClick }: TodayActivitiesProps) {
  const getTodaysActivities = useGameStore((state) => state.getTodaysActivities);
  const teams = useGameStore((state) => state.teams);
  const calendar = useGameStore((state) => state.calendar);

  const activities = getTodaysActivities();

  // Separate activities by type
  const matchActivity = activities.find((a) => a.type === 'match');
  const trainingActivity = activities.find((a) => a.type === 'training_available');
  const scrimActivity = activities.find((a) => a.type === 'scrim_available');
  const otherActivities = activities.filter(
    (a) => a.type !== 'match' && a.type !== 'training_available' && a.type !== 'scrim_available'
  );

  // Get weekly scrim status
  const scrimStatus = scrimService.checkWeeklyLimit();
  const scrimsRemaining = SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS - scrimStatus.scrimsUsed;

  // Check if there's a match today (prevents training)
  const hasMatchToday = !!matchActivity;

  // Get match details
  const getMatchDetails = (event: CalendarEvent): { home: string; away: string } | null => {
    const data = event.data as Record<string, unknown>;
    const homeTeamName = data?.homeTeamName as string || teams[data?.homeTeamId as string]?.name;
    const awayTeamName = data?.awayTeamName as string || teams[data?.awayTeamId as string]?.name;

    if (!homeTeamName || !awayTeamName) return null;
    return { home: homeTeamName, away: awayTeamName };
  };

  if (activities.length === 0) {
    return (
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-2">Today's Activities</h3>
        <p className="text-sm text-vct-gray/60 italic">
          No activities for {timeProgression.formatDateShort(calendar.currentDate)}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Activities</h3>

      <div className="space-y-2">
        {/* Match Activity (Priority) */}
        {matchActivity && (
          <button
            onClick={() => onMatchClick?.(matchActivity)}
            className="w-full p-3 bg-vct-red/10 hover:bg-vct-red/20 border border-vct-red/30 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-vct-red font-bold text-lg">MATCH DAY</span>
              </div>
              <span className="px-2 py-0.5 bg-vct-red/20 text-vct-red text-xs rounded font-medium">
                Required
              </span>
            </div>
            {(() => {
              const match = getMatchDetails(matchActivity);
              if (!match) return null;
              return (
                <p className="text-vct-light mt-1">
                  {match.home} vs {match.away}
                </p>
              );
            })()}
            <p className="text-xs text-vct-gray mt-1">
              Click to simulate the match
            </p>
          </button>
        )}

        {/* Training Activity */}
        {!hasMatchToday && trainingActivity && (
          <button
            onClick={() => onTrainingClick?.()}
            className="w-full p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-medium">Team Training</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">
                Optional
              </span>
            </div>
            <p className="text-xs text-vct-gray mt-1">
              Train your players to improve their stats
            </p>
          </button>
        )}

        {/* Scrim Activity */}
        {!hasMatchToday && scrimActivity && (
          <button
            onClick={() => onScrimClick?.()}
            disabled={!scrimStatus.canScrim}
            className={`w-full p-3 border rounded-lg transition-colors text-left ${
              scrimStatus.canScrim
                ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30'
                : 'bg-vct-gray/5 border-vct-gray/10 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={scrimStatus.canScrim ? 'text-purple-400 font-medium' : 'text-vct-gray/60'}>
                  Team Scrim
                </span>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                scrimStatus.canScrim
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-vct-gray/20 text-vct-gray'
              }`}>
                {scrimsRemaining}/{SCRIM_CONSTANTS.MAX_WEEKLY_SCRIMS} this week
              </span>
            </div>
            <p className="text-xs text-vct-gray mt-1">
              {scrimStatus.canScrim
                ? 'Practice against other teams to improve map pool and chemistry'
                : 'Weekly scrim limit reached'}
            </p>
          </button>
        )}

        {/* Training Not Available (Match Day) */}
        {hasMatchToday && (
          <div className="p-3 bg-vct-gray/5 border border-vct-gray/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-vct-gray/60">Team Training</span>
              <span className="px-2 py-0.5 bg-vct-gray/20 text-vct-gray text-xs rounded font-medium">
                Unavailable
              </span>
            </div>
            <p className="text-xs text-vct-gray/40 mt-1">
              No training on match days
            </p>
          </div>
        )}

        {/* Scrim Not Available (Match Day) */}
        {hasMatchToday && (
          <div className="p-3 bg-vct-gray/5 border border-vct-gray/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-vct-gray/60">Team Scrim</span>
              <span className="px-2 py-0.5 bg-vct-gray/20 text-vct-gray text-xs rounded font-medium">
                Unavailable
              </span>
            </div>
            <p className="text-xs text-vct-gray/40 mt-1">
              No scrims on match days
            </p>
          </div>
        )}

        {/* Other Activities */}
        {otherActivities.map((activity) => (
          <div
            key={activity.id}
            className="p-3 bg-vct-gray/5 border border-vct-gray/10 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-vct-gray capitalize">
                {activity.type.replace(/_/g, ' ')}
              </span>
              {activity.required ? (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-medium">
                  Required
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-vct-gray/20 text-vct-gray text-xs rounded font-medium">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-vct-gray/60 mt-1">
              {timeProgression.getEventDescription(activity)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
