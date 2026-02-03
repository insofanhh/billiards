import { apiClient } from './client';
import type { Table } from '../types';

export const tablesApi = {
  getAll: async (storeSlug?: string): Promise<Table[]> => {
    const url = storeSlug ? `/tables?store_slug=${storeSlug}` : '/tables';
    const response = await apiClient.get(url);
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  getByCode: async (code: string, storeSlug?: string): Promise<Table> => {
    const url = storeSlug ? `/tables/${code}?store_slug=${storeSlug}` : `/tables/${code}`;
    const response = await apiClient.get(url);
    return response.data.data || response.data;
  },

  requestOpen: async (code: string, name: string, storeSlug?: string): Promise<{ user: any; token?: string; order: { id: number } }> => {
    // Nếu name rỗng (user đã đăng nhập), gửi body rỗng
    const payload = name && name.trim() ? { name: name.trim() } : {};
    const url = storeSlug ? `/tables/${code}/request-open?store_slug=${storeSlug}` : `/tables/${code}/request-open`;
    const response = await apiClient.post(url, payload);
    return response.data;
  },
};

