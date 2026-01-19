import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCLP } from '@/types/clients';
import { useDashboardStats, ActiveService, DashboardAlert } from '@/hooks/useDashboard';
import { EnhancedServiceForm } from '@/components/services/EnhancedServiceForm';
import {
  Truck,
  ClipboardList,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  gradient,
  isLoading,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  gradient: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="kpi-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="w-14 h-14 rounded-2xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="kpi-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {changeType === 'up' && (
                <ArrowUpRight className="w-4 h-4 text-success" />
              )}
              {changeType === 'down' && (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              )}
              <span
                className={`text-sm font-medium ${
                  changeType === 'up'
                    ? 'text-success'
                    : changeType === 'down'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {change}
              </span>
              <span className="text-sm text-muted-foreground">vs mes anterior</span>
            </div>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${gradient}`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Alert Card Component
function AlertCard({
  title,
  description,
  type,
  time,
}: {
  title: string;
  description: string;
  type: 'warning' | 'danger' | 'info';
  time: string;
}) {
  const colors = {
    warning: 'border-l-warning bg-warning/5',
    danger: 'border-l-destructive bg-destructive/5',
    info: 'border-l-info bg-info/5',
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${colors[type]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{time}</span>
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({ service }: { service: ActiveService }) {
  const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pendiente', class: 'bg-muted/10 text-muted-foreground border-muted/20' },
    dispatched: { label: 'Despachado', class: 'bg-info/10 text-info border-info/20' },
    in_transit: { label: 'En Camino', class: 'bg-warning/10 text-warning border-warning/20' },
    on_site: { label: 'En Sitio', class: 'bg-success/10 text-success border-success/20' },
    in_progress: { label: 'En Proceso', class: 'bg-primary/10 text-primary border-primary/20' },
    completed: { label: 'Completado', class: 'bg-success/10 text-success border-success/20' },
    cancelled: { label: 'Cancelado', class: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  const config = statusConfig[service.status] || statusConfig.pending;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{service.folio}</span>
            <Badge variant="outline" className={config.class}>
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{service.client_name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{service.crane_unit || 'Sin asignar'}</p>
        <p className="text-xs text-muted-foreground">
          {service.operator_name || 'Sin operador'} • {formatDistanceToNow(new Date(service.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  action?: { label: string; to?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {action && action.onClick && (
        <Button variant="link" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {action && action.to && !action.onClick && (
        <Button variant="link" size="sm" asChild className="mt-2">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { authUser } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const [showServiceForm, setShowServiceForm] = useState(false);

  const getChangeType = (change: number): 'up' | 'down' | 'neutral' => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  };

  const formatChange = (change: number): string => {
    if (change === 0) return '0%';
    return `${change > 0 ? '+' : ''}${change}%`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ¡Hola, {authUser?.profile?.full_name?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tu operación del día
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" onClick={() => setShowServiceForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Servicios Hoy"
          value={stats?.servicesToday?.toString() || '0'}
          change={formatChange(stats?.servicesTodayChange || 0)}
          changeType={getChangeType(stats?.servicesTodayChange || 0)}
          icon={ClipboardList}
          gradient="bg-gradient-primary"
          isLoading={isLoading}
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatCLP(stats?.monthlyRevenue || 0)}
          change={formatChange(stats?.monthlyRevenueChange || 0)}
          changeType={getChangeType(stats?.monthlyRevenueChange || 0)}
          icon={DollarSign}
          gradient="bg-gradient-success"
          isLoading={isLoading}
        />
        <KPICard
          title="Operadores Activos"
          value={stats?.activeOperators?.toString() || '0'}
          change="0%"
          changeType="neutral"
          icon={Users}
          gradient="bg-gradient-purple"
          isLoading={isLoading}
        />
        <KPICard
          title="Grúas Disponibles"
          value={`${stats?.availableCranes || 0}/${stats?.totalCranes || 0}`}
          change={stats?.totalCranes ? '' : 'Sin grúas'}
          changeType="neutral"
          icon={Truck}
          gradient="bg-gradient-warning"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services in Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Servicios en Proceso</CardTitle>
              <CardDescription>Servicios activos en tiempo real</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/servicios">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : stats?.activeServices && stats.activeServices.length > 0 ? (
              <div className="space-y-3">
                {stats.activeServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No hay servicios activos"
                description="Crea un nuevo servicio para comenzar"
                action={{ label: '+ Crear servicio', onClick: () => setShowServiceForm(true) }}
              />
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Alertas
              </CardTitle>
              <CardDescription>Requieren atención</CardDescription>
            </div>
            {stats?.alerts && stats.alerts.length > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {stats.alerts.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.alerts && stats.alerts.length > 0 ? (
              <div className="space-y-3">
                {stats.alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    title={alert.title}
                    description={alert.description}
                    type={alert.type}
                    time={alert.time}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Sin alertas pendientes"
                description="Todo está en orden"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
                    <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-muted-foreground">Tiempo Promedio de Llegada</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{formatCLP(stats?.avgTicket || 0)}</p>
                    <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Form Modal */}
      <EnhancedServiceForm
        isOpen={showServiceForm}
        onOpenChange={setShowServiceForm}
      />
    </div>
  );
}
