"use client";

import { useState, useEffect, useRef } from "react";
import { FaSearch, FaChevronDown, FaCheck, FaTimes } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  level: number;
}

interface PermissionManagerProps {
  role: Role;
  onClose: () => void;
  onSave?: () => void;
}

export default function PermissionManager({ role, onClose, onSave }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all permissions
      const permsRes = await axiosProvider.get("/fineengg_erp/system/permissions");
      if (permsRes.data.success) {
        const permsData = permsRes.data.data || [];
        setPermissions(permsData);
        
        // Extract unique modules
        const moduleSet = new Set<string>();
        permsData.forEach((perm: Permission) => {
          const module = perm.name.split('.')[0];
          moduleSet.add(module);
        });
        setModules(Array.from(moduleSet).sort());
        
        // Initialize all modules as expanded
        const initialExpanded: Record<string, boolean> = {};
        Array.from(moduleSet).forEach(module => {
          initialExpanded[module] = true;
        });
        setExpandedModules(initialExpanded);
      }

      // Fetch role permissions
      const rolePermsRes = await axiosProvider.get(`/fineengg_erp/system/role-permissions?roleId=${role.id}`);
      if (rolePermsRes.data.success) {
        setRolePermissions(rolePermsRes.data.data.map((p: any) => p.permission_id));
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setRolePermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectModule = (moduleName: string, modulePermissions: Permission[]) => {
    const modulePermIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermIds.every(id => rolePermissions.includes(id));
    
    if (allSelected) {
      // Deselect all in module
      setRolePermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    } else {
      // Select all in module
      const newPermissions = [...new Set([...rolePermissions, ...modulePermIds])];
      setRolePermissions(newPermissions);
    }
  };

  const handleSelectAll = () => {
    const allPermIds = permissions.map(p => p.id);
    if (rolePermissions.length === permissions.length) {
      setRolePermissions([]);
    } else {
      setRolePermissions(allPermIds);
    }
  };

  const handleSelectAssigned = () => {
    // Filter search to show only assigned permissions
    if (rolePermissions.length > 0) {
      const assignedPerms = permissions.filter(p => rolePermissions.includes(p.id));
      const assignedNames = assignedPerms.map(p => p.name).join(' ');
      setSearchTerm(assignedNames);
      toast.info(`Showing ${assignedPerms.length} assigned permissions`);
    } else {
      toast.info("No assigned permissions found");
    }
  };

  const handleClearModule = () => {
    setRolePermissions([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosProvider.post("/fineengg_erp/system/assign-permissions", {
        roleId: role.id,
        permissionIds: rolePermissions
      });
      if (res.data.success) {
        toast.success("Permissions updated successfully");
        if (onSave) onSave();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(perm => 
    perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (perm.description && perm.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group permissions by module
  const permissionsByModule: Record<string, Permission[]> = {};
  filteredPermissions.forEach(perm => {
    const module = perm.name.split('.')[0];
    if (!permissionsByModule[module]) {
      permissionsByModule[module] = [];
    }
    permissionsByModule[module].push(perm);
  });

  // Sort modules
  const sortedModules = Object.keys(permissionsByModule).sort();

  // Calculate total selected
  const totalSelected = rolePermissions.length;

  // Check if all permissions in a module are selected
  const isModuleFullySelected = (modulePerms: Permission[]) => {
    return modulePerms.length > 0 && modulePerms.every(p => rolePermissions.includes(p.id));
  };

  // Check if some permissions in a module are selected
  const isModulePartiallySelected = (modulePerms: Permission[]) => {
    const selected = modulePerms.filter(p => rolePermissions.includes(p.id)).length;
    return selected > 0 && selected < modulePerms.length;
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <div>
            <h2 className="text-xl font-bold text-[#0A0A0A]">Permissions for: {role.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Role Level: {role.level}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Modules Section */}
        <div className="p-6 border-b border-[#E7E7E7] bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Modules</h3>
          <div className="flex flex-wrap gap-2">
            {modules.map(module => (
              <button
                key={module}
                onClick={() => toggleModule(module)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  expandedModules[module]
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-[#E7E7E7] text-[#0A0A0A] hover:bg-gray-50'
                }`}
              >
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-[#E7E7E7]">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAssigned}
                className="px-4 py-2 border border-[#E7E7E7] rounded-lg text-sm text-[#0A0A0A] hover:bg-gray-50 transition"
              >
                Select Assigned
              </button>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 border border-[#E7E7E7] rounded-lg text-sm text-[#0A0A0A] hover:bg-gray-50 transition"
              >
                Select All
              </button>
              <button
                onClick={handleClearModule}
                className="px-4 py-2 border border-[#E7E7E7] rounded-lg text-sm text-[#0A0A0A] hover:bg-gray-50 transition"
              >
                Clear Module
              </button>
            </div>
          </div>
        </div>

        {/* Permissions List */}
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading permissions...</p>
            </div>
          ) : sortedModules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No permissions found
            </div>
          ) : (
            sortedModules.map(module => {
              const modulePerms = permissionsByModule[module];
              const isExpanded = expandedModules[module] !== false;
              
              return (
                <div key={module} className="border-b border-[#E7E7E7] last:border-b-0">
                  {/* Module Header */}
                  <div 
                    onClick={() => toggleModule(module)}
                    className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <FaChevronDown 
                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                      <h3 className="font-semibold text-[#0A0A0A] capitalize">
                        {module} Permissions
                      </h3>
                      <span className="text-sm text-gray-500">
                        {modulePerms.filter(p => rolePermissions.includes(p.id)).length} / {modulePerms.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isModuleFullySelected(modulePerms)}
                          ref={input => {
                            if (input) {
                              input.indeterminate = isModulePartiallySelected(modulePerms);
                            }
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectModule(module, modulePerms);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Module Permissions */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {modulePerms.map((perm) => (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePermission(perm.id)}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                              rolePermissions.includes(perm.id)
                                ? 'bg-primary-100 border border-primary-600'
                                : 'bg-white border border-[#E7E7E7] hover:bg-gray-100'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                              rolePermissions.includes(perm.id)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200'
                            }`}>
                              {rolePermissions.includes(perm.id) && <FaCheck size={12} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#0A0A0A]">{perm.name}</p>
                              {perm.description && (
                                <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E7E7E7] bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              Total Selected: {totalSelected} permissions across all modules
            </span>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-[#E7E7E7] rounded-lg text-[#0A0A0A] hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}