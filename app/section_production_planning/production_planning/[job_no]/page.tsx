"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Image from "next/image";
import { FaChevronDown, FaBan } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";
import { IoCloseOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import StorageManager from "../../../../provider/StorageManager";
import { sendRoleNotificationByEvent } from "../../../services/pushNotificationApi";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

const hasAnyPermission = (permissions: any[] | null, permissionNames: string[]): boolean => {
  if (!permissions) return false;
  return permissionNames.some(name => permissions.some(p => p.name === name));
};

interface JobDetail {
  id: string;
  job_no: string;
  jo_number: string;
  job_type: string;
  job_category: string;
  item_description: string;
  item_no: number;
  serial_no: string;
  qty: number;
  moc: string;
  bin_location: string;
  urgent: boolean;
  assign_to?: string;
  assign_date?: string;
  product_desc?: string;
  product_qty?: number;
  is_rejected?: boolean | number;
  rejected?: boolean | number;
  status?: string;
}

interface CategoryDetail {
  id: string;
  job_category: string;
  job_no: string;
  description: string;
  material_type: string;
  bar: string;
  tempp: string;
  qty: string;
  remark: string;
  client_name: string;
  drawing_recieved_date: string;
  urgent_due_date: string | null;
  is_urgent: boolean;
}

interface PendingMaterial {
  id: string;
  job_no: string;
  jo_number?: string;
  item_no: number;
  size: string;
  moc: string;
  qty: number;
  description: string;
  status?: string;
  is_completed: boolean;
}

type PendingEditForm = {
  description: string;
  size: string;
  moc: string;
  qty: string;
};

export default function JobDetailsPage() {
  const [pendingData, setPendingData] = useState<PendingMaterial[]>([]);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [savingPendingEdit, setSavingPendingEdit] = useState(false);
  const [deletingPendingId, setDeletingPendingId] = useState<string | null>(null);
  const [editingPendingForm, setEditingPendingForm] = useState<PendingEditForm>({
    description: "",
    size: "",
    moc: "",
    qty: "",
  });
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [joNumberSearch, setJoNumberSearch] = useState("");
  const [currentJoPage, setCurrentJoPage] = useState(1);
  const joPageSize = 10;
  const [assignments, setAssignments] = useState<{
    [key: string]: { assignTo: string; otherName: string; assignDate: string };
  }>({});
  const [expandedJoNumbers, setExpandedJoNumbers] = useState<string[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const pendingNotificationSentRef = useRef<string>("");
  const params = useParams();
  const router = useRouter();
  const job_no = params.job_no ? decodeURIComponent(params.job_no as string) : "";

  const permissions = storage.getUserPermissions();
  const currentUserName = storage.getUserName() || storage.getUserEmail() || "";
  
  // Edit permission for actions (assign, reject, qc) - Backend se aayega
  const canEdit = hasAnyPermission(permissions, [
    "pp.eqp.job.edit", "pp.eqp.tso.edit", "pp.eqp.kanban.edit",
    "pp.bio.job.edit", "pp.bio.tso.edit", "pp.bio.kanban.edit"
  ]);

  const groupedJobDetails = useMemo(() => {
    return jobDetails.reduce((acc, job) => {
      const key = job.jo_number || 'N/A';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(job);
      return acc;
    }, {} as Record<string, JobDetail[]>);
  }, [jobDetails]);

  const filteredGroupedJobEntries = useMemo(() => {
    const searchText = joNumberSearch.trim().toLowerCase();
    const entries = Object.entries(groupedJobDetails);
    if (!searchText) return entries;
    return entries.filter(([joNumber]) => joNumber.toLowerCase().includes(searchText));
  }, [groupedJobDetails, joNumberSearch]);

  const totalJoPages = Math.max(1, Math.ceil(filteredGroupedJobEntries.length / joPageSize));
  const paginatedGroupedJobEntries = useMemo(() => {
    const startIndex = (currentJoPage - 1) * joPageSize;
    return filteredGroupedJobEntries.slice(startIndex, startIndex + joPageSize);
  }, [filteredGroupedJobEntries, currentJoPage]);

  const editingPendingItem = useMemo(
    () => pendingData.find((item) => item.id === editingPendingId) || null,
    [pendingData, editingPendingId]
  );

  const toggleJoNumberExpansion = (joNumber: string) => {
    setExpandedJoNumbers((prev) =>
      prev.includes(joNumber)
        ? prev.filter((n) => n !== joNumber)
        : [...prev, joNumber]
    );
  };

  const isJobSelectable = (job: JobDetail) => {
    const isRejected = job.is_rejected || job.rejected;
    const isProcessed = job.status === "completed" || job.status === "QC" || job.qty === 0;
    return !job.assign_to && !isRejected && !isProcessed;
  };

  const toggleSingleJobSelection = (job: JobDetail) => {
    if (!isJobSelectable(job)) return;
    setSelectedJobIds((prev) =>
      prev.includes(job.id) ? prev.filter((id) => id !== job.id) : [...prev, job.id]
    );
  };

  const toggleJoGroupSelection = (joNumber: string, jobs: JobDetail[]) => {
    const groupIds = jobs.filter(isJobSelectable).map((job) => job.id);
    const uniqueGroupIds = Array.from(new Set(groupIds));
    if (uniqueGroupIds.length === 0) return;
    const allSelected = uniqueGroupIds.every((id) => selectedJobIds.includes(id));

    setSelectedJobIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !uniqueGroupIds.includes(id));
      }
      return Array.from(new Set([...prev, ...uniqueGroupIds]));
    });

    if (!allSelected) {
      setExpandedJoNumbers((prev) =>
        prev.includes(joNumber) ? prev : [...prev, joNumber]
      );
    }
  };

  useEffect(() => {
    setCurrentJoPage(1);
    setExpandedJoNumbers([]);
  }, [joNumberSearch]);

  useEffect(() => {
    if (currentJoPage > totalJoPages) {
      setCurrentJoPage(totalJoPages);
    }
  }, [currentJoPage, totalJoPages]);

  useEffect(() => {
    if (job_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const normalizedJobNo = decodeURIComponent(String(job_no || "")).trim().toLowerCase();
          const [jobsResponse, pendingResponse, categoriesResponse] = await Promise.all([
            axiosProvider.get(`/fineengg_erp/system/jobs?job_no=${encodeURIComponent(job_no)}`),
            axiosProvider.get(`/fineengg_erp/system/pending-materials?job_no=${encodeURIComponent(job_no)}`),
            axiosProvider.get(`/fineengg_erp/system/categories?job_no=${encodeURIComponent(job_no)}`),
          ]);

          if (jobsResponse.data && Array.isArray(jobsResponse.data.data)) {
            const fetchedJobs = jobsResponse.data.data;
            setJobDetails(fetchedJobs);

            const joCounts = fetchedJobs.reduce((acc: Record<string, number>, job: JobDetail) => {
              const key = job.jo_number || "N/A";
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});

            const initialAssignments: { [key: string]: { assignTo: string; otherName: string; assignDate: string } } = {};
            fetchedJobs.forEach((job: JobDetail) => {
              const joKey = job.jo_number || "N/A";
              const isSingleRowJo = (joCounts[joKey] || 0) === 1;

              // For grouped JO headers, keep parent dropdown empty ("Select") instead of prefilled assignee.
              if (job.assign_to && isSingleRowJo) {
                const isStandard = ["Usmaan", "Ashfaq", "Ramzaan", "Riyaaz"].includes(job.assign_to);
                initialAssignments[job.id] = {
                  assignTo: isStandard ? job.assign_to : "Others",
                  otherName: isStandard ? "" : job.assign_to,
                  assignDate: job.assign_date ? job.assign_date.replace(/\//g, "-") : "",
                };
              }
            });
            setAssignments(initialAssignments);
          } else {
            setJobDetails([]);
          }

          if (pendingResponse.data && Array.isArray(pendingResponse.data.data)) {
            setPendingData(pendingResponse.data.data);
          } else {
            setPendingData([]);
          }

          if (categoriesResponse.data && Array.isArray(categoriesResponse.data.data)) {
            const allCategories = categoriesResponse.data.data;
            const filteredCategories = allCategories.filter((cat: CategoryDetail) => {
              const categoryJobNo = decodeURIComponent(String(cat.job_no || "")).trim().toLowerCase();
              return categoryJobNo === normalizedJobNo;
            });
            setCategoryDetails(filteredCategories);
          } else {
            setCategoryDetails([]);
          }
        } catch (error) {
          console.error("Error fetching data for job:", error);
          toast.error("Failed to load data for this job.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [job_no]);

  useEffect(() => {
    if (!job_no) return;
    const hasPending = pendingData.some((item) => !item.is_completed);
    if (!hasPending) return;

    // Avoid sending duplicate alerts for same job in same browser session.
    if (pendingNotificationSentRef.current === String(job_no)) return;
    pendingNotificationSentRef.current = String(job_no);

    const clientNameFromData = categoryDetails[0]?.client_name || "";
    sendRoleNotificationByEvent({
      eventKey: "material_required",
      joNo: String(job_no),
      jobNo: String(job_no),
      clientName: clientNameFromData,
      assignedBy: currentUserName,
      source: "production_planning_pending_material",
      sendAll: false,
    });
  }, [pendingData, job_no, categoryDetails]);

  const handleAssignmentChange = (id: string, field: string, value: string) => {
    if (!canEdit) return;
    setAssignments((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { assignTo: "", otherName: "", assignDate: "" }),
        [field]: value,
      },
    }));
  };

  const handleAssign = async (sourceId: string) => {
    if (!canEdit) return;
    const assignment = assignments[sourceId];
    const uniqueSelectedIds = Array.from(new Set(selectedJobIds));

    if (uniqueSelectedIds.length === 0) {
      toast.error("Please select at least one checkbox");
      return;
    }

    if (!assignment?.assignTo) {
      toast.error("Please select who to assign to");
      return;
    }

    if (assignment.assignTo === "Others" && !assignment.otherName) {
      toast.error("Please enter the name");
      return;
    }

    if (!assignment.assignDate) {
      toast.error("Please select a date");
      return;
    }

    const assignToName = assignment.assignTo === "Others" ? assignment.otherName : assignment.assignTo;
    const formattedDate = assignment.assignDate;
    const updatedBy = storage.getUserId();

    try {
      const payload: Record<string, any> = {
        assign_to: assignToName,
        assign_date: formattedDate,
      };
      if (uniqueSelectedIds.length === 1) {
        payload.id = uniqueSelectedIds[0];
      } else {
        payload.ids = uniqueSelectedIds;
      }
      if (updatedBy) payload.updated_by = updatedBy;

      const response = await axiosProvider.post(`/fineengg_erp/system/jobs/assign`, payload);
      const updatedIds: string[] = response?.data?.updated_ids || [];
      const notFoundIds: string[] = response?.data?.not_found_ids || [];

      if (updatedIds.length > 0) {
        toast.success(`Job assigned successfully (${updatedIds.length})`);
      } else {
        toast.success("Job assigned successfully");
      }
      if (notFoundIds.length > 0) {
        toast.warn(`${notFoundIds.length} selected job(s) were not found`);
      }

      const notifiedIds = updatedIds.length > 0 ? updatedIds : uniqueSelectedIds;
      notifiedIds.forEach((jobId) => {
        const assignedJob = jobDetails.find((job) => job.id === jobId);
        if (!assignedJob) return;
        sendRoleNotificationByEvent({
          eventKey: "assignment_created",
          joNo: String(assignedJob.jo_number || ""),
          joNumber: String(assignedJob.jo_number || ""),
          jobNo: String(assignedJob.job_no || ""),
          workerName: assignToName,
          assignedBy: currentUserName,
          clientName: categoryDetails[0]?.client_name || "",
          notifyAssignee: true,
          source: "production_planning_assign",
          sendAll: false,
        });
      });

      setJobDetails((prev) =>
        prev.map((job) =>
          (updatedIds.length > 0 ? updatedIds.includes(job.id) : uniqueSelectedIds.includes(job.id))
            ? { ...job, assign_to: assignToName, assign_date: formattedDate }
            : job
        )
      );
      if (updatedIds.length > 0) {
        setSelectedJobIds((prev) => prev.filter((jobId) => !updatedIds.includes(jobId)));
      } else {
        setSelectedJobIds([]);
      }
      setAssignments((prev) => ({
        ...prev,
        [sourceId]: { assignTo: "", otherName: "", assignDate: "" },
      }));
    } catch (error) {
      console.error("Error assigning job:", error);
      toast.error("Failed to assign job");
    }
  };

  const handleReject = async (item: JobDetail) => {
    if (!canEdit) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to reject this job?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${item.id}/reject`, {});
        await sendRoleNotificationByEvent({
          eventKey: "job_rejected",
          joNo: String(item.jo_number || ""),
          joNumber: String(item.jo_number || ""),
          jobNo: String(item.job_no || ""),
          assignedBy: currentUserName,
          clientName: categoryDetails[0]?.client_name || "",
          source: "production_planning_reject",
          sendAll: false,
        });
        toast.success("Job rejected successfully");
        setJobDetails((prev) =>
          prev.map((job) => (job.id === item.id ? { ...job, is_rejected: true } : job))
        );
      } catch (error) {
        console.error("Error rejecting job:", error);
        toast.error("Failed to reject job");
      }
    }
  };

  const handleMarkQc = async (item: JobDetail) => {
    if (!canEdit) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this job as completed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, complete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${item.id}/direct_qc`, {});
        await sendRoleNotificationByEvent({
          eventKey: "moved_to_qc",
          joNo: String(item.jo_number || ""),
          joNumber: String(item.jo_number || ""),
          jobNo: String(item.job_no || ""),
          assignedBy: currentUserName,
          clientName: categoryDetails[0]?.client_name || "",
          source: "production_planning_direct_qc",
          sendAll: false,
        });
        toast.success("Job marked Ready-For-QC successfully");
        setJobDetails((prev) =>
          prev.map((job) => (job.id === item.id ? { ...job, status: "QC", qty: 0 } : job))
        );
      } catch (error) {
        console.error("Error doing QC to job:", error);
        toast.error("Failed to mark job as Ready-For-QC");
      }
    }
  };

  const handleStartEditPendingJo = (item: PendingMaterial) => {
    const isMissingJoNumber = !String(item.jo_number || "").trim();
    if (!isMissingJoNumber) return;
    setEditingPendingId(item.id);
    setEditingPendingForm({
      description: String(item.description || ""),
      size: String(item.size || ""),
      moc: String(item.moc || ""),
      qty: String(item.qty ?? ""),
    });
  };

  const handleCancelEditPendingJo = () => {
    setEditingPendingId(null);
    setEditingPendingForm({
      description: "",
      size: "",
      moc: "",
      qty: "",
    });
  };

  const handleSaveEditPendingJo = async () => {
    if (!editingPendingId) return;
    const qtyNumber = Number(editingPendingForm.qty);
    if (editingPendingForm.qty.trim() === "" || Number.isNaN(qtyNumber)) {
      toast.error("Please enter valid quantity");
      return;
    }
    if (!canEdit) {
      toast.error("You don't have permission");
      return;
    }

    const payload = {
      description: editingPendingForm.description.trim(),
      size: editingPendingForm.size.trim(),
      moc: editingPendingForm.moc.trim(),
      qty: qtyNumber,
    };

    try {
      setSavingPendingEdit(true);
      await axiosProvider.put(
        `/fineengg_erp/system/pending-materials/${editingPendingId}`,
        payload
      );

      setPendingData((prev) =>
        prev.map((item) =>
          item.id === editingPendingId
            ? {
                ...item,
                ...payload,
              }
            : item
        )
      );

      toast.success("Pending material updated");
      setEditingPendingId(null);
      setEditingPendingForm({
        description: "",
        size: "",
        moc: "",
        qty: "",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update pending material");
    } finally {
      setSavingPendingEdit(false);
    }
  };

  const handleDeletePendingMaterial = async (item: PendingMaterial) => {
    if (!canEdit) {
      toast.error("You don't have permission");
      return;
    }

    const result = await Swal.fire({
      title: "Delete pending material?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingPendingId(item.id);
      await axiosProvider.delete(`/fineengg_erp/system/pending-materials/${item.id}`);
      setPendingData((prev) => prev.filter((row) => row.id !== item.id));
      if (editingPendingId === item.id) {
        handleCancelEditPendingJo();
      }
      toast.success("Pending material deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete pending material");
    } finally {
      setDeletingPendingId(null);
    }
  };

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
        <div className="absolute bottom-0 right-0">
          <Image src="/images/sideDesign.svg" alt="side design" width={100} height={100} className="w-full h-full" />
        </div>
        <DesktopHeader />
        <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4">&larr; Back</button>

          {/* Job Details Section */}
          <div className="mb-12">
            <h1 className="text-xl font-semibold mb-6">Job Details for Job No: {job_no}</h1>
            {loading ? (
              <p className="text-center py-4 text-gray-500">Loading...</p>
            ) : categoryDetails.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No job details found for this job number.</p>
            ) : (
              <div className="space-y-8">
                {categoryDetails.map((item) => (
                  <div key={item.id} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Client Name</span><span className="text-sm font-semibold text-gray-900">{item.client_name || "-"}</span></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Job Category</span><span className="text-sm font-semibold text-gray-900">{item.job_category || "N/A"}</span></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Drawing Rec. Date</span><span className="text-sm font-semibold text-gray-900">{item.drawing_recieved_date || "-"}</span></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Material Type</span><span className="text-sm font-semibold text-gray-900">{item.material_type || "-"}</span></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Qty</span><span className="text-sm font-semibold text-gray-900">{item.qty || "-"}</span></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Pressure [Bar]</span><span className="text-sm font-semibold text-gray-900">{item.bar || "-"}</span></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Temperature</span><span className="text-sm font-semibold text-gray-900">{item.tempp || "-"}</span></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-1">Due Date</span><span className="text-sm font-semibold text-gray-900">{item.urgent_due_date || "-"}</span></div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><span className="block text-gray-500 text-[10px] uppercase mb-2">Description</span><p className="text-sm text-gray-900 font-medium">{item.description || "-"}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-8">
            <div className="w-full">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl font-semibold">Material Received From Amar</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Search JO:</span>
                  <input
                    type="text"
                    value={joNumberSearch}
                    onChange={(e) => setJoNumberSearch(e.target.value)}
                    placeholder="Search by JO Number"
                    className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="relative overflow-x-auto overflow-y-auto sm:rounded-lg border border-tableBorder shadow-sm max-h-[550px]">
                <table className="w-full text-sm text-left min-w-[1100px] border-separate border-spacing-0">
                  <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50 sticky top-0 z-20">
                    <tr className="border border-tableBorder">
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Select</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">J/O No</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Product Desc</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Product Qty</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Serial No</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Item Desc</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Item No</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">MOC</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Qty</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Bin Location</th>
                      <th className="px-6 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Assign To</th>
                      <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Assign Date</th>
                      {canEdit && <th className="px-4 py-4 border border-tableBorder sticky top-0 bg-gray-50 z-20">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={canEdit ? 13 : 12} className="text-center py-4">Loading...</td></tr>
                    ) : filteredGroupedJobEntries.length === 0 ? (
                      <tr><td colSpan={canEdit ? 13 : 12} className="text-center py-4">No items to assign for this job.</td></tr>
                    ) : (
                      paginatedGroupedJobEntries.flatMap(([joNumber, jobs]) => {
                        const isExpanded = expandedJoNumbers.includes(joNumber);
                        const hasMultiple = jobs.length > 1;
                        const groupSelectableIds = jobs.filter(isJobSelectable).map((job) => job.id);
                        const allGroupSelected = groupSelectableIds.length > 0 && groupSelectableIds.every((id) => selectedJobIds.includes(id));
                        const isGroupSelectionDisabled = groupSelectableIds.length === 0;
                        const renderJobRow = (item: JobDetail, isFirst: boolean, isChild: boolean) => {
                          const isRejected = item.is_rejected || item.rejected;
                          const isProcessed = item.status === 'completed' || item.status === 'QC' || item.qty === 0;
                          const showParentAssignControls = !hasMultiple || isFirst;
                          const showAssignedTextOnly = !hasMultiple && !!item.assign_to;
                          const rowJobs = hasMultiple ? jobs : [item];
                          const isParentSelectionLocked = rowJobs.every((job) => {
                            const jobRejected = job.is_rejected || job.rejected;
                            const jobProcessed = job.status === "completed" || job.status === "QC" || job.qty === 0;
                            return !!job.assign_to || !!jobRejected || jobProcessed;
                          });
                          return (
                            <tr key={item.id + (isChild ? '-child' : '-header')} className={`border border-tableBorder bg-white hover:bg-primary-100 ${isChild ? "bg-gray-50" : ""}`}>
                              <td className="px-4 py-3 border border-tableBorder">
                                {isFirst && hasMultiple ? (
                                  <input
                                    type="checkbox"
                                    title={`Select JO group ${joNumber}`}
                                    aria-label={`Select JO group ${joNumber}`}
                                    checked={allGroupSelected}
                                    disabled={isGroupSelectionDisabled}
                                    onChange={() => toggleJoGroupSelection(joNumber, jobs)}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    title={`Select job ${item.id}`}
                                    aria-label={`Select job ${item.id}`}
                                    checked={item.assign_to ? true : selectedJobIds.includes(item.id)}
                                    disabled={!isJobSelectable(item)}
                                    onChange={() => toggleSingleJobSelection(item)}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">{isFirst && <div className="flex items-center gap-2">{joNumber}{hasMultiple && <button title={`Toggle rows for ${joNumber}`} aria-label={`Toggle rows for ${joNumber}`} onClick={() => toggleJoNumberExpansion(joNumber)}><FaChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>}</div>}</td>
                              <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_desc || "-") : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_qty || "-") : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.serial_no || 'N/A') : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.item_description || "-") : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.item_no : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.moc : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (isRejected ? "true" : item.qty) : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.bin_location : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">
                                {isRejected ? (
                                  <div className="flex items-center gap-2 text-red-600 font-medium"><FaBan className="w-4 h-4" /><span>Rejected</span></div>
                                ) : showAssignedTextOnly ? (
                                  item.assign_to || "-"
                                ) : showParentAssignControls ? (
                                  assignments[item.id]?.assignTo === "Others" ? (
                                    <div className="flex items-center gap-1"><input type="text" placeholder="Enter Name" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100" value={assignments[item.id]?.otherName || ""} onChange={(e) => handleAssignmentChange(item.id, "otherName", e.target.value)} disabled={isParentSelectionLocked || !canEdit} /></div>
                                  ) : (
                                    <select title="Assign to" aria-label="Assign to" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100" value={assignments[item.id]?.assignTo || ""} onChange={(e) => handleAssignmentChange(item.id, "assignTo", e.target.value)} disabled={isParentSelectionLocked || !canEdit}>
                                      <option value="">Select</option><option value="Usmaan">Usmaan</option><option value="Ramzaan">Ramzaan</option><option value="Riyaaz">Riyaaz</option><option value="Ashfaq">Ashfaq</option><option value="Others">Others</option>
                                    </select>
                                  )
                                ) : (
                                  item.assign_to || "-"
                                )}
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                {showAssignedTextOnly ? (
                                  item.assign_date || "-"
                                ) : showParentAssignControls ? (
                                  <input type="date" title="Assign date" aria-label="Assign date" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100" value={assignments[item.id]?.assignDate || ""} onChange={(e) => handleAssignmentChange(item.id, "assignDate", e.target.value)} disabled={isParentSelectionLocked || !canEdit} />
                                ) : (
                                  item.assign_date || "-"
                                )}
                              </td>
                              {canEdit && (
                                <td className="px-4 py-3 border border-tableBorder">
                                  <div className="flex items-center gap-2">
                                    {showParentAssignControls && !isRejected && !isProcessed && (
                                      <button onClick={() => handleAssign(item.id)} disabled={isParentSelectionLocked} className={`px-3 py-1 rounded text-sm text-white ${isParentSelectionLocked ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                                        {item.status === 'completed' ? 'Completed' : item.status === 'QC' ? 'In QC' : item.assign_to ? "Assigned" : "Assign"}
                                      </button>
                                    )}
                                    {(isChild || !hasMultiple) && (
                                      <>
                                        <button title="Reject item" aria-label="Reject item" onClick={() => !item.assign_to && !isRejected && !isProcessed && handleReject(item)} disabled={!!item.assign_to || !!isRejected || isProcessed} className={`p-2 rounded-md ${isRejected ? "bg-red-200 text-red-800" : (!!item.assign_to || isProcessed) ? "bg-gray-100 text-gray-400 opacity-50" : "bg-red-100 text-red-600 hover:bg-red-200"}`}><FaBan className="w-4 h-4" /></button>
                                        <button title="Mark item QC" aria-label="Mark item QC" onClick={() => !item.assign_to && !isProcessed && !isRejected && handleMarkQc(item)} disabled={!!item.assign_to || isProcessed || !!isRejected} className={`p-2 rounded-md ${(!!item.assign_to || isProcessed || !!isRejected) ? "bg-gray-100 text-gray-400 opacity-50" : "bg-green-100 text-green-600 hover:bg-green-200"}`}><MdOutlineVerified className="w-4 h-4" /></button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        };
                        if (!hasMultiple) return [renderJobRow(jobs[0], true, false)];
                        const rows = [renderJobRow(jobs[0], true, false)];
                        if (isExpanded) jobs.forEach(job => rows.push(renderJobRow(job, false, true)));
                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && filteredGroupedJobEntries.length > 0 && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentJoPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentJoPage === 1}
                    className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-600">
                    Page {currentJoPage} of {totalJoPages}
                  </div>
                  <button
                    onClick={() => setCurrentJoPage((prev) => Math.min(totalJoPages, prev + 1))}
                    disabled={currentJoPage === totalJoPages}
                    className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="w-full">
              <h1 className="text-xl font-semibold mb-6">Pending Materials for Job No: {job_no}</h1>
              <div className="relative overflow-x-auto sm:rounded-lg border border-tableBorder shadow-sm">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th className="px-4 py-4 border border-tableBorder">Job No</th><th className="px-4 py-4 border border-tableBorder">Description</th><th className="px-4 py-4 border border-tableBorder">Item No</th><th className="px-4 py-4 border border-tableBorder">Size</th><th className="px-4 py-4 border border-tableBorder">MOC</th><th className="px-4 py-4 border border-tableBorder">Qty</th><th className="px-4 py-4 border border-tableBorder">JO Number</th><th className="px-4 py-4 border border-tableBorder">Status</th><th className="px-4 py-4 border border-tableBorder">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={9} className="text-center py-4">Loading...</td></tr>
                    : pendingData.length === 0 ? <tr><td colSpan={9} className="text-center py-4">No pending materials found.</td></tr>
                    : pendingData.map((item) => {
                      const isMissingJoNumber = !String(item.jo_number || "").trim();
                      return (
                      <tr
                        key={item.id}
                        className={`border border-tableBorder ${
                          isMissingJoNumber
                            ? "bg-yellow-50 hover:bg-yellow-100"
                            : "bg-white hover:bg-primary-100"
                        }`}
                      >
                        <td className="px-4 py-3 border border-tableBorder">{item.job_no}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.description}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.item_no}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.size}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.moc}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.qty}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.jo_number || "-"}</td>
                        <td className="px-4 py-3 border border-tableBorder">{item.status || (item.is_completed ? "Completed" : "Pending")}</td>
                        <td className="px-4 py-3 border border-tableBorder">
                          {isMissingJoNumber ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEditPendingJo(item)}
                                disabled={deletingPendingId === item.id}
                                className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePendingMaterial(item)}
                                disabled={deletingPendingId === item.id}
                                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingPendingId === item.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {editingPendingId && (
          <>
            <div
              className="min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
              onClick={handleCancelEditPendingJo}
            />
            <div className="flyout open">
              <div className="w-full min-h-auto">
                <div className="flex justify-between mb-4">
                  <p className="text-primary-600 text-2xl font-semibold">Edit Pending Material</p>
                  <IoCloseOutline
                    onClick={handleCancelEditPendingJo}
                    className="h-8 w-8 border border-[#E7E7E7] rounded cursor-pointer"
                  />
                </div>
                <div className="w-full border-b border-[#E7E7E7] mb-4" />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm mb-2">Job No</p>
                      <input
                        type="text"
                        title="Job No"
                        aria-label="Job No"
                        value={editingPendingItem?.job_no || ""}
                        disabled
                        className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-2">Item No</p>
                      <input
                        type="text"
                        title="Item No"
                        aria-label="Item No"
                        value={editingPendingItem?.item_no ?? ""}
                        disabled
                        className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-medium text-sm mb-2">Description</p>
                      <textarea
                        value={editingPendingForm.description}
                        onChange={(e) => setEditingPendingForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter Description"
                        className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] min-h-[100px]"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-2">Size</p>
                      <input
                        type="text"
                        value={editingPendingForm.size}
                        onChange={(e) => setEditingPendingForm((prev) => ({ ...prev, size: e.target.value }))}
                        placeholder="Enter Size"
                        className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-2">MOC</p>
                      <input
                        type="text"
                        value={editingPendingForm.moc}
                        onChange={(e) => setEditingPendingForm((prev) => ({ ...prev, moc: e.target.value }))}
                        placeholder="Enter MOC"
                        className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-2">Quantity</p>
                      <input
                        type="number"
                        value={editingPendingForm.qty}
                        onChange={(e) => setEditingPendingForm((prev) => ({ ...prev, qty: e.target.value }))}
                        placeholder="Enter Quantity"
                        className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveEditPendingJo}
                      disabled={savingPendingEdit}
                      className="py-2.5 px-5 bg-primary-600 rounded-[4px] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingPendingEdit ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditPendingJo}
                      disabled={savingPendingEdit}
                      className="py-2.5 px-5 bg-gray-200 text-gray-700 rounded-[4px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}