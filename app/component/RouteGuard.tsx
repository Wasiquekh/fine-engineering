// app/component/RouteGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import { hasPermission, hasAnyPermission } from "./utils/permissionUtils";

const storage = new StorageManager();

// Route permission mapping (other modules)
const routePermissions: Record<string, string | string[]> = {
  "/dashboard": "dashboard.view",
  "/material-movement": "material.movement.view",
  "/section_inventory/inventory": "inventory.view",
  "/inventory_material_approve": "inventory.view",
  "/section_production_planning/production_planning": "production.planning.view",
  "/section_production_planning/vendors": "vendors.view",
  "/section_production_planning/category": "category.view",
  "/section_production_planning/po-services": "po.view",
  "/section_production_planning/pp_not-ok": "not-ok.view",
  "/section_production_planning/vendor/outsource": "outsource.view",
  "/section_production_planning/vendors/outsource": "outsource.view",
  "/qc": "qc.view",
  "/user-management": "user.management.view",
  "/user-activity": "user.management.view",
  "/useradd": "users.view",
  "/role-management": "roles.view",
  "/permission-management": "permissions.view",
  "/review": "review.view",
  "/procurement/dashboard": "procurement.view",
  "/procurement/master": "procurement.view",
  "/procurement/pr/inventory2": "procurement.view",
  "/procurement/pr/inventory3": "procurement.view",
  "/procurement/po": "procurement.view",
  "/procurement/reports": "procurement.view",
  "/procurement/rejected-po/inventory2": "procurement.view",
  "/procurement/rejected-po/inventory3": "procurement.view",
  "/section_inventory/kanban_approve": "kanban.view",
  "/section_production_planning/kanban_details": "kanban.view",
  "/section_inventory/tso_approve": "tso-service.view",
  "/section_production_planning/tso_details": "tso-service.view",
  "/section_production/machine_category": "machine.view",
};

// Public routes - authentication related routes that don't require login
const publicRoutes = ["/login", "/", "/unauthorized", "/qrcode", "/generateqrcode"];

const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
};

// Get required permission based on route and assign_to
// Accept ReadonlyURLSearchParams type directly
const getRequiredPermission = (pathname: string, searchParams: ReadonlyURLSearchParams): string | string[] | null => {
  // ============================================
  // PRODUCTION ROUTES - assign_to ke hisaab se
  // ============================================
  if (pathname === "/section_production/production_module" || pathname.startsWith("/section_production/production_module/")) {
    const assignTo = searchParams.get("assign_to");
    
    console.log("🔍 Production Module 1 - assign_to:", assignTo);
    
    // Riyaaz → production.2.view
    if (assignTo === "Riyaaz") {
      return "production.2.view";
    }
    // Usmaan → production.1.view
    if (assignTo === "Usmaan") {
      return "production.1.view";
    }
    // Ramzaan → production.3.view
    if (assignTo === "Ramzaan") {
      return "production.3.view";
    }
    // Default
    return "production.1.view";
  }
  
  if (pathname === "/section_production/production_module_2" || pathname.startsWith("/section_production/production_module_2/")) {
    const assignTo = searchParams.get("assign_to");
    
    console.log("🔍 Production Module 2 - assign_to:", assignTo);
    
    // Riyaaz → production.2.view
    if (assignTo === "Riyaaz") {
      return "production.2.view";
    }
    // Usmaan → production.1.view
    if (assignTo === "Usmaan") {
      return "production.1.view";
    }
    // Ramzaan → production.3.view
    if (assignTo === "Ramzaan") {
      return "production.3.view";
    }
    // Default
    return "production.2.view";
  }
  
  if (pathname === "/section_production/production_module_3" || pathname.startsWith("/section_production/production_module_3/")) {
    const assignTo = searchParams.get("assign_to");
    
    console.log("🔍 Production Module 3 - assign_to:", assignTo);
    
    // Riyaaz → production.2.view
    if (assignTo === "Riyaaz") {
      return "production.2.view";
    }
    // Usmaan → production.1.view
    if (assignTo === "Usmaan") {
      return "production.1.view";
    }
    // Ramzaan → production.3.view
    if (assignTo === "Ramzaan") {
      return "production.3.view";
    }
    // Default
    return "production.3.view";
  }
  
  // Non-production routes - exact match
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }
  
  // Dynamic routes
  const dynamicRoutes = [
    "/section_production_planning/production_planning",
    "/section_inventory/kanban_approve",
    "/section_production_planning/kanban_details",
    "/section_inventory/tso_approve",
    "/section_production_planning/tso_details",
    "/review",
    "/section_inventory/inventory_material_approve",
    "/section_production_planning/pp_not-ok",
    "/section_production_planning/vendor/outsource",
    "/section_production_planning/vendors/outsource",
  ];
  
  for (const route of dynamicRoutes) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return routePermissions[route];
    }
  }
  
  return null;
};

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard = ({ children }: RouteGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // SPECIAL HANDLING FOR QR AND AUTH ROUTES
      // These routes are part of the authentication flow and should always be accessible
      if (pathname === "/qrcode" || pathname === "/generateqrcode") {
        console.log("✅ QR/Auth route, allowing access without checks");
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if it's a public route
      if (isPublicRoute(pathname)) {
        console.log("✅ Public route, allowing access");
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      const user = storage.getUser();
      const permissions = storage.getUserPermissions();
      const assignTo = searchParams.get("assign_to");

      console.log("🔍 RouteGuard Debug:", {
        pathname,
        assign_to: assignTo,
        isPublic: isPublicRoute(pathname),
        user: user?.id,
        userRole: user?.role?.name,
        permissions: permissions?.map(p => p.name)
      });

      // Check login
      if (!user || !user.id) {
        console.log("❌ No user found, redirecting to login");
        router.push("/login");
        return;
      }

      // Get required permission - pass searchParams directly
      const requiredPermission = getRequiredPermission(pathname, searchParams);
      
      console.log("  - Required Permission:", requiredPermission);

      // No permission required
      if (!requiredPermission) {
        console.log("✅ No permission required, granting access");
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check permission
      let hasAccess = false;
      if (typeof requiredPermission === 'string') {
        hasAccess = hasPermission(permissions, requiredPermission);
        console.log(`  - Checking "${requiredPermission}": ${hasAccess}`);
      } else {
        hasAccess = hasAnyPermission(permissions, requiredPermission);
        console.log(`  - Checking any of [${requiredPermission.join(", ")}]: ${hasAccess}`);
      }

      if (!hasAccess) {
        console.log("❌ No permission, redirecting to /unauthorized");
        router.push("/unauthorized");
        return;
      }

      console.log("✅ Access granted");
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [pathname, router, searchParams]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard;