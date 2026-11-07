import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  userId: string;
  passkey: string;
  apiKey: string;
  baseUrl: string;
  rememberMe: boolean;
  login: (userId: string, passkey: string, customBaseUrl?: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  setBaseUrl: (url: string) => void;
}

export function normalizeBaseUrl(url: string): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/v1')) {
    cleaned = cleaned.slice(0, -3).replace(/\/+$/, '');
  }
  return cleaned;
}

const DEFAULT_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'https://eel-feminine-progeny.ngrok-free.dev';
const MASTER_USER = 'glmdsqn@jaggu#av';
const MASTER_PASSKEY = (import.meta.env.VITE_DEFAULT_PASSKEY as string) || 'gqd@534$$AV';
const MASTER_API_KEY = 'sk-jaggu-7f89d3a4c5e21b0698f12a3d4e5f60718293a4b5c6d7e8f9';

export const useAuthStore = create<AuthStore>((set) => {
  // Check localStorage first (if user enabled Save Info), otherwise sessionStorage
  const savedAuth = localStorage.getItem('agentic_studio_auth') || sessionStorage.getItem('agentic_studio_auth');
  let initial = null;
  try {
    initial = savedAuth ? JSON.parse(savedAuth) : null;
  } catch {
    initial = null;
  }
  const isRemembered = localStorage.getItem('agentic_studio_remember') === 'true';
  const savedBaseUrl = localStorage.getItem('agentic_studio_base_url');

  // Fall back to pre-configured sovereign credentials if not logged in or invalid
  const defaultAuth = {
    isAuthenticated: true,
    userId: MASTER_USER,
    passkey: MASTER_PASSKEY,
    apiKey: MASTER_API_KEY,
  };

  const activeAuth = initial && initial.isAuthenticated && (initial.apiKey?.startsWith('sk-') || initial.passkey)
    ? initial
    : defaultAuth;

  return {
    isAuthenticated: !!activeAuth.isAuthenticated,
    userId: activeAuth.userId || MASTER_USER,
    passkey: activeAuth.passkey || MASTER_PASSKEY,
    apiKey: activeAuth.apiKey || MASTER_API_KEY,
    baseUrl: normalizeBaseUrl(savedBaseUrl || DEFAULT_BASE_URL),
    rememberMe: isRemembered,

    login: async (userId: string, passkey: string, customBaseUrl?: string, rememberMe: boolean = true) => {
      const trimmedUser = userId.trim();
      const trimmedPass = passkey.trim();
      const activeBaseUrl = normalizeBaseUrl(customBaseUrl || localStorage.getItem('agentic_studio_base_url') || DEFAULT_BASE_URL);

      let verifiedApiKey = trimmedPass.startsWith('sk-') ? trimmedPass : MASTER_API_KEY;

      if (activeBaseUrl && trimmedPass) {
        try {
          // Try /auth/login with credentials first
          const loginRes = await fetch(`${activeBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ user_id: trimmedUser || MASTER_USER, passkey: trimmedPass })
          });
          if (loginRes.ok) {
            const data = await loginRes.json();
            if (data.api_key) {
              verifiedApiKey = data.api_key;
            }
          } else {
            // Also test verify
            const verifyRes = await fetch(`${activeBaseUrl}/auth/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${trimmedPass}`,
                'x-passkey': trimmedPass,
                'x-user-id': trimmedUser || MASTER_USER,
                'ngrok-skip-browser-warning': 'true'
              }
            });
            if (!verifyRes.ok && trimmedPass !== MASTER_PASSKEY) {
              return false;
            }
          }
        } catch {
          // If network / CORS failure, allow access if matching sovereign passkey
          if (trimmedPass !== MASTER_PASSKEY && !trimmedPass.startsWith('sk-')) {
            return false;
          }
        }
      }

      const authData = {
        isAuthenticated: true,
        userId: trimmedUser || MASTER_USER,
        passkey: trimmedPass || MASTER_PASSKEY,
        apiKey: verifiedApiKey,
        baseUrl: activeBaseUrl
      };

      sessionStorage.setItem('agentic_studio_auth', JSON.stringify(authData));
      localStorage.setItem('agentic_studio_base_url', activeBaseUrl);

      if (rememberMe) {
        localStorage.setItem('agentic_studio_auth', JSON.stringify(authData));
        localStorage.setItem('agentic_studio_remember', 'true');
      } else {
        localStorage.removeItem('agentic_studio_auth');
        localStorage.removeItem('agentic_studio_remember');
      }

      set({
        isAuthenticated: true,
        userId: authData.userId,
        passkey: authData.passkey,
        apiKey: authData.apiKey,
        baseUrl: activeBaseUrl,
        rememberMe
      });

      return true;
    },

    logout: () => {
      sessionStorage.removeItem('agentic_studio_auth');
      localStorage.removeItem('agentic_studio_auth');
      localStorage.removeItem('agentic_studio_remember');
      set({
        isAuthenticated: false,
        userId: '',
        passkey: '',
        rememberMe: false
      });
    },

    setBaseUrl: (url: string) => {
      const clean = normalizeBaseUrl(url);
      localStorage.setItem('agentic_studio_base_url', clean);
      set({ baseUrl: clean });
    }
  };
});
