import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import { branchesService } from "../services/branches.service.js";
import { usersService } from "../services/users.service.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { GitBranch, Users, Trash2, Plus, ArrowLeft, Shield, Search, X } from "lucide-react";
import { formatError, translateRole } from "../lib/api.js";

import { useAuth } from "../store/auth.jsx";

export default function BranchDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { me } = useAuth();
    const [branch, setBranch] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Add Member states
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundUsers, setFoundUsers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState({});

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    async function loadData() {
        setLoading(true);
        try {
            const [bRes, mRes] = await Promise.all([
                branchesService.get(id),
                branchesService.listMembers(id)
            ]);
            setBranch(bRes.data || bRes);
            setMembers(mRes.data || mRes || []);
        } catch (e) {
            setErr("Lỗi khi tải dữ liệu chi cành: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, [id]);

    useEffect(() => {
        if (debouncedSearchTerm) {
            handleSearch(debouncedSearchTerm);
        } else {
            setFoundUsers([]);
        }
    }, [debouncedSearchTerm]);

    const handleRemoveMember = async (userId) => {
        if (!confirm("Bạn có chắc muốn xóa thành viên này khỏi chi cành?")) return;
        try {
            await branchesService.removeMember(id, userId);
            alert("Đã gỡ thành viên!");
            loadData();
        } catch (e) {
            alert("Lỗi: " + e.message);
        }
    };

    const handleSearch = async (term) => {
        const query = term || searchTerm;
        if (!query.trim()) return;
        setSearching(true);
        try {
            const res = await usersService.list({ search: query });
            setFoundUsers(res.data || res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const handleAddMember = async (userId) => {
        setSubmitting(true);
        const roleToAssign = selectedRoles[userId] || "viewer";
        try {
            await branchesService.addMember(id, { userId, roleInBranch: roleToAssign });
            alert(`Đã thêm thành viên với vai trò ${translateRole(roleToAssign).toUpperCase()} thành công!`);
            setShowAddModal(false);
            setSearchTerm("");
            setFoundUsers([]);
            setSelectedRoles({});
            loadData();
        } catch (e) {
            alert("Lỗi khi thêm thành viên: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container">Đang tải...</div>;

    // Role checks
    const isGlobalAdmin = me?.role === "admin";
    const isBranchOwner = branch?.ownerId === (me?._id || me?.id);
    const branchMember = members.find(m => {
        const uid = m.userId?._id || m.userId;
        return uid === (me?._id || me?.id);
    });
    const isBranchEditor = branchMember?.roleInBranch === "editor";
    // global 'editor' might optionally manage branch too, but let's stick to true branch admins
    const canManageMembers = isGlobalAdmin || isBranchOwner || isBranchEditor;

    return (
        <>
            <div className="container" style={{ maxWidth: 1000 }}>
                <button onClick={() => nav(-1)} className="btn outline" style={{ marginBottom: 20 }}>
                    <ArrowLeft size={16} style={{ marginRight: 8 }} /> Quay lại Admin
                </button>

                {err && <div className="card" style={{ color: "var(--danger)", marginBottom: 20 }}>{err}</div>}

                <div className="dashboard-layout" style={{ gridTemplateColumns: "1fr 350px" }}>
                    <div className="stack" style={{ gap: 24 }}>
                        <div className="card">
                            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                                <div className="avatar" style={{ width: 60, height: 60, background: "var(--primary-light)", color: "var(--primary)" }}>
                                    <GitBranch size={32} />
                                </div>
                                <div>
                                    <div className="title-md" style={{ marginBottom: 4 }}>Chi cành: {branch?.name}</div>
                                    <div className="small" style={{ color: "var(--text-light)" }}>ID: {id}</div>
                                </div>
                            </div>
                            <p style={{ color: "var(--text-dark)", lineHeight: 1.6 }}>{branch?.description || "Không có mô tả chi tiết cho chi cành này."}</p>
                        </div>

                        <div className="card">
                            <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
                                <div style={{ fontWeight: 700, fontSize: 18, display: "flex", gap: 8, alignItems: "center" }}>
                                    <Users size={20} color="var(--primary)" /> Danh sách Thành viên Quản trị
                                </div>
                                {canManageMembers && (
                                    <button className="btn small primary" onClick={() => setShowAddModal(true)}>
                                        <Plus size={16} /> Thêm người quản lý
                                    </button>
                                )}
                            </div>

                            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                                <table className="table" style={{ margin: 0 }}>
                                    <thead style={{ background: "var(--surface-solid)" }}>
                                        <tr><th>Người dùng</th><th>Vai trò</th><th>Thao tác</th></tr>
                                    </thead>
                                    <tbody>
                                        {members.length === 0 ? (
                                            <tr><td colSpan="3" style={{ textAlign: "center", padding: 20 }}>Chưa có thành viên nào.</td></tr>
                                        ) : members.map((m, index) => {
                                            const userObj = m.userId || {};
                                            const uid = userObj._id || userObj;

                                            return (
                                                <tr key={uid || index}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        <div>{userObj.fullName || "Người dùng ẩn"}</div>
                                                        <div className="small" style={{ color: "var(--muted)", fontWeight: "normal" }}>
                                                            {userObj.email || ""}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge internal" style={{ textTransform: "uppercase" }}>
                                                            {translateRole(m.roleInBranch)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {canManageMembers && (
                                                            <button
                                                                onClick={() => handleRemoveMember(uid)}
                                                                style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
                                                                title="Gỡ thành viên"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <aside>
                        <div className="card">
                            <div style={{ fontWeight: 700, marginBottom: 16 }}>Thông tin bổ sung</div>
                            <div className="stack" style={{ gap: 12 }}>
                                <div>
                                    <label className="small" style={{ color: "var(--text-light)" }}>Cấp độ phả đồ</label>
                                    <div style={{ fontWeight: 600 }}>{branch?.level || "Gốc (Level 0)"}</div>
                                </div>
                                <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />
                                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green)", fontWeight: 700 }}>
                                    <Shield size={16} /> Chi cành an toàn
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Modal Add Member */}
            {showAddModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(44, 34, 26, 0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 500, maxWidth: "95vw", animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
                            <div className="title-md">Thêm thành viên quản trị</div>
                            <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)" }}><X size={24} /></button>
                        </div>

                        <div className="stack" style={{ gap: 16 }}>
                            <div className="row" style={{ gap: 10 }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                    <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                    <input
                                        placeholder="Tên hoặc email người dùng..."
                                        className="input"
                                        style={{ paddingLeft: 40 }}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
                                {foundUsers.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: "center", color: "var(--text-light)" }}>
                                        {searching ? "Đang tìm kiếm..." : "Nhập thông tin để tìm kiếm người dùng"}
                                    </div>
                                ) : (
                                    <div className="stack">
                                        {foundUsers.map(u => (
                                            <div key={u._id || u.id} className="row" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                                                    <div className="small" style={{ color: "var(--muted)" }}>{u.email}</div>
                                                </div>
                                                <div className="row" style={{ gap: 8 }}>
                                                    <select
                                                        className="select small"
                                                        style={{ width: 100, padding: "4px 8px" }}
                                                        value={selectedRoles[u._id || u.id] || "viewer"}
                                                        onChange={e => setSelectedRoles(prev => ({ ...prev, [u._id || u.id]: e.target.value }))}
                                                    >
                                                        <option value="viewer">Người xem</option>
                                                        <option value="editor">Trưởng cành</option>
                                                        <option value="owner">Chủ sở hữu</option>
                                                    </select>
                                                    <button
                                                        className="btn primary small"
                                                        disabled={submitting}
                                                        onClick={() => handleAddMember(u._id || u.id)}
                                                    >Thêm</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
