import React from 'react';
import { Badge } from './Badge.tsx';

export interface PageHeaderProps {
  badge?: string;
  badgeVariant?: 'green' | 'cyan' | 'violet' | 'neutral';
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  badgeVariant = 'green',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`border-b border-[#243049]/60 pb-8 pt-4 sm:pt-6 mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          {badge && (
            <div className="mb-3">
              <Badge variant={badgeVariant} size="sm">
                {badge}
              </Badge>
            </div>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-sm sm:text-base text-[#9BA9C3] font-light leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && <div className="flex-shrink-0 pt-2 sm:pt-0">{action}</div>}
      </div>
    </div>
  );
};
