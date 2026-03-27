// app/component/hooks/usePermission.ts
"use client";

import { useEffect, useState } from "react";
import StorageManager from "../../../provider/StorageManager";
import { hasPermission, hasAnyPermission } from "../utils/permissionUtils";

const storage = new StorageManager();

export const usePermission = (permissionName: string) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const permissions = storage.getUserPermissions();
    setHasAccess(hasPermission(permissions, permissionName));
    setLoading(false);
  }, [permissionName]);

  return { hasAccess, loading };
};

export const usePermissions = (permissionNames: string[]) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const permissions = storage.getUserPermissions();
    setHasAccess(hasAnyPermission(permissions, permissionNames));
    setLoading(false);
  }, [permissionNames]);

  return { hasAccess, loading };
};