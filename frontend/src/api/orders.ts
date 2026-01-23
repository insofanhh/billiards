import { apiClient } from './client';
import type { Order } from '../types';

export interface CreateOrderRequest {
  table_code: string;
}

export interface AddServiceRequest {
  service_id: number;
  qty: number;
}

export interface CreateTransactionRequest {
  method: 'cash' | 'card' | 'mobile';
  amount: number;
}

export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders');
    return response.data.data || response.data;
  },

  getById: async (id: number, storeSlug?: string): Promise<Order> => {
    const url = storeSlug ? `/orders/${id}?store_slug=${storeSlug}` : `/orders/${id}`;
    const response = await apiClient.get(url);
    return response.data.data || response.data;
  },

  create: async (data: CreateOrderRequest, storeSlug?: string): Promise<Order> => {
    const url = storeSlug ? `/orders?store_slug=${storeSlug}` : '/orders';
    const response = await apiClient.post(url, data);
    return response.data.data || response.data;
  },

  approve: async (id: number): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${id}/approve`);
    return response.data.data || response.data;
  },

  reject: async (id: number): Promise<void> => {
    await apiClient.patch(`/orders/${id}/reject`);
  },

  requestEnd: async (id: number): Promise<void> => {
    await apiClient.post(`/orders/${id}/request-end`);
  },

  approveEnd: async (id: number): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${id}/approve-end`);
    return response.data.data || response.data;
  },

  rejectEnd: async (id: number): Promise<void> => {
    await apiClient.patch(`/orders/${id}/reject-end`);
  },

  addService: async (id: number, data: AddServiceRequest): Promise<void> => {
    await apiClient.post(`/orders/${id}/services`, data);
  },

  updateService: async (id: number, itemId: number, qty: number): Promise<void> => {
    await apiClient.patch(`/orders/${id}/services/${itemId}`, { qty });
  },

  removeService: async (id: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/orders/${id}/services/${itemId}`);
  },

  confirmServiceItem: async (id: number, itemId: number): Promise<void> => {
    await apiClient.patch(`/orders/${id}/services/${itemId}/confirm`);
  },

  createTransaction: async (id: number, data: CreateTransactionRequest): Promise<void> => {
    await apiClient.post(`/orders/${id}/transactions`, data);
  },

  confirmTransaction: async (id: number, txnId: number): Promise<void> => {
    await apiClient.patch(`/orders/${id}/transactions/${txnId}/confirm`);
  },

  applyDiscount: async (id: number, code: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${id}/apply-discount`, { code });
    return response.data.data || response.data;
  },

  removeDiscount: async (id: number): Promise<Order> => {
    const response = await apiClient.post(`/orders/${id}/remove-discount`);
    return response.data.data || response.data;
  },

  cancelRequest: async (id: number): Promise<Order> => {
    const response = await apiClient.post(`/orders/${id}/cancel-request`);
    return response.data.data || response.data;
  },
};

