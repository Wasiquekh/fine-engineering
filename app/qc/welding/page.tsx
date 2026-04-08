"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import StorageManager from "../../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

type Row = {
  id: string;
  jo_no?: string | null;
  serial_no?: string | null;
  item_no?: number | null;
  quantity_no?: number | null;
  assigning_date?: string | null;
  vendor_name?: string | null;
  status?: string | null;
  job_id?: string | null;
  jobId?: string | null;
  machine_category?: string | null;
  machine_size?: string | null;
  machine_code?: string | null;
  job_type?: string | null;
  tso_no?: string | null;
  job_category?: string | null;
  worker_name?: string | null;
  job_no?: string | null;
  job?: { 
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    job_type?: string | null;
  } | null;
};

export default function QcWeldingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";
  const REVIEW_FOR = "welding";

  const status = useMemo(() => {
    return tab === "outgoing" ? "qc-welding" : "in-welding";
  }, [tab]);

  const getJobId = (r: Row) => r.jobId || r.job_id || r.job?.id;

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories", {
        params: {
          ...(client ? { client_name: client } : {}),
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

      setCategories(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allData: Row[] = [];

      for (const jobType of jobTypes) {
        const res = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
          params: {
            status,
            job_type: jobType,
            ...(client ? { client_name: client } : {}),
          },
        } as any);

        const fetchedData = Array.isArray(res?.data?.data) ? res.data.data : [];
        
        const dataWithJobType = fetchedData.map((item: any) => ({
          ...item,
          job_type: jobType
        }));
        
        allData = [...allData, ...dataWithJobType];
      }

      console.log("Total rows fetched:", allData.length);
      setRows(allData);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load QC Welding");
      setRows([]);
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
  }, [status, filterParam, client]);

  const filteredData = useMemo(() => {
    if (jobServiceCategoryFilter === "ALL") return rows;

    return rows.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  }, [rows, jobServiceCategoryFilter]);

  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    
    filteredData.forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let identifier: string | null | undefined;
      
      if (jobType === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        identifier = item.jo_no;
      } else {
        identifier = item.job_no || item.job?.job_no;
      }
      
      if (identifier) ids.add(identifier);
    });
    
    return Array.from(ids);
  }, [filteredData]);

  const getItemsForIdentifier = (identifier: string) => {
    return filteredData.filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let itemIdentifier: string | null | undefined;
      
      if (jobType === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        itemIdentifier = item.jo_no;
      } else {
        itemIdentifier = item.job_no || item.job?.job_no;
      }
      
      return itemIdentifier === identifier;
    });
  };

  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const groups: Record<string, Row[]> = {};

    items.forEach((item) => {
      const jo = item.jo_no || "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
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
        workerName: string;
        jobType: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = getItemsForIdentifier(identifier);
      
      const totalQty = items.reduce(
        (sum, item) => sum + (Number(item.quantity_no) || 0),
        0
      );

      const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;

      const jobCategory = items.length > 0
        ? items[0].job_category || items[0].job?.job_category || "N/A"
        : "N/A";

      const assigningDate = items.length > 0 ? items[0].assigning_date || "N/A" : "N/A";
      
      const workerName = items.length > 0 ? items[0].worker_name || "N/A" : "N/A";
      
      const jobType = items.length > 0 ? items[0].job_type || items[0].job?.job_type || "JOB_SERVICE" : "JOB_SERVICE";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
        workerName,
        jobType,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers]);

  const handleSerialRework = async (item: Row) => {
    if (!item) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Send for Rework",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p class="mb-2"><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p class="mb-2"><strong>Job Type:</strong> ${item.job_type || item.job?.job_type || 'N/A'}</p>
          <p class="mb-4"><strong>Quantity:</strong> ${item.quantity_no || 'N/A'}</p>
          <p class="text-sm text-gray-600">This item will be sent back to production with status "machine"</p>
        </div>
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

    if (!isConfirmed || !reason) return;

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
// ========== JO-WISE Not OK with QUANTITY SELECTION ==========
const handleJoNotOk = async (items: Row[]) => {
  if (!items || items.length === 0) {
    toast.error("No items to process.");
    return;
  }

  const firstItem = items[0];
  const jobId = getJobId(firstItem);
  const jobType = firstItem.job_type || firstItem.job?.job_type || "JOB_SERVICE";
  
  let displayIdentifier = null;
  if (jobType === "TSO_SERVICE") {
    displayIdentifier = firstItem.tso_no || firstItem.job?.tso_no;
  } else if (jobType === "KANBAN") {
    displayIdentifier = firstItem.jo_no;
  } else {
    displayIdentifier = firstItem.job_no || firstItem.job?.job_no;
  }
  
  if (!jobId) {
    toast.error("Job ID not found");
    return;
  }
  
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
  
  const { value: selectedData } = await Swal.fire({
    title: `Select Items & Quantity to Mark as NOT OK (Welding)`,
    html: `
      <div class="text-left">
        <div class="bg-red-50 p-3 rounded-lg mb-4">
          <p class="font-semibold">${jobType === "TSO_SERVICE" ? "TSO" : jobType === "KANBAN" ? "J/O" : "Job"}: <span class="text-red-600">${displayIdentifier}</span></p>
          <p class="text-sm text-gray-600">Total Quantity Available: <span class="font-bold">${totalQuantity}</span></p>
        </div>
        
        <div class="mb-3">
          <p class="text-sm font-semibold text-gray-700 mb-2">Select items and quantity to mark as NOT OK:</p>
          <div class="max-h-80 overflow-y-auto border rounded-lg p-2 bg-gray-50">
            ${items.map((item, idx) => `
              <div class="item-row p-3 border-b border-gray-200 hover:bg-gray-100">
                <div class="flex items-center gap-3 mb-2">
                  <input type="checkbox" class="item-checkbox" data-id="${item.id}" data-max="${item.quantity_no}" data-serial="${item.serial_no}" ${idx === 0 ? 'checked' : ''}>
                  <div class="flex-1">
                    <span class="font-mono font-medium">${item.serial_no || 'N/A'}</span>
                    <span class="text-gray-500 ml-2">(Total Qty: ${item.quantity_no || 0})</span>
                  </div>
                  <span class="text-xs text-gray-400">JO: ${item.jo_no || 'N/A'}</span>
                </div>
                <div class="ml-7">
                  <label class="text-xs text-gray-600">Not OK Quantity:</label>
                  <input 
                    type="number" 
                    class="notok-qty ml-2 px-2 py-1 border rounded text-sm w-24" 
                    data-id="${item.id}"
                    value="${item.quantity_no}" 
                    min="1" 
                    max="${item.quantity_no}"
                    ${idx === 0 ? '' : 'disabled'}
                  >
                  <span class="text-xs text-gray-400 ml-2">Max: ${item.quantity_no}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Reason <span class="text-red-500">*</span></label>
          <textarea id="reason" class="swal2-textarea w-full" rows="3" placeholder="Enter reason for marking as NOT OK..." required></textarea>
        </div>
      </div>
    `,
    width: '650px',
    showCancelButton: true,
    confirmButtonText: `Mark as NOT OK`,
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    didOpen: () => {
      const checkboxes = document.querySelectorAll('.item-checkbox');
      const qtyInputs = document.querySelectorAll('.notok-qty');
      
      checkboxes.forEach((cb, index) => {
        cb.addEventListener('change', (e) => {
          const isChecked = (e.target as HTMLInputElement).checked;
          const qtyInput = qtyInputs[index] as HTMLInputElement;
          if (qtyInput) {
            qtyInput.disabled = !isChecked;
            if (!isChecked) {
              qtyInput.value = '0';
            } else {
              qtyInput.value = qtyInput.getAttribute('data-max') || '1';
            }
          }
        });
      });
    },
    preConfirm: () => {
      const checkboxes = document.querySelectorAll('.item-checkbox:checked');
      if (checkboxes.length === 0) {
        Swal.showValidationMessage("Please select at least one item to mark as NOT OK");
        return false;
      }
      
      const reason = (document.getElementById("reason") as HTMLTextAreaElement)?.value;
      
      if (!reason || reason.trim() === "") {
        Swal.showValidationMessage("Reason is required!");
        return false;
      }
      
      const selectedItemsData: any[] = [];
      let hasValidQuantity = false;
      
      checkboxes.forEach((cb) => {
        const itemId = (cb as HTMLInputElement).getAttribute('data-id');
        const maxQty = parseInt((cb as HTMLInputElement).getAttribute('data-max') || '0');
        
        const qtyInput = document.querySelector(`.notok-qty[data-id="${itemId}"]`) as HTMLInputElement;
        let notOkQty = qtyInput ? parseInt(qtyInput.value) : maxQty;
        
        if (isNaN(notOkQty)) notOkQty = 0;
        if (notOkQty > maxQty) notOkQty = maxQty;
        if (notOkQty < 0) notOkQty = 0;
        
        if (notOkQty > 0) {
          hasValidQuantity = true;
          selectedItemsData.push({
            assignment_id: itemId,
            quantity: notOkQty
          });
        }
      });
      
      if (!hasValidQuantity) {
        Swal.showValidationMessage("Please enter valid quantity for at least one item");
        return false;
      }
      
      return { 
        items: selectedItemsData,
        reason: reason.trim()
      };
    },
  });

  if (!selectedData) return;

  const loadingToast = toast.loading(`Marking ${selectedData.items.length} item(s) as NOT OK...`);
  const updated_by = storage.getUserId();

  if (!updated_by) {
    toast.dismiss(loadingToast);
    toast.error("User not found");
    return;
  }

  try {
    const response = await axiosProvider.post(`/fineengg_erp/system/jobs/${jobId}/not-ok`, {
      items: selectedData.items,
      reason: selectedData.reason,
      updated_by: updated_by,
      review_for: "welding",
    });

    toast.dismiss(loadingToast);

    if (response?.data?.success) {
      const notOkCount = response.data.data?.processed_count || selectedData.items.length;
      const totalNotOkQty = response.data.data?.not_ok_quantity || 0;
      const remainingQty = response.data.data?.remaining_quantity || 0;
      
      toast.warning(
        <div>
          <div className="font-semibold text-red-600">⚠️ Marked as NOT OK!</div>
          <div className="text-sm mt-1">Marked: <span className="font-bold">{notOkCount}</span> item(s)</div>
          <div className="text-sm">Total Qty: <span className="font-bold">{totalNotOkQty}</span></div>
          {remainingQty > 0 && (
            <div className="text-sm text-orange-600">Remaining: {remainingQty} quantity sent back to in-welding for rework</div>
          )}
        </div>,
        { autoClose: 5000 }
      );
      
      fetchData();
      setSelectedJobNo(null);
    } else {
      toast.error(response?.data?.error || "Failed to mark as NOT OK");
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    toast.error(error?.response?.data?.error || "Failed to mark as NOT OK");
  }
};

  const handleSerialOk = async (item: Row) => {
    if (tab === "outgoing") {
      await openOutgoingForm(item);
    } else {
      await openIncomingForm(item);
    }
  };

  const openOutgoingForm = async (item: Row) => {
    const maxQty = Number(item.quantity_no ?? 0);

    const { value, isConfirmed } = await Swal.fire({
      title: "QC Welding • Outgoing",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          <p><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p><strong>Job Type:</strong> ${item.job_type || item.job?.job_type || 'N/A'}</p>
          <p><strong>Pending Qty:</strong> <b>${maxQty}</b></p>
        </div>
        <input id="qc_date" type="date" class="swal2-input" />
        <input id="qc_quantity" type="number" class="swal2-input" placeholder="QC Quantity (<= ${maxQty})" />
      `,
      showCancelButton: true,
      confirmButtonText: "Submit Outgoing",
      preConfirm: () => {
        const qc_date = (document.getElementById("qc_date") as HTMLInputElement)?.value;
        const qc_quantity = Number(
          (document.getElementById("qc_quantity") as HTMLInputElement)?.value || 0
        );

        if (!qc_date) return Swal.showValidationMessage("QC Date required");
        if (!qc_quantity || qc_quantity <= 0) return Swal.showValidationMessage("QC Quantity required");
        if (qc_quantity > maxQty) return Swal.showValidationMessage(`QC Quantity cannot exceed ${maxQty}`);

        return { qc_date, qc_quantity };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/qc-outgoing`, {
        ...value,
        review_for: REVIEW_FOR,
      });

      toast.success(
        value.qc_quantity < maxQty
          ? `Partial outgoing saved (${value.qc_quantity}). Remaining will stay pending.`
          : "Outgoing saved"
      );
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Outgoing submit failed");
    }
  };

  const openIncomingForm = async (item: Row) => {
    const maxQty = Number(item.quantity_no ?? 0);

    const { value, isConfirmed } = await Swal.fire({
      title: "QC Welding • Incoming",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          <p><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p><strong>Job Type:</strong> ${item.job_type || item.job?.job_type || 'N/A'}</p>
          <p><strong>Pending Qty:</strong> <b>${maxQty}</b></p>
        </div>
        <input id="qc_date" type="date" class="swal2-input" />
        <input id="qc_quantity" type="number" class="swal2-input" placeholder="Incoming Qty (<= ${maxQty})" />
      `,
      showCancelButton: true,
      confirmButtonText: "Submit Incoming",
      preConfirm: () => {
        const qc_date = (document.getElementById("qc_date") as HTMLInputElement)?.value;
        const qc_quantity = Number(
          (document.getElementById("qc_quantity") as HTMLInputElement)?.value || 0
        );

        if (!qc_date) return Swal.showValidationMessage("QC Date required");
        if (!qc_quantity || qc_quantity <= 0) return Swal.showValidationMessage("QC Quantity required");
        if (qc_quantity > maxQty) return Swal.showValidationMessage(`Incoming qty cannot exceed ${maxQty}`);

        return { qc_date, qc_quantity };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/qc-incoming`, {
        ...value,
        review_for: REVIEW_FOR,
      });

      toast.success(
        value.qc_quantity < maxQty
          ? `Partial incoming saved (${value.qc_quantity}). Remaining will stay in-welding.`
          : "Incoming saved → moved to Review/Welding"
      );
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Incoming submit failed");
    }
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

  const countsByType = useMemo(() => {
    const counts = {
      JOB_SERVICE: 0,
      TSO_SERVICE: 0,
      KANBAN: 0,
      TOTAL: rows.length
    };
    
    rows.forEach(item => {
      const type = item.job_type || item.job?.job_type;
      if (type === "JOB_SERVICE") counts.JOB_SERVICE++;
      else if (type === "TSO_SERVICE") counts.TSO_SERVICE++;
      else if (type === "KANBAN") counts.KANBAN++;
    });
    
    return counts;
  }, [rows]);

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-firstBlack">
                  QC • Welding
                  {client && ` • ${client}`}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Outgoing = <b>qc-welding</b> | Incoming = <b>in-welding</b>
                </p>
              </div>

              <div className="flex gap-2">
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => {
                      setTab("outgoing");
                      setSelectedJobNo(null);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                      tab === "outgoing"
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-white"
                    }`}
                  >
                    Outgoing
                  </button>
                  <button
                    onClick={() => {
                      setTab("incoming");
                      setSelectedJobNo(null);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                      tab === "incoming"
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-white"
                    }`}
                  >
                    Incoming
                  </button>
                </div>
              </div>
            </div>

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
                  jobServiceCategoryFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setJobServiceCategoryFilter(cat.value)}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    jobServiceCategoryFilter === cat.value
                      ? "bg-primary-600 text-white"
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
                <button
                  onClick={() => setSelectedJobNo(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mb-4"
                >
                  <FaArrowLeft />
                  Back to Jobs
                </button>

                <h2 className="text-xl font-bold mb-4">
                  {selectedJobNo}
                </h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">JO No</th>
                      <th className="px-2 py-0 border border-tableBorder">Type</th>
                      <th className="px-2 py-0 border border-tableBorder">Serial No</th>
                      <th className="px-2 py-0 border border-tableBorder">Item No</th>
                      <th className="px-2 py-0 border border-tableBorder">Machine Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Machine Size</th>
                      <th className="px-2 py-0 border border-tableBorder">Machine Code</th>
                      <th className="px-2 py-0 border border-tableBorder">Worker Name</th>
                      <th className="px-2 py-0 border border-tableBorder">Pending Qty</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                      <th className="px-2 py-0 border border-tableBorder">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No JO data found</p>
                        </td>
                      </tr>
                    ) : (
                      Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                        <Fragment key={jo}>
                          {/* JO Group Header without Batch Actions */}
                          <tr className="border border-tableBorder bg-gray-100">
                            <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={11}>
                              JO: {jo} ({items.length} item(s))
                            </td>
                          </tr>
                          
                          {/* Individual Items with Actions */}
                          {items.map((item) => (
                            <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                              <td className="px-2 py-2 border border-tableBorder">{jo}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                {getJobTypeBadge(item.job_type || item.job?.job_type || "JOB_SERVICE")}
                              </td>
                              <td className="px-2 py-2 border border-tableBorder font-mono">{item.serial_no || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_category || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_size || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_code || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.worker_name || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder font-semibold">{item.quantity_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.assigning_date || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleSerialOk(item)}
                                    className={`px-2 py-1 rounded text-xs text-white ${
                                      tab === "outgoing" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                                    }`}
                                  >
                                    {tab === "outgoing" ? "Outgoing" : "Incoming"}
                                  </button>
                                  <button
                                    onClick={() => handleJoNotOk(item)}
                                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                                  >
                                    Not OK
                                  </button>
                                  <button
                                    onClick={() => handleSerialRework(item)}
                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                  >
                                    Rework
                                  </button>
                                </div>
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
                <h2 className="text-xl font-bold mb-4">Welding QC - All Services</h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">
                        {filterParam === "TSO_SERVICE" ? "TSO No" : filterParam === "KANBAN" ? "J/O Number" : "Job No"}
                      </th>
                      <th className="px-2 py-0 border border-tableBorder">Type</th>
                      <th className="px-2 py-0 border border-tableBorder">Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Worker</th>
                      <th className="px-2 py-0 border border-tableBorder">Total JO</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">Loading...</p>
                        </td>
                      </tr>
                    ) : jobIdentifiers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No welding items found.</p>
                        </td>
                      </tr>
                    ) : (
                      jobIdentifiers.map((identifier) => {
                        const summary = jobSummary[identifier];
                        if (!summary) return null;

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
                              {getJobTypeBadge(summary.jobType)}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.jobCategory}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.workerName}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.uniqueJoCount}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.totalQty}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.assigningDate}</p>
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

          <div className="text-xs text-gray-500 mt-3 px-2 flex justify-between">
            <div>
              Total Items: {filteredData.length} | 
              Jobs: {jobIdentifiers.filter(id => !id.startsWith('TSO:') && !id.startsWith('KANBAN:')).length} | 
              TSO: {jobIdentifiers.filter(id => id.startsWith('TSO:')).length} |
              KANBAN: {jobIdentifiers.filter(id => id.startsWith('KANBAN:')).length}
            </div>
            <div className="text-xs text-gray-400">
              ✅ Click on any row to view JO details with serial-wise actions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}