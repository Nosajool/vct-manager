// Debug Section: Drama Events
// Shows active events, history, cooldowns, and last event per category

import { useState } from 'react';
import { useGameStore } from '../../store';

function Collapsible({ title, children, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-vct-gray/20 rounded">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-white hover:bg-white/5"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <span className="text-vct-gray">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'text-yellow-400',
  major: 'text-red-400',
};

export function DebugSection_DramaEvents() {
  const activeEvents = useGameStore((s) => s.activeEvents);
  const eventHistory = useGameStore((s) => s.eventHistory);
  const cooldowns = useGameStore((s) => s.cooldowns);
  const lastEventByCategory = useGameStore((s) => s.lastEventByCategory);
  const currentDate = useGameStore((s) => s.calendar.currentDate);

  const today = currentDate ? new Date(currentDate) : new Date();

  function daysUntil(dateStr: string): string {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'expired';
    return `+${diff}d`;
  }

  const recentHistory = [...eventHistory].reverse().slice(0, 15);

  return (
    <div className="space-y-3">
      <Collapsible title={`Active Events (${activeEvents.length})`}>
        {activeEvents.length === 0 ? (
          <div className="text-vct-gray text-xs italic py-1">None.</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vct-gray/60 text-left border-b border-vct-gray/20">
                <th className="pb-1 pr-3 font-normal">ID</th>
                <th className="pb-1 pr-3 font-normal">Template</th>
                <th className="pb-1 pr-3 font-normal">Category</th>
                <th className="pb-1 pr-3 font-normal">Severity</th>
                <th className="pb-1 pr-3 font-normal">Status</th>
                <th className="pb-1 font-normal">Triggered</th>
              </tr>
            </thead>
            <tbody>
              {activeEvents.map((ev) => (
                <tr key={ev.id} className="border-b border-vct-gray/10">
                  <td className="py-1 pr-3 font-mono text-vct-gray">{ev.id.slice(0, 8)}</td>
                  <td className="py-1 pr-3 font-mono text-white">{ev.templateId}</td>
                  <td className="py-1 pr-3 text-blue-300">{ev.category}</td>
                  <td className={`py-1 pr-3 ${SEVERITY_COLORS[ev.severity] ?? 'text-white'}`}>{ev.severity}</td>
                  <td className="py-1 pr-3 text-yellow-300">{ev.status}</td>
                  <td className="py-1 text-vct-gray">{ev.triggeredDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Collapsible>

      <Collapsible title={`Recent History (last ${recentHistory.length})`} defaultOpen={false}>
        {recentHistory.length === 0 ? (
          <div className="text-vct-gray text-xs italic py-1">No history yet.</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vct-gray/60 text-left border-b border-vct-gray/20">
                <th className="pb-1 pr-3 font-normal">Template</th>
                <th className="pb-1 pr-3 font-normal">Severity</th>
                <th className="pb-1 pr-3 font-normal">Resolved</th>
                <th className="pb-1 font-normal">Choice</th>
              </tr>
            </thead>
            <tbody>
              {recentHistory.map((ev) => (
                <tr key={ev.id} className="border-b border-vct-gray/10">
                  <td className="py-1 pr-3 font-mono text-white">{ev.templateId}</td>
                  <td className={`py-1 pr-3 ${SEVERITY_COLORS[ev.severity] ?? 'text-white'}`}>{ev.severity}</td>
                  <td className="py-1 pr-3 text-vct-gray">{ev.resolvedDate ?? '—'}</td>
                  <td className="py-1 text-vct-gray font-mono">{ev.chosenOptionId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Collapsible>

      <Collapsible title={`Category Cooldowns (${Object.keys(cooldowns).length})`} defaultOpen={false}>
        {Object.keys(cooldowns).length === 0 ? (
          <div className="text-vct-gray text-xs italic py-1">No cooldowns.</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vct-gray/60 text-left border-b border-vct-gray/20">
                <th className="pb-1 pr-3 font-normal">Category</th>
                <th className="pb-1 pr-3 font-normal">Last Fired</th>
                <th className="pb-1 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cooldowns).map(([cat, lastFired]) => {
                const status = lastFired ? daysUntil(lastFired) : '—';
                const expired = status === 'expired';
                return (
                  <tr key={cat} className={`border-b border-vct-gray/10 ${expired ? 'opacity-40' : ''}`}>
                    <td className="py-1 pr-3 font-mono text-white">{cat}</td>
                    <td className="py-1 pr-3 text-vct-gray">{lastFired ?? '—'}</td>
                    <td className={`py-1 ${expired ? 'text-vct-gray' : 'text-orange-400'}`}>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Collapsible>

      <Collapsible title="Last Event Per Category" defaultOpen={false}>
        {Object.keys(lastEventByCategory).length === 0 ? (
          <div className="text-vct-gray text-xs italic py-1">None.</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vct-gray/60 text-left border-b border-vct-gray/20">
                <th className="pb-1 pr-3 font-normal">Category</th>
                <th className="pb-1 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(lastEventByCategory).map(([cat, date]) => (
                <tr key={cat} className="border-b border-vct-gray/10">
                  <td className="py-1 pr-3 font-mono text-white">{cat}</td>
                  <td className="py-1 text-vct-gray">{date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Collapsible>
    </div>
  );
}
