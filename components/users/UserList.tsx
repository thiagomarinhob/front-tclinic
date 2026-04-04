'use client'

import { useState } from 'react';
import { useUsersByCurrentClinic } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Mail,
  Phone,
  Filter,
  X,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { UserListItem } from '@/types';

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
}

interface UserCardProps {
  user: UserListItem;
  onDelete: (userId: string) => void;
  onToggleBlock: (userId: string, blocked: boolean) => void;
}

function UserCard({ user, onDelete, onToggleBlock }: UserCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const initials = getInitials(user.firstName || '', user.lastName || '');

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {user.blocked ? (
                      <Badge variant="destructive">
                        <Ban className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {user.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.cpf && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">{user.cpf}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1 min-w-[110px]" asChild>
                  <Link href={`/users/${user.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/users/${user.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleBlock(user.id, !user.blocked)}
                  className={user.blocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                >
                  {user.blocked ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          onDelete(user.id);
          setShowDeleteDialog(false);
        }}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir o usuário ${fullName}? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}

export function UserList() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const size = 20;

  // Converter filtros para formato do backend
  // NOTA: Toda a lógica de filtragem é feita pelo backend
  const blockedFilter = statusFilter === 'all' ? undefined : statusFilter === 'blocked';

  // Busca usuários com filtros processados pelo backend
  const { users, pagination, isLoading, error, deleteUser, updateUserBlocked: updateUserBlockedMutate } = useUsersByCurrentClinic(
    page,
    size,
    'firstName,asc',
    debouncedSearch || undefined,
    blockedFilter
  );

  // Wrapper para converter a assinatura da função do hook para o formato esperado pelo UserCard
  const handleToggleBlock = (userId: string, blocked: boolean) => {
    updateUserBlockedMutate({ userId, blocked });
  };

  const handleFilterChange = () => {
    setPage(0);
  };

  const hasActiveFilters = statusFilter !== 'all' || debouncedSearch.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    handleFilterChange();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Erro ao carregar usuários</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {pagination && pagination.totalElements > 0 && (
            <div className="text-sm text-muted-foreground">
              {pagination.totalElements} {pagination.totalElements === 1 ? 'usuário encontrado' : 'usuários encontrados'}
              {pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Página {pagination.number + 1} de {pagination.totalPages})
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {users.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          description={hasActiveFilters ? 'Tente ajustar os filtros ou termo de busca' : 'Adicione o primeiro usuário da clínica'}
        />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onDelete={deleteUser}
                onToggleBlock={handleToggleBlock}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-y-2">
                <div className="text-sm text-muted-foreground">
                  Mostrando {page * size + 1} a {Math.min((page + 1) * size, pagination.totalElements)} de {pagination.totalElements}
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
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page > pagination.totalPages - 4) {
                        pageNum = pagination.totalPages - 5 + i;
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
                    disabled={page >= pagination.totalPages - 1}
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
  );
}
