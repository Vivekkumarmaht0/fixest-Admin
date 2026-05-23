import React from 'react';

/**
 * Base Skeleton Component
 * Provides the shimmer animation and basic styling.
 */
const Skeleton = ({ className = '', width, height, rounded = 'rounded-md', ...props }) => {
  const style = {
    width: width || '100%',
    height: height || '100%',
  };

  return (
    <div
      className={`relative overflow-hidden bg-surface-dim dark:bg-slate-700 ${rounded} ${className}`}
      style={style}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
    </div>
  );
};

export default Skeleton;
