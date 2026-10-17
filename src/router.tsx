import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./layout/AppShell";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminDevicesPage } from "./pages/AdminDevicesPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminFirmwarePage } from "./pages/AdminFirmwarePage";
import { AlertsPage } from "./pages/AlertsPage";
import { AlarmSettingsPage } from "./pages/AlarmSettingsPage";
import { DevicesPage } from "./pages/DevicesPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from "./pages/PasswordRecoveryPage";
import { PageLoader } from "./components/States";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UserDashboard } from "./pages/UserDashboard";

const MonitoringPage = lazy(() => import("./pages/MonitoringPage").then((module) => ({ default: module.MonitoringPage })));
const AdminMonitoringPage = lazy(() => import("./pages/AdminMonitoringPage").then((module) => ({ default: module.AdminMonitoringPage })));
const FarmsPage = lazy(() => import("./pages/FarmsPage").then((module) => ({ default: module.FarmsPage })));

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { element: <ProtectedRoute role="user" />, children: [{ element: <AppShell />, children: [
    { path: "/app", element: <UserDashboard /> },
    { path: "/app/monitoring", element: <Suspense fallback={<PageLoader label="Memuat monitoring" />}><MonitoringPage /></Suspense> },
    { path: "/app/farms", element: <Suspense fallback={<PageLoader label="Memuat tambak" />}><FarmsPage /></Suspense> },
    { path: "/app/devices", element: <DevicesPage /> },
    { path: "/app/alerts", element: <AlertsPage /> },
    { path: "/app/alerts/settings", element: <AlarmSettingsPage /> },
    { path: "/app/profile", element: <ProfilePage /> },
  ] }] },
  { element: <ProtectedRoute role="admin" />, children: [{ element: <AppShell />, children: [
    { path: "/admin", element: <AdminDashboard /> },
    { path: "/admin/monitoring", element: <Suspense fallback={<PageLoader label="Memuat monitoring admin" />}><AdminMonitoringPage /></Suspense> },
    { path: "/admin/devices", element: <AdminDevicesPage /> },
    { path: "/admin/users", element: <AdminUsersPage /> },
    { path: "/admin/firmware", element: <AdminFirmwarePage /> },
    { path: "/admin/profile", element: <ProfilePage /> },
  ] }] },
  { path: "*", element: <NotFoundPage /> },
]);
