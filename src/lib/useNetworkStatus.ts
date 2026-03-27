/**
 * React hook exposing live network connectivity state.
 * Wraps the lower-level network-monitor module for use in components.
 */

import { useState, useEffect } from 'react';
import { addNetworkListener, isOnline } from './network-monitor';
import { getQueueLength } from './offline-queue';

export function useNetworkStatus() {
  const [connected, setConnected] = useState(isOnline());
  const [pendingOps, setPendingOps] = useState(0);

  useEffect(() => {
    // Seed queue length
    getQueueLength().then(setPendingOps);

    const unsubscribe = addNetworkListener((online) => {
      setConnected(online);
      // Refresh queue count on connectivity change
      getQueueLength().then(setPendingOps);
    });

    return unsubscribe;
  }, []);

  return { isOnline: connected, pendingOps };
}
