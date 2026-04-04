'use client'

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentCalendar } from './AppointmentCalendar';
import { ProfessionalAppointmentsTable } from './ProfessionalAppointmentsTable';
import { AppointmentTable } from './AppointmentTable';
import { useProfessionalsByCurrentClinic } from '@/hooks/useProfessionals';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getProfessionalByUserIdAction } from '@/actions/professional-actions';
import { Calendar, Users, List } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function AppointmentTabs() {
  const { professionals, isLoading } = useProfessionalsByCurrentClinic(0, 100);
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('calendar');
  const [professionalId, setProfessionalId] = useState<string | undefined>(undefined);
  // Começa como true para bloquear o primeiro render antes de saber o ID do profissional
  const [isProfessionalIdLoading, setIsProfessionalIdLoading] = useState(true);

  const isProfessional = user?.role === UserRole.PROFISSIONAL_SAUDE;

  useEffect(() => {
    // Aguarda o usuário ser carregado pelo contexto de autenticação
    if (!user) return;

    if (isProfessional && user.id) {
      getProfessionalByUserIdAction(user.id).then((result) => {
        if (result.success && result.data) {
          setProfessionalId(result.data.id);
        }
        setIsProfessionalIdLoading(false);
      });
    } else {
      // Usuário não é profissional — não precisa buscar ID de profissional
      setIsProfessionalIdLoading(false);
    }
  }, [isProfessional, user?.id]);

  if (isLoading || isProfessionalIdLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground gap-1">
        <TabsTrigger
          value="calendar"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Calendário Geral</span>
          <span className="sm:hidden">Geral</span>
        </TabsTrigger>
        {!isProfessional && (
          <TabsTrigger
            value="professionals"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Por Profissional</span>
            <span className="sm:hidden">Profissional</span>
          </TabsTrigger>
        )}
        <TabsTrigger
          value="list"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
        >
          <List className="h-4 w-4" />
          <span>Lista</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" className="space-y-4">
        <AppointmentCalendar professionalId={professionalId} />
      </TabsContent>

      {!isProfessional && (
        <TabsContent value="professionals" className="space-y-4">
          {professionals && professionals.length > 0 ? (
            <ProfessionalAppointmentsTable professionals={professionals} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum profissional cadastrado
            </div>
          )}
        </TabsContent>
      )}

      <TabsContent value="list" className="space-y-4">
        <AppointmentTable professionalId={professionalId} />
      </TabsContent>
    </Tabs>
  );
}