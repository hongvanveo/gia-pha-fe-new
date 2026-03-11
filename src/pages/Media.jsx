import { useState, useEffect } from "react";
import Topbar from "../components/Topbar.jsx";
import { mediaService } from "../services/media.service.js";
import { Image as ImageIcon, Video, Upload, Trash2, Maximize2, X } from "lucide-react";

import { branchesService } from "../services/branches.service.js";
import { formatError } from "../lib/api.js";
import { useAuth } from "../store/auth.jsx";

export default function Media() {
    const { me } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [uploading, setUploading] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");

    async function loadMedia() {
        setLoading(true);
        try {
            const [resMedia, resBranches] = await Promise.all([
                mediaService.list(),
                branchesService.list({ limit: 100 })
            ]);
            setItems(resMedia.data || resMedia || []);

            const bList = resBranches.data?.data || resBranches.data || [];
            setBranches(bList);
            if (bList.length > 0) setSelectedBranch(bList[0]._id);
        } catch (e) {
            setErr(formatError(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadMedia(); }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!selectedBranch) {
            alert("Vui lòng chọn chi cành trước khi tải lên!");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("branchId", selectedBranch); // FIX: Bắt buộc phải có branchId

            await mediaService.upload(formData);
            await loadMedia();
        } catch (e) {
            setErr(formatError(e));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tệp này? Hành động này không thể hoàn tác.")) return;
        try {
            await mediaService.remove(id);
            setItems(items.filter(i => i._id !== id && i.id !== id));
        } catch (e) {
            alert(formatError(e));
        }
    };

    // Role calculations
    const isGlobalAdmin = me?.role === "admin";

    // Find selected branch from branches list
    const branchInfo = branches.find(b => b._id === selectedBranch);

    // Check if the current user is owner or editor in this branch
    const isBranchOwner = branchInfo?.ownerId === (me?._id || me?.id);
    const branchMember = branchInfo?.members?.find(m => {
        const uid = m.userId?._id || m.userId;
        return uid === (me?._id || me?.id);
    });
    const isBranchEditor = branchMember?.roleInBranch === "editor" || branchMember?.roleInBranch === "owner";

    const canUpload = !!me; // Anyone logged in can upload, but to a specific branch

    // We can delete if we are Global Admin, Branch Owner/Editor, or the original uploader
    const canDelete = (item) => {
        if (isGlobalAdmin || isBranchOwner || isBranchEditor) return true;

        // If the backend returns `uploadedBy`, we check it. 
        // Otherwise, without strict attribution on UI, we lean on backend protection,
        // but hide the button for safety if we don't know they uploaded it.
        if (item.uploadedBy === (me?._id || me?.id)) return true;

        return false;
    };

    return (
        <>
            <div className="container" style={{ maxWidth: 1200 }}>
                <div className="row" style={{ gap: 12 }}>
                    {branches.length > 0 && (
                        <select
                            className="select"
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            style={{ width: 200 }}
                        >
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name.replace(/Chi nhánh/g, "Chi cành")}</option>)}
                        </select>
                    )}
                    {canUpload && (
                        <label className="btn primary" style={{ cursor: "pointer", position: "relative" }}>
                            <Upload size={18} style={{ marginRight: 8 }} />
                            {uploading ? "Đang tải lên..." : "Tải lên tệp mới"}
                            <input type="file" hidden onChange={handleUpload} disabled={uploading} accept="image/*,video/*" />
                        </label>
                    )}
                </div>

                {err && <div className="card" style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", marginBottom: 20 }}>{err}</div>}

                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Đang đồng bộ thư viện...</div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 24
                    }}>
                        {items.map(item => (
                            <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden", position: "relative", group: "true" }}>
                                <div style={{ height: 200, background: "var(--bg-body)", position: "relative" }}>
                                    {item.type === "video" ? (
                                        <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <img src={item.url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                    <div style={{
                                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                        background: "rgba(0,0,0,0.3)", opacity: 0, transition: "0.2s",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 12
                                    }} className="hover-show">
                                        <button className="btn small" onClick={() => setPreviewItem(item)} style={{ background: "var(--surface-solid)", color: "var(--text-dark)" }}><Maximize2 size={16} /></button>
                                        {canDelete(item) && (
                                            <button className="btn small" onClick={() => handleDelete(item._id || item.id)} style={{ background: "var(--danger)", color: "#fff" }}><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                                    <div className="small" style={{ color: "var(--text-light)", textTransform: "capitalize" }}>{item.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {items.length === 0 && !loading && (
                    <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text-light)" }}>
                        Thư viện đang trống. Hãy tải lên tấm ảnh đầu tiên!
                    </div>
                )}
            </div>

            {/* FULL SCREEN PREVIEW */}
            {previewItem && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.9)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <button onClick={() => setPreviewItem(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={32} /></button>
                    {previewItem.type === "video" ? (
                        <video src={previewItem.url} controls autoPlay style={{ maxWidth: "90%", maxHeight: "90%" }} />
                    ) : (
                        <img src={previewItem.url} alt="Large" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
                    )}
                </div>
            )}

            <style>{`
        .card:hover .hover-show { opacity: 1 !important; }
      `}</style>
        </>
    );
}
