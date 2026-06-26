"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ROUTES } from "@/config/constants";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuthContext();

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href={ROUTES.ADMIN_TENANTS} className="flex items-center gap-2">
              <Image src="/Logo.png" alt="TClinic" width={48} height={48} />
              <div>
                <p className="text-sm font-semibold text-sidebar-foreground">TClinic</p>
                <p className="text-xs text-sidebar-foreground/60">Admin</p>
              </div>
            </Link>
          </div>

          <div className="border-b p-4">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.fullName || "Administrador"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {user?.email || "Acesso de plataforma"}
            </p>
          </div>

          <nav className="flex-1 px-3 py-4">
            <Link
              href={ROUTES.ADMIN_TENANTS}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                pathname === ROUTES.ADMIN_TENANTS || pathname.startsWith(`${ROUTES.ADMIN_TENANTS}/`)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
              )}
            >
              <Building2 className="h-5 w-5" />
              Tenants
            </Link>
          </nav>

          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={logout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-header px-4 md:px-6">
            <Link href={ROUTES.ADMIN_TENANTS} className="flex items-center gap-2 md:hidden">
              <Image src="/Logo.png" alt="TClinic" width={38} height={38} />
              <span className="text-sm font-semibold text-header-foreground">Admin</span>
            </Link>
            <h1 className="hidden text-xl font-semibold text-header-foreground md:block">
              Administração da plataforma
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="md:hidden">
                <Link href={ROUTES.ADMIN_TENANTS}>Tenants</Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={logout} className="md:hidden">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
