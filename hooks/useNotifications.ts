'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsAction,
  getUnreadCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/actions/notification-actions';

const NOTIFICATIONS_KEY = 'notifications';
const UNREAD_COUNT_KEY = 'notifications-unread-count';

export function useNotifications(tenantId: string | null) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: [NOTIFICATIONS_KEY, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await getNotificationsAction(tenantId, 0, 20);
      return result.success && result.data ? result.data : [];
    },
    enabled: !!tenantId,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [UNREAD_COUNT_KEY, tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const result = await getUnreadCountAction(tenantId);
      return result.success && result.data !== undefined ? result.data : 0;
    },
    enabled: !!tenantId,
    refetchInterval: 90000, // 1,5 min - reduz carga em multi-tenant
    refetchIntervalInBackground: false, // não refetch quando aba em background
    refetchOnWindowFocus: true, // atualiza ao voltar para a aba
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      tenantId
        ? markNotificationAsReadAction(tenantId, notificationId)
        : Promise.resolve({ success: false, error: 'Sem tenant' }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, tenantId] });
        queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, tenantId] });
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      tenantId
        ? markAllNotificationsAsReadAction(tenantId)
        : Promise.resolve({ success: false, error: 'Sem tenant' }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, tenantId] });
        queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, tenantId] });
      }
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, tenantId] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, tenantId] });
    },
  };
}
