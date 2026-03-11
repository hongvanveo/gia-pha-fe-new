import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await login(form);
      if (res?.user?.isFirstLogin || res?.isFirstLogin) {
        nav("/change-password-mandatory");
      } else {
        nav("/dashboard");
      }
    } catch (e2) {
      setErr(e2?.message || "Đăng nhập thất bại. Kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-v2-wrapper">
      <div className="login-v2-right">
        
        {/* Nút quay lại để bên trên góc trái (ví dụ) hoặc trong footer tuỳ ý - Ở đây đặt vào vị trí nổi */}
        <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="bi bi-arrow-left"></i> Trang chủ
          </Link>
        </div>

        <div className="login-v2-form-wrapper">
          {/* Logo và tiêu đề căn giữa */}
          <div className="login-v2-brand-center">
            <img
              src="/logo-gia-pha.png"
              alt="Logo Gia Phả Đại Việt"
              className="login-v2-logo-center"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2 className="login-v2-title">Đăng nhập</h2>
            <p className="login-v2-subtitle">Chào mừng bạn trở lại hệ thống.</p>
          </div>

          <form onSubmit={onSubmit} className="login-v2-form">
            <div className="login-v2-field">
              <label className="login-v2-label">
                <i className="bi bi-person"></i> Tên đăng nhập / Mã ID
              </label>
              <input
                className="login-v2-input"
                placeholder="Nhập tên đăng nhập hoặc mã ID"
                value={form.email}
                onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))}
                onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                onInput={(e) => e.target.setCustomValidity("")}
                required
                autoComplete="username"
              />
            </div>

            <div className="login-v2-field">
              <label className="login-v2-label">
                <i className="bi bi-lock"></i> Mật khẩu
              </label>
              <div className="login-v2-pwd-wrap">
                <input
                  className="login-v2-input"
                  placeholder="Nhập mật khẩu"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm(s => ({ ...s, password: e.target.value }))}
                  onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                  onInput={(e) => e.target.setCustomValidity("")}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-v2-eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="login-v2-forgot">
              <Link to="#">Quên mật khẩu?</Link>
            </div>

            {err && (
              <div className="login-v2-error">
                <i className="bi bi-exclamation-triangle"></i> {err}
              </div>
            )}

            <button className="login-v2-btn" type="submit" disabled={loading}>
              {loading ? (
                <><span className="login-v2-spinner"></span> Đang xử lý...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right"></i> Đăng nhập</>
              )}
            </button>
          </form>

          <div className="login-v2-register">
            Chưa có tài khoản? <Link to="/register">Liên hệ đăng ký</Link>
          </div>

          <div className="login-v2-footer-note">
            © 2024 Gia Phả Đại Việt Online · <a href="https://cloudzone.vn" target="_blank" rel="noreferrer">Cloudzone</a>
          </div>
        </div>
      </div>
    </div>
  );
}
