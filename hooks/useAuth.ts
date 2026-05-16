'use client';

import { useAuth as useAuthContext } from '../context/AuthContext';

// Re-exportar el hook useAuth desde el contexto
export const useAuth = useAuthContext;

// Hook para acceso rápido a información del usuario
export function useUser() {
  const { state } = useAuth();
  
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isTeamLeader: state.user?.role === 'TEAM_LEADER',
    isIndependent: state.user?.isIndependent ?? false,
    teamInfo: state.user?.equipo,
  };
}