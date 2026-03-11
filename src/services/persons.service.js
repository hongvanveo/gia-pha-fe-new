import { api, unwrap } from "../lib/api.js";

export const personsService = {
  async create(payload) {
    const res = await api.post("/persons", payload);
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/persons/${id}`);
    return unwrap(res);
  },
  async update(id, payload) {
    const res = await api.put(`/persons/${id}`, payload);
    return unwrap(res);
  },
  async remove(id) {
    const res = await api.delete(`/persons/${id}`);
    return unwrap(res);
  },
  async list(params) {
    const res = await api.get("/persons", { params });
    return unwrap(res);
  },
  async tree(id, params) {
    const res = await api.get(`/persons/${id}/tree`, { params });
    return unwrap(res);
  },
  // Simple mocks for ancestors/descendants
  async ancestors(id, params) {
    const res = await api.get(`/persons/${id}/ancestors`, { params });
    return unwrap(res);
  },
  async descendants(id, params) {
    const res = await api.get(`/persons/${id}/descendants`, { params });
    return unwrap(res);
  },
};
