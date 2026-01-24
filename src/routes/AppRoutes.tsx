import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import UsersPageWrapper from "@/pages/Users";
import CreateUserPageWrapper from "@/pages/User/Create";
import EditUserPageWrapper from "@/pages/User/Edit";
import PrivateLayout from "@/components/layouts/PrivateLayout";
import { Login } from "@/pages/Auth/Login";
import { PrivateRoutes } from "./PrivateRoutes";
import { PublicRoutes } from "./PublicRoutes";
import { Home } from "@/pages/Home";
import ViewUserPageWrapper from "@/pages/User/View";
import StatesPageWrapper from "@/pages/States";
import CitiesPageWrapper from "@/pages/Cities";
import CountriesPageWrapper from "@/pages/Countries";
import CreateCountryPageWrapper from "@/pages/Country/Create";
import EditCountryPageWrapper from "@/pages/Country/Edit";
import ViewCountryPageWrapper from "@/pages/Country/View";
import EditCityPageWrapper from "@/pages/City/Edit";
import CreateCityPageWrapper from "@/pages/City/Create";
import ViewCityPageWrapper from "@/pages/City/View";
import ViewStatePageWrapper from "@/pages/State/View";
import EditStatePageWrapper from "@/pages/State/Edit";
import CreateStatePageWrapper from "@/pages/State/Create";

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
        <Route path="users/create" element={<CreateUserPageWrapper />} />
        <Route path="users/:id/edit" element={<EditUserPageWrapper />} />
        <Route path="users/:id/view" element={<ViewUserPageWrapper />} />

        <Route path="states" element={<StatesPageWrapper />} />
        <Route path="states/create" element={<CreateStatePageWrapper />} />
        <Route path="states/:id/edit" element={<EditStatePageWrapper />} />
        <Route path="states/:id/view" element={<ViewStatePageWrapper />} />

        <Route path="cities" element={<CitiesPageWrapper />} />
        <Route path="cities/create" element={<CreateCityPageWrapper />} />
        <Route path="cities/:id/edit" element={<EditCityPageWrapper />} />
        <Route path="cities/:id/view" element={<ViewCityPageWrapper />} />

        <Route path="countries" element={<CountriesPageWrapper />} />
        <Route path="countries/create" element={<CreateCountryPageWrapper />} />
        <Route path="countries/:id/edit" element={<EditCountryPageWrapper />} />
        <Route path="countries/:id/view" element={<ViewCountryPageWrapper />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
