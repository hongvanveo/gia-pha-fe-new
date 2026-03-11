import { Outlet } from "react-router-dom";
import Topbar from "../components/Topbar.jsx";

export default function AuthenticatedLayout() {
    return (
        <div className="authenticated-scroll-container">
            <div className="scroll-outer-frame">
                <Topbar />
                <main className="scroll-main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
