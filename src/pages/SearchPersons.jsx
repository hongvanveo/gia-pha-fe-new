import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { searchService } from "../services/search.service.js";
import { branchesService } from "../services/branches.service.js";
import { formatError } from "../lib/api.js";
import { Link } from "react-router-dom";

import { useDebounce } from "../hooks/useDebounce.js";
import { Search, Filter, MapPin, Users, CalendarDays, Activity, ChevronDown } from "lucide-react";

export default function SearchPersons() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ privacy: "all", branch: "all", generation: "all" });
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedQ = useDebounce(q, 600);


  useEffect(() => {
    (async () => {
      try {
        const res = await branchesService.list({ limit: 200 });
        const list = res?.data || res || [];
        setBranches(Array.isArray(list) ? list : (list.data || []));
      } catch (e) {
        // im lặng - search vẫn chạy nếu không có branches
        setBranches([]);
      }
    })();
  }, []);

  const hasFilters = useMemo(() =>
    (filters.branch && filters.branch !== "all") ||
    (filters.generation && filters.generation !== "all") ||
    (filters.privacy && filters.privacy !== "all"),
    [filters]);

  const canSearch = useMemo(() => q.trim().length > 0 || hasFilters, [q, hasFilters]);

  // Xoá lỗi khi người dùng thay đổi input hoặc bộ lọc
  useEffect(() => {
    setErr("");
  }, [q, filters]);

  useEffect(() => {
    if (debouncedQ.trim()) {
      run(1);
    } else if (!hasFilters) {
      setItems([]);
      setMeta(null);
    }
  }, [debouncedQ, hasFilters]);

  async function run(page = 1) {
    setErr("");

    // Kiểm tra nếu không có từ khóa và cũng không có bộ lọc nào được chọn
    const hasFilters = (filters.branch && filters.branch !== "all") ||
      (filters.generation && filters.generation !== "all") ||
      (filters.privacy && filters.privacy !== "all");

    if (!q.trim() && !hasFilters) {
      setErr("Vui lòng nhập họ tên hoặc chọn ít nhất một bộ lọc (Chi cành, Đời...) để tìm kiếm.");
      return;
    }

    setLoading(true);
    try {
      const payload = { page, limit: 20 };
      if (q.trim()) payload.q = q.trim();
      if (filters.privacy && filters.privacy !== "all") payload.privacy = filters.privacy;
      if (filters.branch && filters.branch !== "all") payload.branchId = filters.branch;
      if (filters.generation && filters.generation !== "all") payload.generation = filters.generation;

      const res = await searchService.persons(payload);
      const list = res.data || res;
      setItems(Array.isArray(list) ? list : (list.data || []));
      setMeta(res.meta || null);
    } catch (e) {
      setErr(formatError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="container" style={{ maxWidth: 1200 }}>

        <div style={{ textAlign: "center", marginBottom: 32, marginTop: 16 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>Tra cứu Gia phả</h1>
          <div style={{ color: "var(--muted)", fontSize: 16 }}>Tìm kiếm thông tin tổ tiên, ông bà và các thành viên trong dòng họ</div>
        </div>

        <div className="card" style={{ padding: "24px 32px", marginBottom: 32, borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 10px 25px rgba(0,0,0,0.03)" }}>
          {/* Main Search Bar */}
          <div className="row" style={{ gap: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={22} color="var(--muted)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="input"
                placeholder="Nhập họ tên, tự hiệu, pháp danh..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: "100%", paddingLeft: 52, height: 56, fontSize: 17, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
                onKeyDown={(e) => { if (e.key === "Enter" && canSearch) run(1); }}
              />
            </div>
            <button className="btn primary" onClick={() => run(1)} disabled={loading} style={{ height: 56, padding: "0 32px", fontSize: 16, fontWeight: 700, borderRadius: 12 }}>
              {loading ? "Đang tìm..." : "Tìm kiếm ngay"}
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="row" style={{ justifyContent: "center" }}>
            <button
              className="btn small"
              style={{ background: "none", border: "none", color: "var(--text-light)", gap: 4 }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter size={16} /> Bộ lọc nâng cao <ChevronDown size={16} style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: "0.2s" }} />
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvanced && (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)", animation: "fadeIn 0.3s ease" }}>

              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}><Users size={14} style={{ marginRight: 4 }} /> Chi cành</label>
                <select className="select" value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
                  <option value="all">Tất cả chi cành</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}><CalendarDays size={14} style={{ marginRight: 4 }} /> Thế hệ / Đời</label>
                <select className="select" value={filters.generation} onChange={(e) => setFilters({ ...filters, generation: e.target.value })}>
                  <option value="all">Tất cả thế hệ</option>
                  <option value="1">Đời thứ 1 (Cụ tổ)</option>
                  <option value="2">Đời thứ 2</option>
                  <option value="3">Đời thứ 3</option>
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}><Activity size={14} style={{ marginRight: 4 }} /> Tình trạng</label>
                <select className="select">
                  <option value="all">Tất cả</option>
                  <option value="alive">Còn sống</option>
                  <option value="deceased">Đã mất</option>
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Sắp xếp theo</label>
                <select className="select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                  <option value="relevance">Độ liên quan</option>
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {err && (
          <div className="card" style={{
            color: "var(--danger)",
            marginBottom: 24,
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.1)",
            padding: "16px 24px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontWeight: 600
          }}>
            <Activity size={20} /> {err}
          </div>
        )}

        <div>
          {items.length === 0 && !loading && canSearch && q.length > 0 && (
            <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
              <Search size={48} color="var(--border)" style={{ marginBottom: 16 }} />
              <div className="title-md" style={{ color: "var(--text-light)" }}>Không tìm thấy kết quả phù hợp</div>
              <div className="small" style={{ color: "var(--text-light)" }}>Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</div>
            </div>
          )}

          {items.length > 0 && (
            <div className="grid">
              {items.map((p) => {
                const id = p.id || p._id;
                const name = p.name || p.fullName || "Chưa xác định";
                const initials = (name)
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((x) => x[0]?.toUpperCase())
                  .join("");

                return (
                  <div key={id} className="person-card" style={{ position: "relative", overflow: "hidden", borderRadius: 16 }}>
                    {/* Status Indicator Bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: p.isAlive === false ? "var(--muted)" : "var(--primary)" }} />

                    <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: p.gender === "female" ? "rgba(236,72,153,0.1)" : "var(--primary-light)", color: p.gender === "female" ? "#db2777" : "var(--primary)", border: "2px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>{initials || "?"}</div>

                    <div className="person-meta" style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div className="person-name" style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>
                          <div className="person-sub" style={{ marginTop: 4, color: "var(--muted)", fontWeight: 600 }}>
                            {p.birthYear ? p.birthYear : "?"} - {p.deathYear ? p.deathYear : "Nay"}
                          </div>
                        </div>
                        {p.privacy && (
                          <span className={`badge ${p.privacy.toLowerCase()}`} style={{ fontSize: 10, padding: "2px 10px" }}>{p.privacy}</span>
                        )}
                      </div>

                      <div className="small" style={{ color: "var(--muted)", marginTop: 8, display: "flex", gap: 6, alignItems: "center", fontWeight: 500 }}>
                        <MapPin size={14} color="var(--primary)" /> {p.branch?.name || p.branchId || "Chi cành gốc"}
                      </div>

                      <div className="person-actions" style={{ marginTop: 16, gap: 12 }}>
                        <Link className="btn outline" style={{ flex: 1, justifyContent: "center", borderRadius: 8, fontWeight: 600 }} to={`/persons/${id}`}>Chi tiết</Link>
                        <Link className="btn primary" style={{ flex: 1, justifyContent: "center", borderRadius: 8, fontWeight: 600 }} to={`/persons/${id}/tree`}>Cây huyết thống</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {meta && items.length > 0 && (
          <div className="row" style={{ justifyContent: "center", marginTop: 40, marginBottom: 40 }}>
            <div className="small" style={{ background: "var(--surface-solid)", padding: "8px 24px", borderRadius: 999, border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              Đang xem trang <strong style={{ color: "var(--text-dark)" }}>{meta.page}</strong> trên <strong style={{ color: "var(--text-dark)" }}>{meta.totalPages}</strong> trang <span style={{ margin: "0 12px", color: "var(--border)" }}>|</span> Tìm thấy <strong style={{ color: "var(--primary)" }}>{meta.total}</strong> hồ sơ
            </div>
          </div>
        )}
      </div>
    </>
  );
}
