import type { Order } from '../types';

export type ClientActiveOrderSnapshot = {
  orderId: number;
  orderCode?: string | null;
  tableName?: string | null;
  tableCode?: string | null;
  status: Order['status'];
  updatedAt: string;
};

const ACTIVE_STATUSES: Array<Order['status']> = ['pending', 'active', 'pending_end'];
const isBrowser = typeof window !== 'undefined';

export const CLIENT_ACTIVE_ORDER_STORAGE_KEY = 'client_active_order';
export const CLIENT_ACTIVE_ORDER_EVENT = 'client-active-order-change';

const dispatchActiveOrderEvent = (payload: ClientActiveOrderSnapshot | null) => {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(CLIENT_ACTIVE_ORDER_EVENT, { detail: payload }));
};

const getStorage = () => {
  if (!isBrowser) return null;
  return window.localStorage;
};

export const isClientOrderContinuable = (status?: Order['status'] | null): status is Order['status'] => {
  if (!status) return false;
  return ACTIVE_STATUSES.includes(status);
};

export const getClientOrderStatusLabel = (status?: Order['status'] | null) => {
  switch (status) {
    case 'pending':
      return 'Chờ duyệt';
    case 'active':
      return 'Đang chơi';
    case 'pending_end':
      return 'Chờ kết thúc';
    case 'completed':
      return 'Đã hoàn tất';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

export const readClientActiveOrder = (): ClientActiveOrderSnapshot | null => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(CLIENT_ACTIVE_ORDER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ClientActiveOrderSnapshot;
    if (!isClientOrderContinuable(parsed.status)) {
      storage.removeItem(CLIENT_ACTIVE_ORDER_STORAGE_KEY);
      dispatchActiveOrderEvent(null);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(CLIENT_ACTIVE_ORDER_STORAGE_KEY);
    dispatchActiveOrderEvent(null);
    return null;
  }
};

export const clearClientActiveOrder = () => {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(CLIENT_ACTIVE_ORDER_STORAGE_KEY);
  }
  dispatchActiveOrderEvent(null);
};

type SnapshotInput = {
  orderId: number;
  status: Order['status'];
  orderCode?: string | null;
  tableName?: string | null;
  tableCode?: string | null;
};

export const persistClientActiveOrder = (input: SnapshotInput | null) => {
  if (!input || !isClientOrderContinuable(input.status)) {
    clearClientActiveOrder();
    return null;
  }
  const snapshot: ClientActiveOrderSnapshot = {
    orderId: input.orderId,
    orderCode: input.orderCode ?? null,
    tableName: input.tableName ?? null,
    tableCode: input.tableCode ?? null,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  const storage = getStorage();
  if (storage) {
    storage.setItem(CLIENT_ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(snapshot));
  }
  dispatchActiveOrderEvent(snapshot);
  return snapshot;
};

export const persistClientActiveOrderFromOrder = (order: Order | null | undefined) => {
  if (!order) {
    clearClientActiveOrder();
    return null;
  }
  return persistClientActiveOrder({
    orderId: order.id,
    orderCode: order.order_code,
    tableName: order.table?.name ?? null,
    tableCode: order.table?.code ?? null,
    status: order.status,
  });
};


