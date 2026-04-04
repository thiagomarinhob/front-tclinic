'use client'

import { useState } from 'react';
import { useProfessionalsByCurrentClinic } from '@/hooks/useProfessionals';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  UserCheck,
  UserX,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  Filter,
  X,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Professional, DocumentType } from '@/types/professional.types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    CRM: 'CRM',
    CREFITO: 'CREFITO',
    CRO: 'CRO',
    CRP: 'CRP',
    CRN: 'CRN',
    COREN: 'COREN',
    OUTRO: 'Outro',
  };
  return labels[type] || type;
}

function getDocumentTypeColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    CRM: 'bg-blue-100 text-blue-700 border-blue-200',
    CREFITO: 'bg-green-100 text-green-700 border-green-200',
    CRO: 'bg-purple-100 text-purple-700 border-purple-200',
    CRP: 'bg-orange-100 text-orange-700 border-orange-200',
    CRN: 'bg-pink-100 text-pink-700 border-pink-200',
    COREN: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    OUTRO: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[type] || colors.OUTRO;
}

interface ProfessionalCardProps {
  professional: Professional;
}

function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { user, specialty, documentType, documentNumber, documentState, bio, isActive } = professional;
  const initials = getInitials(user.fullName);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 border-2 border-primary/20">
            <AvatarImage src={professional.profileImageUrl} alt={user.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {user.fullName}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {specialty}
                  </Badge>
                  {isActive ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <UserX className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <Badge
                  variant="outline"
                  className={`text-xs ${getDocumentTypeColor(documentType)}`}
                >
                  {getDocumentTypeLabel(documentType)}
                </Badge>
                <span className="font-mono text-muted-foreground">{documentNumber}</span>
                {documentState && (
                  <span className="text-muted-foreground">- {documentState}</span>
                )}
              </div>

              {/* Contact Info */}
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
              </div>

              {/* Bio */}
              {bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{bio}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="flex-1 min-w-[110px]" asChild>
                <Link href={`/professionals/${professional.id}`}>
                  <Eye className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="truncate">Ver Detalhes</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" asChild>
                <Link href={`/professionals/${professional.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="truncate">Editar</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/professionals/${professional.id}/schedule`}>
                  <Clock className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="truncate">Configurar Horários</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfessionalList() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const size = 20;

  // Converter filtros para formato do backend
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';
  const documentType = documentTypeFilter === 'all' ? undefined : documentTypeFilter;

  // Usa o hook que busca profissionais da clínica atual com filtros no backend
  const { professionals, pagination, isLoading, error } = useProfessionalsByCurrentClinic(
    page,
    size,
    'user.fullName,asc',
    debouncedSearch || undefined,
    activeFilter,
    documentType
  );

  // Resetar página quando filtros mudarem
  const handleFilterChange = () => {
    setPage(0);
  };

  const hasActiveFilters =
    statusFilter !== 'all' || documentTypeFilter !== 'all' || debouncedSearch.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDocumentTypeFilter('all');
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

  const handleDocumentTypeChange = (value: string) => {
    setDocumentTypeFilter(value);
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
            <p>Erro ao carregar profissionais</p>
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
      {/* Header with Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, especialidade, documento ou email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
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
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={documentTypeFilter} onValueChange={handleDocumentTypeChange}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tipo de Documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CRM">CRM</SelectItem>
                <SelectItem value="CREFITO">CREFITO</SelectItem>
                <SelectItem value="CRO">CRO</SelectItem>
                <SelectItem value="CRP">CRP</SelectItem>
                <SelectItem value="CRN">CRN</SelectItem>
                <SelectItem value="COREN">COREN</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Results Count */}
          {pagination && pagination.totalElements > 0 && (
            <div className="text-sm text-muted-foreground">
              {pagination.totalElements}{' '}
              {pagination.totalElements === 1 ? 'profissional encontrado' : 'profissionais encontrados'}
              {pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Página {pagination.number + 1} de {pagination.totalPages})
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Professional Cards Grid */}
      {professionals.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters
              ? 'Nenhum profissional encontrado'
              : 'Nenhum profissional cadastrado'
          }
          description={
            hasActiveFilters
              ? 'Tente ajustar os filtros ou termo de busca'
              : 'Adicione o primeiro profissional da clínica'
          }
        />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>

          {/* Pagination Controls */}
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
                          variant={page === pageNum ? "default" : "outline"}
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
