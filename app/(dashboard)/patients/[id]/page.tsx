'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPatientByIdAction, deletePatientAction } from '@/actions/patient-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  MapPin,
  Heart,
  Users,
  Phone,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Patient } from '@/types';
import { Gender } from '@/types/auth.types';

const genderLabels: Record<string, string> = {
  [Gender.MASCULINO]: 'Masculino',
  [Gender.FEMININO]: 'Feminino',
  [Gender.OUTRO]: 'Outro',
  [Gender.NAO_INFORMADO]: 'Não informado',
};

const bloodTypeLabels: Record<string, string> = {
  'A_POSITIVE': 'A+',
  'A_NEGATIVE': 'A-',
  'B_POSITIVE': 'B+',
  'B_NEGATIVE': 'B-',
  'AB_POSITIVE': 'AB+',
  'AB_NEGATIVE': 'AB-',
  'O_POSITIVE': 'O+',
  'O_NEGATIVE': 'O-',
};

const relationshipLabels: Record<string, string> = {
  'PAI': 'Pai',
  'MAE': 'Mãe',
  'AVO': 'Avô/Avó',
  'TIO': 'Tio/Tia',
  'IRMAO': 'Irmão/Irmã',
  'OUTRO': 'Outro',
};

function formatCPF(cpf: string | undefined): string {
  if (!cpf) return '-';
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return '-';
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return phone;
}

function formatCEP(cep: string | undefined): string {
  if (!cep) return '-';
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length !== 8) return cep;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

function InfoItem({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadPatient() {
      try {
        const result = await getPatientByIdAction(patientId);
        if (result.success && result.data) {
          setPatient(result.data);
        } else {
          toast.error(result.error || 'Paciente não encontrado');
          router.push('/patients');
        }
      } catch {
        toast.error('Erro ao carregar dados do paciente');
        router.push('/patients');
      } finally {
        setIsLoading(false);
      }
    }

    if (patientId) {
      loadPatient();
    }
  }, [patientId, router]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;

    setIsDeleting(true);
    try {
      const result = await deletePatientAction(patientId);
      if (result.success) {
        toast.success('Paciente excluído com sucesso');
        router.push('/patients');
      } else {
        toast.error(result.error || 'Erro ao excluir paciente');
      }
    } catch {
      toast.error('Erro ao excluir paciente');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  const fullAddress = [
    patient.addressStreet,
    patient.addressNumber && `Nº ${patient.addressNumber}`,
    patient.addressComplement,
    patient.addressNeighborhood,
    patient.addressCity,
    patient.addressState,
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{patient.fullName}</h2>
              {!patient.isActive && (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Cadastrado em {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/patients/${patientId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Nome Completo" value={patient.fullName} />
          <InfoItem label="CPF" value={formatCPF(patient.cpf)} />
          <InfoItem label="Data de Nascimento" value={patient.birthDate} />
          <InfoItem
            label="Sexo"
            value={patient.gender ? genderLabels[patient.gender] : undefined}
          />
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem label="Email" value={patient.email} />
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem label="Telefone" value={formatPhone(patient.phone)} />
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem label="WhatsApp" value={formatPhone(patient.whatsapp)} />
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
          <InfoItem label="CEP" value={formatCEP(patient.addressZipcode)} />
          <div className="sm:col-span-2 lg:col-span-3">
            <InfoItem label="Endereço Completo" value={fullAddress || '-'} />
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
          <InfoItem
            label="Tipo Sanguíneo"
            value={patient.bloodType ? bloodTypeLabels[patient.bloodType] : undefined}
          />
          <div className="sm:col-span-2">
            <InfoItem label="Alergias" value={patient.allergies} />
          </div>
          <div className="sm:col-span-2">
            <InfoItem label="Plano de Sáude" value={patient.healthPlan} />
          </div>
        </CardContent>
      </Card>

      {/* Responsável */}
      {(patient.guardianName || patient.guardianPhone || patient.guardianRelationship) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <InfoItem label="Nome" value={patient.guardianName} />
            <InfoItem label="Telefone" value={formatPhone(patient.guardianPhone)} />
            <InfoItem
              label="Parentesco"
              value={patient.guardianRelationship ? relationshipLabels[patient.guardianRelationship] : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
