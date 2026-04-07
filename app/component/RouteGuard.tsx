// app/component/RouteGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import { hasPermission, hasAnyPermission } from "./utils/permissionUtils";

const storage = new StorageManager();

// Route permission mapping
const routePermissions: Record<string, string | string[]> = {
  "/dashboard": "dashboard.view",
  "/material-movement": "material.movement.view",
  
  // Production Planning Dashboard - NEW
  "/section_production_planning/dashboard": "production.planning.dashboard.view",
  
  // Inventory 1 Routes (only view now)
  "/section_inventory/inventory": "inventory1.view",
  
  // Inventory 2 Routes (only view now)
  "/section_inventory/inventory_2": "inventory2.view",
  "/inventory2/in-out": "inventory2.view",
  "/inventory2/material-transfer": "inventory2.view",
  "/inventory2/pr": "inventory2.view",
  
  // Inventory 3 Routes (only view now)
  "/section_inventory/inventory_3": "inventory3.view",
  "/inventory3/in-out": "inventory3.view",
  "/inventory3/material-transfer": "inventory3.view",
  "/inventory3/pr": "inventory3.view",
  "/inventory3/por": "inventory3.view",
  
  // Production Planning Routes
  "/section_production_planning/production_planning": "production.planning.view",
  "/section_production_planning/vendors": "vendors.view",
  "/section_production_planning/category": "category.view",
  "/section_production_planning/po-services": "po.view",
  "/section_production_planning/pp_not-ok": "not-ok.view",
  "/section_production_planning/vendor/outsource": "outsource.view",
  "/section_production_planning/vendors/outsource": "outsource.view",
  
  // QC Routes
  "/qc": "qc.view",
  
  // User Management Routes
  "/user-management": "user.management.view",
  "/user-activity": "user.management.view",
  "/useradd": "users.view",
  "/role-management": "roles.view",
  "/permission-management": "permissions.view",
  
  // Review Routes
  "/review": "review.view",
  
  // Procurement Routes
  "/procurement/dashboard": "procurement.view",
  "/procurement/master": "procurement.view",
  "/procurement/pr/inventory2": "procurement.view",
  "/procurement/pr/inventory3": "procurement.view",
  "/procurement/po": "procurement.view",
  "/procurement/reports": "procurement.view",
  "/procurement/rejected-po/inventory2": "procurement.view",
  "/procurement/rejected-po/inventory3": "procurement.view",
  
  // Other Routes
  "/section_inventory/kanban_approve": "kanban.view",
  "/section_production_planning/kanban_details": "kanban.view",
  "/section_inventory/tso_approve": "tso-service.view",
  "/section_production_planning/tso_details": "tso-service.view",
  "/section_production/machine_category": "machine.view",
};

// Public routes
const publicRoutes = ["/login", "/", "/unauthorized", "/qrcode", "/generateqrcode"];

const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
};

const getRequiredPermission = (pathname: string, searchParams: ReadonlyURLSearchParams): string | string[] | null => {
  // Production routes
  if (pathname === "/section_production/production_module" || pathname.startsWith("/section_production/production_module/")) {
    const assignTo = searchParams.get("assign_to");
    if (assignTo === "Riyaaz") return "production.2.view";
    if (assignTo === "Usmaan") return "production.1.view";
    if (assignTo === "Ramzaan") return "production.3.view";
    return "production.1.view";
  }
  
  if (pathname === "/section_production/production_module_2" || pathname.startsWith("/section_production/production_module_2/")) {
    const assignTo = searchParams.get("assign_to");
    if (assignTo === "Riyaaz") return "production.2.view";
    if (assignTo === "Usmaan") return "production.1.view";
    if (assignTo === "Ramzaan") return "production.3.view";
    return "production.2.view";
  }
  
  if (pathname === "/section_production/production_module_3" || pathname.startsWith("/section_production/production_module_3/")) {
    const assignTo = searchParams.get("assign_to");
    if (assignTo === "Riyaaz") return "production.2.view";
    if (assignTo === "Usmaan") return "production.1.view";
    if (assignTo === "Ramzaan") return "production.3.view";
    return "production.3.view";
  }
  
  // Exact match routes
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
      if (pathname === "/qrcode" || pathname === "/generateqrcode") {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      if (isPublicRoute(pathname)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      const user = storage.getUser();
      const permissions = storage.getUserPermissions();

      if (!user || !user.id) {
        router.push("/login");
        return;
      }

      const requiredPermission = getRequiredPermission(pathname, searchParams);
      
      if (!requiredPermission) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      let hasAccess = false;
      if (typeof requiredPermission === 'string') {
        hasAccess = hasPermission(permissions, requiredPermission);
      } else {
        hasAccess = hasAnyPermission(permissions, requiredPermission);
      }

      if (!hasAccess) {
        router.push("/unauthorized");
        return;
      }

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