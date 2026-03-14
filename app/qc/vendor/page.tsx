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
  job?: { 
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    job_type?: string | null;
  } | null;
};

export default function QcVendorPage() {
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
  const REVIEW_FOR = "vendor";

  const status = useMemo(() => {
    return tab === "outgoing" ? "qc-vendor" : "in-vendor";
  }, [tab]);

  const getJobId = (r: Row) => r.jobId || r.job_id || r.job?.id;

  const buildQS = () => {
    const q = new URLSearchParams();
    q.set("filter", filterParam);
    if (client) q.set("client", client);
    q.set("review_for", REVIEW_FOR);
    return q.toString();
  };

  const goNotOkPage = () => {
    router.push(`/pp_not-ok/vendor?${buildQS()}`);
  };

  const goReworkPage = () => {
    router.push(`/production_module?${buildQS()}`);
  };

  const goReviewPage = () => {
    router.push(`/review/vendor?${buildQS()}`);
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/categories", {
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
      // Fetch all job types for vendor QC
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allData: Row[] = [];

      for (const jobType of jobTypes) {
        const res = await axiosProvider.get("/fineengg_erp/assign-to-worker", {
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
      const category = item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  }, [rows, jobServiceCategoryFilter]);

  // Get unique identifiers based on job type
  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    
    filteredData.forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (jobType === "TSO_SERVICE") {
        const tsoNo = item.tso_no || item.job?.tso_no;
        if (tsoNo) ids.add(`TSO:${tsoNo}`);
      } else if (jobType === "KANBAN") {
        const jobNo = item.job?.job_no;
        if (jobNo) ids.add(`KANBAN:${jobNo}`);
      } else {
        const jobNo = item.job?.job_no;
        if (jobNo) ids.add(`JOB:${jobNo}`);
      }
    });
    
    return Array.from(ids);
  }, [filteredData]);

  const getItemsForIdentifier = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    
    return filteredData.filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (type === "TSO" && jobType === "TSO_SERVICE") {
        return (item.tso_no || item.job?.tso_no) === actualId;
      } else if (type === "KANBAN" && jobType === "KANBAN") {
        return item.job?.job_no === actualId;
      } else if (type === "JOB" && jobType === "JOB_SERVICE") {
        return item.job?.job_no === actualId;
      }
      return false;
    });
  };

  const jobSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        totalQty: number;
        uniqueJoCount: number;
        jobCategory: string;
        assigningDate: string;
        jobType: string;
        vendorName: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = getItemsForIdentifier(identifier);

      const totalQty = items.reduce(
        (sum, item) => sum + (Number(item.quantity_no) || 0),
        0
      );

      const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;

      const jobCategory =
        items.length > 0
          ? items[0].job?.job_category || "N/A"
          : "N/A";

      const assigningDate = items.length > 0 ? items[0].assigning_date || "N/A" : "N/A";
      
      const jobType = items.length > 0 
        ? (items[0].job_type || items[0].job?.job_type || "JOB_SERVICE")
        : "JOB_SERVICE";

      const vendorName = items.length > 0 ? items[0].vendor_name || "N/A" : "N/A";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
        jobType,
        vendorName,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers]);

  const askDecision = async () => {
    const decision = await Swal.fire({
      title: "QC Result?",
      text: "Select what to do next",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "OK",
      denyButtonText: "Not OK",
      cancelButtonText: "Rework",
      confirmButtonColor: "#22c55e",
      denyButtonColor: "#f59e0b",
      cancelButtonColor: "#ef4444",
    });

    if (decision.isConfirmed) return "ok" as const;
    if (decision.isDenied) return "not_ok" as const;
    if (decision.dismiss === Swal.DismissReason.cancel) return "rework" as const;
    return "none" as const;
  };

  const doNotOk = async (r: Row) => {
    const { value: reason } = await Swal.fire({
      title: "Reason for Not OK",
      input: "textarea",
      inputPlaceholder: "Enter reason...",
      showCancelButton: true,
      confirmButtonText: "Submit",
      confirmButtonColor: "#d33",
    });

    if (!reason) return;

    const job_id = getJobId(r);
    const updated_by = storage.getUserId();

    if (!job_id || !updated_by) {
      toast.error("Job ID / User ID missing");
      return;
    }

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/not-ok`, {
        reason,
        updated_by,
        review_for: REVIEW_FOR,
      });

      toast.success("Marked Not OK");
      goNotOkPage();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Not OK failed");
    }
  };

  const doRework = async (r: Row) => {
    const updated_by = storage.getUserId();
  
    if (!updated_by) {
      toast.error("User ID missing");
      return;
    }
  
    // Ask for confirmation with reason
    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Send for Rework",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Job Type:</strong> ${r.job_type || r.job?.job_type || 'N/A'}</p>
          <p class="mb-2"><strong>JO No:</strong> ${r.jo_no || 'N/A'}</p>
          <p class="mb-2"><strong>Serial No:</strong> ${r.serial_no || 'N/A'}</p>
          <p class="mb-4"><strong>Quantity:</strong> ${r.quantity_no || 'N/A'}</p>
          <p class="text-sm text-gray-600">This item will be sent back to production with status "machine"</p>
        </div>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for rework...",
      inputAttributes: {
        'aria-label': 'rework reason'
      },
      showCancelButton: true,
      confirmButtonText: "Yes, Send to Rework",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
      width: '500px',
    });
  
    if (!isConfirmed || !reason) return;
  
    try {
      // Use the correct endpoint: /assign-to-worker/:id/reject
      await axiosProvider.post(`/fineengg_erp/assign-to-worker/${r.id}/reject`, {
        updated_by,
        // Note: Your current backend doesn't accept reason, but we'll keep it for future
        // reason: reason 
      });
  
      toast.success(`Item ${r.serial_no || ''} sent for Rework`);
      
      // Navigate to production module or refresh data
      // goReworkPage(); // Uncomment if you want to navigate away
      fetchData(); // Refresh the current page data
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Rework failed");
    }
  };

  const openOutgoingForm = async (r: Row) => {
    const maxQty = Number(r.quantity_no ?? 0);

    const { value } = await Swal.fire({
      title: "QC Vendor • Outgoing",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          Pending Qty: <b>${maxQty}</b>
        </div>
        <input id="qc_date" type="date" class="swal2-input" />
        <input id="qc_quantity" type="number" class="swal2-input" placeholder="QC Quantity (<= ${maxQty})" />
        <input id="gatepass_no" type="text" class="swal2-input" placeholder="Gatepass No" />
      `,
      showCancelButton: true,
      confirmButtonText: "Submit Outgoing",
      preConfirm: () => {
        const qc_date = (document.getElementById("qc_date") as HTMLInputElement)?.value;
        const qc_quantity = Number(
          (document.getElementById("qc_quantity") as HTMLInputElement)?.value || 0
        );
        const gatepass_no = (document.getElementById("gatepass_no") as HTMLInputElement)?.value?.trim();

        if (!qc_date) return Swal.showValidationMessage("QC Date required");
        if (!qc_quantity || qc_quantity <= 0) return Swal.showValidationMessage("QC Quantity required");
        if (qc_quantity > maxQty) return Swal.showValidationMessage(`QC Quantity cannot exceed ${maxQty}`);
        if (!gatepass_no) return Swal.showValidationMessage("Gatepass No required");

        return { qc_date, qc_quantity, gatepass_no };
      },
    });

    if (!value) return;

    try {
      await axiosProvider.post(`/fineengg_erp/assign-to-worker/${r.id}/qc-outgoing`, {
        ...value,
        review_for: REVIEW_FOR,
      });

      toast.success(
        value.qc_quantity < maxQty
          ? `Partial outgoing saved (${value.qc_quantity}). Remaining will stay pending.`
          : "Outgoing saved"
      );
      fetchData();
      setSelectedJobNo(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Outgoing submit failed");
    }
  };

  const openIncomingForm = async (r: Row) => {
    const maxQty = Number(r.quantity_no ?? 0);

    const { value } = await Swal.fire({
      title: "QC Vendor • Incoming",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          Pending Qty: <b>${maxQty}</b>
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

    if (!value) return;

    try {
      await axiosProvider.post(`/fineengg_erp/assign-to-worker/${r.id}/qc-incoming`, {
        ...value,
        review_for: REVIEW_FOR,
      });

      toast.success(
        value.qc_quantity < maxQty
          ? `Partial incoming saved (${value.qc_quantity}). Remaining will stay in-vendor.`
          : "Incoming saved → moved to Review/Vendor"
      );
      goReviewPage();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Incoming submit failed");
    }
  };

  const handleAction = async (r: Row) => {
    const d = await askDecision();

    if (d === "ok") {
      if (tab === "outgoing") return openOutgoingForm(r);
      return openIncomingForm(r);
    }

    if (d === "not_ok") return doNotOk(r);
    if (d === "rework") return doRework(r);
  };

  // Get display name for identifier
  const getIdentifierDisplayName = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    if (type === "TSO") {
      return `TSO: ${actualId}`;
    } else if (type === "KANBAN") {
      return `KANBAN: ${actualId}`;
    }
    return actualId;
  };

  // Get job type badge color
  const getJobTypeBadge = (jobType: string) => {
    switch(jobType) {
      case "TSO_SERVICE":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TSO</span>;
      case "KANBAN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">KANBAN</span>;
      default:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">JOB</span>;
    }
  };

  // Count by job type
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

  // Group items by JO No for display
  const groupItemsByJo = (items: Row[]) => {
    const groups: Record<string, Row[]> = {};
    items.forEach((item) => {
      const jo = item.jo_no || "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });
    return groups;
  };

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

              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setTab("outgoing")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                    tab === "outgoing"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  Outgoing
                </button>
                <button
                  onClick={() => setTab("incoming")}
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
                  Details: {getIdentifierDisplayName(selectedJobNo)}
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
                      <th className="px-2 py-0 border border-tableBorder">Vendor Name</th>
                      <th className="px-2 py-0 border border-tableBorder">Pending Qty</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                      <th className="px-2 py-0 border border-tableBorder">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const items = getItemsForIdentifier(selectedJobNo);
                      const groupedByJo = groupItemsByJo(items);
                      
                      if (Object.keys(groupedByJo).length === 0) {
                        return (
                          <tr>
                            <td colSpan={11} className="px-4 py-6 text-center border border-tableBorder">
                              <p className="text-[#666666] text-base">No JO data found</p>
                            </td>
                          </tr>
                        );
                      }

                      return Object.entries(groupedByJo).map(([jo, joItems]) => (
                        <Fragment key={jo}>
                          {/* JO Group Header */}
                          <tr className="border border-tableBorder bg-gray-100">
                            <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={11}>
                              JO: {jo}
                            </td>
                          </tr>
                          
                          {/* Individual Items with Actions */}
                          {joItems.map((item) => (
                            <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                              <td className="px-2 py-2 border border-tableBorder"></td>
                              <td className="px-2 py-2 border border-tableBorder">
                                {getJobTypeBadge(item.job_type || item.job?.job_type || "JOB_SERVICE")}
                              </td>
                              <td className="px-2 py-2 border border-tableBorder font-mono">{item.serial_no || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_category || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_size || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_code || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.vendor_name || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder font-semibold">{item.quantity_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.assigning_date || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                <button
                                  onClick={() => handleAction(item)}
                                  className={`px-3 py-1.5 rounded-md text-white text-xs font-semibold hover:opacity-90 ${
                                    tab === "outgoing" ? "bg-blue-600" : "bg-green-600"
                                  }`}
                                >
                                  {tab === "outgoing" ? "Fill Outgoing" : "Fill Incoming"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ));
                    })()}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Vendor QC - All Services</h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">Job/TSO No</th>
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

                        return (
                          <tr
                            key={identifier}
                            className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                            onClick={() => setSelectedJobNo(identifier)}
                          >
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-blue-600 text-base leading-normal">
                                {getIdentifierDisplayName(identifier)}
                              </p>
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

          <div className="text-xs text-gray-500 mt-3 px-2 flex justify-between">
            <div>
              Total Items: {filteredData.length} | 
              Jobs: {jobIdentifiers.filter(id => id.startsWith('JOB:')).length} | 
              TSO: {jobIdentifiers.filter(id => id.startsWith('TSO:')).length} |
              KANBAN: {jobIdentifiers.filter(id => id.startsWith('KANBAN:')).length}
            </div>
            <div className="text-xs text-gray-400">
              ✅ Vendor Not OK goes to <b>/pp_not-ok/vendor</b>. QC from that page returns to <b>/qc/vendor</b>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}