'use client'

import { useRoom } from '@/hooks/useRooms';
import { RoomForm } from './RoomForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface RoomEditFormProps {
  roomId: string;
}

export function RoomEditForm({ roomId }: RoomEditFormProps) {
  const { data: room, isLoading } = useRoom(roomId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!room) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Sala não encontrada</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Sala</CardTitle>
      </CardHeader>
      <CardContent>
        <RoomForm room={room} />
      </CardContent>
    </Card>
  );
}