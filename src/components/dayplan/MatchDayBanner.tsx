// MatchDayBanner - Displays match day info banner
//
// Extracted from DayScheduleCard. Shows home vs away team names
// for both scheduled matches and placeholder matches.

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
  return (
    <div className="mb-3 p-2 rounded bg-vct-red/10 border border-vct-red/20">
      <p className="text-xs font-medium text-vct-red mb-1">
        {isPlaceholder ? '⚔️ Placeholder Match' : '⚔️ Match Day'}
      </p>
      <p className="text-xs text-vct-gray">
        {homeTeamName} vs {awayTeamName}
      </p>
    </div>
  );
}
