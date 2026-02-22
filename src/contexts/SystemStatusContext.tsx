import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config/api';

export interface SystemStatus {
  status: 'operational' | 'maintenance' | 'degraded';
  status_display: string;
  message: string;
  updated_at: string;
}

interface SystemStatusContextType {
  systemStatus: SystemStatus | null;
  isMaintenanceActive: boolean;
  isDegraded: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isThrottled: boolean;
  throttleMessage: string | null;
  error: string | null;
  refetchStatus: () => Promise<void>;
  setSystemStatus: (status: SystemStatus | null) => void;
}

const SystemStatusContext = createContext<SystemStatusContextType | undefined>(undefined);

export function SystemStatusProvider({ children }: { children: React.ReactNode }) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleMessage, setThrottleMessage] = useState<string | null>(null);

  const fetchSystemStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsThrottled(false);
      setThrottleMessage(null);
      
      const response = await fetch(`${API_BASE_URL}/system/health/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSystemStatus(data.data);
        }
      } else if (response.status === 429) {
        // Rate limiting - 20 soniya kutuv
        setIsThrottled(true);
        setThrottleMessage('Juda ko\'p so\'rov. Iltimos, 20 soniya kutin.');
        console.warn('⏱️ Rate limited: Please wait 20 seconds');
      } else {
        // Agar health check xato bo'lsa, maintenance deb ko'rsatish
        setError('System health check failed');
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  // Darhol birinchi bor tekshirish (sayt load bo'lganda)
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  // Keyin har 60 sekundda tekshirish (rate limiting: 10 sekund = 1 so'rov)
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(fetchSystemStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, [isInitialized]);

  const isMaintenanceActive = systemStatus?.status === 'maintenance';
  const isDegraded = systemStatus?.status === 'degraded';

  return (
    <SystemStatusContext.Provider
      value={{
        systemStatus,
        isMaintenanceActive,
        isDegraded,
        isLoading,
        isInitialized,
        isThrottled,
        throttleMessage,
        error,
        refetchStatus: fetchSystemStatus,
        setSystemStatus,
      }}
    >
      {children}
    </SystemStatusContext.Provider>
  );
}

export function useSystemStatus() {
  const context = useContext(SystemStatusContext);
  if (!context) {
    throw new Error('useSystemStatus must be used within SystemStatusProvider');
  }
  return context;
}
