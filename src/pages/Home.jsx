import { useAuth } from "../store/auth.jsx";
import HomeSuperAdmin from "./HomeSuperAdmin.jsx";
import HomeTreeAdmin from "./HomeTreeAdmin.jsx";
import HomeUser from "./HomeUser.jsx";

export default function Home() {
  const { me } = useAuth();
  const role = String(me?.role || "member").toLowerCase();

  if (role === "admin" || role === "super_admin") {
    return <HomeSuperAdmin />;
  }
  
  if (role === "editor" || role === "tree_admin") {
    return <HomeTreeAdmin />;
  }

  return <HomeUser />;
}