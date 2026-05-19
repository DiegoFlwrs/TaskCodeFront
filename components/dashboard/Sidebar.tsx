'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Code2,
  Ticket,
  AppWindow,
  BarChart2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useUser } from '../../hooks/useAuth';

const navItems = [
  {
    label: 'Dashboard',
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
    label: 'Equipos',
    href: '/dashboard/teams',
    icon: Users,
    teamLeaderOnly: true,
  },
  {
    label: 'Reportes',
    href: '/dashboard/reports',
    icon: BarChart2,
  },
//   {
//     label: 'Configuración',
//     href: '/dashboard/settings',
//     icon: Settings,
//   },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isTeamLeader } = useUser();

  const visibleItems = navItems.filter((item) => !item.teamLeaderOnly || isTeamLeader);

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 border-b px-4 shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-base tracking-tight">TaskCode</span>
          </div>
        )}
        {collapsed && <Code2 className="h-6 w-6 text-primary" />}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="border-t p-3 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <ChevronLeft className="h-4 w-4" />
              <span>Colapsar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
