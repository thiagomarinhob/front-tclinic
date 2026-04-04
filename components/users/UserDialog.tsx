'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { createUserAction } from '@/actions/user-actions';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, User, Mail, Lock, Eye, EyeOff, Phone, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { CreateUserRequestBodyRequest } from '@/types';

const createUserFormSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória'),
  phone: z.string().optional(),
  cpf: z.string().optional().refine(
    (val) => !val || /^\d{11}$/.test(val.replace(/\D/g, '')),
    'CPF deve ter 11 dígitos'
  ),
  birthDate: z.string().optional().refine(
    (val) => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val),
    'Data deve estar no formato DD/MM/AAAA'
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Funções de formatação
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

function formatDate(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

export function UserDialog({ open, onOpenChange, onSuccess }: UserDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        cpf: '',
        birthDate: '',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateUserFormData) => {
    if (!user?.clinicId) {
      toast.error('Erro: Clínica não identificada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createData: CreateUserRequestBodyRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone?.replace(/\D/g, '') || undefined,
        cpf: data.cpf?.replace(/\D/g, '') || undefined,
        birthDate: data.birthDate || undefined,
        tenantId: user.clinicId,
      };

      const createResult = await createUserAction(createData);

      if (!createResult.success || !createResult.data) {
        const errorMessage = createResult.error || '';
        if (errorMessage.includes('CPF já está cadastrado') || errorMessage.includes('CPF já cadastrado')) {
          toast.error('CPF já está cadastrado no sistema. Por favor, verifique o CPF informado.');
        } else {
          toast.error(errorMessage || 'Erro ao cadastrar usuário');
        }
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário cadastrado e associado à clínica com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao cadastrar usuário');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo usuário na clínica.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <form id="user-dialog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Dados Pessoais
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    placeholder="Nome"
                    {...register('firstName')}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    placeholder="Sobrenome"
                    {...register('lastName')}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      {...register('phone')}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setValue('phone', formatted, { shouldValidate: true });
                      }}
                      maxLength={15}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    className={errors.cpf ? 'border-red-500' : ''}
                    {...register('cpf')}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setValue('cpf', formatted, { shouldValidate: true });
                    }}
                    maxLength={14}
                  />
                  {errors.cpf && (
                    <p className="mt-1 text-sm text-red-500">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="birthDate"
                      placeholder="DD/MM/AAAA"
                      className={`pl-10 ${errors.birthDate ? 'border-red-500' : ''}`}
                      {...register('birthDate')}
                      onChange={(e) => {
                        const formatted = formatDate(e.target.value);
                        setValue('birthDate', formatted, { shouldValidate: true });
                      }}
                      maxLength={10}
                    />
                  </div>
                  {errors.birthDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Credenciais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Lock className="h-4 w-4" />
                Credenciais de Acesso
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme a senha"
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
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
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="user-dialog-form"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar Usuário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
