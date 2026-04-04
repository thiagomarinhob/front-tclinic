'use client'

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/** Converte string de data para Date. Aceita YYYY-MM-DD ou DD/MM/YYYY */
function parseDateValue(value: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(trimmed + (trimmed.includes('T') ? '' : 'T12:00:00'));
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

interface DatePickerProps {
  value?: string; // YYYY-MM-DD ou DD/MM/YYYY
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecione a data',
  disabled = false,
  id,
  className,
}: DatePickerProps) {
  const dateValue = value ? parseDateValue(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value
            ? format(dateValue!, 'dd/MM/yyyy', { locale: ptBR })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => date && onChange(format(date, 'yyyy-MM-dd'))}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
