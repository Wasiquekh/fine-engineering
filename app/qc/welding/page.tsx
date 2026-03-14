"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import StorageManager from "../../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

type Row = {
  id: string;
  jo_no?: string | null;
  serial_no?: string | null;
  item_no?: number | null;
  quantity_no?: number | null;
  assigning_date?: string | null;
  status?: string | null;
  job_id?: string | null;
  jobId?: string | null;
  job_type?: string | null;  // Added to track job type
  job_category?: string | null; // Added for category
  tso_no?: string | null; // Added for TSO
  job_no?: string | null; // Added for Job Service/Kanban
  job?: { 
    id?: string | null;
    job_type?: string | null;
    tso_no?: string | null;
    job_no?: string | null;
    job_category?: string | null;
  } | null;
};

export default function QcWeldingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("ALL");

  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";
  const REVIEW_FOR = "welding";

  const status = useMemo(() => {
    return tab === "outgoing" ? "qc-welding" : "in-welding";
  }, [tab]);

  const getJobId = (r: Row) => r.jobId || r.job_id || r.job?.id;

  const buildQS = (additionalParams?: Record<string, string>) => {
    const q = new URLSearchParams();
    q.set("filter", filterParam);
    if (client) q.set("client", client);
    q.set("review_for", REVIEW_FOR);
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        q.set(key, value);
      });
    }
    return q.toString();
  };

  const goNotOkPage = () => {
    router.push(`/pp_not-ok/welding?${buildQS()}`);
  };

  const goReworkPage = () => {
    router.push(`/production_module?${buildQS()}`);
  };

  const goReviewPage = () => {
    router.push(`/review/welding?${buildQS()}`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL job types
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allRows: Row[] = [];

      for (const jobType of jobTypes) {
        const res = await axiosProvider.get("/fineengg_erp/assign-to-worker", {
          params: {
            status,
            job_type: jobType,
            ...(client ? { client_name: client } : {}),
          },
        } as any);

        const fetchedData = Array.isArray(res?.data?.data) ? res.data.data : [];
        
        // Add job_type to each item
        const dataWithJobType = fetchedData.map((item: any) => ({
          ...item,
          job_type: jobType
        }));
        
        allRows = [...allRows, ...dataWithJobType];
      }

      console.log(`Fetched ${allRows.length} items for ${status}`);
      setRows(allRows);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load QC Welding");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, client]); // Removed filterParam dependency since we're fetching all types

  // Filter by job type if selected
  const filteredRows = useMemo(() => {
    if (jobTypeFilter === "ALL") return rows;
    return rows.filter(row => (row.job_type || row.job?.job_type) === jobTypeFilter);
  }, [rows, jobTypeFilter]);

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
      title: "QC Welding • Outgoing",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          Job Type: <b>${r.job_type || r.job?.job_type || 'N/A'}</b><br/>
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
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Outgoing submit failed");
    }
  };

  const openIncomingForm = async (r: Row) => {
    const maxQty = Number(r.quantity_no ?? 0);

    const { value } = await Swal.fire({
      title: "QC Welding • Incoming",
      html: `
        <div style="text-align:left; font-size:13px; margin-bottom:8px;">
          Job Type: <b>${r.job_type || r.job?.job_type || 'N/A'}</b><br/>
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
          ? `Partial incoming saved (${value.qc_quantity}). Remaining will stay in-welding.`
          : "Incoming saved → moved to Review/Welding"
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

  // Get job type badge color
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

  // Count by job type
  const countsByType = useMemo(() => {
    const counts = {
      JOB_SERVICE: 0,
      TSO_SERVICE: 0,
      KANBAN: 0,
      TOTAL: rows.length
    };
    
    rows.forEach(row => {
      const type = row.job_type || row.job?.job_type;
      if (type === "JOB_SERVICE") counts.JOB_SERVICE++;
      else if (type === "TSO_SERVICE") counts.TSO_SERVICE++;
      else if (type === "KANBAN") counts.KANBAN++;
    });
    
    return counts;
  }, [rows]);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <LeftSideBar />
      <div className="md:ml-[17%]">
        <DesktopHeader />

        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-borderShadow border border-customBorder">
            <div className="px-6 pt-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-firstBlack">QC • Welding</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Outgoing = <b>qc-welding</b> | Incoming = <b>in-welding</b>
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">JOB: {countsByType.JOB_SERVICE}</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">TSO: {countsByType.TSO_SERVICE}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">KANBAN: {countsByType.KANBAN}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">TOTAL: {countsByType.TOTAL}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Job Type Filter */}
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="JOB_SERVICE">JOB_SERVICE</option>
                  <option value="TSO_SERVICE">TSO_SERVICE</option>
                  <option value="KANBAN">KANBAN</option>
                </select>

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
            </div>

            <div className="px-6 pb-6 overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left font-semibold px-4 py-3">Type</th>
                    <th className="text-left font-semibold px-4 py-3">JO No</th>
                    <th className="text-left font-semibold px-4 py-3">Serial No</th>
                    <th className="text-left font-semibold px-4 py-3">Item No</th>
                    <th className="text-left font-semibold px-4 py-3">Category</th>
                    <th className="text-left font-semibold px-4 py-3">Pending Qty</th>
                    <th className="text-left font-semibold px-4 py-3">Assigning Date</th>
                    <th className="text-right font-semibold px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No welding items found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-4">
                          {getJobTypeBadge(r.job_type || r.job?.job_type)}
                        </td>
                        <td className="px-4 py-4 font-medium">{r.jo_no || "-"}</td>
                        <td className="px-4 py-4">{r.serial_no || "-"}</td>
                        <td className="px-4 py-4">{r.item_no ?? "-"}</td>
                        <td className="px-4 py-4">{r.job_category || r.job?.job_category || "-"}</td>
                        <td className="px-4 py-4 font-semibold">{r.quantity_no ?? "-"}</td>
                        <td className="px-4 py-4">{r.assigning_date || "-"}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleAction(r)}
                            className={`px-4 py-2 rounded-md text-white font-semibold hover:opacity-90 ${
                              tab === "outgoing" ? "bg-blue-600" : "bg-green-600"
                            }`}
                          >
                            {tab === "outgoing" ? "Fill Outgoing" : "Fill Incoming"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="text-xs text-gray-500 mt-3 space-y-1">
                <p>✅ Welding Not OK goes to <b>/pp_not-ok/welding</b>. QC from that page returns to <b>/qc/welding</b>.</p>
                <p>📊 Showing all job types: JOB_SERVICE, TSO_SERVICE, KANBAN</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}