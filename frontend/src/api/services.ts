import { apiClient } from './client';
import type { Service } from '../types';

export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await apiClient.get('/services');
    return response.data.data || response.data;
  },
};

