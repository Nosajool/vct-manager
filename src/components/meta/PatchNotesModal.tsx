// PatchNotesModal - Shows patch notes when a new meta patch is activated
//
// Displayed when a patch_notes calendar event is processed during day advancement.
// Shows version, summary, buffed/nerfed agents, and detailed map changes.
//
// Data flow:
// 1. TimeBar advances day
// 2. CalendarService processes patch_notes event, sets currentPatch
// 3. TimeBar detects patch change, shows this modal
// 4. On close, proceeds to rest of modal queue (training, scrim, drama, etc.)

import { useState } from 'react';
import type { MetaPatch } from '../../types/meta';

interface PatchNotesModalProps {
  patch: MetaPatch;
  onClose: () => void;
  isPreview?: boolean;
}

export function PatchNotesModal({ patch, onClose, isPreview = false }: PatchNotesModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRankText = (position: number): string => {
    switch (position) {
      case 0:
        return 'Top Tier';
      case 1:
        return 'High Tier';
      case 2:
        return 'Mid-High';
      case 3:
        return 'Mid Tier';
      case 4:
        return 'Low Tier';
      default:
        return `#${position}`;
    }
  };

  const groupedChanges = patch.changes.reduce((acc, change) => {
    const key = `${change.agent}-${change.direction}-${change.toPosition}`;
    if (!acc[key]) {
      acc[key] = { agent: change.agent, direction: change.direction, toPosition: change.toPosition, maps: [] };
    }
    acc[key].maps.push(change.map);
    return acc;
  }, {} as Record<string, { agent: string; direction: 'buff' | 'nerf'; toPosition: number; maps: string[] }>);

  const groupedChangesArray = Object.values(groupedChanges);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b border-vct-gray/20 bg-gradient-to-b ${isPreview ? 'from-amber-950/40 to-vct-darker' : 'from-vct-dark to-vct-darker'}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {isPreview ? (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-bold rounded">
                COMING SOON
              </span>
            ) : (
              <span className="px-3 py-1 bg-vct-red/20 text-vct-red text-sm font-bold rounded">
                PATCH
              </span>
            )}
            <span className="text-vct-light text-2xl font-bold">
              v{patch.version}
            </span>
          </div>
          <h2 className="text-xl font-bold text-vct-light text-center">
            {patch.title}
          </h2>
          <p className="text-vct-gray mt-2 text-center">
            {patch.summary}
          </p>
          {isPreview && (
            <p className="text-amber-400/80 text-sm mt-2 text-center italic">
              Drops in a few days — prepare your strategy now
            </p>
          )}
        </div>

        {/* Agent Changes Summary */}
        <div className="px-6 py-4 border-b border-vct-gray/20">
          <div className="grid grid-cols-2 gap-4">
            {/* Buffed Agents */}
            <div>
              <h4 className="text-sm font-medium text-green-400 uppercase mb-2">
                Buffed Agents
              </h4>
              <div className="flex flex-wrap gap-2">
                {patch.buffedAgents.length > 0 ? (
                  patch.buffedAgents.map((agent) => (
                    <span
                      key={agent}
                      className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded"
                    >
                      {agent}
                    </span>
                  ))
                ) : (
                  <span className="text-vct-gray text-sm">None</span>
                )}
              </div>
            </div>

            {/* Nerfed Agents */}
            <div>
              <h4 className="text-sm font-medium text-red-400 uppercase mb-2">
                Nerfed Agents
              </h4>
              <div className="flex flex-wrap gap-2">
                {patch.nerfedAgents.length > 0 ? (
                  patch.nerfedAgents.map((agent) => (
                    <span
                      key={agent}
                      className="px-2 py-1 bg-red-500/20 text-red-400 text-sm rounded"
                    >
                      {agent}
                    </span>
                  ))
                ) : (
                  <span className="text-vct-gray text-sm">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Changes (Collapsible) */}
        {patch.changes.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-6 py-3 text-left text-vct-gray hover:text-vct-light hover:bg-vct-gray/10 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium">
                View Detailed Changes ({groupedChangesArray.length})
              </span>
              <span className="text-lg transform transition-transform {showDetails ? 'rotate-180' : ''}">
                {showDetails ? '▼' : '▶'}
              </span>
            </button>

            {showDetails && (
              <div className="px-6 pb-4">
                <div className="bg-vct-dark rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-vct-gray uppercase text-xs border-b border-vct-gray/20">
                        <th className="py-2 px-3">Agent</th>
                        <th className="py-2 px-3">Change</th>
                        <th className="py-2 px-3">Maps</th>
                        <th className="py-2 px-3">New Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedChangesArray.map((change) => (
                        <tr
                          key={`${change.agent}-${change.direction}-${change.toPosition}`}
                          className="border-b border-vct-gray/10"
                        >
                          <td className="py-2 px-3 text-vct-light font-medium">
                            {change.agent}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                change.direction === 'buff'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {change.direction === 'buff' ? '▲ Buff' : '▼ Nerf'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-vct-light">{change.maps.join(', ')}</td>
                          <td className="py-2 px-3 text-vct-gray">
                            {getRankText(change.toPosition)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
              isPreview
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-vct-red hover:bg-vct-red/80'
            }`}
          >
            {isPreview ? 'Got It' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
