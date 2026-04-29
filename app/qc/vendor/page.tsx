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
import { sendRoleNotificationByEvent } from "../../services/pushNotificationApi";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some((p) => p.name === permissionName);
};

const canPerformQcVendorAction = (
  permissions: any[] | null,
  clientName: string
): boolean => {
  if (!permissions) return false;

  const normalizedClient = String(clientName || "").toLowerCase();
  const clientKey = normalizedClient.includes("equip")
    ? "eqp"
    : normalizedClient.includes("bio")
    ? "bio"
    : null;

  if (clientKey) {
    // Strict check: only exact QC vendor edit permission for current client
    return hasPermission(permissions, `qc.${clientKey}.vendor.edit`);
  }

  // No client in URL: allow if user has either vendor QC edit
  return (
    hasPermission(permissions, "qc.eqp.vendor.edit") ||
    hasPermission(permissions, "qc.bio.vendor.edit")
  );
};

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
  job_type?: string | null;
  tso_no?: string | null;
  job_category?: string | null;
  worker_name?: string | null;
  job_no?: string | null;
  job?: { 
    id?: string | null;
    job_no?: string | null;
    jo_number?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    job_type?: string | null;
    item_description?: string | null;
    moc?: string | null;
    client_name?: string | null;
  } | null;
};

export default function QcVendorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = String(searchParams.get("tab") || "").toLowerCase();
  const [tab, setTab] = useState<"outgoing" | "incoming">(
    tabParam === "incoming" ? "incoming" : "outgoing"
  );
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const filterParam = searchParams.get("filter") || "ALL";
  const client = searchParams.get("client") || "";
  const REVIEW_FOR = "vendor";
  const permissions = storage.getUserPermissions();
  const currentUserName = storage.getUserName() || storage.getUserEmail() || "";
  const canQcEdit = canPerformQcVendorAction(permissions, client);

  const status = useMemo(() => {
    return tab === "outgoing" ? "qc-vendor" : "in-vendor";
  }, [tab]);

  const getJobId = (r: Row) => r.jobId || r.job_id || r.job?.id;
  const notifyEvent = async (eventKey: string, item: Row, source: string) => {
    await sendRoleNotificationByEvent({
      eventKey,
      joNo: String(item.jo_no || item.job?.jo_number || ""),
      joNumber: String(item.job?.jo_number || item.jo_no || ""),
      jobNo: String(item.job_no || item.job?.job_no || item.tso_no || item.job?.tso_no || ""),
      clientName: String(item.job?.client_name || client || ""),
      jobType: String(item.job_type || item.job?.job_type || filterParam || "JOB_SERVICE"),
      assignedBy: currentUserName,
      sendAll: false,
      source,
    });
  };

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

      setRows(allData);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load QC Vendor");
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

  // Same as QC Welding - using jo_no directly
  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const groups: Record<string, Row[]> = {};
  
    items.forEach((item) => {
      let jo = item.jo_no;
      
      // If jo_no is null/empty, generate from serial_no
      if (!jo && item.serial_no) {
        // Extract JO number from serial_no
        // Example: "JSA-8091-JO/AE/2526/08011-01-0001" -> "JSA-8091-JO/AE/2526/08011"
        const match = item.serial_no.match(/^([^-]+-[^-]+-[^/]+\/[^/]+\/[^/]+)/);
        if (match) {
          jo = match[1];
        } else {
          // Fallback: take first 20 characters
          jo = item.serial_no.substring(0, 20);
        }
      }
      
      if (!jo) jo = "Unknown";
      
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });
  
    return groups;
  };

  const jobSummary = useMemo(() => {
    const summary: Record<string, any> = {};
    jobIdentifiers.forEach((identifier) => {
      const items = getItemsForIdentifier(identifier);
      const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
      const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;
      const jobCategory = items.length > 0 ? items[0].job_category || items[0].job?.job_category || "N/A" : "N/A";
      const assigningDate = items.length > 0 ? items[0].assigning_date || "N/A" : "N/A";
      const vendorName = items.length > 0 ? items[0].vendor_name || "N/A" : "N/A";
      const jobType = items.length > 0 ? items[0].job_type || items[0].job?.job_type || "JOB_SERVICE" : "JOB_SERVICE";
      summary[identifier] = { totalQty, uniqueJoCount, jobCategory, assigningDate, vendorName, jobType };
    });
    return summary;
  }, [filteredData, jobIdentifiers]);

  // ========== SERIAL-WISE REWORK ==========
  const handleSerialRework = async (item: Row) => {
    if (!canQcEdit) {
      toast.error("You don't have permission for Vendor QC actions");
      return;
    }
    if (!item) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Send for Rework",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p class="mb-2"><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p class="mb-4"><strong>Quantity:</strong> ${item.quantity_no || 'N/A'}</p>
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
      await notifyEvent("returned_to_in_progress", item, "qc_vendor_rework");
      toast.success(`Item ${item.serial_no} sent for rework`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Rework failed");
    }
  };

  // ========== SERIAL-WISE NOT OK with QUANTITY ==========
  const handleSerialNotOk = async (item: Row) => {
    if (!canQcEdit) {
      toast.error("You don't have permission for Vendor QC actions");
      return;
    }
    if (!item) return;

    const maxQty = Number(item.quantity_no ?? 0);
    
    const { value: result, isConfirmed } = await Swal.fire({
      title: `Mark as NOT OK - ${item.serial_no || 'N/A'}`,
      html: `
        <div class="text-left">
          <div class="bg-red-50 p-3 rounded-lg mb-4">
            <p class="font-semibold">Serial No: <span class="text-red-600">${item.serial_no || 'N/A'}</span></p>
            <p class="text-sm text-gray-600">JO No: ${item.jo_no || 'N/A'}</p>
            <p class="text-sm text-gray-600">Total Quantity Available: <span class="font-bold">${maxQty}</span></p>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Not OK Quantity:</label>
            <input id="notok_qty" type="number" class="swal2-input w-full" value="${maxQty}" min="1" max="${maxQty}" required />
            <p class="text-xs text-gray-500 mt-1">Enter quantity to mark as NOT OK (remaining will stay in-${REVIEW_FOR})</p>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason <span class="text-red-500">*</span></label>
            <textarea id="reason" class="swal2-textarea w-full" rows="3" placeholder="Enter reason for NOT OK..." required></textarea>
          </div>
        </div>
      `,
      width: '550px',
      showCancelButton: true,
      confirmButtonText: "Mark as NOT OK",
      confirmButtonColor: "#d33",
      preConfirm: () => {
        const notOkQty = parseInt((document.getElementById("notok_qty") as HTMLInputElement)?.value || "0");
        const reason = (document.getElementById("reason") as HTMLTextAreaElement)?.value;
        
        if (!notOkQty || notOkQty <= 0) {
          Swal.showValidationMessage("Please enter valid quantity");
          return false;
        }
        if (notOkQty > maxQty) {
          Swal.showValidationMessage(`Quantity cannot exceed ${maxQty}`);
          return false;
        }
        if (!reason || reason.trim() === "") {
          Swal.showValidationMessage("Reason is required!");
          return false;
        }
        
        return { notOkQty, reason: reason.trim() };
      },
    });

    if (!isConfirmed || !result) return;

    const job_id = getJobId(item);
    const updated_by = storage.getUserId();

    if (!job_id || !updated_by) {
      toast.error("Job or User not found");
      return;
    }

    const loadingToast = toast.loading(`Marking ${item.serial_no} as NOT OK...`);

    try {
      const response = await axiosProvider.post(`/fineengg_erp/system/jobs/${job_id}/not-ok`, {
        items: [{
          assignment_id: item.id,
          quantity: result.notOkQty
        }],
        reason: result.reason,
        updated_by: updated_by,
        review_for: REVIEW_FOR,
      });

      toast.dismiss(loadingToast);

      if (response?.data?.success) {
        await notifyEvent("job_rejected", item, "qc_vendor_not_ok");
        const remainingQty = maxQty - result.notOkQty;
        toast.warning(
          <div>
            <div className="font-semibold text-red-600">⚠️ Marked as NOT OK!</div>
            <div className="text-sm mt-1">Serial: <span className="font-mono">{item.serial_no}</span></div>
            <div className="text-sm">Not OK Qty: <span className="font-bold">{result.notOkQty}</span></div>
            {remainingQty > 0 && (
              <div className="text-sm text-orange-600">Remaining: {remainingQty} quantity still in-${REVIEW_FOR}</div>
            )}
          </div>,
          { autoClose: 5000 }
        );
        fetchData();
      } else {
        toast.error(response?.data?.error || "Failed to mark as NOT OK");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error?.response?.data?.error || "Failed to mark as NOT OK");
    }
  };

  // ========== SERIAL-WISE OK ==========
  const handleSerialOk = async (item: Row) => {
    if (!canQcEdit) {
      toast.error("You don't have permission for Vendor QC actions");
      return;
    }
    if (tab === "outgoing") {
      await openOutgoingForm(item);
    } else {
      await openIncomingForm(item);
    }
  };

  const openOutgoingForm = async (item: Row) => {
    const maxQty = Number(item.quantity_no ?? 0);

    const { value, isConfirmed } = await Swal.fire({
      title: "QC Vendor • Outgoing",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          <p><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p><strong>Pending Qty:</strong> <b>${maxQty}</b></p>
        </div>
        <input id="qc_date" type="date" class="swal2-input" />
        <input id="qc_quantity" type="number" class="swal2-input" placeholder="QC Quantity (<= ${maxQty})" />
        <input id="gatepass_no" type="text" class="swal2-input" placeholder="Gatepass No" />
      `,
      showCancelButton: true,
      confirmButtonText: "Submit Outgoing",
      preConfirm: () => {
        const qc_date = (document.getElementById("qc_date") as HTMLInputElement)?.value;
        const qc_quantity = Number((document.getElementById("qc_quantity") as HTMLInputElement)?.value || 0);
        const gatepass_no = (document.getElementById("gatepass_no") as HTMLInputElement)?.value?.trim();

        if (!qc_date) return Swal.showValidationMessage("QC Date required");
        if (!qc_quantity || qc_quantity <= 0) return Swal.showValidationMessage("QC Quantity required");
        if (qc_quantity > maxQty) return Swal.showValidationMessage(`QC Quantity cannot exceed ${maxQty}`);
        if (!gatepass_no) return Swal.showValidationMessage("Gatepass No required");

        return { qc_date, qc_quantity, gatepass_no };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/qc-outgoing`, {
        ...value,
        review_for: REVIEW_FOR,
      });
      await notifyEvent("sent_to_vendor", item, "qc_vendor_outgoing");

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
      title: "QC Vendor • Incoming",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          <p><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p><strong>Pending Qty:</strong> <b>${maxQty}</b></p>
        </div>
        <input id="qc_date" type="date" class="swal2-input" />
        <input id="qc_quantity" type="number" class="swal2-input" placeholder="Incoming Qty (<= ${maxQty})" />
      `,
      showCancelButton: true,
      confirmButtonText: "Submit Incoming",
      preConfirm: () => {
        const qc_date = (document.getElementById("qc_date") as HTMLInputElement)?.value;
        const qc_quantity = Number((document.getElementById("qc_quantity") as HTMLInputElement)?.value || 0);

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
      await notifyEvent("moved_to_qc", item, "qc_vendor_incoming");

      toast.success(
        value.qc_quantity < maxQty
          ? `Partial incoming saved (${value.qc_quantity}). Remaining will stay in-vendor.`
          : "Incoming saved"
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
                  QC • Vendor
                  {client && ` • ${client}`}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Outgoing = <b>qc-vendor</b> | Incoming = <b>in-vendor</b>
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
                      <th className="px-2 py-0 border border-tableBorder">Item Description</th>
                      <th className="px-2 py-0 border border-tableBorder">Item No</th>
                      <th className="px-2 py-0 border border-tableBorder">MOC</th>
                      <th className="px-2 py-0 border border-tableBorder">Vendor Name</th>
                      <th className="px-2 py-0 border border-tableBorder">Pending Qty</th>
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
                            <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={10}>
                              JO: {jo} ({items.length} item(s))
                            </td>
                          </tr>
                          
                          {items.map((item) => (
                            <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                              <td className="px-2 py-2 border border-tableBorder">{jo}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                {getJobTypeBadge(item.job_type || item.job?.job_type || "JOB_SERVICE")}
                              </td>
                              <td className="px-2 py-2 border border-tableBorder font-mono">{item.serial_no || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.job?.item_description || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.job?.moc || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.vendor_name || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder font-semibold">{item.quantity_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.assigning_date || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleSerialOk(item)}
                                    className={`px-2 py-1 rounded text-xs ${
                                      canQcEdit
                                        ? `text-white ${
                                            tab === "outgoing"
                                              ? "bg-blue-600 hover:bg-blue-700"
                                              : "bg-green-600 hover:bg-green-700"
                                          }`
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    disabled={!canQcEdit}
                                  >
                                    {tab === "outgoing" ? "Outgoing" : "Incoming"}
                                  </button>
                                  <button
                                    onClick={() => handleSerialNotOk(item)}
                                    className={`px-2 py-1 rounded text-xs ${
                                      canQcEdit
                                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    disabled={!canQcEdit}
                                  >
                                    Not OK
                                  </button>
                                  <button
                                    onClick={() => handleSerialRework(item)}
                                    className={`px-2 py-1 rounded text-xs ${
                                      canQcEdit
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    disabled={!canQcEdit}
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
                <h2 className="text-lg font-bold mb-4">Vendor QC - All Services</h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">
                        {filterParam === "TSO_SERVICE" ? "TSO No" : filterParam === "KANBAN" ? "J/O Number" : "Job No"}
                      </th>
                      <th className="px-2 py-0 border border-tableBorder">Type</th>
                      <th className="px-2 py-0 border border-tableBorder">Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Vendor</th>
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
                          <p className="text-[#666666] text-base">No vendor items found.</p>
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
                              <p className="text-[#232323] text-base">{summary.vendorName}</p>
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