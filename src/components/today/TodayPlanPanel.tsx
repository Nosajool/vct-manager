// TodayPlanPanel - Display today's plan for the manager
//
// Shows all daily items (matches, activities, alerts, info) from the unified
// day plan system. Uses DayPlanItemCard with 'full' variant and shared modals.

import { useGameStore } from '../../store';
import { useDayPlan } from '../../hooks/useDayPlan';
import { useActivityModals } from '../../hooks/useActivityModals';
import { dayPlanService } from '../../services/DayPlanService';
import {
  DayPlanItemCard,
  ActivityStatusBadge,
  ActivityModals,
} from '../../components/dayplan';

export function TodayPlanPanel() {
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const setTeamTab = useGameStore((state) => state.setTeamTab);
  const acknowledgeDayPlanItem = useGameStore((state) => state.acknowledgeDayPlanItem);
  const dayPlan = useDayPlan(currentDate);
  const modals = useActivityModals();

  const handleItemClick = (item: (typeof dayPlan.items)[0]) => {
    // Acknowledge info/alert items on click (shows checkmark)
    if ((item.category === 'info' || item.category === 'alert') && !item.completed) {
      acknowledgeDayPlanItem(item.id);
    }

    if (!item.action) return;

    // Handle available activities - schedule first, then open modal
    if (item.action.scheduleData && item.action.openModal) {
      try {
        const event = dayPlanService.scheduleActivity(
          item.action.scheduleData.date,
          item.action.scheduleData.activityType
        );

        // Open the modal with the newly created event
        if (item.action.openModal === 'training') {
          modals.openTrainingModal(event.id);
        } else if (item.action.openModal === 'scrim') {
          modals.openScrimModal(event.id);
        }
      } catch (err) {
        console.error('Failed to schedule activity:', err);
      }
      return;
    }

    // Handle existing scheduled activities
    if (item.action.openModal && item.action.eventId) {
      if (item.action.openModal === 'training') {
        modals.openTrainingModal(item.action.eventId);
        return;
      }
      if (item.action.openModal === 'scrim') {
        modals.openScrimModal(item.action.eventId);
        return;
      }
    }

    // Handle navigation
    if (item.action.view) {
      if (item.action.data?.tab) {
        setTeamTab(item.action.data.tab);
      }
      setActiveView(item.action.view);
    }
  };

  // Filter out unavailable activities - no need to show these to the player
  const visibleItems = dayPlan.items.filter(
    (item) => item.activityState !== 'unavailable'
  );

  if (visibleItems.length === 0) {
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
          {visibleItems.map((item) => (
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
