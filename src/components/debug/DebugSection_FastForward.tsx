// DebugSection_FastForward - Headless fast-forward UI for the debug overlay
// Simulates N days without showing any modals or interviews to the user

import { useState, useRef } from 'react';
import { useGameStore } from '../../store';
import {
  fastForwardService,
  type FastForwardConfig,
  type FastForwardProgress,
  type FastForwardResult,
  type AutoResolveStrategy,
  type FastForwardStrategyConfig,
} from '../../services/FastForwardService';

const DEFAULT_STRATEGIES: FastForwardStrategyConfig = {
  preMatchInterview: 'first',
  postMatchInterview: 'best',
  crisisInterview: 'best',
  generalInterview: 'first',
  dramaEvents: 'first',
};

const STRATEGY_OPTIONS: AutoResolveStrategy[] = ['first', 'random', 'best'];

const STRATEGY_LABELS: Record<string, string> = {
  preMatchInterview: 'Pre-Match Interview',
  postMatchInterview: 'Post-Match Interview',
  crisisInterview: 'Crisis Interview',
  generalInterview: 'General Interview',
  dramaEvents: 'Drama Events',
};

export function DebugSection_FastForward() {
  const calendar = useGameStore((state) => state.calendar);

  const [days, setDays] = useState(7);
  const [strategies, setStrategies] = useState<FastForwardStrategyConfig>(DEFAULT_STRATEGIES);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<FastForwardProgress | null>(null);
  const [result, setResult] = useState<FastForwardResult | null>(null);
  const cancellationRef = useRef({ cancelled: false });

  // Calculate days to next phase
  const calcDaysToNextPhase = (): number => {
    const today = calendar.currentDate;
    const unprocessedMatchEvents = calendar.scheduledEvents
      .filter((e) => e.type === 'match' && !e.processed && e.date >= today);

    if (unprocessedMatchEvents.length === 0) return 7;

    // Find furthest unprocessed match event date
    const dates = unprocessedMatchEvents.map((e) => e.date).sort();
    const furthestDate = dates[dates.length - 1];

    // Day delta
    const fromMs = new Date(today).getTime();
    const toMs = new Date(furthestDate).getTime();
    const deltaDays = Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24)) + 3;
    return Math.min(Math.max(deltaDays, 1), 90);
  };

  const handleStart = async () => {
    setIsRunning(true);
    setResult(null);
    setProgress(null);
    cancellationRef.current = { cancelled: false };

    const config: FastForwardConfig = { days, strategies };

    try {
      const res = await fastForwardService.run(
        config,
        cancellationRef.current,
        (p) => setProgress(p),
      );
      setResult(res);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    cancellationRef.current.cancelled = true;
  };

  const progressPct =
    progress ? Math.round((progress.currentDay / progress.totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Config section */}
      {!isRunning && !result && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Fast Forward Config</h3>

          {/* Days */}
          <div className="space-y-2">
            <label className="text-vct-gray text-xs font-medium">Days to simulate</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                className="w-20 bg-vct-darker border border-vct-gray/30 rounded px-2 py-1 text-white text-sm"
              />
              <button
                onClick={() => setDays(7)}
                className="px-3 py-1 text-xs bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-white rounded transition-colors"
              >
                1 Week
              </button>
              <button
                onClick={() => setDays(14)}
                className="px-3 py-1 text-xs bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-white rounded transition-colors"
              >
                2 Weeks
              </button>
              <button
                onClick={() => setDays(calcDaysToNextPhase())}
                className="px-3 py-1 text-xs bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-gray hover:text-white rounded transition-colors"
              >
                To Next Phase
              </button>
            </div>
          </div>

          {/* Strategy dropdowns */}
          <div className="space-y-2">
            <label className="text-vct-gray text-xs font-medium">Auto-resolve strategies</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STRATEGY_LABELS) as (keyof FastForwardStrategyConfig)[]).map((key) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-vct-gray text-xs">{STRATEGY_LABELS[key]}</span>
                  <select
                    value={strategies[key]}
                    onChange={(e) =>
                      setStrategies((prev) => ({ ...prev, [key]: e.target.value as AutoResolveStrategy }))
                    }
                    className="bg-vct-darker border border-vct-gray/30 rounded px-2 py-0.5 text-white text-xs"
                  >
                    {STRATEGY_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="text-yellow-400/70 text-xs bg-yellow-400/10 border border-yellow-400/20 rounded px-3 py-2">
            This modifies live game state. Consider saving first.
          </div>

          <button
            onClick={handleStart}
            className="px-4 py-2 bg-vct-red hover:bg-vct-red/80 text-white text-sm font-medium rounded transition-colors"
          >
            Start Fast Forward ({days} {days === 1 ? 'day' : 'days'})
          </button>
        </div>
      )}

      {/* Progress section */}
      {isRunning && progress && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Running…</h3>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-vct-gray">
              <span>Day {progress.currentDay} / {progress.totalDays}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-vct-gray/20 rounded-full h-2">
              <div
                className="bg-vct-red h-2 rounded-full transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="text-vct-gray text-xs font-mono">{progress.currentDate}</div>
          <div className="text-vct-gray/70 text-xs">{progress.action}</div>

          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-vct-gray/30 hover:bg-vct-gray/40 text-white text-sm rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Summary section */}
      {result && !isRunning && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
            {result.cancelled ? 'Cancelled' : 'Complete'}
          </h3>

          <div className="bg-vct-darker border border-vct-gray/20 rounded p-3 space-y-2 text-sm">
            <div className="text-vct-gray">
              Simulated <span className="text-white">{result.daysSimulated} days</span>{' '}
              ({result.startDate} → {result.endDate})
            </div>
            <div className="text-vct-gray">
              Matches:{' '}
              <span className="text-white">{result.totalMatchesPlayed} played</span>
              {result.totalMatchesPlayed > 0 && (
                <span className="ml-1">
                  (<span className="text-green-400">{result.playerTeamWins}W</span>
                  {' / '}
                  <span className="text-red-400">{result.playerTeamLosses}L</span> for your team)
                </span>
              )}
            </div>
            <div className="text-vct-gray">
              Interviews resolved:{' '}
              <span className="text-white">{result.totalInterviewsResolved}</span>
              {' | '}
              Drama events:{' '}
              <span className="text-white">{result.totalDramaEventsResolved}</span>
            </div>
            <div className="text-vct-gray">
              Training sessions:{' '}
              <span className="text-white">{result.totalTrainingSessions}</span>
              {' | '}
              Scrims:{' '}
              <span className="text-white">{result.totalScrims}</span>
            </div>
            <div className="text-vct-gray">
              Phase changes:{' '}
              {result.phaseChanges.length === 0 ? (
                <span className="text-vct-gray/50">none</span>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {result.phaseChanges.map((pc, i) => (
                    <li key={i} className="text-white text-xs font-mono">
                      {pc.fromPhase} → {pc.toPhase} <span className="text-vct-gray/50">({pc.date})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            onClick={() => setResult(null)}
            className="px-4 py-2 bg-vct-gray/30 hover:bg-vct-gray/40 text-white text-sm rounded transition-colors"
          >
            Run Again
          </button>
        </div>
      )}
    </div>
  );
}
