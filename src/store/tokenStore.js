/**
 * Token storage đơn giản.
 * Nếu bạn muốn bảo mật hơn, lưu access token trong memory + refresh token cookie httpOnly.
 */
const ACCESS_KEY = "gp_access_token";

export const tokenStore = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccessToken(token) {
    localStorage.setItem(ACCESS_KEY, token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
  },
};
