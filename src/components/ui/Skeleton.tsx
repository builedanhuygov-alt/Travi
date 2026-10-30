import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'card' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'travi-skeleton rounded-xl',
    circular: 'travi-skeleton rounded-full',
    text: 'travi-skeleton h-4 rounded-md',
    card: 'travi-skeleton aspect-[16/10] w-full rounded-2xl',
  };

  return (
    <div
      aria-hidden="true"
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};

export const DestinationCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col rounded-2xl border border-[#243049]/70 bg-[#0E1626]/80 p-3.5 space-y-3 travi-glass-panel">
      <Skeleton variant="card" className="aspect-[16/10] w-full" />
      <div className="space-y-2 pt-1">
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-1/2 h-3.5" />
        <div className="pt-2 flex items-center justify-between">
          <Skeleton variant="text" className="w-1/4 h-3" />
          <Skeleton variant="text" className="w-1/3 h-6 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
