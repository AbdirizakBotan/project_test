import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminTable from "./pages/Tables/Admin";
import MembersPage from "./pages/Tables/Members";
import LockedAdminsTable from "./pages/Tables/LockedAdmins";
import Payments from "./pages/Tables/Payments";

// Protected Route component
const ProtectedRoute = ({ children, requiredRoles }: { children: React.ReactNode, requiredRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // User is authenticated but doesn't have the required role
    return <Navigate to="/error-404" />;
  }

  return <>{children}</>;
};

// Public Route component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Layout */}
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/" element={<PublicRoute><SignIn /></PublicRoute>} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout /> 
          </ProtectedRoute>
        }
      >
        <Route index path="/dashboard" element={<Home />} />
        <Route path="/profile" element={<UserProfiles />} />
        <Route path="/admins" element={<ProtectedRoute requiredRoles={['super-admin']}><AdminTable /></ProtectedRoute>} />
        <Route path="/locked-admins" element={<ProtectedRoute requiredRoles={['super-admin']}><LockedAdminsTable /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute requiredRoles={['super-admin']}><Payments /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute requiredRoles={['admin', 'super-admin']}><MembersPage /></ProtectedRoute>} />
        

      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppRoutes />
        <Toaster position="top-right" containerClassName="z-[100000] mt-20" />
      </Router>
    </AuthProvider>
  );
}
