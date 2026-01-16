import { Check, AlertCircle, FileText, DollarSign, Link, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CostFormStep } from '@/types/costForm';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  DollarSign,
  Link,
  StickyNote,
};

interface CostFormStepNavigationProps {
  steps: CostFormStep[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
}

export function CostFormStepNavigation({ steps, currentStep, onStepClick }: CostFormStepNavigationProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <nav className="space-y-1">
      {steps.map((step, index) => {
        const Icon = ICONS[step.icon] || FileText;
        const isActive = step.id === currentStep;
        const isPast = index < currentIndex;
        const isClickable = isPast || step.isCompleted || index === currentIndex + 1;

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all',
              isActive && 'bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700',
              isPast && !isActive && 'opacity-80',
              !isActive && !isPast && 'hover:bg-muted/50',
              !isClickable && 'cursor-not-allowed opacity-50'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                isActive && 'bg-violet-600 text-white',
                step.hasError && 'bg-red-500 text-white',
                step.isCompleted && !isActive && !step.hasError && 'bg-green-500 text-white',
                !isActive && !step.isCompleted && !step.hasError && 'bg-muted text-muted-foreground'
              )}
            >
              {step.hasError ? (
                <AlertCircle className="w-4 h-4" />
              ) : step.isCompleted && !isActive ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium truncate',
                  isActive && 'text-violet-700 dark:text-violet-300',
                  step.hasError && 'text-red-600 dark:text-red-400'
                )}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">{step.description}</p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
