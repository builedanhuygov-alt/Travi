import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'flat' | 'glass';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const variantStyles = {
    default:
      'bg-[#121C30] border border-[#243049] text-[#F4F7FF] shadow-lg shadow-black/20',
    interactive:
      'bg-[#121C30] border border-[#243049] text-[#F4F7FF] hover:border-[#3DDC97]/40 hover:bg-[#15223B] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#3DDC97]/5 cursor-pointer shadow-md shadow-black/25',
    flat:
      'bg-[#0E1626] border border-[#192338] text-[#F4F7FF]',
    glass:
      'bg-[#121C30]/70 border border-white/10 text-white backdrop-blur-md shadow-xl shadow-black/30',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
