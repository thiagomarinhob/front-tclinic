import { z } from 'zod';

// Login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Set Password
export const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

// Patient
export const patientSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO']).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().max(2).optional(),
  addressZipcode: z.string().optional(),
  
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelationship: z.string().optional(),
});

// Appointment
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  professionalId: z.string().min(1, 'Profissional é obrigatório'),
  roomId: z.string().optional(),
  scheduledAt: z.string().min(1, 'Data e hora são obrigatórias'),
  durationMinutes: z.number().min(15).max(480).default(60),
  observations: z.string().optional(),
  procedures: z.array(z.object({
    name: z.string().min(1, 'Nome do procedimento é obrigatório'),
    description: z.string().optional(),
    value: z.number().min(0, 'Valor deve ser positivo'),
    quantity: z.number().min(1, 'Quantidade deve ser pelo menos 1').default(1),
  })).optional(),
});

// User
export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  role: z.enum(['ADMIN_CLINIC', 'PROFISSIONAL_SAUDE', 'RECEPCIONISTA']),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO']).optional(),
});

// Professional
export const professionalSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  specialty: z.enum([
    'CARDIOLOGISTA', 'CLINICO_GERAL', 'DENTISTA', 'DERMATOLOGISTA',
    'ENDOCRINOLOGISTA', 'ENFERMEIRO', 'FISIOTERAPEUTA', 'GASTROENTEROLOGISTA',
    'GINECOLOGISTA', 'MASTOLOGISTA', 'OBSTETRIACO', 'OFTALMOLOGISTA',
    'PEDIATRA', 'PSICOLOGISTA', 'PSIQUIATRA', 'UROLOGISTA',
  ], { message: 'Especialidade é obrigatória' }),
  documentType: z.enum(['CRM', 'CREFITO', 'CRO', 'CRP', 'CRN', 'COREN', 'OUTRO']),
  documentNumber: z.string().min(1, 'Número do documento é obrigatório'),
  documentState: z.string().max(2).optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

// Professional with User (novo formulário combinado)
export const professionalWithUserSchema = z.object({
  // User fields
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50, 'Nome deve ter no máximo 50 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres').max(50, 'Sobrenome deve ter no máximo 50 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação de senha é obrigatória'),
  phone: z.string().optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido').optional().or(z.literal('')),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data de nascimento deve estar no formato DD/MM/YYYY').optional().or(z.literal('')),
  
  // Professional fields
  specialty: z.enum([
    'CARDIOLOGISTA', 'CLINICO_GERAL', 'DENTISTA', 'DERMATOLOGISTA',
    'ENDOCRINOLOGISTA', 'ENFERMEIRO', 'FISIOTERAPEUTA', 'GASTROENTEROLOGISTA',
    'GINECOLOGISTA', 'MASTOLOGISTA', 'OBSTETRIACO', 'OFTALMOLOGISTA',
    'PEDIATRA', 'PSICOLOGISTA', 'PSIQUIATRA', 'UROLOGISTA',
  ], { message: 'Especialidade é obrigatória' }),
  documentType: z.enum(['CRM', 'CREFITO', 'CRO', 'CRP', 'CRN', 'COREN', 'OUTRO']),
  documentNumber: z.string().min(1, 'Número do documento é obrigatório'),
  documentState: z.string().max(2).optional(),
  bio: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

// Room
export const roomSchema = z.object({
  name: z.string().min(1, 'Nome da sala é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  capacity: z.number().min(1, 'Capacidade mínima é 1').max(100, 'Capacidade máxima é 100').optional(),
});

// SignUp - Clínica
export const signUpClinicSchema = z.object({
  // User fields (email e senha para acesso)
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  
  // Tenant fields
  name: z.string().min(2, 'Nome da clínica deve ter no mínimo 2 caracteres').max(100, 'Nome da clínica deve ter no máximo 100 caracteres'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve conter exatamente 14 dígitos'),
  planType: z.string().max(100, 'Tipo de plano deve ter no máximo 100 caracteres').optional(),
  address: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  subdomain: z.string()
    .min(3, 'Subdomínio deve ter no mínimo 3 caracteres')
    .max(64, 'Subdomínio deve ter no máximo 64 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens'),
});

// SignUp - Médico Solo
export const signUpSoloSchema = z.object({
  // User fields
  firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50, 'Nome deve ter no máximo 50 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres').max(50, 'Sobrenome deve ter no máximo 50 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data de nascimento deve estar no formato DD/MM/YYYY'),
  
  // Tenant fields
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter exatamente 11 dígitos'),
  planType: z.string().max(100, 'Tipo de plano deve ter no máximo 100 caracteres').optional(),
  address: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional(),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  subdomain: z.string()
    .min(3, 'Subdomínio deve ter no mínimo 3 caracteres')
    .max(64, 'Subdomínio deve ter no máximo 64 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens'),
});