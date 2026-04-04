'use client';

import { PlanSelectionPage } from '@/components/auth/PlanSelection';

export default function PlanSelectionRoute() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full mx-auto max-w-7xl">
        <PlanSelectionPage />
      </div>
    </div>
  );
}
