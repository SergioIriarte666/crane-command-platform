import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Shield, AlertTriangle, Building2, Calendar, DollarSign } from 'lucide-react';
import { format, subMonths, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePlanConfigs } from '@/hooks/usePlanConfigs';

interface Tenant {
  id: string;
  name: string;
  plan: string | null;
  created_at: string;
  is_active: boolean;
  max_users: number | null;
  max_cranes: number | null;
}

interface AnalyticsProps {
  tenants: Tenant[];
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function SubscriptionAnalytics({ tenants }: AnalyticsProps) {
  const { data: planConfigs } = usePlanConfigs();

  // Helper to get plan details
  const getPlanDetails = (planKey: string) => {
    const config = planConfigs?.find(c => c.plan_key === planKey);
    return {
      name: config?.name || planKey,
      price: config?.price_amount || 0,
      color: config?.color || DEFAULT_COLORS[0]
    };
  };

  // 1. Distribución de Planes
  const planDistribution = useMemo(() => {
    if (!tenants.length) return [];
    
    const dist = tenants.reduce((acc, tenant) => {
      const plan = tenant.plan || 'basic'; // Default to basic if null
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dist).map(([key, value], index) => {
      const details = getPlanDetails(key);
      return { 
        name: details.name, 
        value, 
        color: details.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] 
      };
    });
  }, [tenants, planConfigs]);

  // 2. Crecimiento de Tenants (Últimos 6 meses)
  const growthData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      return subMonths(new Date(), 5 - i);
    });

    return last6Months.map(date => {
      const monthKey = format(date, 'MMM yyyy', { locale: es });
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const count = tenants.filter(t => {
        const created = parseISO(t.created_at);
        return created <= monthEnd; // Acumulado hasta fin de ese mes
      }).length;
      
      const newInMonth = tenants.filter(t => {
        const created = parseISO(t.created_at);
        return isSameMonth(created, date);
      }).length;

      return {
        name: monthKey,
        total: count,
        new: newInMonth
      };
    });
  }, [tenants]);

  // 3. KPIs
  const kpis = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.is_active).length;
    const inactive = total - active;
    
    // MRR Real basado en configuración
    const mrr = tenants.reduce((acc, t) => {
      if (!t.is_active) return acc;
      const planKey = t.plan || 'basic';
      const details = getPlanDetails(planKey);
      return acc + details.price;
    }, 0);

    // Calcular churn rate (simplificado)
    const churnRate = total > 0 ? (inactive / total) * 100 : 0;

    return { total, active, inactive, mrr, churnRate };
  }, [tenants, planConfigs]);

  // 4. Proyección de Ingresos (Próximos 6 meses)
  const revenueProjection = useMemo(() => {
    const currentMRR = kpis.mrr;
    const growthRate = 0.05; // 5% mensual estimado

    return Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const projectedMRR = currentMRR * Math.pow(1 + growthRate, i);
      
      return {
        name: format(date, 'MMM yyyy', { locale: es }),
        mrr: Math.round(projectedMRR),
        conservative: Math.round(projectedMRR * 0.9)
      };
    });
  }, [kpis.mrr]);

  // Plan más popular
  const topPlan = useMemo(() => {
    if (!planDistribution.length) return { name: 'N/A', value: 0, color: '#ccc' };
    return [...planDistribution].sort((a, b) => b.value - a.value)[0];
  }, [planDistribution]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-green-500 font-medium">{kpis.active} activas</span>
              <span className="text-muted-foreground">/ {kpis.inactive} inactivas</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos mensuales recurrentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Churn</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${kpis.churnRate > 10 ? 'text-red-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Empresas inactivas sobre total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Principal</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize truncate">
              {topPlan.name}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((topPlan.value || 0) / (kpis.total || 1) * 100).toFixed(0)}% de las empresas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Growth Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Crecimiento de Suscripciones</CardTitle>
            <CardDescription>Evolución de empresas registradas en los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  name="Total Acumulado" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                  dot={{ r: 4, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  name="Nuevos Mensuales" 
                  stroke="#82ca9d" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Projection */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Proyección de Ingresos</CardTitle>
            <CardDescription>Estimación de MRR a 6 meses (Crecimiento 5%)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueProjection}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="mrr" name="Proyección" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conservative" name="Conservador" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Plan Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribución por Plan</CardTitle>
            <CardDescription>Proporción de tipos de suscripción actuales</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} Empresas`, 'Cantidad']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Últimas Empresas Registradas</CardTitle>
            <CardDescription>
              Las 5 empresas más recientes en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenants.slice(0, 5).map((tenant) => {
                const details = getPlanDetails(tenant.plan || 'basic');
                return (
                  <div key={tenant.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Registrado el {format(parseISO(tenant.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" style={{ borderColor: details.color, color: details.color }}>
                        {details.name}
                      </Badge>
                      <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                        {tenant.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card></div>
    </div>
  );
}
