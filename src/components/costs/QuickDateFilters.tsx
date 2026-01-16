import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { startOfDay, startOfWeek, startOfMonth, format } from 'date-fns';

export type DateFilterType = 'today' | 'week' | 'month' | 'all';

interface QuickDateFiltersProps {
  value: DateFilterType;
  onChange: (value: DateFilterType) => void;
}

export function QuickDateFilters({ value, onChange }: QuickDateFiltersProps) {
  const filters: { id: DateFilterType; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'all', label: 'Todos' },
  ];

  return (
    <div className="flex gap-1">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={value === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(filter.id)}
          className={cn(
            'text-xs',
            value === filter.id && 'bg-violet-600 hover:bg-violet-700'
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

export function getDateRangeFromFilter(filter: DateFilterType): { start: string | null; end: string | null } {
  const now = new Date();
  const today = format(startOfDay(now), 'yyyy-MM-dd');

  switch (filter) {
    case 'today':
      return { start: today, end: today };
    case 'week':
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: today };
    case 'month':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: today };
    case 'all':
    default:
      return { start: null, end: null };
  }
}
