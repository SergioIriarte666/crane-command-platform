import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { VIP_PIPELINE_STATUSES, getStatusConfig } from '@/types/vipPipeline';

interface QuickStatusSelectProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export function QuickStatusSelect({ currentStatus, onStatusChange, disabled }: QuickStatusSelectProps) {
  const config = getStatusConfig(currentStatus);
  
  return (
    <Select 
      value={currentStatus} 
      onValueChange={onStatusChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className="h-7 w-[130px] border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Badge className={`${config.bgColor} ${config.textColor} border-0 cursor-pointer`}>
          {config.title}
        </Badge>
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
  );
}
