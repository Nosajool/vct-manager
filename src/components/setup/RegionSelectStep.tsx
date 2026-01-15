// RegionSelectStep - Step 1: Select VCT region

import type { Region } from '../../types';

interface RegionSelectStepProps {
  onSelect: (region: Region) => void;
  onCancel: () => void;
}

const REGION_INFO: Record<Region, { flag: string; description: string }> = {
  Americas: { flag: '🌎', description: 'NA, Brazil, and LATAM teams compete for continental glory' },
  EMEA: { flag: '🌍', description: 'Europe, Middle East, and Africa unite in fierce competition' },
  Pacific: { flag: '🌏', description: 'Korea, Japan, SEA, and Oceania battle for supremacy' },
  China: { flag: '🇨🇳', description: 'The awakening dragon of competitive Valorant' },
};

const REGIONS: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];

export function RegionSelectStep({ onSelect, onCancel }: RegionSelectStepProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-vct-light mb-2">Choose Your Region</h2>
        <p className="text-vct-gray">
          Select the VCT region where you'll manage your team
        </p>
      </div>

      {/* Region Cards */}
      <div className="grid grid-cols-2 gap-4">
        {REGIONS.map((region) => {
          const info = REGION_INFO[region];
          return (
            <button
              key={region}
              onClick={() => onSelect(region)}
              className="group bg-vct-dark border border-vct-gray/30 rounded-lg p-6
                         hover:border-vct-red/50 hover:bg-vct-dark/80
                         transition-all duration-200 text-left"
            >
              <div className="text-4xl mb-3">{info.flag}</div>
              <h3 className="text-lg font-bold text-vct-light group-hover:text-vct-red transition-colors">
                {region}
              </h3>
              <p className="text-sm text-vct-gray mt-1">12 Teams</p>
              <p className="text-sm text-vct-gray/70 mt-2 line-clamp-2">
                {info.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Cancel Button */}
      <div className="flex justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-vct-gray hover:text-vct-light transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
