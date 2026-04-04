import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

interface RecentPatient {
  id: string;
  name: string;
  lastVisit: string;
}

interface RecentPatientsProps {
  patients: RecentPatient[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RecentPatients({ patients }: RecentPatientsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Pacientes Atendidos Hoje
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.PATIENTS}>Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {patients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum paciente atendido hoje
            </p>
          ) : (
            patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{patient.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Horário: {patient.lastVisit}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`${ROUTES.PATIENTS}/${patient.id}`}>Ver</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
