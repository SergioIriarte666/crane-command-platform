import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { FileText, Users, Truck, UserCog, Loader2 } from 'lucide-react';

const categoryConfig = {
  service: {
    icon: FileText,
    label: 'Servicios',
    color: 'text-blue-500',
  },
  client: {
    icon: Users,
    label: 'Clientes',
    color: 'text-green-500',
  },
  crane: {
    icon: Truck,
    label: 'Grúas',
    color: 'text-orange-500',
  },
  operator: {
    icon: UserCog,
    label: 'Operadores',
    color: 'text-purple-500',
  },
};

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { results, isLoading, hasResults } = useGlobalSearch(query);

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    navigate(result.url);
  };

  const renderResultItem = (result: SearchResult) => {
    const config = categoryConfig[result.type];
    const Icon = config.icon;

    return (
      <CommandItem
        key={`${result.type}-${result.id}`}
        value={`${result.title} ${result.subtitle}`}
        onSelect={() => handleSelect(result)}
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
      >
        <div className={`flex-shrink-0 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm truncate">{result.title}</span>
          {result.subtitle && (
            <span className="text-xs text-muted-foreground truncate">
              {result.subtitle}
            </span>
          )}
        </div>
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar servicios, clientes, grúas, operadores..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No se encontraron resultados para "{query}"</CommandEmpty>
        )}

        {!isLoading && query.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Escribe al menos 2 caracteres para buscar...
          </div>
        )}

        {!isLoading && hasResults && (
          <>
            {results.services.length > 0 && (
              <CommandGroup heading="Servicios">
                {results.services.map(renderResultItem)}
              </CommandGroup>
            )}

            {results.clients.length > 0 && (
              <CommandGroup heading="Clientes">
                {results.clients.map(renderResultItem)}
              </CommandGroup>
            )}

            {results.cranes.length > 0 && (
              <CommandGroup heading="Grúas">
                {results.cranes.map(renderResultItem)}
              </CommandGroup>
            )}

            {results.operators.length > 0 && (
              <CommandGroup heading="Operadores">
                {results.operators.map(renderResultItem)}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
