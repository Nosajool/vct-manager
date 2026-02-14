// TodayPlanPanel - Display today's plan for the manager
//
// Shows all daily items (matches, activities, alerts, info) from the unified
// day plan system. Uses DayPlanItemCard with 'full' variant and shared modals.

import { useGameStore } from '../../store';
import { useDayPlan } from '../../hooks/useDayPlan';
import { useActivityModals } from '../../hooks/useActivityModals';
import {
  DayPlanItemCard,
  ActivityStatusBadge,
  ActivityModals,
} from '../../components/dayplan';

export function TodayPlanPanel() {
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const dayPlan = useDayPlan(currentDate);
  const modals = useActivityModals();

  const handleItemClick = (item: (typeof dayPlan.items)[0]) => {
    if (!item.action) return;

    // Check if we should open a modal instead of navigating
    if (item.action.openModal) {
      if (item.action.openModal === 'training' && item.action.eventId) {
        modals.openTrainingModal(item.action.eventId);
        return;
      }
      if (item.action.openModal === 'scrim' && item.action.eventId) {
        modals.openScrimModal(item.action.eventId);
        return;
      }
    }

    // Otherwise, navigate to the specified view
    if (item.action.view) {
      setActiveView(item.action.view);
    }
  };

  if (dayPlan.items.length === 0) {
    return (
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Plan</h3>
        <p className="text-sm text-vct-gray/60 italic">No items for today</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Today's Plan</h3>

        <div className="space-y-2">
          {dayPlan.items.map((item) => (
            <DayPlanItemCard
              key={item.id}
              item={item}
              variant="full"
              onClick={() => handleItemClick(item)}
              statusBadge={
                item.activityState ? <ActivityStatusBadge state={item.activityState} /> : null
              }
            />
          ))}
        </div>
      </div>

      <ActivityModals {...modals} />
    </>
  );
}
