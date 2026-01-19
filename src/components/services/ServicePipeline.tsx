import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PipelineColumn } from './PipelineColumn';
import { PipelineCard } from './PipelineCard';
import { STATUS_ORDER, canTransitionTo } from '@/types/services';
import type { ServiceStatus } from '@/types/services';
import { toast } from 'sonner';

interface ServiceData {
  id: string;
  folio: string;
  status: string;
  priority: string;
  type: string;
  scheduled_date: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_plates: string | null;
  subtotal: number | null;
  total: number | null;
  client?: { id: string; name: string; code: string | null } | null;
  crane?: { id: string; unit_number: string; type: string } | null;
  operator?: { id: string; full_name: string; employee_number: string } | null;
}

interface ServicePipelineProps {
  servicesByStatus: Record<ServiceStatus, ServiceData[]>;
  onStatusChange: (id: string, newStatus: ServiceStatus) => Promise<void>;
  onDelete: (id: string) => void;
}

export function ServicePipeline({ servicesByStatus, onStatusChange, onDelete }: ServicePipelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<ServiceData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findServiceById = (id: string): ServiceData | null => {
    for (const services of Object.values(servicesByStatus)) {
      const service = services.find(s => s.id === id);
      if (service) return service;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const service = findServiceById(active.id as string);
    setActiveService(service);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveService(null);

    if (!over) return;

    const serviceId = active.id as string;
    const targetStatus = over.id as ServiceStatus;
    
    const service = findServiceById(serviceId);
    if (!service) return;

    const currentStatus = service.status as ServiceStatus;

    // Check if dropping on same column
    if (currentStatus === targetStatus) return;

    // Check if transition is valid
    if (!canTransitionTo(currentStatus, targetStatus)) {
      toast.error(`No se puede mover de "${currentStatus}" a "${targetStatus}"`);
      return;
    }

    try {
      await onStatusChange(serviceId, targetStatus);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  // Filter out cancelled from main pipeline view
  const visibleStatuses = STATUS_ORDER.filter(s => s !== 'cancelled');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {visibleStatuses.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            services={(servicesByStatus[status] || []) as ServiceData[]}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && activeService ? (
          <div className="rotate-3 scale-105">
            <PipelineCard
              id={activeId}
              service={activeService}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
