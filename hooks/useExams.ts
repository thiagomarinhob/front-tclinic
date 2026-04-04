'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getExamsByTenantAction,
} from '@/actions/exam-actions';
import type { PaginatedResponse } from '@/types';
import type { Exam } from '@/types/exam.types';

export type ExamListFilters = {
  patientId?: string;
  status?: string;
};

export function useExams(
  page: number = 0,
  size: number = 20,
  filters?: ExamListFilters
) {
  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['exams', page, size, filters?.patientId, filters?.status],
    queryFn: async () => {
      return await getExamsByTenantAction(page, size, {
        patientId: filters?.patientId,
        status: filters?.status,
      });
    },
  });

  const exams: PaginatedResponse<Exam> | null = result?.success ? result.data ?? null : null;

  return {
    exams,
    isLoading,
    error,
    refetch,
  };
}
