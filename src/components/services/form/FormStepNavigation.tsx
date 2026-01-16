import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isCompleted: boolean;
  hasError: boolean;
}

interface FormStepNavigationProps {
  steps: FormStep[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
}

export function FormStepNavigation({ steps, currentStep, onStepClick }: FormStepNavigationProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isPast = index < currentIndex;
        const isClickable = isPast || isActive || steps[index - 1]?.isCompleted;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
              isActive && "bg-primary/10 border-2 border-primary",
              isPast && step.isCompleted && "bg-green-50 dark:bg-green-950/20",
              step.hasError && "bg-red-50 dark:bg-red-950/20 border-red-300",
              isClickable && !isActive && "cursor-pointer hover:bg-muted",
              !isClickable && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Step indicator */}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5",
              isActive && "bg-primary text-primary-foreground",
              isPast && step.isCompleted && "bg-green-500 text-white",
              step.hasError && "bg-red-500 text-white",
              !isActive && !isPast && !step.hasError && "bg-muted text-muted-foreground"
            )}>
              {step.hasError ? (
                <AlertCircle className="w-4 h-4" />
              ) : isPast && step.isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </div>
            
            {/* Step content */}
            <div className="min-w-0 flex-1">
              <p className={cn(
                "font-medium text-sm",
                isActive && "text-primary",
                step.hasError && "text-red-600 dark:text-red-400"
              )}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {step.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
