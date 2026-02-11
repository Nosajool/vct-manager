import { useState } from 'react';

interface GameImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Reusable image component with fallback handling for missing images.
 * Shows a styled placeholder with the first letter if the image fails to load.
 */
export function GameImage({ src, alt, className = '', fallbackClassName = '' }: GameImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    const firstLetter = alt.charAt(0).toUpperCase();
    return (
      <div
        className={`bg-vct-darker rounded-lg flex items-center justify-center
                    border border-vct-gray/20 ${fallbackClassName || className}`}
        title={alt}
      >
        <span className="text-xl font-bold text-vct-gray">
          {firstLetter}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
