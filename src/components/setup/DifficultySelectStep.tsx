// DifficultySelectStep - Step 3: Select game difficulty

import type { Region } from '../../types';

export type Difficulty = 'easy' | 'normal' | 'hard';

interface DifficultySelectStepProps {
  region: Region;
  teamName: string;
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
  onCancel?: () => void;
}

interface DifficultyOption {
  id: Difficulty;
  name: string;
  multiplier: string;
  description: string;
  color: string;
  recommended?: boolean;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'easy',
    name: 'Easy',
    multiplier: '1.5x',
    description: 'Extra starting budget. Recommended for your first playthrough.',
    color: 'text-green-400 border-green-500/50 hover:border-green-500',
    recommended: true,
  },
  {
    id: 'normal',
    name: 'Normal',
    multiplier: '1.0x',
    description: 'Standard VCT experience with balanced finances.',
    color: 'text-yellow-400 border-yellow-500/50 hover:border-yellow-500',
  },
  {
    id: 'hard',
    name: 'Hard',
    multiplier: '0.7x',
    description: 'Tight budget. Every decision matters.',
    color: 'text-red-400 border-red-500/50 hover:border-red-500',
  },
];

export function DifficultySelectStep({
  region,
  teamName,
  onSelect,
  onBack,
  onCancel,
}: DifficultySelectStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-vct-light mb-2">Select Difficulty</h2>
        <p className="text-vct-gray">
          Managing <span className="text-vct-red font-medium">{teamName}</span> in{' '}
          <span className="text-vct-light">{region}</span>
        </p>
      </div>

      {/* Difficulty Options */}
      <div className="space-y-3">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.id}
            onClick={() => onSelect(diff.id)}
            className={`w-full bg-vct-dark border rounded-lg p-5
                       transition-all duration-200 text-left group ${diff.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-lg ${diff.color.split(' ')[0]}`}>
                    {diff.name}
                  </h3>
                  {diff.recommended && (
                    <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-vct-gray text-sm mt-1">
                  {diff.description}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xs text-vct-gray">Budget</p>
                <p className={`font-bold ${diff.color.split(' ')[0]}`}>
                  {diff.multiplier}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-vct-dark/50 border border-vct-gray/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-vct-gray uppercase tracking-wide mb-3">
          Your Selection
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-vct-gray">Region</p>
            <p className="text-vct-light font-medium">{region}</p>
          </div>
          <div>
            <p className="text-vct-gray">Team</p>
            <p className="text-vct-light font-medium">{teamName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-vct-dark border border-vct-gray/30 text-vct-light
                     font-medium rounded hover:bg-vct-gray/20 transition-colors"
        >
          ← Back
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 text-vct-gray hover:text-vct-light transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
