// DowntimeActivityPicker - Modal shown during Advance Day flow when team is in downtime
//
// Presents available downtime activities + optional bootcamp start. Part of the
// BitLife-style advance flow: appears before simulation runs, replaces the old
// pre-scheduled activity system.

import { useState } from 'react';
import { useGameStore } from '../../store';
import { bootcampService } from '../../services/BootcampService';
import type { BootcampRegion } from '../../types/activityPlan';

interface DowntimeActivityPickerProps {
  isOpen: boolean;
  onSelect: (activityType: string | null) => void; // null = skip (or bootcamp started)
  bootcampEligible: boolean;
}

interface ActivityInfo {
  type: string;
  name: string;
  description: string;
  effects: string[];
}

const ACTIVITIES: ActivityInfo[] = [
  {
    type: 'fan_meetup',
    name: 'Fan Meetup',
    description: 'Organise a meet-and-greet with your fanbase.',
    effects: ['Cost: $2,000', 'All players +3 morale', '+4 hype', '+2 fanbase'],
  },
  {
    type: 'streamer_collab',
    name: 'Streamer Collab',
    description: 'Feature one player in a collab stream with a popular content creator.',
    effects: ['Cost: $5,000', 'Featured player +2 morale', '+5 hype', '+3 fanbase'],
  },
  {
    type: 'youtube_documentary',
    name: 'YouTube Documentary',
    description: 'Produce a behind-the-scenes documentary.',
    effects: ['Cost: $10,000', 'Featured player +5 morale, others −1', '+4 fanbase', '+5 sponsor trust', '60% drama chance'],
  },
  {
    type: 'watch_party',
    name: 'Watch Party',
    description: 'Watch other teams compete and study the meta.',
    effects: ['Free', 'Sets tournament_watching flag', '+2 hype', '80% interview chance'],
  },
  {
    type: 'sponsored_content',
    name: 'Sponsored Content',
    description: 'Fulfil a sponsor activation for money and trust.',
    effects: ['Earn $8,000–$15,000', 'All players −1 morale', '+3 sponsor trust'],
  },
];

const REGION_OPTIONS: { region: BootcampRegion; label: string; description: string }[] = [
  { region: 'APAC', label: 'APAC', description: 'Train with Korean and Japanese teams. Improves Mechanics and Clutch Factor.' },
  { region: 'EU', label: 'EU', description: 'Study the European strategic meta. Improves IGL and Mental Fortitude.' },
  { region: 'Americas', label: 'Americas', description: 'High-pace NA / LATAM scrims. Improves Entry and Lurking.' },
];

export function DowntimeActivityPicker({ isOpen, onSelect, bootcampEligible }: DowntimeActivityPickerProps) {
  const [showBootcampPicker, setShowBootcampPicker] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<BootcampRegion | null>(null);
  const calendar = useGameStore((state) => state.calendar);

  if (!isOpen) return null;

  const handleActivitySelect = (activityType: string) => {
    onSelect(activityType);
  };

  const handleBootcampConfirm = () => {
    if (!selectedRegion) return;
    bootcampService.startBootcamp(selectedRegion, calendar.currentDate);
    setShowBootcampPicker(false);
    setSelectedRegion(null);
    onSelect(null); // bootcamp handles its own day processing
  };

  const handleBootcampCancel = () => {
    setShowBootcampPicker(false);
    setSelectedRegion(null);
  };

  const handleSkip = () => {
    onSelect(null);
  };

  if (showBootcampPicker) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-vct-darker rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-vct-gray/20">
            <h2 className="text-xl font-bold text-vct-light">Regional Bootcamp</h2>
            <p className="text-sm text-vct-gray mt-1">Choose a region for your 7-day training camp</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {REGION_OPTIONS.map(({ region, label, description }) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  selectedRegion === region
                    ? 'border-vct-red bg-vct-red/10'
                    : 'border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40'
                }`}
              >
                <p className="font-semibold text-vct-light">{label}</p>
                <p className="text-sm text-vct-gray mt-1">{description}</p>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-vct-gray/20 flex gap-3">
            <button
              onClick={handleBootcampConfirm}
              disabled={!selectedRegion}
              className="flex-1 py-2.5 bg-vct-red hover:bg-vct-red/80 disabled:bg-vct-gray/20 disabled:text-vct-gray text-white rounded-lg font-medium transition-colors"
            >
              {selectedRegion ? `Start ${selectedRegion} Bootcamp` : 'Select a Region'}
            </button>
            <button
              onClick={handleBootcampCancel}
              className="px-4 py-2.5 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-vct-light rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-vct-light">Free Day</h2>
            <p className="text-sm text-vct-gray mt-0.5">Choose an activity or skip to rest</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-vct-gray hover:text-vct-light transition-colors border border-vct-gray/30 rounded px-3 py-1"
          >
            Skip
          </button>
        </div>

        {/* Activity Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {ACTIVITIES.map((activity) => (
            <button
              key={activity.type}
              onClick={() => handleActivitySelect(activity.type)}
              className="w-full p-4 rounded-lg border border-vct-gray/20 bg-vct-dark hover:border-vct-gray/40 hover:bg-vct-dark/80 text-left transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-vct-light">{activity.name}</p>
                  <p className="text-sm text-vct-gray mt-0.5">{activity.description}</p>
                </div>
                <div className="text-xs text-vct-gray/60 shrink-0 text-right space-y-0.5">
                  {activity.effects.slice(0, 2).map((e) => (
                    <p key={e}>{e}</p>
                  ))}
                </div>
              </div>
            </button>
          ))}

          {/* Regional Bootcamp option */}
          {bootcampEligible && (
            <button
              onClick={() => setShowBootcampPicker(true)}
              className="w-full p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10 text-left transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-blue-400">Regional Bootcamp</p>
                  <p className="text-sm text-vct-gray mt-0.5">7-day intensive training camp in another region.</p>
                </div>
                <div className="text-xs text-vct-gray/60 shrink-0 text-right space-y-0.5">
                  <p>7 days</p>
                  <p>Stat improvements</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
