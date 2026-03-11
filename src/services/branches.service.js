import { api, unwrap } from "../lib/api.js";

/**
 * Spec:
 * GET /api/branches
 * POST /api/branches
 * GET /api/branches/:id
 * PUT /api/branches/:id
 * DELETE /api/branches/:id
 * POST /api/branches/:id/members
 * DELETE /api/branches/:id/members/:userId
 * GET /api/branches/:id/members
 */
export const branchesService = {
  async list(params) {
    const res = await api.get("/branches", { params });
    return unwrap(res);
  },
  async create(payload) {
    const res = await api.post("/branches", payload);
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/branches/${id}`);
    return unwrap(res);
  },
  async update(id, payload) {
    const res = await api.put(`/branches/${id}`, payload);
    return unwrap(res);
  },
  async remove(id) {
    const res = await api.delete(`/branches/${id}`);
    return unwrap(res);
  },
  async addMember(branchId, payload) {
    const res = await api.post(`/branches/${branchId}/members`, payload);
    return unwrap(res);
  },
  async removeMember(branchId, userId) {
    const res = await api.delete(`/branches/${branchId}/members/${userId}`);
    return unwrap(res);
  },
  async listMembers(branchId, params) {
    const res = await api.get(`/branches/${branchId}/members`, { params });
    return unwrap(res);
  },
};
