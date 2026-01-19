import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Crown, 
  Shield, 
  Zap, 
  Truck, 
  Users, 
  UserCog, 
  Building2,
  ArrowUpCircle,
  Check,
  Sparkles,
  Star,
  Rocket
} from 'lucide-react';
import { useTenant } from '@/hooks/useSettings';
import { 
  usePlanUsage, 
  getProgressColor,
  getProgressPercentage,
  formatLimit 
} from '@/hooks/usePlanLimits';
import { usePlanConfigs, PlanConfig } from '@/hooks/usePlanConfigs';
import { UpgradeRequestDialog } from './UpgradeRequestDialog';
import { cn } from '@/lib/utils';

const PLAN_ICONS: Record<string, React.ElementType> = {
  Shield,
  Zap,
  Crown,
  Star,
  Rocket,
};

const PLAN_COLORS: Record<string, { bg: string; border: string }> = {
  slate: {
    bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    border: 'border-slate-200 dark:border-slate-700',
  },
  blue: {
    bg: 'bg-primary/10 text-primary dark:bg-primary/20',
    border: 'border-primary/30',
  },
  amber: {
    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-700',
  },
  green: {
    bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    border: 'border-green-300 dark:border-green-700',
  },
  purple: {
    bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-700',
  },
};

interface UsageBarProps {
  label: string;
  icon: React.ReactNode;
  current: number;
  limit: number | null;
}

function UsageBar({ label, icon, current, limit }: UsageBarProps) {
  const percentage = getProgressPercentage(current, limit);
  const colorClass = getProgressColor(current, limit);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-medium">{formatLimit(current, limit)}</span>
      </div>
      {limit !== null ? (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", colorClass)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
        <div className="h-2 rounded-full bg-green-500/20 overflow-hidden">
          <div className="h-full w-full bg-green-500/40 animate-pulse" />
        </div>
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: PlanConfig;
  isCurrentPlan: boolean;
}

function PlanCard({ plan, isCurrentPlan }: PlanCardProps) {
  const Icon = PLAN_ICONS[plan.icon] || Shield;
  const colors = PLAN_COLORS[plan.color] || PLAN_COLORS.slate;
  
  return (
    <div 
      className={cn(
        "relative rounded-lg border-2 p-4 transition-all",
        isCurrentPlan 
          ? cn("ring-2 ring-primary ring-offset-2", colors.border)
          : "border-border hover:border-muted-foreground/30"
      )}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3 mr-1" />
            Tu Plan
          </Badge>
        </div>
      )}
      
      <div className="text-center space-y-3 pt-2">
        <div className={cn("inline-flex p-2 rounded-full", colors.bg)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div>
          <h4 className="font-semibold">{plan.name}</h4>
          <p className="text-lg font-bold text-primary">{plan.price}</p>
        </div>
        
        <ul className="text-sm space-y-1.5 text-left">
          {plan.features?.map((feature) => (
            <li key={feature.id} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{feature.feature_text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PlanLimitsCard() {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const usage = usePlanUsage();
  const { data: plans, isLoading: plansLoading } = usePlanConfigs();
  
  const currentPlanKey = tenant?.plan || 'basic';
  const currentPlan = plans?.find((p) => p.plan_key === currentPlanKey);
  const isEnterprise = currentPlanKey === 'enterprise';
  
  const isLoading = tenantLoading || usage.isLoading || plansLoading;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No hay planes configurados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Contacta al administrador para configurar los planes
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlan) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No se encontró el plan actual. El tenant tiene configurado: "{currentPlanKey}"
        </CardContent>
      </Card>
    );
  }

  const Icon = PLAN_ICONS[currentPlan.icon] || Shield;
  const colors = PLAN_COLORS[currentPlan.color] || PLAN_COLORS.slate;
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={cn("p-1.5 rounded-md", colors.bg)}>
              <Icon className="h-5 w-5" />
            </span>
            Tu Plan Actual
          </CardTitle>
          <CardDescription>
            Monitorea el uso de recursos y gestiona tu suscripción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-base px-3 py-1", colors.bg)}>
                {currentPlan.name}
              </Badge>
              <span className="text-muted-foreground">{currentPlan.price}</span>
            </div>
            {!isEnterprise && (
              <Button onClick={() => setUpgradeDialogOpen(true)} className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Solicitar Upgrade
              </Button>
            )}
          </div>
          
          {/* Usage Bars */}
          <div className="grid gap-4 sm:grid-cols-2">
            <UsageBar 
              label="Grúas" 
              icon={<Truck className="h-4 w-4" />}
              current={usage.currentCranes}
              limit={currentPlan.max_cranes}
            />
            <UsageBar 
              label="Usuarios" 
              icon={<Users className="h-4 w-4" />}
              current={usage.currentUsers}
              limit={currentPlan.max_users}
            />
            <UsageBar 
              label="Operadores" 
              icon={<UserCog className="h-4 w-4" />}
              current={usage.currentOperators}
              limit={currentPlan.max_operators}
            />
            <UsageBar 
              label="Clientes" 
              icon={<Building2 className="h-4 w-4" />}
              current={0}
              limit={currentPlan.max_clients}
            />
          </div>
          
          {/* Plan Comparison */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">
              Comparar Planes
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans?.map((plan) => (
                <PlanCard 
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={plan.plan_key === currentPlanKey}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <UpgradeRequestDialog 
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </>
  );
}
