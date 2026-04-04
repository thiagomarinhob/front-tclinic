'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import type { CreatePatientRequest, Patient } from '@/types';

export type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PatientForm({ patient, onSubmit, isLoading }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register('cpf')}
                placeholder="000.000.000-00"
                disabled={isLoading}
              />
              {errors.cpf && (
                <p className="text-sm text-red-500">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                {...register('rg')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <DatePicker
                id="birthDate"
                value={watch('birthDate') || ''}
                onChange={(value) => setValue('birthDate', value)}
                placeholder="Selecione a data"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                onValueChange={(value) => setValue('gender', value as any)}
                defaultValue={patient?.gender}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMININO">Feminino</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                  <SelectItem value="NAO_INFORMADO">Não informado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
              <Input
                id="bloodType"
                {...register('bloodType')}
                placeholder="A+, O-, etc"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(00) 0000-0000"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                {...register('whatsapp')}
                placeholder="(00) 00000-0000"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="addressStreet">Rua</Label>
              <Input
                id="addressStreet"
                {...register('addressStreet')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                {...register('addressNumber')}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressComplement">Complemento</Label>
              <Input
                id="addressComplement"
                {...register('addressComplement')}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressNeighborhood">Bairro</Label>
              <Input
                id="addressNeighborhood"
                {...register('addressNeighborhood')}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressCity">Cidade</Label>
              <Input
                id="addressCity"
                {...register('addressCity')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressState">Estado</Label>
              <Input
                id="addressState"
                {...register('addressState')}
                placeholder="UF"
                maxLength={2}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressZipcode">CEP</Label>
              <Input
                id="addressZipcode"
                {...register('addressZipcode')}
                placeholder="00000-000"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Médicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Médicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              {...register('allergies')}
              placeholder="Descreva alergias conhecidas..."
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Responsável (para menores) */}
      <Card>
        <CardHeader>
          <CardTitle>Responsável (se menor de idade)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Nome do Responsável</Label>
              <Input
                id="guardianName"
                {...register('guardianName')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Telefone</Label>
              <Input
                id="guardianPhone"
                {...register('guardianPhone')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianRelationship">Parentesco</Label>
              <Input
                id="guardianRelationship"
                {...register('guardianRelationship')}
                placeholder="Mãe, Pai, etc"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {patient ? 'Atualizar' : 'Cadastrar'} Paciente
        </Button>
      </div>
    </form>
  );
}