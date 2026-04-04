import { Metadata } from 'next';
import { RoomList } from '@/components/rooms/RoomList';
import { NewRoomButton } from '@/components/rooms/NewRoomButton';

export const metadata: Metadata = {
  title: 'Configurações — Clínica',
};

export default function SettingsClinicaPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clínica</h1>
        <p className="text-muted-foreground">Configurações gerais da clínica</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Salas de Atendimento</p>
            <p className="text-sm text-muted-foreground">
              Gerencie as salas disponíveis para agendamento
            </p>
          </div>
          <NewRoomButton />
        </div>
        <RoomList />
      </div>
    </div>
  );
}
