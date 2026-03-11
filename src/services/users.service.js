import { api, unwrap } from "../lib/api.js";

export const usersService = {
  async me() {
    const res = await api.get("/users/me");
    return unwrap(res);
  },
  async updateMe(payload) {
    const res = await api.put("/users/me", payload);
    return unwrap(res);
  },
  async list(params) {
    const res = await api.get("/users", { params });
    return unwrap(res);
  },
  async updateRole(id, payload) {
    const res = await api.put(`/users/${id}/role`, payload);
    return unwrap(res);
  },
  async ban(id, payload) {
    const res = await api.put(`/users/${id}/ban`, payload);
    return unwrap(res);
  },
  async changePassword(payload) {
    const res = await api.post("/auth/change-password", payload);
    return unwrap(res);
  },
  async createFromPerson(payload) {
    // payload: { personId: "..." }
    const res = await api.post("/users/create-from-person", payload);
    return unwrap(res);
  },
};
