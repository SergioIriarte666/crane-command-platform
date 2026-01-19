import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Truck, DollarSign, FileText } from 'lucide-react';
import { ServicesReport } from '@/components/reports/ServicesReport';
import { RevenueReport } from '@/components/reports/RevenueReport';
import { ClientsReport } from '@/components/reports/ClientsReport';
import { OperatorsReport } from '@/components/reports/OperatorsReport';
import { FleetReport } from '@/components/reports/FleetReport';
import { FinanceReport } from '@/components/reports/FinanceReport';

const reportTypes = [
  { id: 'services', label: 'Servicios', icon: BarChart3, description: 'Análisis de servicios por período, tipo y estado' },
  { id: 'revenue', label: 'Ingresos', icon: TrendingUp, description: 'Facturación, tendencias y proyecciones' },
  { id: 'clients', label: 'Clientes', icon: Users, description: 'Análisis de clientes y facturación por cliente' },
  { id: 'operators', label: 'Operadores', icon: Truck, description: 'Rendimiento y comisiones de operadores' },
  { id: 'fleet', label: 'Flota', icon: Truck, description: 'Utilización de unidades y mantenimiento' },
  { id: 'finance', label: 'Finanzas', icon: DollarSign, description: 'Cuentas por cobrar, pagos y comisiones' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('services');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Análisis y estadísticas del negocio</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
          {reportTypes.map((report) => (
            <TabsTrigger
              key={report.id}
              value={report.id}
              className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border"
            >
              <report.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{report.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="services">
          <ServicesReport />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueReport />
        </TabsContent>

        <TabsContent value="clients">
          <ClientsReport />
        </TabsContent>

        <TabsContent value="operators">
          <OperatorsReport />
        </TabsContent>

        <TabsContent value="fleet">
          <FleetReport />
        </TabsContent>

        <TabsContent value="finance">
          <FinanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
