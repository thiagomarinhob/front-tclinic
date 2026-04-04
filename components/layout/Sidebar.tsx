'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserCircle,
  LogOut,
  Building2,
  ChevronDown,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/constants';
import { NAV_ROUTES, NavSubItem } from '@/config/navigation';

function NavItemWithFlyout({
  name,
  icon: Icon,
  isActive,
  subItems,
}: {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: boolean;
  subItems: NavSubItem[];
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.right + 4 });
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setOpen(false), 120);
  };

  // Fecha ao navegar
  const handleLinkClick = () => setOpen(false);

  // Cleanup do timeout ao desmontar
  useEffect(() => () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); }, []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer select-none',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{name}</span>
        <ChevronRight className="h-4 w-4 opacity-50" />
      </div>

      {open && createPortal(
        <div
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-44 rounded-lg border bg-popover shadow-md py-1"
          onMouseEnter={() => { if (hideTimeout.current) clearTimeout(hideTimeout.current); }}
          onMouseLeave={handleMouseLeave}
        >
          {subItems.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={handleLinkClick}
              className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchClinic } = useAuthContext();

  const hasMultipleClinics = (user?.tenantRoles?.length ?? 0) > 1;
  const currentTenant = user?.tenantRoles?.find((tr) => tr.tenantId === user.clinicId);

  /** Itens visíveis conforme o role do usuário (fonte: config/navigation.ts) */
  const visibleNavItems = NAV_ROUTES.filter(
    (item) => user?.role && item.roles.includes(user.role) && !item.hidden
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href={ROUTES.DASHBOARD} className="flex items-center gap-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg">
            <Image
              src="/Logo.png"
              alt="Logo da página"
              width={70}
              height={70}
              className="object-contain" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">TClinic</span>
        </Link>
      </div>

      {/* User info */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
            <UserCircle className="h-6 w-6 text-sidebar-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">
              {user?.fullName || 'Usuário'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Seletor de clínica (quando o usuário tem mais de uma) */}
        {hasMultipleClinics && (
          <div className="mt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-sidebar-foreground border-sidebar-accent bg-sidebar-accent/20 hover:bg-sidebar-accent/40"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 shrink-0" />
                    {currentTenant?.tenantName ?? 'Clínica'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-48">
                {user?.tenantRoles?.map((tr) => (
                  <DropdownMenuItem
                    key={tr.tenantId}
                    onClick={() => {
                      if (tr.tenantId === user?.clinicId) return;
                      switchClinic(tr.tenantId);
                    }}
                    disabled={!tr.tenantActive}
                  >
                    {tr.tenantId === user?.clinicId ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <span className="mr-2 w-4 inline-block" />
                    )}
                    <span className="truncate">{tr.tenantName || tr.tenantId}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Navigation — itens filtrados por role (config/navigation.ts) */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            if (item.subItems && item.subItems.length > 0) {
              return (
                <NavItemWithFlyout
                  key={item.name}
                  name={item.name}
                  href={item.href}
                  icon={Icon}
                  isActive={isActive}
                  subItems={item.subItems}
                />
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
}