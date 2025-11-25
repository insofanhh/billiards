import { useEffect, useState } from 'react';
import type { ClientActiveOrderSnapshot } from '../utils/clientActiveOrder';
import {
  CLIENT_ACTIVE_ORDER_EVENT,
  CLIENT_ACTIVE_ORDER_STORAGE_KEY,
  readClientActiveOrder,
} from '../utils/clientActiveOrder';

export function useClientActiveOrder() {
  const [activeOrder, setActiveOrder] = useState<ClientActiveOrderSnapshot | null>(() => readClientActiveOrder());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleChange = () => {
      setActiveOrder(readClientActiveOrder());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CLIENT_ACTIVE_ORDER_STORAGE_KEY) {
        handleChange();
      }
    };

    window.addEventListener(CLIENT_ACTIVE_ORDER_EVENT, handleChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(CLIENT_ACTIVE_ORDER_EVENT, handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return activeOrder;
}


