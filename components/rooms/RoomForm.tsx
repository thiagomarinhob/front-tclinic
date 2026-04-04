'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { roomSchema } from '@/lib/validators';
import { useRooms } from '@/hooks/useRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { Room, CreateRoomRequest } from '@/types';
import { z } from 'zod';

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  room?: Room;
}

export function RoomForm({ room }: RoomFormProps) {
  const router = useRouter();
  const { createRoom, updateRoom, isCreating, isUpdating } = useRooms();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: room
      ? {
          name: room.name,
          description: room.description || '',
          capacity: room.capacity || undefined,
        }
      : {},
  });

  const onSubmit = async (data: RoomFormData) => {
    try {
      if (room) {
        await updateRoom({ roomId: room.id, data });
      } else {
        await createRoom(data as any);
      }
      router.push('/rooms');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Sala *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ex: Sala 1, Consultório A, Sala de Fisioterapia"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descreva o tipo de atendimento, equipamentos, etc..."
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Capacidade */}
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacidade (Opcional)</Label>
        <Input
          id="capacity"
          type="number"
          {...register('capacity', { valueAsNumber: true })}
          placeholder="Ex: 1, 2, 5..."
          min="1"
          max="100"
        />
        <p className="text-sm text-muted-foreground">
          Número máximo de pessoas que a sala comporta
        </p>
        {errors.capacity && (
          <p className="text-sm text-red-500">{errors.capacity.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {room ? 'Salvar Alterações' : 'Criar Sala'}
        </Button>
      </div>
    </form>
  );
}