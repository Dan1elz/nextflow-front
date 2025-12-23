import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import UsersPageWrapper from "@/pages/Users";
import PrivateLayout from "@/components/layouts/PrivateLayout";
import { Login } from "@/pages/Auth/Login";
import { PrivateRoutes } from "./PrivateRoutes";
import { PublicRoutes } from "./PublicRoutes";
import { Home } from "@/pages/Home";

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route
        element={
          <PublicRoutes>
            <Outlet />
          </PublicRoutes>
        }
      >
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Rotas Privadas */}
      <Route
        element={
          <PrivateRoutes>
            <PrivateLayout />
          </PrivateRoutes>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="users" element={<UsersPageWrapper />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
