'use client'

import { useRoom } from '@/hooks/useRooms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoomDetailsProps {
  roomId: string;
}

export function RoomDetails({ roomId }: RoomDetailsProps) {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <DoorOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{room.name}</CardTitle>
              {room.isActive ? (
                <Badge variant="default" className="mt-2">Ativa</Badge>
              ) : (
                <Badge variant="secondary" className="mt-2">Inativa</Badge>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/rooms/${room.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descrição */}
          {room.description && (
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-muted-foreground">{room.description}</p>
            </div>
          )}

          {/* Capacidade */}
          {room.capacity && (
            <div>
              <h3 className="font-semibold mb-2">Capacidade</h3>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{room.capacity} pessoa(s)</span>
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="pt-4 border-t">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>
                  {format(new Date(room.createdAt), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última atualização:</span>
                <span>
                  {format(new Date(room.updatedAt), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}