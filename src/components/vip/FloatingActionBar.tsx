import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, X } from 'lucide-react';
import { VIP_PIPELINE_STATUSES, getStatusConfig } from '@/types/vipPipeline';

interface FloatingActionBarProps {
  selectedCount: number;
  onStatusChange: (status: string) => void;
  onOpenBatchModal: () => void;
  onClearSelection: () => void;
}

export function FloatingActionBar({ 
  selectedCount, 
  onStatusChange, 
  onOpenBatchModal,
  onClearSelection 
}: FloatingActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border rounded-xl shadow-lg p-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClearSelection}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="h-6 w-px bg-border" />
      
      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-44 h-9">
          <SelectValue placeholder="Cambiar estado..." />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          {VIP_PIPELINE_STATUSES.map(status => (
            <SelectItem key={status.id} value={status.id}>
              <div className="flex items-center gap-2">
                <Badge className={`${status.bgColor} ${status.textColor} border-0 text-xs`}>
                  {status.title}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button onClick={onOpenBatchModal} variant="default" size="sm" className="gap-2">
        <FileText className="w-4 h-4" />
        Asignar COT/OC
      </Button>
    </div>
  );
}
