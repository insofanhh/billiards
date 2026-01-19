import { apiClient } from './client';

export interface RegisterStoreRequest {
  store_name: string;
  owner_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const platformApi = {
  registerStore: async (data: RegisterStoreRequest) => {
    const response = await apiClient.post('/platform/register-store', data);
    return response.data;
  },
};
