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

const DEFAULT_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';
// No credentials are baked into the bundle: everything shipped to Vercel is public.
// The user types their passkey or sk- API key on the login screen; the gateway checks it.

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

  // Not logged in -> show the login screen (no built-in master credentials).
  const defaultAuth = {
    isAuthenticated: false,
    userId: '',
    passkey: '',
    apiKey: '',
  };

  const activeAuth = initial && initial.isAuthenticated && (initial.apiKey?.startsWith('sk-') || initial.passkey)
    ? initial
    : defaultAuth;

  return {
    isAuthenticated: !!activeAuth.isAuthenticated,
    userId: activeAuth.userId || '',
    passkey: activeAuth.passkey || '',
    apiKey: activeAuth.apiKey || '',
    baseUrl: normalizeBaseUrl(savedBaseUrl || DEFAULT_BASE_URL),
    rememberMe: isRemembered,

    login: async (userId: string, passkey: string, customBaseUrl?: string, rememberMe: boolean = true) => {
      const trimmedUser = userId.trim();
      const trimmedPass = passkey.trim();
      const activeBaseUrl = normalizeBaseUrl(customBaseUrl || localStorage.getItem('agentic_studio_base_url') || DEFAULT_BASE_URL);

      let verifiedApiKey = trimmedPass.startsWith('sk-') ? trimmedPass : '';

      if (!trimmedPass) {
        return false;
      }

      if (activeBaseUrl && trimmedPass) {
        try {
          // Try /auth/login with credentials first
          const loginRes = await fetch(`${activeBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ user_id: trimmedUser, passkey: trimmedPass })
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
                'x-user-id': trimmedUser,
                'ngrok-skip-browser-warning': 'true'
              }
            });
            if (verifyRes.status === 401 || verifyRes.status === 403) {
              return false;
            }
          }
        } catch {
          // Gateway offline (Colab session ended): keep the typed credentials so the UI opens;
          // the header shows "Offline" and the gateway still checks the key on every request.
        }
      }

      const authData = {
        isAuthenticated: true,
        userId: trimmedUser,
        passkey: trimmedPass,
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
