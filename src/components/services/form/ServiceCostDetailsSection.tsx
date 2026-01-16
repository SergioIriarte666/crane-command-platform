import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Receipt, Calculator, Info, Save, Loader2 } from 'lucide-react';
import { useServiceCosts, useAddServiceCost, useUpdateServiceCost, useDeleteServiceCost } from '@/hooks/useServiceCosts';
import { useCatalogs, CatalogItem } from '@/hooks/useCatalogs';
import { useCatalogSubcategories } from '@/hooks/useCatalogSubcategories';
import { toast } from 'sonner';
import { formatCLP } from '@/types/clients';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceCostDetail {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  category_id: string;
  subcategory?: string;
  date?: string;
  isExisting?: boolean;
}

interface ServiceCostDetailsSectionProps {
  serviceId?: string;
  costDetails: ServiceCostDetail[];
  onCostDetailsChange: (costDetails: ServiceCostDetail[]) => void;
  disabled?: boolean;
}

export const ServiceCostDetailsSection = ({
  serviceId,
  costDetails,
  onCostDetailsChange,
  disabled = false
}: ServiceCostDetailsSectionProps) => {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id;
  
  const { catalogs: categories } = useCatalogs('cost_category');
  const { data: existingCosts, isLoading: existingCostsLoading, refetch: refetchCosts } = useServiceCosts(serviceId || null);
  const addCostMutation = useAddServiceCost();
  const updateCostMutation = useUpdateServiceCost();
  const deleteCostMutation = useDeleteServiceCost();

  // Cache for dynamically loaded subcategories
  const [subcategoriesCache, setSubcategoriesCache] = useState<Record<string, { id: string; name: string }[]>>({});
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [savingCostId, setSavingCostId] = useState<string | null>(null);

  // Filter out commission categories
  const nonCommissionCategories = categories.filter(cat => 
    !cat.name.toLowerCase().includes('comisión') && 
    !cat.name.toLowerCase().includes('comision')
  );

  // Load existing costs when editing
  useEffect(() => {
    if (serviceId && 
        categories.length > 0 && 
        existingCosts && 
        existingCosts.length > 0 && 
        costDetails.length === 0 && 
        !existingCostsLoading) {
      
      const mappedCosts: ServiceCostDetail[] = existingCosts.map(cost => ({
        id: cost.id,
        description: cost.description,
        amount: Number(cost.amount),
        quantity: Number(cost.quantity) || 1,
        unitPrice: Number(cost.unit_price) || Number(cost.amount),
        notes: cost.notes || '',
        category_id: cost.category_id || '',
        subcategory: cost.subcategory || '',
        date: cost.cost_date || undefined,
        isExisting: true
      }));
      
      onCostDetailsChange(mappedCosts);
    }
  }, [serviceId, categories.length, existingCosts?.length, costDetails.length, existingCostsLoading]);

  // Load subcategories dynamically when category changes
  useEffect(() => {
    const loadSubcategoriesForCategories = async () => {
      if (!tenantId) return;
      
      const uniqueCategoryIds = [...new Set(costDetails.map(cost => cost.category_id).filter(Boolean))];
      
      for (const categoryId of uniqueCategoryIds) {
        if (!subcategoriesCache[categoryId]) {
          const { data } = await supabase
            .from('catalog_items')
            .select('id, name')
            .eq('parent_id', categoryId)
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          
          if (data && data.length > 0) {
            setSubcategoriesCache(prev => ({
              ...prev,
              [categoryId]: data
            }));
          }
        }
      }
    };

    if (costDetails.length > 0) {
      loadSubcategoriesForCategories();
    }
  }, [costDetails.map(c => c.category_id).join(','), tenantId]);

  const getSubcategoriesForCategory = useCallback((categoryId: string): { id: string; name: string }[] => {
    if (!categoryId) return [];
    return subcategoriesCache[categoryId] || [];
  }, [subcategoriesCache]);

  // Add new cost with anti-double-click protection
  const addCostDetail = () => {
    if (isAddingCost) return;
    
    setIsAddingCost(true);
    
    const newCostDetail: ServiceCostDetail = {
      id: `temp-${Date.now()}`,
      description: '',
      amount: 0,
      category_id: '',
      subcategory: '',
      notes: '',
      quantity: 1,
      unitPrice: 0,
      isExisting: false
    };
    
    onCostDetailsChange([...costDetails, newCostDetail]);
    
    setTimeout(() => setIsAddingCost(false), 300);
  };

  // Remove cost
  const removeCostDetail = async (id: string) => {
    const costToRemove = costDetails.find(cost => cost.id === id);
    
    if (costToRemove?.isExisting && serviceId) {
      deleteCostMutation.mutate(
        { id, service_id: serviceId },
        {
          onSuccess: () => {
            onCostDetailsChange(costDetails.filter(cost => cost.id !== id));
            refetchCosts();
            toast.success("Costo eliminado correctamente");
          }
        }
      );
    } else {
      onCostDetailsChange(costDetails.filter(cost => cost.id !== id));
    }
  };

  // Update cost field with auto-calculation
  const updateCostDetail = (id: string, field: keyof ServiceCostDetail, value: unknown) => {
    onCostDetailsChange(
      costDetails.map(cost => {
        if (cost.id === id) {
          const updated = { ...cost, [field]: value };
          
          // Auto-calculate amount if quantity or unitPrice changes
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = field === 'quantity' ? (value as number) : updated.quantity || 1;
            const unitPrice = field === 'unitPrice' ? (value as number) : updated.unitPrice || 0;
            updated.amount = quantity * unitPrice;
          }
          
          // Clear subcategory if category changes
          if (field === 'category_id') {
            updated.subcategory = '';
          }
          
          return updated;
        }
        return cost;
      })
    );
  };

  // Save individual cost (for existing services)
  const saveCostDetail = async (costDetail: ServiceCostDetail) => {
    if (!serviceId) {
      console.log('No serviceId, cost will be saved on service creation');
      return;
    }

    // Validations
    if (!costDetail.category_id) {
      toast.error("Debe seleccionar una categoría");
      return;
    }

    const availableSubcategories = getSubcategoriesForCategory(costDetail.category_id);
    if (availableSubcategories.length > 0 && !costDetail.subcategory?.trim()) {
      toast.error("Debe seleccionar una subcategoría");
      return;
    }

    if (!costDetail.description.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }

    if (costDetail.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setSavingCostId(costDetail.id);

    const costData = {
      service_id: serviceId,
      category_id: costDetail.category_id,
      description: costDetail.description.trim(),
      amount: costDetail.amount,
      quantity: costDetail.quantity || 1,
      unit_price: costDetail.unitPrice || costDetail.amount,
      cost_date: costDetail.date || new Date().toISOString().split('T')[0],
      notes: costDetail.notes || '',
      subcategory: costDetail.subcategory || ''
    };

    if (costDetail.isExisting) {
      updateCostMutation.mutate(
        { id: costDetail.id, ...costData },
        {
          onSuccess: () => {
            refetchCosts();
            toast.success("Costo actualizado correctamente");
            setSavingCostId(null);
          },
          onError: () => setSavingCostId(null)
        }
      );
    } else {
      addCostMutation.mutate(costData, {
        onSuccess: (data) => {
          if (data && data[0]) {
            onCostDetailsChange(
              costDetails.map(c => 
                c.id === costDetail.id 
                  ? { ...c, id: data[0].id, isExisting: true }
                  : c
              )
            );
          }
          refetchCosts();
          toast.success("Costo agregado correctamente");
          setSavingCostId(null);
        },
        onError: () => setSavingCostId(null)
      });
    }
  };

  // Calculate totals
  const getTotalCosts = () => costDetails.reduce((total, cost) => total + (cost.amount || 0), 0);

  const getCostsByCategory = () => {
    return costDetails.reduce((acc, cost) => {
      const categoryName = nonCommissionCategories.find(cat => cat.id === cost.category_id)?.name || 'Sin categoría';
      if (!acc[categoryName]) acc[categoryName] = 0;
      acc[categoryName] += cost.amount || 0;
      return acc;
    }, {} as Record<string, number>);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-5 w-5 text-red-500" />
          Costos Detallados del Servicio
        </CardTitle>
        <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-lg text-sm">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-muted-foreground">
            <strong>Nota:</strong> Las comisiones de operadores se manejan en la sección "Operadores". 
            Esta sección es para otros costos operacionales como combustible, peajes, materiales, etc.
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {costDetails.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay costos asociados
          </p>
        )}

        {costDetails.map((cost, index) => (
          <CostDetailRow
            key={cost.id}
            cost={cost}
            index={index}
            categories={nonCommissionCategories}
            subcategories={getSubcategoriesForCategory(cost.category_id)}
            disabled={disabled}
            serviceId={serviceId}
            isSaving={savingCostId === cost.id}
            onUpdate={updateCostDetail}
            onRemove={removeCostDetail}
            onSave={saveCostDetail}
          />
        ))}

        {/* Add cost button and totals */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={addCostDetail}
            disabled={disabled || isAddingCost}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
          >
            <Plus className="h-4 w-4" />
            Agregar Costo
          </Button>

          {costDetails.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-lg text-red-600">
                {formatCLP(getTotalCosts())}
              </span>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        {costDetails.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h5 className="text-sm font-medium mb-2">Desglose por Categoría:</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(getCostsByCategory()).map(([category, amount]) => (
                <div key={category} className="flex justify-between">
                  <span className="text-muted-foreground">{category}:</span>
                  <span className="font-medium">{formatCLP(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Separate component for each cost row
interface CostDetailRowProps {
  cost: ServiceCostDetail;
  index: number;
  categories: CatalogItem[];
  subcategories: { id: string; name: string }[];
  disabled: boolean;
  serviceId?: string;
  isSaving: boolean;
  onUpdate: (id: string, field: keyof ServiceCostDetail, value: unknown) => void;
  onRemove: (id: string) => void;
  onSave: (cost: ServiceCostDetail) => void;
}

const CostDetailRow = ({
  cost,
  index,
  categories,
  subcategories,
  disabled,
  serviceId,
  isSaving,
  onUpdate,
  onRemove,
  onSave
}: CostDetailRowProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">
          Costo {index + 1}
          {cost.isExisting && (
            <span className="text-xs text-green-600 ml-2">(Guardado)</span>
          )}
        </h4>
        <div className="flex gap-2">
          {serviceId && !disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSave(cost)}
              disabled={isSaving || !cost.category_id || !cost.description.trim() || cost.amount <= 0}
              className="text-primary hover:text-primary/80"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {cost.isExisting ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(cost.id)}
            disabled={disabled}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <Label className="text-xs">Categoría *</Label>
          <Select
            value={cost.category_id}
            onValueChange={(value) => onUpdate(cost.id, 'category_id', value)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Subcategory - only shows if subcategories exist */}
        {cost.category_id && subcategories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Subcategoría *</Label>
            <Select
              value={cost.subcategory || ''}
              onValueChange={(value) => onUpdate(cost.id, 'subcategory', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar subcategoría" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs">Descripción *</Label>
          <Input
            value={cost.description}
            onChange={(e) => onUpdate(cost.id, 'description', e.target.value)}
            placeholder="Ej: Combustible viaje Santiago"
            disabled={disabled}
            className="h-9"
          />
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label className="text-xs">Cantidad</Label>
          <Input
            type="number"
            value={cost.quantity || 1}
            onChange={(e) => onUpdate(cost.id, 'quantity', Number(e.target.value) || 1)}
            placeholder="1"
            min="0"
            step="0.01"
            disabled={disabled}
            className="h-9"
          />
        </div>

        {/* Unit Price */}
        <div className="space-y-2">
          <Label className="text-xs">Precio Unitario</Label>
          <Input
            type="number"
            value={cost.unitPrice || 0}
            onChange={(e) => onUpdate(cost.id, 'unitPrice', Number(e.target.value) || 0)}
            placeholder="0"
            min="0"
            disabled={disabled}
            className="h-9"
          />
        </div>

        {/* Total Amount (calculated) */}
        <div className="space-y-2">
          <Label className="text-xs">Monto Total *</Label>
          <Input
            type="number"
            value={cost.amount}
            onChange={(e) => onUpdate(cost.id, 'amount', Number(e.target.value) || 0)}
            placeholder="0"
            min="0"
            disabled={disabled}
            className="h-9 font-semibold"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label className="text-xs">Notas</Label>
          <Textarea
            value={cost.notes || ''}
            onChange={(e) => onUpdate(cost.id, 'notes', e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
