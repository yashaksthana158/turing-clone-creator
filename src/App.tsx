import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Eagerly loaded public pages
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import About from "./pages/About";
import Teams from "./pages/Teams";
import OverloadPP from "./pages/OverloadPP";
import OverloadEventDetail from "./pages/OverloadEventDetail";
import Gallery from "./pages/Gallery";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import Setup from "./pages/Setup";
import ProfilePage from "./pages/Profile";

// Lazily loaded dashboard pages — split into separate chunks
const DashboardOverview    = lazy(() => import("./pages/dashboard/DashboardOverview"));
const DashboardEvents      = lazy(() => import("./pages/dashboard/DashboardEvents"));
const DashboardCertificates = lazy(() => import("./pages/dashboard/DashboardCertificates"));
const DashboardTasks       = lazy(() => import("./pages/dashboard/DashboardTasks"));
const ManageTeams          = lazy(() => import("./pages/dashboard/ManageTeams"));
const ManageUsers          = lazy(() => import("./pages/dashboard/ManageUsers"));
const DashboardRoles       = lazy(() => import("./pages/dashboard/DashboardRoles"));
const DashboardOverload    = lazy(() => import("./pages/dashboard/DashboardOverload"));
const DashboardTeamMembers = lazy(() => import("./pages/dashboard/DashboardTeamMembers"));
const DashboardGallery     = lazy(() => import("./pages/dashboard/DashboardGallery"));

// Shared loading fallback
function DashboardFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9113ff]" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/overloadpp" element={<OverloadPP />} />
            <Route path="/overloadpp/:year" element={<OverloadPP />} />
            <Route path="/overloadpp/:year/event/:eventId" element={<OverloadEventDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:year" element={<ComingSoon section="Gallery" />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Dashboard Routes — lazily loaded + protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute minRoleLevel={1}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardOverview />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/events" element={
              <ProtectedRoute minRoleLevel={1}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardEvents />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/certificates" element={
              <ProtectedRoute minRoleLevel={1}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardCertificates />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/tasks" element={
              <ProtectedRoute minRoleLevel={2}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardTasks />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teams" element={
              <ProtectedRoute minRoleLevel={3}>
                <Suspense fallback={<DashboardFallback />}>
                  <ManageTeams />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/users" element={
              <ProtectedRoute minRoleLevel={5}>
                <Suspense fallback={<DashboardFallback />}>
                  <ManageUsers />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/roles" element={
              <ProtectedRoute minRoleLevel={5}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardRoles />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/overload" element={
              <ProtectedRoute minRoleLevel={3}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardOverload />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/team-members" element={
              <ProtectedRoute minRoleLevel={3}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardTeamMembers />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/gallery" element={
              <ProtectedRoute minRoleLevel={3}>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardGallery />
                </Suspense>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
