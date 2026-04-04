'use client'

import { useEffect, useState } from 'react';
import { getRoomsByTenantAction } from '@/actions/room-actions';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Room } from '@/types';

interface RoomSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function RoomSelect({ value, onValueChange }: RoomSelectProps) {
  const { user } = useAuthContext();
  const tenantId = user?.clinicId || null;
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!tenantId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getRoomsByTenantAction(tenantId);
        if (result.success && result.data) {
          setRooms(result.data);
        }
      } catch (error) {
        console.error('Erro ao buscar salas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [tenantId]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione uma sala (opcional)" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
        ) : !tenantId ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            Clínica não identificada. Faça login novamente.
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">
            Nenhuma sala cadastrada
          </div>
        ) : (
          rooms.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              {room.name}
              {room.description && (
                <span className="text-muted-foreground"> - {room.description}</span>
              )}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}