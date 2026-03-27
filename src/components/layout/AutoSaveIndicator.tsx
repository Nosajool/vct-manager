import { useGameStore } from '../../store';

export function AutoSaveIndicator() {
  const autoSaveStatus = useGameStore((state) => state.autoSaveStatus);

  if (autoSaveStatus === 'idle') return null;

  return (
    <div className="fixed bottom-28 right-4 z-[100] flex items-center gap-1.5 bg-vct-darker border border-vct-gray/30 rounded-full px-3 py-1.5 text-xs text-vct-gray shadow-lg">
      {autoSaveStatus === 'saving' ? (
        <>
          <span className="inline-block w-3 h-3 border border-vct-gray/60 border-t-vct-gray rounded-full animate-spin" />
          <span>Auto-saving...</span>
        </>
      ) : (
        <>
          <span className="text-green-500">✓</span>
          <span>Saved</span>
        </>
      )}
    </div>
  );
}
