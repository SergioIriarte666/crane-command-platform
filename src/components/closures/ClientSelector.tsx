import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';

interface ClientSelectorProps {
  clientId: string;
  onClientChange: (clientId: string) => void;
}

const ClientSelector = ({ clientId, onClientChange }: ClientSelectorProps) => {
  const { clients } = useClients();

  const handleValueChange = (value: string) => {
    // Convertir "all" de vuelta a string vacío
    onClientChange(value === "all" ? "" : value);
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground">Cliente (Opcional)</Label>
      <Select value={clientId || "all"} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Todos los clientes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Todos los clientes
          </SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex flex-col py-0.5">
                <span className="font-medium">{client.name}</span>
                {client.trade_name && client.trade_name !== client.name && (
                  <span className="text-xs text-violet-600 dark:text-violet-400">
                    {client.trade_name}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientSelector;
