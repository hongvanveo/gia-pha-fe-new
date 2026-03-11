export default function ConfirmModal({ open, title="Xác nhận", message="Bạn chắc chắn?", onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50
      }}
      onMouseDown={onCancel}
    >
      <div className="card" style={{ width: 420 }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        <div className="small" style={{ marginTop: 8 }}>{message}</div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn" onClick={onCancel}>Hủy</button>
          <button className="btn danger" onClick={onConfirm}>OK</button>
        </div>
      </div>
    </div>
  );
}
