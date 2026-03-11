import { useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { useAuth } from "../store/auth.jsx";
import { usersService } from "../services/users.service.js";
import { User, Mail, MapPin, Shield, Save, Key } from "lucide-react";

export default function Profile() {
    const { me } = useAuth();
    const [formData, setFormData] = useState({
        fullName: me?.fullName || "",
        email: me?.email || "",
        address: me?.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: "", text: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: "", text: "" });
        try {
            await usersService.updateMe({
                fullName: formData.fullName,
                address: formData.address
            });
            setMsg({ type: "success", text: "Cập nhật thông tin thành công!" });
        } catch (err) {
            setMsg({ type: "error", text: "Lỗi: " + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassLoading(true);
        setPassMsg({ type: "", text: "" });

        if (formData.newPassword !== formData.confirmPassword) {
            setPassMsg({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
            setPassLoading(false);
            return;
        }

        try {
            await usersService.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            setPassMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
            setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setPassMsg({ type: "error", text: "Lỗi: " + (err.response?.data?.error?.message || err.message) });
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <>
            <div className="container" style={{ maxWidth: 800 }}>
                <div className="title-md" style={{ marginBottom: 8 }}>Cài đặt tài khoản</div>
                <div className="small" style={{ color: "var(--text-light)", marginBottom: 32 }}>
                    Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.
                </div>

                {msg.text && (
                    <div className="card" style={{
                        color: msg.type === "success" ? "#2d6a4f" : "var(--danger)",
                        background: msg.type === "success" ? "rgba(45, 106, 79, 0.1)" : "rgba(139, 0, 0, 0.05)",
                        border: `1px solid ${msg.type === "success" ? "#2d6a4f" : "var(--danger)"}`,
                        marginBottom: 20
                    }}>
                        {msg.text}
                    </div>
                )}

                <div className="dashboard-layout" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="stack" style={{ gap: 24 }}>
                        {/* Thông tin cơ bản */}
                        <div className="card">
                            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
                                <User size={20} color="var(--primary)" /> Thông tin cá nhân
                            </div>
                            <form onSubmit={handleUpdateInfo} className="stack" style={{ gap: 16 }}>
                                <div className="form-group">
                                    <label className="label">Họ và tên</label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            name="fullName"
                                            className="input"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            style={{ paddingLeft: 40 }}
                                        />
                                        <User size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Email (Không thể thay đổi)</label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            className="input"
                                            value={formData.email}
                                            disabled
                                            style={{ paddingLeft: 40, background: "var(--surface-solid)" }}
                                        />
                                        <Mail size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Địa chỉ</label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            name="address"
                                            className="input"
                                            value={formData.address}
                                            onChange={handleChange}
                                            style={{ paddingLeft: 40 }}
                                        />
                                        <MapPin size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                    </div>
                                </div>

                                <button type="submit" className="btn primary" disabled={loading} style={{ alignSelf: "flex-start", marginTop: 8 }}>
                                    <Save size={18} style={{ marginRight: 8 }} /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </form>
                        </div>

                        {/* Đổi mật khẩu */}
                        <form className="stack" style={{ gap: 16 }} onSubmit={handleChangePassword}>
                            {passMsg.text && (
                                <div style={{ color: passMsg.type === "success" ? "var(--green)" : "var(--danger)", fontSize: 14, fontWeight: 500 }}>
                                    {passMsg.text}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="label">Mật khẩu hiện tại</label>
                                <input required type="password" name="currentPassword" value={formData.currentPassword} className="input" onChange={handleChange}
                                    onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                                    onInput={(e) => e.target.setCustomValidity("")} />
                            </div>
                            <div className="row" style={{ gap: 16 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="label">Mật khẩu mới</label>
                                    <input required type="password" name="newPassword" value={formData.newPassword} className="input" onChange={handleChange}
                                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                                        onInput={(e) => e.target.setCustomValidity("")} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="label">Xác nhận mật khẩu</label>
                                    <input required type="password" name="confirmPassword" value={formData.confirmPassword} className="input" onChange={handleChange}
                                        onInvalid={(e) => e.target.setCustomValidity("Vui lòng điền vào trường này.")}
                                        onInput={(e) => e.target.setCustomValidity("")} />
                                </div>
                            </div>
                            <button type="submit" className="btn outline" disabled={passLoading} style={{ alignSelf: "flex-start", marginTop: 8 }}>
                                <Key size={18} style={{ marginRight: 8 }} /> {passLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
