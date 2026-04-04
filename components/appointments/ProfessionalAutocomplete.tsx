'use client'

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getProfessionalsByClinicAction } from '@/actions/professional-actions';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPECIALTY_LABELS } from '@/types';
import type { Professional } from '@/types';

interface ProfessionalAutocompleteProps {
  value?: string;
  onSelect: (professionalId: string) => void;
  error?: string;
}

export function ProfessionalAutocomplete({
  value,
  onSelect,
  error,
}: ProfessionalAutocompleteProps) {
  const { user } = useAuthContext();
  const tenantId = user?.clinicId || null;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [filtered, setFiltered] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 200);

  const selected = allProfessionals.find((p) => p.id === value) ?? null;

  useEffect(() => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }
    getProfessionalsByClinicAction(tenantId, 0, 1000, 'user.fullName,asc', undefined, true).then(
      (result) => {
        if (result.success && result.data) {
          setAllProfessionals(result.data.content);
        }
        setIsLoading(false);
      }
    );
  }, [tenantId]);

  useEffect(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) {
      setFiltered(allProfessionals);
      return;
    }
    setFiltered(
      allProfessionals.filter(
        (p) =>
          p.user.fullName.toLowerCase().includes(query) ||
          (SPECIALTY_LABELS[p.specialty] || p.specialty).toLowerCase().includes(query)
      )
    );
  }, [debouncedSearch, allProfessionals]);

  const handleSelect = (professional: Professional) => {
    onSelect(professional.id);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', error && 'border-red-500')}
        >
          {selected
            ? `${selected.user.fullName} - ${SPECIALTY_LABELS[selected.specialty] || selected.specialty}`
            : 'Selecione o profissional'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar profissional..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : filtered.length === 0 ? (
              <CommandGroup>
                <CommandItem disabled className="text-muted-foreground">
                  Nenhum profissional encontrado
                </CommandItem>
              </CommandGroup>
            ) : (
              <CommandGroup>
                {filtered.map((professional) => (
                  <CommandItem
                    key={professional.id}
                    value={professional.id}
                    onSelect={() => handleSelect(professional)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        selected?.id === professional.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{professional.user.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {SPECIALTY_LABELS[professional.specialty] || professional.specialty}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
