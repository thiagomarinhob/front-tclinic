"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROUTES } from "@/config/constants";
import { useAuthContext } from "@/contexts/AuthContext";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();
  const hasAdminPermission = user?.permissions?.includes("admin:tenant:manage");

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (!hasAdminPermission) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [hasAdminPermission, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminPermission) {
    return null;
  }

  return <>{children}</>;
}
