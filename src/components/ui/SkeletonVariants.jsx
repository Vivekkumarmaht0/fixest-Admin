import React from 'react';
import Skeleton from './Skeleton';

export const SkeletonText = ({ lines = 1, className = '', lastLineShort = true }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          className={
            lastLineShort && i === lines - 1 && lines > 1
              ? 'w-2/3'
              : 'w-full'
          }
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({ size = '3rem', className = '' }) => {
  return <Skeleton rounded="rounded-full" width={size} height={size} className={className} />;
};

export const SkeletonButton = ({ className = '' }) => {
  return <Skeleton height="2.5rem" rounded="rounded-lg" className={`w-32 ${className}`} />;
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`p-4 border border-outline-variant/30 dark:border-slate-800 rounded-xl bg-surface-container-lowest dark:bg-slate-900 shadow-sm ${className}`}>
      <SkeletonAvatar size="3rem" className="mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonServiceCard = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 p-6 ${className}`}>
      <Skeleton className="mb-4 w-12 h-12" rounded="rounded-xl" />
      <SkeletonText lines={1} className="mb-2 w-3/4 h-6" />
      <SkeletonText lines={2} className="w-full text-sm" />
      <div className="mt-6 flex justify-between items-center">
        <Skeleton width="4rem" height="1.5rem" />
        <Skeleton width="2rem" height="2rem" rounded="rounded-full" />
      </div>
    </div>
  );
};

export const SkeletonBookingCard = ({ className = '' }) => {
  return (
    <div className={`p-6 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/30 dark:border-slate-800 flex flex-col md:flex-row gap-6 ${className}`}>
      <Skeleton className="w-full md:w-32 h-32" rounded="rounded-xl" />
      <div className="flex-1 space-y-4">
        <div className="flex justify-between">
          <SkeletonText lines={1} className="w-1/2 h-6" />
          <Skeleton width="4rem" height="1.5rem" rounded="rounded-full" />
        </div>
        <SkeletonText lines={2} />
        <div className="flex gap-4 pt-2">
          <SkeletonButton className="w-24 h-8" />
          <SkeletonButton className="w-24 h-8" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTechnicianCard = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-outline-variant/30 dark:border-slate-800 bg-surface-container-lowest dark:bg-slate-900 ${className}`}>
      <SkeletonAvatar size="4rem" />
      <div className="flex-1 space-y-2">
        <SkeletonText lines={1} className="w-2/3 h-5" />
        <SkeletonText lines={1} className="w-1/2 h-4" />
      </div>
      <Skeleton width="3rem" height="1.5rem" rounded="rounded-full" />
    </div>
  );
};

export const SkeletonDashboardStats = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-surface-container-lowest dark:bg-slate-900 rounded-xl border border-outline-variant/30 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <Skeleton width="6rem" height="1rem" />
            <Skeleton width="2.5rem" height="2.5rem" rounded="rounded-lg" />
          </div>
          <Skeleton width="50%" height="2.5rem" className="mb-2" />
          <Skeleton width="30%" height="1rem" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonNavbar = ({ className = '' }) => {
  return (
    <nav className={`flex items-center justify-between p-4 border-b border-outline-variant/30 dark:border-slate-800 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md ${className}`}>
      <Skeleton width="8rem" height="2rem" />
      <div className="hidden md:flex gap-6">
        <Skeleton width="4rem" height="1rem" />
        <Skeleton width="4rem" height="1rem" />
        <Skeleton width="4rem" height="1rem" />
      </div>
      <div className="flex gap-3">
        <SkeletonButton className="w-20 hidden md:block" />
        <SkeletonAvatar size="2.5rem" />
      </div>
    </nav>
  );
};

export const SkeletonHero = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center px-4 ${className}`}>
      <Skeleton width="12rem" height="2rem" rounded="rounded-full" className="mb-6" />
      <Skeleton width="80%" height="4rem" className="max-w-3xl mb-6" />
      <Skeleton width="60%" height="1.5rem" className="max-w-2xl mb-10" />
      <div className="flex gap-4">
        <SkeletonButton className="w-40 h-12 rounded-full" />
        <SkeletonButton className="w-40 h-12 rounded-full" />
      </div>
    </div>
  );
};

export const SkeletonForm = ({ fields = 3, className = '' }) => {
  return (
    <div className={`space-y-6 max-w-md w-full ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="30%" height="1rem" />
          <Skeleton width="100%" height="3rem" rounded="rounded-lg" />
        </div>
      ))}
      <SkeletonButton className="w-full h-12 mt-4" />
    </div>
  );
};

export const SkeletonOrderTimeline = ({ count = 4, className = '' }) => {
  return (
    <div className={`space-y-8 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton width="1.5rem" height="1.5rem" rounded="rounded-full" className="z-10 bg-surface" />
            {i !== count - 1 && <Skeleton width="2px" height="4rem" className="my-1" />}
          </div>
          <div className="flex-1 pb-8">
            <SkeletonText lines={1} className="w-1/3 h-5 mb-2" />
            <SkeletonText lines={1} className="w-1/2 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonReviewCard = ({ className = '' }) => {
  return (
    <div className={`p-6 rounded-2xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="3rem" />
        <div>
          <SkeletonText lines={1} className="w-24 h-4 mb-1" />
          <SkeletonText lines={1} className="w-16 h-3" />
        </div>
      </div>
      <Skeleton width="6rem" height="1rem" /> {/* Stars placeholder */}
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonTrackingUI = ({ className = '' }) => {
  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${className}`}>
      {/* Map placeholder */}
      <Skeleton width="100%" height="16rem" rounded="rounded-2xl" />
      
      {/* Status Bar */}
      <div className="p-6 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/30 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonText lines={1} className="w-1/3 h-6" />
          <Skeleton width="5rem" height="2rem" rounded="rounded-full" />
        </div>
        <Skeleton width="100%" height="0.5rem" rounded="rounded-full" className="my-4" />
      </div>

      {/* Technician Info */}
      <SkeletonTechnicianCard />
      
      {/* Timeline */}
      <div className="p-6 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/30 dark:border-slate-800">
        <SkeletonOrderTimeline />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-slate-900 shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 border-b border-outline-variant/30 bg-surface-container/50">
                <Skeleton height="1rem" className="w-2/3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-low/50">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <Skeleton height="1.25rem" className="w-full max-w-[80%]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
