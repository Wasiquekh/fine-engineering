"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { AxiosHeaders } from "axios";

const axiosProvider = new AxiosProvider();

type Row = {
  id: string;
  serial_no?: string;
  jo_no?: string;
  item_no?: number;
  machine_category?: string;
  machine_size?: string;
  machine_code?: string;
  worker_name?: string | null;
  vendor_name?: string | null;
  status?: string;
  quantity_no?: number;
  assigning_date?: string;
  qc_date?: string;
  qc_quantity?: number;
  gatepass_no?: string | null;
  updated_at?: string;
};

export default function MaterialMovementPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [machineCategory, setMachineCategory] = useState("");
  const [machineSize, setMachineSize] = useState("");
  const [machineCode, setMachineCode] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);

  const params = useMemo(() => {
    return {
      q: q || undefined,
      status: status || undefined,
      machine_category: machineCategory || undefined,
      machine_size: machineSize || undefined,
      machine_code: machineCode || undefined,
      page,
      limit,
    };
  }, [q, status, machineCategory, machineSize, machineCode, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosProvider.get("/fineengg_erp/material-movement", { 
        params,
        headers: new AxiosHeaders()
      });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setRows(list);

      const pg = res?.data?.pagination;
      setTotalPages(pg?.pages || 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load Material Movement");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const statusBadge = (s?: string) => {
    const v = s || "-";
    const base = "px-2 py-1 rounded text-xs font-semibold";
    if (v === "in-progress") return <span className={`${base} bg-blue-100 text-blue-700`}>{v}</span>;
    if (v === "in-review") return <span className={`${base} bg-yellow-100 text-yellow-800`}>{v}</span>;
    if (v.includes("qc")) return <span className={`${base} bg-green-100 text-green-700`}>{v}</span>;
    if (v === "vendor-outsource") return <span className={`${base} bg-purple-100 text-purple-700`}>{v}</span>;
    if (v === "completed") return <span className={`${base} bg-gray-200 text-gray-700`}>{v}</span>;
    if (v === "rejected" || v === "not-ok") return <span className={`${base} bg-red-100 text-red-700`}>{v}</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{v}</span>;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <LeftSideBar />
      <div className="md:ml-[17%]">
        <DesktopHeader />

        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-borderShadow border border-customBorder">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-firstBlack">Material Movement</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Live view of serial/material status by machine + worker/vendor
                </p>
              </div>
              {loading ? <span className="text-sm text-gray-500">Loading...</span> : null}
            </div>

            {/* Filters */}
            <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search Serial / JO / Item / Machine / Worker"
                className="border rounded-md px-3 py-2 text-sm"
              />

              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="in-progress">in-progress</option>
                <option value="in-review">in-review</option>
                <option value="ready-for-qc">ready-for-qc</option>
                <option value="qc-welding">qc-welding</option>
                <option value="in-welding">in-welding</option>
                <option value="qc-vendor">qc-vendor</option>
                <option value="in-vendor">in-vendor</option>
                <option value="vendor-outsource">vendor-outsource</option>
                <option value="completed">completed</option>
                <option value="not-ok">not-ok</option>
                <option value="rejected">rejected</option>
              </select>

              <input
                value={machineCategory}
                onChange={(e) => {
                  setPage(1);
                  setMachineCategory(e.target.value);
                }}
                placeholder="Machine Category (Lathe...)"
                className="border rounded-md px-3 py-2 text-sm"
              />

              <input
                value={machineSize}
                onChange={(e) => {
                  setPage(1);
                  setMachineSize(e.target.value);
                }}
                placeholder="Machine Size (Small/Medium/Big)"
                className="border rounded-md px-3 py-2 text-sm"
              />

              <input
                value={machineCode}
                onChange={(e) => {
                  setPage(1);
                  setMachineCode(e.target.value);
                }}
                placeholder="Machine Code"
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Table */}
            <div className="px-6 pb-6 overflow-auto">
              <table className="w-full min-w-[1300px] text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="text-left font-semibold px-4 py-3">Serial</th>
                    <th className="text-left font-semibold px-4 py-3">JO</th>
                    <th className="text-left font-semibold px-4 py-3">Item</th>
                    <th className="text-left font-semibold px-4 py-3">Category</th>
                    <th className="text-left font-semibold px-4 py-3">Size</th>
                    <th className="text-left font-semibold px-4 py-3">Code</th>
                    <th className="text-left font-semibold px-4 py-3">Worker</th>
                    <th className="text-left font-semibold px-4 py-3">Vendor</th>
                    <th className="text-left font-semibold px-4 py-3">Qty</th>
                    <th className="text-left font-semibold px-4 py-3">QC Date</th>
                    <th className="text-left font-semibold px-4 py-3">QC Qty</th>
                    <th className="text-left font-semibold px-4 py-3">Gatepass</th>
                    <th className="text-left font-semibold px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-10 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-12 text-center text-gray-500">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-semibold">{r.serial_no || "-"}</td>
                        <td className="px-4 py-3">{r.jo_no || "-"}</td>
                        <td className="px-4 py-3">{r.item_no ?? "-"}</td>
                        <td className="px-4 py-3">{r.machine_category || "-"}</td>
                        <td className="px-4 py-3">{r.machine_size || "-"}</td>
                        <td className="px-4 py-3">{r.machine_code || "-"}</td>
                        <td className="px-4 py-3">{r.worker_name || "-"}</td>
                        <td className="px-4 py-3">{r.vendor_name || "-"}</td>
                        <td className="px-4 py-3">{r.quantity_no ?? "-"}</td>
                        <td className="px-4 py-3">{r.qc_date || "-"}</td>
                        <td className="px-4 py-3">{r.qc_quantity ?? "-"}</td>
                        <td className="px-4 py-3">{r.gatepass_no || "-"}</td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  Page <b>{page}</b> of <b>{totalPages}</b>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className={`px-4 py-2 rounded-md border ${
                      page <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                    }`}
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className={`px-4 py-2 rounded-md border ${
                      page >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3">
                Tip: filter “Machine Category = Lathe” and “Size = Small/Medium/Big” to track shop floor movement.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}