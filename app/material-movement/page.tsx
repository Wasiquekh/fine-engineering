"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { toast } from "react-toastify";
import { getMaterialMovement } from "../services/materialMovementApi";

import {
  STAGE_OPTIONS,
  SIZE_OPTIONS,
  LATHE_CNC_CODES,
  UMC_CODES,
  MILLING_CODES,
  DRILLING_CODES,
  VENDOR_OPTIONS,
  WELDING_OPTIONS,
  QC_OPTIONS,
  DOC_OPTIONS,
} from "./materialMovement.constants";

type Row = {
  id: string;
  jo_no: string;
  job_no: string;
  item_no: number | string;
  item_description: string;
  quantity_no: number | string;
  status: string;
  machine_category: string;
  machine_size: string;
  machine_code: string;
  worker_name: string;
  vendor_name: string;
  serial_no: string;
  assigning_date: string;
  client_name: string;
  job_type: string;
};

export default function MaterialMovementPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [stage, setStage] = useState("All Status");
  const [size, setSize] = useState("All");
  const [secondValue, setSecondValue] = useState("");
  const [thirdValue, setThirdValue] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const isLathe = stage === "Lathe";
  const isCnc = stage === "CNC";
  const isLatheOrCnc = isLathe || isCnc;

  const isUmc = stage === "UMC";
  const isMilling = stage === "Milling";
  const isDrilling = stage === "Drilling";
  const isVendor = stage === "Vendor";
  const isWelding = stage === "Welding";
  const isQc = stage === "QC";
  const isCompleted = stage === "Completed";

  const showSizeDropdown = isLatheOrCnc;
  const showSecondDropdown =
    isLatheOrCnc || isUmc || isMilling || isDrilling || isVendor || isWelding || isQc;

  const showThirdDropdown =
    isQc &&
    ["Ready for QC", "QC of Welding", "QC of Vendor", "Not-ok", "Rejected"].includes(secondValue);

  const secondOptions = useMemo(() => {
    if (isLatheOrCnc) {
      if (size === "All") return ["All Code"];
      return LATHE_CNC_CODES[size as keyof typeof LATHE_CNC_CODES] || [];
    }

    if (isUmc) return UMC_CODES;
    if (isMilling) return MILLING_CODES;
    if (isDrilling) return DRILLING_CODES;
    if (isVendor) return [...VENDOR_OPTIONS];
    if (isWelding) return [...WELDING_OPTIONS];
    if (isQc) return [...QC_OPTIONS];

    return [];
  }, [isLatheOrCnc, size, isUmc, isMilling, isDrilling, isVendor, isWelding, isQc]);

  const groupedRows = useMemo(() => {
    const grouped: Record<string, Row[]> = {};

    rows.forEach((row) => {
      const key = row.machine_code || "NO_CODE";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    return grouped;
  }, [rows]);

  const handleStageChange = (value: string) => {
    setStage(value);
    setSize("All");
    setSecondValue("");
    setThirdValue("");
    setExpandedCode(null);
    setPage(1);
  };

  const handleSizeChange = (value: string) => {
    setSize(value);
    setSecondValue("");
    setThirdValue("");
    setExpandedCode(null);
    setPage(1);
  };

  const handleSecondChange = (value: string) => {
    setSecondValue(value);
    setThirdValue("");
    setExpandedCode(null);
    setPage(1);
  };

  const fetchData = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        q: search.trim() || undefined,
        page: pageNumber,
        limit,
      };

      if (isLathe) {
        params.stage = "Lathe";
        if (size !== "All") params.size = size;
        if (secondValue && secondValue !== "All Code") params.code = secondValue;
      }

      if (isCnc) {
        params.stage = "CNC";
        if (size !== "All") params.size = size;
        if (secondValue && secondValue !== "All Code") params.code = secondValue;
      }

      if (isUmc) {
        params.stage = "UMC";
        if (secondValue) params.code = secondValue;
      }

      if (isMilling) {
        params.stage = "Milling";
        if (secondValue) params.code = secondValue;
      }

      if (isDrilling) {
        params.stage = "Drilling";
        if (secondValue) params.code = secondValue;
      }

      if (isVendor) {
        params.stage = "Vendor";
        if (secondValue) params.sub_status = secondValue;
      }

      if (isWelding) {
        params.stage = "Welding";
        if (secondValue) params.sub_status = secondValue;
      }

      if (isQc) {
        params.stage = "QC";
        if (secondValue) params.sub_status = secondValue;
        if (thirdValue) params.doc_type = thirdValue;
      }

      if (isCompleted) {
        params.stage = "Completed";
      }

      const resp = await getMaterialMovement(params);

      const list = Array.isArray(resp?.data) ? resp.data : [];
      setRows(list);
      setPage(resp?.pagination?.page || pageNumber);
      setTotalPages(resp?.pagination?.totalPages || 1);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load material movement");
      setRows([]);
      setPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, size, secondValue, thirdValue]);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <LeftSideBar />

      <div className="md:ml-[17%]">
        <DesktopHeader />

        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Material Movement</h1>
            <p className="mt-1 text-sm text-gray-500">
              Structure based on your workflow image
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jo / serial / worker / vendor / code"
                className="h-[42px] rounded-md border border-gray-200 px-3 bg-white"
              />

              {/* 1st dropdown */}
              <select
                value={stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="h-[42px] rounded-md border border-gray-200 px-3 bg-white"
              >
                {STAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* size dropdown only for lathe/cnc */}
              {showSizeDropdown ? (
                <select
                  value={size}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="h-[42px] rounded-md border border-gray-200 px-3 bg-white"
                >
                  {SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <div />
              )}

              {/* 2nd dropdown */}
              {showSecondDropdown ? (
                <select
                  value={secondValue}
                  onChange={(e) => handleSecondChange(e.target.value)}
                  className="h-[42px] rounded-md border border-gray-200 px-3 bg-white"
                >
                  <option value="">Select</option>
                  {secondOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <div />
              )}

              {/* 3rd dropdown for QC */}
              {showThirdDropdown ? (
                <select
                  value={thirdValue}
                  onChange={(e) => setThirdValue(e.target.value)}
                  className="h-[42px] rounded-md border border-gray-200 px-3 bg-white"
                >
                  <option value="">Select</option>
                  {DOC_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => fetchData(1)}
                  className="h-[42px] rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700"
                >
                  Apply Search
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 mt-5 overflow-hidden">
              <div className="p-4 text-sm text-gray-600">
                {loading ? "Loading..." : `Showing ${rows.length} records`}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3">Machine Code</th>
                      <th className="text-left px-4 py-3">Total Jobs</th>
                      <th className="text-left px-4 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!loading && Object.keys(groupedRows).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                          No data found
                        </td>
                      </tr>
                    )}

                    {Object.keys(groupedRows).map((code) => {
                      const items = groupedRows[code];

                      return (
                        <>
                          <tr
                            key={code}
                            className="border-t cursor-pointer hover:bg-gray-50"
                            onClick={() =>
                              setExpandedCode(expandedCode === code ? null : code)
                            }
                          >
                            <td className="px-4 py-3 font-semibold">{code}</td>
                            <td className="px-4 py-3">{items.length}</td>
                            <td className="px-4 py-3 text-blue-600">
                              {expandedCode === code ? "Hide" : "View"}
                            </td>
                          </tr>

                          {expandedCode === code &&
                            items.map((r) => (
                              <tr key={r.id} className="bg-gray-50 border-t">
                                <td className="px-4 py-3 pl-10">
                                  {r.machine_category}
                                  {r.machine_size && r.machine_size !== "-" ? ` / ${r.machine_size}` : ""}
                                  {" / "}
                                  {r.machine_code}
                                </td>
                                <td className="px-4 py-3">
                                  JO: {r.jo_no} | Qty: {r.quantity_no}
                                </td>
                                <td className="px-4 py-3">
                                  Status: {r.status} | Worker: {r.worker_name}
                                </td>
                              </tr>
                            ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button
                disabled={page === 1}
                onClick={() => fetchData(page - 1)}
                className="px-4 py-2 rounded-md bg-gray-200 disabled:opacity-50"
              >
                Prev
              </button>

              <div className="text-sm text-gray-700">
                Page <b>{page}</b> / <b>{totalPages}</b>
              </div>

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
  );
}