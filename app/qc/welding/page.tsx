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
  job_type?: string | null;
  job_category?: string | null;
  tso_no?: string | null;
  job_no?: string | null;
  machine_category?: string | null;
  machine_size?: string | null;
  machine_code?: string | null;
  worker_name?: string | null;
  vendor_name?: string | null;
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
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);

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

  // const goNotOkPage = () => {
  //   router.push(`/pp_not-ok/welding?${buildQS()}`);
  // };

  // const goReworkPage = () => {
  //   router.push(`/production_module?${buildQS()}`);
  // };

  // const goReviewPage = () => {
  //   router.push(`/review/welding?${buildQS()}`);
  // };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL job types
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allRows: Row[] = [];

      for (const jobType of jobTypes) {
        const res = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
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
  }, [status, client]);

  // Filter by job type if selected
  const filteredRows = useMemo(() => {
    if (jobTypeFilter === "ALL") return rows;
    return rows.filter(row => (row.job_type || row.job?.job_type) === jobTypeFilter);
  }, [rows, jobTypeFilter]);

  // Get unique job identifiers
  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    
    filteredRows.forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (jobType === "TSO_SERVICE") {
        const tsoNo = item.tso_no || item.job?.tso_no;
        if (tsoNo) ids.add(`TSO:${tsoNo}`);
      } else {
        const jobNo = item.job?.job_no;
        if (jobNo) ids.add(`JOB:${jobNo}`);
      }
    });
    
    return Array.from(ids);
  }, [filteredRows]);

  const getItemsForIdentifier = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    
    return filteredRows.filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (type === "TSO" && jobType === "TSO_SERVICE") {
        return (item.tso_no || item.job?.tso_no) === actualId;
      } else if (type === "JOB" && (jobType === "JOB_SERVICE" || jobType === "KANBAN")) {
        return item.job?.job_no === actualId;
      }
      return false;
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

  // Action confirmation helper
  const actionConfirm = async (title: string, text: string, confirm: string) => {
    const r = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirm,
    });
    return r.isConfirmed;
  };

  // SERIAL-WISE REWORK (using reject endpoint)
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

  // SERIAL-WISE NOT OK
  const handleSerialNotOk = async (item: Row) => {
    if (!item) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Mark as Not OK",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Serial No:</strong> ${item.serial_no || 'N/A'}</p>
          <p class="mb-2"><strong>JO No:</strong> ${item.jo_no || 'N/A'}</p>
          <p class="mb-2"><strong>Job Type:</strong> ${item.job_type || item.job?.job_type || 'N/A'}</p>
          <p class="mb-4"><strong>Quantity:</strong> ${item.quantity_no || 'N/A'}</p>
        </div>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for Not OK...",
      showCancelButton: true,
      confirmButtonText: "Yes, Mark Not OK",
      confirmButtonColor: "#f59e0b",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!isConfirmed || !reason) return;

    const job_id = getJobId(item);
    const updated_by = storage.getUserId();

    if (!job_id || !updated_by) {
      toast.error("Job or User not found");
      return;
    }

    try {
      await axiosProvider.post(`/fineengg_erp/system/jobs/${job_id}/not-ok`, {
        reason,
        updated_by,
        review_for: REVIEW_FOR,
      });

      toast.success(`Item ${item.serial_no} marked as Not OK`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to mark as Not OK");
    }
  };

  // SERIAL-WISE OK (outgoing/incoming)
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
      // goReviewPage();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Incoming submit failed");
    }
  };

  // Batch operations for JO
  const handleJoOk = async (items: Row[]) => {
    if (!items || items.length === 0) return;
    
    // For batch operations, we'll process each item individually
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        if (tab === "outgoing") {
          // For outgoing, we need gatepass etc. - better to handle individually
          toast.info(`Please process item ${item.serial_no} individually for outgoing`);
          return;
        } else {
          // For incoming, we can process in batch
          const maxQty = Number(item.quantity_no ?? 0);
          await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/qc-incoming`, {
            qc_date: new Date().toISOString().split('T')[0],
            qc_quantity: maxQty,
            review_for: REVIEW_FOR,
          });
          successCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} item(s) processed successfully`);
      fetchData();
    }
    if (failCount > 0) {
      toast.error(`Failed to process ${failCount} item(s)`);
    }
  };

  const handleJoNotOk = async (items: Row[]) => {
    if (!items || items.length === 0) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Mark JO as Not OK",
      html: `
        <p>Marking <strong>${items.length}</strong> item(s) as Not OK</p>
        <p class="text-sm text-gray-600 mt-2">This will mark all items in this JO as Not OK</p>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for Not OK...",
      showCancelButton: true,
      confirmButtonText: "Yes, Mark Not OK",
      confirmButtonColor: "#f59e0b",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!isConfirmed || !reason) return;

    const job_id = getJobId(items[0]);
    const updated_by = storage.getUserId();

    if (!job_id || !updated_by) {
      toast.error("Job or User not found");
      return;
    }

    try {
      await axiosProvider.post(`/fineengg_erp/system/jobs/${job_id}/not-ok`, {
        reason,
        updated_by,
        review_for: REVIEW_FOR,
      });

      toast.success(`${items.length} item(s) marked as Not OK`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to mark as Not OK");
    }
  };

  const handleJoRework = async (items: Row[]) => {
    if (!items || items.length === 0) return;

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Send JO for Rework",
      html: `
        <p>Sending <strong>${items.length}</strong> item(s) for rework</p>
        <p class="text-sm text-gray-600 mt-2">These items will be sent back to production with status "machine"</p>
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

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/reject`, {
          updated_by,
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} item(s) sent for rework successfully`);
    }
    if (failCount > 0) {
      toast.error(`Failed to process ${failCount} item(s)`);
    }
    
    fetchData();
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

  // Get identifier display name
  const getIdentifierDisplayName = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    if (type === "TSO") {
      return `TSO: ${actualId}`;
    }
    return actualId;
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

            <div className="px-6 pb-6 overflow-auto">
              {selectedJobNo ? (
                // Detailed view with JO grouping
                <div>
                  <button
                    onClick={() => setSelectedJobNo(null)}
                    className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    ← Back to Jobs
                  </button>

                  <h2 className="text-xl font-bold mb-4">
                    {getIdentifierDisplayName(selectedJobNo)}
                  </h2>

                  <table className="w-full min-w-[1200px] text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-600">
                        <th className="text-left font-semibold px-4 py-3">JO No</th>
                        <th className="text-left font-semibold px-4 py-3">Serial No</th>
                        <th className="text-left font-semibold px-4 py-3">Item No</th>
                        <th className="text-left font-semibold px-4 py-3">Category</th>
                        <th className="text-left font-semibold px-4 py-3">Machine Details</th>
                        <th className="text-left font-semibold px-4 py-3">Worker/Vendor</th>
                        <th className="text-left font-semibold px-4 py-3">Qty</th>
                        <th className="text-left font-semibold px-4 py-3">Date</th>
                        <th className="text-right font-semibold px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                        <Fragment key={jo}>
                          {/* JO Header with Batch Actions */}
                          <tr className="bg-gray-100 border-t-2 border-gray-300">
                            <td colSpan={2} className="px-4 py-2 font-semibold">
                              JO: {jo}
                            </td>
                            <td colSpan={3} className="px-4 py-2 text-xs text-gray-600">
                              {items.length} item(s)
                            </td>
                            <td colSpan={2} className="px-4 py-2"></td>
                            <td colSpan={2} className="px-4 py-2 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleJoOk(items)}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                  title="OK All"
                                >
                                  OK All
                                </button>
                                <button
                                  onClick={() => handleJoNotOk(items)}
                                  className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                                  title="Not OK All"
                                >
                                  Not OK All
                                </button>
                                <button
                                  onClick={() => handleJoRework(items)}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                  title="Rework All"
                                >
                                  Rework All
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Individual Items */}
                          {items.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3"></td>
                              <td className="px-4 py-3 font-mono">{item.serial_no || "-"}</td>
                              <td className="px-4 py-3">{item.item_no ?? "-"}</td>
                              <td className="px-4 py-3">{item.job_category || item.job?.job_category || "-"}</td>
                              <td className="px-4 py-3">
                                {item.machine_category || "-"} / {item.machine_size || "-"} / {item.machine_code || "-"}
                              </td>
                              <td className="px-4 py-3">{item.worker_name || item.vendor_name || "-"}</td>
                              <td className="px-4 py-3 font-semibold">{item.quantity_no ?? "-"}</td>
                              <td className="px-4 py-3">{item.assigning_date || "-"}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => handleSerialOk(item)}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                    title="OK"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => handleSerialNotOk(item)}
                                    className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                                    title="Not OK"
                                  >
                                    Not OK
                                  </button>
                                  <button
                                    onClick={() => handleSerialRework(item)}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                    title="Rework"
                                  >
                                    Rework
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Summary view
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="text-left font-semibold px-4 py-3">Job/TSO No</th>
                      <th className="text-left font-semibold px-4 py-3">Type</th>
                      <th className="text-left font-semibold px-4 py-3">Category</th>
                      <th className="text-left font-semibold px-4 py-3">Total JO</th>
                      <th className="text-left font-semibold px-4 py-3">Total Quantity</th>
                      <th className="text-left font-semibold px-4 py-3">Assigning Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : jobIdentifiers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          No welding items found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      jobIdentifiers.map((identifier) => {
                        const items = getItemsForIdentifier(identifier);
                        const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity_no) || 0), 0);
                        const uniqueJoCount = new Set(items.map(i => i.jo_no)).size;
                        const jobCategory = items[0]?.job_category || items[0]?.job?.job_category || "N/A";
                        const assigningDate = items[0]?.assigning_date || "-";
                        const jobType = items[0]?.job_type || items[0]?.job?.job_type || "JOB_SERVICE";

                        return (
                          <tr
                            key={identifier}
                            className="border-b hover:bg-primary-50 cursor-pointer"
                            onClick={() => setSelectedJobNo(identifier)}
                          >
                            <td className="px-4 py-4 font-medium text-blue-600">
                              {getIdentifierDisplayName(identifier)}
                            </td>
                            <td className="px-4 py-4">{getJobTypeBadge(jobType)}</td>
                            <td className="px-4 py-4">{jobCategory}</td>
                            <td className="px-4 py-4">{uniqueJoCount}</td>
                            <td className="px-4 py-4 font-semibold">{totalQty}</td>
                            <td className="px-4 py-4">{assigningDate}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {!selectedJobNo && (
                <div className="text-xs text-gray-500 mt-3 space-y-1">
                  <p>✅ Click on any row to view JO details with serial-wise actions</p>
                  <p>✅ Each serial can be marked OK, Not OK, or sent for Rework individually</p>
                  <p>📊 Showing all job types: JOB_SERVICE, TSO_SERVICE, KANBAN</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}