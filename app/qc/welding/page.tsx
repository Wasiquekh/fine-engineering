"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import StorageManager from "../../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

type Row = {
  id: string;
  jo_no?: string;
  serial_no?: string;
  item_no?: number;
  quantity_no?: number;
  assigning_date?: string;
  status?: string;
  job_id?: string;
  jobId?: string;
  job?: { id?: string };
};

export default function QcWeldingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";
  const REVIEW_FOR = "welding";

  const status = useMemo(() => {
    return tab === "outgoing" ? "qc-welding" : "in-welding";
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosProvider.get("/fineengg_erp/assign-to-worker", {
        params: {
          status,
          job_type: filterParam,
          ...(client ? { client } : {}),
        },
      } as any);

      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load QC/Welding");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterParam, client]);

  const getJobId = (r: Row) => r.jobId || r.job_id || r.job?.id;

  const buildQS = () => {
    const q = new URLSearchParams();
    q.set("filter", filterParam);
    if (client) q.set("client", client);
    q.set("review_for", REVIEW_FOR);
    return q;
  };

  const goNotOkPage = () => {
    const q = buildQS();
    router.push(`/pp_not-ok?${q.toString()}`);
  };

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

    if (!job_id) return toast.error("Job ID missing");
    if (!updated_by) return toast.error("User ID missing");

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
    const job_id = getJobId(r);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID missing");
    if (!updated_by) return toast.error("User ID missing");

    const result = await Swal.fire({
      title: "Send for rework?",
      text: "This job will go back for rework.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Rework",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/rework`, { updated_by });
      toast.success("Sent for Rework");
      fetchData();
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
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Incoming submit failed");
    }
  };

  const handleAction = async (r: Row) => {
    const decision = await askDecision();

    if (decision === "ok") {
      if (tab === "outgoing") {
        return openOutgoingForm(r);
      }
      return openIncomingForm(r);
    }

    if (decision === "not_ok") {
      return doNotOk(r);
    }

    if (decision === "rework") {
      return doRework(r);
    }
  };

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

            <div className="px-6 pb-6 overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left font-semibold px-4 py-3">JO No</th>
                    <th className="text-left font-semibold px-4 py-3">Serial No</th>
                    <th className="text-left font-semibold px-4 py-3">Item No</th>
                    <th className="text-left font-semibold px-4 py-3">Pending Qty</th>
                    <th className="text-left font-semibold px-4 py-3">Assigning Date</th>
                    <th className="text-right font-semibold px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No welding items found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="px-4 py-4">{r.jo_no || "-"}</td>
                        <td className="px-4 py-4">{r.serial_no || "-"}</td>
                        <td className="px-4 py-4">{r.item_no ?? "-"}</td>
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

              <div className="text-xs text-gray-500 mt-3">
                ✅ On click you will get <b>OK</b>, <b>Not OK</b>, and <b>Rework</b>.  
                OK opens form, Not OK moves to <b>Not OK / Welding</b>, Rework sends job to rework.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}