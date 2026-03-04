"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import { toast } from "react-toastify";
import { ASSIGN_STATUS } from "../../constants/assignStatus";
import { getAssignments, postAssignVendor } from "../../services/assignToWorkerApi";

type Row = any;

const VENDOR_OPTIONS = ["Ashfaq", "Others"];

export default function VendorOutsourcePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // per-row UI states
  const [vendorPick, setVendorPick] = useState<Record<string, string>>({});
  const [otherName, setOtherName] = useState<Record<string, string>>({});

  const jobType = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    return url.searchParams.get("filter") || "";
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAssignments({
        status: ASSIGN_STATUS.VENDOR_OUTSOURCE,
        job_type: jobType || undefined,
      });

      const list = Array.isArray(data) ? data : data?.data || [];
      setRows(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load outsource list");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobType]);

  const onAssign = async (r: Row) => {
    const picked = vendorPick[r.id] || "Ashfaq";
    const finalName = picked === "Others" ? (otherName[r.id] || "").trim() : picked;

    if (!finalName) {
      toast.error("Please enter vendor name for Others");
      return;
    }

    try {
      await postAssignVendor(r.id, finalName);
      toast.success(`Assigned to vendor: ${finalName}`);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to assign vendor");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <LeftSideBar />
      <div className="md:ml-[17%]">
        <DesktopHeader />

        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-borderShadow border border-customBorder">
            {/* Header (same style as QC Welding) */}
            <div className="px-6 pt-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-firstBlack">Vendor Outsource</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Job Type: <span className="font-semibold">{jobType || "-"}</span> | Status:{" "}
                  <span className="font-semibold">{ASSIGN_STATUS.VENDOR_OUTSOURCE}</span>
                </p>
              </div>

              {loading ? (
                <div className="text-sm text-gray-500 font-medium">Loading...</div>
              ) : null}
            </div>

            {/* Table (same table shell as QC Welding) */}
            <div className="px-6 pb-6 overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left font-semibold px-4 py-3">Job No</th>
                    <th className="text-left font-semibold px-4 py-3">J/O No</th>
                    <th className="text-left font-semibold px-4 py-3">Serial No</th>
                    <th className="text-left font-semibold px-4 py-3">Item No</th>
                    <th className="text-left font-semibold px-4 py-3">Worker</th>
                    <th className="text-left font-semibold px-4 py-3">Qty</th>
                    <th className="text-left font-semibold px-4 py-3">Assigning Date</th>
                    <th className="text-right font-semibold px-4 py-3">Assign Vendor</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No outsource items found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const picked = vendorPick[r.id] || "Ashfaq";
                      return (
                        <tr key={r.id} className="border-b last:border-b-0">
                          <td className="px-4 py-4">{r?.job?.job_no || r?.job_no || "-"}</td>
                          <td className="px-4 py-4">{r?.jo_no || r?.job?.jo_number || "-"}</td>
                          <td className="px-4 py-4 font-medium">{r?.serial_no || "-"}</td>
                          <td className="px-4 py-4">{r?.item_no ?? "-"}</td>
                          <td className="px-4 py-4">{r?.worker_name || "-"}</td>
                          <td className="px-4 py-4">{r?.quantity_no ?? "-"}</td>
                          <td className="px-4 py-4">{r?.assigning_date || "-"}</td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <select
                                  className="border border-customBorder bg-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200"
                                  value={picked}
                                  onChange={(e) =>
                                    setVendorPick((p) => ({ ...p, [r.id]: e.target.value }))
                                  }
                                >
                                  {VENDOR_OPTIONS.map((v) => (
                                    <option key={v} value={v}>
                                      {v}
                                    </option>
                                  ))}
                                </select>

                                {picked === "Others" ? (
                                  <input
                                    className="border border-customBorder bg-white rounded-lg px-3 py-2 text-sm w-[220px] outline-none focus:ring-2 focus:ring-primary-200"
                                    placeholder="Vendor name"
                                    value={otherName[r.id] || ""}
                                    onChange={(e) =>
                                      setOtherName((p) => ({ ...p, [r.id]: e.target.value }))
                                    }
                                  />
                                ) : null}

                                <button
                                  onClick={() => onAssign(r)}
                                  className="px-4 py-2 rounded-md bg-primary-600 text-white font-semibold hover:opacity-90"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 pb-6 text-xs text-gray-500">
              Note: Vendor outsource page hides Machine Code / Size / Category.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}