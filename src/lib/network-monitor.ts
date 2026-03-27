/**
 * Network connectivity monitor.
 * Tracks online/offline state and notifies listeners on change.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkListener = (isConnected: boolean) => void;

let _isConnected = true;
const _listeners = new Set<NetworkListener>();

export function isOnline(): boolean {
  return _isConnected;
}

export function addNetworkListener(listener: NetworkListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function initNetworkMonitor(): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const connected = state.isConnected ?? true;
    const wasConnected = _isConnected;
    _isConnected = connected;

    // Only notify on actual state change
    if (connected !== wasConnected) {
      _listeners.forEach((fn) => fn(connected));
    }
  });

  return unsubscribe;
}
