'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createProfessionalWithUserAction, updateProfessionalAction } from '@/actions/professional-actions';
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
import { Loader2, GraduationCap, FileText, User, Mail, Lock, Eye, EyeOff, Phone, Calendar } from 'lucide-react';
import { useState } from 'react';
import type { Professional } from '@/types';
import { DocumentType, Specialty, SPECIALTY_LABELS } from '@/types/professional.types';
import { professionalWithUserSchema, professionalSchema } from '@/lib/validators';

type ProfessionalFormData = z.infer<typeof professionalWithUserSchema>;
type ProfessionalUpdateFormData = z.infer<typeof professionalSchema>;

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

interface ProfessionalFormProps {
  professional?: Professional;
  onSuccess?: () => void;
}

export function ProfessionalForm({ professional, onSuccess }: ProfessionalFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditing = !!professional;

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? professionalSchema : professionalWithUserSchema) as any,
    defaultValues: isEditing ? {
      userId: professional?.user?.id || '',
      specialty: professional?.specialty || '',
      documentType: professional?.documentType || DocumentType.CRM,
      documentNumber: professional?.documentNumber || '',
      documentState: professional?.documentState,
      bio: professional?.bio,
    } : {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      cpf: '',
      birthDate: '',
      specialty: '',
      documentType: DocumentType.CRM,
      documentNumber: '',
      documentState: '',
      bio: '',
    },
  });

  const onSubmit = async (data: ProfessionalFormData | ProfessionalUpdateFormData) => {
    if (!user?.clinicId) {
      toast.error('Erro: Clínica não identificada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (isEditing && professional) {
        // Atualizar profissional existente (mantém lógica antiga)
        result = await updateProfessionalAction(professional.id, data as any);
      } else {
        // Criar novo profissional com usuário
        const createData = data as ProfessionalFormData;
        
        // Remover confirmPassword antes de enviar
        const { confirmPassword, ...dataToSend } = createData;
        
        // Limpar formatação de CPF (remover pontos e hífen)
        if (dataToSend.cpf) {
          dataToSend.cpf = dataToSend.cpf.replace(/\D/g, '');
        }
        
        result = await createProfessionalWithUserAction(dataToSend as any);
      }

      if (result.success) {
        // Invalidar todas as queries de profissionais para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['professionals'] });
        
        toast.success(
          isEditing
            ? 'Profissional atualizado com sucesso!'
            : 'Profissional cadastrado com sucesso!'
        );
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/professionals');
        }
      } else {
        toast.error(result.error || 'Erro ao salvar profissional');
      }
    } catch (error) {
      toast.error('Erro inesperado ao salvar profissional');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {!isEditing && (
        <>
          {/* Dados do Usuário */}
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
                  {...form.register('firstName')}
                  className={form.formState.errors.firstName ? 'border-red-500' : ''}
                />
                {form.formState.errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.firstName?.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  placeholder="Sobrenome"
                  {...form.register('lastName')}
                  className={form.formState.errors.lastName ? 'border-red-500' : ''}
                />
                {form.formState.errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.lastName?.message as string}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    className={`pl-10 ${form.formState.errors.email ? 'border-red-500' : ''}`}
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.email?.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className={`pl-10 pr-10 ${form.formState.errors.password ? 'border-red-500' : ''}`}
                    {...form.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.password?.message as string}</p>
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
                    className={`pl-10 pr-10 ${form.formState.errors.confirmPassword ? 'border-red-500' : ''}`}
                    {...form.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.confirmPassword?.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    className={`pl-10 ${form.formState.errors.phone ? 'border-red-500' : ''}`}
                    {...form.register('phone')}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      form.setValue('phone', formatted, { shouldValidate: true });
                    }}
                    maxLength={15}
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.phone?.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  className={form.formState.errors.cpf ? 'border-red-500' : ''}
                  {...form.register('cpf')}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    form.setValue('cpf', formatted, { shouldValidate: true });
                  }}
                  maxLength={14}
                />
                {form.formState.errors.cpf && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.cpf?.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    placeholder="DD/MM/AAAA"
                    className={`pl-10 ${form.formState.errors.birthDate ? 'border-red-500' : ''}`}
                    {...form.register('birthDate')}
                    onChange={(e) => {
                      const formatted = formatDate(e.target.value);
                      form.setValue('birthDate', formatted, { shouldValidate: true });
                    }}
                    maxLength={10}
                  />
                </div>
                {form.formState.errors.birthDate && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.birthDate?.message as string}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Profissional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="specialty">Especialidade *</Label>
                <Select
                  value={form.watch('specialty') || ''}
                  onValueChange={(value) => form.setValue('specialty', value as Specialty, { shouldValidate: true })}
                >
                  <SelectTrigger className={form.formState.errors.specialty ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Specialty).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {SPECIALTY_LABELS[specialty]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialty && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.specialty?.message as string}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isEditing && (
        <>
          {/* Informações do Profissional - Edição */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Informações do Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Usuário</Label>
                <Input
                  value={professional.user.fullName}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="specialty">Especialidade *</Label>
                <Select
                  value={form.watch('specialty') || ''}
                  onValueChange={(value) => form.setValue('specialty', value as Specialty, { shouldValidate: true })}
                >
                  <SelectTrigger className={form.formState.errors.specialty ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Specialty).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {SPECIALTY_LABELS[specialty]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialty && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.specialty?.message as string}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Documentação Profissional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Documentação Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de Documento *</Label>
            <Select
              value={form.watch('documentType') || ''}
              onValueChange={(value) => form.setValue('documentType', value as DocumentType)}
            >
              <SelectTrigger className={form.formState.errors.documentType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DocumentType.CRM}>CRM - Conselho Regional de Medicina</SelectItem>
                <SelectItem value={DocumentType.CREFITO}>CREFITO - Conselho Regional de Fisioterapia</SelectItem>
                <SelectItem value={DocumentType.CRO}>CRO - Conselho Regional de Odontologia</SelectItem>
                <SelectItem value={DocumentType.CRP}>CRP - Conselho Regional de Psicologia</SelectItem>
                <SelectItem value={DocumentType.CRN}>CRN - Conselho Regional de Nutricionistas</SelectItem>
                <SelectItem value={DocumentType.COREN}>COREN - Conselho Regional de Enfermagem</SelectItem>
                <SelectItem value={DocumentType.OUTRO}>OUTRO</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.documentType && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.documentType?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentNumber">Número do Documento *</Label>
            <Input
              id="documentNumber"
              placeholder="Ex: 123456"
              {...form.register('documentNumber')}
              className={form.formState.errors.documentNumber ? 'border-red-500' : ''}
            />
            {form.formState.errors.documentNumber && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.documentNumber?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentState">Estado do Documento (UF)</Label>
            <Select
              value={form.watch('documentState') || undefined}
              onValueChange={(value) => {
                form.setValue('documentState', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">AC</SelectItem>
                <SelectItem value="AL">AL</SelectItem>
                <SelectItem value="AP">AP</SelectItem>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="BA">BA</SelectItem>
                <SelectItem value="CE">CE</SelectItem>
                <SelectItem value="DF">DF</SelectItem>
                <SelectItem value="ES">ES</SelectItem>
                <SelectItem value="GO">GO</SelectItem>
                <SelectItem value="MA">MA</SelectItem>
                <SelectItem value="MT">MT</SelectItem>
                <SelectItem value="MS">MS</SelectItem>
                <SelectItem value="MG">MG</SelectItem>
                <SelectItem value="PA">PA</SelectItem>
                <SelectItem value="PB">PB</SelectItem>
                <SelectItem value="PR">PR</SelectItem>
                <SelectItem value="PE">PE</SelectItem>
                <SelectItem value="PI">PI</SelectItem>
                <SelectItem value="RJ">RJ</SelectItem>
                <SelectItem value="RN">RN</SelectItem>
                <SelectItem value="RS">RS</SelectItem>
                <SelectItem value="RO">RO</SelectItem>
                <SelectItem value="RR">RR</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
                <SelectItem value="SE">SE</SelectItem>
                <SelectItem value="TO">TO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5" />
            Informações Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              placeholder="Descreva a formação e experiência profissional..."
              {...form.register('bio')}
              rows={6}
              className={form.formState.errors.bio ? 'border-red-500' : ''}
            />
            {form.formState.errors.bio && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.bio?.message as string}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Esta informação será exibida no perfil do profissional.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
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
          {isEditing ? 'Salvar Alterações' : 'Cadastrar Profissional'}
        </Button>
      </div>
    </form>
  );
}
