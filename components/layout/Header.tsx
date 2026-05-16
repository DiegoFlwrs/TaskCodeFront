'use client';

import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth, useUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { LogOut, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { logout } = useAuth();
  const { user, isTeamLeader } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada', 'Has cerrado sesión exitosamente');
      router.push('/login');
    } catch (error) {
      toast.error('Error', 'No se pudo cerrar la sesión');
    }
  };

  if (!user) return null;

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">
            TaskCodeBack
          </h1>
          
          {/* Indicador de tipo de usuario */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-muted">
            {isTeamLeader ? (
              <>
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Team Leader</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Individual</span>
              </>
            )}
          </div>
        </div>

        {/* Información del usuario */}
        <div className="flex items-center space-x-4">
          {/* Información del equipo si es team leader */}
          {isTeamLeader && user.equipo && (
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.equipo.nombre}</p>
              <p className="text-xs text-muted-foreground">
                Código: {user.equipo.codigo}
              </p>
            </div>
          )}

          {/* Avatar y nombre del usuario */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.nombre}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.nombre)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Botón de logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}