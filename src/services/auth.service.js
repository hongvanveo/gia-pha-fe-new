import { api, unwrap } from "../lib/api.js";

/**
 * Spec endpoints:
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * POST /api/auth/logout
 */
export const authService = {
  async register(payload) {
    const res = await api.post("/auth/register", payload);
    return unwrap(res);
  },
  async login(payload) {
    const res = await api.post("/auth/login", payload);
    return unwrap(res);
  },
  async refresh() {
    const res = await api.post("/auth/refresh", {});
    return unwrap(res);
  },
  async logout() {
    const res = await api.post("/auth/logout", {});
    return unwrap(res);
  },
  async changePasswordMandatory(payload) {
    // Spec: POST /api/auth/change-password
    const res = await api.post("/auth/change-password", payload);
    return unwrap(res);
  },
};
