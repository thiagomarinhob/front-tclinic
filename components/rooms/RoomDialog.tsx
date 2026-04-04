'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRooms } from '@/hooks/useRooms';
import { Loader2, DoorOpen } from 'lucide-react';
import { useEffect } from 'react';
import type { Room } from '@/types';
import { roomSchema } from '@/lib/validators';

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room;
  onSuccess?: (room?: Room) => void;
}

export function RoomDialog({ open, onOpenChange, room, onSuccess }: RoomDialogProps) {
  const { createRoom, updateRoom, isCreating, isUpdating } = useRooms();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  const isEditing = !!room;
  const isLoading = isCreating || isUpdating;

  // Reset form when dialog opens/closes or room changes
  useEffect(() => {
    if (open) {
      reset(room ? {
        name: room.name,
        description: room.description || '',
        capacity: room.capacity || undefined,
      } : {
        name: '',
        description: '',
        capacity: undefined,
      });
    }
  }, [open, room, reset]);

  const onSubmit = async (data: RoomFormData) => {
    try {
      let result;
      if (room) {
        result = await updateRoom({ roomId: room.id, data });
      } else {
        result = await createRoom(data as any);
      }
      if (result.success) {
        onOpenChange(false);
        onSuccess?.(result.data);
      }
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            {isEditing ? 'Editar Sala' : 'Nova Sala'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da sala.'
              : 'Preencha os dados para cadastrar uma nova sala.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Sala *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Sala 1, Consultório A, Sala de Fisioterapia"
              className={errors.name ? 'border-red-500' : ''}
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
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Sala'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
