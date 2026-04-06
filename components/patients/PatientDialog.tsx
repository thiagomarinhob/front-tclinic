'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createPatientAction, updatePatientAction } from '@/actions/patient-actions';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, User, MapPin, Heart, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Patient } from '@/types';
import { Gender } from '@/types/auth.types';

const patientFormSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  motherName: z.string().optional(),
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
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelationship: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  onSuccess?: (patient?: Patient) => void;
}

// Funções de formatação
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

export function PatientDialog({ open, onOpenChange, patient, onSuccess }: PatientDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!patient;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
  });

  // Reset form when dialog opens/closes or patient changes
  useEffect(() => {
    if (open) {
      reset({
        fullName: patient?.fullName || '',
        motherName: patient?.motherName || '',
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
        guardianName: patient?.guardianName || '',
        guardianPhone: formatInitialPhone(patient?.guardianPhone),
        guardianRelationship: patient?.guardianRelationship || '',
      });
    }
  }, [open, patient, reset]);

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

  const fetchAddressByCep = async (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue('addressCity', data.localidade);
        setValue('addressState', data.uf);
      }
    } catch {
      // silencia erros de rede
    }
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
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        toast.success(
          isEditing
            ? 'Paciente atualizado com sucesso!'
            : 'Paciente cadastrado com sucesso!'
        );
        onOpenChange(false);
        onSuccess?.(result.data);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do paciente.'
              : 'Preencha os dados para cadastrar um novo paciente.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <form id="patient-dialog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Dados Pessoais
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
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

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="motherName">Nome da Mãe</Label>
                  <Input
                    id="motherName"
                    placeholder="Nome completo da mãe"
                    {...register('motherName')}
                  />
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
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Endereço
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="addressZipcode">CEP</Label>
                  <Input
                    id="addressZipcode"
                    placeholder="00000-000"
                    {...register('addressZipcode')}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value);
                      setValue('addressZipcode', formatted);
                      fetchAddressByCep(formatted);
                    }}
                    maxLength={9}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
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
              </div>
            </div>

            <Separator />

            {/* Informações de Saúde */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Heart className="h-4 w-4" />
                Informações de Saúde
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    placeholder="Descreva as alergias do paciente..."
                    {...register('allergies')}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Responsável */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Users className="h-4 w-4" />
                Responsável (Menor de Idade)
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                      <SelectItem value="MAE">Mãe</SelectItem>
                      <SelectItem value="AVO">Avô/Avó</SelectItem>
                      <SelectItem value="TIO">Tio/Tia</SelectItem>
                      <SelectItem value="IRMAO">Irmão/Irmã</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

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
            form="patient-dialog-form"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Cadastrar Paciente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
