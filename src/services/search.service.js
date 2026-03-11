import { api, unwrap } from "../lib/api.js";

/**
 * Spec:
 * GET /api/search/persons?q=...&page&limit&branchId&privacy&generation
 */
export const searchService = {
  async persons(params) {
    const res = await api.get("/search/persons", { params });
    return unwrap(res);
  },
  async events(params) {
    const res = await api.get("/search/events", { params });
    return unwrap(res);
  },
  async branches(params) {
    const res = await api.get("/search/branches", { params });
    return unwrap(res);
  },
};
