import { api, unwrap } from "../lib/api.js";

export const notificationsService = {
    // Get my notifications (paginated)
    list: async (params = {}) => {
        const res = await api.get("/notifications", { params });
        return unwrap(res);
    },
    // Get unread count for bell badge
    getUnreadCount: async () => {
        const res = await api.get("/notifications/unread-count");
        return unwrap(res);
    },
    // Mark single notification as read
    markRead: async (id) => {
        const res = await api.put(`/notifications/${id}/read`);
        return unwrap(res);
    },
    // Mark all as read
    markAllRead: async () => {
        const res = await api.put("/notifications/mark-all-read");
        return unwrap(res);
    },
    // Admin: broadcast
    broadcast: async (data) => {
        const res = await api.post("/notifications/broadcast", data);
        return unwrap(res);
    },
};
