import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import About from "./pages/About";
import Teams from "./pages/Teams";
import OverloadPP from "./pages/OverloadPP";
import DashboardOverload from "./pages/dashboard/DashboardOverload";
import Gallery from "./pages/Gallery";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import Setup from "./pages/Setup";
import ProfilePage from "./pages/Profile";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ManageTeams from "./pages/dashboard/ManageTeams";
import ManageUsers from "./pages/dashboard/ManageUsers";
import DashboardEvents from "./pages/dashboard/DashboardEvents";
import DashboardTasks from "./pages/dashboard/DashboardTasks";
import DashboardRoles from "./pages/dashboard/DashboardRoles";
import DashboardCertificates from "./pages/dashboard/DashboardCertificates";

const queryClient = new QueryClient();

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

            {/* Dashboard Routes (protected - all authenticated users get dashboard) */}
            <Route path="/dashboard" element={<ProtectedRoute minRoleLevel={1}><DashboardOverview /></ProtectedRoute>} />
            <Route path="/dashboard/events" element={<ProtectedRoute minRoleLevel={1}><DashboardEvents /></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute minRoleLevel={1}><DashboardCertificates /></ProtectedRoute>} />
            <Route path="/dashboard/tasks" element={<ProtectedRoute minRoleLevel={2}><DashboardTasks /></ProtectedRoute>} />
            <Route path="/dashboard/teams" element={<ProtectedRoute minRoleLevel={3}><ManageTeams /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute minRoleLevel={5}><ManageUsers /></ProtectedRoute>} />
            <Route path="/dashboard/roles" element={<ProtectedRoute minRoleLevel={5}><DashboardRoles /></ProtectedRoute>} />
            <Route path="/dashboard/overload" element={<ProtectedRoute minRoleLevel={3}><DashboardOverload /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
