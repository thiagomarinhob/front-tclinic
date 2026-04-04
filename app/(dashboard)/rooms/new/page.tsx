import { Metadata } from 'next';
import { RoomForm } from '@/components/rooms/RoomForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Nova Sala - TClinic',
};

export default function NewRoomPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/rooms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nova Sala</h2>
          <p className="text-muted-foreground">
            Cadastre uma nova sala de atendimento
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Sala</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm />
        </CardContent>
      </Card>
    </div>
  );
}