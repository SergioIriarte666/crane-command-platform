import React from 'react';
import { Check, Calendar, ListChecks, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClosureFormStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  hasError: boolean;
}

interface ClosureFormStepNavigationProps {
  steps: ClosureFormStep[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export const ClosureFormStepNavigation = ({
  steps,
  currentStep,
  onStepClick,
}: ClosureFormStepNavigationProps) => {
  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isPast = step.id < currentStep;
        const isClickable = true; // Navegación libre entre todos los pasos

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
              isActive && "bg-violet-500/10 border border-violet-500/30",
              isPast && !isActive && "bg-muted/50",
              !isActive && !isPast && "hover:bg-muted/30",
              step.hasError && "border-destructive/50 bg-destructive/5"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                isActive && "bg-violet-600 text-white",
                step.isCompleted && !isActive && "bg-violet-500 text-white",
                step.hasError && "bg-destructive text-destructive-foreground",
                !isActive && !step.isCompleted && !step.hasError && "bg-muted text-muted-foreground"
              )}
            >
              {step.isCompleted && !step.hasError ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                isActive && "text-violet-700 dark:text-violet-300",
                step.hasError && "text-destructive"
              )}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {step.description}
              </p>
            </div>

            <div className={cn(
              "flex-shrink-0 text-muted-foreground",
              isActive && "text-violet-600 dark:text-violet-400"
            )}>
              {step.icon}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const getClosureFormSteps = (): Omit<ClosureFormStep, 'isCompleted' | 'hasError'>[] => [
  {
    id: 1,
    title: 'Período',
    description: 'Rango de fechas',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: 2,
    title: 'Cliente y Servicios',
    description: 'Seleccionar servicios',
    icon: <ListChecks className="h-4 w-4" />,
  },
  {
    id: 3,
    title: 'Detalles',
    description: 'OC y estado',
    icon: <FileText className="h-4 w-4" />,
  },
];
