'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCreateFinancialTransaction } from '@/hooks/useFinancial';
import { useFinancialCategories } from '@/hooks/useFinancial';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, DollarSign, Plus, Calendar, CreditCard } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useState, useEffect } from 'react';
import { TransactionType, PaymentStatus, PaymentMethod } from '@/types';
import { CreateCategoryDialog } from './CreateCategoryDialog';

const transactionFormSchema = z.object({
  description: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().optional(),
  amount: z.string().min(1, 'Valor é obrigatório').refine(
    (val) => {
      const numbers = val.replace(/\D/g, '');
      if (!numbers) return false;
      const num = parseFloat(numbers) / 100;
      return !isNaN(num) && num > 0;
    },
    'Valor deve ser maior que zero'
  ),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paymentDate: z.string().optional(),
  status: z.nativeEnum(PaymentStatus),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface FinancialTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FinancialTransactionDialog({
  open,
  onOpenChange,
  onSuccess
}: FinancialTransactionDialogProps) {
  const { user } = useAuthContext();
  const createTransaction = useCreateFinancialTransaction();
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);

  const { data: categories, refetch: refetchCategories } = useFinancialCategories(
    user?.clinicId || null,
    selectedType,
    true
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
  });

  const watchedType = watch('type');
  const watchedStatus = watch('status');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        description: '',
        type: TransactionType.EXPENSE,
        status: PaymentStatus.PENDENTE,
        dueDate: new Date().toISOString().split('T')[0],
        amount: '',
        categoryId: undefined,
        paymentDate: '',
        paymentMethod: undefined,
      });
      setSelectedType(TransactionType.EXPENSE);
    }
  }, [open, reset]);

  // Atualizar tipo selecionado quando mudar
  useEffect(() => {
    if (watchedType && watchedType !== selectedType) {
      setSelectedType(watchedType);
      setValue('categoryId', undefined);
    }
  }, [watchedType, selectedType, setValue]);

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseFloat(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const parseCurrencyValue = (value: string): number => {
    // Formato pt-BR: "1.234,56" → remove pontos de milhar, troca vírgula por ponto
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!user?.clinicId) {
      toast.error('Clínica não encontrada');
      return;
    }

    try {
      const amount = parseCurrencyValue(data.amount);

      await createTransaction.mutateAsync({
        tenantId: user.clinicId,
        description: data.description,
        type: data.type,
        categoryId: data.categoryId || undefined,
        amount: amount,
        dueDate: data.dueDate,
        paymentDate: data.paymentDate || undefined,
        status: data.status,
        paymentMethod: data.paymentMethod || undefined,
      });

      toast.success('Transação criada com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar transação');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Nova Transação Financeira
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma nova transação.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <form id="financial-dialog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Tipo e Descrição */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Informações da Transação
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value) => {
                      setValue('type', value as TransactionType);
                      setSelectedType(value as TransactionType);
                      setValue('categoryId', undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Ex: Conta de luz, Pagamento de consulta..."
                    rows={2}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <Select
                    value={watch('categoryId') || 'none'}
                    onValueChange={(value) => {
                      if (value === 'create') {
                        setCreateCategoryDialogOpen(true);
                        return;
                      }
                      setValue('categoryId', value === 'none' ? undefined : value, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories && categories.length > 0 && (
                        <>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                          <div className="border-t my-1" />
                        </>
                      )}
                      <SelectItem value="create" className="text-primary font-medium">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Criar nova categoria
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Valor e Datas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Valor e Datas
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="amount"
                        {...register('amount')}
                        placeholder="0,00"
                        className="pl-10"
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          setValue('amount', formatted, { shouldValidate: true });
                        }}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-500">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento *</Label>
                    <DatePicker
                      id="dueDate"
                      value={watch('dueDate')}
                      onChange={(value) => setValue('dueDate', value, { shouldValidate: true })}
                      placeholder="Selecione a data"
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Data de Pagamento</Label>
                    <DatePicker
                      id="paymentDate"
                      value={watch('paymentDate') || ''}
                      onChange={(value) => setValue('paymentDate', value, { shouldValidate: true })}
                      placeholder="Selecione a data (opcional)"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status e Método de Pagamento */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Status e Pagamento
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={watch('status')}
                      onValueChange={(value) => setValue('status', value as PaymentStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentStatus.PENDENTE}>Pendente</SelectItem>
                        <SelectItem value={PaymentStatus.PAGO}>Pago</SelectItem>
                        <SelectItem value={PaymentStatus.FIADO}>Fiado</SelectItem>
                        <SelectItem value={PaymentStatus.CANCELADO}>Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {watchedStatus === PaymentStatus.PAGO && (
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                      <Select
                        value={watch('paymentMethod') || 'none'}
                        onValueChange={(value) => setValue('paymentMethod', value === 'none' ? undefined : value as PaymentMethod)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não especificado</SelectItem>
                          <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                          <SelectItem value={PaymentMethod.DEBITO}>Débito</SelectItem>
                          <SelectItem value={PaymentMethod.CREDITO}>Crédito</SelectItem>
                          <SelectItem value={PaymentMethod.DINHEIRO}>Dinheiro</SelectItem>
                          <SelectItem value={PaymentMethod.BOLETO}>Boleto</SelectItem>
                          <SelectItem value={PaymentMethod.OUTRO}>Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTransaction.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="financial-dialog-form"
              disabled={createTransaction.isPending}
            >
              {createTransaction.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Transação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar Categoria */}
      <CreateCategoryDialog
        open={createCategoryDialogOpen}
        onOpenChange={setCreateCategoryDialogOpen}
        defaultType={selectedType}
        onCategoryCreated={async (categoryId) => {
          await refetchCategories();
          setTimeout(() => {
            setValue('categoryId', categoryId, { shouldValidate: true });
            setCreateCategoryDialogOpen(false);
          }, 200);
        }}
      />
    </>
  );
}
