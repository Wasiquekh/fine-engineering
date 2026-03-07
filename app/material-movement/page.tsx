"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import { getMaterialMovement } from "../services/materialMovementApi";

type Row = {
  id: string;
  jo_no?: string;
  serial_no?: string;
  item_no?: number;
  quantity_no?: number;
  status?: string;
  machine_category?: string;
  machine_size?: string;
  machine_code?: string;
  worker_name?: string;
  vendor_name?: string;
  assigning_date?: string;
};

const FIRST_DROPDOWN = [
  "All Status",
  "Lathe",
  "cnc",
  "umc",
  "Drilling",
  "Milling",
  "Vendor",
  "Welding",
  "QC",
  "Completed",
] as const;

const SIZE_OPTIONS = ["small", "medium", "large"] as const;

const LATHE_CNC_CODES: Record<"small" | "medium" | "large", string[]> = {
  small: ["SFL1", "SFL2", "SFL3", "SFL4", "SFL5", "SFL6", "SFL7", "SFL8", "SFL9"],
  medium: ["MFL1", "MFL2", "MFL3"],
  large: ["LFL1", "LFL2", "LFL3", "LFL4"],
};

const UMC_CODES = ["FVMC01"];
const MILLING_CODES = ["FML01"];
const DRILLING_CODES = ["FDL01"];

const VENDOR_OPTIONS = ["In Vendor", "Outsource"] as const;
const WELDING_OPTIONS = ["In Welding"] as const;
const QC_OPTIONS = [
  "Ready for QC",
  "QC of Welding",
  "QC of Vendor",
  "Not-ok",
  "Rejected",
] as const;

const DOC_OPTIONS = ["Job", "TSO", "Kanban", "PO"] as const;

export default function MaterialMovementPage() {
  const [search, setSearch] = useState("");

  const [firstValue, setFirstValue] = useState<string>("All Status");
  const [sizeValue, setSizeValue] = useState<string>("");
  const [secondValue, setSecondValue] = useState<string>("");
  const [thirdValue, setThirdValue] = useState<string>("");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const isLatheOrCnc = firstValue === "Lathe" || firstValue === "cnc";
  const isUmc = firstValue === "umc";
  const isMilling = firstValue === "Milling";
  const isDrilling = firstValue === "Drilling";
  const isVendor = firstValue === "Vendor";
  const isWelding = firstValue === "Welding";
  const isQc = firstValue === "QC";
  const isCompleted = firstValue === "Completed";

  const showSizeDropdown = isLatheOrCnc;
  const showSecondDropdown =
    isLatheOrCnc || isUmc || isMilling || isDrilling || isVendor || isWelding || isQc;

  const showThirdDropdown =
    isQc &&
    ["Ready for QC", "QC of Welding", "QC of Vendor", "Not-ok", "Rejected"].includes(
      secondValue
    );

  const secondOptions = useMemo(() => {
    if (isLatheOrCnc) {
      if (!sizeValue) return [];
      return LATHE_CNC_CODES[sizeValue as "small" | "medium" | "large"] || [];
    }

    if (isUmc) return UMC_CODES;
    if (isMilling) return MILLING_CODES;
    if (isDrilling) return DRILLING_CODES;
    if (isVendor) return [...VENDOR_OPTIONS];
    if (isWelding) return [...WELDING_OPTIONS];
    if (isQc) return [...QC_OPTIONS];

    return [];
  }, [isLatheOrCnc, sizeValue, isUmc, isMilling, isDrilling, isVendor, isWelding, isQc]);

  const handleFirstChange = (value: string) => {
    setFirstValue(value);
    setSizeValue("");
    setSecondValue("");
    setThirdValue("");
    setRows([]);
    setPage(1);
    setTotalPages(1);
    setTotal(0);
  };

  const handleSizeChange = (value: string) => {
    setSizeValue(value);
    setSecondValue("");
    setThirdValue("");
    setRows([]);
    setPage(1);
    setTotalPages(1);
    setTotal(0);
  };

  const handleSecondChange = (value: string) => {
    setSecondValue(value);
    setThirdValue("");
    setRows([]);
    setPage(1);
    setTotalPages(1);
    setTotal(0);
  };

  const buildParams = (pageNumber = 1) => {
    const params: Record<string, any> = {
      page: pageNumber,
      limit,
    };

    if (search.trim()) params.q = search.trim();

    // 1st dropdown mapping
    if (firstValue === "Lathe") {
      params.machine_category = "Lathe";
      params.status = "machine";
      if (sizeValue) params.machine_size = sizeValue;
      if (secondValue) params.machine_code = secondValue;
    }

    if (firstValue === "cnc") {
      params.machine_category = "cnc";
      params.status = "machine";
      if (sizeValue) params.machine_size = sizeValue;
      if (secondValue) params.machine_code = secondValue;
    }

    if (firstValue === "umc") {
      params.machine_category = "umc";
      params.status = "machine";
      if (secondValue) params.machine_code = secondValue;
    }

    if (firstValue === "Milling") {
      params.machine_category = "Milling";
      params.status = "machine";
      if (secondValue) params.machine_code = secondValue;
    }

    if (firstValue === "Drilling") {
      params.machine_category = "Drilling";
      params.status = "machine";
      if (secondValue) params.machine_code = secondValue;
    }

    if (firstValue === "Vendor") {
      if (secondValue === "In Vendor") params.status = "in-vendor";
      if (secondValue === "Outsource") params.status = "vendor-outsource";
    }

    if (firstValue === "Welding") {
      params.status = "in-welding";
    }

    if (firstValue === "QC") {
      if (secondValue === "Ready for QC") params.status = "ready-for-qc";
      if (secondValue === "QC of Welding") params.status = "qc-welding";
      if (secondValue === "QC of Vendor") params.status = "qc-vendor";
      if (secondValue === "Not-ok") params.status = "not-ok";
      if (secondValue === "Rejected") params.status = "rejected";

      if (thirdValue) {
        if (thirdValue === "Job") params.job_type = "JOB_SERVICE";
        if (thirdValue === "TSO") params.job_type = "TSO_SERVICE";
        if (thirdValue === "Kanban") params.job_type = "KANBAN";
        if (thirdValue === "PO") params.job_type = "PO";
      }
    }

    if (isCompleted) {
      params.status = "completed";
    }

    // All Status = no forced filters, just search/page
    return params;
  };

  const fetchData = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const params = buildParams(pageNumber);
      const resp = await getMaterialMovement(params);

      const list = Array.isArray(resp?.data) ? resp.data : [];
      setRows(list);
      setPage(resp?.pagination?.page || pageNumber);
      setTotalPages(resp?.pagination?.totalPages || 1);
      setTotal(resp?.pagination?.total || 0);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load material movement");
      setRows([]);
      setPage(1);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // initial load for "All Status"
  useEffect(() => {
    if (firstValue === "All Status") {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <LeftSideBar />

      <div className="md:ml-[17%]">
        <DesktopHeader />

        <div className="p-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h1 className="text-2xl font-bold text-[#111827]">Material Movement</h1>
            <p className="mt-1 text-sm text-gray-500">
              Workflow-based Material Movement UI as per your diagram
            </p>

            {/* filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search JO / serial / worker / vendor / code"
                    className="w-full h-[44px] rounded-lg border border-gray-200 pl-10 pr-3 outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1st Dropdown
                </label>
                <select
                  value={firstValue}
                  onChange={(e) => handleFirstChange(e.target.value)}
                  className="w-full h-[44px] rounded-lg border border-gray-200 px-3 bg-white outline-none focus:border-primary-500"
                >
                  {FIRST_DROPDOWN.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showSizeDropdown ? "Size" : "2nd Dropdown"}
                </label>

                {showSizeDropdown ? (
                  <select
                    value={sizeValue}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="w-full h-[44px] rounded-lg border border-gray-200 px-3 bg-white outline-none focus:border-primary-500"
                  >
                    <option value="">Select Size</option>
                    {SIZE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={secondValue}
                    onChange={(e) => handleSecondChange(e.target.value)}
                    disabled={!showSecondDropdown}
                    className={`w-full h-[44px] rounded-lg border border-gray-200 px-3 bg-white outline-none focus:border-primary-500 ${
                      !showSecondDropdown ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">Select</option>
                    {secondOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {showSizeDropdown ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2nd Dropdown (Code)
                  </label>
                  <select
                    value={secondValue}
                    onChange={(e) => handleSecondChange(e.target.value)}
                    disabled={!sizeValue}
                    className={`w-full h-[44px] rounded-lg border border-gray-200 px-3 bg-white outline-none focus:border-primary-500 ${
                      !sizeValue ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">Select Code</option>
                    {secondOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div />
              )}

              {showThirdDropdown ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3rd Dropdown
                  </label>
                  <select
                    value={thirdValue}
                    onChange={(e) => setThirdValue(e.target.value)}
                    className="w-full h-[44px] rounded-lg border border-gray-200 px-3 bg-white outline-none focus:border-primary-500"
                  >
                    <option value="">Select</option>
                    {DOC_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-end">
                <button
                  onClick={() => fetchData(1)}
                  className="w-full h-[44px] rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* selected preview */}
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">Selected Flow</p>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Search:</span> {search || "-"}
                </div>
                <div>
                  <span className="font-medium">1st Dropdown:</span> {firstValue || "-"}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {sizeValue || "-"}
                </div>
                <div>
                  <span className="font-medium">2nd Dropdown:</span> {secondValue || "-"}
                </div>
                <div>
                  <span className="font-medium">3rd Dropdown:</span> {thirdValue || "-"}
                </div>
              </div>
            </div>

            {/* result table */}
            <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">
                  Material Movement Result
                </div>
                <div className="text-sm text-gray-500">
                  {loading ? "Loading..." : `Showing ${rows.length} rows | Total ${total}`}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white text-gray-700 border-b">
                    <tr>
                      <th className="text-left px-4 py-3">JO No</th>
                      <th className="text-left px-4 py-3">Serial No</th>
                      <th className="text-left px-4 py-3">Item No</th>
                      <th className="text-left px-4 py-3">Qty</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Size</th>
                      <th className="text-left px-4 py-3">Code</th>
                      <th className="text-left px-4 py-3">Worker</th>
                      <th className="text-left px-4 py-3">Vendor</th>
                      <th className="text-left px-4 py-3">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && rows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.id} className="border-b last:border-b-0">
                          <td className="px-4 py-3">{row.jo_no || "-"}</td>
                          <td className="px-4 py-3">{row.serial_no || "-"}</td>
                          <td className="px-4 py-3">{row.item_no ?? "-"}</td>
                          <td className="px-4 py-3">{row.quantity_no ?? "-"}</td>
                          <td className="px-4 py-3">{row.status || "-"}</td>
                          <td className="px-4 py-3">{row.machine_category || "-"}</td>
                          <td className="px-4 py-3">{row.machine_size || "-"}</td>
                          <td className="px-4 py-3">{row.machine_code || "-"}</td>
                          <td className="px-4 py-3">{row.worker_name || "-"}</td>
                          <td className="px-4 py-3">{row.vendor_name || "-"}</td>
                          <td className="px-4 py-3">{row.assigning_date || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                <button
                  disabled={page === 1}
                  onClick={() => fetchData(page - 1)}
                  className="px-4 py-2 rounded-md bg-gray-200 disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="text-sm text-gray-700">
                  {page} / {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => fetchData(page + 1)}
                  className="px-4 py-2 rounded-md bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}