'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LayoutDashboard,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Ticket,
  AppWindow,
  BarChart2,
  LogOut,
  ChevronsUpDown,
  Users,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TadLogo } from '../brand/TadLogo';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth, useUser } from '../../hooks/useAuth';

const navItems: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  teamLeaderOnly?: boolean;
}[] = [
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Mis Tareas',
    href: '/dashboard/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Tickets / RQ',
    href: '/dashboard/tickets',
    icon: Ticket,
  },
  {
    label: 'Aplicaciones',
    href: '/dashboard/apps',
    icon: AppWindow,
  },
  {
    label: 'Reportes',
    href: '/dashboard/reports',
    icon: BarChart2,
  },
  {
    label: 'Equipos',
    href: '/dashboard/teams',
    icon: Users,
    teamLeaderOnly: true,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user, isTeamLeader } = useUser();

  const visibleItems = navItems.filter(
    (item) => !item.teamLeaderOnly || isTeamLeader,
  );

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    await logout();
  };

  // En móvil el drawer siempre muestra labels completos
  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={cn(
          'flex h-full flex-col bg-[hsl(var(--tad-black))] text-white border-r border-white/10 transition-all duration-300 ease-in-out',
          // Móvil: drawer fijo
          'fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: en flujo normal
          'md:static md:z-auto md:translate-x-0 md:max-w-none',
          collapsed ? 'md:w-16' : 'md:w-60',
        )}
      >
        {/* Logo + controles */}
        <div
          className={cn(
            'flex border-b border-white/10 shrink-0',
            collapsed && !mobileOpen
              ? 'flex-col items-center justify-center gap-1 py-3 px-2'
              : 'items-center h-14 md:h-16 px-3 gap-2 justify-between',
          )}
        >
          <TadLogo
            variant="sidebar"
            collapsed={collapsed && !mobileOpen}
          />

          {/* Cerrar en móvil */}
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0 md:hidden"
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Colapsar solo en desktop */}
          <button
            type="button"
            onClick={onToggle}
            className="hidden md:inline-flex p-1.5 rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
                title={!showLabels ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {showLabels && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        {user && (
          <div className="border-t border-white/10 p-2 shrink-0">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    !showLabels && 'justify-center',
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  {showLabels && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">
                          {user.nombre}
                        </p>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <ChevronsUpDown className="h-4 w-4 text-white/40 shrink-0" />
                    </>
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="top"
                  align={!showLabels ? 'center' : 'start'}
                  sideOffset={8}
                  className="z-50 min-w-[220px] rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                  <div className="px-3 py-2 border-b mb-1">
                    <p className="text-sm font-medium truncate">{user.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}
      </aside>
    </>
  );
}
