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
import { MdOutlineVerified } from "react-icons/md";
import { FaBan } from "react-icons/fa";
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

export default function VendorIncomingPage() {
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<VendorIncomingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string | null>(null);
  const [selectedJO, setSelectedJO] = useState<string | null>(null);
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [showOtherInput, setShowOtherInput] = useState<{ [key: string]: boolean }>({});
  const [otherNameValue, setOtherNameValue] = useState<{ [key: string]: string }>({});

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
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allData: VendorIncomingAssignment[] = [];

      for (const jobType of jobTypes) {
        const params: any = { job_type: jobType };
        if (client) params.client_name = client;
        
        const response = await axiosProvider.get("/fineengg_erp/system/assignments/in-review/vendor", {
            params,
            headers: undefined
        });
        const fetchedData = response?.data?.data || [];
        
        const dataWithType = fetchedData.map((item: any) => ({
          ...item,
          job_type: jobType,
          tso_no: item.tso_no || item.job?.tso_no,
          job_category: item.job_category || item.job?.job_category,
          assign_to: item.assign_to || item.job?.assign_to,
          assign_date: item.assign_date,
        }));
        
        allData = [...allData, ...dataWithType];
      }
      
      const dedupedData = dedupeAssignments(allData);
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
    setSelectedIdentifier(null);
    setSelectedJO(null);
    fetchVendorIncoming();
  }, [client]);

  // Assign to Usmaan/Ramzaan/Riyaaz/Other
  const handleAssign = async (item: VendorIncomingAssignment, workerName: string) => {
    if (!canEditProductionPlanning) {
      toast.error("You don't have permission to assign");
      return;
    }

    if (!item.job_id) {
      toast.error("Job ID not found");
      return;
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

    try {
      // Using the existing job assign API
      await axiosProvider.post(`/fineengg_erp/system/jobs/${item.job_id}/assign`, {
        assign_to: workerName,
        assign_date: today
      });
      
      toast.success(`Assigned to ${workerName} successfully`);
      
      // Update local state
      setData((prevData) =>
        prevData.map((d) =>
          d.id === item.id ? { 
            ...d, 
            assign_to: workerName, 
            assign_date: today,
            job: d.job ? { ...d.job, assign_to: workerName, assign_date: today } : d.job
          } : d
        )
      );
      
      setShowOtherInput(prev => ({ ...prev, [item.id]: false }));
      setOtherNameValue(prev => ({ ...prev, [item.id]: "" }));
      
    } catch (error: any) {
      console.error("Error assigning item:", error);
      toast.error(error?.response?.data?.error || "Failed to assign item");
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
    const ids = new Map<string, { type: string; category: string; vendorName: string; qcDate: string; gatepassNo: string }>();
    
    filteredData().forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let identifier: string | null = null;
      
      if (jobType === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        identifier = item.jo_no;
      } else {
        identifier = item.job?.job_no;
      }
      
      if (identifier && !ids.has(identifier)) {
        ids.set(identifier, {
          type: jobType || "JOB_SERVICE",
          category: item.job_category || item.job?.job_category || "N/A",
          vendorName: item.vendor_name || "N/A",
          qcDate: item.qc_date || "N/A",
          gatepassNo: item.gatepass_no || "N/A",
        });
      }
    });
    
    return Array.from(ids.entries()).map(([id, info]) => ({
      identifier: id,
      type: info.type,
      category: info.category,
      vendorName: info.vendorName,
      qcDate: info.qcDate,
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
        itemIdentifier = item.job?.job_no;
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
                          <th className="p-3 border">Machine</th>
                          <th className="p-3 border text-center">Quantity</th>
                          <th className="p-3 border text-center">QC Date</th>
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
                              <td className="p-3 border">{item.machine_code} ({item.machine_category})</td>
                              <td className="p-3 border text-center font-semibold text-green-600">{item.quantity_no || 0}</td>
                              <td className="p-3 border text-center">{item.qc_date ? new Date(item.qc_date).toLocaleDateString() : "N/A"}</td>
                              <td className="p-3 border text-center">{item.gatepass_no || "N/A"}</td>
                              <td className="p-3 border text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  currentAssignee !== "Unassigned" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {currentAssignee}
                                </span>
                              </td>
                              <td className="p-3 border text-center">
                                {canEditProductionPlanning && (
                                  <div className="flex flex-col gap-2 items-center">
                                    {/* Assign Buttons - Usmaan, Ramzaan, Riyaaz */}
                                    <div className="flex gap-1 flex-wrap justify-center">
                                      <button
                                        onClick={() => handleAssign(item, "Usmaan")}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                        title="Assign to Usmaan"
                                      >
                                        Usmaan
                                      </button>
                                      <button
                                        onClick={() => handleAssign(item, "Ramzaan")}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                        title="Assign to Ramzaan"
                                      >
                                        Ramzaan
                                      </button>
                                      <button
                                        onClick={() => handleAssign(item, "Riyaaz")}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                        title="Assign to Riyaaz"
                                      >
                                        Riyaaz
                                      </button>
                                      {!showOtherInput[item.id] ? (
                                        <button
                                          onClick={() => setShowOtherInput(prev => ({ ...prev, [item.id]: true }))}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                                          title="Assign to Other"
                                        >
                                          Other
                                        </button>
                                      ) : (
                                        <div className="flex gap-1">
                                          <input
                                            type="text"
                                            placeholder="Name"
                                            className="px-1 py-0.5 text-xs border rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={otherNameValue[item.id] || ""}
                                            onChange={(e) => setOtherNameValue(prev => ({ ...prev, [item.id]: e.target.value }))}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => {
                                              const name = otherNameValue[item.id];
                                              if (name && name.trim()) {
                                                handleAssign(item, name.trim());
                                              } else {
                                                toast.error("Enter a name");
                                              }
                                            }}
                                            className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                          >
                                            OK
                                          </button>
                                          <button
                                            onClick={() => setShowOtherInput(prev => ({ ...prev, [item.id]: false }))}
                                            className="px-1 py-0.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Ready for QC and Reject Buttons */}
                                    <div className="flex gap-1 justify-center mt-1">
                                      <button
                                        onClick={() => handleReadyForQC(item)}
                                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 flex items-center gap-1 transition-colors"
                                        title="Ready for QC"
                                      >
                                        <MdOutlineVerified className="w-3 h-3" />
                                        Ready QC
                                      </button>
                                      <button
                                        onClick={() => handleReject(item)}
                                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 flex items-center gap-1 transition-colors"
                                        title="Reject"
                                      >
                                        <FaBan className="w-3 h-3" />
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                )}
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
                          <th className="p-3 border text-center">QC Date</th>
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
                          const qcDate = items[0]?.qc_date ? new Date(items[0].qc_date).toLocaleDateString() : "N/A";
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
                              <td className="p-3 border text-center">{qcDate}</td>
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
                      <th className="p-3 border">Identifier</th>
                      <th className="p-3 border">Type</th>
                      <th className="p-3 border">Category</th>
                      <th className="p-3 border">Vendor Name</th>
                      <th className="p-3 border text-center">Total JOs</th>
                      <th className="p-3 border text-center">Total Quantity</th>
                      <th className="p-3 border text-center">QC Date</th>
                      <th className="p-3 border text-center">Gatepass No</th>
                      <th className="p-3 border text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center p-4">Loading...</td></tr>
                    ) : getIdentifiers().length === 0 ? (
                      <tr><td colSpan={9} className="text-center p-4">No vendor incoming assignments found</td></tr>
                    ) : (
                      getIdentifiers().map(({ identifier, type, category, vendorName, qcDate, gatepassNo }) => {
                        const { totalQty, uniqueJoCount } = getIdentifierSummary(identifier);
                        return (
                          <tr key={identifier} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedIdentifier(identifier)}>
                            <td className="p-3 border text-blue-600 font-medium">{identifier}</td>
                            <td className="p-3 border">{getJobTypeBadge(type)}</td>
                            <td className="p-3 border">{category}</td>
                            <td className="p-3 border">{vendorName}</td>
                            <td className="p-3 border text-center"><span className="px-2 py-1 bg-blue-100 rounded-full text-xs">{uniqueJoCount}</span></td>
                            <td className="p-3 border text-center font-semibold text-green-600">{totalQty}</td>
                            <td className="p-3 border text-center">{qcDate !== "N/A" ? new Date(qcDate).toLocaleDateString() : "N/A"}</td>
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