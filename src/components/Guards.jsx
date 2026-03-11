import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";


export function RequireAuth({ children }) {
  // const { me, loading } = useAuth();
  // if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  // if (!me) return <Navigate to="/login" replace />;

  return children;
}

export function RequireRole({ role, children }) {
  // const { me, loading } = useAuth();
  // if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  // if (!me) return <Navigate to="/login" replace />;

  /*
  const normalize = (r) => {
    const s = String(r || "").toLowerCase();
    // Back-compat với UI role cũ
    if (s === "super_admin") return "admin";
    if (s === "tree_admin") return "editor";
    if (s === "user") return "member";
    return s;
  };

  const mine = normalize(me.role);
  const allowed = Array.isArray(role) ? role.map(normalize) : [normalize(role)];

  if (!allowed.includes(mine)) return <Navigate to="/" replace />;
  */
  return children;
}
