'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from '../../components/dashboard/Sidebar';

interface DashboardLayoutInnerProps {
  children: ReactNode;
}

export function DashboardLayoutInner({ children }: DashboardLayoutInnerProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
