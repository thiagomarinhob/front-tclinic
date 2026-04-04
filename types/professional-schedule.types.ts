export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export interface ProfessionalSchedule {
  id: string;
  professionalId: string;
  dayOfWeek: DayOfWeek;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfessionalScheduleRequest {
  professionalId: string;
  dayOfWeek: DayOfWeek;
}

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Segunda-feira',
  [DayOfWeek.TUESDAY]: 'Terça-feira',
  [DayOfWeek.WEDNESDAY]: 'Quarta-feira',
  [DayOfWeek.THURSDAY]: 'Quinta-feira',
  [DayOfWeek.FRIDAY]: 'Sexta-feira',
  [DayOfWeek.SATURDAY]: 'Sábado',
  [DayOfWeek.SUNDAY]: 'Domingo',
};

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];
