import { 
  API_CONFIG, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  RegisterTeamLeaderRequest,
  User,
  ApiError,
  SendVerificationRequest,
  VerificationResponse,
  VerifyAndRegisterRequest,
  VerifyAndRegisterTeamLeaderRequest,
  ForgotPasswordSendCodeRequest,
  ResetPasswordWithCodeRequest,
  ForgotPasswordResponse
} from './types';
import { storage, tokenUtils } from './utils';

class ApiClient {
  private baseURL = API_CONFIG.BASE_URL;
  private tokenCookieName = 'auth_token';
  
  // Helper para hacer peticiones HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const authEndpoints = new Set([
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      API_CONFIG.ENDPOINTS.AUTH.REGISTER_TEAM_LEADER,
      API_CONFIG.ENDPOINTS.AUTH.SEND_VERIFICATION_CODE,
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_AND_REGISTER,
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_AND_REGISTER_TEAM_LEADER,
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_SEND_CODE,
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET,
    ]);
    
    // Headers por defecto
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    });

    // Agregar token JWT si está disponible
    const token = this.getToken();
    if (token && !tokenUtils.isExpired(token)) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Si el token expiró, limpiar storage y redirigir al login
      if (response.status === 401 && !authEndpoints.has(endpoint)) {
        this.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Sesión expirada');
      }

      // Si la respuesta no es exitosa
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `Error ${response.status}`,
          status: response.status,
          code: errorData.code
        };
        throw error;
      }

      // Para endpoints que no devuelven JSON (como logout)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.warn('API Error:', error);
      
      // Si es un error de red
      if (error instanceof TypeError) {
        throw new Error('Error de conexión. Verifica tu internet.');
      }
      
      throw error;
    }
  }

  // Métodos de autenticación
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Guardar token en localStorage
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    // Guardar token en localStorage
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async registerTeamLeader(userData: RegisterTeamLeaderRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER_TEAM_LEADER,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    // Guardar token en localStorage
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Siempre limpiar el storage local
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>(API_CONFIG.ENDPOINTS.AUTH.ME);
  }

  async generateTeamCode(): Promise<{ codigo: string }> {
    return this.request<{ codigo: string }>(
      API_CONFIG.ENDPOINTS.AUTH.GENERATE_TEAM_CODE
    );
  }

  // Métodos de verificación por email
  async sendVerificationCode(data: SendVerificationRequest): Promise<VerificationResponse> {
    return this.request<VerificationResponse>(
      API_CONFIG.ENDPOINTS.AUTH.SEND_VERIFICATION_CODE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async verifyAndRegister(data: VerifyAndRegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_AND_REGISTER,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Guardar token en localStorage
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async verifyAndRegisterTeamLeader(data: VerifyAndRegisterTeamLeaderRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_AND_REGISTER_TEAM_LEADER,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Guardar token en localStorage
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Metodos de recuperacion de contrasena
  async sendForgotPasswordCode(data: ForgotPasswordSendCodeRequest): Promise<ForgotPasswordResponse> {
    return this.request<ForgotPasswordResponse>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_SEND_CODE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async resetPasswordWithCode(data: ResetPasswordWithCodeRequest): Promise<ForgotPasswordResponse> {
    return this.request<ForgotPasswordResponse>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Métodos de gestión de tokens
  setToken(token: string): void {
    storage.set('auth_token', token);
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=${token}; path=/`;
    }
  }

  getToken(): string | null {
    const storedToken = storage.get('auth_token');
    if (storedToken) {
      return storedToken;
    }

    if (typeof document === 'undefined') {
      return null;
    }

    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${this.tokenCookieName}=`))
      ?.split('=')[1];

    if (cookieToken) {
      storage.set('auth_token', cookieToken);
      return cookieToken;
    }

    return null;
  }

  clearAuth(): void {
    storage.remove('auth_token');
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; max-age=0';
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !tokenUtils.isExpired(token);
  }

  // Interceptor para verificar autenticación antes de peticiones
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado');
    }
    
    return this.request<T>(endpoint, options);
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Métodos específicos exportados para facilitar el uso
export const authApi = {
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  register: (userData: RegisterRequest) => apiClient.register(userData),
  registerTeamLeader: (userData: RegisterTeamLeaderRequest) => 
    apiClient.registerTeamLeader(userData),
  logout: () => apiClient.logout(),
  getCurrentUser: () => apiClient.getCurrentUser(),
  generateTeamCode: () => apiClient.generateTeamCode(),
  isAuthenticated: () => apiClient.isAuthenticated(),
  // Métodos de verificación por email
  sendVerificationCode: (data: SendVerificationRequest) => 
    apiClient.sendVerificationCode(data),
  verifyAndRegister: (data: VerifyAndRegisterRequest) => 
    apiClient.verifyAndRegister(data),
  verifyAndRegisterTeamLeader: (data: VerifyAndRegisterTeamLeaderRequest) => 
    apiClient.verifyAndRegisterTeamLeader(data),
  // Recuperacion de contrasena
  sendForgotPasswordCode: (data: ForgotPasswordSendCodeRequest) => 
    apiClient.sendForgotPasswordCode(data),
  resetPasswordWithCode: (data: ResetPasswordWithCodeRequest) => 
    apiClient.resetPasswordWithCode(data),
};

export default apiClient;