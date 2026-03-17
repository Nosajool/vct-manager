// DowntimeActivityModal - Preview/confirm modal for one-click downtime activities
//
// Shows expected effects for Fan Meetup, Streamer Collab, YouTube Documentary,
// and Sponsored Content before the player commits to scheduling them.

import { useGameStore } from '../../store';
import { dayPlanService } from '../../services/DayPlanService';
import type { DowntimeActivityType } from '../../hooks/useActivityModals';

interface DowntimeActivityModalProps {
  isOpen: boolean;
  eventId: string;
  activityType: DowntimeActivityType;
  onClose: () => void;
}

interface ActivityInfo {
  name: string;
  description: string;
  effects: string[];
}

const ACTIVITY_INFO: Record<DowntimeActivityType, ActivityInfo> = {
  fan_meetup: {
    name: 'Fan Meetup',
    description: 'Organise a meet-and-greet with your fanbase. Boosts morale across the whole roster.',
    effects: [
      'Cost: $2,000',
      'All players +3 morale',
      '+4 hype',
      '+2 fanbase',
    ],
  },
  streamer_collab: {
    name: 'Streamer Collab',
    description: 'Feature one player in a collab stream with a popular content creator.',
    effects: [
      'Cost: $5,000',
      'Featured player +2 morale',
      '+5 hype',
      '+3 fanbase',
    ],
  },
  youtube_documentary: {
    name: 'YouTube Documentary',
    description: 'Produce a behind-the-scenes documentary. Strong rep gains but risks internal drama.',
    effects: [
      'Cost: $10,000',
      'Featured player +5 morale, others −1 morale',
      '+4 fanbase',
      '+5 sponsor trust',
      '60% chance of drama',
    ],
  },
  sponsored_content: {
    name: 'Sponsored Content',
    description: 'Fulfil a sponsor activation. Earns money and builds trust but wears on the roster.',
    effects: [
      'Earn $8,000–$15,000',
      'All players −1 morale',
      '+3 sponsor trust',
      'Requires active sponsorships',
    ],
  },
};

export function DowntimeActivityModal({ isOpen, eventId, activityType, onClose }: DowntimeActivityModalProps) {
  const updateEventLifecycleState = useGameStore((state) => state.updateEventLifecycleState);

  if (!isOpen) return null;

  const info = ACTIVITY_INFO[activityType];

  const handleSchedule = () => {
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
          <h2 className="text-white font-semibold text-lg">{info.name}</h2>
          <p className="text-vct-gray text-sm">{info.description}</p>
        </div>

        {/* Effects */}
        <div className="px-6 pb-4 shrink-0">
          <h3 className="text-xs font-semibold text-vct-gray/60 uppercase tracking-wider mb-2">Expected Effects</h3>
          <ul className="space-y-1">
            {info.effects.map((effect) => (
              <li key={effect} className="text-sm text-vct-gray flex items-start gap-2">
                <span className="text-vct-red mt-0.5">•</span>
                <span>{effect}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-2 shrink-0 border-t border-vct-gray/20">
          <button
            onClick={handleSchedule}
            className="flex-1 px-4 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-medium rounded transition-colors"
          >
            Schedule
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
