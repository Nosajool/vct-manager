// TodayPlanPanel - Display today's plan for the manager
//
// Shows all daily items (matches, activities, alerts, info) from the unified
// day plan system. Uses DayPlanItemCard with 'full' variant and shared modals.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { useDayPlan } from '../../hooks/useDayPlan';
import { useActivityModals } from '../../hooks/useActivityModals';
import { dayPlanService } from '../../services/DayPlanService';
import { bootcampService } from '../../services/BootcampService';
import {
  DayPlanItemCard,
  ActivityStatusBadge,
  ActivityModals,
} from '../../components/dayplan';

export function TodayPlanPanel() {
  const currentDate = useGameStore((state) => state.calendar.currentDate);
  const updateEventLifecycleState = useGameStore((state) => state.updateEventLifecycleState);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const setTeamTab = useGameStore((state) => state.setTeamTab);
  const acknowledgeDayPlanItem = useGameStore((state) => state.acknowledgeDayPlanItem);
  const dayPlan = useDayPlan(currentDate);
  const modals = useActivityModals();
  const [confirmCancelBootcamp, setConfirmCancelBootcamp] = useState(false);

  const handleItemClick = (item: (typeof dayPlan.items)[0]) => {
    // Acknowledge info/alert items on click (shows checkmark)
    if ((item.category === 'info' || item.category === 'alert') && !item.completed) {
      acknowledgeDayPlanItem(item.id);
    }

    if (!item.action) return;

    // Handle bootcamp cancellation
    if (item.action.cancelBootcamp) {
      setConfirmCancelBootcamp(true);
      return;
    }

    // Handle available activities - schedule first, then open modal if needed
    if (item.action.scheduleData) {
      try {
        const event = dayPlanService.scheduleActivity(
          item.action.scheduleData.date,
          item.action.scheduleData.activityType
        );

        if (item.action.openModal === 'training') {
          modals.openTrainingModal(event.id);
        } else if (item.action.openModal === 'scrim') {
          modals.openScrimModal(event.id);
        } else if (item.action.openModal === 'watch_party') {
          modals.openWatchPartyModal(event.id);
        } else if (item.action.openModal === 'regional_bootcamp') {
          modals.openRegionalBootcampModal(event.id);
        } else {
          // One-click downtime activity: auto-configure
          updateEventLifecycleState(event.id, 'configured');
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
      if (item.action.openModal === 'watch_party') {
        modals.openWatchPartyModal(item.action.eventId);
        return;
      }
      if (item.action.openModal === 'regional_bootcamp') {
        modals.openRegionalBootcampModal(item.action.eventId);
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

      {/* Bootcamp Cancel Confirmation */}
      {confirmCancelBootcamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-vct-dark border border-vct-gray/30 rounded-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="text-white font-semibold text-lg">Cancel Bootcamp?</h2>
            <p className="text-vct-gray text-sm">
              Cancelling will remove remaining bootcamp days and apply a morale penalty to all players.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  bootcampService.cancelBootcamp();
                  setConfirmCancelBootcamp(false);
                }}
                className="flex-1 px-4 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-medium rounded transition-colors"
              >
                Cancel Bootcamp
              </button>
              <button
                onClick={() => setConfirmCancelBootcamp(false)}
                className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-white text-sm rounded transition-colors"
              >
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
