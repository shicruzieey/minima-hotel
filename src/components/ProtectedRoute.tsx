import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  // Validate session on mount and when user changes
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Check if user status is still active
      if (user.status !== "active") {
        console.log("User status is no longer active, logging out");
        logout();
      }
    }
  }, [isAuthenticated, user, isLoading, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate page based on user's actual role
    const redirectPath = user?.role === "manager" ? "/manager/dashboard" : "/receptionist/pos";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
