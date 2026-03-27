// CoachObservationsPanel - Inline coach-voice hints on Today page
//
// Shows narrative observations and actionable alerts about current team state.
// Actionable hints include a navigation link. Only renders when there's something worth saying.

import { useGameStore } from '../../store';
import { generateCoachHints, type CoachHint } from '../../utils/coachNarrative';
import { GameImage } from '../shared/GameImage';
import { getPlayerImageUrl } from '../../utils/imageAssets';
import { useMatchDay } from '../../hooks';

export function CoachObservationsPanel() {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);
  const rivalries = useGameStore((state) => state.rivalries);
  const calendar = useGameStore((state) => state.calendar);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const setTeamTab = useGameStore((state) => state.setTeamTab);
  const { opponent, isMatchDay } = useMatchDay();

  if (!playerTeamId) return null;

  const team = teams[playerTeamId];
  if (!team) return null;

  const rosterPlayers = team.playerIds
    .map((id) => players[id])
    .filter((p): p is NonNullable<typeof p> => !!p);

  const upcomingOpponentName = opponent?.name ?? null;
  const rivalry = opponent ? rivalries[opponent.id] : null;
  const rivalryIntensity = rivalry?.intensity ?? null;

  const hints = generateCoachHints(
    team,
    rosterPlayers,
    calendar.currentDate,
    upcomingOpponentName,
    rivalryIntensity,
    isMatchDay,
  ).slice(0, 5);

  if (hints.length === 0) return null;

  const handleAction = (hint: CoachHint) => {
    if (!hint.action) return;
    if (hint.action.teamTab) {
      setTeamTab(hint.action.teamTab);
    }
    setActiveView(hint.action.navigateTo);
  };

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-xs font-semibold text-vct-gray/60 uppercase tracking-wider mb-3">
        Coach's Read
      </h3>
      <div className="space-y-2">
        {hints.map((hint, i) => (
          <HintLine key={i} hint={hint} onAction={() => handleAction(hint)} />
        ))}
      </div>
    </div>
  );
}

function HintLine({ hint, onAction }: { hint: CoachHint; onAction: () => void }) {
  const colorClass =
    hint.severity === 'warning'
      ? 'text-yellow-400/90'
      : hint.severity === 'positive'
      ? 'text-green-400/90'
      : 'text-vct-gray/80';

  const dotClass =
    hint.severity === 'warning'
      ? 'bg-yellow-500/60'
      : hint.severity === 'positive'
      ? 'bg-green-500/60'
      : 'bg-vct-gray/40';

  return (
    <div className="flex items-start gap-2.5">
      {hint.playerName ? (
        <GameImage
          src={getPlayerImageUrl(hint.playerName)}
          alt={hint.playerName}
          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug italic ${colorClass}`}>{hint.text}</p>
      </div>
      {hint.action && (
        <button
          onClick={onAction}
          className="text-xs text-vct-gray/50 hover:text-vct-light transition-colors shrink-0 mt-0.5"
        >
          {hint.action.label} →
        </button>
      )}
    </div>
  );
}
