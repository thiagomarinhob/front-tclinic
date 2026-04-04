'use client'

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { FloatingNotepad } from '@/components/notepad/FloatingNotepad';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/constants';
import { isPathAllowedForRole } from '@/config/navigation';
import { UserRole } from '@/types/auth.types';
import { toast } from 'sonner';

const pageTitles: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.PATIENTS]: 'Pacientes',
  [ROUTES.APPOINTMENTS]: 'Agendamentos',
  [ROUTES.MEDICAL_RECORDS]: 'Prontuários',
  [ROUTES.PROFESSIONALS]: 'Profissionais',
  [ROUTES.PROCEDURES]: 'Procedimentos',
  [ROUTES.USERS]: 'Usuários',
  '/rooms': 'Salas',
  [ROUTES.FINANCIAL]: 'Financeiro',
  [ROUTES.SETTINGS]: 'Configurações',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /** Proteção por role: redireciona para o dashboard se a rota não for permitida para o usuário */
  useEffect(() => {
    if (!user?.role) return;
    if (!isPathAllowedForRole(pathname, user.role)) {
      toast.error('Você não tem permissão para acessar esta página.');
      router.replace(ROUTES.DASHBOARD);
    }
  }, [pathname, user?.role, router]);

  // Get page title
  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(path + '/')) {
        return title;
      }
    }
    return 'TClinic';
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        {user && (user.role === UserRole.PROFISSIONAL_SAUDE || user.tenantType === 'SOLO') && (
          <FloatingNotepad userId={user.id} />
        )}
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <VisuallyHidden>
              <SheetTitle>Menu de navegação</SheetTitle>
            </VisuallyHidden>
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title={getPageTitle()} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <AppBreadcrumb />
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}