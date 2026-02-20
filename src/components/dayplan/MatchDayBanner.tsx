// MatchDayBanner - Displays match day info banner with pre-match narrative context
//
// Extracted from DayScheduleCard. Shows home vs away team names
// for both scheduled matches and placeholder matches.
// Also displays pressure level, emotional intensity, and crowd expectation
// derived from the player team's reputation and rivalry data.

import { useGameStore } from '../../store';

interface MatchDayBannerProps {
  homeTeamName: string;
  awayTeamName: string;
  isPlaceholder?: boolean;
}

export function MatchDayBanner({
  homeTeamName,
  awayTeamName,
  isPlaceholder = false
}: MatchDayBannerProps) {
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const getTopRivalries = useGameStore((state) => state.getTopRivalries);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;
  const topRivalry = getTopRivalries(1)[0] ?? null;

  const hype = playerTeam?.reputation.hypeLevel ?? 0;
  const fanbase = playerTeam?.reputation.fanbase ?? 0;
  const rivalryIntensity = topRivalry?.intensity ?? 0;

  // Pressure Level: based on hype
  const pressureLevel =
    hype >= 70 ? { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10' } :
    hype >= 40 ? { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10' } :
                 { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10' };

  // Emotional Intensity: based on rivalry
  const emotionalIntensity =
    rivalryIntensity >= 60 ? { label: 'Fierce', color: 'text-orange-400', bg: 'bg-orange-500/10' } :
    rivalryIntensity >= 30 ? { label: 'Elevated', color: 'text-yellow-400', bg: 'bg-yellow-500/10' } :
                              { label: 'Calm', color: 'text-blue-400', bg: 'bg-blue-500/10' };

  // Crowd Expectation: from hype + fanbase
  const crowdExpectation =
    hype > 70 && fanbase > 60 ? { label: 'Packed Arena', color: 'text-purple-400', bg: 'bg-purple-500/10' } :
    hype > 40 || fanbase > 40  ? { label: 'Good Crowd', color: 'text-cyan-400', bg: 'bg-cyan-500/10' } :
                                  { label: 'Quiet Venue', color: 'text-vct-gray', bg: 'bg-vct-gray/10' };

  const showNarrative = !isPlaceholder && playerTeam !== null;

  return (
    <div className="mb-3 p-2 rounded bg-vct-red/10 border border-vct-red/20">
      <p className="text-xs font-medium text-vct-red mb-1">
        {isPlaceholder ? '⚔️ Placeholder Match' : '⚔️ Match Day'}
      </p>
      <p className="text-xs text-vct-gray mb-2">
        {homeTeamName} vs {awayTeamName}
      </p>

      {showNarrative && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-vct-red/10">
          <NarrativePill label="Pressure" value={pressureLevel.label} color={pressureLevel.color} bg={pressureLevel.bg} />
          <NarrativePill label="Intensity" value={emotionalIntensity.label} color={emotionalIntensity.color} bg={emotionalIntensity.bg} />
          <NarrativePill label="Crowd" value={crowdExpectation.label} color={crowdExpectation.color} bg={crowdExpectation.bg} />
        </div>
      )}
    </div>
  );
}

function NarrativePill({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${bg}`}>
      <span className="text-vct-gray/60">{label}:</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </span>
  );
}
