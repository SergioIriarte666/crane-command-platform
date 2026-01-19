import React from 'react';
import { Check, Settings, Calendar, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InvoiceFormStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  hasError: boolean;
}

interface InvoiceFormStepNavigationProps {
  steps: InvoiceFormStep[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export const InvoiceFormStepNavigation = ({
  steps,
  currentStep,
  onStepClick,
}: InvoiceFormStepNavigationProps) => {
  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isPast = step.id < currentStep;
        const isClickable = step.id <= currentStep || step.isCompleted;

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
              step.hasError && "border-destructive/50 bg-destructive/5",
              !isClickable && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              isActive && "bg-violet-600 text-white",
              step.isCompleted && !isActive && "bg-violet-500 text-white",
              step.hasError && "bg-destructive text-destructive-foreground",
              !isActive && !step.isCompleted && !step.hasError && "bg-muted text-muted-foreground"
            )}>
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

export const getInvoiceFormSteps = (): Omit<InvoiceFormStep, 'isCompleted' | 'hasError'>[] => [
  {
    id: 1,
    title: 'Selección de Cierre',
    description: 'Cierre a facturar',
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    id: 2,
    title: 'Fechas y Condiciones',
    description: 'Emisión, vencimiento y pago',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: 3,
    title: 'Estado y Configuración',
    description: 'Estado y número fiscal',
    icon: <Settings className="h-4 w-4" />,
  },
];
