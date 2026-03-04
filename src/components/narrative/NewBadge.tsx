// NewBadge - "NEW" ribbon shown on first-time narrative encounters

interface NewBadgeProps {
  className?: string;
}

export function NewBadge({ className = '' }: NewBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        bg-amber-400 text-black
        text-xs font-bold rounded
        leading-none select-none
        ${className}
      `}
    >
      NEW
    </span>
  );
}
