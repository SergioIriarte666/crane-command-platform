import { DollarSign, Users, Package, Fuel, Wrench, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceCostDetail, ServiceOperatorDetail } from '@/hooks/useEnhancedServiceDetails';
import { formatCLP } from '@/types/clients';

interface ServiceCostsSectionProps {
  costs: ServiceCostDetail[];
  operators: ServiceOperatorDetail[];
  totals: {
    subtotal: number;
    tax?: number;
    total?: number;
    totalCommissions: number;
    totalCosts: number;
    netMargin: number;
    marginPercentage: number;
  };
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  fuel: { label: 'Combustible', icon: Fuel, color: 'text-orange-600' },
  maintenance: { label: 'Mantenimiento', icon: Wrench, color: 'text-blue-600' },
  supplies: { label: 'Insumos', icon: Package, color: 'text-green-600' },
  labor: { label: 'Mano de Obra', icon: Users, color: 'text-purple-600' },
  other: { label: 'Otros', icon: AlertCircle, color: 'text-gray-600' },
};

export function ServiceCostsSection({ costs, operators, totals }: ServiceCostsSectionProps) {
  // Group costs by subcategory (since category_id is a UUID reference)
  const costsBySubcategory = costs.reduce((acc, cost) => {
    const category = cost.subcategory || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cost);
    return acc;
  }, {} as Record<string, ServiceCostDetail[]>);

  // Calculate totals per category
  const categoryTotals = Object.entries(costsBySubcategory).map(([category, items]) => ({
    category,
    total: items.reduce((sum, c) => sum + c.amount, 0),
    count: items.length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="text-lg font-bold">{formatCLP(totals.subtotal)}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-xs text-muted-foreground">Comisiones</p>
              <p className="text-lg font-bold text-orange-600">{formatCLP(totals.totalCommissions)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-muted-foreground">Costos</p>
              <p className="text-lg font-bold text-red-600">{formatCLP(totals.totalCosts)}</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${totals.netMargin >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <p className="text-xs text-muted-foreground">Margen Neto</p>
              <p className={`text-lg font-bold ${totals.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCLP(totals.netMargin)}
              </p>
              <p className="text-xs text-muted-foreground">
                ({totals.marginPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operator Commissions */}
      {operators.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Comisiones de Operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
            {operators.map((op) => {
              // Normalize role labels - handle both DB values (Principal/Auxiliar) and legacy (primary/assistant)
              const roleLabel = 
                op.role === 'primary' || op.role === 'Principal' ? 'Principal' :
                op.role === 'assistant' || op.role === 'Auxiliar' ? 'Auxiliar' :
                op.role === 'supervisor' || op.role === 'Supervisor' ? 'Supervisor' :
                op.role || 'Operador';
              
              return (
                <div key={op.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{op.operator?.full_name || 'Operador sin ficha'}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {roleLabel}
                      </Badge>
                      {op.operator?.employee_number && (
                        <span className="text-xs text-muted-foreground">
                          #{op.operator.employee_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-mono font-medium">{formatCLP(Number(op.commission) || 0)}</p>
                </div>
              );
            })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Costs by Category */}
      {costs.length > 0 ? (
        <>
          {/* Category Summary Grid */}
          {categoryTotals.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categoryTotals.map(({ category, total, count }) => {
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                const Icon = config.icon;
                return (
                  <Card key={category} className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm font-medium truncate">{category === 'other' ? config.label : category}</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{formatCLP(total)}</p>
                    <p className="text-xs text-muted-foreground">{count} item(s)</p>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Detailed Costs List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalle de Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costs.map((cost) => {
                  const config = CATEGORY_CONFIG[cost.subcategory || 'other'] || CATEGORY_CONFIG.other;
                  const Icon = config.icon;
                  return (
                    <div key={cost.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <div>
                          <p className="font-medium text-sm">{cost.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {cost.quantity} x {formatCLP(cost.unit_price)}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono font-medium">{formatCLP(cost.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay costos registrados para este servicio</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
