/**
 * @component LoadingSpinner
 * @description A reusable loading spinner component that can be customized for size and color.
 * Used to indicate loading states throughout the application.
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className 
}) => {
  // Size mappings
  const sizeClasses = {
    xs: 'h-3 w-3 border',
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  // Color mappings
  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full", 
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner; 