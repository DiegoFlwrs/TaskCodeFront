// Types para la API de TaskCodeBack

export interface User {
  id: number;
  nombre: string;
  email: string;
  role: 'USER' | 'TEAM_LEADER';
  isIndependent: boolean;
  equipo?: {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
  };
  activo: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface RegisterTeamLeaderRequest extends RegisterRequest {
  equipoNombre: string;
  equipoDescripcion?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Verificación por email
export interface SendVerificationRequest {
  nombre: string;
  email: string;
}

export interface VerificationResponse {
  message: string;
  email: string;
}

export interface VerifyAndRegisterRequest {
  nombre: string;
  email: string;
  password: string;
  verificationCode: string;
}

export interface VerifyAndRegisterTeamLeaderRequest extends VerifyAndRegisterRequest {
  equipoNombre: string;
  equipoDescripcion?: string;
}

// Recuperacion de contrasena
export interface ForgotPasswordSendCodeRequest {
  email: string;
}

export interface ResetPasswordWithCodeRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerificationState {
  step: 'email' | 'verification';
  email: string;
  nombre: string;
  userType: 'individual' | 'team-leader';
  isLoading: boolean;
  error: string | null;
  timeLeft: number;
  canResend: boolean;
}

// Estados de la aplicación
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterTeamLeaderFormData extends RegisterFormData {
  equipoNombre: string;
  equipoDescripcion?: string;
}

// Tipos para componentes UI
export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// Configuración
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REGISTER_TEAM_LEADER: '/api/auth/register-team-leader',
      LOGOUT: '/api/auth/logout',
      ME: '/api/auth/me',
      GENERATE_TEAM_CODE: '/api/auth/generate-team-code',
      SEND_VERIFICATION_CODE: '/api/auth/send-verification-code',
      VERIFY_AND_REGISTER: '/api/auth/verify-and-register',
      VERIFY_AND_REGISTER_TEAM_LEADER: '/api/auth/verify-and-register-team-leader',
      FORGOT_PASSWORD_SEND_CODE: '/api/auth/forgot-password/send-code',
      FORGOT_PASSWORD_RESET: '/api/auth/forgot-password/reset',
    },
  },
} as const;