'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getExamTypesAction, type ExamTypeItem } from '@/actions/exam-actions';

interface ExamTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ExamTypeSelect({ value, onChange, error }: ExamTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [examTypes, setExamTypes] = useState<ExamTypeItem[]>([]);

  useEffect(() => {
    getExamTypesAction().then((res) => {
      if (res.success && res.data) setExamTypes(res.data);
    });
  }, []);

  const CATEGORY_ORDER = [
    'Exames de Imagem',
    'Exames Laboratoriais',
    'Laudo Psiquiátrico',
    'Exames Admissionais',
  ];

  const catalog = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of examTypes) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item.name);
    }
    return Array.from(map.entries())
      .map(([label, exams]) => ({ label, exams }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.label);
        const bi = CATEGORY_ORDER.indexOf(b.label);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
  }, [examTypes]);

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;

    const q = search.toLowerCase();
    return catalog
      .map((cat) => ({
        ...cat,
        exams: cat.exams.filter((exam) => exam.toLowerCase().includes(q)),
      }))
      .filter(
        (cat) =>
          cat.exams.length > 0 || cat.label.toLowerCase().includes(q)
      );
  }, [search, catalog]);

  const hasResults = filteredCatalog.some((cat) => cat.exams.length > 0);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-red-500'
            )}
          >
            <span className="truncate">{value || 'Selecione o tipo de exame'}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-80" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar exame..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {!hasResults ? (
                <CommandEmpty>Nenhum exame encontrado.</CommandEmpty>
              ) : (
                filteredCatalog.map((category, index) => {
                  if (category.exams.length === 0) return null;
                  return (
                    <div key={category.label}>
                      {index > 0 && filteredCatalog
                        .slice(0, index)
                        .some((c) => c.exams.length > 0) && (
                        <CommandSeparator />
                      )}
                      <CommandGroup heading={category.label}>
                        {category.exams.map((exam) => (
                          <CommandItem
                            key={exam}
                            value={exam}
                            onSelect={() => {
                              onChange(exam);
                              setOpen(false);
                              setSearch('');
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                value === exam ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {exam}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </div>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
