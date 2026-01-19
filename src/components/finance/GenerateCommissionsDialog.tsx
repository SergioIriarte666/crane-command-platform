import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useOperators } from '@/hooks/useOperators';
import { useCommissions } from '@/hooks/useCommissions';
import { Badge } from '@/components/ui/badge';

const commissionSchema = z.object({
  operator_id: z.string().min(1, 'Selecciona un operador'),
  period_start: z.date(),
  period_end: z.date(),
});

type CommissionFormData = z.infer<typeof commissionSchema>;

interface GenerateCommissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateCommissionsDialog({ open, onOpenChange }: GenerateCommissionsDialogProps) {
  const { operators } = useOperators();
  const { generateCommission } = useCommissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  const lastMonth = subMonths(new Date(), 1);

  const form = useForm<CommissionFormData>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      period_start: startOfMonth(lastMonth),
      period_end: endOfMonth(lastMonth),
    },
  });

  const activeOperators = operators.filter(op => op.is_active && op.status === 'active');

  const onSubmit = async (data: CommissionFormData) => {
    setIsSubmitting(true);
    try {
      await generateCommission.mutateAsync({
        operatorId: data.operator_id,
        periodStart: format(data.period_start, 'yyyy-MM-dd'),
        periodEnd: format(data.period_end, 'yyyy-MM-dd'),
      });
      form.reset({
        period_start: startOfMonth(lastMonth),
        period_end: endOfMonth(lastMonth),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateForAll = async () => {
    const periodStart = form.getValues('period_start');
    const periodEnd = form.getValues('period_end');

    setGeneratingAll(true);
    try {
      for (const operator of activeOperators) {
        await generateCommission.mutateAsync({
          operatorId: operator.id,
          periodStart: format(periodStart, 'yyyy-MM-dd'),
          periodEnd: format(periodEnd, 'yyyy-MM-dd'),
        });
      }
      form.reset({
        period_start: startOfMonth(lastMonth),
        period_end: endOfMonth(lastMonth),
      });
      onOpenChange(false);
    } finally {
      setGeneratingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar Comisiones</DialogTitle>
          <DialogDescription>Calcula las comisiones para un operador o para todos</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inicio del Período</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fin del Período</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="operator_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un operador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeOperators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          <div className="flex items-center gap-2">
                            <span>{operator.employee_number}</span>
                            <span>-</span>
                            <span>{operator.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {operator.commission_type === 'percentage' 
                                ? `${operator.commission_percentage}%` 
                                : operator.commission_type === 'fixed'
                                ? `$${operator.commission_fixed_amount}`
                                : 'Mixto'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona un operador o genera para todos a la vez
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={generateForAll}
                disabled={generatingAll || activeOperators.length === 0}
              >
                {generatingAll && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Users className="w-4 h-4 mr-2" />
                Generar Todos ({activeOperators.length})
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
