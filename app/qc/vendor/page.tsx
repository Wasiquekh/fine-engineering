"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const axiosProvider = new AxiosProvider();

type Row = {
  id: string;
  serial_no?: string;
  item_no?: number;
  quantity_no?: number; // ✅ pending qty for current row
  assigning_date?: string;
  vendor_name?: string | null;
  status?: string;
};

export default function QcVendorPage() {
  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  // ✅ vendor statuses only
  const status = useMemo(() => {
    return tab === "outgoing" ? "qc-vendor" : "in-vendor";
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosProvider.get("/fineengg_erp/assign-to-worker", {
        params: { status }
      } as any);     
      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load QC/Vendor");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      await axiosProvider.post(`/fineengg_erp/assign-to-worker/${r.id}/qc-outgoing`, value);
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
      await axiosProvider.post(`/fineengg_erp/assign-to-worker/${r.id}/qc-incoming`, value);
      toast.success(
        value.qc_quantity < maxQty
          ? `Partial incoming saved (${value.qc_quantity}). Remaining will stay in-vendor.`
          : "Incoming saved → moved to Review/Vendor"
      );
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Incoming submit failed");
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
                <h1 className="text-xl font-semibold text-firstBlack">QC • Vendor</h1>
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

            <div className="px-6 pb-6 overflow-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left font-semibold px-4 py-3">Serial No</th>
                    <th className="text-left font-semibold px-4 py-3">Item No</th>
                    <th className="text-left font-semibold px-4 py-3">Vendor Name</th>
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
                        No vendor items found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="px-4 py-4">{r.serial_no || "-"}</td>
                        <td className="px-4 py-4">{r.item_no ?? "-"}</td>
                        <td className="px-4 py-4">{r.vendor_name || "-"}</td>
                        <td className="px-4 py-4 font-semibold">{r.quantity_no ?? "-"}</td>
                        <td className="px-4 py-4">{r.assigning_date || "-"}</td>
                        <td className="px-4 py-4 text-right">
                          {tab === "outgoing" ? (
                            <button
                              onClick={() => openOutgoingForm(r)}
                              className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:opacity-90"
                            >
                              Fill Outgoing
                            </button>
                          ) : (
                            <button
                              onClick={() => openIncomingForm(r)}
                              className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:opacity-90"
                            >
                              Fill Incoming
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="text-xs text-gray-500 mt-3">
                ✅ Partial incoming/outgoing supported. Incoming moves to <b>Review/Vendor</b> with <b>review_for=vendor</b>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}