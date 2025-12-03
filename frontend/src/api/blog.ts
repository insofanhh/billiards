import { apiClient as client } from './client';

export const blogApi = {
    // Categories
    getCategories: async () => {
        const response = await client.get('/public/categories');
        return response.data;
    },
    createCategory: async (data: any) => {
        const response = await client.post('/categories', data);
        return response.data;
    },
    updateCategory: async (id: number, data: any) => {
        const response = await client.put(`/categories/${id}`, data);
        return response.data;
    },
    deleteCategory: async (id: number) => {
        const response = await client.delete(`/categories/${id}`);
        return response.data;
    },

    // Posts
    getPosts: async (params?: any) => {
        const response = await client.get('/public/posts', { params });
        return response.data;
    },
    getPost: async (id: number) => {
        const response = await client.get(`/public/posts/${id}`);
        return response.data;
    },
    createPost: async (data: FormData) => {
        const response = await client.post('/posts', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    updatePost: async (id: number, data: FormData) => {
        data.append('_method', 'PUT');
        const response = await client.post(`/posts/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    deletePost: async (id: number) => {
        const response = await client.delete(`/posts/${id}`);
        return response.data;
    },
    uploadImage: async (image: File) => {
        const formData = new FormData();
        formData.append('image', image);
        const response = await client.post('/posts/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Comments
    getComments: async (postId: number) => {
        const response = await client.get(`/public/posts/${postId}/comments`);
        return response.data;
    },
    createComment: async (postId: number, content: string) => {
        const response = await client.post(`/posts/${postId}/comments`, { content });
        return response.data;
    }
};
