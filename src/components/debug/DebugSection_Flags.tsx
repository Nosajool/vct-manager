// Debug Section: Active Flags
// Shows all active drama flags with set/expiry dates and search filter

import { useState } from 'react';
import { useGameStore } from '../../store';

export function DebugSection_Flags() {
  const [filter, setFilter] = useState('');

  const activeFlags = useGameStore((s) => s.activeFlags);
  const currentDate = useGameStore((s) => s.calendar.currentDate);

  const allEntries = Object.entries(activeFlags);
  const filtered = filter
    ? allEntries.filter(([key]) => key.toLowerCase().includes(filter.toLowerCase()))
    : allEntries;

  // Group by prefix (up to first `_` segment used as category)
  const grouped = filtered.reduce<Record<string, [string, { setDate: string; expiresDate?: string }][]>>(
    (acc, [key, data]) => {
      const prefix = key.split('_')[0] ?? 'other';
      if (!acc[prefix]) acc[prefix] = [];
      acc[prefix].push([key, data]);
      return acc;
    },
    {}
  );

  const today = currentDate ? new Date(currentDate) : new Date();

  function daysRemaining(expiresDate?: string): string {
    if (!expiresDate) return 'never';
    const exp = new Date(expiresDate);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'expired';
    return `${diff}d`;
  }

  // A flag is "player-specific" if the last underscore-segment looks like an ID (long hex or uuid-like)
  function isPlayerSpecific(key: string): boolean {
    const parts = key.split('_');
    const last = parts[parts.length - 1];
    return last !== undefined && last.length > 8;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search flags..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-vct-darker border border-vct-gray/30 rounded px-3 py-1.5 text-sm text-white w-64 focus:outline-none focus:border-vct-gray/60"
        />
        <span className="text-vct-gray text-sm">{allEntries.length} total flags</span>
      </div>

      {filtered.length === 0 && (
        <div className="text-vct-gray text-sm italic">No flags active{filter ? ' matching filter' : ''}.</div>
      )}

      {Object.entries(grouped).map(([prefix, entries]) => (
        <div key={prefix}>
          <div className="text-xs uppercase tracking-wider text-vct-gray/70 mb-1 font-semibold">{prefix}</div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vct-gray/60 text-left border-b border-vct-gray/20">
                <th className="pb-1 pr-4 font-normal">Flag</th>
                <th className="pb-1 pr-4 font-normal">Set</th>
                <th className="pb-1 pr-4 font-normal">Expires</th>
                <th className="pb-1 font-normal">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, data]) => {
                const remaining = daysRemaining(data.expiresDate);
                const expired = remaining === 'expired';
                const playerSpecific = isPlayerSpecific(key);
                return (
                  <tr key={key} className={`border-b border-vct-gray/10 ${expired ? 'opacity-40' : ''}`}>
                    <td className="py-1 pr-4 font-mono">
                      <span className={playerSpecific ? 'text-purple-300' : 'text-white'}>{key}</span>
                      {playerSpecific && (
                        <span className="ml-1 px-1 rounded bg-purple-900/40 text-purple-400 text-[10px]">player</span>
                      )}
                    </td>
                    <td className="py-1 pr-4 text-vct-gray">{data.setDate}</td>
                    <td className="py-1 pr-4 text-vct-gray">{data.expiresDate ?? '—'}</td>
                    <td className={`py-1 ${expired ? 'text-red-400' : remaining === 'never' ? 'text-vct-gray' : 'text-green-400'}`}>
                      {remaining}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
