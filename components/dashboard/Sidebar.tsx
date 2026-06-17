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
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TadLogo } from '../brand/TadLogo';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth, useUser } from '../../hooks/useAuth';

const navItems = [
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
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useUser();

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[hsl(var(--tad-black))] text-white border-r border-white/10 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo + colapsar */}
      <div
        className={cn(
          'flex border-b border-white/10 shrink-0',
          collapsed
            ? 'flex-col items-center justify-center gap-1 py-3 px-2'
            : 'items-center h-16 px-3 gap-2 justify-between',
        )}
      >
        <TadLogo variant="sidebar" collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
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
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
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
                  collapsed && 'justify-center',
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getInitials(user.nombre)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
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
                align={collapsed ? 'center' : 'start'}
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
  );
}
