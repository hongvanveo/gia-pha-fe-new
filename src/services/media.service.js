import { api, unwrap } from "../lib/api.js";

export const mediaService = {
  async upload(formData) {
    const res = await api.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(res);
  },
  async list() {
    const res = await api.get("/medias");
    return unwrap(res);
  },
  async get(id) {
    const res = await api.get(`/media/${id}`);
    return unwrap(res);
  },
  async update(id, payload) {
    const res = await api.put(`/media/${id}`, payload);
    return unwrap(res);
  },
  async remove(id) {
    const res = await api.delete(`/media/${id}`);
    return unwrap(res);
  },
  async stream(id) {
    const res = await api.get(`/media/stream/${id}`);
    return unwrap(res);
  },
};
