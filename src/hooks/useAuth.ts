import { useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { authService } from '../auth/authService';

type AuthMode = 'login' | 'register';

export interface UseAuthReturn {
  mode: AuthMode;
  username: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  showBiometricButton: boolean;
  lastUsername: string | null;
  setMode: (mode: AuthMode) => void;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  handleSubmit: () => Promise<boolean>;
  handleBiometric: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUsername, setLastUsername] = useState<string | null>(null);
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  // ── Boot: read last username ───────────────────────────────────────────────
  useEffect(() => {
    //console.log('[useAuth] boot — reading lastUsername from storage');
    authService.getLastUsername().then((last) => {
      //console.log('[useAuth] boot — lastUsername from storage:', last);
      if (last) setLastUsername(last);
    });
  }, []);

  // ── Biometric button visibility ────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'login') {
      setShowBiometricButton(false);
      return;
    }
    const nameToCheck = username.trim() || lastUsername || '';
    if (!nameToCheck) {
      setShowBiometricButton(false);
      return;
    }
    let cancelled = false;
    //console.log('[useAuth] checking biometric preference for:', nameToCheck);
    authService.isBiometricEnabledForUser(nameToCheck).then((enabled) => {
      if (!cancelled) {
        //console.log('[useAuth] showBiometricButton for', nameToCheck, '→', enabled);
        setShowBiometricButton(enabled);
      }
    });
    return () => { cancelled = true; };
  }, [username, mode, lastUsername]);

  // ── Clear on mode switch ───────────────────────────────────────────────────
  useEffect(() => {
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  // ── Password login / register ──────────────────────────────────────────────
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return false;
    }
    setIsLoading(true);
    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return false;
        }
        //console.log('[useAuth] registering:', username.trim());
        const result = await authService.register(username.trim(), password);
        if (!result.success) {
          setError(result.error ?? 'Registration failed.');
          return false;
        }
        setLastUsername(username.trim());
        //console.log('[useAuth] register success');
        return true;
      } else {
        //console.log('[useAuth] logging in:', username.trim());
        const result = await authService.login(username.trim(), password);
        if (!result.success) {
          setError(result.error ?? 'Login failed.');
          return false;
        }
        setLastUsername(username.trim());
        //console.log('[useAuth] login success');
        return true;
      }
    } catch (err) {
      console.error('[useAuth.handleSubmit] unexpected error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg ? `Something went wrong: ${msg}` : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [mode, username, password, confirmPassword]);

  // ── Biometric login ────────────────────────────────────────────────────────
  const handleBiometric = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);
    //console.log('[useAuth] handleBiometric — start, AppState:', AppState.currentState);

    try {
      //console.log('[useAuth] calling authenticateWithBiometrics...');
      const result = await authService.authenticateWithBiometrics();
      //console.log('[useAuth] authenticateWithBiometrics returned:', JSON.stringify(result));
      //console.log('[useAuth] AppState after biometric prompt:', AppState.currentState);

      if (!result.success) {
        //console.log('[useAuth] biometric FAILED:', result.error);
        const errMsg = result.error ?? 'Biometric authentication failed.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      // Resolve session name
      let sessionName: string | null = username.trim() || lastUsername;
      if (!sessionName) {
        //console.log('[useAuth] no username in state, reading from storage...');
        sessionName = await authService.getLastUsername();
      }
      //console.log('[useAuth] sessionName resolved to:', sessionName);

      if (sessionName) {
        await authService.setSessionUser(sessionName);
        //console.log('[useAuth] setSessionUser done for:', sessionName);
      } else {
        console.warn('[useAuth] WARNING: no sessionName found — session will be empty');
      }

      //console.log('[useAuth] handleBiometric — returning true');
      return { success: true };
    } catch (err) {
      console.error('[useAuth] handleBiometric — unexpected error:', err);
      setError('Biometric authentication unavailable.');
      return { success: false, error: 'Biometric authentication unavailable.' };
    } finally {
      setIsLoading(false);
    }
  }, [username, lastUsername]);

  return {
    mode, username, password, confirmPassword,
    isLoading, error, showBiometricButton, lastUsername,
    setMode, setUsername, setPassword, setConfirmPassword,
    handleSubmit, handleBiometric,
    clearError: () => setError(null),
  };
};