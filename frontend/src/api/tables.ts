import { apiClient } from './client';
import type { Table } from '../types';

export const tablesApi = {
  getAll: async (): Promise<Table[]> => {
    const response = await apiClient.get('/tables');
    return response.data.data || response.data;
  },

  getByCode: async (code: string): Promise<Table> => {
    const response = await apiClient.get(`/tables/${code}`);
    return response.data.data || response.data;
  },

  requestOpen: async (code: string, name: string): Promise<{ user: any; token: string; order: { id: number } }> => {
    const response = await apiClient.post(`/tables/${code}/request-open`, { name });
    return response.data;
  },
};

