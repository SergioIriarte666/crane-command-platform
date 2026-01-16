import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, Loader2 } from 'lucide-react';
import { useCreateUpgradeRequest } from '@/hooks/usePlanLimits';
import { usePlanConfigs } from '@/hooks/usePlanConfigs';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useSettings';

const formSchema = z.object({
  requested_plan: z.string().min(1, 'Selecciona un plan'),
  contact_name: z.string().min(2, 'Nombre requerido'),
  contact_email: z.string().email('Email inválido'),
  contact_phone: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UpgradeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeRequestDialog({ open, onOpenChange }: UpgradeRequestDialogProps) {
  const { authUser } = useAuth();
  const { data: tenant } = useTenant();
  const { data: plans = [] } = usePlanConfigs();
  const createRequest = useCreateUpgradeRequest();
  
  const currentPlan = tenant?.plan || 'basic';
  // Filter out current plan - only show plans that are different
  const availablePlans = plans.filter((p) => p.plan_key !== currentPlan);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requested_plan: '',
      contact_name: authUser?.profile?.full_name || '',
      contact_email: authUser?.profile?.email || '',
      contact_phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await createRequest.mutateAsync({
      current_plan: currentPlan,
      requested_plan: data.requested_plan,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone || null,
      message: data.message || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Solicitar Upgrade de Plan
          </DialogTitle>
          <DialogDescription>
            Completa el formulario y nos pondremos en contacto contigo para gestionar tu upgrade.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requested_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Deseado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.plan_key}>
                          {plan.name} - {plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Contacto</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contacto</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+52 55 1234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Cuéntanos sobre tus necesidades..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enviar Solicitud
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
