// components/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import { hasPermission } from "./utils/permissionUtils";

const storage = new StorageManager();

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  requiredPermission,
  redirectTo = "/dashboard" 
}: ProtectedRouteProps) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = storage.getUser();
    const permissions = storage.getUserPermissions();

    // Check if user is logged in
    if (!user || !user.id) {
      router.push("/");
      return;
    }

    // Check permission if required
    if (requiredPermission) {
      const hasAccess = hasPermission(permissions, requiredPermission);
      if (!hasAccess) {
        router.push(redirectTo);
        return;
      }
    }

    setIsAuthorized(true);
  }, [router, requiredPermission, redirectTo]);

  if (isAuthorized === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;