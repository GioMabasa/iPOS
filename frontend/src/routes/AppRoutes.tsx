import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import MainLayout from "../components/layout/MainLayout";

import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Unauthorized from "../pages/Unauthorized";

import POS from "../pages/POS";
import Products from "../pages/Products";
import Categories from "../pages/Categories";
import Suppliers from "../pages/Suppliers";
import Customers from "../pages/Customers";
import Purchases from "../pages/Purchases";
import Inventory from "../pages/Inventory";
import Sales from "../pages/Sales";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";

import ApprovalRequests from "../pages/ApprovalRequests";

import BirSettings from "../pages/BirSettings";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to="/pos" replace /> : <Login />}
      />

      <Route
        path="/unauthorized"
        element={user ? <Unauthorized /> : <Navigate to="/login" replace />}
      />

      {/* Authenticated */}
      <Route element={user ? <MainLayout /> : <Navigate to="/login" replace />}>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Cashier + Manager + Admin */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]} />
          }
        >
          <Route path="/pos" element={<POS />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
        </Route>

        {/* Admin + Manager */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "manager"]} />}>
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/approval-requests" element={<ApprovalRequests />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/settings" element={<Settings />} />
          <Route path="/bir-settings" element={<BirSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
