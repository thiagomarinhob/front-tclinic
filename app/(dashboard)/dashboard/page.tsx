import { Metadata } from 'next';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { TodayAppointments } from '@/components/dashboard/TodayAppointments';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { getTodayAppointmentsAction } from '@/actions/appointment-actions';
import { getAllPatientsAction } from '@/actions/patient-actions';
import { getClinicIdFromToken } from '@/actions/_helpers';
import type { Appointment } from '@/types';

export const metadata: Metadata = {
  title: 'Dashboard - TClinic',
};

export default async function DashboardPage() {
  const tenantId = await getClinicIdFromToken();

  const [todayResult, activePatientsResult] = await Promise.all([
    getTodayAppointmentsAction(),
    tenantId ? getAllPatientsAction(tenantId, 0, 1, { active: true }) : Promise.resolve({ success: false as const, error: '' }),
  ]);

  const todayAppointments: Appointment[] = todayResult.success ? (todayResult.data ?? []) : [];
  const activePatientsTotal = activePatientsResult.success ? (activePatientsResult.data?.totalElements ?? 0) : 0;

  const finalizados = todayAppointments.filter((a) => a.status === 'FINALIZADO').length;
  const aguardando = todayAppointments.filter((a) => a.status === 'AGENDADO' || a.status === 'EM_ATENDIMENTO').length;

  // Pacientes únicos dos agendamentos de hoje (deduplicados por ID)
  const seenIds = new Set<string>();
  const recentPatients = todayAppointments
    .filter((a) => {
      if (seenIds.has(a.patient.id)) return false;
      seenIds.add(a.patient.id);
      return true;
    })
    .map((a) => ({
      id: a.patient.id,
      name: a.patient.fullName,
      lastVisit: new Date(a.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }));

  return (
    <div className="space-y-6">
      <DashboardStats
        activePatientsTotal={activePatientsTotal}
        todayTotal={todayAppointments.length}
        finalizados={finalizados}
        aguardando={aguardando}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <TodayAppointments appointments={todayAppointments} />
        <RecentPatients patients={recentPatients} />
      </div>
    </div>
  );
}
