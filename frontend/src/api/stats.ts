import { apiClient } from './client';

export const statsApi = {
    getDailyRevenue: async () => {
        const url = '/stats/daily-revenue';
        const response = await apiClient.get(url);
        return response.data;
    }
};
