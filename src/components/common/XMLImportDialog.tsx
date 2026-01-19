import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface XMLImportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: T[];
  fileName: string;
  columns: Column[];
  onImport: (selectedItems: T[]) => Promise<void>;
  title?: string;
  description?: string;
  checkDuplicate?: (item: T) => boolean;
}

export function XMLImportDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  data,
  fileName,
  columns,
  onImport,
  title = 'Importar desde XML',
  description = 'Selecciona los registros que deseas importar',
  checkDuplicate,
}: XMLImportDialogProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  // Reset selection when data changes
  useEffect(() => {
    const initialSelected = new Set<number>();
    data.forEach((item, index) => {
      if (!checkDuplicate?.(item)) {
        initialSelected.add(index);
      }
    });
    setSelectedIds(initialSelected);
  }, [data, checkDuplicate]);

  const handleToggle = (index: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const selectedItems = data.filter((_, index) => selectedIds.has(index));
    if (selectedItems.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(selectedItems);
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const formatValue = (item: T, column: Column): string => {
    const value = item[column.key];
    if (column.format) {
      return column.format(value);
    }
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('es-CL');
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
            <Badge variant="secondary" className="ml-2">{fileName}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedIds.size === data.length && data.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Seleccionar todos ({selectedIds.size} de {data.length})
              </span>
            </div>
            {data.some((item) => checkDuplicate?.(item)) && (
              <Badge variant="outline" className="text-amber-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Posibles duplicados detectados
              </Badge>
            )}
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-2 space-y-1">
              {data.map((item, index) => {
                const isDuplicate = checkDuplicate?.(item);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      selectedIds.has(index) 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-background hover:bg-muted/50",
                      isDuplicate && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.has(index)}
                      onCheckedChange={() => handleToggle(index)}
                    />
                    
                    <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                      {columns.slice(0, 3).map(column => (
                        <div key={column.key}>
                          <p className="text-xs text-muted-foreground">{column.label}</p>
                          <p className="font-medium truncate">{formatValue(item, column)}</p>
                        </div>
                      ))}
                    </div>

                    {isDuplicate ? (
                      <Badge variant="outline" className="text-amber-600 shrink-0">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Duplicado
                      </Badge>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedIds.size === 0 || isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Importar {selectedIds.size} registro{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
