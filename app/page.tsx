'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading';
import { TadLogo } from '../components/brand/TadLogo';
import { Activity, Users, BarChart3, Shield } from 'lucide-react';

export default function HomePage() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si está autenticado, redirigir al dashboard
    if (state.isAuthenticated && !state.isLoading) {
      router.push('/dashboard');
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  // Mostrar loading mientras se verifica el estado de autenticación
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si está autenticado, no mostrar la landing page
  if (state.isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: Activity,
      title: 'Gestión de Actividades',
      description: 'Organiza y rastrea todas tus tareas de desarrollo de manera eficiente.',
    },
    {
      icon: Users,
      title: 'Colaboración en Equipo',
      description: 'Trabaja en equipo con herramientas de gestión y comunicación integradas.',
    },
    {
      icon: BarChart3,
      title: 'Analytics y Reportes',
      description: 'Visualiza tu productividad y el progreso de tus proyectos en tiempo real.',
    },
    {
      icon: Shield,
      title: 'Seguro y Confiable',
      description: 'Tus datos están protegidos con las mejores prácticas de seguridad.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--tad-green)/0.1)] via-background to-[hsl(var(--tad-black)/0.05)]">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <TadLogo variant="default" />
          
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
            Gestiona tus{' '}
            <span className="text-primary">actividades</span>{' '}
            de desarrollo
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La plataforma definitiva para desarrolladores que quieren organizar sus tareas,
            colaborar en equipo y maximizar su productividad.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Registrarse
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl font-bold">¿Por qué TaskCode TAD?</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre las funcionalidades que te ayudarán a ser más productivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 pb-8 mt-10 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TaskCode TAD · TAD Consultoría</p>
        </div>
      </footer>
    </div>
  );
}