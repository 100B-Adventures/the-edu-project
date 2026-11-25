import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

/** 브라우저 연결 상태. 서버 렌더에서는 연결돼 있다고 본다. */
export const useOnline = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
