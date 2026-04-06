"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, Fragment } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import PageGuard from "../component/PageGuard";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

const kanbanCategory = [
  { value: "VESSEL", label: "VESSEL" },
  { value: "HEAD", label: "HEAD" },
  { value: "CLAMP", label: "CLAMP" },
  { value: "PILLER_DRIVE_ASSEMBLY", label: "PILLER DRIVE ASSEMBLY" },
  { value: "HEATER_PLATE", label: "HEATER PLATE" },
  { value: "COMPRESSION_RING", label: "COMPRESSION RING" },
  { value: "HEATER_SHELL", label: "HEATER SHELL" },
  { value: "OUTER_RING", label: "OUTER RING" },
  { value: "COOLING_COIL", label: "COOLING COIL" },
  { value: "SPARGER", label: "SPARGER" },
  { value: "HOLLOW_SHAFT", label: "HOLLOW SHAFT" },
  { value: "STIRRER_SHAFT", label: "STIRRER SHAFT" },
];

type QcRow = {
  id: string;
  job_id?: string | null;
  job_no?: string | null;
  tso_no?: string | null;
  jo_no?: string | null;
  serial_no?: string | null;
  item_no?: number | string | null;
  machine_category?: string | null;
  machine_size?: string | null;
  machine_code?: string | null;
  worker_name?: string | null;
  quantity_no?: number | string | null;
  assigning_date?: string | null;
  review_for?: "vendor" | "welding" | null;
  job_category?: string | null;
  status?: string | null;
  job?: {
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    jo_number?: string | null;
    job_category?: string | null;
    client_name?: string | null;
  } | null;
};

export default function QcMainPage() {
  const [data, setData] = useState<QcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);

  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories", {
        params: {
          ...(client ? { "job.client_name": client } : {}),
        },
      } as any);
      const cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      const uniqueMap = new Map<string, { value: string; label: string }>();

      cats.forEach((cat: any) => {
        const jobCategory = String(cat?.job_category || "").trim();
        if (jobCategory && !uniqueMap.has(jobCategory)) {
          uniqueMap.set(jobCategory, {
            value: jobCategory,
            label: jobCategory,
          });
        }
      });

      const formattedCats = Array.from(uniqueMap.values());
      setCategories(formattedCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
        params: {
          job_type: filterParam,
          status: "ready-for-qc",
          ...(client ? { "job.client_name": client } : {}),
        },
      } as any);

      let fetchedData = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching QC data:", error);
      toast.error("Failed to load QC data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [client]);

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [filterParam, client]);

  const filteredData = useMemo(() => {
    let currentData = [...data];

    if (filterParam === "JOB_SERVICE") {
      if (jobServiceCategoryFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === jobServiceCategoryFilter;
        });
      }
    } else if (filterParam === "TSO_SERVICE") {
      if (tsoSubFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === tsoSubFilter;
        });
      }
    } else if (filterParam === "KANBAN") {
      if (kanbanSubFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === kanbanSubFilter;
        });
      }
    }

    return currentData;
  }, [data, filterParam, jobServiceCategoryFilter, tsoSubFilter, kanbanSubFilter]);

  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    filteredData.forEach((item) => {
      let identifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        identifier = item.jo_no || item.job_no || item.job?.job_no;
      } else {
        identifier = item.job_no || item.job?.job_no;
      }
      if (identifier) ids.add(identifier);
    });
    return Array.from(ids);
  }, [filteredData, filterParam]);

  // ✅ FIX: Group by job.jo_number (actual JO number)
  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = filteredData.filter((item) => {
      let itemIdentifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
      } else {
        itemIdentifier = item.job_no || item.job?.job_no;
      }
      return itemIdentifier === identifier;
    });
    
    const groups: Record<string, QcRow[]> = {};

    items.forEach((item) => {
      // ✅ Use job.jo_number for grouping (actual JO number)
      const joKey = item.job?.jo_number || "Unknown";
      if (!groups[joKey]) groups[joKey] = [];
      groups[joKey].push(item);
    });

    return groups;
  };

  const jobSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        totalQty: number;
        uniqueJoCount: number;
        jobCategory: string;
        assigningDate: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = filteredData.filter((item) => {
        let itemIdentifier: string | null | undefined;
        if (filterParam === "TSO_SERVICE") {
          itemIdentifier = item.tso_no || item.job?.tso_no;
        } else if (filterParam === "KANBAN") {
          itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
        } else {
          itemIdentifier = item.job_no || item.job?.job_no;
        }
        return itemIdentifier === identifier;
      });

      const totalQty = items.reduce(
        (sum, item) => sum + (Number(item.quantity_no) || 0),
        0
      );

      const uniqueJoCount = new Set(items.map((x) => x.job?.jo_number || "Unknown")).size;

      const jobCategory =
        items.length > 0
          ? items[0].job_category || items[0].job?.job_category || "N/A"
          : "N/A";

      const assigningDate =
        items.length > 0 ? items[0].assigning_date || "N/A" : "N/A";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers, filterParam]);

  const uniqueCategories = useMemo(() => {
    if (filterParam === "JOB_SERVICE") return categories;
    if (filterParam === "TSO_SERVICE") return tsoServiceCategory;
    if (filterParam === "KANBAN") return kanbanCategory;
    return [];
  }, [filterParam, categories]);

  // ========== JO-WISE DISPATCH (Using job.jo_number) ==========
  // ========== JO-WISE DISPATCH ==========
const handleJoOK = async (items: QcRow[]) => {
  if (!items || items.length === 0) {
    toast.error("No items to dispatch.");
    return;
  }

  // ✅ Pehle identify karo ki kaunsi job type hai
  const firstItem = items[0];
  const jobType = filterParam; // "JOB_SERVICE", "TSO_SERVICE", or "KANBAN"
  
  let dispatchIdentifier = null;
  let identifierType = null;
  let displayIdentifier = null;
  
  if (jobType === "TSO_SERVICE") {
    // TSO ke liye tso_no use karo
    dispatchIdentifier = firstItem?.tso_no || firstItem?.job?.tso_no;
    identifierType = "tso_no";
    displayIdentifier = dispatchIdentifier;
  } else if (jobType === "KANBAN") {
    // Kanban ke liye jo_no use karo
    dispatchIdentifier = firstItem?.job?.jo_number || firstItem?.jo_no;
    identifierType = "jo_no";
    displayIdentifier = dispatchIdentifier;
  } else {
    // JOB_SERVICE ke liye job_no use karo? Ya jo_no?
    // Actually JOB_SERVICE me bhi jo_no hota hai dispatch ke liye
    dispatchIdentifier = firstItem?.job?.jo_number || firstItem?.jo_no;
    identifierType = "jo_no";
    displayIdentifier = dispatchIdentifier;
  }
  
  if (!dispatchIdentifier) {
    toast.error(`${jobType} identifier not found. Cannot dispatch.`);
    console.error("Missing identifier:", { jobType, firstItem });
    return;
  }

  const jobNo = firstItem?.job?.job_no || "Unknown";
  
  const serialsList = items.map((item, index) => 
    `<div class="text-sm py-1 ${index % 2 === 0 ? 'bg-gray-50' : ''} px-2 rounded">
       <span class="font-mono text-blue-600">${item.serial_no || 'N/A'}</span>
       <span class="text-gray-500 ml-2">(Qty: ${item.quantity_no || 0})</span>
     </div>`
  ).join('');

  const { value: formValues } = await Swal.fire({
    title: `Dispatch ${jobType === "TSO_SERVICE" ? "TSO" : "JO"}`,
    html: `
      <div class="text-left">
        <div class="bg-blue-50 p-3 rounded-lg mb-4">
          <p class="font-semibold">${jobType === "TSO_SERVICE" ? "TSO Number" : "JO Number"}: <span class="text-blue-600">${displayIdentifier}</span></p>
          <p class="text-sm text-gray-600">Job: ${jobNo}</p>
          <p class="text-sm text-gray-600">Total Items: ${items.length}</p>
          <p class="text-sm text-gray-600">Type: ${jobType}</p>
        </div>
        
        <div class="mb-4">
          <p class="text-sm font-semibold text-gray-700 mb-2">Serial Numbers:</p>
          <div class="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
            ${serialsList}
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Chalan No <span class="text-red-500">*</span></label>
          <input id="chalan_no" class="swal2-input w-full" placeholder="Enter Chalan Number" required>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Dispatch Date <span class="text-red-500">*</span></label>
          <input id="dispatch_date" class="swal2-input w-full" type="date" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
      </div>
    `,
    focusConfirm: false,
    width: '550px',
    showCancelButton: true,
    confirmButtonText: `Dispatch ${jobType === "TSO_SERVICE" ? "TSO" : "JO"}`,
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const chalan_no = (document.getElementById("chalan_no") as HTMLInputElement)?.value;
      const dispatch_date = (document.getElementById("dispatch_date") as HTMLInputElement)?.value;

      if (!chalan_no || !dispatch_date) {
        Swal.showValidationMessage("Please fill out both fields");
        return false;
      }

      return { chalan_no, dispatch_date };
    },
  });

  if (!formValues) return;

  const loadingToast = toast.loading(`Dispatching ${jobType === "TSO_SERVICE" ? "TSO" : "JO"} ${displayIdentifier}...`);

  try {
    // ✅ Correct parameter based on job type
    const dispatchPayload: any = {
      chalan_no: formValues.chalan_no,
      dispatch_date: formValues.dispatch_date,
    };
    
    if (jobType === "TSO_SERVICE") {
      dispatchPayload.tso_no = dispatchIdentifier;  // TSO ke liye tso_no
    } else {
      dispatchPayload.jo_no = dispatchIdentifier;   // JOB_SERVICE / KANBAN ke liye jo_no
    }
    
    console.log("Dispatching with payload:", dispatchPayload);
    
    const response = await axiosProvider.post("/fineengg_erp/system/jobs/dispatch", dispatchPayload);

    toast.dismiss(loadingToast);

    if (response?.data?.success) {
      toast.success(
        <div>
          <div className="font-semibold text-green-600">✅ Dispatch Successful!</div>
          <div className="text-sm mt-1">${jobType === "TSO_SERVICE" ? "TSO" : "JO"}: <span className="font-mono font-bold">${displayIdentifier}</span></div>
          <div className="text-sm">Job: ${jobNo}</div>
          <div className="text-sm">Chalan: ${formValues.chalan_no}</div>
          <div className="text-xs text-gray-600 mt-1">Items: ${items.length}</div>
        </div>,
        { autoClose: 5000 }
      );
      
      fetchData();
      setSelectedJobNo(null);
    } else {
      toast.error(response?.data?.error || "Dispatch failed");
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    console.error("Dispatch error:", error);
    
    const errorMsg = error?.response?.data?.error || error?.message || "Dispatch failed";
    
    toast.error(
      <div>
        <div className="font-semibold text-red-600">❌ Dispatch Failed!</div>
        <div className="text-sm mt-1">${jobType === "TSO_SERVICE" ? "TSO" : "JO"}: <span className="font-mono">${displayIdentifier}</span></div>
        <div className="text-sm text-red-600">{errorMsg}</div>
      </div>,
      { autoClose: 5000 }
    );
  }
};

  // ========== JO-WISE Not OK ==========
  const handleJoNotOk = async (items: QcRow[]) => {
    if (!items || items.length === 0) {
      toast.error("No items to process.");
      return;
    }

    const joNo = items[0]?.job?.jo_number || "Unknown";
    const jobId = items[0]?.job_id || items[0]?.job?.id;

    if (!jobId) {
      toast.error("Job ID not found");
      return;
    }

    const { value: reason } = await Swal.fire({
      title: "Reason for Not OK",
      html: `
        <p>Marking JO: <strong>${joNo}</strong> as Not OK</p>
        <p class="text-sm text-gray-600 mt-2">Items in this JO: ${items.length}</p>
      `,
      input: "textarea",
      inputPlaceholder: "Enter the reason...",
      showCancelButton: true,
      confirmButtonText: "Submit",
      confirmButtonColor: "#d33",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!reason) return;

    const updated_by = storage.getUserId();

    if (!updated_by) {
      toast.error("User not found");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/not-ok`, {
          reason: reason,
          updated_by: updated_by,
        });
        successCount++;
      } catch (error: any) {
        console.error(`Failed to mark item ${item.serial_no}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} item(s) from JO ${joNo} marked as Not OK`);
    }
    if (failCount > 0) {
      toast.error(`Failed to mark ${failCount} item(s)`);
    }

    fetchData();
  };

  // ========== JO-WISE Rework ==========
  const handleJoRework = async (items: QcRow[]) => {
    if (!items || items.length === 0) {
      toast.error("No items to process.");
      return;
    }

    const joNo = items[0]?.job?.jo_number || "Unknown";

    const { value: reason } = await Swal.fire({
      title: "Send JO for Rework",
      html: `
        <p>Sending JO: <strong>${joNo}</strong> for rework</p>
        <p class="text-sm text-gray-600 mt-2">Items in this JO: ${items.length}</p>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for rework...",
      showCancelButton: true,
      confirmButtonText: "Yes, Send to Rework",
      confirmButtonColor: "#ef4444",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!reason) return;

    const updated_by = storage.getUserId();

    if (!updated_by) {
      toast.error("User not found");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/reject`, {
          updated_by,
        });
        successCount++;
      } catch (error: any) {
        console.error(`Failed to reject item ${item.serial_no}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} item(s) from JO ${joNo} sent for rework`);
    }
    if (failCount > 0) {
      toast.error(`Failed to process ${failCount} item(s)`);
    }

    fetchData();
  };

  const handleSingleItemRework = async (item: QcRow) => {
    if (!item) return;

    const joNo = item.job?.jo_number || "Unknown";

    const { value: reason } = await Swal.fire({
      title: "Send Item for Rework",
      html: `
        <p>Serial: <strong>${item.serial_no || "N/A"}</strong></p>
        <p class="text-sm text-gray-600 mt-2">JO: ${joNo}</p>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for rework...",
      showCancelButton: true,
      confirmButtonText: "Yes, Send to Rework",
      confirmButtonColor: "#ef4444",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!reason) return;

    const updated_by = storage.getUserId();

    if (!updated_by) {
      toast.error("User not found");
      return;
    }

    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/reject`, {
        updated_by,
      });

      toast.success(`Item ${item.serial_no} sent for rework`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Rework failed");
    }
  };

  const QcContent = () => (
    <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
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

      <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
        <div className="mb-4 px-2">
          <h1 className="text-xl font-semibold text-firstBlack">
            QC • {filterParam.replace("_", " ")}
            {client && ` • ${client}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className="font-semibold">ready-for-qc</span>
          </p>
        </div>

        {uniqueCategories.length > 0 && (
          <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
            <button
              onClick={() => {
                if (filterParam === "JOB_SERVICE") setJobServiceCategoryFilter("ALL");
                if (filterParam === "TSO_SERVICE") setTsoSubFilter("ALL");
                if (filterParam === "KANBAN") setKanbanSubFilter("ALL");
              }}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                filterParam === "JOB_SERVICE"
                  ? jobServiceCategoryFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  : filterParam === "TSO_SERVICE"
                  ? tsoSubFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  : filterParam === "KANBAN"
                  ? kanbanSubFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>

            {uniqueCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  if (filterParam === "JOB_SERVICE") setJobServiceCategoryFilter(cat.value);
                  if (filterParam === "TSO_SERVICE") setTsoSubFilter(cat.value);
                  if (filterParam === "KANBAN") setKanbanSubFilter(cat.value);
                }}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filterParam === "JOB_SERVICE"
                    ? jobServiceCategoryFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : filterParam === "TSO_SERVICE"
                    ? tsoSubFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : filterParam === "KANBAN"
                    ? kanbanSubFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative overflow-x-auto sm:rounded-lg">
          {selectedJobNo ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedJobNo(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FaArrowLeft />
                  Back to Jobs
                </button>
              </div>

              <h2 className="text-xl font-bold mb-4">
                {filterParam === "TSO_SERVICE"
                  ? "TSO"
                  : filterParam === "KANBAN"
                  ? "J/O Number"
                  : "Job"}
                : {selectedJobNo}
              </h2>

              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th className="p-3 border border-tableBorder">JO No</th>
                    <th className="px-2 py-0 border border-tableBorder">Serial No</th>
                    <th className="px-2 py-0 border border-tableBorder">Item No</th>
                    <th className="px-2 py-0 border border-tableBorder">Machine Category</th>
                    <th className="px-2 py-0 border border-tableBorder">Machine Size</th>
                    <th className="px-2 py-0 border border-tableBorder">Machine Code</th>
                    <th className="px-2 py-0 border border-tableBorder">Worker Name</th>
                    <th className="px-2 py-0 border border-tableBorder">Quantity</th>
                    <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                    <th className="px-2 py-0 border border-tableBorder">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center border border-tableBorder">
                        <p className="text-[#666666] text-base">No JO data found</p>
                      </td>
                    </tr>
                  ) : (
                    Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                      <Fragment key={jo}>
                        <tr className="border border-tableBorder bg-gray-100">
                          <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={2}>
                            JO: {jo}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder" colSpan={4}>
                            <span className="text-xs text-gray-600">{items.length} item(s)</span>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder" colSpan={4}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleJoOK(items)}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                              >
                                Dispatch JO
                              </button>
                              <button
                                onClick={() => handleJoNotOk(items)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                              >
                                Not OK JO
                              </button>
                              <button
                                onClick={() => handleJoRework(items)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                              >
                                Rework JO
                              </button>
                            </div>
                          </td>
                        </tr>

                        {items.map((item) => (
                          <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                            <td className="px-2 py-2 border border-tableBorder"> </td>
                            <td className="px-2 py-2 border border-tableBorder font-mono">
                              {item.serial_no || "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {item.item_no ?? "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {item.machine_category || "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {item.machine_size || "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {item.machine_code || "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {item.worker_name || "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder font-semibold">
                              {item.quantity_no ?? "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {item.assigning_date || "-"}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <button
                                onClick={() => handleSingleItemRework(item)}
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                title={`Rework: ${item.serial_no || "N/A"}`}
                              >
                                Rework
                              </button>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">
                {filterParam === "TSO_SERVICE"
                  ? "TSOs Ready for QC"
                  : filterParam === "KANBAN"
                  ? "Kanban Ready for QC"
                  : "Jobs Ready for QC"}
              </h2>

              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th className="p-3 border border-tableBorder">
                      {filterParam === "TSO_SERVICE"
                        ? "TSO No"
                        : filterParam === "KANBAN"
                        ? "J/O Number"
                        : "Job No"}
                    </th>
                    <th className="px-2 py-0 border border-tableBorder">Job Category</th>
                    <th className="px-2 py-0 border border-tableBorder">Total JO</th>
                    <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                    <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                        <p className="text-[#666666] text-base">Loading...</p>
                      </td>
                    </tr>
                  ) : jobIdentifiers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                        <p className="text-[#666666] text-base">No data found</p>
                      </td>
                    </tr>
                  ) : (
                    jobIdentifiers.map((identifier) => {
                      const summary = jobSummary[identifier];

                      return (
                        <tr
                          key={identifier}
                          className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                          onClick={() => setSelectedJobNo(identifier)}
                        >
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-blue-600 text-base leading-normal">{identifier}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base">{summary.jobCategory}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base">{summary.uniqueJoCount}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base">{summary.totalQty}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base">{summary.assigningDate || "-"}</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-3 px-2">
          Total {filterParam === "TSO_SERVICE" ? "TSOs" : filterParam === "KANBAN" ? "J/O Numbers" : "Jobs"}: {jobIdentifiers.length} | Total Items: {filteredData.length}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard requiredPermission="qc.view">
        <QcContent />
      </PageGuard>
    </div>
  );
}