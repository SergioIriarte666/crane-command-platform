import { useState } from 'react';
import { Plus, FileUp, Download, LayoutGrid, List, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { QuickDateFilters, DateFilterType } from './QuickDateFilters';

interface CostStats {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  monthlyVariation: number;
}

interface CostsHeaderProps {
  stats: CostStats;
  search: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (value: DateFilterType) => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  onNewCost: () => void;
  onImportXml: () => void;
  onExport: () => void;
}

export function CostsHeader({
  stats,
  search,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  viewMode,
  onViewModeChange,
  onNewCost,
  onImportXml,
  onExport,
}: CostsHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const variationIsPositive = stats.monthlyVariation >= 0;

  return (
    <div className="space-y-4">
      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Costos Operativos</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona y controla los gastos de tu operación
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onImportXml}>
            <FileUp className="w-4 h-4 mr-2" />
            Cargar XML
          </Button>
          <Button onClick={onNewCost} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Costo
          </Button>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="flex items-center gap-4">
        <QuickDateFilters value={dateFilter} onChange={onDateFilterChange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Costos</p>
            <p className="text-2xl font-bold">{stats.totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Monto Total</p>
            <p className="text-2xl font-bold text-violet-600">
              {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="text-2xl font-bold">
              {formatCurrency(stats.averageAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Variación Mensual</p>
            <div className="flex items-center gap-1">
              <p className={`text-2xl font-bold ${variationIsPositive ? 'text-red-500' : 'text-green-500'}`}>
                {variationIsPositive ? '+' : ''}{stats.monthlyVariation.toFixed(1)}%
              </p>
              {variationIsPositive ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Buscar por descripción, categoría, grúa..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('table')}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('cards')}
              className="rounded-l-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
