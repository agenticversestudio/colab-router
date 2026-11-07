import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { useTelemetryStore } from './store/useTelemetryStore';
import { seedInitialData } from './db';
import { AuthGate } from './components/auth/AuthGate';
import { DesktopLayout } from './components/layout/DesktopLayout';

export const App: React.FC = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const loadConversations = useChatStore(s => s.loadConversations);

  useEffect(() => {
    // Initialize IndexedDB memory and seed data
    seedInitialData().then(() => {
      loadConversations();
    });
  }, [loadConversations]);

  useEffect(() => {
    if (isAuthenticated) {
      useTelemetryStore.getState().startPolling();
      return () => useTelemetryStore.getState().stopPolling();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <DesktopLayout />;
};

export default App;
