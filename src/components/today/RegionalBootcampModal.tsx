// RegionalBootcampModal - Choose a region for a Regional Bootcamp
//
// Shows APAC / EU / Americas options with flavor text. Confirming stores the
// chosen region on the calendar event and marks it configured so CalendarService
// calls bootcampService.startBootcamp() when the day advances.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { dayPlanService } from '../../services/DayPlanService';
import type { BootcampRegion } from '../../types/activityPlan';

interface RegionalBootcampModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
}

const REGION_OPTIONS: { region: BootcampRegion; label: string; description: string }[] = [
  {
    region: 'APAC',
    label: 'APAC',
    description: 'Train with Korean and Japanese teams. Improves Mechanics and Clutch Factor.',
  },
  {
    region: 'EU',
    label: 'EU',
    description: 'Study the European strategic meta. Improves IGL and Mental Fortitude.',
  },
  {
    region: 'Americas',
    label: 'Americas',
    description: 'High-pace NA / LATAM scrims. Improves Entry and Lurking.',
  },
];

export function RegionalBootcampModal({ isOpen, eventId, onClose }: RegionalBootcampModalProps) {
  const updateCalendarEventData = useGameStore((state) => state.updateCalendarEventData);
  const updateEventLifecycleState = useGameStore((state) => state.updateEventLifecycleState);

  const [selectedRegion, setSelectedRegion] = useState<BootcampRegion | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedRegion) return;
    // Store chosen region on the event so CalendarService can read it when processing
    updateCalendarEventData(eventId, { activityType: 'regional_bootcamp', region: selectedRegion });
    updateEventLifecycleState(eventId, 'configured');
    onClose();
  };

  const handleCancel = () => {
    try {
      dayPlanService.unscheduleActivity(eventId);
    } catch {
      // Already removed or locked
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-vct-dark border border-vct-gray/30 rounded-lg w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 space-y-2">
          <h2 className="text-white font-semibold text-lg">Regional Bootcamp</h2>
          <p className="text-vct-gray text-sm">
            Send your team abroad for 7 days of intensive training. Choose a region to specialise in.
          </p>
        </div>

        {/* Region options */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <div className="space-y-2 pb-2">
            {REGION_OPTIONS.map(({ region, label, description }) => {
              const isSelected = selectedRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`w-full text-left px-3 py-3 rounded border text-sm transition-colors ${
                    isSelected
                      ? 'border-vct-red bg-vct-red/10 text-white'
                      : 'border-vct-gray/30 text-vct-gray hover:border-vct-gray/60 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs mt-0.5 opacity-80">{description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-2 shrink-0 border-t border-vct-gray/20">
          <button
            onClick={handleConfirm}
            disabled={!selectedRegion}
            className="flex-1 px-4 py-2 bg-vct-red hover:bg-vct-red/80 disabled:opacity-40 text-white text-sm font-medium rounded transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-white text-sm rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
