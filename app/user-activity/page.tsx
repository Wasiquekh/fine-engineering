"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { 
  FaEye, FaEyeSlash, FaUser, FaUserCog, FaUserTie
} from "react-icons/fa";
import { 
  MdOutlineRefresh, MdOutlineWork, MdOutlineAssignment,
  MdOutlineCategory, MdOutlineInventory, MdOutlineShoppingCart,
  MdOutlinePerson, MdOutlineBadge, MdOutlineBusinessCenter,
  MdOutlineQrCodeScanner, MdOutlineApproval, MdOutlineCancel
} from "react-icons/md";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { IoCloseOutline } from "react-icons/io5";
import { FiFilter } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import Select from "react-select";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface Activity {
  id: string;
  user_activity: string;
  uuid?: string;
  activity_timestamp: string;
  module: string;
  type: string;
  name?: string;
  user_name?: string;
  worker_name?: string;
  worker_id?: number | null;
  ip_address?: string;
  user_agent?: string;
  system_user_id?: string;
  entity_id?: string | null;
  entity_type?: string | null;
  old_values?: string | null;
  new_values?: string | null;
  metadata?: string | null;
}

interface User {
  uuid: string;
  name: string;
}

interface Worker {
  id: number;
  worker_name: string;
}

interface UserOption {
  value: string;
  label: string;
}

interface WorkerOption {
  value: number;
  label: string;
}

export default function UserActivityPage() {
  const router = useRouter();
  const isChecking = useAuthRedirect();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [workerOptions, setWorkerOptions] = useState<WorkerOption[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({});
  
  const [filterData, setFilterData] = useState({
    system_user_id: "",
    worker_id: "",
    userActivity: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    module: "",
    type: ""
  });

  const moduleOptions = [
    { value: "auth_login", label: "Authentication" },
    { value: "user_create", label: "User Management" },
    { value: "job_create", label: "Jobs" },
    { value: "job_update", label: "Job Updates" },
    { value: "job_assign", label: "Job Assignment" },
    { value: "job_approve", label: "Job Approval" },
    { value: "job_not_ok", label: "Job Not OK" },
    { value: "job_rework", label: "Job Rework" },
    { value: "job_dispatch", label: "Job Dispatch" },
    { value: "category_create", label: "Category" },
    { value: "assignment_create", label: "Assignment" },
    { value: "assignment_move", label: "Assignment Movement" },
    { value: "worker_login", label: "Worker" },
    { value: "worker_activity", label: "Worker Activity" },
    { value: "qc", label: "Quality Control" },
    { value: "qc_outgoing", label: "QC Outgoing" },
    { value: "qc_incoming", label: "QC Incoming" },
    { value: "vendor", label: "Vendor" },
    { value: "inventory", label: "Inventory" },
    { value: "moveto", label: "Movement" },
    { value: "notok", label: "Not OK" },
    { value: "rework", label: "Rework" },
  ];

  const typeOptions = [
    { value: "login_success", label: "Login Success" },
    { value: "login_failed", label: "Login Failed" },
    { value: "login_totp_required", label: "TOTP Required" },
    { value: "create", label: "Create" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "view", label: "View" },
    { value: "approve", label: "Approve" },
    { value: "reject", label: "Reject" },
    { value: "assign", label: "Assign" },
    { value: "move", label: "Move" },
    { value: "split", label: "Split" },
    { value: "not_ok", label: "Not OK" },
    { value: "rework", label: "Rework" },
    { value: "complete", label: "Complete" },
    { value: "dispatch", label: "Dispatch" },
    { value: "qc_outgoing", label: "QC Outgoing" },
    { value: "qc_incoming", label: "QC Incoming" },
    { value: "error", label: "Error" },
    { value: "list", label: "List" },
  ];

  // Fetch users for filter dropdown
  const fetchUserOptions = async () => {
    try {
      const res = await axiosProvider.get("/fineengg_erp/system/getallusername");
      if (res.data.success) {
        const users = res.data.data.users || [];
        const options = users.map((user: User) => ({
          value: user.uuid,
          label: user.name
        }));
        setUserOptions(options);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch workers for filter dropdown
  const fetchWorkerOptions = async () => {
    try {
      const res = await axiosProvider.get("/fineengg_erp/system/worker/workers");
      if (res.data.success) {
        const workers = res.data.data || [];
        const options = workers.map((worker: Worker) => ({
          value: worker.id,
          label: worker.worker_name
        }));
        setWorkerOptions(options);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  useEffect(() => {
    fetchUserOptions();
    // fetchWorkerOptions();
  }, []);

  useEffect(() => {
    if (Object.values(filterData).some(v => v !== "" && v !== null)) {
      fetchFilteredActivities();
    } else {
      fetchActivities();
    }
  }, [page, filterData]);

  // Fetch all activities
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await axiosProvider.get(`/fineengg_erp/system/getallactivites?page=${page}&limit=${limit}`);
      if (res.data.success) {
        setActivities(res.data.data.activities || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtered activities
  const fetchFilteredActivities = async () => {
    setLoading(true);
    try {
      const apiFilterData: any = {};
      
      if (filterData.system_user_id) apiFilterData.system_user_id = filterData.system_user_id;
      if (filterData.worker_id) apiFilterData.worker_id = filterData.worker_id;
      if (filterData.userActivity) apiFilterData.userActivity = filterData.userActivity;
      if (filterData.startDate) apiFilterData.startDate = format(filterData.startDate, "yyyy-MM-dd");
      if (filterData.endDate) apiFilterData.endDate = format(filterData.endDate, "yyyy-MM-dd");
      if (filterData.module) apiFilterData.module = filterData.module;
      if (filterData.type) apiFilterData.type = filterData.type;

      if (Object.keys(apiFilterData).length === 0) {
        fetchActivities();
        return;
      }

      const res = await axiosProvider.post(
        `/fineengg_erp/system/filteruseractivites?page=${page}&limit=${limit}`,
        apiFilterData
      );
      
      if (res.data.success) {
        setActivities(res.data.data.filteredActivities || []);
        setTotalPages(res.data.data.totalPages || 1);
        updateAppliedFilters(apiFilterData);
      }
    } catch (error) {
      console.error("Error filtering activities:", error);
      toast.error("Failed to filter activities");
    } finally {
      setLoading(false);
    }
  };

  // Update applied filters display
  const updateAppliedFilters = (filters: any) => {
    const filterStrings = [];
    if (filters.system_user_id) {
      const user = userOptions.find(u => u.value === filters.system_user_id);
      filterStrings.push(`User: ${user?.label || filters.system_user_id}`);
    }
    if (filters.worker_id) {
      const worker = workerOptions.find(w => w.value === parseInt(filters.worker_id));
      filterStrings.push(`Worker: ${worker?.label || filters.worker_id}`);
    }
    if (filters.userActivity) filterStrings.push(`Activity: ${filters.userActivity}`);
    if (filters.startDate) filterStrings.push(`From: ${filters.startDate}`);
    if (filters.endDate) filterStrings.push(`To: ${filters.endDate}`);
    if (filters.module) {
      const module = moduleOptions.find(m => m.value === filters.module);
      filterStrings.push(`Module: ${module?.label || filters.module}`);
    }
    if (filters.type) {
      const type = typeOptions.find(t => t.value === filters.type);
      filterStrings.push(`Type: ${type?.label || filters.type}`);
    }
    setAppliedFilters(filterStrings);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilterData(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleStartDateChange = (date: Date | null) => {
    setFilterData(prev => ({ ...prev, startDate: date }));
    setPage(1);
  };

  const handleEndDateChange = (date: Date | null) => {
    setFilterData(prev => ({ ...prev, endDate: date }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilterData({
      system_user_id: "",
      worker_id: "",
      userActivity: "",
      startDate: null,
      endDate: null,
      module: "",
      type: ""
    });
    setAppliedFilters([]);
    setPage(1);
  };

  const removeFilter = (filterToRemove: string) => {
    const filterKey = filterToRemove.split(':')[0].trim().toLowerCase();
    
    if (filterKey === 'user') setFilterData(prev => ({ ...prev, system_user_id: "" }));
    if (filterKey === 'worker') setFilterData(prev => ({ ...prev, worker_id: "" }));
    if (filterKey === 'activity') setFilterData(prev => ({ ...prev, userActivity: "" }));
    if (filterKey === 'from') setFilterData(prev => ({ ...prev, startDate: null }));
    if (filterKey === 'to') setFilterData(prev => ({ ...prev, endDate: null }));
    if (filterKey === 'module') setFilterData(prev => ({ ...prev, module: "" }));
    if (filterKey === 'type') setFilterData(prev => ({ ...prev, type: "" }));
    
    setAppliedFilters(prev => prev.filter(f => f !== filterToRemove));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActivityIcon = (type: string, module: string) => {
    if (type?.includes('login')) return '🔑';
    if (type?.includes('create')) return '➕';
    if (type?.includes('update')) return '✏️';
    if (type?.includes('delete')) return '🗑️';
    if (type?.includes('approve')) return '✅';
    if (type?.includes('reject')) return '❌';
    if (type?.includes('assign')) return '📋';
    if (type?.includes('move')) return '🔄';
    if (type?.includes('split')) return '✂️';
    if (type?.includes('not_ok')) return '⚠️';
    if (type?.includes('rework')) return '🔄';
    if (type?.includes('complete')) return '✅';
    if (type?.includes('dispatch')) return '🚚';
    if (type?.includes('qc_outgoing')) return '📤';
    if (type?.includes('qc_incoming')) return '📥';
    if (type?.includes('error')) return '❌';
    if (type?.includes('list')) return '📋';
    
    if (module?.includes('worker')) return '👷';
    if (module?.includes('job')) return '📦';
    if (module?.includes('category')) return '📁';
    if (module?.includes('assignment')) return '📋';
    if (module?.includes('vendor')) return '🏢';
    if (module?.includes('inventory')) return '📦';
    if (module?.includes('qc')) return '🔍';
    if (module?.includes('moveto')) return '🔄';
    if (module?.includes('notok')) return '⚠️';
    
    return '📝';
  };

  // Safely parse JSON
  const safeJsonParse = (jsonString: string | null): any => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  // Extract all possible job identifiers from metadata
  const extractJobIdentifier = (metadata: any): string | null => {
    if (!metadata) return null;
    
    // Check all possible job identifier fields
    return metadata.job_no || 
           metadata.tso_no || 
           metadata.jo_number || 
           metadata.joNo || 
           metadata.jo_no ||
           metadata.job_number ||
           (metadata.job_id ? `JOB-${metadata.job_id.substring(0, 8)}` : null) ||
           (metadata.entity_id && metadata.entity_type === 'job' ? `JOB-${metadata.entity_id.substring(0, 8)}` : null);
  };

  // Extract all possible quantity fields from metadata
  const extractQuantity = (metadata: any): number | null => {
    if (!metadata) return null;
    
    // Check all possible quantity fields
    return metadata.quantity || 
           metadata.qty || 
           metadata.quantity_no || 
           metadata.move_quantity || 
           metadata.moved_quantity || 
           metadata.outgoing_qty || 
           metadata.incoming_qty || 
           metadata.original_quantity ||
           metadata.assignment_quantity ||
           metadata.qc_quantity ||
           metadata.remaining_quantity ||
           null;
  };

  // Extract client name
  const extractClientName = (metadata: any): string | null => {
    if (!metadata) return null;
    return metadata.client_name || metadata.client || null;
  };

  // Extract item description
  const extractItemDescription = (metadata: any): string | null => {
    if (!metadata) return null;
    return metadata.item_description || metadata.description || null;
  };

  // Extract status changes
  const extractStatusChange = (metadata: any, oldValues: any, newValues: any): string | null => {
    if (oldValues?.status || newValues?.status) {
      return `${oldValues?.status || 'none'} → ${newValues?.status || 'none'}`;
    }
    if (metadata?.old_status && metadata?.new_status) {
      return `${metadata.old_status} → ${metadata.new_status}`;
    }
    if (metadata?.next_status) {
      return `→ ${metadata.next_status}`;
    }
    return null;
  };

  // Extract split operation details
  const extractSplitDetails = (metadata: any): { original: number; moved: number; remaining: number } | null => {
    if (metadata?.original_quantity && metadata?.moved_quantity) {
      return {
        original: metadata.original_quantity,
        moved: metadata.moved_quantity,
        remaining: metadata.remaining_quantity || (metadata.original_quantity - metadata.moved_quantity)
      };
    }
    return null;
  };

  // Extract QC details
  const extractQCDetails = (metadata: any): { date?: string; gatepass?: string; review?: string } | null => {
    if (metadata?.qc_date || metadata?.gatepass_no || metadata?.review_for) {
      return {
        date: metadata.qc_date,
        gatepass: metadata.gatepass_no,
        review: metadata.review_for
      };
    }
    return null;
  };

  // Extract changes from old_values and new_values
  const extractChanges = (oldValuesStr: string | null, newValuesStr: string | null): any[] => {
    const changes: any[] = [];
    
    const oldVals = safeJsonParse(oldValuesStr);
    const newVals = safeJsonParse(newValuesStr);
    
    if (!oldVals || !newVals) return changes;
    
    const allFields = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
    
    allFields.forEach(field => {
      const oldVal = oldVals[field];
      const newVal = newVals[field];
      
      if (oldVal === newVal) return;
      if (oldVal === undefined && newVal === undefined) return;
      
      changes.push({
        field,
        old: oldVal !== undefined ? oldVal : 'not set',
        new: newVal !== undefined ? newVal : 'not set'
      });
    });
    
    return changes;
  };

  // Format activity details into a readable paragraph
  const formatActivityDetails = (activity: Activity): string => {
    const metadata = safeJsonParse(activity.metadata);
    const oldVals = safeJsonParse(activity.old_values);
    const newVals = safeJsonParse(activity.new_values);
    
    const parts: string[] = [];
    
    // Extract job identifier
    const jobId = extractJobIdentifier(metadata);
    if (jobId) {
      parts.push(`📋 Job: ${jobId}`);
    }
    
    // Extract client name
    const clientName = extractClientName(metadata);
    if (clientName) {
      parts.push(`👤 Client: ${clientName}`);
    }
    
    // Extract item description
    const itemDesc = extractItemDescription(metadata);
    if (itemDesc) {
      parts.push(`📦 Item: ${itemDesc}`);
    }
    
    // Extract quantity
    const quantity = extractQuantity(metadata);
    if (quantity) {
      parts.push(`🔢 Qty: ${quantity}`);
    }
    
    // Extract split details
    const splitDetails = extractSplitDetails(metadata);
    if (splitDetails) {
      parts.push(`📊 Moved: ${splitDetails.moved}/${splitDetails.original}`);
      parts.push(`⏳ Remaining: ${splitDetails.remaining}`);
    }
    
    // Extract QC details
    const qcDetails = extractQCDetails(metadata);
    if (qcDetails) {
      if (qcDetails.date) parts.push(`📅 QC Date: ${new Date(qcDetails.date).toLocaleDateString()}`);
      if (qcDetails.gatepass) parts.push(`🎫 Gatepass: ${qcDetails.gatepass}`);
      if (qcDetails.review) parts.push(`🔍 Review: ${qcDetails.review}`);
    }
    
    // Extract status change
    const statusChange = extractStatusChange(metadata, oldVals, newVals);
    if (statusChange) {
      parts.push(`🔄 Status: ${statusChange}`);
    }
    
    // Extract other changes
    const changes = extractChanges(activity.old_values, activity.new_values);
    changes.forEach(change => {
      if (change.field === 'assign_to') {
        parts.push(`👤 Assigned: ${change.old || 'none'} → ${change.new || 'none'}`);
      } else if (change.field === 'worker_name') {
        parts.push(`👷 Worker: ${change.old || 'none'} → ${change.new || 'none'}`);
      } else if (change.field === 'vendor_name') {
        parts.push(`🏢 Vendor: ${change.old || 'none'} → ${change.new || 'none'}`);
      } else if (change.field === 'urgent') {
        parts.push(`⚠️ Urgent: ${change.old ? 'Yes' : 'No'} → ${change.new ? 'Yes' : 'No'}`);
      } else if (change.field === 'is_approved') {
        parts.push(`✅ Approved: ${change.old ? 'Yes' : 'No'} → ${change.new ? 'Yes' : 'No'}`);
      } else if (change.field === 'rejected') {
        parts.push(`❌ Rejected: ${change.old ? 'Yes' : 'No'} → ${change.new ? 'Yes' : 'No'}`);
      }
    });
    
    // Extract reason
    if (metadata?.reason) {
      parts.push(`📝 Reason: ${metadata.reason}`);
    }
    
    // Extract machine category
    if (metadata?.machine_category) {
      parts.push(`⚙️ Machine: ${metadata.machine_category}`);
    }
    
    // Extract vendor name
    if (metadata?.vendor_name) {
      parts.push(`🏢 Vendor: ${metadata.vendor_name}`);
    }
    
    // Extract serial number
    if (metadata?.serial_no) {
      parts.push(`🔢 Serial: ${metadata.serial_no}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No additional details';
  };

  const toggleMetadata = (activityId: string) => {
    setExpandedMetadata(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
    setPage(1);
    fetchFilteredActivities();
  };

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

          {/* Main Content */}
          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative mt-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-[#0A0A0A]">User & Worker Activity Logs</h1>
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E7E7E7] rounded-lg hover:bg-gray-50 transition"
                >
                  <MdOutlineRefresh />
                  <span>Clear Filters</span>
                </button>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  <FiFilter />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Applied Filters */}
            {appliedFilters.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {appliedFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    <span>{filter}</span>
                    <button
                      onClick={() => removeFilter(filter)}
                      className="hover:text-primary-900"
                    >
                      <RxCross2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Activities Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th className="p-3 border border-tableBorder">Activity & Details</th>
                    <th className="p-3 border border-tableBorder hidden md:table-cell">Actor</th>
                    <th className="p-3 border border-tableBorder hidden lg:table-cell">Timestamp</th>
                    <th className="p-3 border border-tableBorder hidden sm:table-cell">Module</th>
                    <th className="p-3 border border-tableBorder hidden sm:table-cell">Type</th>
                    <th className="p-3 border border-tableBorder">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No activities found
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => {
                      const actorName = activity.user_name || activity.worker_name || 'System';
                      const actorType = activity.worker_name ? 'Worker' : activity.user_name ? 'User' : 'System';
                      const details = formatActivityDetails(activity);
                      const isExpanded = expandedMetadata[activity.id];
                      
                      return (
                        <tr key={activity.id} className="border border-tableBorder hover:bg-primary-50">
                          <td className="p-3 border border-tableBorder">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start gap-3">
                                <span className="text-xl">{getActivityIcon(activity.type, activity.module)}</span>
                                <div>
                                  <p className="font-medium text-[#232323]">{activity.user_activity}</p>
                                  {details && (
                                    <div className="mt-2">
                                      <p className="text-sm text-primary-600 bg-primary-50 p-2 rounded-lg break-words">
                                        {details}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="md:hidden text-xs text-gray-500 mt-1">
                                <p>{actorType}: {actorName}</p>
                                <p>Time: {formatTimestamp(activity.activity_timestamp)}</p>
                                {activity.ip_address && <p>IP: {activity.ip_address}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border border-tableBorder hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.worker_name ? 'bg-orange-100' : 
                                activity.user_name ? 'bg-primary-100' : 'bg-gray-100'
                              }`}>
                                <span className={`font-medium ${
                                  activity.worker_name ? 'text-orange-700' : 
                                  activity.user_name ? 'text-primary-700' : 'text-gray-700'
                                }`}>
                                  {actorName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-[#232323]">{actorName}</p>
                                <p className="text-xs text-gray-500">{actorType}</p>
                                {activity.ip_address && (
                                  <p className="text-xs text-gray-500">IP: {activity.ip_address}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border border-tableBorder hidden lg:table-cell">
                            <p className="text-[#232323]">{formatTimestamp(activity.activity_timestamp)}</p>
                          </td>
                          <td className="p-3 border border-tableBorder hidden sm:table-cell">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {activity.module || '-'}
                            </span>
                          </td>
                          <td className="p-3 border border-tableBorder hidden sm:table-cell">
                            <span className={`px-2 py-1 rounded text-xs ${
                              activity.type?.includes('success') ? 'bg-green-100 text-green-700' :
                              activity.type?.includes('failed') || activity.type?.includes('error') ? 'bg-red-100 text-red-700' :
                              activity.type?.includes('not_ok') ? 'bg-orange-100 text-orange-700' :
                              activity.type?.includes('approve') ? 'bg-green-100 text-green-700' :
                              activity.type?.includes('reject') ? 'bg-red-100 text-red-700' :
                              activity.type?.includes('split') ? 'bg-purple-100 text-purple-700' :
                              activity.type?.includes('qc_outgoing') ? 'bg-blue-100 text-blue-700' :
                              activity.type?.includes('qc_incoming') ? 'bg-indigo-100 text-indigo-700' :
                              activity.type?.includes('move') ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {activity.type || '-'}
                            </span>
                          </td>
                          <td className="p-3 border border-tableBorder">
                            <button
                              onClick={() => toggleMetadata(activity.id)}
                              className="p-2 bg-primary-600 rounded hover:bg-primary-700 text-white transition"
                              title={isExpanded ? "Hide Details" : "View Details"}
                            >
                              {isExpanded ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-primary-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-primary-700 transition"
              >
                <HiChevronDoubleLeft size={20} />
              </button>
              <span className="text-[#717171]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-primary-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-primary-700 transition"
              >
                <HiChevronDoubleRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-[#E7E7E7]">
              <h2 className="text-xl font-bold text-[#0A0A0A]">Filter Activities</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-700">
                <IoCloseOutline size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {/* User Select */}
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">User</label>
                  <Select
                    value={userOptions.find(o => o.value === filterData.system_user_id)}
                    onChange={(option) => handleFilterChange('system_user_id', option?.value || '')}
                    options={userOptions}
                    placeholder="Select User"
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Worker Select */}
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Worker</label>
                  <Select
                    value={workerOptions.find(o => o.value === parseInt(filterData.worker_id))}
                    onChange={(option) => handleFilterChange('worker_id', option?.value?.toString() || '')}
                    options={workerOptions}
                    placeholder="Select Worker"
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Activity Search */}
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Activity Text</label>
                  <input
                    type="text"
                    value={filterData.userActivity}
                    onChange={(e) => handleFilterChange('userActivity', e.target.value)}
                    placeholder="Search in activity text..."
                    className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#0A0A0A] font-medium mb-2">Start Date</label>
                    <DatePicker
                      selected={filterData.startDate}
                      onChange={handleStartDateChange}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select start date"
                      className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-[#0A0A0A] font-medium mb-2">End Date</label>
                    <DatePicker
                      selected={filterData.endDate}
                      onChange={handleEndDateChange}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select end date"
                      className="w-full px-4 py-3 border border-[#E7E7E7] rounded-lg focus:outline-none focus:border-primary-600"
                      isClearable
                    />
                  </div>
                </div>

                {/* Module Select */}
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Module</label>
                  <Select
                    value={moduleOptions.find(o => o.value === filterData.module)}
                    onChange={(option) => handleFilterChange('module', option?.value || '')}
                    options={moduleOptions}
                    placeholder="Select Module"
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Type Select */}
                <div>
                  <label className="block text-[#0A0A0A] font-medium mb-2">Type</label>
                  <Select
                    value={typeOptions.find(o => o.value === filterData.type)}
                    onChange={(option) => handleFilterChange('type', option?.value || '')}
                    options={typeOptions}
                    placeholder="Select Type"
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E7E7E7]">
                <button
                  onClick={() => {
                    clearFilters();
                    setIsFilterOpen(false);
                  }}
                  className="px-6 py-2 border border-[#E7E7E7] rounded-lg text-[#0A0A0A] hover:bg-gray-50 transition"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}