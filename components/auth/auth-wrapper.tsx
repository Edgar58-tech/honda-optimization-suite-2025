
'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  Crown, 
  Briefcase, 
  Users, 
  Car,
  Loader2
} from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium text-gray-700">Cargando Honda Optimization Suite...</p>
            <p className="text-sm text-gray-500 mt-2">Verificando credenciales</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    // Si no hay sesión, Next.js middleware debería redirigir al login
    // Pero mostramos un fallback por si acaso
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium text-gray-700">Acceso requerido</p>
            <p className="text-sm text-gray-500 mt-2">Redirigiendo al login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return <Crown className="h-4 w-4" />;
      case 'VENTAS':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'default' as const;
      case 'VENTAS':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información del usuario */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Car className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Honda Optimization Suite</h1>
                <p className="text-sm text-gray-500">Sistema de Optimización de Distribución de Vehículos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {(session.user as any)?.nombre_completo || (session.user as any)?.firstName || session.user?.name || 'Usuario'}
                    </div>
                    <div className="text-gray-500">
                      {(session.user as any)?.puesto || session.user?.email}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={getRoleBadgeVariant((session.user as any)?.role || 'GENERAL')}
                  className="flex items-center gap-1"
                >
                  {getRoleIcon((session.user as any)?.role || 'GENERAL')}
                  {(session.user as any)?.role || 'General'}
                </Badge>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
