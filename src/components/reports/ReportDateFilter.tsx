import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from '@/hooks/useReports';

export type ExportFormat = 'csv' | 'pdf' | 'excel';

interface ReportDateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExport?: (format: ExportFormat) => void;
  exportLabel?: string;
  showFormatSelector?: boolean;
}

const presets = [
  { label: 'Hoy', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Últimos 7 días', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 días', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Mes anterior', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Últimos 3 meses', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: new Date() }) },
  { label: 'Este año', getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];

export function ReportDateFilter({ 
  dateRange, 
  onDateRangeChange, 
  onExport, 
  exportLabel = 'Exportar',
  showFormatSelector = true 
}: ReportDateFilterProps) {
  const [preset, setPreset] = useState('Este mes');

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const selectedPreset = presets.find(p => p.label === value);
    if (selectedPreset) {
      onDateRangeChange(selectedPreset.getValue());
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn('justify-start text-left font-normal')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(dateRange.from, 'dd MMM', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange({ from: range.from, to: range.to });
                setPreset('');
              }
            }}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>

      {onExport && showFormatSelector && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {exportLabel}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('csv')}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('excel')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onExport && !showFormatSelector && (
        <Button variant="outline" onClick={() => onExport('csv')}>
          <Download className="w-4 h-4 mr-2" />
          {exportLabel}
        </Button>
      )}
    </div>
  );
}
