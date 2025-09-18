// Online status hook for network connectivity detection

import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
    downlink: 0,
    effectiveType: 'unknown',
    rtt: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        downlink: connection?.downlink || 0,
        effectiveType: connection?.effectiveType || 'unknown',
        rtt: connection?.rtt || 0,
      });
    };

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update on connection change if supported
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial update
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}