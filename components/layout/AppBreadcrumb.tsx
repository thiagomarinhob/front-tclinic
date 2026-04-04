'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Pacientes',
  exams: 'Exames',
  appointments: 'Agendamentos',
  'medical-records': 'Prontuários',
  professionals: 'Profissionais',
  procedures: 'Procedimentos',
  users: 'Usuários',
  rooms: 'Salas',
  financial: 'Financeiro',
  settings: 'Configurações',
  clinica: 'Clínica',
  prontuarios: 'Prontuários',
  documentos: 'Documentos',
  'medical-record-templates': 'Templates de Prontuário',
  attendance: 'Atendimento',
  new: 'Novo',
  edit: 'Editar',
};

function isDynamicSegment(segment: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment);
}

function getSegmentLabel(segment: string): string {
  if (isDynamicSegment(segment)) return 'Detalhes';
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => ({
    href: '/' + segments.slice(0, index + 1).join('/'),
    label: getSegmentLabel(segment),
  }));

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">TClinic</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
