// TeamBriefingModal - Post-kickoff-interview Day 1 briefing
// Shown once after the Kickoff interview to orient the new player

import { useGameStore } from '../../store';
import { timeProgression } from '../../engine/calendar';
import type { Player } from '../../types';

interface TeamBriefingModalProps {
  onClose: () => void;
}

function getOverall(player: Player): number {
  const s = player.stats;
  return Math.round(
    (s.mechanics + s.igl + s.mental + s.clutch + s.vibes + s.lurking + s.entry + s.support + s.stamina) / 9
  );
}

export function TeamBriefingModal({ onClose }: TeamBriefingModalProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);
  const getNextMatchEvent = useGameStore((state) => state.getNextMatchEvent);
  const setOnboardingHasSeenBriefing = useGameStore((state) => state.setOnboardingHasSeenBriefing);

  const team = playerTeamId ? teams[playerTeamId] : null;
  if (!team) return null;

  const rosterPlayers = team.playerIds
    .map((id) => players[id])
    .filter(Boolean) as Player[];

  const nextMatch = getNextMatchEvent();
  const nextMatchDate = nextMatch
    ? timeProgression.formatDate(nextMatch.date)
    : 'Coming soon';

  const handleClose = () => {
    setOnboardingHasSeenBriefing();
    onClose();
  };

  const reputationTier = (() => {
    const f = team.reputation.fanbase;
    if (f <= 20) return 'Underground';
    if (f <= 40) return 'Rising';
    if (f <= 60) return 'Established';
    if (f <= 80) return 'Popular';
    return 'Iconic';
  })();

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-vct-darker border border-vct-gray/20 rounded-lg max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-vct-gray/20 bg-gradient-to-r from-vct-red/10 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-vct-red">Analyst Briefing</span>
            <span className="text-xs text-vct-gray/40">Day 1</span>
          </div>
          <h2 className="text-xl font-bold text-vct-light">Welcome to {team.name}</h2>
          <p className="text-sm text-vct-gray mt-1">
            {team.region} • {reputationTier} reputation
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Briefing text */}
          <p className="text-sm text-vct-gray leading-relaxed">
            You've just been handed the keys. The <span className="text-vct-light font-medium">2026 VCT Kickoff</span> is underway.
            Your first match is on <span className="text-vct-light font-medium">{nextMatchDate}</span>. Get familiar with your squad.
          </p>

          {/* Roster */}
          {rosterPlayers.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-vct-gray mb-2">Your Roster</p>
              <div className="space-y-1.5">
                {rosterPlayers.map((p) => {
                  const overall = getOverall(p);
                  const isIGL = team.iglPlayerId === p.id;
                  return (
                    <div key={p.id} className="flex items-center justify-between py-1.5 px-3 bg-vct-dark/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-vct-light font-medium">{p.name}</span>
                        {isIGL && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">IGL</span>
                        )}
                      </div>
                      <span className={`text-sm font-mono font-bold ${
                        overall >= 75 ? 'text-green-400' : overall >= 60 ? 'text-yellow-400' : 'text-vct-gray'
                      }`}>
                        {overall}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day 1 actions */}
          <div className="border-t border-vct-gray/20 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-vct-gray mb-3">Before you advance Day 1</p>
            <div className="space-y-2">
              {[
                { num: '1', text: 'Review your roster — check contracts and player stats' },
                { num: '2', text: 'Look at your tournament bracket — know when your first match is' },
                { num: '3', text: 'Hit Advance Day to start the season' },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-vct-red/20 text-vct-red text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.num}
                  </span>
                  <span className="text-sm text-vct-gray">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vct-gray/20">
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-vct-red hover:bg-vct-red/80 text-white font-bold rounded-lg transition-colors"
          >
            Let's get to work
          </button>
        </div>
      </div>
    </div>
  );
}
