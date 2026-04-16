// app/component/RouteGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import { hasPermission, hasAnyPermission, getFirstAvailableModulePath } from "./utils/permissionUtils";

const storage = new StorageManager();

// Route permission mapping - WITH BOTH EQP AND BIO PERMISSIONS
const routePermissions: Record<string, string | string[]> = {
  "/dashboard": "dashboard.view",
  "/material-movement": "material.movement.view",
  
  // Production Planning Dashboard
  "/section_production_planning/dashboard": "production.planning.dashboard.view",
  
  // Inventory Routes
  "/section_inventory/inventory": ["material.data.view", "inventory1.view"],
  "/section_inventory/inventory_2": "inventory2.view",
  "/section_inventory/inventory_3": "inventory3.view",
  "/inventory2/in-out": "inventory2.view",
  "/inventory2/material-transfer": "inventory2.view",
  "/section_inventory/inventory2/pr": "inventory2.view",
  "/inventory3/in-out": "inventory3.view",
  "/inventory3/material-transfer": "inventory3.view",
  "/inventory3/pr": "inventory3.view",
  "/inventory3/por": "inventory3.view",
  "/inventory_material_approve": ["material.approved.view", "inventory1.view"],
  
  // Production Planning Routes
  "/section_production_planning/production_planning": "productionplanning.view",
  "/section_production_planning/vendors/outgoing": "pp.vendor.outgoing.view",
  "/section_production_planning/vendors/incoming": "pp.vendor.incoming.view",
  "/section_production_planning/vendors/outsource": "outsource.view",
  "/section_production_planning/category": "category.view",
  "/section_production_planning/po-services": ["pp.eqp.po.view", "pp.bio.po.view"],
  "/section_production_planning/welding": ["pp.eqp.welding.outgoing.view", "pp.bio.welding.outgoing.view"],
  "/section_production_planning/welding/outgoing": ["pp.eqp.welding.outgoing.view", "pp.bio.welding.outgoing.view"],
  "/section_production_planning/pp_not-ok": ["pp.eqp.notok.view", "pp.bio.notok.view"],
  
  // QC Routes
  "/qc": ["qc.eqp.view", "qc.bio.view", "qc.view"],
  "/qc/welding": ["qc.eqp.welding.view", "qc.bio.welding.view", "qc.view"],
  "/qc/vendor": ["qc.eqp.vendor.view", "qc.bio.vendor.view", "qc.view"],
  
  // User Management Routes
  "/user-management": "usermanagement.view",
  "/user-activity": "useractivity.view",
  "/useradd": "usermanagement.view",
  "/role-management": "usermanagement.view",
  "/permission-management": "usermanagement.view",
  
  // Review Routes - WITH BOTH EQP AND BIO
  "/review": [
    "production1.eqp.review.view", "production1.bio.review.view",
    "production2.eqp.review.view", "production2.bio.review.view",
    "production3.eqp.review.view", "production3.bio.review.view"
  ],
  "/review/welding": [
    "production1.eqp.review.welding.view", "production1.bio.review.welding.view",
    "production2.eqp.review.welding.view", "production2.bio.review.welding.view",
    "production3.eqp.review.welding.view", "production3.bio.review.welding.view"
  ],
  "/review/vendor": [
    "production1.eqp.review.vendor.view", "production1.bio.review.vendor.view",
    "production2.eqp.review.vendor.view", "production2.bio.review.vendor.view",
    "production3.eqp.review.vendor.view", "production3.bio.review.vendor.view"
  ],
  
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
  "/section_inventory/kanban_approve": ["pp.eqp.kanban.view", "pp.bio.kanban.view"],
  "/section_production_planning/kanban_details": ["pp.eqp.kanban.view", "pp.bio.kanban.view"],
  "/section_inventory/tso_approve": ["pp.eqp.tso.view", "pp.bio.tso.view"],
  "/section_production_planning/tso_details": ["pp.eqp.tso.view", "pp.bio.tso.view"],
  "/customer": null,
};

// Public routes
const publicRoutes = ["/login", "/", "/unauthorized", "/qrcode", "/generateqrcode"];

const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
};

const getRequiredPermission = (pathname: string, searchParams: ReadonlyURLSearchParams): string | string[] | null => {
  // ============================================
  // PRODUCTION 1 ROUTES (Usmaan) - No Kanban, No PO
  // WITH BOTH EQP AND BIO
  // ============================================
  
  // Production 1 - Job routes
  if (pathname === "/section_production/production_module" || pathname.startsWith("/section_production/production_module/")) {
    const assignTo = searchParams.get("assign_to");
    const client = searchParams.get("client");
    
    // Production 1 (Usmaan)
    if (assignTo === "Usmaan") {
      if (client === "Amar Equipment") return "production1.eqp.job.view";
      if (client === "Amar Biosystem") return "production1.bio.job.view";
      return ["production1.eqp.job.view", "production1.bio.job.view", "production1.view"];
    }
    
    // Production 2 (Riyaaz)
    if (assignTo === "Riyaaz") {
      if (client === "Amar Equipment") return "production2.eqp.job.view";
      if (client === "Amar Biosystem") return "production2.bio.job.view";
      return ["production2.eqp.job.view", "production2.bio.job.view", "production2.view"];
    }
    
    // Production 3 (Ramzaan)
    if (assignTo === "Ramzaan") {
      if (client === "Amar Equipment") return "production3.eqp.job.view";
      if (client === "Amar Biosystem") return "production3.bio.job.view";
      return ["production3.eqp.job.view", "production3.bio.job.view", "production3.view"];
    }
    
    return ["production1.eqp.job.view", "production1.bio.job.view", "production1.view"];
  }
  
  // Production 1 - TSO routes
  if (pathname === "/section_production/production_module_2" || pathname.startsWith("/section_production/production_module_2/")) {
    const assignTo = searchParams.get("assign_to");
    const client = searchParams.get("client");
    
    if (assignTo === "Usmaan") {
      if (client === "Amar Equipment") return "production1.eqp.tso.view";
      if (client === "Amar Biosystem") return "production1.bio.tso.view";
      return ["production1.eqp.tso.view", "production1.bio.tso.view", "production1.view"];
    }
    if (assignTo === "Riyaaz") {
      if (client === "Amar Equipment") return "production2.eqp.tso.view";
      if (client === "Amar Biosystem") return "production2.bio.tso.view";
      return ["production2.eqp.tso.view", "production2.bio.tso.view", "production2.view"];
    }
    if (assignTo === "Ramzaan") {
      if (client === "Amar Equipment") return "production3.eqp.tso.view";
      if (client === "Amar Biosystem") return "production3.bio.tso.view";
      return ["production3.eqp.tso.view", "production3.bio.tso.view", "production3.view"];
    }
    return ["production1.eqp.tso.view", "production1.bio.tso.view", "production1.view"];
  }
  
  // Production 2 & 3 - Kanban routes (Production 1 has NO Kanban)
  if (pathname === "/section_production/production_module_3" || pathname.startsWith("/section_production/production_module_3/")) {
    const assignTo = searchParams.get("assign_to");
    const client = searchParams.get("client");
    
    if (assignTo === "Riyaaz") {
      if (client === "Amar Equipment") return "production2.eqp.kanban.view";
      if (client === "Amar Biosystem") return "production2.bio.kanban.view";
      return ["production2.eqp.kanban.view", "production2.bio.kanban.view", "production2.view"];
    }
    if (assignTo === "Ramzaan") {
      if (client === "Amar Equipment") return "production3.eqp.kanban.view";
      if (client === "Amar Biosystem") return "production3.bio.kanban.view";
      return ["production3.eqp.kanban.view", "production3.bio.kanban.view", "production3.view"];
    }
    return ["production2.eqp.kanban.view", "production2.bio.kanban.view", "production2.view"];
  }
  
  // ============================================
  // REVIEW ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/review" || pathname.startsWith("/review/")) {
    const client = searchParams.get("client");
    const filter = searchParams.get("filter");
    const assignTo = searchParams.get("assign_to");
    
    let prodNumber = "production1";
    if (assignTo === "Riyaaz") prodNumber = "production2";
    if (assignTo === "Ramzaan") prodNumber = "production3";
    
    // Agar client specified hai to specific permission
    if (client === "Amar Equipment") {
      if (filter === "JOB_SERVICE") return `${prodNumber}.eqp.review.job.view`;
      if (filter === "TSO_SERVICE") return `${prodNumber}.eqp.review.tso.view`;
      if (filter === "KANBAN") return `${prodNumber}.eqp.review.kanban.view`;
      if (filter === "PO") return `${prodNumber}.eqp.review.po.view`;
      return `${prodNumber}.eqp.review.view`;
    }
    
    if (client === "Amar Biosystem") {
      if (filter === "JOB_SERVICE") return `${prodNumber}.bio.review.job.view`;
      if (filter === "TSO_SERVICE") return `${prodNumber}.bio.review.tso.view`;
      if (filter === "KANBAN") return `${prodNumber}.bio.review.kanban.view`;
      if (filter === "PO") return `${prodNumber}.bio.review.po.view`;
      return `${prodNumber}.bio.review.view`;
    }
    
    // Agar client specified nahi hai to array of permissions return karo
    return [
      `${prodNumber}.eqp.review.view`, `${prodNumber}.bio.review.view`,
      `${prodNumber}.eqp.review.job.view`, `${prodNumber}.bio.review.job.view`,
      `${prodNumber}.eqp.review.tso.view`, `${prodNumber}.bio.review.tso.view`,
      `${prodNumber}.eqp.review.kanban.view`, `${prodNumber}.bio.review.kanban.view`,
      `${prodNumber}.eqp.review.po.view`, `${prodNumber}.bio.review.po.view`,
      `${prodNumber}.eqp.review.welding.view`, `${prodNumber}.bio.review.welding.view`,
      `${prodNumber}.eqp.review.vendor.view`, `${prodNumber}.bio.review.vendor.view`
    ];
  }
  
  // ============================================
  // REVIEW WELDING ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/review/welding") {
    const client = searchParams.get("client");
    const assignTo = searchParams.get("assign_to");
    
    let prodNumber = "production1";
    if (assignTo === "Riyaaz") prodNumber = "production2";
    if (assignTo === "Ramzaan") prodNumber = "production3";
    
    if (client === "Amar Equipment") return `${prodNumber}.eqp.review.welding.view`;
    if (client === "Amar Biosystem") return `${prodNumber}.bio.review.welding.view`;
    return [`${prodNumber}.eqp.review.welding.view`, `${prodNumber}.bio.review.welding.view`];
  }
  
  // ============================================
  // REVIEW VENDOR ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/review/vendor") {
    const client = searchParams.get("client");
    const assignTo = searchParams.get("assign_to");
    
    let prodNumber = "production1";
    if (assignTo === "Riyaaz") prodNumber = "production2";
    if (assignTo === "Ramzaan") prodNumber = "production3";
    
    if (client === "Amar Equipment") return `${prodNumber}.eqp.review.vendor.view`;
    if (client === "Amar Biosystem") return `${prodNumber}.bio.review.vendor.view`;
    return [`${prodNumber}.eqp.review.vendor.view`, `${prodNumber}.bio.review.vendor.view`];
  }
  
  // ============================================
  // QC ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/qc" || pathname.startsWith("/qc/")) {
    const client = searchParams.get("client");
    const filter = searchParams.get("filter");
    
    if (client === "Amar Equipment") {
      if (filter === "JOB_SERVICE") return "qc.eqp.job.view";
      if (filter === "TSO_SERVICE") return "qc.eqp.tso.view";
      if (filter === "KANBAN") return "qc.eqp.kanban.view";
      if (filter === "PO") return "qc.eqp.po.view";
      return "qc.eqp.view";
    }
    
    if (client === "Amar Biosystem") {
      if (filter === "JOB_SERVICE") return "qc.bio.job.view";
      if (filter === "TSO_SERVICE") return "qc.bio.tso.view";
      if (filter === "KANBAN") return "qc.bio.kanban.view";
      if (filter === "PO") return "qc.bio.po.view";
      return "qc.bio.view";
    }
    
    return ["qc.eqp.view", "qc.bio.view", "qc.view"];
  }
  
  // ============================================
  // QC WELDING ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/qc/welding") {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "qc.eqp.welding.view";
    if (client === "Amar Biosystem") return "qc.bio.welding.view";
    return ["qc.eqp.welding.view", "qc.bio.welding.view", "qc.view"];
  }
  
  // ============================================
  // QC VENDOR ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/qc/vendor") {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "qc.eqp.vendor.view";
    if (client === "Amar Biosystem") return "qc.bio.vendor.view";
    return ["qc.eqp.vendor.view", "qc.bio.vendor.view", "qc.view"];
  }
  
  // ============================================
  // PP NOT-OK ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/section_production_planning/pp_not-ok" || pathname.startsWith("/section_production_planning/pp_not-ok/")) {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "pp.eqp.notok.view";
    if (client === "Amar Biosystem") return "pp.bio.notok.view";
    return ["pp.eqp.notok.view", "pp.bio.notok.view", "not-ok.view"];
  }
  
  // ============================================
  // WELDING OUTGOING ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/section_production_planning/welding/outgoing") {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "pp.eqp.welding.outgoing.view";
    if (client === "Amar Biosystem") return "pp.bio.welding.outgoing.view";
    return ["pp.eqp.welding.outgoing.view", "pp.bio.welding.outgoing.view", "welding.outgoing.view"];
  }
  
  // ============================================
  // PO SERVICES ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/section_production_planning/po-services") {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "pp.eqp.po.view";
    if (client === "Amar Biosystem") return "pp.bio.po.view";
    return ["pp.eqp.po.view", "pp.bio.po.view", "po.view"];
  }
  
  // ============================================
  // KANBAN APPROVE ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/section_inventory/kanban_approve" || pathname === "/section_production_planning/kanban_details") {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "pp.eqp.kanban.view";
    if (client === "Amar Biosystem") return "pp.bio.kanban.view";
    return ["pp.eqp.kanban.view", "pp.bio.kanban.view"];
  }
  
  // ============================================
  // TSO APPROVE ROUTES - WITH BOTH EQP AND BIO
  // ============================================
  if (pathname === "/section_inventory/tso_approve" || pathname === "/section_production_planning/tso_details") {
    const client = searchParams.get("client");
    if (client === "Amar Equipment") return "pp.eqp.tso.view";
    if (client === "Amar Biosystem") return "pp.bio.tso.view";
    return ["pp.eqp.tso.view", "pp.bio.tso.view"];
  }
  
  // Vendor Outgoing/Incoming routes
  if (pathname === "/section_production_planning/vendors/outgoing") {
    return "pp.vendor.outgoing.view";
  }
  if (pathname === "/section_production_planning/vendors/incoming") {
    return "pp.vendor.incoming.view";
  }
  
  // Exact match routes
  if (routePermissions[pathname] !== undefined) {
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
    "/review/welding",
    "/review/vendor",
    "/section_inventory/inventory_material_approve",
    "/section_production_planning/pp_not-ok",
    "/section_production_planning/welding/outgoing",
    "/section_production_planning/vendors/outsource",
    "/qc/welding",
    "/qc/vendor",
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
      // Allow QR and auth routes
      if (pathname === "/qrcode" || pathname === "/generateqrcode") {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check public routes
      if (isPublicRoute(pathname)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      const user = storage.getUser();
      const permissions = storage.getUserPermissions();

      // Check if user is logged in
      if (!user || !user.id) {
        console.log("❌ No user found, redirecting to login");
        router.push("/login");
        return;
      }

      // Check if user has ANY permissions
      if (!permissions || permissions.length === 0) {
        console.log("⚠️ User has no permissions, redirecting to /unauthorized");
        router.push("/unauthorized");
        return;
      }

      // Special handling for dashboard - redirect to first available module if no dashboard permission
      if (pathname === "/dashboard" && !hasPermission(permissions, "dashboard.view")) {
        console.log("❌ User doesn't have dashboard permission, finding alternative");
        const alternativePath = getFirstAvailableModulePath(permissions);
        if (alternativePath) {
          console.log(`🔄 Redirecting from dashboard to: ${alternativePath}`);
          router.push(alternativePath);
          return;
        } else {
          console.log("❌ No alternative found, redirecting to /unauthorized");
          router.push("/unauthorized");
          return;
        }
      }

      // Get required permission for the route
      const requiredPermission = getRequiredPermission(pathname, searchParams);
      
      console.log(`🔍 Checking route: ${pathname}, Required:`, requiredPermission);

      // If no permission required, allow access
      if (!requiredPermission) {
        console.log("✅ No permission required, granting access");
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user has the required permission
      let hasAccess = false;
      if (typeof requiredPermission === 'string') {
        hasAccess = hasPermission(permissions, requiredPermission);
        console.log(`  - Checking "${requiredPermission}": ${hasAccess}`);
      } else {
        hasAccess = hasAnyPermission(permissions, requiredPermission);
        console.log(`  - Checking any of [${requiredPermission.join(", ")}]: ${hasAccess}`);
      }

      if (!hasAccess) {
        console.log("❌ Access denied, redirecting to /unauthorized");
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