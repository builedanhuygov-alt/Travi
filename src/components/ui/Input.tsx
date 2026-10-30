import React, { forwardRef } from 'react';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, onClear, showClearButton, value, className = '', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#9BA9C3]">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          value={value}
          className={`w-full rounded-xl bg-[#121C30] border border-[#243049] text-white placeholder-[#9BA9C3]/60 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:border-[#3DDC97] focus:ring-1 focus:ring-[#3DDC97] ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${rightIcon || (showClearButton && value) ? 'pr-10' : 'pr-4'} ${className}`}
          {...props}
        />

        {showClearButton && value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 p-1 rounded-md text-[#9BA9C3] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Clear text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {!showClearButton && rightIcon && (
          <div className="absolute right-3.5 flex items-center pointer-events-none text-[#9BA9C3]">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
