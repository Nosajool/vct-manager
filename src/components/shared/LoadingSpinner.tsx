

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dots' | 'pulse';
  className?: string;
  text?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const TEXT_SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className = '',
  text
}: LoadingSpinnerProps) {
  const sizeClass = SIZE_CLASSES[size];
  const textSizeClass = TEXT_SIZE_CLASSES[size];

  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className={`${sizeClass} bg-vct-red rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
        <div className={`${sizeClass} bg-vct-red rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
        <div className={`${sizeClass} bg-vct-red rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
        {text && <span className={`ml-2 text-vct-light ${textSizeClass}`}>{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizeClass} bg-vct-red rounded-full animate-pulse`} />
        {text && <span className={`ml-2 text-vct-light ${textSizeClass}`}>{text}</span>}
      </div>
    );
  }

  // Default spinning variant
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClass} border-2 border-vct-gray/30 border-t-vct-red rounded-full animate-spin`}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && <span className={`ml-2 text-vct-light ${textSizeClass}`}>{text}</span>}
    </div>
  );
}

// Compact version for inline use
export function LoadingSpinnerCompact({ 
  size = 'sm',
  className = ''
}: Pick<LoadingSpinnerProps, 'size' | 'className'>) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div 
        className={`${sizeClass} border-2 border-vct-gray/30 border-t-vct-red rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

// Overlay version for modal/blocking states
interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  text = 'Loading...', 
  size = 'md',
  className = ''
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-vct-darker/80 flex items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={size} variant="default" />
        <p className="text-vct-light">{text}</p>
      </div>
    </div>
  );
}