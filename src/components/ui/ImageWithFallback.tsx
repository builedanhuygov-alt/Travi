import React, { useState } from 'react';
import { Compass } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
  fallbackColor?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Travel scene',
  fallbackTitle,
  fallbackColor = '#121C30',
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
        style={{
          background: `radial-gradient(circle at 50% 40%, ${fallbackColor}dd, #080D18)`,
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#3DDC97] mb-2 backdrop-blur-sm border border-white/10">
          <Compass className="h-6 w-6 animate-pulse" />
        </div>
        {fallbackTitle && (
          <span className="font-serif text-sm font-medium text-white/90 line-clamp-1">
            {fallbackTitle}
          </span>
        )}
        <span className="text-[11px] text-[#9BA9C3]/70 mt-0.5">
          Travi Cinematic Vista
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: fallbackColor }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
