'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { updateUserAction } from '@/actions/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import type { UserDetailResponse, UpdateUserBodyRequest } from '@/types';

const userFormSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  cpf: z.string().optional().refine(
    (val) => !val || /^\d{11}$/.test(val.replace(/\D/g, '')),
    'CPF deve ter 11 dígitos'
  ),
  birthDate: z.string().optional().refine(
    (val) => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val),
    'Data deve estar no formato DD/MM/AAAA'
  ),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user: UserDetailResponse;
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

export function UserForm({ user, onSuccess }: UserFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: '',
      cpf: '',
      birthDate: '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateUserBodyRequest = {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        email: data.email || undefined,
        phone: data.phone?.replace(/\D/g, '') || undefined,
        cpf: data.cpf?.replace(/\D/g, '') || undefined,
        birthDate: data.birthDate || undefined,
      };

      const result = await updateUserAction(user.id, updateData);

      if (result.success) {
        // Invalidar todas as queries de usuários para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['users'] });
        
        toast.success('Usuário atualizado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/users/${user.id}`);
        }
      } else {
        // Verificar se é erro de CPF duplicado
        const errorMessage = result.error || '';
        if (errorMessage.includes('CPF já está cadastrado') || errorMessage.includes('CPF já cadastrado')) {
          toast.error('CPF já está cadastrado no sistema. Por favor, verifique o CPF informado.');
        } else if (errorMessage.includes('Email já está em uso') || errorMessage.includes('Email already exists')) {
          toast.error('Email já está cadastrado no sistema. Por favor, use outro email.');
        } else {
          toast.error(errorMessage || 'Erro ao atualizar usuário');
        }
      }
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Dados do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="lastName">Sobrenome</Label>
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Input
              id="birthDate"
              placeholder="DD/MM/AAAA"
              className={errors.birthDate ? 'border-red-500' : ''}
              {...register('birthDate')}
              onChange={(e) => {
                const formatted = formatDate(e.target.value);
                setValue('birthDate', formatted, { shouldValidate: true });
              }}
              maxLength={10}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-500">{errors.birthDate.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
