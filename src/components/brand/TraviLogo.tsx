import React from 'react';

interface TraviLogoProps {
  variant?: 'full' | 'mini' | 'lockup' | 'wordmark-only';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const TraviLogo: React.FC<TraviLogoProps> = ({
  variant = 'lockup',
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const sizeMap = {
    xs: { icon: 24, text: 'text-lg', tag: 'text-[9px]' },
    sm: { icon: 32, text: 'text-xl', tag: 'text-[10px]' },
    md: { icon: 42, text: 'text-2xl', tag: 'text-xs' },
    lg: { icon: 56, text: 'text-3xl', tag: 'text-sm' },
    xl: { icon: 72, text: 'text-4xl', tag: 'text-base' },
  };

  const currentSize = sizeMap[size];

  // The mini icon (optimized for <= 32px or compact view)
  const renderMiniIcon = () => (
    <svg
      viewBox="0 0 200 200"
      width={currentSize.icon}
      height={currentSize.icon}
      className="flex-shrink-0 select-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
      role="img"
      aria-label="Travi Icon"
    >
      <rect x="8" y="8" width="192" height="192" rx="46" fill="#111111" />
      <rect x="3" y="3" width="188" height="188" rx="44" fill="#FFFFFF" stroke="#111111" strokeWidth="8" />
      <circle cx="96" cy="97" r="66" fill="#3DDC97" />
      <g transform="translate(112,84) rotate(45) scale(1.05)">
        <path
          d="M0,-50 C4,-50 6,-40 6,-30 L6,-12 L46,14 L46,24 L6,12 L6,30 L16,40 L16,46 L0,41 L-16,46 L-16,40 L-6,30 L-6,12 L-46,24 L-46,14 L-6,-12 L-6,-30 C-6,-40 -4,-50 0,-50 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="8"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );

  // The full icon (with 3 jet-wake trails and cyan sprouting leaf)
  const renderFullIcon = () => (
    <svg
      viewBox="0 0 200 200"
      width={currentSize.icon}
      height={currentSize.icon}
      className="flex-shrink-0 select-none drop-shadow-md transition-transform duration-300 hover:scale-105"
      role="img"
      aria-label="Travi Logo"
    >
      <defs>
        <clipPath id="trv-clip-react">
          <circle cx="96" cy="100" r="62" />
        </clipPath>
      </defs>
      {/* Hard Drop Shadow */}
      <rect x="8" y="8" width="192" height="192" rx="46" fill="#111111" />
      {/* White Base Tile */}
      <rect x="3" y="3" width="188" height="188" rx="44" fill="#FFFFFF" stroke="#111111" strokeWidth="6" />
      <g transform="translate(0,-3)">
        {/* Emerald Circle */}
        <circle cx="96" cy="100" r="62" fill="#3DDC97" />
        {/* Triple Jet Wake Trails */}
        <g clipPath="url(#trv-clip-react)" fill="none" stroke="#111111" strokeLinecap="round">
          <path d="M40,112 C62,134 92,128 98,110" strokeWidth="8" />
          <path d="M46,128 C68,146 100,140 110,122" strokeWidth="6" />
          <path d="M56,142 C76,154 104,150 116,136" strokeWidth="4" />
        </g>
        {/* Cyan Sprouting Leaf */}
        <g transform="translate(-6,-2)">
          <path
            d="M30,78 C28,42 54,24 82,28 C84,58 62,84 30,78 Z"
            fill="#48E3EF"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M34,76 C48,60 62,46 76,34" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        </g>
        {/* White Airplane */}
        <g transform="translate(118,76) rotate(45) scale(0.9)">
          <path
            d="M0,-50 C4,-50 6,-40 6,-30 L6,-12 L46,14 L46,24 L6,12 L6,30 L16,40 L16,46 L0,41 L-16,46 L-16,40 L-6,30 L-6,12 L-46,24 L-46,14 L-6,-12 L-6,-30 C-6,-40 -4,-50 0,-50 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );

  if (variant === 'mini') {
    return <div className={`inline-flex items-center ${className}`}>{renderMiniIcon()}</div>;
  }

  if (variant === 'full') {
    return <div className={`inline-flex items-center ${className}`}>{renderFullIcon()}</div>;
  }

  if (variant === 'wordmark-only') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-serif tracking-tight leading-none text-white font-medium ${currentSize.text}`}>
          Travi
        </span>
        {showTagline && (
          <span className={`text-[#9BA9C3] tracking-wide mt-1 font-light ${currentSize.tag}`}>
            Travel Beyond the Ordinary.
          </span>
        )}
      </div>
    );
  }

  // Lockup: Icon + Wordmark
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {size === 'xs' || size === 'sm' ? renderMiniIcon() : renderFullIcon()}
      <div className="flex flex-col">
        <span className={`font-serif tracking-tight leading-none text-white font-medium ${currentSize.text}`}>
          Travi
        </span>
        {showTagline && (
          <span className={`text-[#9BA9C3] tracking-normal mt-0.5 font-light ${currentSize.tag}`}>
            Travel Beyond the Ordinary.
          </span>
        )}
      </div>
    </div>
  );
};
