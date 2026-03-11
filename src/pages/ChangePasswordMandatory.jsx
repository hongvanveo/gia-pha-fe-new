import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import { authService } from "../services/auth.service.js";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

export default function ChangePasswordMandatory() {
    const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const nav = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        if (form.newPassword !== form.confirmPassword) {
            setErr("Mật khẩu mới không khớp.");
            return;
        }

        setLoading(true);
        try {
            await authService.changePasswordMandatory({
                oldPassword: form.oldPassword,
                newPassword: form.newPassword
            });
            alert("Đổi mật khẩu thành công! Chào mừng bạn đến với hệ thống.");
            nav("/");
        } catch (e2) {
            setErr(e2.message || "Lỗi khi đổi mật khẩu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Topbar />
            <div className="auth-wrap" style={{ background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                <div className="auth-card" style={{ maxWidth: 500, width: "100%", padding: "48px 40px", borderRadius: 28, boxShadow: "0 25px 50px rgba(0,0,0,0.08)" }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <div className="avatar" style={{ width: 80, height: 80, margin: "0 auto 24px", background: "linear-gradient(135deg, var(--primary-light), #fff)", color: "var(--primary)", border: "2px solid var(--primary-light)", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                            <ShieldCheck size={40} />
                        </div>
                        <div className="title-md" style={{ fontSize: 24, fontWeight: 900 }}>Thiết lập mật khẩu lần đầu</div>
                        <p className="small" style={{ color: "var(--text-light)", marginTop: 12, lineHeight: 1.6, fontSize: 15 }}>
                            Tài khoản của bạn vừa được khởi tạo bởi Admin. Vui lòng đổi mật khẩu mặc định để bảo mật thông tin dòng họ.
                        </p>
                    </div>

                    <form className="stack" onSubmit={handleSubmit} style={{ gap: 24 }}>
                        <div>
                            <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 10, color: "var(--text-dark)" }}>Mật khẩu hiện tại (Ngày sinh DDMMYY)</label>
                            <div className="row" style={{ position: "relative" }}>
                                <Lock size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                <input
                                    className="input"
                                    type="password"
                                    style={{ paddingLeft: 44, borderRadius: 14, padding: "14px 16px 14px 44px" }}
                                    required
                                    value={form.oldPassword}
                                    onChange={e => setForm(s => ({ ...s, oldPassword: e.target.value }))}
                                    onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                                    onInput={(e) => e.target.setCustomValidity("")}
                                    placeholder="VD: 150595"
                                />
                            </div>
                        </div>

                        <div style={{ padding: "8px 0" }}>
                            <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--border), transparent)" }}></div>
                        </div>

                        <div>
                            <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 10, color: "var(--text-dark)" }}>Mật khẩu mới</label>
                            <div className="row" style={{ position: "relative" }}>
                                <Lock size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                <input
                                    className="input"
                                    type="password"
                                    style={{ paddingLeft: 44, borderRadius: 14, padding: "14px 16px 14px 44px" }}
                                    required
                                    minLength={6}
                                    value={form.newPassword}
                                    onChange={e => setForm(s => ({ ...s, newPassword: e.target.value }))}
                                    onInvalid={(e) => {
                                        if (e.target.validity.valueMissing) {
                                            e.target.setCustomValidity("Vui lòng điền vào trường này.");
                                        } else if (e.target.validity.tooShort) {
                                            e.target.setCustomValidity("Mật khẩu phải có ít nhất 6 ký tự.");
                                        }
                                    }}
                                    onInput={(e) => e.target.setCustomValidity("")}
                                    placeholder="Tối thiểu 6 ký tự an toàn"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 10, color: "var(--text-dark)" }}>Nhập lại mật khẩu mới</label>
                            <div className="row" style={{ position: "relative" }}>
                                <Lock size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                <input
                                    className="input"
                                    type="password"
                                    style={{ paddingLeft: 44, borderRadius: 14, padding: "14px 16px 14px 44px" }}
                                    required
                                    value={form.confirmPassword}
                                    onChange={e => setForm(s => ({ ...s, confirmPassword: e.target.value }))}
                                    onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                                    onInput={(e) => e.target.setCustomValidity("")}
                                />
                            </div>
                        </div>

                        {err && (
                            <div style={{ color: "var(--danger)", padding: 16, background: "rgba(139, 0, 0, 0.05)", borderRadius: 12, fontSize: 14, border: "1px solid var(--danger)", fontWeight: 500 }}>
                                {err}
                            </div>
                        )}

                        <button className="btn primary" type="submit" disabled={loading} style={{ width: "100%", padding: 16, marginTop: 12, justifyContent: "center", gap: 10, borderRadius: 14, fontWeight: 800, fontSize: 16, boxShadow: "none" }}>
                            {loading ? "Đang xử lý..." : (<>Xác nhận đổi mật khẩu <ArrowRight size={20} /></>)}
                        </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "var(--muted)" }}>
                        Thao tác này là bắt buộc để đảm bảo an toàn cho tài khoản của bạn.
                    </div>
                </div>
            </div>
        </>
    );
}
