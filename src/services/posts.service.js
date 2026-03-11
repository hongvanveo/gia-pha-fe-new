import { api, unwrap } from "../lib/api.js";

export const postsService = {
    // 1. Quản lý Bài viết
    async list(params) {
        const res = await api.get("/posts", { params });
        let list = res?.data?.data || res?.data || unwrap(res);
        if (list && !Array.isArray(list) && Array.isArray(list.data)) {
            list = list.data;
        }
        if (list && Array.isArray(list)) {
            // Đảm bảo bài viết mới nằm trên cùng
            return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return [];
    },

    async create(payload) {
        const res = await api.post("/posts", payload);
        return unwrap(res);
    },

    async update(id, payload) {
        const res = await api.put(`/posts/${id}`, payload);
        return unwrap(res);
    },

    async remove(id) {
        const res = await api.delete(`/posts/${id}`);
        return unwrap(res);
    },

    // 2. Tương tác
    async toggleLike(id) {
        const res = await api.post(`/posts/${id}/like`);
        return unwrap(res);
    },

    // 3. Bình luận
    async getComments(id, params) {
        const res = await api.get(`/posts/${id}/comments`, { params });
        // Return comments array
        return res?.data?.data || res?.data || unwrap(res) || [];
    },

    async addComment(id, content) {
        const res = await api.post(`/posts/${id}/comments`, { content });
        return unwrap(res);
    },

    async updateComment(postId, commentId, content) {
        const res = await api.put(`/posts/comments/${commentId}`, { content });
        return unwrap(res);
    },

    async removeComment(postId, commentId) {
        const res = await api.delete(`/posts/comments/${commentId}`);
        return unwrap(res);
    }
};
