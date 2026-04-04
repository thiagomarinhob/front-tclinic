'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCreateFinancialTransaction } from '@/hooks/useFinancial';
import { useFinancialCategories } from '@/hooks/useFinancial';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { Loader2, DollarSign, Plus } from 'lucide-react';
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
      // Remove tudo exceto números
      const numbers = val.replace(/\D/g, '');
      if (!numbers) return false;
      // Converte para número e divide por 100 para ter centavos
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

interface FinancialTransactionFormProps {
  onSuccess?: () => void;
}

export function FinancialTransactionForm({ onSuccess }: FinancialTransactionFormProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const createTransaction = useCreateFinancialTransaction();
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);

  // Buscar categorias baseado no tipo selecionado
  const { data: categories, refetch: refetchCategories } = useFinancialCategories(
    user?.clinicId || null,
    selectedType,
    true // apenas ativas
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: TransactionType.EXPENSE,
      status: PaymentStatus.PENDENTE,
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedType = watch('type');

  // Atualizar tipo selecionado quando mudar
  useEffect(() => {
    if (watchedType !== selectedType) {
      setSelectedType(watchedType);
      setValue('categoryId', undefined); // Limpar categoria ao mudar tipo
    }
  }, [watchedType, selectedType, setValue]);

  const formatCurrencyInput = (value: string): string => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseFloat(numbers) / 100;
    
    // Formata como moeda brasileira
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
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/financial');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar transação');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Nova Transação Financeira
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Transação */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => {
                setValue('type', value as TransactionType);
                setSelectedType(value as TransactionType);
                setValue('categoryId', undefined); // Limpar categoria
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
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Ex: Conta de luz, Pagamento de consulta..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              value={watch('categoryId') || 'none'}
              onValueChange={(value) => {
                if (value === 'create') {
                  setCreateCategoryDialogOpen(true);
                  // Não atualizar o valor do select, apenas abrir o modal
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
            {categories && categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria {selectedType === TransactionType.INCOME ? 'de receita' : 'de despesa'} cadastrada.
              </p>
            )}
          </div>

          {/* Dialog de Criar Categoria */}
          <CreateCategoryDialog
            open={createCategoryDialogOpen}
            onOpenChange={(open) => {
              setCreateCategoryDialogOpen(open);
              // Se fechou sem criar, não fazer nada
              if (!open) return;
            }}
            defaultType={selectedType}
            onCategoryCreated={async (categoryId) => {
              // Invalidar e refetch categorias para atualizar a lista
              await refetchCategories();
              
              // Aguardar um pouco para garantir que os dados foram atualizados
              // e então selecionar a categoria criada
              setTimeout(() => {
                setValue('categoryId', categoryId, { shouldValidate: true });
                setCreateCategoryDialogOpen(false);
              }, 200);
            }}
          />

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              {...register('amount')}
              placeholder="0,00"
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setValue('amount', formatted, { shouldValidate: true });
              }}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Data de Vencimento */}
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

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Data de Pagamento</Label>
            <DatePicker
              id="paymentDate"
              value={watch('paymentDate') || ''}
              onChange={(value) => setValue('paymentDate', value, { shouldValidate: true })}
              placeholder="Selecione a data (opcional)"
            />
            {errors.paymentDate && (
              <p className="text-sm text-red-500">{errors.paymentDate.message}</p>
            )}
          </div>

          {/* Status */}
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
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          {/* Método de Pagamento */}
          {watch('status') === PaymentStatus.PAGO && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Select
                value={watch('paymentMethod') || 'none'}
                onValueChange={(value) => setValue('paymentMethod', value === 'none' ? undefined : value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método (opcional)" />
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

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createTransaction.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createTransaction.isPending}>
              {createTransaction.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Transação
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
