'use client';

import { useAuth, useUser } from '../../hooks/useAuth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogOut, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/tasks': 'Mis Tareas',
  '/dashboard/tickets': 'Tickets / RQ',
  '/dashboard/apps': 'Aplicaciones',
  '/dashboard/teams': 'Equipos',
  '/dashboard/reports': 'Reportes',
  '/dashboard/settings': 'Configuración',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardTopBar() {
  const { logout } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();

  const title = pageTitles[pathname] ?? 'Dashboard';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-16 border-b border-primary/10 bg-card/80 backdrop-blur shrink-0 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="h-5 w-5" />
        </Button> */}

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{user.nombre}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials(user.nombre)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
