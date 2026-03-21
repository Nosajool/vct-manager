// FirstVisitHint - Dismissible one-time hint banner for first page visits

interface FirstVisitHintProps {
  message: string;
  onDismiss: () => void;
}

export function FirstVisitHint({ message, onDismiss }: FirstVisitHintProps) {
  return (
    <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/25 rounded-lg px-4 py-3">
      <span className="text-blue-400 mt-0.5 flex-shrink-0">ℹ</span>
      <p className="text-sm text-vct-gray flex-1 leading-relaxed">{message}</p>
      <button
        onClick={onDismiss}
        className="text-vct-gray/50 hover:text-vct-gray transition-colors flex-shrink-0 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
