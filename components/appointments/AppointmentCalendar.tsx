'use client'

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernCalendar } from './ModernCalendar';
import { MonthView } from './MonthView';
import { Calendar, Grid } from 'lucide-react';

interface AppointmentCalendarProps {
  professionalId?: string;
}

export function AppointmentCalendar({ professionalId }: AppointmentCalendarProps) {
  const [view, setView] = useState<'week' | 'month'>('week');

  return (
    <div className="space-y-4">
      {/* Seletor de visualização */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'month')}>
        <TabsList>
          <TabsTrigger value="week" className="gap-2">
            <Calendar className="h-4 w-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2">
            <Grid className="h-4 w-4" />
            Mês
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-4">
          <ModernCalendar professionalId={professionalId} />
        </TabsContent>

        <TabsContent value="month" className="mt-4">
          <MonthView professionalId={professionalId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}