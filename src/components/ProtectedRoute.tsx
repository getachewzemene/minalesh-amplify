import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, User } from "@/context/auth-context";

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Array<User["role"]> }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (roles && user.role && !roles.includes(user.role)) {
    // If authenticated but not authorized, redirect home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
