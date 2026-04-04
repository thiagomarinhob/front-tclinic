import { Metadata } from 'next';
import { RoomEditForm } from '@/components/rooms/RoomEditForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Editar Sala - TClinic',
};

interface EditRoomPageProps {
  params: {
    id: string;
  };
}

export default function EditRoomPage({ params }: EditRoomPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/rooms/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Sala</h2>
          <p className="text-muted-foreground">
            Atualize as informações da sala
          </p>
        </div>
      </div>

      <RoomEditForm roomId={params.id} />
    </div>
  );
}