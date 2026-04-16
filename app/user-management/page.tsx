"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { 
  FaPlus, FaEdit, FaTrash, FaLock, FaUnlock, 
  FaUserShield, FaKey, FaSave, FaTimes, FaSearch,
  FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash
} from "react-icons/fa";
import { 
  MdOutlineEmail, MdOutlinePhone, MdOutlinePerson, 
  MdOutlineSecurity, MdOutlineAdminPanelSettings,
  MdOutlineRefresh, MdOutlineFilterList
} from "react-icons/md";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { IoCloseOutline } from "react-icons/io5";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import PageGuard from "../component/PageGuard";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface User {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
  role: string;
  role_level: number;
  created_at: string;
  status?: 'active' | 'blocked';
}

interface Role {
  id: string;
  name: string;
  level: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const isChecking = useAuthRedirect();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false);
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, [page]);

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosProvider.get(`/fineengg_erp/system/getalluser?page=${page}&limit=${limit}`);
      if (res.data.success) {
        setUsers(res.data.data.users || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axiosProvider.get("/fineengg_erp/system/roles");
      if (res.data.success) {
        setRoles(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axiosProvider.get("/fineengg_erp/system/permissions");
      if (res.data.success) {
        setPermissions(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const res = await axiosProvider.get(`/fineengg_erp/system/role-permissions?roleId=${roleId}`);
      if (res.data.success) {
        setRolePermissions(res.data.data.map((p: any) => p.permission_id));
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    const result = await Swal.fire({
      title: "Delete User",
      text: `Are you sure you want to delete ${user.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await axiosProvider.post("/fineengg_erp/system/deleteuser", { id: user.id });
        if (res.data.success) {
          toast.success("User deleted successfully");
          fetchUsers();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.msg || "Failed to delete user");
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleAddUser = async (values: any) => {
    try {
      const selectedRole = roles.find(r => r.level === Number(values.roleLevel));
      
      const payload = {
        name: values.name,
        email: values.email,
        mobile_number: values.mobile_number,
        password: values.password,
        roleLevel: Number(values.roleLevel),
        roleName: selectedRole?.name
      };
      
      const res = await axiosProvider.post("/fineengg_erp/system/register", payload);
      
      if (res.data.success) {
        toast.success("User created successfully");
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error:", error.response?.data);
      toast.error(error.response?.data?.msg || "Failed to create user");
    }
  };

  // ✅ UPDATED: Edit user WITHOUT current password
  const handleEditUser = async (values: any) => {
    try {
      const payload: any = {
        id: selectedUser?.id,
        name: values.name,
        email: values.email,
        mobile_number: values.mobile_number,
      };
      
      // Only include password if provided (NO current_password needed)
      if (values.password && values.password.trim() !== '') {
        payload.password = values.password;
      }
      
      const res = await axiosProvider.post("/fineengg_erp/system/updateuser", payload);
      if (res.data.success) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.msg || "Failed to update user";
      toast.error(errorMsg);
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedRoleForPermission) return;
    
    try {
      const res = await axiosProvider.post("/fineengg_erp/system/assign-permissions", {
        roleId: selectedRoleForPermission.id,
        permissionIds: rolePermissions
      });
      if (res.data.success) {
        toast.success("Permissions assigned successfully");
        setShowRolePermissionModal(false);
        setSelectedRoleForPermission(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to assign permissions");
    }
  };

  // ✅ UPDATED: Validation schema for create user
  const userValidationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    mobile_number: Yup.string()
      .matches(/^\+91\d{10}$/, "Must be in format +91XXXXXXXXXX")
      .required("Mobile number is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    roleLevel: Yup.number()
      .required("Role is required")
      .typeError("Role must be a number")
      .positive("Invalid role"),
  });

  // ✅ UPDATED: Validation schema for edit user - NO current_password required
  const editUserValidationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    mobile_number: Yup.string()
      .matches(/^\+91\d{10}$/, "Must be in format +91XXXXXXXXXX")
      .required("Mobile number is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    roleLevel: Yup.number()
      .required("Role is required")
      .typeError("Role must be a number")
      .positive("Invalid role"),
  });

  if (isChecking) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center">
        <Image
          src="/images/fine-engineering-icon.png"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end min-h-screen bg-[#F5F7FA]">
        <LeftSideBar />
        <PageGuard requiredPermission="usermanagement.view">
        <div className="w-full md:w-[83%] min-h-screen p-4 relative">
          <div className="absolute bottom-0 right-0">
            <Image
              src="/images/sideDesign.svg"
              alt="side design"
              width={100}
              height={100}
              className="w-full h-full"
            />
          </div>

          <DesktopHeader />

          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative mt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-[#0A0A0A]">User Management</h1>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <MdOutlineAdminPanelSettings />
                  <span>Manage Roles</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  <FaPlus />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name, email or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th className="p-3 border border-tableBorder">User</th>
                    <th className="p-3 border border-tableBorder hidden md:table-cell">Contact</th>
                    <th className="p-3 border border-tableBorder">Role</th>
                    <th className="p-3 border border-tableBorder hidden lg:table-cell">Status</th>
                    <th className="p-3 border border-tableBorder">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border border-tableBorder hover:bg-primary-50">
                        <td className="p-3 border border-tableBorder">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                              <span className="text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-[#232323]">{user.name}</p>
                              <p className="text-sm text-gray-500 md:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border border-tableBorder hidden md:table-cell">
                          <p className="text-[#232323]">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.mobile_number}</p>
                        </td>
                        <td className="p-3 border border-tableBorder">
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 border border-tableBorder hidden lg:table-cell">
                          <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="p-3 border border-tableBorder">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditModal(true);
                              }}
                              className="p-2 bg-blue-600 rounded hover:bg-blue-700 text-white transition"
                              title="Edit User"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const role = roles.find(r => r.name === user.role);
                                if (role) {
                                  setSelectedRoleForPermission(role);
                                  fetchRolePermissions(role.id);
                                  setShowRolePermissionModal(true);
                                }
                              }}
                              className="p-2 bg-purple-600 rounded hover:bg-purple-700 text-white transition"
                              title="Manage Permissions"
                            >
                              <FaUserShield size={16} />
                            </button>
                            {user.role !== "Admin" && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 bg-red-600 rounded hover:bg-red-700 text-white transition"
                                title="Delete User"
                              >
                                <FaTrash size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 bg-primary-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-primary-700 transition"
              >
                <HiChevronDoubleLeft size={20} />
              </button>
              <span className="text-[#717171]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 bg-primary-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-primary-700 transition"
              >
                <HiChevronDoubleRight size={20} />
              </button>
            </div>
          </div>
        </div>
        </PageGuard>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <UserFormModal
          title="Add New User"
          roles={roles}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
          validationSchema={userValidationSchema}
          isEdit={false}
        />
      )}

      {/* Edit User Modal - WITHOUT current password */}
      {showEditModal && selectedUser && (
        <UserFormModal
          title="Edit User"
          user={selectedUser}
          roles={roles}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
          validationSchema={editUserValidationSchema}
          isEdit={true}
        />
      )}

      {/* Role Management Modal */}
      {showRoleModal && (
        <RoleManager
          roles={roles}
          permissions={permissions}
          onClose={() => setShowRoleModal(false)}
          onRoleUpdate={fetchRoles}
          onPermissionClick={(role) => {
            setSelectedRoleForPermission(role);
            fetchRolePermissions(role.id);
            setShowRolePermissionModal(true);
          }}
        />
      )}

      {/* Role Permission Modal */}
      {showRolePermissionModal && selectedRoleForPermission && (
        <RolePermissionModal
          role={selectedRoleForPermission}
          permissions={permissions}
          assignedPermissions={rolePermissions}
          onClose={() => {
            setShowRolePermissionModal(false);
            setSelectedRoleForPermission(null);
            setRolePermissions([]);
          }}
          onAssign={handleAssignPermissions}
          onPermissionToggle={(permissionId) => {
            setRolePermissions(prev =>
              prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
            );
          }}
        />
      )}
    </>
  );
}

// ==================== PASSWORD INPUT WITH VISIBILITY TOGGLE ====================
const PasswordInput = ({ name, label, placeholder, isRequired = false, className = "" }: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      <label className="block text-[#0A0A0A] font-medium mb-2">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Field
          type={showPassword ? "text" : "password"}
          name={name}
          className="w-full px-4 py-3 pr-12 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
        >
          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
        </button>
      </div>
      <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
    </div>
  );
};

// ==================== USER FORM MODAL COMPONENT (UPDATED) ====================
const UserFormModal = ({ title, user, roles, onClose, onSubmit, validationSchema, isEdit = false }: any) => {
  const initialValues = user ? {
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    password: '',
    roleLevel: user.role_level || ''
  } : {
    name: '',
    email: '',
    mobile_number: '',
    password: '',
    roleLevel: ''
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const submitValues: any = {
        id: user?.id,
        name: values.name,
        email: values.email,
        mobile_number: values.mobile_number,
        roleLevel: values.roleLevel ? Number(values.roleLevel) : undefined
      };
      
      if (isEdit) {
        // Only include password if provided (NO current_password)
        if (values.password && values.password.trim() !== '') {
          submitValues.password = values.password;
        }
      } else {
        submitValues.password = values.password;
      }
      
      await onSubmit(submitValues);
    } catch (error: any) {
      console.error("Submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <h2 className="text-xl font-bold text-[#0A0A0A]">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Full Name *</label>
                  <Field
                    type="text"
                    name="name"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Enter full name"
                  />
                  <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Email *</label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Enter email"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Mobile Number *</label>
                  <Field
                    type="text"
                    name="mobile_number"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="+91XXXXXXXXXX"
                  />
                  <ErrorMessage name="mobile_number" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Password Section for Edit Mode - Only New Password */}
                {isEdit && (
                  <div className="border-t border-[#E7E7E7] pt-4 mt-2">
                    <div className="mb-3">
                      <label className="block text-[#0A0A0A] font-medium mb-2 text-sm text-gray-600">
                        Change Password (Optional)
                      </label>
                      <p className="text-xs text-gray-400">Leave blank to keep current password</p>
                    </div>
                    
                    <PasswordInput
                      name="password"
                      label="New Password"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                )}

                {/* Password Field for Create Mode */}
                {!isEdit && (
                  <PasswordInput
                    name="password"
                    label="Password"
                    placeholder="Enter password (min 6 characters)"
                    isRequired={true}
                  />
                )}

                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Role *</label>
                  <Field
                    as="select"
                    name="roleLevel"
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      setFieldValue('roleLevel', value ? Number(value) : '');
                    }}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role: any) => (
                      <option key={role.id} value={role.level}>
                        {role.name} (Level {role.level})
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="roleLevel" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-[#E7E7E7] rounded-lg text-[#0A0A0A] hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

// ==================== ROLE MANAGER COMPONENT ====================
const RoleManager = ({ roles, onClose, onRoleUpdate, onPermissionClick }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', level: '' });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter((role: any) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRole = async () => {
    if (!formData.name || !formData.level) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await axiosProvider.post("/fineengg_erp/system/createrole", {
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
      const res = await axiosProvider.put(`/fineengg_erp/system/roles/${editingRole.id}`, {
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
        const res = await axiosProvider.delete(`/fineengg_erp/system/roles/${role.id}`);
        if (res.data.success) {
          toast.success(`Role "${role.name}" deleted successfully`);
          onRoleUpdate();
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.msg || "Failed to delete role";
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <h2 className="text-xl font-bold text-[#0A0A0A]">Manage Roles</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="p-6">
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

          <div className="space-y-3">
            {filteredRoles.map((role: any) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ROLE PERMISSION MODAL ====================
const RolePermissionModal = ({ role, permissions, assignedPermissions, onClose, onAssign, onPermissionToggle }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  const modules = Array.from(new Set(
    permissions.map((p: any) => p.name.split('.')[0])
  )).sort();

  const filteredPermissions = permissions.filter((perm: any) => {
    const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perm.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const module = perm.name.split('.')[0];
    const matchesModule = selectedModule === "all" || module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const permissionsByModule: any = {};
  filteredPermissions.forEach((perm: any) => {
    const module = perm.name.split('.')[0];
    if (!permissionsByModule[module]) {
      permissionsByModule[module] = [];
    }
    permissionsByModule[module].push(perm);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
          <div>
            <h2 className="text-xl font-bold text-[#0A0A0A]">Manage Permissions</h2>
            <p className="text-sm text-gray-500 mt-1">Role: {role.name} (Level {role.level})</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-4 py-2 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
            >
              <option value="all">All Modules</option>
              {modules.map((module: string) => (
                <option key={module} value={module}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-y-auto max-h-[400px] space-y-4">
            {Object.entries(permissionsByModule).map(([module, perms]: [string, any]) => (
              <div key={module} className="border border-[#E7E7E7] rounded-lg p-4">
                <h3 className="font-semibold text-primary-600 mb-3 capitalize">{module}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perms.map((perm: any) => (
                    <div
                      key={perm.id}
                      onClick={() => onPermissionToggle(perm.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                        assignedPermissions.includes(perm.id)
                          ? 'bg-primary-100 border border-primary-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        assignedPermissions.includes(perm.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-300'
                      }`}>
                        {assignedPermissions.includes(perm.id) && <span>✓</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0A0A0A]">{perm.name}</p>
                        {perm.description && (
                          <p className="text-xs text-gray-500">{perm.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E7E7E7]">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-[#E7E7E7] rounded-lg text-[#0A0A0A] hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onAssign}
              className="px-6 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 transition"
            >
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};