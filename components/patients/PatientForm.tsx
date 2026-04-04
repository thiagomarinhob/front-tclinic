'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createPatientAction, updatePatientAction } from '@/actions/patient-actions';
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
import { Loader2, User, MapPin, Heart, Users } from 'lucide-react';
import { useState } from 'react';
import type { Patient } from '@/types';
import { Gender } from '@/types/auth.types';

const patientFormSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional().refine(
    (val) => !val || /^\d{11}$/.test(val.replace(/\D/g, '')),
    'CPF deve ter 11 dígitos'
  ),
  birthDate: z.string().optional().refine(
    (val) => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val),
    'Data deve estar no formato DD/MM/AAAA'
  ),
  gender: z.nativeEnum(Gender).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZipcode: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  healthPlan: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelationship: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  patient?: Patient;
  /** Chamado ao salvar com sucesso. No create, recebe o paciente criado. */
  onSuccess?: (patient?: Patient) => void;
}

// Funções de formatação para valores iniciais
function formatInitialCPF(cpf: string | undefined): string {
  if (!cpf) return '';
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

function formatInitialPhone(phone: string | undefined): string {
  if (!phone) return '';
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return phone;
}

function formatInitialCEP(cep: string | undefined): string {
  if (!cep) return '';
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length !== 8) return cep;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!patient;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: patient?.fullName || '',
      cpf: formatInitialCPF(patient?.cpf),
      birthDate: patient?.birthDate || '',
      gender: patient?.gender as Gender | undefined,
      email: patient?.email || '',
      phone: formatInitialPhone(patient?.phone),
      whatsapp: formatInitialPhone(patient?.whatsapp),
      addressStreet: patient?.addressStreet || '',
      addressNumber: patient?.addressNumber || '',
      addressComplement: patient?.addressComplement || '',
      addressNeighborhood: patient?.addressNeighborhood || '',
      addressCity: patient?.addressCity || '',
      addressState: patient?.addressState || '',
      addressZipcode: formatInitialCEP(patient?.addressZipcode),
      bloodType: patient?.bloodType || '',
      allergies: patient?.allergies || '',
      healthPlan: patient?.healthPlan || '',
      guardianName: patient?.guardianName || '',
      guardianPhone: formatInitialPhone(patient?.guardianPhone),
      guardianRelationship: patient?.guardianRelationship || '',
    },
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const onSubmit = async (data: PatientFormData) => {
    if (!user?.clinicId) {
      toast.error('Erro: Clínica não identificada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        ...data,
        tenantId: user.clinicId,
        cpf: data.cpf?.replace(/\D/g, '') || undefined,
        phone: data.phone?.replace(/\D/g, '') || undefined,
        whatsapp: data.whatsapp?.replace(/\D/g, '') || undefined,
        addressZipcode: data.addressZipcode?.replace(/\D/g, '') || undefined,
        email: data.email || undefined,
        bloodType: data.bloodType?.trim() || undefined,
      };

      let result;

      if (isEditing && patient) {
        result = await updatePatientAction(patient.id, requestData);
      } else {
        result = await createPatientAction(requestData);
      }

      if (result.success) {
        // Invalidar todas as queries de pacientes para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        
        toast.success(
          isEditing
            ? 'Paciente atualizado com sucesso!'
            : 'Paciente cadastrado com sucesso!'
        );
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push('/patients');
        }
      } else {
        toast.error(result.error || 'Erro ao salvar paciente');
      }
    } catch (error) {
      toast.error('Erro inesperado ao salvar paciente');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              placeholder="Nome completo do paciente"
              {...register('fullName')}
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              {...register('cpf')}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                setValue('cpf', formatted);
              }}
              maxLength={14}
              className={errors.cpf ? 'border-red-500' : ''}
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
              {...register('birthDate')}
              onChange={(e) => {
                const formatted = formatDate(e.target.value);
                setValue('birthDate', formatted);
              }}
              maxLength={10}
              className={errors.birthDate ? 'border-red-500' : ''}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-500">{errors.birthDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Sexo</Label>
            <Select
              value={watch('gender') || ''}
              onValueChange={(value) => setValue('gender', value as Gender)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Gender.MASCULINO}>Masculino</SelectItem>
                <SelectItem value={Gender.FEMININO}>Feminino</SelectItem>
                <SelectItem value={Gender.OUTRO}>Outro</SelectItem>
                <SelectItem value={Gender.NAO_INFORMADO}>Prefiro não informar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              {...register('phone')}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setValue('phone', formatted);
              }}
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="(00) 00000-0000"
              {...register('whatsapp')}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setValue('whatsapp', formatted);
              }}
              maxLength={15}
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="addressZipcode">CEP</Label>
            <Input
              id="addressZipcode"
              placeholder="00000-000"
              {...register('addressZipcode')}
              onChange={(e) => {
                const formatted = formatCEP(e.target.value);
                setValue('addressZipcode', formatted);
              }}
              maxLength={9}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressStreet">Rua</Label>
            <Input
              id="addressStreet"
              placeholder="Nome da rua"
              {...register('addressStreet')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressNumber">Número</Label>
            <Input
              id="addressNumber"
              placeholder="Número"
              {...register('addressNumber')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressComplement">Complemento</Label>
            <Input
              id="addressComplement"
              placeholder="Apto, Bloco..."
              {...register('addressComplement')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressNeighborhood">Bairro</Label>
            <Input
              id="addressNeighborhood"
              placeholder="Bairro"
              {...register('addressNeighborhood')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressCity">Cidade</Label>
            <Input
              id="addressCity"
              placeholder="Cidade"
              {...register('addressCity')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressState">Estado</Label>
            <Select
              value={watch('addressState') || ''}
              onValueChange={(value) => setValue('addressState', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="UF" />
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

      {/* Informações de Saúde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5" />
            Informações de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
            <Select
              value={watch('bloodType') || ''}
              onValueChange={(value) => setValue('bloodType', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A_POSITIVE">A+</SelectItem>
                <SelectItem value="A_NEGATIVE">A-</SelectItem>
                <SelectItem value="B_POSITIVE">B+</SelectItem>
                <SelectItem value="B_NEGATIVE">B-</SelectItem>
                <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                <SelectItem value="O_POSITIVE">O+</SelectItem>
                <SelectItem value="O_NEGATIVE">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthPlan">Plano de Saúde</Label>
            <Input
              id="healthPlan"
              placeholder="Ex: Unimed Nacional, Bradesco Saúde..."
              {...register('healthPlan')}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              placeholder="Descreva as alergias do paciente..."
              {...register('allergies')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Responsável (para menores de idade) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Responsável (Menor de Idade)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Nome do Responsável</Label>
            <Input
              id="guardianName"
              placeholder="Nome completo"
              {...register('guardianName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Telefone do Responsável</Label>
            <Input
              id="guardianPhone"
              placeholder="(00) 00000-0000"
              {...register('guardianPhone')}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setValue('guardianPhone', formatted);
              }}
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianRelationship">Parentesco</Label>
            <Select
              value={watch('guardianRelationship') || ''}
              onValueChange={(value) => setValue('guardianRelationship', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAI">Pai</SelectItem>
                <SelectItem value="MAE">M\u00e3e</SelectItem>
                <SelectItem value="AVO">Av\u00f4/Av\u00f3</SelectItem>
                <SelectItem value="TIO">Tio/Tia</SelectItem>
                <SelectItem value="IRMAO">Irm\u00e3o/Irm\u00e3</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bot\u00f5es de A\u00e7\u00e3o */}
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
          {isEditing ? 'Salvar Altera\u00e7\u00f5es' : 'Cadastrar Paciente'}
        </Button>
      </div>
    </form>
  );
}
