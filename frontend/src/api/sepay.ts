import { apiClient } from './client';

export interface SepayConfig {
    bank_account: string;
    bank_provider: string;
    pattern: string;
}

export const sepayApi = {
    getConfig: async (): Promise<SepayConfig> => {
        const response = await apiClient.get('/sepay/config');
        return response.data;
    },
};
