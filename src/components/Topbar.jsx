import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";
import { Bell, X } from "lucide-react";
import { notificationsService } from "../services/notifications.service.js";
import { translateRole } from "../lib/api.js";

export default function Topbar() {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAuthPage = loc.pathname === "/login" || loc.pathname === "/register";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleAvatarClick = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    nav("/login"); // Redirect to login after logout
  };

  const handleProfileClick = () => {
    nav("/profile"); // Navigate to profile page
    setIsDropdownOpen(false);
  };

  const roleStr = String(me?.role || "").toLowerCase();
  const isAdmin = roleStr === "admin" || roleStr === "super_admin";
  const isEditor = roleStr === "editor" || roleStr === "tree_admin";

  const getRoleBadge = (role) => {
    const label = translateRole(role).toUpperCase();
    switch (role) {
      case "SUPER_ADMIN": return <span className="badge public" style={{ background: "var(--danger)", color: "#fff" }}>{label}</span>;
      case "TREE_ADMIN": return <span className="badge public" style={{ background: "var(--primary-dark)", color: "#fff" }}>{label}</span>;
      default: return <span className="badge internal" style={{ background: "var(--border)", color: "var(--text-dark)" }}>{label}</span>;
    }
  };

  // ── Notification Bell State ──
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!me) return;
    try {
      const res = await notificationsService.getUnreadCount();
      setUnreadCount(res?.data?.count ?? res?.count ?? 0);
    } catch { /* silently ignore */ }
  }, [me]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleBellClick = async () => {
    if (showNotifPanel) { setShowNotifPanel(false); return; }
    try {
      const res = await notificationsService.list({ limit: 15 });
      setNotifications(res?.data ?? res ?? []);
    } catch { setNotifications([]); }
    setShowNotifPanel(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationsService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  // Close notification panel on outside click
  useEffect(() => {
    function handleOut(e) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) setShowNotifPanel(false);
    }
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-inner" style={{ maxWidth: 1400 }}>
        {/* Logo Section */}
        <div className="nav" style={{ gap: 24 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-hover))", color: "#fff", padding: "6px 14px", borderRadius: 10, fontWeight: 900, fontSize: 18, boxShadow: "0 4px 12px rgba(139, 0, 0, 0.25)" }}>GIA PHẢ</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text-dark)", letterSpacing: "-0.5px" }}>VIỆT ONLINE</span>
          </Link>

          {/* Center Navigation */}
          {me && (
            <div className="nav" style={{ gap: 28, marginLeft: 20 }}>
              <Link className={loc.pathname === "/dashboard" ? "active" : ""} to="/dashboard" style={{ fontSize: 14, fontWeight: 600 }}>Cây gia phả</Link>
              <Link className={loc.pathname.includes("/persons") ? "active" : ""} to="/persons" style={{ fontSize: 14, fontWeight: 600 }}>Thành viên</Link>
              <Link className={loc.pathname.includes("/events") ? "active" : ""} to="/events" style={{ fontSize: 14, fontWeight: 600 }}>Sự kiện</Link>
              <Link className={loc.pathname.includes("/media") ? "active" : ""} to="/media" style={{ fontSize: 14, fontWeight: 600 }}>Thư viện</Link>
            </div>
          )}
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="nav" style={{ gap: 16 }}>
          {me && (
            <>
              {/* ── Bell Button + Notification Panel ── */}
              <div style={{ position: 'relative' }} ref={notifPanelRef}>
                <button
                  className="btn"
                  style={{ background: 'none', border: 'none', padding: 8, boxShadow: 'none', position: 'relative' }}
                  onClick={handleBellClick}
                >
                  <Bell size={22} color="var(--text-dark)" />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, background: 'var(--danger)', borderRadius: 9, border: '2px solid #fff', fontSize: 10, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifPanel && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360, maxHeight: 480, overflowY: 'auto', background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 999 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>🔔 Thông báo</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {unreadCount > 0 && <button onClick={handleMarkAllRead} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>§Đánh dấu tất cả đã đọc</button>}
                        <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
                      </div>
                    </div>
                    {(!notifications || !Array.isArray(notifications) || notifications.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 14 }}>Không có thông báo nào.</div>
                    ) : notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => handleMarkOne(n._id)}
                        style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'transparent' : 'rgba(139,0,0,0.04)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(139,0,0,0.04)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{n.title}</span>
                          {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n.body}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '---'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(isAdmin || isEditor) && (
                <Link
                  to={isAdmin ? "/admin" : "/"}
                  className="btn"
                  style={{ background: "var(--accent)", color: "#fff", fontWeight: 800, borderRadius: 10, border: "none", padding: "8px 22px", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}
                >
                  ADMIN
                </Link>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleAvatarClick}
                  className="btn"
                  style={{ background: "none", border: "none", padding: 0, boxShadow: "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                >
                  <div style={{ textAlign: "right", lineHeight: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)" }}>{me.fullName || me.name || "User"}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                      {translateRole(me?.role)}
                    </div>
                  </div>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 15, background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff", border: "2px solid #fff" }}>
                    {(me.fullName || me.name || "U").charAt(0).toUpperCase()}
                  </div>
                </button>

                {isDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 100,
                      minWidth: 160,
                      padding: "8px 0",
                    }}
                  >
                    <button
                      onClick={handleProfileClick}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--text-dark)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--light)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "var(--danger)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--light)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!me && !isAuthPage && (
            <div style={{ display: "flex", gap: 8 }}>
              {/* Vô hiệu hóa nút Đăng ký theo yêu cầu Backend mới */}
              <Link className="btn primary" to="/login">Đăng nhập</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
