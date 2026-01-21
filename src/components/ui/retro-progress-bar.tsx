import { cn } from '@/lib/utils';

interface RetroProgressBarProps {
  value: number;
  hasError?: boolean;
  className?: string;
}

export const RetroProgressBar = ({ value, hasError = false, className }: RetroProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const totalSegments = 20;
  const filledSegments = Math.floor((clampedValue / 100) * totalSegments);

  const getGradientColor = () => {
    if (hasError) return 'from-red-700 via-red-600 to-red-500';
    if (clampedValue <= 25) return 'from-red-600 via-red-500 to-red-400';
    if (clampedValue <= 50) return 'from-red-500 via-orange-500 to-orange-400';
    if (clampedValue <= 75) return 'from-orange-500 via-yellow-500 to-yellow-400';
    return 'from-yellow-500 via-lime-500 to-green-500';
  };

  return (
    <div className={cn(
      'relative p-1 bg-gray-950 rounded-sm border-2 border-cyan-500/70 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      className
    )}>
      <div className="flex gap-0.5 p-0.5">
        {Array.from({ length: totalSegments }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'flex-1 h-6 rounded-sm transition-all duration-150',
              index < filledSegments
                ? `bg-gradient-to-b ${getGradientColor()} shadow-[0_0_4px_rgba(255,255,255,0.3)]`
                : 'bg-gray-800/50'
            )}
          />
        ))}
      </div>
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] pointer-events-none" />
    </div>
  );
};
