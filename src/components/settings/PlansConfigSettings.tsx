import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Zap, Crown, Star, Rocket, Pencil, Check } from 'lucide-react';
import { usePlanConfigs, PlanConfig } from '@/hooks/usePlanConfigs';
import { PlanConfigDialog } from './PlanConfigDialog';

const PLAN_ICONS: Record<string, React.ElementType> = {
  Shield,
  Zap,
  Crown,
  Star,
  Rocket,
};

const PLAN_COLORS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

function PlanConfigCard({ 
  plan, 
  onEdit 
}: { 
  plan: PlanConfig; 
  onEdit: () => void;
}) {
  const Icon = PLAN_ICONS[plan.icon] || Shield;
  const colorClass = PLAN_COLORS[plan.color] || PLAN_COLORS.slate;

  const formatLimit = (value: number | null) => {
    return value === null ? '∞' : value.toString();
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.price}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Limits */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">Grúas:</span>
              <span className="font-medium">{formatLimit(plan.max_cranes)}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">Usuarios:</span>
              <span className="font-medium">{formatLimit(plan.max_users)}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">Operadores:</span>
              <span className="font-medium">{formatLimit(plan.max_operators)}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded">
              <span className="text-muted-foreground">Clientes:</span>
              <span className="font-medium">{formatLimit(plan.max_clients)}</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Características ({plan.features?.length || 0})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {plan.features?.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="truncate">{feature.feature_text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlansConfigSettings() {
  const { data: plans, isLoading, error } = usePlanConfigs();
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEditPlan = (plan: PlanConfig) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuración de Planes</h2>
          <p className="text-muted-foreground">
            Administra los planes y sus características
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar los planes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración de Planes</h2>
        <p className="text-muted-foreground">
          Administra los precios, límites y características de cada plan
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans?.map((plan) => (
          <PlanConfigCard
            key={plan.id}
            plan={plan}
            onEdit={() => handleEditPlan(plan)}
          />
        ))}
      </div>

      <PlanConfigDialog
        plan={selectedPlan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
