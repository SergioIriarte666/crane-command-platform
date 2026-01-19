// src/hooks/useLogoUpdater.ts

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLogoUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { authUser } = useAuth();

  const updateLogo = async (
    logoFile: File | null
  ): Promise<{ success: boolean; error?: string; newLogoUrl?: string }> => {
    if (!authUser?.tenant?.id) {
      return { success: false, error: 'No hay tenant configurado' };
    }

    setIsUpdating(true);
    console.log("useLogoUpdater: Iniciando proceso de actualización de logo.");

    try {
      const tenantId = authUser.tenant.id;
      
      // Obtener logo actual
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('logo_url')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        throw new Error(`Error al consultar tenant: ${tenantError.message}`);
      }

      const oldLogoUrl = tenantData?.logo_url;
      let newLogoUrl: string | null = null;
      let newLogoPath: string | undefined;

      if (logoFile) {
        // Generar nombre único para el archivo
        const fileExt = logoFile.name.split('.').pop();
        newLogoPath = `logos/${tenantId}-${Date.now()}.${fileExt}`;
        
        // Subir nuevo logo
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(newLogoPath, logoFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Error al subir el logo: ${uploadError.message}`);
        }
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(newLogoPath);
        
        newLogoUrl = urlData.publicUrl;
      }

      // Actualizar tenant con nuevo logo
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: newLogoUrl })
        .eq('id', tenantId);

      if (updateError) {
        // Rollback: eliminar archivo subido si falló la actualización
        if (newLogoPath) {
          await supabase.storage.from('avatars').remove([newLogoPath]);
        }
        throw new Error(`Error al guardar el logo: ${updateError.message}`);
      }

      // Eliminar logo antiguo si existía y se subió uno nuevo
      if (oldLogoUrl && newLogoPath) {
        try {
          // Extraer path del logo antiguo
          const oldPath = oldLogoUrl.split('/avatars/')[1]?.split('?')[0];
          if (oldPath && oldPath.startsWith('logos/')) {
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (e) {
          console.warn('No se pudo eliminar el logo antiguo:', e);
        }
      }

      toast.success('Logo actualizado correctamente');
      return { success: true, newLogoUrl: newLogoUrl || undefined };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  const removeLogo = async (): Promise<{ success: boolean; error?: string }> => {
    return updateLogo(null);
  };

  return { isUpdating, updateLogo, removeLogo };
};
