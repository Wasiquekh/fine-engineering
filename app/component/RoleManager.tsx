"use client";

import { useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUserShield, FaBell } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import AxiosProvider from "../../provider/AxiosProvider";
import { sendRoleNotification } from "../services/pushNotificationApi";

const axiosProvider = new AxiosProvider();

interface Role {
  id: string;
  name: string;
  level: number;
}

interface RoleManagerProps {
  roles: Role[];
  onClose: () => void;
  onRoleUpdate: () => void;
  onPermissionClick: (role: Role) => void;
}

export default function RoleManager({ roles, onClose, onRoleUpdate, onPermissionClick }: RoleManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', level: '' });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter((role: Role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRole = async () => {
    if (!formData.name || !formData.level) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await axiosProvider.post("/system/createrole", {
        name: formData.name,
        level: parseInt(formData.level)
      });
      if (res.data.success) {
        toast.success("Role created successfully");
        setShowAddForm(false);
        setFormData({ name: '', level: '' });
        onRoleUpdate();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to create role");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
  
    try {
      // ✅ CORRECT: Use PUT method with /system/roles/:id
      const res = await axiosProvider.put(`/system/roles/${editingRole.id}`, {
        name: editingRole.name,
        level: editingRole.level
      });
      if (res.data.success) {
        toast.success("Role updated successfully");
        setEditingRole(null);
        onRoleUpdate();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to update role");
    }
  };

  const handleDeleteRole = async (role: any) => {
    const result = await Swal.fire({
      title: "Delete Role",
      text: `Are you sure you want to delete ${role.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });
  
    if (result.isConfirmed) {
      try {
        // ✅ CORRECT: Use DELETE method with /system/roles/:id
        const res = await axiosProvider.delete(`/system/roles/${role.id}`);
        if (res.data.success) {
          toast.success("Role deleted successfully");
          onRoleUpdate();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.msg || "Failed to delete role");
      }
    }
  };

  const handleSendPushToRole = async (role: Role) => {
    const result = await Swal.fire({
      title: `Send push notification`,
      html: `
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left;">
          <label style="font-weight:600;">Role</label>
          <input id="push_role_name" class="swal2-input" value="${role.name}" readonly />
          <label style="font-weight:600;">Title</label>
          <input id="push_title" class="swal2-input" placeholder="Enter notification title" />
          <label style="font-weight:600;">Message</label>
          <textarea id="push_body" class="swal2-textarea" placeholder="Enter notification message"></textarea>
          <label style="font-weight:600;">Route (optional)</label>
          <input id="push_route" class="swal2-input" placeholder="/dashboard" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Send",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const title = (document.getElementById("push_title") as HTMLInputElement)?.value?.trim();
        const body = (document.getElementById("push_body") as HTMLTextAreaElement)?.value?.trim();
        const route = (document.getElementById("push_route") as HTMLInputElement)?.value?.trim();

        if (!title) {
          Swal.showValidationMessage("Please enter notification title");
          return;
        }
        if (!body) {
          Swal.showValidationMessage("Please enter notification message");
          return;
        }

        return { title, body, route };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      await sendRoleNotification({
        roles: [role.name],
        title: result.value.title,
        body: result.value.body,
        route: result.value.route || undefined,
        source: "role_manager_manual_push",
        type: "role_alert",
        sendAll: false,
        userTypes: ["system"],
      });
      toast.success(`Push notification sent to ${role.name}`);
    } catch (error) {
      toast.error("Failed to send push notification");
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <h2 className="text-xl font-bold text-[#0A0A0A]">Manage Roles</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Search and Add */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <FaPlus /> Add New Role
            </button>
          </div>

          {/* Add Role Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-3">Add New Role</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Role Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                />
                <input
                  type="number"
                  placeholder="Role Level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRole}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ name: '', level: '' });
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Roles List */}
          <div className="space-y-3">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No roles found
              </div>
            ) : (
              filteredRoles.map((role: Role) => (
                <div key={role.id} className="border border-[#E7E7E7] rounded-lg p-4 hover:shadow-md transition">
                  {editingRole?.id === role.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingRole.name}
                        onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                        className="w-full px-4 py-2 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                      />
                      <input
                        type="number"
                        value={editingRole.level}
                        onChange={(e) => setEditingRole({ ...editingRole, level: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateRole}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#0A0A0A]">{role.name}</p>
                        <p className="text-sm text-gray-500">Level: {role.level}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendPushToRole(role)}
                          className="p-2 bg-violet-600 rounded hover:bg-violet-700 text-white transition"
                          title="Send Push Notification"
                        >
                          <FaBell size={16} />
                        </button>
                        <button
                          onClick={() => onPermissionClick(role)}
                          className="p-2 bg-purple-600 rounded hover:bg-purple-700 text-white transition"
                          title="Manage Permissions"
                        >
                          <FaUserShield size={16} />
                        </button>
                        <button
                          onClick={() => setEditingRole(role)}
                          className="p-2 bg-blue-600 rounded hover:bg-blue-700 text-white transition"
                          title="Edit Role"
                        >
                          <FaEdit size={16} />
                        </button>
                        {role.name !== "Admin" && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-2 bg-red-600 rounded hover:bg-red-700 text-white transition"
                            title="Delete Role"
                          >
                            <FaTrash size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}