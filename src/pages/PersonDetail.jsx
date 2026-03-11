import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { personsService } from "../services/persons.service.js";
import { usersService } from "../services/users.service.js";
import { formatError } from "../lib/api.js";

import { useAuth } from "../store/auth.jsx";
import { Camera, Edit2, User, Phone, MapPin, Calendar, CheckSquare, Trash2, Heart, Users, Shield } from "lucide-react";
import { mediaService } from "../services/media.service.js";

export default function PersonDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [person, setPerson] = useState(null);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { me } = useAuth();

  const canEdit = me?.role === "TREE_ADMIN" || me?.role === "SUPER_ADMIN";

  // Danh sách thành viên trong gia đình (Từ Tree API)
  const [familyMembers, setFamilyMembers] = useState([]);

  async function load() {
    setErr("");
    setLoading(true);
    setIsEditing(false);
    try {
      const data = await personsService.get(id);

      const formatYMD = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";

      const normalized = {
        ...data,
        name: data.fullName,
        dobRaw: formatYMD(data.dateOfBirth),
        dodRaw: formatYMD(data.dateOfDeath),
        isAlive: data.isAlive
      };
      setPerson(normalized);
      setEdit(normalized);

      try {
        const treeRes = await personsService.tree(id, { depth: 3, includeSpouses: true, includeSiblings: true });
        const rootNode = treeRes?.data?.root || treeRes?.root;

        if (rootNode) {
          const mappedMembers = [];
          const seen = new Set();

          const addMember = (p, label, colorClass = "internal") => {
            const pid = p?._id || p?.id;
            if (!pid || seen.has(pid) || pid === id) return;
            seen.add(pid);
            mappedMembers.push({
              id: pid,
              name: p.fullName || p.name,
              relation: label,
              badgeClass: colorClass
            });
          };

          (rootNode.spouses || []).forEach(p => addMember(p, "Vợ / Chồng", "public"));

          (rootNode.parents || []).forEach(p => {
            addMember(p, "Cha / Mẹ", "internal");
            (p.parents || []).forEach(gp => addMember(gp, `Ông / Bà (${p.gender === 'male' ? 'nội' : 'ngoại'})`, "sensitive"));
          });

          (rootNode.siblings || []).forEach(p => addMember(p, "👥 Anh / Chị / Em", "internal"));

          (rootNode.children || []).forEach(p => {
            addMember(p, "Con cái", "public");
            (p.children || []).forEach(gc => addMember(gc, `Cháu (con của ${p.fullName || p.name})`, "internal"));
          });

          setFamilyMembers(mappedMembers);
        }
      } catch (relErr) {
        console.warn("Could not load full family tree", relErr);
      }
    } catch (e) {
      setErr(formatError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function save() {
    setErr("");
    setSaving(true);
    try {
      const payload = {
        ...edit,
        fullName: edit.name,
        dateOfBirth: edit.dobRaw ? new Date(edit.dobRaw).toISOString() : null,
        dateOfDeath: !edit.isAlive && edit.dodRaw ? new Date(edit.dodRaw).toISOString() : null,
        isAlive: edit.isAlive
      };
      const data = await personsService.update(id, payload);
      const formatYMD = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";
      const normalized = {
        ...data,
        name: data.fullName,
        dobRaw: formatYMD(data.dateOfBirth),
        dodRaw: formatYMD(data.dateOfDeath),
        isAlive: data.isAlive
      };
      setPerson(normalized);
      setEdit(normalized);
      alert("Đã lưu thành công");
      setIsEditing(false);
    } catch (e) {
      setErr(formatError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setErr("");
    try {
      await personsService.remove(id);
      nav("/persons");
    } catch (e) {
      setErr(formatError(e));
    } finally {
      setConfirmDel(false);
    }
  }

  const [accountInfo, setAccountInfo] = useState(null);
  async function handleCreateAccount() {
    if (!window.confirm("Bạn có chắc chắn muốn cấp tài khoản cho thành viên này? Mật khẩu mặc định sẽ là ngày sinh (DDMMYY).")) return;
    setSaving(true);
    try {
      const res = await usersService.createFromPerson({ personId: id });
      // Mong đợi trả về { username, password }
      setAccountInfo(res);
    } catch (e) {
      alert(formatError(e));
    } finally {
      setSaving(false);
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const branchId = typeof person.branchId === 'object' ? person.branchId._id : person.branchId;
    if (!branchId) return alert("Không tìm thấy thông tin Chi cành!");

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("branchId", branchId);
      formData.append("personId", id);

      const uploadRes = await mediaService.upload(formData);
      const mediaId = uploadRes.data?._id || uploadRes?._id;

      if (mediaId) {
        await personsService.update(id, { avatarMediaId: mediaId });
        alert("Cập nhật ảnh đại diện thành công!");
        load();
      }
    } catch (err) {
      alert(formatError(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center" }}>Đang tải hồ sơ...</div>
    );
  }

  return (
    <>
      <div className="container" style={{ maxWidth: 1000 }}>
        {err && <div className="card" style={{ color: "var(--danger)", marginBottom: 16 }}>{err}</div>}

        <div className="social-layout" style={{ marginTop: 20 }}>

          {/* Left Column: Avatar & Basic Status */}
          <aside style={{ width: 300, flexShrink: 0 }}>
            <div className="card" style={{ textAlign: "center", padding: "32px 20px", borderRadius: 16 }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
                <div className="avatar" style={{ width: 140, height: 140, fontSize: 48, background: "var(--surface)", color: "var(--primary)", border: "6px solid var(--border)", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
                  {(person?.name || person?.fullName || "U").charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <label className="btn primary" style={{ position: "absolute", bottom: 8, right: 8, padding: 10, borderRadius: "50%", cursor: uploadingAvatar ? "not-allowed" : "pointer" }}>
                    <Camera size={18} />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-dark)", marginBottom: 12 }}>
                {person?.name || person?.fullName || "Chưa xác định"}
              </h2>

              <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 20, fontSize: 14, fontWeight: 700, background: edit?.isAlive ? "rgba(45, 106, 79, 0.1)" : "rgba(139, 0, 0, 0.1)", color: edit?.isAlive ? "#2d6a4f" : "var(--danger)", marginBottom: 20 }}>
                {edit?.isAlive ? "Còn sống" : "Đã mất"}
              </div>

              <div className="small" style={{ color: "var(--muted)", fontWeight: 500 }}>ID Thành viên: {id}</div>

              <div className="stack" style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)", gap: 12 }}>
                {!isEditing ? (
                  canEdit && (
                    <>
                      <button className="btn outline" style={{ width: "100%", justifyContent: "center", borderRadius: 8, fontWeight: 600 }} onClick={() => setIsEditing(true)}>
                        <Edit2 size={16} style={{ marginRight: 8 }} /> Chỉnh sửa hồ sơ
                      </button>

                      {!person.linkedUserId && (
                        <button
                          className="btn primary"
                          style={{ width: "100%", justifyContent: "center", borderRadius: 8, fontWeight: 600, background: "var(--green)", borderColor: "var(--green)" }}
                          onClick={handleCreateAccount}
                          disabled={saving}
                        >
                          <Shield size={16} style={{ marginRight: 8 }} /> Cấp tài khoản đăng nhập
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn" style={{ flex: 1, justifyContent: "center", borderRadius: 8 }} onClick={() => { setIsEditing(false); setEdit(person); }}>Hủy</button>
                    <button className="btn primary" style={{ flex: 1, justifyContent: "center", borderRadius: 8 }} onClick={save} disabled={saving}>Lưu thay đổi</button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info Modal */}
            {accountInfo && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(44, 34, 26, 0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                <div className="card" style={{ width: 400, textAlign: "center", padding: 32, animation: "slideDown 0.3s ease", background: "var(--surface)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <div className="title-md" style={{ marginBottom: 8 }}>Cấp tài khoản thành công!</div>
                  <p className="small" style={{ color: "var(--text-light)", marginBottom: 24 }}>Vui lòng gửi thông tin này cho thành viên để họ có thể đăng nhập.</p>

                  <div className="stack" style={{ gap: 12, background: "var(--surface-solid)", padding: 20, borderRadius: 12, textAlign: "left", marginBottom: 24 }}>
                    <div>
                      <div className="small" style={{ fontWeight: 600, color: "var(--text-light)" }}>Tên đăng nhập (ID)</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{accountInfo.username}</div>
                    </div>
                    <div>
                      <div className="small" style={{ fontWeight: 600, color: "var(--text-light)" }}>Mật khẩu mặc định</div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{accountInfo.password}</div>
                    </div>
                  </div>

                  <button className="btn primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setAccountInfo(null)}>Đóng thông báo</button>
                </div>
              </div>
            )}
          </aside>

          {/* Right Column: Details & Family */}
          <main style={{ flex: 1, minWidth: 0 }}>
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <User size={20} color="var(--primary)" /> Thông tin cá nhân
              </div>

              {!isEditing ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  <div>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Họ và Tên</div>
                    <div style={{ fontWeight: 500 }}>{person?.name || person?.fullName || "-"}</div>
                  </div>
                  <div>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Giới tính</div>
                    <div style={{ fontWeight: 500 }}>{person?.gender === "female" ? "Nữ" : "Nam"}</div>
                  </div>
                  <div>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Năm sinh</div>
                    <div style={{ fontWeight: 500 }}>{person?.birthYear || "-"}</div>
                  </div>
                  <div>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Số điện thoại</div>
                    <div style={{ fontWeight: 500 }}>{person?.phone || "-"}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Địa chỉ</div>
                    <div style={{ fontWeight: 500 }}>{person?.address || "-"}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Mức độ riêng tư</div>
                    <span className={`badge ${person?.privacy?.toLowerCase() || ''}`}>{person?.privacy || "Không có"}</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="small" style={{ color: "var(--text-light)", marginBottom: 4 }}>Ghi chú</div>
                    <div style={{ whiteSpace: "pre-wrap", background: "var(--surface-solid)", padding: 12, borderRadius: 8, fontSize: 14 }}>{person?.note || "Không có ghi chú thêm."}</div>
                  </div>
                </div>
              ) : (
                <div className="stack" style={{ gap: 16 }}>
                  <div className="row" style={{ gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Họ và Tên</div>
                      <input className="input" value={edit.name || ""} onChange={(e) => setEdit(s => ({ ...s, name: e.target.value }))} />
                    </div>
                    <div style={{ width: "30%" }}>
                      <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Giới tính</div>
                      <select className="select" value={edit.gender || "male"} onChange={(e) => setEdit(s => ({ ...s, gender: e.target.value }))}>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Mức độ riêng tư</div>
                      <select className="select" value={edit.privacy || ""} onChange={(e) => setEdit(s => ({ ...s, privacy: e.target.value }))}>
                        <option value="">Không bắt buộc</option>
                        <option value="public">Công khai</option>
                        <option value="internal">Nội bộ</option>
                        <option value="sensitive">Nhạy cảm</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Tình trạng</div>
                      <select className="select" value={edit.isAlive ? "true" : "false"} onChange={(e) => setEdit(s => ({ ...s, isAlive: e.target.value === "true" }))}>
                        <option value="true">Còn sống</option>
                        <option value="false">Đã mất</option>
                      </select>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Ngày sinh</div>
                      <input className="input" type="date" value={edit.dobRaw || ""} onChange={(e) => setEdit(s => ({ ...s, dobRaw: e.target.value }))} />
                    </div>
                    {!edit.isAlive && (
                      <div style={{ flex: 1 }}>
                        <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Ngày mất</div>
                        <input className="input" type="date" value={edit.dodRaw || ""} onChange={(e) => setEdit(s => ({ ...s, dodRaw: e.target.value }))} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Số điện thoại</div>
                    <input className="input" value={edit.phone || ""} onChange={(e) => setEdit(s => ({ ...s, phone: e.target.value }))} />
                  </div>

                  <div>
                    <div className="small" style={{ marginBottom: 6, fontWeight: 500 }}>Địa chỉ</div>
                    <input className="input" value={edit.address || ""} onChange={(e) => setEdit(s => ({ ...s, address: e.target.value }))} />
                  </div>

                  <div>
                    <div className="small" style={{ marginBottom: 6, fontWeight: 500, color: "var(--text-dark)" }}>Ghi chú / Tiểu sử</div>
                    <textarea
                      className="input"
                      style={{ minHeight: 120, resize: "vertical" }}
                      value={edit.note || ""}
                      onChange={(e) => setEdit(s => ({ ...s, note: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
                    <button className="btn danger" style={{ background: "transparent", color: "var(--danger)" }} onClick={(e) => { e.preventDefault(); setConfirmDel(true); }}>
                      <Trash2 size={16} style={{ marginRight: 8 }} /> Xóa hồ sơ
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Users size={20} color="var(--primary)" /> Thành viên gia đình</div>
                {canEdit && (
                  <button
                    className="btn small outline"
                    onClick={() => alert("Để thêm thành viên mới, vui lòng sử dụng chức năng 'Thêm người' trong trang Quản lý Chi cành của bạn.")}
                  >
                    Thêm người
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {familyMembers.map((m) => (
                  <div key={m.id || m._id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 12, background: "var(--surface-solid)" }}>
                    <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                      {(m.name || m.fullName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name || m.fullName}</div>
                      <div className="small" style={{ marginBottom: 6 }}>
                        <span className={`badge ${m.badgeClass}`} style={{ padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
                          {m.relation}
                        </span>
                      </div>
                      <Link to={`/persons/${m.id || m._id}`} className="btn outline" style={{ padding: "4px 8px", fontSize: 12, width: "100%", justifyContent: "center" }}>Xem hồ sơ</Link>
                    </div>
                  </div>
                ))}
                {familyMembers.length === 0 && (
                  <div className="small" style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24 }}>Chưa có dữ liệu thành viên gia đình.</div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <ConfirmModal
        open={confirmDel}
        title="Xác nhận xóa thành viên"
        message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa tất cả thông tin của thành viên này khỏi hệ thống?"
        onCancel={() => setConfirmDel(false)}
        onConfirm={remove}
      />
    </>
  );
}
