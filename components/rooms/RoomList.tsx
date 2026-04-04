'use client'

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoomsPaginated } from '@/hooks/useRooms';
import { useRooms } from '@/hooks/useRooms';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Edit, Trash2, Users, DoorOpen, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const PAGE_SIZE = 10;

export function RoomList() {
  const { user } = useAuth();
  const tenantId = user?.clinicId ?? null;

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const activeFilter =
    statusFilter === 'all' ? undefined : statusFilter === 'active';
  const { rooms, pagination, isLoading } = useRoomsPaginated(
    tenantId,
    page,
    PAGE_SIZE,
    'name,asc',
    activeFilter
  );

  const { deleteRoom, isDeleting } = useRooms();

  const handleDelete = useCallback(async () => {
    if (!roomToDelete) return;
    await deleteRoom(roomToDelete);
    setRoomToDelete(null);
  }, [roomToDelete, deleteRoom]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setPage(0);
  }, []);

  const hasActiveFilters = statusFilter !== 'all';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!tenantId) {
    return (
      <EmptyState
        title="Clínica não identificada"
        description="Faça login novamente para gerenciar as salas."
      />
    );
  }

  const displayRooms = rooms ?? [];
  const totalElements = pagination?.totalElements ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  if (displayRooms.length === 0 && !hasActiveFilters) {
    return (
      <>
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
        <EmptyState
          title="Nenhuma sala cadastrada"
          description="Adicione a primeira sala de atendimento da clínica"
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
            {pagination && totalElements > 0 && (
              <div className="text-sm text-muted-foreground ml-auto">
                {totalElements} {totalElements === 1 ? 'sala encontrada' : 'salas encontradas'}
                {totalPages > 1 && (
                  <span className="ml-2">
                    (Página {pagination.number + 1} de {totalPages})
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {displayRooms.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="Nenhuma sala encontrada"
              description="Nenhuma sala corresponde aos filtros. Tente ajustar."
            />
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayRooms.map((room) => (
                <Card key={room.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <DoorOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          {room.capacity != null && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Capacidade: {room.capacity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {room.isActive ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>

                    {room.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/rooms/${room.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/rooms/${room.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRoomToDelete(room.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {pagination && totalPages > 1 && (
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {page * PAGE_SIZE + 1} a{' '}
                    {Math.min((page + 1) * PAGE_SIZE, totalElements)} de {totalElements}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (page < 3) {
                          pageNum = i;
                        } else if (page > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!roomToDelete} onOpenChange={() => setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sala</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sala? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}