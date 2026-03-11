import { api, unwrap } from "../lib/api.js";

export const moderationService = {
    async getPending() {
        const res = await api.get("/moderation/pending");
        return unwrap(res);
    },
    async updateStatus(id, status) {
        const res = await api.put(`/moderation/${id}`, { status });
        return unwrap(res);
    }
};
