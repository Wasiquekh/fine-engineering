"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import AxiosProvider from "../../../../provider/AxiosProvider";
import StorageManager from "../../../../provider/StorageManager";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import PageGuard from "../../../component/PageGuard";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

interface VendorIncomingAssignment {
  id: string;
  jo_no: string | null;
  item_no: string | null;
  machine_category: string | null;
  machine_size: string | null;
  machine_code: string | null;
  worker_name: string | null;
  quantity_no: number | null;
  assigning_date: string | null;
  serial_no: string | null;
  job_id: string | null;
  vendor_name: string | null;
  qc_date: string | null;
  qc_quantity: number | null;
  gatepass_no: string | null;
  review_for: string | null;
  status: string;
  job_type?: string | null;
  tso_no?: string | null;
  job_category?: string | null;
  assign_to?: string | null;
  assign_date?: string | null;
  job: {
    id: string;
    job_no: string;
    jo_number: string;
    job_category: string;
    client_name: string;
    item_description: string;
    item_no: string;
    product_desc: string | null;
    moc: string;
    qty: number;
    assign_to: string | null;
    job_type?: string;
    tso_no?: string | null;
  } | null;
}

type RevertVendorRequest = {
  assign_to: string;
  qty: number;
  updated_by?: string;
};

type RevertVendorSuccess = {
  success: true;
  data: {
    assignment: VendorIncomingAssignment;
    job: any;
  };
  message: string;
};

type IncomingToQcRequest = {
  updated_by?: string;
};

type IncomingToQcSuccess = {
  success: true;
  data?: {
    assignment?: VendorIncomingAssignment;
  } | VendorIncomingAssignment;
  message?: string;
};

type ApiError = {
  success: false;
  error: string;
  details?: string[];
};

const ASSIGN_OPTIONS = ["Usmaan", "Riyaaz", "Ramzaan"] as const;

const getAssignmentDedupKey = (item: VendorIncomingAssignment): string => {
  if (item.id) return `id:${item.id}`;
  return [
    item.job_id || "",
    item.serial_no || "",
    item.jo_no || "",
    item.item_no || "",
    String(item.quantity_no ?? ""),
    item.vendor_name || "",
  ].join("|");
};

const dedupeAssignments = (items: VendorIncomingAssignment[]): VendorIncomingAssignment[] => {
  const uniqueMap = new Map<string, VendorIncomingAssignment>();

  items.forEach((item) => {
    const key = getAssignmentDedupKey(item);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values());
};

const isVisibleVendorIncomingRow = (item: any): boolean => {
  const reviewFor = String(item?.review_for || "").toLowerCase();
  const status = String(item?.status || "").toLowerCase();
  const qty = Number(item?.quantity_no ?? 0);

  return reviewFor === "vendor" && status === "in-review" && qty > 0;
};

export default function VendorIncomingPage() {
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<VendorIncomingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string | null>(null);
  const [selectedJO, setSelectedJO] = useState<string | null>(null);
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [processingQcAssignmentId, setProcessingQcAssignmentId] = useState<string | null>(null);

  const client = searchParams.get("client") || "";
  const permissions = storage.getUserPermissions();
  const canEditProductionPlanning = hasPermission(permissions, "production.planning.edit");

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories", {
        params: { ...(client ? { client_name: client } : {}) },
      } as any);
      const cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      const uniqueMap = new Map<string, { value: string; label: string }>();
      cats.forEach((cat: any) => {
        const jobCategory = String(cat?.job_category || "").trim();
        if (jobCategory && !uniqueMap.has(jobCategory)) {
          uniqueMap.set(jobCategory, { value: jobCategory, label: jobCategory });
        }
      });
      setCategories(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchVendorIncoming = async () => {
    setLoading(true);
    try {
      const params: any = { review_for: "vendor" };
      if (client) params.client_name = client;

      const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
        params,
        headers: undefined,
      });
      const fetchedData = (response?.data?.data || []).filter(isVisibleVendorIncomingRow);

      const normalizedData = fetchedData.map((item: any) => ({
        ...item,
        job_type: item.job_type || item.job?.job_type || "JOB_SERVICE",
        tso_no: item.tso_no || item.job?.tso_no,
        job_category: item.job_category || item.job?.job_category,
        assign_to: item.assign_to || item.job?.assign_to,
        assign_date: item.assign_date,
      }));

      const dedupedData = dedupeAssignments(normalizedData);
      setData(dedupedData);
    } catch (error) {
      console.error("Error fetching vendor incoming:", error);
      toast.error("Failed to load vendor incoming data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [client]);

  useEffect(() => {
    setJobServiceCategoryFilter("ALL");
    setSelectedIdentifier(null);
    setSelectedJO(null);
    fetchVendorIncoming();
  }, [client]);

  // Revert vendor assignment and send item back to production queue with new assignee
  const handleRevertVendorAssign = async (item: VendorIncomingAssignment, assignTo: string) => {
    if (!item.id) {
      toast.error("Assignment ID not found");
      return;
    }

    const qty = Number(item.quantity_no || 0);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("Invalid assignment quantity for revert");
      return;
    }

    try {
      const updatedBy = storage.getUserId();
      const payload: RevertVendorRequest = {
        assign_to: assignTo,
        qty,
        ...(updatedBy ? { updated_by: updatedBy } : {}),
      };

      const response = await axiosProvider.post<RevertVendorSuccess | ApiError>(
        `/fineengg_erp/system/assign-to-worker/${item.id}/revert-vendor`,
        payload
      );

      const responseData = response?.data;
      if (!responseData || responseData.success === false) {
        const apiError = responseData as ApiError | undefined;
        const validationDetails = apiError?.details?.length
          ? `: ${apiError.details.join(", ")}`
          : "";
        toast.error(`${apiError?.error || "Failed to revert vendor assignment"}${validationDetails}`);
        return;
      }

      toast.success(responseData.message || "Vendor assignment reverted successfully");
      // Avoid full refetch here because backend in-review filter can hide sibling rows
      // for the same JO/job after one revert. Remove only the acted row from UI.
      setData((prevData) => prevData.filter((d) => d.id !== item.id));
    } catch (error: any) {
      const apiError = error?.response?.data as ApiError | undefined;
      const validationDetails = apiError?.details?.length
        ? `: ${apiError.details.join(", ")}`
        : "";
      toast.error(`${apiError?.error || "Failed to revert vendor assignment"}${validationDetails}`);
    }
  };

  const handleMoveToQc = async (item: VendorIncomingAssignment) => {
    if (!item.id) {
      toast.error("Assignment ID not found");
      return;
    }

    setProcessingQcAssignmentId(item.id);
    try {
      const payload: IncomingToQcRequest = {};
      const updatedBy = storage.getUserId();
      if (updatedBy) {
        payload.updated_by = updatedBy;
      }

      const response = await axiosProvider.post<IncomingToQcSuccess | ApiError>(
        `/fineengg_erp/system/assign-to-worker/${item.id}/incomming-to-qc`,
        payload
      );

      const responseData = response?.data;
      if (!responseData || responseData.success === false) {
        const apiError = responseData as ApiError | undefined;
        toast.error(apiError?.error || "Failed to move to ready-for-qc");
        return;
      }

      toast.success("Moved to ready-for-qc");
      setData((prevData) => prevData.filter((d) => d.id !== item.id));
    } catch (error: any) {
      const apiError = error?.response?.data as ApiError | undefined;
      toast.error(apiError?.error || "Failed to move to ready-for-qc");
    } finally {
      setProcessingQcAssignmentId((prev) => (prev === item.id ? null : prev));
    }
  };

  // Ready for QC
  const handleReadyForQC = async (item: VendorIncomingAssignment) => {
    if (!canEditProductionPlanning) {
      toast.error("You don't have permission");
      return;
    }

    if (!item.job_id) {
      toast.error("Job ID not found");
      return;
    }
    
    const result = await Swal.fire({
      title: "Ready for QC?",
      text: `Mark this item as Ready for QC?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Ready for QC!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const updated_by = storage.getUserId();
      
      if (!updated_by) {
        toast.error("User ID not found");
        return;
      }

      try {
        // Using the existing backToQc API
        await axiosProvider.post(`/fineengg_erp/system/jobs/${item.job_id}/backToQc`, {
          updated_by,
        });
        
        toast.success("Item marked as Ready for QC");
        fetchVendorIncoming();
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to mark as Ready for QC");
      }
    }
  };

  // Reject item
  const handleReject = async (item: VendorIncomingAssignment) => {
    if (!canEditProductionPlanning) return;
    
    if (!item.job_id) {
      toast.error("Job ID not found");
      return;
    }
    
    const result = await Swal.fire({
      title: "Reject Item?",
      text: "Are you sure you want to reject this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, Reject",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${item.job_id}/reject`, {});
        toast.success("Item rejected");
        fetchVendorIncoming();
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Failed to reject");
      }
    }
  };

  const filteredData = () => {
    if (jobServiceCategoryFilter === "ALL") return data;
    return data.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  };

  const getIdentifiers = () => {
    const ids = new Map<string, { type: string; category: string; vendorName: string; gatepassNo: string }>();
    
    filteredData().forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let identifier: string | null = null;
      
      if (jobType === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        identifier = item.jo_no;
      } else {
        identifier =
          item.job?.job_no ||
          item.jo_no ||
          item.job?.jo_number ||
          item.serial_no;
      }
      
      if (identifier && !ids.has(identifier)) {
        ids.set(identifier, {
          type: jobType || "JOB_SERVICE",
          category: item.job_category || item.job?.job_category || "N/A",
          vendorName: item.vendor_name || "N/A",
          gatepassNo: item.gatepass_no || "N/A",
        });
      }
    });
    
    return Array.from(ids.entries()).map(([id, info]) => ({
      identifier: id,
      type: info.type,
      category: info.category,
      vendorName: info.vendorName,
      gatepassNo: info.gatepassNo,
    }));
  };

  const getItemsForIdentifier = (identifier: string) => {
    return filteredData().filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let itemIdentifier: string | null = null;
      
      if (jobType === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        itemIdentifier = item.jo_no;
      } else {
        itemIdentifier =
          item.job?.job_no ||
          item.jo_no ||
          item.job?.jo_number ||
          item.serial_no;
      }
      
      return itemIdentifier === identifier;
    });
  };

  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const groups: Record<string, VendorIncomingAssignment[]> = {};
  
    items.forEach((item) => {
      let jo = item.jo_no;
      if (!jo && item.serial_no) {
        const match = item.serial_no.match(/^([^-]+-[^-]+-[^/]+\/[^/]+\/[^/]+)/);
        if (match) jo = match[1];
        else jo = item.serial_no.substring(0, 20);
      }
      if (!jo) jo = "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });
    return groups;
  };

  const getIdentifierSummary = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
    const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;
    return { totalQty, uniqueJoCount };
  };

  const getJobTypeBadge = (jobType: string | null | undefined) => {
    switch(jobType) {
      case "TSO_SERVICE":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TSO</span>;
      case "KANBAN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">KANBAN</span>;
      case "JOB_SERVICE":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">JOB</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">-</span>;
    }
  };

  const countsByType = {
    JOB_SERVICE: data.filter(d => (d.job_type || d.job?.job_type) === "JOB_SERVICE").length,
    TSO_SERVICE: data.filter(d => (d.job_type || d.job?.job_type) === "TSO_SERVICE").length,
    KANBAN: data.filter(d => (d.job_type || d.job?.job_type) === "KANBAN").length,
    TOTAL: data.length
  };

  const VendorIncomingContent = () => (
    <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
      <div className="absolute bottom-0 right-0">
        <Image src="/images/sideDesign.svg" alt="side design" width={100} height={100} className="w-full h-full" />
      </div>
      <DesktopHeader />

      <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
        <div className="mb-4 px-2">
          <h1 className="text-xl font-semibold text-firstBlack">
            Vendor Incoming • In-Review Status {client && ` • ${client}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Items received back from vendors for QC review</p>
          
          <div className="flex gap-3 mt-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">JOB: {countsByType.JOB_SERVICE}</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">TSO: {countsByType.TSO_SERVICE}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">KANBAN: {countsByType.KANBAN}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">TOTAL: {countsByType.TOTAL}</span>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
            <button
              onClick={() => setJobServiceCategoryFilter("ALL")}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                jobServiceCategoryFilter === "ALL" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setJobServiceCategoryFilter(cat.value)}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  jobServiceCategoryFilter === cat.value ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative overflow-x-auto sm:rounded-lg">
          {selectedIdentifier ? (
            <>
              <button onClick={() => { setSelectedIdentifier(null); setSelectedJO(null); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 mb-4">
                <FaArrowLeft /> Back
              </button>

              {selectedJO ? (
                <>
                  <button onClick={() => setSelectedJO(null)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded mb-4 hover:bg-gray-200">
                    <FaArrowLeft /> Back to JOs
                  </button>
                  <h2 className="text-xl font-bold mb-4">JO: {selectedJO}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-[#999999]">
                        <tr className="border bg-gray-50">
                          <th className="p-3 border">Serial No</th>
                          <th className="p-3 border">Item No</th>
                          <th className="p-3 border">Item Description</th>
                          <th className="p-3 border">MOC</th>
                          <th className="p-3 border">Vendor Name</th>
                          <th className="p-3 border text-center">Quantity</th>
                          <th className="p-3 border text-center">Gatepass No</th>
                          <th className="p-3 border text-center">Current Assignee</th>
                          <th className="p-3 border text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getJoGroupsForIdentifier(selectedIdentifier)[selectedJO]?.map((item) => {
                          const currentAssignee = item.assign_to || item.job?.assign_to || "Unassigned";
                          
                          return (
                            <tr key={item.id} className="border hover:bg-primary-50">
                              <td className="p-3 border font-mono text-blue-600">{item.serial_no || "N/A"}</td>
                              <td className="p-3 border">{item.item_no || "N/A"}</td>
                              <td className="p-3 border">{item.job?.item_description || "N/A"}</td>
                              <td className="p-3 border">{item.job?.moc || "N/A"}</td>
                              <td className="p-3 border">{item.vendor_name || "N/A"}</td>
                              <td className="p-3 border text-center font-semibold text-green-600">{item.quantity_no || 0}</td>
                              <td className="p-3 border text-center">{item.gatepass_no || "N/A"}</td>
                              <td className="p-3 border text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  currentAssignee !== "Unassigned" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {currentAssignee}
                                </span>
                              </td>
                              <td className="p-3 border text-center">
                                <div className="flex flex-col gap-2 items-center">
                                  {String(item.status || "").toLowerCase() === "in-review" && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveToQc(item)}
                                      disabled={processingQcAssignmentId === item.id}
                                      className="px-3 py-1 rounded text-xs transition-colors bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    >
                                      {processingQcAssignmentId === item.id ? "Processing..." : "QC"}
                                    </button>
                                  )}
                                  <div className="relative">
                                    <details>
                                      <summary
                                        className="list-none px-3 py-1 rounded text-xs transition-colors cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200"
                                      >
                                        Assign
                                      </summary>
                                      <div className="absolute z-10 mt-1 w-28 bg-white border rounded-md shadow-md">
                                        {ASSIGN_OPTIONS.map((assignee) => (
                                          <button
                                            key={assignee}
                                            type="button"
                                            onClick={() => handleRevertVendorAssign(item, assignee)}
                                            className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                          >
                                            {assignee}
                                          </button>
                                        ))}
                                      </div>
                                    </details>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // JO Level Table
                <>
                  <h2 className="text-xl font-bold mb-4">{selectedIdentifier}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-[#999999]">
                        <tr className="border bg-gray-50">
                          <th className="p-3 border">JO Number</th>
                          <th className="p-3 border">Vendor Name</th>
                          <th className="p-3 border text-center">Items</th>
                          <th className="p-3 border text-center">Total Quantity</th>
                          <th className="p-3 border">Item Nos</th>
                          <th className="p-3 border">Item Description</th>
                          <th className="p-3 border">MOC</th>
                          <th className="p-3 border text-center">Gatepass No</th>
                          <th className="p-3 border text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(getJoGroupsForIdentifier(selectedIdentifier)).map(([jo, items]) => {
                          const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity_no) || 0), 0);
                          const itemNos = [...new Set(items.map(i => i.item_no).filter(Boolean))];
                          const descriptions = [...new Set(items.map(i => i.job?.item_description).filter(Boolean))];
                          const mocList = [...new Set(items.map(i => i.job?.moc).filter(Boolean))];
                          const vendorName = items[0]?.vendor_name || "N/A";
                          const gatepassNo = items[0]?.gatepass_no || "N/A";
                          
                          return (
                            <tr key={jo} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedJO(jo)}>
                              <td className="p-3 border text-blue-600 font-medium">{jo}</td>
                              <td className="p-3 border">{vendorName}</td>
                              <td className="p-3 border text-center"><span className="px-2 py-1 bg-blue-100 rounded-full text-xs">{items.length}</span></td>
                              <td className="p-3 border text-center font-semibold text-green-600">{totalQty}</td>
                              <td className="p-3 border"><div className="text-sm">{itemNos.slice(0, 3).join(", ")}{itemNos.length > 3 && ` +${itemNos.length - 3}`}</div></td>
                              <td className="p-3 border"><div className="text-sm max-w-[200px]">{descriptions.slice(0, 2).join(", ")}{descriptions.length > 2 && ` +${descriptions.length - 2}`}</div></td>
                              <td className="p-3 border"><div className="text-sm">{mocList.slice(0, 2).join(", ")}{mocList.length > 2 && ` +${mocList.length - 2}`}</div></td>
                              <td className="p-3 border text-center">{gatepassNo}</td>
                              <td className="p-3 border text-center"><button className="px-3 py-1 bg-primary-600 text-white rounded text-sm">View Items</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            // Identifier Level View
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border bg-gray-50">
                      <th className="p-3 border">Job No</th>
                      <th className="p-3 border">Type</th>
                      <th className="p-3 border">Category</th>
                      <th className="p-3 border">Vendor Name</th>
                      <th className="p-3 border text-center">Total JOs</th>
                      <th className="p-3 border text-center">Total Quantity</th>
                      <th className="p-3 border text-center">Gatepass No</th>
                      <th className="p-3 border text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center p-4">Loading...</td></tr>
                    ) : getIdentifiers().length === 0 ? (
                      <tr><td colSpan={8} className="text-center p-4">No vendor incoming assignments found</td></tr>
                    ) : (
                      getIdentifiers().map(({ identifier, type, category, vendorName, gatepassNo }) => {
                        const { totalQty, uniqueJoCount } = getIdentifierSummary(identifier);
                        return (
                          <tr key={identifier} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedIdentifier(identifier)}>
                            <td className="p-3 border text-blue-600 font-medium">{identifier}</td>
                            <td className="p-3 border">{getJobTypeBadge(type)}</td>
                            <td className="p-3 border">{category}</td>
                            <td className="p-3 border">{vendorName}</td>
                            <td className="p-3 border text-center"><span className="px-2 py-1 bg-blue-100 rounded-full text-xs">{uniqueJoCount}</span></td>
                            <td className="p-3 border text-center font-semibold text-green-600">{totalQty}</td>
                            <td className="p-3 border text-center">{gatepassNo}</td>
                            <td className="p-3 border text-center"><button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">View Details</button></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Total Identifiers: {getIdentifiers().length} | Total Items: {data.length}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard><VendorIncomingContent /></PageGuard>
    </div>
  );
}