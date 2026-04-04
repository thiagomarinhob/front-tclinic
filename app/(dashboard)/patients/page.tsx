import { Metadata } from 'next';
import { PatientList } from '@/components/patients/PatientList';
import { NewPatientButton } from '@/components/patients/NewPatientButton';

export const metadata: Metadata = {
  title: 'Pacientes - TClinic',
};

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">
            Gerencie os pacientes da clínica
          </p>
        </div>
        <NewPatientButton />
      </div>

      <PatientList />
    </div>
  );
}