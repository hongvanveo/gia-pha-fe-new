import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { personsService } from "../services/persons.service.js";
import { Link } from "react-router-dom";

import { branchesService } from "../services/branches.service.js";
import { useAuth } from "../store/auth.jsx";
import { formatError, translateRole } from "../lib/api.js";

export default function PersonsList() {
  const { me } = useAuth();
  const isGlobalAdmin = me?.role === "admin";
  const isGlobalEditor = me?.role === "editor" || me?.role === "tree_admin";
  const [items, setItems] = useState([]);
  const [params, setParams] = useState({ page: 1, limit: 20, branchId: "", privacy: "" });
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPerson, setNewPerson] = useState({ fullName: "", gender: "male", branchId: "" });
  const [isCreating, setIsCreating] = useState(false);


  const [branches, setBranches] = useState([]);
  async function load(p = params) {
    setErr("");
    setLoading(true);
    try {
      let res;
      if (isGlobalAdmin) {
        // Admin xem danh sách các Admin/Chủ sở hữu của các chi cành
        res = await branchesService.list(p);
        const branchesList = res.data || res;
        const adminItems = (Array.isArray(branchesList) ? branchesList : (branchesList.data || [])).map(b => ({
          id: b.ownerId?.linkedPersonId || b._id, // Ưu tiên link tới Person ID nếu đã liên kết
          fullName: `${b.ownerId?.fullName || "Chưa xác định"} (Admin - ${b.name})`,
          privacy: "admin",
          isLinked: !!b.ownerId?.linkedPersonId,
          branchName: b.name
        }));
        setItems(adminItems);
      } else {
        // Thành viên xem danh sách người trong gia phả như bình thường
        res = await personsService.list(p);
        const list = res.data || res;
        setItems(Array.isArray(list) ? list : (list.data || []));
      }
      setMeta(res.meta || null);
    } catch (e) {
      setErr(formatError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await branchesService.list({ limit: 100 });
        const list = res?.data || res || [];
        setBranches(Array.isArray(list) ? list : (list.data || []));
      } catch (e) {
        console.error("Không tải được chi cành", e);
      }
    })();

    load();

  }, []);

  // A person can add members if they are Admin, Editor globally, or if they manage ANY branch
  const isBranchAdmin = branches.some(b => {
    const isOwner = b.ownerId === (me?._id || me?.id);
    const isManager = b.members?.some(m => {
      const uid = m.userId?._id || m.userId;
      return uid === (me?._id || me?.id) && (m.roleInBranch === "editor" || m.roleInBranch === "owner");
    });
    return isOwner || isManager;
  });

  const canAddMember = isGlobalAdmin || isGlobalEditor || isBranchAdmin;

  return (
    <>
      <div className="container">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 24, alignItems: "flex-end" }}>
            <div>
              <div className="title-md">
                {isGlobalAdmin ? "Danh sách thành viên toàn hệ thống" : "Danh sách thành viên trong dòng họ"}
              </div>
              <div className="small">
                {isGlobalAdmin
                  ? "Liệt kê danh sách tất cả các thành viên để quản lý dễ dàng."
                  : "Danh sách các thành viên thuộc dòng họ mà bạn có quyền xem."}
              </div>
            </div>
            {canAddMember && (
              <button className="btn primary" onClick={() => setShowAddModal(true)}>
                + Thêm thành viên mới
              </button>
            )}
          </div>


          <div className="filters">
            {/* <input className="input" style={{ maxWidth: 260 }} placeholder="Mã chi cành (Branch ID)..."
              value={params.branchId} onChange={(e) => setParams(s => ({ ...s, branchId: e.target.value }))} />

            <select className="select" style={{ maxWidth: 200 }} value={params.privacy} onChange={(e) => setParams(s => ({ ...s, privacy: e.target.value }))}>
              <option value="">Tất cả quyền riêng tư</option>
              <option value="public">Công khai</option>
              <option value="internal">Nội bộ</option>
              <option value="sensitive">Nhạy cảm</option>
            </select> */}
            <select
              className="select"
              style={{ maxWidth: 260 }}
              value={params.branchId}
              onChange={(e) => setParams(s => ({ ...s, branchId: e.target.value }))}
            >
              <option value="">Tất cả chi cành</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>

            <select className="select" style={{ maxWidth: 200 }} value={params.privacy} onChange={(e) => setParams(s => ({ ...s, privacy: e.target.value }))}>
              <option value="">Tất cả quyền riêng tư</option>
              <option value="public">Công khai</option>
              <option value="internal">Nội bộ</option>
              <option value="sensitive">Nhạy cảm</option>
            </select>
            <button className="btn primary" onClick={() => load({ ...params, page: 1 })} disabled={loading}>
              {loading ? "Đang lọc..." : "Lọc danh sách"}
            </button>
          </div>

          {err && <div style={{ color: "var(--danger)", marginTop: 16 }}>{err}</div>}

          <div style={{ marginTop: 24, overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Phân quyền</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const id = p.id || p._id;
                  const name = p.name || p.fullName || "Chưa xác định";

                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 500 }}>{name}</td>
                      <td>
                        {p.privacy === "admin" ? (
                          <span className="badge public">Quản trị viên chi cành</span>
                        ) : p.privacy ? (
                          <span className={`badge ${p.privacy.toLowerCase()}`}>{p.privacy === 'internal' ? 'Nội bộ' : (p.privacy === 'public' ? 'Công khai' : (p.privacy === 'sensitive' ? 'Nhạy cảm' : p.privacy))}</span>
                        ) : "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <Link
                            className={`btn ${isGlobalAdmin && !p.isLinked ? "disabled" : ""}`}
                            to={isGlobalAdmin && !p.isLinked ? "#" : `/persons/${id}`}
                            onClick={(e) => {
                              if (isGlobalAdmin && !p.isLinked) {
                                e.preventDefault();
                                alert("Admin này chưa liên kết với bất kỳ hồ sơ phả hệ nào.");
                              }
                            }}
                            style={{ padding: "6px 12px", fontSize: 13, opacity: isGlobalAdmin && !p.isLinked ? 0.5 : 1 }}
                          >Chi tiết</Link>
                          <Link
                            className={`btn ${isGlobalAdmin && !p.isLinked ? "disabled" : ""}`}
                            to={isGlobalAdmin && !p.isLinked ? "#" : `/persons/${id}/tree`}
                            onClick={(e) => {
                              if (isGlobalAdmin && !p.isLinked) {
                                e.preventDefault();
                                alert("Admin này chưa liên kết với bất kỳ hồ sơ phả hệ nào.");
                              }
                            }}
                            style={{ padding: "6px 12px", fontSize: 13, opacity: isGlobalAdmin && !p.isLinked ? 0.5 : 1 }}
                          >Cây</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && !loading && (
                  <tr><td colSpan="3" className="small" style={{ textAlign: "center", padding: "40px" }}>Không có dữ liệu.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan="3" className="small" style={{ textAlign: "center", padding: "40px" }}>Đang tải...</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="row" style={{ justifyContent: "space-between", marginTop: 24, alignItems: "center" }}>
              <div className="small">
                Trang {meta.page} / {meta.totalPages} <span style={{ margin: "0 8px" }}>•</span> {meta.total} kết quả
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" disabled={meta.page <= 1 || loading} onClick={() => load({ ...params, page: meta.page - 1 })}>Trước</button>
                <button className="btn" disabled={meta.page >= meta.totalPages || loading} onClick={() => load({ ...params, page: meta.page + 1 })}>Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44, 34, 26, 0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div className="card" style={{ width: 450, animation: "slideDown 0.3s ease" }}>
            <div className="title-md" style={{ marginBottom: 16 }}>Thêm thành viên phả hệ mới</div>
            <form className="stack" onSubmit={async (e) => {
              e.preventDefault();
              setIsCreating(true);
              try {
                await personsService.create(newPerson);
                alert("Thêm thành viên thành công!");
                setShowAddModal(false);
                setNewPerson({ fullName: "", gender: "male", branchId: "" });
                load();
              } catch (err) {
                alert(formatError(err));
              } finally {
                setIsCreating(false);
              }
            }}>
              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Họ và tên *</label>
                <input required className="input" placeholder="VD: Nguyễn Văn A" value={newPerson.fullName} onChange={e => setNewPerson({ ...newPerson, fullName: e.target.value })} />
              </div>
              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Giới tính</label>
                <select className="select" value={newPerson.gender} onChange={e => setNewPerson({ ...newPerson, gender: e.target.value })}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div>
                <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Chi cành / Dòng họ *</label>
                <select required className="select" value={newPerson.branchId} onChange={e => setNewPerson({ ...newPerson, branchId: e.target.value })}>
                  <option value="">-- Chọn chi cành --</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 16, gap: 10 }}>
                <button type="button" className="btn outline" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn primary" disabled={isCreating}>{isCreating ? "Đang xử lý..." : "Tạo mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>

  );
}
