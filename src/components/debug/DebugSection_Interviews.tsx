// Debug Section: Interviews
// Shows pending interview, drama boost, history, and template eligibility

import { useGameStore } from '../../store';
import { INTERVIEW_TEMPLATES } from '../../data/interviews';

export function DebugSection_Interviews() {
  const pendingInterview = useGameStore((s) => s.pendingInterview);
  const pendingDramaBoost = useGameStore((s) => s.pendingDramaBoost);
  const interviewHistory = useGameStore((s) => s.interviewHistory);
  const activeFlags = useGameStore((s) => s.activeFlags);

  // Check if a requiresActiveFlag matches any active flag (handles {playerId} wildcards)
  function checkFlagEligible(requiresActiveFlag: string | undefined): boolean {
    if (!requiresActiveFlag) return true;
    // Direct match
    if (activeFlags[requiresActiveFlag]) return true;
    // Wildcard: if flag contains {playerId}, check if any active flag starts with the prefix
    const prefix = requiresActiveFlag.replace(/\{[^}]+\}/g, '');
    if (prefix !== requiresActiveFlag) {
      return Object.keys(activeFlags).some((k) => k.startsWith(prefix));
    }
    return false;
  }

  const recentHistory = [...interviewHistory].reverse().slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Pending Interview */}
      <div>
        <div className="text-xs uppercase tracking-wider text-vct-gray/70 mb-2 font-semibold">Pending Interview</div>
        {pendingInterview ? (
          <div className="bg-vct-darker/60 border border-vct-gray/20 rounded p-3 space-y-1 text-sm">
            <div className="flex gap-3">
              <span className="text-vct-gray">Template:</span>
              <span className="font-mono text-white">{pendingInterview.templateId}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-vct-gray">Context:</span>
              <span className="text-blue-300">{pendingInterview.context}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-vct-gray">Subject:</span>
              <span className="text-white">{pendingInterview.subjectType}{pendingInterview.subjectId ? ` (${pendingInterview.subjectId})` : ''}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-vct-gray">Options:</span>
              <span className="text-white">{pendingInterview.options.map((o) => o.tone).join(', ')}</span>
            </div>
          </div>
        ) : (
          <div className="text-vct-gray text-sm italic">None.</div>
        )}
      </div>

      {/* Drama Boost */}
      <div>
        <div className="text-xs uppercase tracking-wider text-vct-gray/70 mb-2 font-semibold">Pending Drama Boost</div>
        <div className={`text-sm font-mono ${pendingDramaBoost > 0 ? 'text-orange-400' : 'text-vct-gray'}`}>
          {pendingDramaBoost}%
        </div>
      </div>

      {/* Interview History */}
      <div>
        <div className="text-xs uppercase tracking-wider text-vct-gray/70 mb-2 font-semibold">
          Recent History (last {recentHistory.length})
        </div>
        {recentHistory.length === 0 ? (
          <div className="text-vct-gray text-sm italic">No interviews completed yet.</div>
        ) : (
          <div className="space-y-2">
            {recentHistory.map((entry, i) => (
              <div key={i} className="bg-vct-darker/60 border border-vct-gray/20 rounded p-2 text-xs space-y-1">
                <div className="flex gap-3">
                  <span className="text-vct-gray">Date:</span>
                  <span className="text-white">{entry.date}</span>
                  <span className="text-vct-gray ml-2">Template:</span>
                  <span className="font-mono text-white">{entry.templateId}</span>
                  <span className="text-vct-gray ml-2">Tone:</span>
                  <span className="text-blue-300">{entry.chosenTone}</span>
                </div>
                {entry.effects.setsFlags && entry.effects.setsFlags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-vct-gray">Flags set:</span>
                    {entry.effects.setsFlags.map((f) => (
                      <span key={f.key} className="px-1 rounded bg-green-900/30 text-green-300 font-mono">{f.key}</span>
                    ))}
                  </div>
                )}
                {entry.effects.clearsFlags && entry.effects.clearsFlags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-vct-gray">Flags cleared:</span>
                    {entry.effects.clearsFlags.map((f) => (
                      <span key={f} className="px-1 rounded bg-red-900/30 text-red-300 font-mono">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Eligibility */}
      <div>
        <div className="text-xs uppercase tracking-wider text-vct-gray/70 mb-2 font-semibold">
          Template Eligibility ({INTERVIEW_TEMPLATES.length} templates)
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-vct-gray/60 text-left border-b border-vct-gray/20">
              <th className="pb-1 pr-3 font-normal">ID</th>
              <th className="pb-1 pr-3 font-normal">Context</th>
              <th className="pb-1 pr-3 font-normal">Requires Flag</th>
              <th className="pb-1 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {INTERVIEW_TEMPLATES.map((t) => {
              const flagEligible = checkFlagEligible(t.requiresActiveFlag);
              return (
                <tr key={t.id} className="border-b border-vct-gray/10">
                  <td className="py-1 pr-3 font-mono text-white">{t.id}</td>
                  <td className="py-1 pr-3 text-blue-300">{t.context}</td>
                  <td className="py-1 pr-3 font-mono text-vct-gray/70">{t.requiresActiveFlag ?? '—'}</td>
                  <td className="py-1">
                    {t.requiresActiveFlag ? (
                      flagEligible
                        ? <span className="px-1.5 py-0.5 rounded bg-green-900/40 text-green-300 text-[10px]">PASS</span>
                        : <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-[10px]">FAIL</span>
                    ) : (
                      <span className="text-vct-gray/40 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
