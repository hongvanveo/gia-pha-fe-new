import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import { useAuth } from "../store/auth.jsx";
import { Calendar, Video, Plus, Users, Clock, MapPin, Radio, GitBranch } from "lucide-react";
import { eventsService } from "../services/events.service.js";
import { branchesService } from "../services/branches.service.js";
import { formatError } from "../lib/api.js";
import CalendarModal from "../components/CalendarModal.jsx";
import StreamingPlayer from "../components/StreamingPlayer.jsx";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
registerLocale("vi", vi);

export default function Events() {
    const { me } = useAuth();
    const isAdmin = ["admin", "editor", "tree_admin", "super_admin"].includes(String(me?.role || "").toLowerCase());

    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "events";

    const [activeTab, setActiveTab] = useState(initialTab); // events | live | pending
    const [showAddModal, setShowAddModal] = useState(false);
    const [editEventId, setEditEventId] = useState(null);
    const [registeredEvents, setRegisteredEvents] = useState({});

    const [events, setEvents] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEventDetail, setSelectedEventDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Phân loại sự kiện theo trạng thái
    const pendingEvents = events.filter(e => !e.status || e.status === "pending");
    const approvedEvents = events.filter(e => e.status === "approved" || e.status === "active");
    // Nếu không có trường status, coi tất cả là approved cho user bình thường
    const userEvents = isAdmin ? approvedEvents : events;

    async function fetchEvents() {
        setLoading(true);
        try {
            if (isAdmin) {
                const [approvedRes, pendingRes] = await Promise.all([
                    eventsService.list({ status: "approved" }),
                    eventsService.list({ status: "pending" })
                ]);
                const approved = approvedRes.data || approvedRes || [];
                const pending = pendingRes.data || pendingRes || [];
                setEvents([...approved, ...pending]);
            } else {
                const data = await eventsService.list({ status: "approved" });
                setEvents(data.data || data || []);
            }
            // Fetch active streams
            const streamsRes = await eventsService.list({ isLive: true, status: "approved" });
            setStreams(streamsRes.data || streamsRes || []);
        } catch (e) {
            // Silently log or handle if needed, but fetchEvents is called on load
            console.error(formatError(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEvents();
    }, []);

    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        branchId: "", title: "", type: "other", eventDate: null,
        location: "", description: "", privacy: "internal",
        personIdsText: "", isLive: false, streamUrl: "", streamType: "youtube"
    });

    // States cho Địa lý (Tỉnh/Huyện/Xã)
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [locState, setLocState] = useState({ provCode: "", provName: "", distCode: "", distName: "", wardCode: "", wardName: "", detail: "" });

    useEffect(() => {
        fetch("https://provinces.open-api.vn/api/p/")
            .then(res => res.json())
            .then(data => setProvinces(data))
            .catch(console.error);
    }, []);

    const updateLocationString = (pName, dName, wName, detail) => {
        const parts = [detail, wName, dName, pName].filter(Boolean);
        setFormData(s => ({ ...s, location: parts.join(", ") }));
    };

    const handleProvChange = async (e) => {
        const code = e.target.value;
        const name = code ? e.target.options[e.target.selectedIndex].text : "";
        setLocState(s => ({ ...s, provCode: code, provName: name, distCode: "", distName: "", wardCode: "", wardName: "" }));
        setDistricts([]);
        setWards([]);
        if (code) {
            const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`).then(r => r.json());
            setDistricts(res.districts || []);
        }
        updateLocationString(name, "", "", locState.detail);
    };

    const handleDistChange = async (e) => {
        const code = e.target.value;
        const name = code ? e.target.options[e.target.selectedIndex].text : "";
        setLocState(s => ({ ...s, distCode: code, distName: name, wardCode: "", wardName: "" }));
        setWards([]);
        if (code) {
            const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then(r => r.json());
            setWards(res.wards || []);
        }
        updateLocationString(locState.provName, name, "", locState.detail);
    };

    const handleWardChange = (e) => {
        const code = e.target.value;
        const name = code ? e.target.options[e.target.selectedIndex].text : "";
        setLocState(s => ({ ...s, wardCode: code, wardName: name }));
        updateLocationString(locState.provName, locState.distName, name, locState.detail);
    };

    const handleLocDetailChange = (e) => {
        const val = e.target.value;
        setLocState(s => ({ ...s, detail: val }));
        updateLocationString(locState.provName, locState.distName, locState.wardName, val);
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await branchesService.list({ limit: 200 });
                const list = res?.data || res || [];
                const arr = Array.isArray(list) ? list : (list.data || []);
                setBranches(arr);
                // set default branchId
                if (arr.length && !formData.branchId) {
                    setFormData((s) => ({ ...s, branchId: arr[0]._id }));
                }
            } catch (e) {
                setBranches([]);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRegister = async (eventId) => {
        try {
            await eventsService.register(eventId);
            alert("Đã gửi yêu cầu đăng ký tham gia! Vui lòng chờ Ban quản trị duyệt.");
            fetchEvents();
        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            alert(error.friendlyMessage || "Có lỗi xảy ra khi đăng ký.");
        }
    };

    const handleUpdateParticipantStatus = async (eventId, userId, status) => {
        try {
            await eventsService.updateParticipantStatus(eventId, userId, status);
            fetchEvents();
        } catch (error) {
            console.error("Lỗi duyệt yêu cầu tham gia:", error);
            alert(error.friendlyMessage || "Có lỗi xảy ra khi tiến hành duyệt.");
        }
    };

    const handleApproveEvent = async (eventId) => {
        setApprovingId(eventId);
        try {
            await eventsService.updateStatus(eventId, "approved");
            // Sau khi duyệt xong, cập nhật status trong local state
            setEvents(prev => prev.map(e =>
                (e._id || e.id) === eventId ? { ...e, status: "approved" } : e
            ));
        } catch (e) {
            alert(formatError(e));
        } finally {
            setApprovingId(null);
        }
    };

    const handleRejectEvent = async (eventId) => {
        if (!window.confirm("Bạn có chắc chắn muốn từ chối sự kiện này?")) return;
        setApprovingId(eventId);
        try {
            await eventsService.updateStatus(eventId, "rejected");
            setEvents(prev => prev.filter(e => (e._id || e.id) !== eventId));
        } catch (e) {
            alert(formatError(e));
        } finally {
            setApprovingId(null);
        }
    };

    const handleToggleLive = async (eventId, currentStatus, passedStreamUrl) => {
        // Fallback: Tìm lại trong state nếu passedStreamUrl bị thiếu hoặc để đảm bảo lấy bản mới nhất
        const currentEvent = events.find(e => String(e._id || e.id) === String(eventId));
        const finalUrl = passedStreamUrl || currentEvent?.streamUrl;

        if (!currentStatus && (!finalUrl || finalUrl.trim() === "")) {
            alert("Vui lòng nhập Link Livestream trong mục 'Chỉnh sửa' trước khi bắt đầu phát trực tiếp!");
            return;
        }
        try {
            await eventsService.update(eventId, { isLive: !currentStatus });

            // Cập nhật ngay lập tức state cục bộ của danh sách sự kiện
            setEvents(prev => prev.map(e =>
                (e._id || e.id) === eventId ? { ...e, isLive: !currentStatus } : e
            ));

            // Đợi một chút để DB ổn định rồi tải lại danh sách luồng phát
            const streamsRes = await eventsService.list({ isLive: true, status: "approved" });
            setStreams(streamsRes.data || streamsRes || []);

            if (!currentStatus) {
                alert("Đã bắt đầu phát trực tiếp! Mọi người có thể xem tại tab 'Phát trực tiếp'.");
                setActiveTab("live"); // Tự động chuyển tab sau khi bật livestream
            } else {
                alert("Đã dừng phát trực tiếp.");
            }
        } catch (e) {
            alert(formatError(e));
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sự kiện này?")) return;
        try {
            await eventsService.remove(eventId);
            setEvents(prev => prev.filter(e => (e._id || e.id) !== eventId));
        } catch (e) {
            alert(formatError(e));
        }
    };

    const handleSubmitEvent = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                branchId: formData.branchId,
                title: formData.title,
                type: formData.type || "other",
                eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
                location: formData.location || "", // Đã thêm lại trường location bị thiếu
                description: formData.description || "",
                privacy: formData.privacy || "internal",
                personIds: (formData.personIdsText || "").split(",").map((s) => s.trim()).filter(Boolean),
                isLive: formData.isLive,
                streamUrl: formData.streamUrl,
                streamType: formData.streamType
            };

            console.log("FRONTEND: Payload to send:", payload);

            if (editEventId) {
                // Chế độ Sửa
                const updated = await eventsService.update(editEventId, payload);
                console.log("FRONTEND: Response from server:", updated);

                // Cập nhật ngay lập tức state cục bộ tránh stale data, dùng String() để so sánh chính xác
                setEvents(prev => prev.map(e => {
                    const eId = String(e._id || e.id || "");
                    const uId = String(updated._id || updated.id || "");
                    return eId === uId ? updated : e;
                }));
                alert("Cập nhật sự kiện thành công!");
            } else {
                // Chế độ Tạo mới
                const created = await eventsService.create(payload);
                setEvents(prev => [created, ...prev]);
                alert(isAdmin ? "Đã tạo sự kiện thành công!" : "Đã gửi yêu cầu tạo sự kiện thành công. Vui lòng chờ Ban quản trị duyệt!");
            }

            setShowAddModal(false);
            setEditEventId(null);
            // Không gọi fetch ngay lập tức để tránh race condition, 
            // state đã được cập nhật từ kết quả 'updated' phía trên.
            setFormData({
                branchId: branches[0]?._id || "", title: "", type: "other",
                eventDate: null, location: "", description: "", privacy: "internal",
                personIdsText: "", isLive: false, streamUrl: "", streamType: "youtube"
            });
            setLocState({ provCode: "", provName: "", distCode: "", distName: "", wardCode: "", wardName: "", detail: "" });
            setDistricts([]);
            setWards([]);
        } catch (err) {
            alert(formatError(err));
        }
    };

    const openEditModal = (ev) => {
        setEditEventId(ev._id || ev.id);

        let parsedDate = null;
        if (ev.eventDate) {
            parsedDate = new Date(ev.eventDate);
        }

        setFormData({
            branchId: ev.branchId?._id || ev.branchId || "",
            title: ev.title || "",
            type: ev.type || "other",
            eventDate: parsedDate,
            location: ev.location || "",
            description: ev.description || "",
            privacy: ev.privacy || "internal",
            personIdsText: (ev.personIds || []).map(p => typeof p === 'object' ? p._id : p).join(", "),
            isLive: ev.isLive || false,
            streamUrl: ev.streamUrl || "",
            streamType: ev.streamType || "youtube"
        });

        // Gán toàn bộ địa chỉ cũ vào ô detail (để đảm bảo không mất dữ liệu cũ của user)
        setLocState({ provCode: "", provName: "", distCode: "", distName: "", wardCode: "", wardName: "", detail: ev.location || "" });
        setDistricts([]);
        setWards([]);

        setShowAddModal(true);
    };

    const openDetailModal = async (ev) => {
        setLoadingDetail(true);
        setSelectedEventDetail(ev); // Show partial data immediately
        setShowDetailModal(true);
        try {
            const fullData = await eventsService.get(ev._id || ev.id);
            setSelectedEventDetail(fullData);
        } catch (e) {
            console.error("Lỗi tải chi tiết:", e);
        } finally {
            setLoadingDetail(false);
        }
    };

    return (
        <>
            <div className="container" style={{ maxWidth: 1000 }}>

                <div className="row" style={{ justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <div className="title-md">Sự kiện & Phát trực tiếp</div>
                        <div className="small">Quản lý ngày giỗ, họp mặt và kết nối trực tuyến</div>
                    </div>
                    {/* Cho phép tất cả user nhấn Tạo mới, user thường tạo ra sẽ ở trạng thái pending */}
                    <button className="btn primary" onClick={() => { setEditEventId(null); setShowAddModal(true); }}>
                        <Plus size={18} style={{ marginRight: 6 }} /> Tạo sự kiện / Đăng ký Phát trực tiếp
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
                    <button
                        onClick={() => setActiveTab("events")}
                        style={{
                            padding: "12px 24px", background: "none", border: "none",
                            borderBottom: activeTab === "events" ? "3px solid var(--primary)" : "3px solid transparent",
                            color: activeTab === "events" ? "var(--primary)" : "var(--text-light)",
                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                        }}
                    >
                        <Calendar size={18} /> Lịch Sự kiện {isAdmin && approvedEvents.length > 0 && <span style={{ background: "var(--primary-light)", color: "var(--primary)", borderRadius: 12, padding: "2px 8px", fontSize: 12 }}>{approvedEvents.length}</span>}
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab("pending")}
                            style={{
                                padding: "12px 24px", background: "none", border: "none",
                                borderBottom: activeTab === "pending" ? "3px solid var(--primary)" : "3px solid transparent",
                                color: activeTab === "pending" ? "var(--primary)" : "var(--text-light)",
                                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                            }}
                        >
                            Chờ duyệt
                            {pendingEvents.length > 0 && (
                                <span style={{ background: "var(--danger)", color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 12 }}>{pendingEvents.length}</span>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab("live")}
                        style={{
                            padding: "12px 24px", background: "none", border: "none",
                            borderBottom: activeTab === "live" ? "3px solid var(--primary)" : "3px solid transparent",
                            color: activeTab === "live" ? "var(--primary)" : "var(--text-light)",
                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                        }}
                    >
                        <Video size={18} /> Phát trực tiếp
                    </button>
                </div>

                <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>

                    <div style={{ flex: 2 }}>
                        {/* Tab: Sự kiện đã duyệt (tất cả user) */}
                        {activeTab === "events" && (
                            <div className="stack" style={{ gap: 16 }}>
                                {(isAdmin ? approvedEvents : userEvents).map(ev => (
                                    <div key={ev._id || ev.id} className="card">
                                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                                            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{ev.title}</div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span className="badge public" style={{ fontSize: 11 }}>✓ Đã duyệt</span>
                                                <span className="badge internal">{ev.type || "Sự kiện"}</span>
                                            </div>
                                        </div>
                                        <div className="stack" style={{ gap: 8, color: "var(--text-dark)" }}>
                                            <div className="row" style={{ gap: 8 }}><Calendar size={16} color="var(--text-light)" /> <strong>{ev.date || ev.eventDate ? new Date(ev.date || ev.eventDate).toLocaleDateString('vi-VN') : "N/A"}</strong></div>
                                            <div className="row" style={{ gap: 8 }}><MapPin size={16} color="var(--text-light)" /> <span>{ev.location || "Chưa cập nhật địa điểm"}</span></div>
                                            <p className="small" style={{ color: "var(--text-light)" }}>{ev.description}</p>
                                        </div>
                                        <div className="row" style={{ marginTop: 16, gap: 12 }}>
                                            {!isAdmin && (() => {
                                                const myReg = ev.participants?.find(p => p.userId === (me?._id || me?.id) || p.userId?._id === (me?._id || me?.id));
                                                if (!myReg || myReg.status === "rejected") {
                                                    return (
                                                        <button className="btn primary" onClick={() => handleRegister(ev._id || ev.id)}>
                                                            Đăng ký tham gia
                                                        </button>
                                                    );
                                                } else if (myReg.status === "pending") {
                                                    return (
                                                        <button className="btn" style={{ background: "rgba(184, 134, 11, 0.1)", color: "var(--accent)", fontWeight: "bold" }} disabled>
                                                            ⏳ Đang chờ duyệt
                                                        </button>
                                                    );
                                                } else {
                                                    if (ev.isLive) {
                                                        return (
                                                            <button className="btn" style={{ background: "var(--danger)", color: "#fff", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveTab("live")}>
                                                                <Radio size={16} /> Xem Livestream
                                                            </button>
                                                        );
                                                    }
                                                    return (
                                                        <button className="btn" style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--success)", fontWeight: "bold" }} disabled>
                                                            ✓ Đã đăng ký
                                                        </button>
                                                    );
                                                }
                                            })()}
                                            {(isAdmin || (ev.createdBy && (ev.createdBy._id || ev.createdBy) === (me?._id || me?.id))) && (
                                                <>
                                                    {isAdmin && (
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                background: ev.isLive ? "var(--danger)" : "var(--primary)",
                                                                color: "#fff",
                                                                fontWeight: 700,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 6
                                                            }}
                                                            onClick={() => handleToggleLive(ev._id || ev.id, ev.isLive, ev.streamUrl)}
                                                        >
                                                            <Radio size={16} /> {ev.isLive ? "Dừng Phát" : "Phát Trực Tiếp"}
                                                        </button>
                                                    )}
                                                    <button className="btn outline" onClick={() => openEditModal(ev)}>Chỉnh sửa</button>
                                                    <button className="btn outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleDeleteEvent(ev._id || ev.id)}>Xóa</button>
                                                </>
                                            )}
                                            <button className="btn outline" onClick={() => openDetailModal(ev)}>Xem chi tiết</button>
                                        </div>
                                    </div>
                                ))}
                                {(isAdmin ? approvedEvents : userEvents).length === 0 && !loading && (
                                    <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-light)" }}>Chưa có sự kiện nào được duyệt.</div>
                                )}
                            </div>
                        )}

                        {/* Tab: Hàng chờ duyệt (chỉ admin) */}
                        {activeTab === "pending" && isAdmin && (
                            <div className="stack" style={{ gap: 16 }}>
                                {pendingEvents.length > 0 && <div className="title-md" style={{ fontSize: 18, marginBottom: 8 }}>Sự kiện chờ duyệt</div>}
                                {pendingEvents.map(ev => (
                                    <div key={ev._id || ev.id} className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
                                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                                            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-dark)" }}>{ev.title}</div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span className="badge sensitive" style={{ fontSize: 11 }}>Chờ duyệt</span>
                                                <span className="badge internal">{ev.type || "Sự kiện"}</span>
                                            </div>
                                        </div>
                                        <div className="stack" style={{ gap: 8, color: "var(--text-dark)", marginBottom: 16 }}>
                                            <div className="row" style={{ gap: 8 }}><Calendar size={16} color="var(--text-light)" /> <strong>{ev.date || ev.eventDate ? new Date(ev.date || ev.eventDate).toLocaleDateString('vi-VN') : "N/A"}</strong></div>
                                            <div className="row" style={{ gap: 8 }}><MapPin size={16} color="var(--text-light)" /> <span>{ev.location || "Chưa cập nhật địa điểm"}</span></div>
                                            <p className="small" style={{ color: "var(--text-light)" }}>{ev.description}</p>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", gap: 12 }}>
                                            <button
                                                className="btn primary"
                                                disabled={approvingId === (ev._id || ev.id)}
                                                onClick={() => handleApproveEvent(ev._id || ev.id)}
                                            >
                                                {approvingId === (ev._id || ev.id) ? "Đang duyệt..." : "✓ Duyệt sự kiện"}
                                            </button>
                                            <button
                                                className="btn outline"
                                                disabled={approvingId === (ev._id || ev.id)}
                                                style={{ color: "var(--danger)", borderColor: "rgba(239,68,68,0.4)" }}
                                                onClick={() => handleRejectEvent(ev._id || ev.id)}
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Danh sách yêu cầu ĐĂNG KÝ THAM GIA */}
                                {events.some(ev => ev.participants?.some(p => p.status === "pending")) && (
                                    <div style={{ marginTop: 24 }}>
                                        <div className="title-md" style={{ fontSize: 18, marginBottom: 16 }}>Yêu cầu tham gia sự kiện</div>
                                        {events.map(ev => {
                                            const pendingReqs = ev.participants?.filter(p => p.status === "pending");
                                            if (!pendingReqs || pendingReqs.length === 0) return null;
                                            return (
                                                <div key={"req-" + (ev._id || ev.id)} className="card" style={{ marginBottom: 16, borderLeft: "4px solid var(--accent)" }}>
                                                    <div style={{ fontWeight: 600, color: "var(--primary)", marginBottom: 16 }}>{ev.title}</div>
                                                    <div className="stack" style={{ gap: 8 }}>
                                                        {pendingReqs.map(req => (
                                                            <div key={req.userId} className="row" style={{ justifyContent: "space-between", background: "var(--surface-hover)", padding: "12px 16px", borderRadius: 8 }}>
                                                                <div className="stack" style={{ gap: 4 }}>
                                                                    <div style={{ fontWeight: 600 }}>Mã TV: {req.userId}</div>
                                                                    <div className="small" style={{ color: "var(--text-light)" }}>Ngày xin: {new Date(req.registeredAt).toLocaleString('vi-VN')}</div>
                                                                </div>
                                                                <div className="row" style={{ gap: 8 }}>
                                                                    <button className="btn primary small" onClick={() => handleUpdateParticipantStatus(ev._id || ev.id, req.userId, "approved")}>Duyệt</button>
                                                                    <button className="btn outline small" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleUpdateParticipantStatus(ev._id || ev.id, req.userId, "rejected")}>Từ chối</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {pendingEvents.length === 0 && !events.some(ev => ev.participants?.some(p => p.status === "pending")) && (
                                    <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text-light)" }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                                        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Sạch hàng chờ!</div>
                                        <div className="small">Không có sự kiện hay đăng ký tham gia nào đang chờ duyệt.</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {loading && <div className="small" style={{ textAlign: "center", padding: 40 }}>Đang tải sự kiện...</div>}

                        {activeTab === "live" && (
                            <div className="stack" style={{ gap: 24 }}>
                                {streams.map(st => (
                                    <div key={st._id || st.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <StreamingPlayer
                                            url={st.streamUrl}
                                            type={st.streamType}
                                            title={st.title}
                                        />
                                        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
                                            <div className="small" style={{ color: "var(--text-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Users size={14} color="var(--primary)" />
                                                    <span>Người phát: <strong>{st.createdBy?.fullName || st.createdBy?.name || "Thành viên"}</strong></span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <GitBranch size={14} color="var(--accent)" />
                                                    <span>
                                                        {(isAdmin && (me?.role === 'admin' || me?.role === 'super_admin')) && st.branchId?.name?.includes("Chi") && (
                                                            <><span style={{ color: "var(--primary)", fontWeight: 600 }}>{st.branchId.name.split("Chi")[0].trim() || "Gia tộc"}</span> • </>
                                                        )}
                                                        Chi cành: <strong>{st.branchId?.name || "Chung"}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="row" style={{ gap: 12 }}>
                                                <button className="btn outline small" onClick={() => openDetailModal(st)}>Xem chi tiết</button>
                                                <button className="btn outline small" onClick={() => setActiveTab("events")}>Xem lịch sự kiện</button>
                                                {isAdmin && (
                                                    <button className="btn outline small" style={{ color: 'var(--danger)' }} onClick={() => handleToggleLive(st._id || st.id, true, st.streamUrl)}>
                                                        Dừng luồng
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {streams.length === 0 && !loading && (
                                    <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text-light)" }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
                                        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Chưa có luồng trực tiếp nào</div>
                                        <div className="small">Khi có các sự kiện được bật tính năng "Phát trực tiếp", chúng sẽ xuất hiện tại đây.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div className="card" style={{ background: "var(--primary-light)", borderColor: "transparent" }}>
                            <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                                <div className="avatar" style={{ background: "var(--primary)", color: "#fff", width: 40, height: 40 }}><Calendar size={20} /></div>
                                <div style={{ fontWeight: 600, color: "var(--text-dark)" }}>Tiện ích ngày tháng</div>
                            </div>
                            <p className="small" style={{ marginBottom: 16 }}>Hệ thống tự động quy đổi ngày giỗ từ Âm lịch sang Dương lịch vào mỗi năm để nhắc nhở con cháu chuẩn bị.</p>
                            <button className="btn outline" style={{ width: "100%", justifyContent: "center", background: "var(--surface)" }} onClick={() => setIsCalendarOpen(true)}>Xem Lịch Âm Toàn Tập</button>
                        </div>
                    </div>

                </div>

            </div>

            {showAddModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(44, 34, 26, 0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div className="card" style={{ width: 500, maxWidth: "90vw", padding: 32, borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", background: "var(--surface)" }}>
                        <div className="title-md" style={{ marginBottom: 20, fontSize: 22, fontWeight: 800 }}>
                            {editEventId ? "Chỉnh sửa sự kiện" : "Tạo sự kiện & Phát trực tiếp"}
                        </div>

                        {(!isAdmin && !editEventId) && (
                            <div style={{ background: "rgba(239, 68, 68, 0.05)", color: "var(--danger)", padding: "14px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px", fontWeight: "500", border: "1px solid rgba(239, 68, 68, 0.1)", lineHeight: 1.5 }}>
                                ℹ️ Sự kiện bạn tạo sẽ được đưa vào hàng chờ duyệt. Vui lòng chờ Ban quản trị kiểm duyệt trước khi hiển thị.
                            </div>
                        )}

                        <form onSubmit={handleSubmitEvent} className="stack" style={{ gap: 16 }}>
                            <div>
                                <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Chi cành (Branch)</label>
                                <select
                                    className="select"
                                    style={{ borderRadius: 12, padding: "10px 12px" }}
                                    required
                                    value={formData.branchId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(s => ({ ...s, branchId: val }));
                                    }}
                                >
                                    {!formData.branchId && <option value="">Chọn chi cành...</option>}
                                    {branches.map((b) => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Tiêu đề sự kiện</label>
                                <input
                                    required
                                    className="input"
                                    style={{ borderRadius: 12, padding: "12px 14px" }}
                                    placeholder="VD: Lễ khởi công xây dựng nhà thờ dòng họ"
                                    value={formData.title}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(s => ({ ...s, title: val }));
                                    }}
                                />
                            </div>

                            <div className="row" style={{ gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Loại sự kiện</label>
                                    <select
                                        className="select"
                                        style={{ borderRadius: 12, padding: "10px 12px" }}
                                        value={formData.type}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(s => ({ ...s, type: val }));
                                        }}
                                    >
                                        <option value="anniversary">Giỗ / Kỷ niệm</option>
                                        <option value="birth">Sinh</option>
                                        <option value="death">Mất</option>
                                        <option value="marriage">Kết hôn</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Thời gian</label>
                                    <DatePicker
                                        className="input"
                                        wrapperClassName="datepicker-fullwidth"
                                        selected={formData.eventDate ? new Date(formData.eventDate) : null}
                                        onChange={(date) => setFormData(s => ({ ...s, eventDate: date }))}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        timeCaption="Giờ"
                                        dateFormat="dd/MM/yyyy HH:mm"
                                        locale="vi"
                                        placeholderText="Chọn ngày giờ..."
                                    />
                                </div>
                            </div>

                            <div className="card" style={{ background: "rgba(184, 134, 11, 0.05)", border: "1px dashed var(--accent)", padding: 16 }}>
                                <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>Cấu hình Livestream</span>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 500 }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isLive}
                                            onChange={(e) => setFormData(s => ({ ...s, isLive: e.target.checked }))}
                                        />
                                        Đang phát trực tiếp
                                    </label>
                                </div>
                                <div className="row" style={{ gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="small" style={{ display: "block", marginBottom: 6 }}>Nguồn phát</label>
                                        <select
                                            className="select"
                                            value={formData.streamType}
                                            onChange={(e) => setFormData(s => ({ ...s, streamType: e.target.value }))}
                                        >
                                            <option value="youtube">YouTube</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="hls">HLS (m3u8)</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <label className="small" style={{ display: "block", marginBottom: 6 }}>Link Livestream (URL)</label>
                                        <input
                                            className="input"
                                            placeholder="https://youtube.com/live/..."
                                            value={formData.streamUrl}
                                            onChange={(e) => setFormData(s => ({ ...s, streamUrl: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row" style={{ gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Quyền xem</label>
                                    <select
                                        className="select"
                                        style={{ borderRadius: 12, padding: "10px 12px" }}
                                        value={formData.privacy}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(s => ({ ...s, privacy: val }));
                                        }}
                                    >
                                        <option value="public">Công khai</option>
                                        <option value="internal">Nội bộ họ</option>
                                        <option value="sensitive">Nhạy cảm</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Mã người liên quan</label>
                                    <input
                                        className="input"
                                        style={{ borderRadius: 12, padding: "12px 14px" }}
                                        placeholder="Cách nhau bằng dấu phẩy"
                                        value={formData.personIdsText}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(s => ({ ...s, personIdsText: val }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Địa điểm tổ chức</label>
                                <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                                    <select className="select" style={{ flex: 1, borderRadius: 12, padding: "10px 12px" }} value={locState.provCode} onChange={handleProvChange}>
                                        <option value="">Tỉnh / Thành phố...</option>
                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                    <select className="select" style={{ flex: 1, borderRadius: 12, padding: "10px 12px" }} value={locState.distCode} onChange={handleDistChange} disabled={!locState.provCode}>
                                        <option value="">Quận / Huyện...</option>
                                        {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                    </select>
                                    <select className="select" style={{ flex: 1, borderRadius: 12, padding: "10px 12px" }} value={locState.wardCode} onChange={handleWardChange} disabled={!locState.distCode}>
                                        <option value="">Phường / Xã...</option>
                                        {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                    </select>
                                </div>
                                <input
                                    className="input"
                                    style={{ borderRadius: 12, padding: "12px 14px" }}
                                    placeholder="Số nhà, tên tòa nhà, tên đường..."
                                    value={locState.detail}
                                    onChange={handleLocDetailChange}
                                />
                                {formData.location && (
                                    <div className="small" style={{ marginTop: 6, color: "var(--text-light)", fontStyle: "italic" }}>
                                        Địa chỉ ghi nhận: {formData.location}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="small" style={{ fontWeight: 700, display: "block", marginBottom: 8, color: "var(--text-dark)" }}>Mô tả chi tiết</label>
                                <textarea
                                    className="input"
                                    style={{ borderRadius: 12, padding: "12px 14px", minHeight: 100 }}
                                    placeholder="Nhiều nội dung chi tiết hơn về sự kiện..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(s => ({ ...s, description: val }));
                                    }}
                                />
                            </div>

                            <div className="row" style={{ justifyContent: "flex-end", marginTop: 12, gap: 12 }}>
                                <button type="button" className="btn outline" style={{ borderRadius: 12, padding: "12px 24px" }} onClick={() => { setShowAddModal(false); setEditEventId(null); setLocState({ provCode: "", provName: "", distCode: "", distName: "", wardCode: "", wardName: "", detail: "" }); }}>Hủy bỏ</button>
                                <button className="btn primary" type="submit" disabled={!formData.branchId || !formData.title} style={{ borderRadius: 12, padding: "12px 24px", fontWeight: 700 }}>
                                    {editEventId ? "Lưu thay đổi" : (isAdmin ? "Tạo sự kiện ngay" : "Gửi yêu cầu")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedEventDetail && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(44, 34, 26, 0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
                    <div className="card" style={{ width: 800, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", borderRadius: 28, padding: 0, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "var(--surface)" }}>
                        {/* Header Image/Banner */}
                        <div style={{ height: 160, background: "linear-gradient(135deg, var(--primary), #5a0000)", position: "relative", display: "flex", alignItems: "flex-end", padding: "0 32px 24px" }}>
                            <div style={{ color: "#fff" }}>
                                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{selectedEventDetail.title}</div>
                                <div style={{ display: "flex", gap: 12, alignItems: "center", opacity: 0.9 }}>
                                    <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none" }}>{selectedEventDetail.type || "Sự kiện"}</span>
                                    <span>•</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Calendar size={14} />
                                        <span>{selectedEventDetail.eventDate ? new Date(selectedEventDetail.eventDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
                                onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
                                onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
                            >
                                <Plus size={24} style={{ transform: "rotate(45deg)" }} />
                            </button>
                        </div>

                        <div style={{ padding: 32 }}>
                            <div className="row" style={{ alignItems: "flex-start", gap: 32 }}>
                                <div style={{ flex: 1.5 }}>
                                    {/* Video Player Section */}
                                    {selectedEventDetail.isLive && (
                                        <div style={{ marginBottom: 24, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                                            <StreamingPlayer
                                                url={selectedEventDetail.streamUrl}
                                                type={selectedEventDetail.streamType}
                                                title={selectedEventDetail.title}
                                            />
                                        </div>
                                    )}

                                    <div className="stack" style={{ gap: 24 }}>
                                        <section>
                                            <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                                <MapPin size={16} /> Địa điểm tổ chức
                                            </div>
                                            <div style={{ fontSize: 16, color: "var(--text-dark)", lineHeight: 1.6, background: "var(--primary-light)", padding: "16px 20px", borderRadius: 12 }}>
                                                {selectedEventDetail.location || "Chưa cập nhật địa điểm chính thức."}
                                            </div>
                                        </section>

                                        <section>
                                            <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)", marginBottom: 12 }}>
                                                Mô tả chi tiết
                                            </div>
                                            <div style={{ fontSize: 16, color: "var(--text-dark)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                                                {selectedEventDetail.description || "Không có mô tả chi tiết cho sự kiện này."}
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                <div style={{ flex: 1, borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
                                    <div className="stack" style={{ gap: 24 }}>
                                        {/* Status & Privacy */}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)", marginBottom: 12 }}>Thông tin bổ sung</div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                <span className={`badge ${selectedEventDetail.privacy === "public" ? "public" : "internal"}`} style={{ textTransform: "capitalize" }}>
                                                    {selectedEventDetail.privacy === "public" ? "Công khai" : "Nội bộ tộc"}
                                                </span>
                                                <span className={`badge ${selectedEventDetail.status === "approved" ? "public" : "sensitive"}`} style={{ textTransform: "capitalize" }}>
                                                    {selectedEventDetail.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Participants (Only for Admins) */}
                                        {isAdmin && (
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                                                    <span>Người tham gia ({selectedEventDetail.participants?.length || 0})</span>
                                                    {loadingDetail && <div className="spinner-small" />}
                                                </div>
                                                <div className="stack" style={{ gap: 8, maxHeight: 300, overflowY: "auto" }}>
                                                    {selectedEventDetail.participants?.length > 0 ? (
                                                        selectedEventDetail.participants.map((p, idx) => (
                                                            <div key={idx} className="row" style={{ gap: 12, padding: "10px 12px", background: "var(--surface-solid)", borderRadius: 10 }}>
                                                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: "var(--primary)", color: "#fff" }}>
                                                                    {(p.userId?.fullName || "U")[0]}
                                                                </div>
                                                                <div className="stack" style={{ gap: 2 }}>
                                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.userId?.fullName || "ID: " + (p.userId?._id || p.userId)}</div>
                                                                    <div className="small" style={{ opacity: 0.7 }}>{new Date(p.registeredAt).toLocaleDateString('vi-VN')}</div>
                                                                </div>
                                                                <div style={{ marginLeft: "auto" }}>
                                                                    <span className={`badge ${p.status === 'approved' ? 'public' : 'sensitive'}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                                                                        {p.status === 'approved' ? 'OK' : 'PND'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="small" style={{ fontStyle: "italic", opacity: 0.6 }}>Chưa có thành viên nào đăng ký.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Organizers */}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)", marginBottom: 12 }}>Người khởi tạo</div>
                                            <div className="row" style={{ gap: 12 }}>
                                                <div className="avatar" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                                    {(selectedEventDetail.createdBy?.fullName || "A")[0]}
                                                </div>
                                                <div className="stack">
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedEventDetail.createdBy?.fullName || "Hệ thống"}</div>
                                                    <div className="small" style={{ opacity: 0.7 }}>{selectedEventDetail.createdBy?.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ padding: "20px 32px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 12, background: "var(--surface-solid)" }}>
                            <button className="btn outline" onClick={() => setShowDetailModal(false)} style={{ borderRadius: 12, padding: "10px 24px" }}>Đóng</button>
                            {isAdmin && (
                                <button className="btn primary" onClick={() => { setShowDetailModal(false); openEditModal(selectedEventDetail); }} style={{ borderRadius: 12, padding: "10px 24px" }}>
                                    Chỉnh sửa sự kiện
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .datepicker-fullwidth {
            width: 100%;
        }
        .datepicker-fullwidth .input {
            width: 100%;
            border-radius: 12px;
            padding: 12px 14px;
        }
      `}</style>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
        </>
    );
}
