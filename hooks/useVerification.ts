'use client';

import { useState, useCallback } from 'react';
import { 
  VerificationState, 
  SendVerificationRequest, 
  VerifyAndRegisterRequest,
  VerifyAndRegisterTeamLeaderRequest 
} from '../lib/types';
import { authApi } from '../lib/api';
import { formatApiError } from '../lib/utils';

interface UseVerificationReturn {
  state: VerificationState;
  sendVerificationCode: (data: SendVerificationRequest) => Promise<boolean>;
  verifyAndRegister: (password: string, code: string, teamData?: { equipoNombre: string; equipoDescripcion?: string }) => Promise<boolean>;
  resendCode: () => Promise<boolean>;
  goBack: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  resetVerification: () => void;
}

const VERIFICATION_TIMEOUT = 300; // 5 minutos en segundos

export function useVerification(): UseVerificationReturn {
  const [state, setState] = useState<VerificationState>({
    step: 'email',
    email: '',
    nombre: '',
    userType: 'individual',
    isLoading: false,
    error: null,
    timeLeft: VERIFICATION_TIMEOUT,
    canResend: true,
  });

  // Enviar código de verificación
  const sendVerificationCode = useCallback(async (data: SendVerificationRequest): Promise<boolean> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        email: data.email,
        nombre: data.nombre 
      }));

      await authApi.sendVerificationCode(data);
      
      setState(prev => ({
        ...prev,
        step: 'verification',
        isLoading: false,
        timeLeft: VERIFICATION_TIMEOUT,
        canResend: false,
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatApiError(error),
      }));
      return false;
    }
  }, []);

  // Verificar código y registrar usuario
  const verifyAndRegister = useCallback(async (
    password: string, 
    code: string, 
    teamData?: { equipoNombre: string; equipoDescripcion?: string }
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (state.userType === 'team-leader' && teamData) {
        const request: VerifyAndRegisterTeamLeaderRequest = {
          nombre: state.nombre,
          email: state.email,
          password,
          verificationCode: code,
          equipoNombre: teamData.equipoNombre,
          equipoDescripcion: teamData.equipoDescripcion,
        };

        await authApi.verifyAndRegisterTeamLeader(request);
      } else {
        const request: VerifyAndRegisterRequest = {
          nombre: state.nombre,
          email: state.email,
          password,
          verificationCode: code,
        };

        await authApi.verifyAndRegister(request);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatApiError(error),
      }));
      return false;
    }
  }, [state.nombre, state.email, state.userType]);

  // Reenviar código
  const resendCode = useCallback(async (): Promise<boolean> => {
    if (!state.canResend) return false;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await authApi.sendVerificationCode({
        nombre: state.nombre,
        email: state.email,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        timeLeft: VERIFICATION_TIMEOUT,
        canResend: false,
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatApiError(error),
      }));
      return false;
    }
  }, [state.nombre, state.email, state.canResend]);

  // Volver al paso anterior
  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'email',
      error: null,
    }));
  }, []);

  // Establecer error
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Establecer loading
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Resetear todo el estado de verificación
  const resetVerification = useCallback(() => {
    setState({
      step: 'email',
      email: '',
      nombre: '',
      userType: 'individual',
      isLoading: false,
      error: null,
      timeLeft: VERIFICATION_TIMEOUT,
      canResend: true,
    });
  }, []);

  // Actualizar estado del timer
  const updateTimer = useCallback((timeLeft: number, canResend: boolean) => {
    setState(prev => ({ ...prev, timeLeft, canResend }));
  }, []);

  return {
    state,
    sendVerificationCode,
    verifyAndRegister,
    resendCode,
    goBack,
    setError,
    setLoading,
    resetVerification,
  };
}