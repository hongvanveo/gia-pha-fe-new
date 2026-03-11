import Topbar from "../components/Topbar.jsx";
import { Link } from "react-router-dom";

export default function Preview() {
  return (
    <>
      <Topbar />
      <div className="container">
        <div className="card">
          <div style={{ fontWeight: 800 }}>UI Preview</div>
          <div className="small" style={{ marginTop: 6 }}>
            Dùng để xem nhanh các giao diện mà không cần backend.
          </div>

          <div className="stack" style={{ marginTop: 12 }}>
            <Link className="btn" to="/">Trang chủ</Link>
            <Link className="btn" to="/search/persons">Tìm thành viên</Link>
            <Link className="btn" to="/persons">Danh sách thành viên</Link>
            <Link className="btn" to="/persons/1">Chi tiết thành viên (demo)</Link>
            <Link className="btn" to="/persons/1/tree">Cây gia phả (demo)</Link>
            <Link className="btn" to="/admin">Admin</Link>
          </div>
        </div>
      </div>
    </>
  );
}
