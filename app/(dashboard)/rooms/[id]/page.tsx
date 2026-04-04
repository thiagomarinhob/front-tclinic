import { Metadata } from 'next';
import { RoomDetails } from '@/components/rooms/RoomDetails';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Detalhes da Sala - TClinic',
};

interface RoomPageProps {
  params: {
    id: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/rooms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Detalhes da Sala</h2>
          <p className="text-muted-foreground">
            Visualize as informações da sala
          </p>
        </div>
      </div>

      <RoomDetails roomId={params.id} />
    </div>
  );
}