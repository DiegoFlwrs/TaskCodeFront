'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { TadLogo } from '../brand/TadLogo';
import { Button } from '../ui/button';

interface DashboardLayoutInnerProps {
  children: ReactNode;
}

export function DashboardLayoutInner({ children }: DashboardLayoutInnerProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Cerrar el drawer al cambiar de ruta en móvil
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Evitar scroll del body con el menú abierto
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Barra superior solo en móvil */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <TadLogo variant="default" className="scale-95" />
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
