// app/component/PageGuard.tsx (Updated)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import { hasPermission } from "./utils/permissionUtils";

const storage = new StorageManager();

interface PageGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const PageGuard = ({ 
  children, 
  requiredPermission,
  fallback,
  redirectTo = "/dashboard" 
}: PageGuardProps) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const user = storage.getUser();
    const permissions = storage.getUserPermissions();

    if (!user || !user.id) {
      router.push("/");
      return;
    }

    if (requiredPermission) {
      const access = hasPermission(permissions, requiredPermission);
      if (!access) {
        if (fallback) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
        router.push(redirectTo);
        return;
      }
    }

    setHasAccess(true);
    setIsChecking(false);
  }, [requiredPermission, redirectTo, router, fallback]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!hasAccess && fallback) {
    return <>{fallback}</>;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default PageGuard;