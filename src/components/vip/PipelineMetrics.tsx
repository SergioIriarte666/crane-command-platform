import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, FileText, DollarSign } from 'lucide-react';
import { formatCLP } from '@/types/clients';
import type { VipService } from '@/types/vipPipeline';
import { differenceInDays } from 'date-fns';

interface PipelineMetricsProps {
  services: VipService[];
  clientName: string;
}

export function PipelineMetrics({ services, clientName }: PipelineMetricsProps) {
  const metrics = useMemo(() => {
    const today = new Date();
    
    // Total value
    const totalValue = services.reduce((sum, s) => sum + (s.total || 0), 0);
    
    // Quoted value (services with quote)
    const quotedServices = services.filter(s => s.quote_number);
    const quotedValue = quotedServices.reduce((sum, s) => sum + (s.total || 0), 0);
    
    // With Purchase Order value
    const poServices = services.filter(s => s.purchase_order_number);
    const poValue = poServices.reduce((sum, s) => sum + (s.total || 0), 0);
    
    // Average days in pipeline
    const avgDays = services.length > 0
      ? Math.round(
          services.reduce((sum, s) => {
            const created = s.created_at ? new Date(s.created_at) : today;
            return sum + differenceInDays(today, created);
          }, 0) / services.length
        )
      : 0;
    
    // Pending to invoice
    const pendingInvoice = services.filter(s => s.status === 'completed');
    const pendingInvoiceValue = pendingInvoice.reduce((sum, s) => sum + (s.total || 0), 0);
    
    return {
      totalServices: services.length,
      totalValue,
      quotedCount: quotedServices.length,
      quotedValue,
      poCount: poServices.length,
      poValue,
      avgDays,
      pendingInvoiceCount: pendingInvoice.length,
      pendingInvoiceValue,
    };
  }, [services]);

  const kpis = [
    {
      title: 'Total Servicios',
      value: metrics.totalServices.toString(),
      subtitle: formatCLP(metrics.totalValue),
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Cotizados',
      value: metrics.quotedCount.toString(),
      subtitle: formatCLP(metrics.quotedValue),
      icon: TrendingUp,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      title: 'Con O.C.',
      value: metrics.poCount.toString(),
      subtitle: formatCLP(metrics.poValue),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Días Promedio',
      value: `${metrics.avgDays}d`,
      subtitle: 'en pipeline',
      icon: Clock,
      gradient: 'from-violet-500 to-violet-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pipeline de {clientName}</h2>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient} text-white`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
