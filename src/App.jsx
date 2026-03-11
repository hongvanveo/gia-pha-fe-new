import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RequireRole } from "./components/Guards.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import SearchPersons from "./pages/SearchPersons.jsx";
import PersonsList from "./pages/PersonsList.jsx";
import PersonDetail from "./pages/PersonDetail.jsx";
import PersonTree from "./pages/PersonTree.jsx";
import Admin from "./pages/Admin.jsx";
import Preview from "./pages/Preview.jsx";
import Events from "./pages/Events.jsx";
import Moderation from "./pages/Moderation.jsx";
import Media from "./pages/Media.jsx";
import Profile from "./pages/Profile.jsx";
import BranchDetail from "./pages/BranchDetail.jsx";
import ChangePasswordMandatory from "./pages/ChangePasswordMandatory.jsx";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/change-password-mandatory" element={<ChangePasswordMandatory />} />

      <Route path="/preview" element={<Preview />} />

      <Route
        element={
          <RequireAuth>
            <AuthenticatedLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Home />} />
        <Route path="/search/persons" element={<SearchPersons />} />
        <Route path="/persons" element={<PersonsList />} />
        <Route path="/persons/:id" element={<PersonDetail />} />
        <Route path="/persons/:id/tree" element={<PersonTree />} />
        <Route path="/events" element={<Events />} />
        <Route path="/media" element={<Media />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/branches/:id" element={<BranchDetail />} />

        <Route
          path="/moderation"
          element={
            <RequireRole role="TREE_ADMIN">
              <Moderation />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole role="SUPER_ADMIN">
              <Admin />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
