'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useUser, useAuth } from '../../hooks/useAuth';
import { useToastManager } from '../ui/toast-manager';
import { formatDate } from '../../lib/utils';
import { 
  User, 
  Users, 
  Calendar, 
  Activity, 
  Code, 
  Copy,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';

export function DashboardContent() {
  const { user, isTeamLeader, teamInfo } = useUser();
  const { generateTeamCode } = useAuth();
  const { toast } = useToastManager();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  if (!user) return null;

  const handleGenerateTeamCode = async () => {
    try {
      setIsGeneratingCode(true);
      const newCode = await generateTeamCode();
      toast.success('Código generado', `Nuevo código de equipo: ${newCode}`);
    } catch (error) {
      toast.error('Error', 'No se pudo generar el código del equipo');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyTeamCode = () => {
    if (teamInfo?.codigo) {
      navigator.clipboard.writeText(teamInfo.codigo);
      toast.success('Copiado', 'Código del equipo copiado al portapapeles');
    }
  };

  const stats = [
    {
      title: 'Actividades Completadas',
      value: '12',
      icon: Activity,
      description: 'En los últimos 7 días',
    },
    {
      title: 'Tiempo Total',
      value: '42h',
      icon: Calendar,
      description: 'Esta semana',
    },
    {
      title: 'Proyectos Activos',
      value: '3',
      icon: Code,
      description: 'En desarrollo',
    },
    {
      title: 'Productividad',
      value: '85%',
      icon: BarChart3,
      description: 'Promedio mensual',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          ¡Hola, {user.nombre.split(' ')[0]}! 👋
        </h2>
        <p className="text-muted-foreground">
          {isTeamLeader 
            ? `Bienvenido a tu panel de control como líder de ${teamInfo?.nombre}`
            : 'Bienvenido a tu panel de control personal'
          }
        </p>
      </div>

      {/* Información del usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isTeamLeader ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
            <span>Información de la Cuenta</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg">{user.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Cuenta</p>
                <div className="flex items-center space-x-2">
                  {isTeamLeader ? (
                    <>
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600 font-medium">Team Leader</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Desarrollador Individual</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                <p className="text-lg">{formatDate(user.createdAt)}</p>
              </div>
              {user.lastLogin && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Último Acceso</p>
                  <p className="text-lg">{formatDate(user.lastLogin)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del equipo (solo para Team Leaders) */}
      {isTeamLeader && teamInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Información del Equipo</span>
            </CardTitle>
            <CardDescription>
              Gestiona la información de tu equipo de desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre del Equipo</p>
                <p className="text-lg font-medium">{teamInfo.nombre}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Código de Invitación</p>
                <div className="flex items-center space-x-2">
                  <code className="px-3 py-1 bg-muted rounded-md font-mono text-sm">
                    {teamInfo.codigo}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyTeamCode}
                    title="Copiar código"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comparte este código con tu equipo para que puedan unirse
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleGenerateTeamCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generar Nuevo Código
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas (placeholder para futuras funcionalidades) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próximas funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Próximas Funcionalidades</span>
          </CardTitle>
          <CardDescription>
            Funcionalidades que estarán disponibles pronto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">📋 Gestión de Actividades</h4>
              <p className="text-sm text-muted-foreground">
                Crea, asigna y rastrea actividades de desarrollo
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">👥 Gestión de Equipos</h4>
              <p className="text-sm text-muted-foreground">
                Administra miembros del equipo y permisos
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📊 Reportes y Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Visualiza métricas de productividad y progreso
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔔 Notificaciones</h4>
              <p className="text-sm text-muted-foreground">
                Mantente al día con las actualizaciones del equipo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}