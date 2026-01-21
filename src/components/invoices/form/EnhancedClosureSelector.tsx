import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, FileText, Calendar, User, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Closure {
  id: string;
  folio: string;
  client_id: string;
  period_start: string;
  period_end: string;
  total: number | null;
  client?: { id: string; name: string } | null;
}

interface EnhancedClosureSelectorProps {
  closures: Closure[];
  selectedClosureId: string;
  onClosureChange: (closureId: string) => void;
  isEditing?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}

export const EnhancedClosureSelector: React.FC<EnhancedClosureSelectorProps> = ({
  closures,
  selectedClosureId,
  onClosureChange,
  isEditing = false,
  disabled = false,
  isLoading = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedClosure = useMemo(() => 
    closures.find(c => c.id === selectedClosureId), 
    [closures, selectedClosureId]
  );

  const filteredClosures = useMemo(() => {
    if (!searchTerm) return closures.slice(0, 50);
    
    const lowerSearch = searchTerm.toLowerCase();
    return closures
      .filter(c => 
        c.folio.toLowerCase().includes(lowerSearch) || 
        c.client?.name.toLowerCase().includes(lowerSearch) ||
        (c.total?.toString() || '').includes(lowerSearch)
      )
      .slice(0, 50);
  }, [closures, searchTerm]);

  const formatDateRange = (start: string, end: string) => {
    const fromDate = format(new Date(start), 'dd/MM/yyyy', { locale: es });
    const toDate = format(new Date(end), 'dd/MM/yyyy', { locale: es });
    return `${fromDate} - ${toDate}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Cierre *</Label>
        <div className="bg-muted rounded-lg px-3 py-4 animate-pulse">Cargando cierres...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        Cierre *
        {isEditing && (
          <span className="text-xs text-violet-600 ml-2">
            (Modo edición - incluye cierres facturados)
          </span>
        )}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open} 
            disabled={disabled}
            className="w-full justify-between min-h-[60px] p-3"
          >
            {selectedClosure ? (
              <div className="flex flex-col items-start text-left w-full">
                <div className="flex items-center gap-2 text-violet-600 font-medium">
                  <FileText className="w-4 h-4" />
                  {selectedClosure.folio}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDateRange(selectedClosure.period_start, selectedClosure.period_end)} • 
                  {selectedClosure.client?.name || 'Sin cliente'} • 
                  {formatCurrency(selectedClosure.total || 0)}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Seleccionar cierre...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Buscar por folio, cliente o fecha..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[350px]">
              <CommandEmpty>No se encontraron cierres disponibles.</CommandEmpty>
              <CommandGroup>
                {filteredClosures.map(closure => (
                  <CommandItem
                    key={closure.id}
                    value={`${closure.folio} ${closure.client?.name || ''}`}
                    onSelect={() => {
                      onClosureChange(closure.id);
                      setOpen(false);
                    }}
                    className="p-0 cursor-pointer"
                  >
                    <div className="flex items-start justify-between w-full p-3 hover:bg-muted rounded-md">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-500" />
                          <span className="font-medium">{closure.folio}</span>
                          {selectedClosureId === closure.id && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateRange(closure.period_start, closure.period_end)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{closure.client?.name || 'Sin cliente asignado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-3 h-3 text-violet-600" />
                          <span className="font-medium text-violet-600">
                            {formatCurrency(closure.total || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {disabled && (
        <p className="text-xs text-amber-600 mt-1">
          No se puede cambiar el cierre para facturas ya emitidas
        </p>
      )}

      {closures.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground mt-1">
          No hay cierres disponibles para facturar. Primero debes cerrar contablemente un cierre aprobado.
        </p>
      )}
    </div>
  );
};
