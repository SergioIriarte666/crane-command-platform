import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CSVParser, DataMapper, TemplateGenerator } from '@/utils/batchUpload';
import { 
  ValidationResult, 
  UploadProgress, 
  UploadResult,
  MappedServiceData 
} from '@/types/batchUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useEnhancedCSVUpload() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, unknown>[] | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const csvParser = new CSVParser();
  const dataMapper = new DataMapper();
  const batchSize = 25;

  const initializeUploader = useCallback(async () => {
    if (!authUser?.tenant?.id) return;
    
    try {
      await dataMapper.initialize(authUser.tenant.id);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing uploader:', error);
      toast.error('Error inicializando el cargador');
    }
  }, [authUser?.tenant?.id]);

  const parseFile = useCallback(async (): Promise<Record<string, unknown>[] | null> => {
    if (!file) return null;
    
    try {
      const data = await csvParser.parseFile(file, setUploadProgress);
      setCsvData(data);
      return data;
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(`Error al parsear archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return null;
    }
  }, [file]);

  const validateData = useCallback(async (data: Record<string, unknown>[]): Promise<ValidationResult | null> => {
    if (!isInitialized) {
      toast.error('El cargador no está inicializado');
      return null;
    }

    setIsValidating(true);
    
    try {
      const result = await dataMapper.validateAndMapData(data, (progress) => {
        setUploadProgress({
          total: data.length,
          processed: Math.floor(data.length * progress.percentage / 100),
          percentage: progress.percentage,
          currentBatch: 1,
          totalBatches: 1,
          stage: 'validating'
        });
      });
      
      setValidationResult(result);
      setUploadProgress(null);
      
      if (result.isValid) {
        toast.success(`${result.validCount} servicios listos para cargar`);
      } else {
        toast.warning(`${result.validCount} válidos, ${result.errorCount} con errores`);
      }
      
      return result;
    } catch (error) {
      console.error('Error validating data:', error);
      toast.error('Error al validar datos');
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [isInitialized]);

  const uploadServices = useCallback(async (): Promise<UploadResult | null> => {
    if (!validationResult || validationResult.validCount === 0) {
      toast.error('No hay servicios válidos para cargar');
      return null;
    }

    if (!authUser?.tenant?.id || !authUser?.profile?.id) {
      toast.error('No se encontró el tenant o el perfil');
      return null;
    }

    setIsUploading(true);
    
    const services = validationResult.validRows;
    const total = services.length;
    const totalBatches = Math.ceil(total / batchSize);
    let processed = 0;
    let errors = 0;
    const insertedFolios: string[] = [];

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = services.slice(i * batchSize, (i + 1) * batchSize);

        for (const service of batch) {
          try {
            await createService(service, authUser.tenant.id, authUser.profile.id);
            processed++;
            insertedFolios.push(service.folio);
          } catch (error) {
            console.error('Error creating service:', error);
            errors++;
          }
        }

        setUploadProgress({
          total,
          processed,
          percentage: Math.round((processed / total) * 100),
          currentBatch: i + 1,
          totalBatches,
          stage: 'uploading'
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const result: UploadResult = {
        success: errors === 0,
        processed,
        errors,
        message: errors === 0 
          ? `${processed} servicios cargados exitosamente` 
          : `${processed} cargados, ${errors} fallidos`,
        insertedFolios
      };

      setUploadResult(result);
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }

      return result;
    } catch (error) {
      console.error('Error uploading services:', error);
      toast.error('Error al cargar servicios');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [validationResult, authUser, queryClient]);

  const createService = async (
    service: MappedServiceData, 
    tenantId: string, 
    userId: string
  ) => {
    const { data, error } = await supabase
      .from('services')
      .insert({
        folio: service.folio,
        tenant_id: tenantId,
        created_by: userId,
        client_id: service.clientId,
        vehicle_brand: service.vehicleBrand,
        vehicle_model: service.vehicleModel,
        vehicle_plates: service.licensePlate,
        origin_address: service.origin,
        destination_address: service.destination,
        service_date: service.serviceDate,
        scheduled_date: service.requestDate,
        subtotal: service.value,
        total: service.value,
        crane_id: service.craneId,
        operator_id: service.operatorId,
        status: 'pending',
        notes: service.observations,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert operator assignment
    if (service.operatorId) {
      await supabase.from('service_operators').insert({
        service_id: data.id,
        tenant_id: tenantId,
        operator_id: service.operatorId,
        role: 'principal',
        commission: service.operatorCommission,
      });
    }

    return data;
  };

  const downloadTemplate = useCallback(() => {
    TemplateGenerator.downloadCSVTemplate();
  }, []);

  const downloadExcelTemplate = useCallback(() => {
    TemplateGenerator.downloadExcelTemplate();
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setCsvData(null);
    setValidationResult(null);
    setUploadProgress(null);
    setUploadResult(null);
  }, []);

  return {
    file,
    csvData,
    validationResult,
    isInitialized,
    isValidating,
    isUploading,
    uploadProgress,
    uploadResult,
    setFile,
    parseFile,
    validateData,
    uploadServices,
    downloadTemplate,
    downloadExcelTemplate,
    reset,
    initializeUploader,
  };
}
