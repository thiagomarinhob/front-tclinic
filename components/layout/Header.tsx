'use client';

import { Bell, Menu, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from './ThemeToggle';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuthContext();
  const clinicId = user?.clinicId ?? null;
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications(clinicId);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-header px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-header-foreground"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      <h1 className="text-xl font-semibold text-header-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-4">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-header-foreground"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {unreadCount > 0 && (
              <>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                  disabled={isMarkingAllAsRead}
                  className="cursor-pointer justify-center gap-2 text-muted-foreground"
                >
                  {isMarkingAllAsRead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Marcar todas como lidas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onSelect={() => markAsRead(n.id)}
                />
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        'cursor-pointer flex-col items-start gap-1 py-3',
        !notification.read && 'bg-muted/50'
      )}
    >
      <p className="text-sm font-medium">{notification.title}</p>
      {notification.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.description}
        </p>
      )}
    </DropdownMenuItem>
  );
}