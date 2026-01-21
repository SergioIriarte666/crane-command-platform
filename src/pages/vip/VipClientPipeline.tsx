import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PipelineMetrics } from '@/components/vip/PipelineMetrics';
import { PipelineListView } from '@/components/vip/PipelineListView';
import { BatchProgressModal, useBatchProgress } from '@/components/ui/batch-progress-modal';
import { useClientServices, useUpdateServicesBatch } from '@/hooks/useClientServices';
import { useClient } from '@/hooks/useClients';
import type { BatchUpdateData } from '@/types/vipPipeline';

export default function VipClientPipeline() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { services, isLoading: servicesLoading, refetch } = useClientServices(clientId || null);
  const updateBatch = useUpdateServicesBatch();
  const batchProgress = useBatchProgress();

  const handleBatchUpdate = async (data: BatchUpdateData) => {
    const total = data.services.length;
    batchProgress.start('Actualizando servicios', total);

    try {
      for (let i = 0; i < data.services.length; i++) {
        const serviceUpdate = data.services[i];
        
        await updateBatch.mutateAsync({
          serviceIds: [serviceUpdate.id],
          fields: {
            ...(serviceUpdate.quote_number && { quote_number: serviceUpdate.quote_number }),
            ...(serviceUpdate.purchase_order_number && { purchase_order_number: serviceUpdate.purchase_order_number }),
            ...(serviceUpdate.target_status && { status: serviceUpdate.target_status }),
          },
        });

        batchProgress.update(i + 1, serviceUpdate.id);
      }

      batchProgress.complete();
      refetch();
    } catch (error) {
      batchProgress.error((error as Error).message);
    }
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Cliente no encontrado</h2>
        <Button onClick={() => navigate('/clientes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${clientId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.tax_id || client.code}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <PipelineMetrics services={services} clientName={client.name} />

      {/* Pipeline List */}
      <PipelineListView
        services={services}
        loading={servicesLoading}
        clientId={clientId || ''}
        clientName={client.name}
        onBatchUpdate={handleBatchUpdate}
      />

      {/* Batch Progress Modal */}
      <BatchProgressModal state={batchProgress.state} onClose={batchProgress.close} />
    </div>
  );
}
