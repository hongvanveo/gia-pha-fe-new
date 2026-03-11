import { api, unwrap } from "../lib/api.js";

export const auditService = {
    async list(params) {
        const res = await api.get("/audit", { params });
        return unwrap(res);
    },
    async get(id) {
        const res = await api.get(`/audit/${id}`);
        return unwrap(res);
    },
    async getEntityHistory(type, id, params) {
        const res = await api.get(`/audit/entity/${type}/${id}`, { params });
        return unwrap(res);
    },
};
