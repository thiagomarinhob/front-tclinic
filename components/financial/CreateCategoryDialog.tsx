'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateFinancialCategory } from '@/hooks/useFinancial';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { TransactionType } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const categoryFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.nativeEnum(TransactionType),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: TransactionType;
  onCategoryCreated?: (categoryId: string) => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  defaultType,
  onCategoryCreated,
}: CreateCategoryDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const createCategory = useCreateFinancialCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      type: defaultType,
      name: '',
    },
  });

  // Reset form when dialog opens/closes or defaultType changes
  useEffect(() => {
    if (open) {
      reset({
        type: defaultType,
        name: '',
      });
    }
  }, [open, defaultType, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: CategoryFormData) => {
    if (!user?.clinicId) {
      toast.error('Clínica não encontrada');
      return;
    }

    try {
      const category = await createCategory.mutateAsync({
        tenantId: user.clinicId,
        name: data.name,
        type: data.type,
      });

      // A invalidação já foi feita no hook, mas vamos garantir
      // Aguardar um pouco para garantir que a invalidação foi processada
      await new Promise(resolve => setTimeout(resolve, 150));

      // Chamar callback com a categoria criada
      if (onCategoryCreated && category) {
        onCategoryCreated(category.id);
      }
      
      handleOpenChange(false);
    } catch (error: any) {
      // O erro já é tratado no hook, mas vamos garantir que não feche o modal
      console.error('Erro ao criar categoria:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Categoria
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as TransactionType, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Consultas, Aluguel, Material de Escritório..."
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createCategory.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Categoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
