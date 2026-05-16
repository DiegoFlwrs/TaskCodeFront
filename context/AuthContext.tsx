'use client';

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect,
  ReactNode 
} from 'react';
import { 
  User, 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  RegisterTeamLeaderRequest,
  SendVerificationRequest,
  VerifyAndRegisterRequest,
  VerifyAndRegisterTeamLeaderRequest
} from '../lib/types';
import { authApi } from '../lib/api';
import { formatApiError } from '../lib/utils';

// Tipos para las acciones del reducer
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// Reducer para gestionar el estado de autenticación
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };

    default:
      return state;
  }
}

// Contexto de autenticación
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  registerTeamLeader: (userData: RegisterTeamLeaderRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  generateTeamCode: () => Promise<string>;
  // Métodos de verificación por email
  sendVerificationCode: (data: SendVerificationRequest) => Promise<void>;
  verifyAndRegister: (data: VerifyAndRegisterRequest) => Promise<void>;
  verifyAndRegisterTeamLeader: (data: VerifyAndRegisterTeamLeaderRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contexto de autenticación
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar el estado de autenticación al cargar la app
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (!authApi.isAuthenticated()) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      // Verificar con el servidor que el token sigue siendo válido
      const user = await authApi.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Si hay error al verificar, hacer logout
      dispatch({ type: 'LOGOUT' });
      authApi.logout();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Login
  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.login(credentials);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw new Error(formatApiError(error));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Registro normal
  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.register(userData);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw new Error(formatApiError(error));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Registro como team leader
  const registerTeamLeader = async (userData: RegisterTeamLeaderRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.registerTeamLeader(userData);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw new Error(formatApiError(error));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout
  const logout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Generar código de equipo
  const generateTeamCode = async (): Promise<string> => {
    try {
      const response = await authApi.generateTeamCode();
      return response.codigo;
    } catch (error) {
      throw new Error(formatApiError(error));
    }
  };

  // Métodos de verificación por email
  const sendVerificationCode = async (data: SendVerificationRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authApi.sendVerificationCode(data);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(formatApiError(error));
    }
  };

  const verifyAndRegister = async (data: VerifyAndRegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.verifyAndRegister(data);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw new Error(formatApiError(error));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyAndRegisterTeamLeader = async (data: VerifyAndRegisterTeamLeaderRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authApi.verifyAndRegisterTeamLeader(data);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: response.user, 
          token: response.token 
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw new Error(formatApiError(error));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Efecto para verificar el estado de autenticación al montar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    state,
    login,
    register,
    registerTeamLeader,
    logout,
    checkAuthStatus,
    generateTeamCode,
    sendVerificationCode,
    verifyAndRegister,
    verifyAndRegisterTeamLeader,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;