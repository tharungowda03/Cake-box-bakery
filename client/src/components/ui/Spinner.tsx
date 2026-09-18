import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }[size];

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeMap} rounded-full border-amber-700 border-t-transparent animate-spin`}
      />
    </div>
  );
};
