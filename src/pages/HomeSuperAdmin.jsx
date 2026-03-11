import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { useAuth } from "../store/auth.jsx";
import { Link } from "react-router-dom";
import { Activity, Users, GitBranch, ShieldAlert, History, Megaphone, Database, Plus, Search, Video } from "lucide-react";
import { branchesService } from "../services/branches.service.js";
import { systemService } from "../services/system.service.js";
import { notificationsService } from "../services/notifications.service.js";
import { formatError } from "../lib/api.js";
import { useDebounce } from "../hooks/useDebounce.js";

export default function HomeSuperAdmin() {
    const { me } = useAuth();
    const [stats, setStats] = useState({ branches: 0, users: 0, pendingReports: 0 });
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [branchesList, setBranchesList] = useState([]);

    // Create Branch modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBranchName, setNewBranchName] = useState("");
    const [newBranchCode, setNewBranchCode] = useState("");
    const [newBranchDesc, setNewBranchDesc] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Broadcast Notification Modal
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastBody, setBroadcastBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    useEffect(() => {
        async function loadSystemStats() {
            try {
                // ĐỔI systemService.getHealth() THÀNH systemService.health()
                const [branchesRes, sysHealth] = await Promise.all([
                    branchesService.list(),
                    systemService.health()
                ]);

                // Lấy data thật và lưu vào state
                const fetchedBranches = branchesRes?.data || branchesRes || [];
                setBranchesList(fetchedBranches);

                setStats({
                    branches: fetchedBranches.length || 0,
                    users: 0, // Placeholder for global users
                    pendingReports: 0
                });
                setHealth(sysHealth);
            } catch (e) {
                console.warn(formatError(e));
            } finally {
                setLoading(false);
            }
        }
        loadSystemStats();
    }, []);

    useEffect(() => {
        const fetchFiltered = async () => {
            try {
                const res = await branchesService.list({ search: debouncedSearch });
                setBranchesList(res?.data || res || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchFiltered();
    }, [debouncedSearch]);

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName.trim()) return;
        setIsCreating(true);
        try {
            await branchesService.create({
                name: newBranchName,
                branchCode: newBranchCode,
                description: newBranchDesc
            });
            alert("Đã tạo Dòng họ / Chi cành thành công!");
            setShowAddModal(false);
            setNewBranchName("");
            setNewBranchCode("");
            setNewBranchDesc("");
            // Refresh list
            const res = await branchesService.list();
            setBranchesList(res?.data || res || []);
            setStats(s => ({ ...s, branches: (res?.data || res || []).length }));
        } catch (error) {
            alert(formatError(error));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <div className="container" style={{ maxWidth: 1200 }}>
                <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-dark)", margin: 0 }}>
                            Quản trị Hệ thống
                        </h1>
                        <p style={{ color: "var(--muted)", marginTop: 8 }}>Tổng quan toàn bộ mạng lưới Gia phả Online.</p>
                    </div>
                    <div className="row" style={{ gap: 12 }}>
                        <Link to="/admin" className="btn primary" style={{ borderRadius: 12, padding: "12px 24px", fontWeight: 700 }}>
                            <Activity size={20} style={{ marginRight: 8 }} /> Bảng điều khiển chi tiết
                        </Link>
                    </div>
                </div>

                {/* Global Stats Grid */}
                <div className="row" style={{ gap: 20, marginBottom: 32 }}>
                    <div className="card" style={{ flex: 1, padding: 24, borderRadius: 24, border: "2px solid var(--accent)", background: "rgba(184, 134, 11, 0.1)", color: "var(--accent)" }}>
                        <GitBranch size={40} opacity={0.3} style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 40, fontWeight: 900 }}>{stats.branches}</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Dòng họ / Chi cành</div>
                    </div>

                    <div className="card" style={{ flex: 1, padding: 24, borderRadius: 24, border: "2px solid var(--red)", background: "rgba(208, 1, 27, 0.05)", color: "var(--red)" }}>
                        <ShieldAlert size={40} opacity={0.3} style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 40, fontWeight: 900 }}>{stats.pendingReports}</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Báo cáo vi phạm</div>
                    </div>

                    <div className="card" style={{ flex: 1, padding: 24, borderRadius: 24, border: "2px solid #2d6a4f", background: "rgba(45, 106, 79, 0.05)", color: "#2d6a4f" }}>
                        <Database size={40} opacity={0.3} style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 40, fontWeight: 900 }}>{health?.status === "ok" ? "Tốt" : "Cảnh báo"}</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Sức khỏe Hệ thống</div>
                    </div>
                </div>

                <div className="row" style={{ gap: 24, alignItems: "flex-start" }}>
                    {/* Main Area: Tree Management Preview */}
                    <div style={{ flex: 2 }}>
                        <div className="card" style={{ padding: 28, borderRadius: 24 }}>
                            <div className="row" style={{ justifyContent: "space-between", marginBottom: 24 }}>
                                <h2 style={{ margin: 0, fontWeight: 800 }}>Quản lý Cây gia phả</h2>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <div style={{ position: "relative" }}>
                                        <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                                        <input
                                            placeholder="Tìm kiếm họ tộc..."
                                            style={{ padding: "10px 10px 10px 40px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn primary small" style={{ borderRadius: 12 }} onClick={() => setShowAddModal(true)}>
                                        <Plus size={18} /> Tạo mới
                                    </button>
                                </div>
                            </div>

                            <div className="stack" style={{ gap: 16 }}>
                                {/* ĐÃ THAY BẰNG branchesList.map ĐỂ RENDER DATA THẬT */}
                                {branchesList.map(b => (
                                    <div key={b._id} className="row" style={{ padding: 20, background: "rgba(0,0,0,0.02)", borderRadius: 16, border: "1px solid var(--border)", justifyContent: "space-between" }}>
                                        <div className="row" style={{ gap: 20 }}>
                                            <div style={{ width: 52, height: 52, background: "var(--primary-light)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "var(--primary)" }}>
                                                {/* Lấy chữ cái đầu tiên của tên */}
                                                {b.name ? b.name.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: 18 }}>{b.name}</div>
                                                <div className="small" style={{ color: "var(--muted)", marginTop: 4 }}>ID: {b._id} • {b.members?.length || 0} thành viên</div>
                                            </div>
                                        </div>
                                        {/* Đã sửa link sang id thật của database */}
                                        <Link to={`/admin/branches/${b._id}`} className="btn outline small" style={{ borderRadius: 10 }}>Quản lý</Link>
                                    </div>
                                ))}
                                {branchesList.length === 0 && !loading && (
                                    <div style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>Chưa có chi cành nào.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: System Logs & Broadcasts */}
                    <div style={{ flex: 1 }}>
                        <div className="card" style={{ padding: 24, borderRadius: 24, marginBottom: 24 }}>
                            <h3 style={{ margin: "0 0 20px 0", fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                                <History size={22} color="var(--primary)" /> Nhật ký hệ thống
                            </h3>
                            <div className="stack" style={{ gap: 16 }}>
                                <div className="small" style={{ color: "var(--muted)", textAlign: "center", padding: "10px 0" }}>
                                    Không có hoạt động hệ thống gần đây.
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 24, borderRadius: 24, background: "rgba(139, 0, 0, 0.05)", marginBottom: 24, border: "1px dashed var(--primary)" }}>
                            <h3 style={{ margin: "0 0 12px 0", fontWeight: 800, color: "var(--primary)" }}>
                                <Video size={20} style={{ marginRight: 8, verticalAlign: "middle" }} /> Quản lý Phát trực tiếp
                            </h3>
                            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>Theo dõi các luồng trực tiếp đang diễn ra từ các chi tộc.</p>
                            <Link to="/events?tab=live" className="btn outline" style={{ width: "100%", marginTop: 12, borderRadius: 10, fontWeight: 700 }}>
                                Đi đến Livestream
                            </Link>
                        </div>

                        <div className="card" style={{ padding: 24, borderRadius: 24, background: "linear-gradient(135deg, #3b0000, #5a0000)", color: "#fff", border: "none" }}>
                            <h3 style={{ margin: "0 0 12px 0", fontWeight: 800, color: "#94a3b8" }}>
                                <Megaphone size={20} style={{ marginRight: 8, verticalAlign: "middle" }} /> Thông báo hệ thống
                            </h3>
                            <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>Gửi thông báo quan trọng đến toàn bộ thành viên trên ứng dụng.</p>
                            <button
                                className="btn"
                                style={{ width: "100%", marginTop: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, borderRadius: 10 }}
                                onClick={() => setShowBroadcastModal(true)}
                            >
                                Soạn tin nhắn
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(44, 34, 26, 0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ width: 480, maxWidth: '90vw', animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="title-md" style={{ marginBottom: 16 }}>📢 Gửi thông báo toàn hệ thống</div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
                            setIsSending(true);
                            try {
                                await notificationsService.broadcast({ title: broadcastTitle, body: broadcastBody });
                                alert('Gửi thông báo thành công!');
                                setShowBroadcastModal(false);
                                setBroadcastTitle('');
                                setBroadcastBody('');
                            } catch (err) {
                                alert(formatError(err));
                            } finally {
                                setIsSending(false);
                            }
                        }} className="stack" style={{ gap: 16 }}>
                            <div>
                                <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Tiêu đề *</label>
                                <input required className="input" placeholder="VD: Thông báo quan trọng..." value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Nội dung *</label>
                                <textarea required className="input" rows={5} placeholder="Nhập nội dung thông báo..." value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} style={{ resize: 'vertical' }} />
                            </div>
                            <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
                                <button type="button" className="btn outline" onClick={() => setShowBroadcastModal(false)}>Hủy</button>
                                <button type="submit" className="btn primary" disabled={isSending}>{isSending ? 'Đang gửi...' : 'Gửi đến tất cả thành viên'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Branch Modal */}
            {showAddModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(44, 34, 26, 0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 400, maxWidth: "90vw", animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        <div className="title-md" style={{ marginBottom: 16 }}>
                            Tạo Dòng họ / Chi cành mới
                        </div>
                        <form onSubmit={handleCreateBranch} className="stack" style={{ gap: 16 }}>
                            <div>
                                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Tên Chi cành/Dòng họ *</label>
                                <input
                                    required
                                    className="input"
                                    placeholder="Ví dụ: Dòng họ Nguyễn Bá..."
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Mã Chi cành (Ví dụ: DO, NG, TR) *</label>
                                <input
                                    required
                                    className="input"
                                    placeholder="Mã viết tắt..."
                                    value={newBranchCode}
                                    onChange={(e) => setNewBranchCode(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Mô tả (Tuỳ chọn)</label>
                                <textarea
                                    className="input"
                                    placeholder="Thông tin thêm..."
                                    rows={3}
                                    value={newBranchDesc}
                                    onChange={(e) => setNewBranchDesc(e.target.value)}
                                />
                            </div>
                            <div className="row" style={{ justifyContent: "flex-end", marginTop: 10, gap: 10 }}>
                                <button type="button" className="btn outline" onClick={() => setShowAddModal(false)}>Hủy</button>
                                <button className="btn primary" type="submit" disabled={isCreating || !newBranchName.trim() || !newBranchCode.trim()}>
                                    {isCreating ? "Đang tạo..." : "Tạo mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
