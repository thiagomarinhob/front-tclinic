'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { signUpClinicSchema, signUpSoloSchema } from '@/lib/validators';
import { signUpClinicOwnerAction, signUpSoloAction } from '@/actions/signup-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Building2, UserCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ROUTES } from '@/config/constants';
import type { SignUpClinicOwnerRequest, SignUpSoloRequest } from '@/types';
import { z } from 'zod';

type SignUpType = 'clinic' | 'solo';

type ClinicFormData = z.infer<typeof signUpClinicSchema>;
type SoloFormData = z.infer<typeof signUpSoloSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SignUpType>('clinic');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clinicForm = useForm<ClinicFormData>({
    resolver: zodResolver(signUpClinicSchema),
  });

  const soloForm = useForm<SoloFormData>({
    resolver: zodResolver(signUpSoloSchema),
  });

  const onSubmitClinic = async (data: ClinicFormData) => {
    try {
      setIsLoading(true);
      const result = await signUpClinicOwnerAction(data as SignUpClinicOwnerRequest);

      if (!result.success) {
        toast.error(result.error || 'Erro ao cadastrar clínica');
        return;
      }

      setSuccess(true);
      toast.success('Clínica cadastrada com sucesso!');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 2000);
    } catch {
      toast.error('Erro ao cadastrar clínica');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSolo = async (data: SoloFormData) => {
    try {
      setIsLoading(true);
      const result = await signUpSoloAction(data as SignUpSoloRequest);

      if (!result.success) {
        toast.error(result.error || 'Erro ao cadastrar profissional');
        return;
      }

      setSuccess(true);
      toast.success('Profissional cadastrado com sucesso!');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 2000);
    } catch {
      toast.error('Erro ao cadastrar profissional');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      clinicForm.setValue('cnpj', numbers);
    }
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      soloForm.setValue('cpf', numbers);
    }
  };

  // Função para formatar telefone: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
  const formatPhone = (value: string, form: typeof clinicForm | typeof soloForm) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    let formatted = numbers;
    if (numbers.length > 2) {
      formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }
    if (numbers.length > 7) {
      const split = numbers.length === 11 ? 7 : 6;
      formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, split)}-${numbers.slice(split)}`;
    }
    if (form === clinicForm) {
      clinicForm.setValue('phone', formatted);
    } else {
      soloForm.setValue('phone', formatted);
    }
  };

  // Função para formatar subdomínio (apenas minúsculas, números e hífens)
  const formatSubdomain = (value: string, form: typeof clinicForm | typeof soloForm) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (form === clinicForm) {
      clinicForm.setValue('subdomain', formatted);
    } else {
      soloForm.setValue('subdomain', formatted);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Cadastro realizado com sucesso!</h2>
            <p className="text-muted-foreground mb-4">
              Você será redirecionado para a página de login...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex justify-center mb-2">
          <Image src="/LogoFull.png" alt="TClinic" width={180} height={60} className="object-contain" />
        </div>
        <CardTitle className="text-2xl text-center">Criar Conta no TClinic</CardTitle>
        <CardDescription className="text-center">
          Escolha o tipo de cadastro e preencha os dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SignUpType)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="clinic" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Clínica
            </TabsTrigger>
            <TabsTrigger value="solo" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Profissional Solo
            </TabsTrigger>
          </TabsList>

          {/* Formulário de Clínica */}
          <TabsContent value="clinic">
            <form onSubmit={clinicForm.handleSubmit(onSubmitClinic)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados da Clínica */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Dados da Clínica</h3>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="clinic-name">Nome da Clínica *</Label>
                  <Input
                    id="clinic-name"
                    {...clinicForm.register('name')}
                    disabled={isLoading}
                    placeholder="Clínica Médica São Paulo"
                  />
                  {clinicForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {clinicForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-email">Email *</Label>
                  <Input
                    id="clinic-email"
                    type="email"
                    {...clinicForm.register('email')}
                    disabled={isLoading}
                    placeholder="contato@clinicamedica.com.br"
                  />
                  {clinicForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {clinicForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-password">Senha *</Label>
                  <Input
                    id="clinic-password"
                    type="password"
                    {...clinicForm.register('password')}
                    disabled={isLoading}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {clinicForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {clinicForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-cnpj">CNPJ *</Label>
                  <Input
                    id="clinic-cnpj"
                    {...clinicForm.register('cnpj')}
                    disabled={isLoading}
                    placeholder="12345678000190"
                    maxLength={14}
                    onChange={(e) => formatCNPJ(e.target.value)}
                  />
                  {clinicForm.formState.errors.cnpj && (
                    <p className="text-sm text-red-500">
                      {clinicForm.formState.errors.cnpj.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-subdomain">Subdomínio *</Label>
                  <Input
                    id="clinic-subdomain"
                    {...clinicForm.register('subdomain')}
                    disabled={isLoading}
                    placeholder="clinicamedica-sp"
                    onChange={(e) => formatSubdomain(e.target.value, clinicForm)}
                  />
                  {clinicForm.formState.errors.subdomain && (
                    <p className="text-sm text-red-500">
                      {clinicForm.formState.errors.subdomain.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Apenas letras minúsculas, números e hífens
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Telefone</Label>
                  <Input
                    id="clinic-phone"
                    {...clinicForm.register('phone')}
                    disabled={isLoading}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    onChange={(e) => formatPhone(e.target.value, clinicForm)}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="clinic-address">Endereço</Label>
                  <Input
                    id="clinic-address"
                    {...clinicForm.register('address')}
                    disabled={isLoading}
                    placeholder="Rua das Flores, 123, Centro, São Paulo - SP"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar Clínica
              </Button>
            </form>
          </TabsContent>

          {/* Formulário de Profissional Solo */}
          <TabsContent value="solo">
            <form onSubmit={soloForm.handleSubmit(onSubmitSolo)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados Pessoais */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Dados Pessoais</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="solo-firstName">Nome *</Label>
                  <Input
                    id="solo-firstName"
                    {...soloForm.register('firstName')}
                    disabled={isLoading}
                    placeholder="Ana"
                  />
                  {soloForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-lastName">Sobrenome *</Label>
                  <Input
                    id="solo-lastName"
                    {...soloForm.register('lastName')}
                    disabled={isLoading}
                    placeholder="Costa"
                  />
                  {soloForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-email">Email *</Label>
                  <Input
                    id="solo-email"
                    type="email"
                    {...soloForm.register('email')}
                    disabled={isLoading}
                    placeholder="ana@doutorana.com.br"
                  />
                  {soloForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-password">Senha *</Label>
                  <Input
                    id="solo-password"
                    type="password"
                    {...soloForm.register('password')}
                    disabled={isLoading}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {soloForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-birthDate">Data de Nascimento *</Label>
                  <Input
                    id="solo-birthDate"
                    {...soloForm.register('birthDate')}
                    disabled={isLoading}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2);
                      }
                      if (value.length >= 5) {
                        value = value.slice(0, 5) + '/' + value.slice(5, 9);
                      }
                      soloForm.setValue('birthDate', value);
                    }}
                  />
                  {soloForm.formState.errors.birthDate && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.birthDate.message}
                    </p>
                  )}
                </div>

                {/* Dados Profissionais */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-3 text-green-600">Dados Profissionais</h3>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="solo-name">Nome do Consultório/Clínica *</Label>
                  <Input
                    id="solo-name"
                    {...soloForm.register('name')}
                    disabled={isLoading}
                    placeholder="Dr. Ana Costa - Cardiologia"
                  />
                  {soloForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-cpf">CPF *</Label>
                  <Input
                    id="solo-cpf"
                    {...soloForm.register('cpf')}
                    disabled={isLoading}
                    placeholder="12345678901"
                    maxLength={11}
                    onChange={(e) => formatCPF(e.target.value)}
                  />
                  {soloForm.formState.errors.cpf && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.cpf.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-subdomain">Subdomínio *</Label>
                  <Input
                    id="solo-subdomain"
                    {...soloForm.register('subdomain')}
                    disabled={isLoading}
                    placeholder="doutorana"
                    onChange={(e) => formatSubdomain(e.target.value, soloForm)}
                  />
                  {soloForm.formState.errors.subdomain && (
                    <p className="text-sm text-red-500">
                      {soloForm.formState.errors.subdomain.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Apenas letras minúsculas, números e hífens
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solo-phone">Telefone</Label>
                  <Input
                    id="solo-phone"
                    {...soloForm.register('phone')}
                    disabled={isLoading}
                    placeholder="(21) 99876-5432"
                    maxLength={15}
                    onChange={(e) => formatPhone(e.target.value, soloForm)}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="solo-address">Endereço</Label>
                  <Input
                    id="solo-address"
                    {...soloForm.register('address')}
                    disabled={isLoading}
                    placeholder="Rua dos Médicos, 456, Jardim das Flores, Rio de Janeiro - RJ"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar Profissional
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <a href={ROUTES.LOGIN} className="text-primary hover:underline">
              Faça login
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
