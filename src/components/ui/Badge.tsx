import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'cyan' | 'violet' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    green: 'bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30',
    cyan: 'bg-[#48E3EF]/15 text-[#48E3EF] border border-[#48E3EF]/30',
    violet: 'bg-[#9875FF]/15 text-[#9875FF] border border-[#9875FF]/30',
    neutral: 'bg-[#121C30] text-[#9BA9C3] border border-[#243049]',
    outline: 'bg-transparent text-white/80 border border-white/20',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
