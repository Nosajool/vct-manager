// QualificationModal - Multi-step modal showing qualification results
//
// Step 1: Shows player's region qualifiers
// Step 2: Shows all regions after simulating other Kickoffs (when user clicks "See All")

import { useState } from 'react';
import { useGameStore } from '../../store';
import { regionalSimulationService } from '../../services/RegionalSimulationService';
import type { QualificationRecord } from '../../store/slices/competitionSlice';
import type { Region, TournamentRegion } from '../../types';

export interface QualificationModalData {
  phase: 'kickoff' | 'stage1' | 'stage2';
  playerRegion: TournamentRegion;
  playerRegionQualifiers: QualificationRecord;
  allRegionsQualifiers: QualificationRecord[] | null;
}

interface QualificationModalProps {
  data: QualificationModalData;
  onClose: () => void;
}

// Map bracket type to display info
const BRACKET_DISPLAY = {
  alpha: { label: 'Alpha', sublabel: 'Undefeated', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  beta: { label: 'Beta', sublabel: '1 Loss', color: 'text-gray-300', bgColor: 'bg-gray-500/20' },
  omega: { label: 'Omega', sublabel: '2 Losses', color: 'text-amber-600', bgColor: 'bg-amber-600/20' },
};

export function QualificationModal({ data, onClose }: QualificationModalProps) {
  const [step, setStep] = useState<'player' | 'all'>('player');
  const [isSimulating, setIsSimulating] = useState(false);
  const [allQualifications, setAllQualifications] = useState<QualificationRecord[] | null>(
    data.allRegionsQualifiers
  );

  const closeModal = useGameStore((state) => state.closeModal);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const playerTeamId = useGameStore((state) => state.playerTeamId);

  // Handle simulating other regions
  const handleSeeAllQualifiers = async () => {
    setIsSimulating(true);

    // Small delay for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Simulate other regions' Kickoff tournaments
      const results = regionalSimulationService.simulateOtherKickoffs(
        data.playerRegion as Region
      );

      // Add player's region qualifiers to the list
      const allQuals = [data.playerRegionQualifiers, ...results];
      setAllQualifications(allQuals);
      setStep('all');
    } catch (error) {
      console.error('Failed to simulate other regions:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle creating Masters tournament and viewing it
  const handleViewMasters = () => {
    const masters = regionalSimulationService.createMastersTournament();
    if (masters) {
      closeModal();
      setActiveView('tournament');
    }
  };

  // Check if player's team qualified
  const playerQualified = data.playerRegionQualifiers.qualifiedTeams.some(
    (t) => t.teamId === playerTeamId
  );

  const playerTeamBracket = data.playerRegionQualifiers.qualifiedTeams.find(
    (t) => t.teamId === playerTeamId
  )?.bracket;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-vct-darker rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vct-gray/20">
          <h2 className="text-xl font-bold text-vct-light">
            {step === 'player'
              ? `VCT ${data.playerRegion} Kickoff 2026 - Complete!`
              : 'Masters Santiago - 12 Qualified Teams'}
          </h2>
          <p className="text-sm text-vct-gray mt-1">
            {step === 'player'
              ? 'Masters Santiago Qualifiers'
              : 'Teams from all 4 regions'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'player' ? (
            <PlayerRegionView
              qualifiers={data.playerRegionQualifiers}
              playerTeamId={playerTeamId}
              playerQualified={playerQualified}
              playerTeamBracket={playerTeamBracket}
            />
          ) : (
            <AllRegionsView
              qualifications={allQualifications || []}
              playerTeamId={playerTeamId}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20 flex justify-between items-center">
          {step === 'player' ? (
            <>
              <button
                onClick={handleSeeAllQualifiers}
                disabled={isSimulating}
                className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSimulating ? 'Simulating...' : 'See All Qualifiers'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('player')}
                className="px-4 py-2 bg-vct-gray/20 hover:bg-vct-gray/30 text-vct-light rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleViewMasters}
                className="px-6 py-2 bg-vct-red hover:bg-vct-red/80 text-white rounded-lg font-medium transition-colors"
              >
                View Masters Bracket
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Player's region qualification view
function PlayerRegionView({
  qualifiers,
  playerTeamId,
  playerQualified,
  playerTeamBracket,
}: {
  qualifiers: QualificationRecord;
  playerTeamId: string | null;
  playerQualified: boolean;
  playerTeamBracket?: 'alpha' | 'beta' | 'omega';
}) {
  return (
    <div className="space-y-4">
      {/* Player qualification status banner */}
      {playerTeamId && (
        <div
          className={`p-4 rounded-lg border ${
            playerQualified
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          {playerQualified ? (
            <div className="text-center">
              <p className="text-green-400 font-bold text-lg">
                Your Team Qualified!
              </p>
              <p className="text-green-300 text-sm">
                Advancing to Masters Santiago via{' '}
                <span className={BRACKET_DISPLAY[playerTeamBracket!].color}>
                  {BRACKET_DISPLAY[playerTeamBracket!].label} Bracket
                </span>{' '}
                ({BRACKET_DISPLAY[playerTeamBracket!].sublabel})
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-400 font-bold text-lg">
                Your Team Did Not Qualify
              </p>
              <p className="text-red-300 text-sm">
                Better luck next time! You can still watch Masters Santiago.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Qualifiers list */}
      <div className="space-y-3">
        {qualifiers.qualifiedTeams.map((team, index) => {
          const bracketInfo = BRACKET_DISPLAY[team.bracket];
          const isPlayerTeam = team.teamId === playerTeamId;

          return (
            <div
              key={team.teamId}
              className={`p-4 rounded-lg border ${
                isPlayerTeam
                  ? 'bg-vct-red/10 border-vct-red/30'
                  : 'bg-vct-dark border-vct-gray/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                  </span>
                  <div>
                    <p className={`font-bold ${isPlayerTeam ? 'text-vct-red' : 'text-vct-light'}`}>
                      {team.teamName}
                    </p>
                    <p className="text-sm text-vct-gray">
                      <span className={bracketInfo.color}>{bracketInfo.label}</span>
                      {' - '}
                      {bracketInfo.sublabel}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${bracketInfo.bgColor} ${bracketInfo.color}`}
                >
                  {bracketInfo.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// All regions qualification view
function AllRegionsView({
  qualifications,
  playerTeamId,
}: {
  qualifications: QualificationRecord[];
  playerTeamId: string | null;
}) {
  // Sort regions in a consistent order
  const regionOrder: Region[] = ['Americas', 'EMEA', 'Pacific', 'China'];
  const sortedQualifications = [...qualifications].sort((a, b) => {
    const aIndex = regionOrder.indexOf(a.region as Region);
    const bIndex = regionOrder.indexOf(b.region as Region);
    return aIndex - bIndex;
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      {sortedQualifications.map((qual) => (
        <div key={qual.tournamentId} className="bg-vct-dark rounded-lg p-4 border border-vct-gray/20">
          <h3 className="font-bold text-vct-light mb-3 pb-2 border-b border-vct-gray/20">
            {qual.region}
          </h3>
          <div className="space-y-2">
            {qual.qualifiedTeams.map((team) => {
              const bracketInfo = BRACKET_DISPLAY[team.bracket];
              const isPlayerTeam = team.teamId === playerTeamId;

              return (
                <div
                  key={team.teamId}
                  className={`flex items-center justify-between p-2 rounded ${
                    isPlayerTeam ? 'bg-vct-red/20' : 'bg-vct-darker'
                  }`}
                >
                  <span className={`text-sm ${isPlayerTeam ? 'text-vct-red font-bold' : 'text-vct-light'}`}>
                    {team.teamName}
                  </span>
                  <span className={`text-xs ${bracketInfo.color}`}>
                    {bracketInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
