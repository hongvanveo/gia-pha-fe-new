import { api, unwrap } from "../lib/api.js";

export const eventsService = {
  async create(payload) {
    const res = await api.post("/events", payload);
    return unwrap(res);
  },
  async list(params) {
    const res = await api.get("/events", { params });
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/events/${id}`);
    return unwrap(res);
  },
  async update(id, payload) {
    const res = await api.put(`/events/${id}`, payload);
    return unwrap(res);
  },
  async updateStatus(id, status) {
    const res = await api.put(`/events/${id}/status`, { status });
    return unwrap(res);
  },
  async remove(id) {
    const res = await api.delete(`/events/${id}`);
    return unwrap(res);
  },
  async register(id) {
    const res = await api.post(`/events/${id}/register`);
    return unwrap(res);
  },
  async updateParticipantStatus(id, userId, status) {
    const res = await api.put(`/events/${id}/participants/${userId}/status`, { status });
    return unwrap(res);
  }
};
