import { api, unwrap } from "../lib/api.js";

/**
 * Spec:
 * POST /api/relationships
 * GET /api/relationships/:id
 * PUT /api/relationships/:id
 * DELETE /api/relationships/:id
 */
export const relationshipsService = {
  async create(payload) {
    const res = await api.post("/relationships", payload);
    return unwrap(res);
  },
  async getByPerson(personId) {
    const res = await api.get(`/relationships/person/${personId}`);
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/relationships/${id}`);
    return unwrap(res);
  },
  async update(id, payload) {
    const res = await api.put(`/relationships/${id}`, payload);
    return unwrap(res);
  },
  async remove(id) {
    const res = await api.delete(`/relationships/${id}`);
    return unwrap(res);
  },
};
