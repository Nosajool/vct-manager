// TeamSelectStep - Step 2: Select team within chosen region

import type { Region } from '../../types';
import { VCT_TEAMS } from '../../utils/constants';
import { GameImage } from '../shared/GameImage';
import { getTeamLogoUrl } from '../../utils/imageAssets';

interface TeamSelectStepProps {
  region: Region;
  onSelect: (teamName: string) => void;
  onBack: () => void;
  onCancel?: () => void;
}

function getPrestigeStars(orgValue: number): number {
  if (orgValue >= 4500000) return 5;
  if (orgValue >= 4000000) return 4;
  if (orgValue >= 3000000) return 3;
  if (orgValue >= 2500000) return 2;
  return 1;
}

function formatOrgValue(value: number): string {
  return `$${(value / 1000000).toFixed(1)}M`;
}

export function TeamSelectStep({ region, onSelect, onBack, onCancel }: TeamSelectStepProps) {
  const teams = VCT_TEAMS[region];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-vct-light mb-2">Select Your Team</h2>
        <p className="text-vct-gray">
          Choose a team to manage in the <span className="text-vct-red">{region}</span> region
        </p>
      </div>

      {/* Team List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {teams.map((team) => {
          const stars = getPrestigeStars(team.orgValue);
          return (
            <button
              key={team.name}
              onClick={() => onSelect(team.name)}
              className="w-full group bg-vct-dark border border-vct-gray/30 rounded-lg p-4
                         hover:border-vct-red/50 hover:bg-vct-dark/80
                         transition-all duration-200 text-left flex items-center gap-4"
            >
              {/* Team Logo */}
              <GameImage
                src={getTeamLogoUrl(team.name)}
                alt={`${team.name} logo`}
                className="w-12 h-12 rounded-lg flex-shrink-0"
              />

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-vct-light group-hover:text-vct-red transition-colors truncate">
                    {team.name}
                  </h3>
                </div>
                <p className="text-xs text-vct-gray/80 italic mt-0.5 truncate">
                  "{team.expectation}"
                </p>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-yellow-400">
                    {'★'.repeat(stars)}
                    <span className="text-vct-gray/30">{'★'.repeat(5 - stars)}</span>
                  </span>
                  <span className="text-vct-gray">
                    {formatOrgValue(team.orgValue)}
                  </span>
                  <span title="Pressure">
                    {'🔥'.repeat(team.pressure)}
                  </span>
                </div>
              </div>

              {/* Fanbase */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-vct-gray">Fanbase</p>
                <p className={`font-bold ${
                  team.fanbase >= 85 ? 'text-green-400' :
                  team.fanbase >= 70 ? 'text-yellow-400' :
                  'text-vct-gray'
                }`}>
                  {team.fanbase}
                </p>
              </div>
            </button>
          );
        })}
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
