import axios from "axios";
import { tokenStore } from "../store/tokenStore.js";

/**
 * Base URL theo spec: /api
 * Set bằng .env: VITE_API_BASE_URL=http://localhost:3000/api
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

/** Gắn access token */
api.interceptors.request.use((config) => {
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

/** Nếu 401: thử refresh rồi retry request */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (!original) throw err;
    if (err.response?.status === 403) {
      const msg = err.response.data?.error?.message || "";
      if (msg.includes("internal") || msg.includes("branch")) {
        alert("Quyền truy cập bị từ chối: Bạn chưa được gán vào chi họ này nên không thể xem dữ liệu nội bộ.");
      } else {
        alert("Bạn không có quyền thực hiện hành động này.");
      }
      throw err;
    }

    if (err.response?.status !== 401) throw err;

    // tránh loop vô hạn
    if (original.__isRetryRequest) throw err;
    original.__isRetryRequest = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      })
        .then(() => api(original))
        .catch((e) => Promise.reject(e));
    }

    isRefreshing = true;
    try {
      // Spec: POST /api/auth/refresh
      const refreshRes = await axios.post(
        (import.meta.env.VITE_API_URL || "http://localhost:4000/api") + "/auth/refresh",
        {},
        { withCredentials: true }
      );

      // Kỳ vọng BE trả: { success:true, data:{ accessToken } }
      const accessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
      if (accessToken) tokenStore.setAccessToken(accessToken);

      queue.forEach((p) => p.resolve());
      queue = [];

      return api(original);
    } catch (e) {
      queue.forEach((p) => p.reject(e));
      queue = [];
      tokenStore.clear();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);

/** Helper unwrap theo spec {success, data, error} */
export function unwrap(res) {
  // Nếu response có success=false (theo spec riêng)
  if (res?.data?.success === false) {
    const rawMsg = res.data?.error?.message || res.data?.message || "Lỗi máy chủ cục bộ";
    const e = new Error(rawMsg);
    e.code = res.data?.error?.code;
    e.details = res.data?.error?.details;
    // Gắn thêm message thân thiện nếu có thể
    e.friendlyMessage = formatError(e);
    throw e;
  }

  if (res?.data?.meta !== undefined && res?.data?.meta !== null) {
    return {
      data: res.data.data,
      meta: res.data.meta
    };
  }
  if (res?.data?.data !== undefined) {
    return res.data.data;
  }

  return res?.data;
}

/** 
 * Bản đồ dịch thông báo lỗi sang tiếng Việt thân thiện 
 * Giúp tránh hiển thị các mã lỗi kỹ thuật (400, 403, Invalid data...) cho người dùng.
 */
export function formatError(e) {
  const errorMap = {
    "Invalid input data": "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường nhập liệu.",
    "Request failed with status code 400": "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
    "Request failed with status code 403": "Bạn không có quyền thực hiện hành động này hoặc quyền truy cập bị từ chối.",
    "Request failed with status code 404": "Không tìm thấy dữ liệu yêu cầu.",
    "Request failed with status code 500": "Lỗi máy chủ hệ thống. Vui lòng thử lại sau.",
    "Network Error": "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền Internet của bạn.",
    "timeout": "Yêu cầu bị quá hạn (timeout). Vui lòng thử lại.",
    "Unauthorized": "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
    "Forbidden": "Bạn không có quyền truy cập vào mục này."
  };

  const rawMsg = e.response?.data?.error?.message || e.response?.data?.message || e.message || "";

  // Tìm kiếm message gốc trong bản đồ dịch, nếu không có thì trả về chính nó hoặc câu mặc định
  return errorMap[rawMsg] || rawMsg || "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

/** 
 * Dịch vai trò người dùng sang tiếng Việt 
 */
export function translateRole(role) {
  if (!role) return "Thành viên";
  const map = {
    // Global Roles
    "admin": "Quản trị hệ thống",
    "super_admin": "Quản trị cao cấp",
    "editor": "Trưởng chi cành",
    "tree_admin": "Quản trị gia phả",
    "member": "Thành viên",

    // Branch Roles
    "owner": "Chủ sở hữu",
    "viewer": "Người xem",
    "moderator": "Người kiểm duyệt"
  };
  const key = role.toLowerCase();
  return map[key] || role.toUpperCase();
}