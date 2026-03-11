import { api, unwrap } from "../lib/api.js";

/** GET /api/health */
export const systemService = {
  async health() {
    const res = await api.get("/health");
    return unwrap(res);
  },
};
