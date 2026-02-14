// WeekPlannerPanel - Shows next 6 days with scheduling status
// Uses unified day plan system with shared components and modals

import { useWeekPlan } from '../../hooks/useDayPlan';
import { useActivityModals } from '../../hooks/useActivityModals';
import { timeProgression } from '../../engine/calendar';
import {
  DayPlanItemCard,
  MatchDayBanner,
  ActivityModals,
} from '../../components/dayplan';
import type { DayPlan, DayPlanItem } from '../../types/dayPlan';

export function WeekPlannerPanel() {
  const weekPlans = useWeekPlan();
  const modals = useActivityModals();

  const handleActivityClick = (item: DayPlanItem) => {
    if (!item.action?.openModal || !item.action.eventId) return;

    // Open appropriate modal based on activity type
    if (item.action.openModal === 'training') {
      modals.openTrainingModal(item.action.eventId);
    } else if (item.action.openModal === 'scrim') {
      modals.openScrimModal(item.action.eventId);
    }
  };

  return (
    <>
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-vct-light">Week Planner</h2>
          <p className="text-sm text-vct-gray">Schedule activities for the next 6 days</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {weekPlans.map((dayPlan, idx) => (
            <DayPlanCard
              key={dayPlan.date}
              dayPlan={dayPlan}
              dayIndex={idx}
              onActivityClick={handleActivityClick}
            />
          ))}
        </div>
      </div>

      <ActivityModals {...modals} />
    </>
  );
}

interface DayPlanCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  onActivityClick: (item: DayPlanItem) => void;
}

function DayPlanCard({ dayPlan, dayIndex, onActivityClick }: DayPlanCardProps) {
  const formattedDate = timeProgression.formatDate(dayPlan.date);

  // Get relative day label (Tomorrow, Day 2, etc.)
  const getRelativeDay = () => {
    if (dayIndex === 0) return 'Tomorrow';
    return `Day ${dayIndex + 2}`;
  };

  // Filter to only match and activity items
  const matchItems = dayPlan.items.filter((item) => item.category === 'match');
  const activityItems = dayPlan.items.filter((item) => item.category === 'activity');

  return (
    <div className="bg-vct-darker rounded-lg border border-vct-gray/20 p-3">
      {/* Date header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-vct-light">{formattedDate}</p>
          <p className="text-xs text-vct-gray">{getRelativeDay()}</p>
        </div>
      </div>

      {/* Match banner */}
      {matchItems.length > 0 && matchItems[0].matchData && (
        <MatchDayBanner
          homeTeamName={matchItems[0].matchData.homeTeamName}
          awayTeamName={matchItems[0].matchData.awayTeamName}
          isPlaceholder={dayPlan.isPlaceholderMatchDay}
        />
      )}

      {/* Activities grid */}
      {activityItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {activityItems.map((item) => (
            <DayPlanItemCard
              key={item.id}
              item={item}
              variant="compact"
              onClick={() => onActivityClick(item)}
            />
          ))}
        </div>
      )}

      {/* No activities available */}
      {activityItems.length === 0 && matchItems.length === 0 && (
        <p className="text-xs text-vct-gray/60 italic">No activities available</p>
      )}
    </div>
  );
}
