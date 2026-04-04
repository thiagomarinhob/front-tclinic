'use client'

import { useState, useCallback } from 'react';
import { checkAvailabilityAction, getAvailableSlotsAction } from '@/actions/appointment-actions';

export function useAvailability() {
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async (
    professionalId: string,
    startTime: string,
    durationMinutes: number,
    appointmentId?: string
  ) => {
    setIsChecking(true);
    try {
      const result = await checkAvailabilityAction(
        professionalId,
        startTime,
        durationMinutes,
        appointmentId
      );

      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getAvailableSlots = async (
    professionalId: string,
    date: string,
    durationMinutes: number = 60
  ) => {
    setIsChecking(true);
    try {
      const result = await getAvailableSlotsAction(professionalId, date, durationMinutes);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkAvailability,
    getAvailableSlots,
    isChecking,
  };
}