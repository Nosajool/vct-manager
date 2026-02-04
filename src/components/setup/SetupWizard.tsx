// SetupWizard - Main setup flow container for new game initialization

import { useState } from 'react';
import type { Region } from '../../types';
import { RegionSelectStep } from './RegionSelectStep';
import { TeamSelectStep } from './TeamSelectStep';
import { DifficultySelectStep, type Difficulty } from './DifficultySelectStep';

export interface SetupOptions {
  region: Region;
  teamName: string;
  difficulty: Difficulty;
}

interface SetupWizardProps {
  onComplete: (options: SetupOptions) => void;
  onCancel?: () => void;
}

type Step = 1 | 2 | 3;

interface SetupState {
  step: Step;
  region: Region | null;
  teamName: string | null;
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [state, setState] = useState<SetupState>({
    step: 1,
    region: null,
    teamName: null,
  });

  // Step 1: Region selected
  const handleRegionSelect = (region: Region) => {
    setState((prev) => ({ ...prev, region, step: 2 }));
  };

  // Step 2: Team selected
  const handleTeamSelect = (teamName: string) => {
    setState((prev) => ({ ...prev, teamName, step: 3 }));
  };

  // Step 3: Difficulty selected
  const handleDifficultySelect = (difficulty: Difficulty) => {
    if (state.region && state.teamName) {
      onComplete({
        region: state.region,
        teamName: state.teamName,
        difficulty,
      });
    }
  };

  // Navigation
  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      step: (prev.step - 1) as Step,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Progress Indicator */}
        <div className="p-6 border-b border-vct-gray/20">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${state.step >= stepNum
                      ? 'bg-vct-red text-white'
                      : 'bg-vct-dark text-vct-gray border border-vct-gray/30'
                    }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      state.step > stepNum ? 'bg-vct-red' : 'bg-vct-gray/30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-vct-gray">
            <span className={state.step >= 1 ? 'text-vct-light' : ''}>Region</span>
            <span className={state.step >= 2 ? 'text-vct-light' : ''}>Team</span>
            <span className={state.step >= 3 ? 'text-vct-light' : ''}>Difficulty</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {state.step === 1 && (
            <RegionSelectStep
              onSelect={handleRegionSelect}
              onCancel={onCancel}
            />
          )}

          {state.step === 2 && state.region && (
            <TeamSelectStep
              region={state.region}
              onSelect={handleTeamSelect}
              onBack={handleBack}
              onCancel={onCancel}
            />
          )}

          {state.step === 3 && state.region && state.teamName && (
            <DifficultySelectStep
              region={state.region}
              teamName={state.teamName}
              onSelect={handleDifficultySelect}
              onBack={handleBack}
              onCancel={onCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
