"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { FiSearch } from "react-icons/fi";
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

export default function MaterialMovementPage() {

  const [search, setSearch] = useState("");

  const [stage, setStage] = useState("All Status");
  const [size, setSize] = useState("");
  const [second, setSecond] = useState("");
  const [docType, setDocType] = useState("");
  const [reviewFor,setReviewFor] = useState("");

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const stageLower = stage.toLowerCase();

  const isLatheCnc = stageLower === "lathe" || stageLower === "cnc";
  const isUmc = stageLower === "umc";
  const isMilling = stageLower === "milling";
  const isDrilling = stageLower === "drilling";
  const isVendor = stageLower === "vendor";
  const isWelding = stageLower === "welding";
  const isQc = stageLower === "qc";
  const isCompleted = stageLower === "completed";

  const secondOptions = useMemo(() => {

    if (isLatheCnc && size)
      return LATHE_CNC_CODES[size as keyof typeof LATHE_CNC_CODES] || [];

    if (isUmc) return UMC_CODES;
    if (isMilling) return MILLING_CODES;
    if (isDrilling) return DRILLING_CODES;
    if (isVendor) return VENDOR_OPTIONS;
    if (isWelding) return WELDING_OPTIONS;
    if (isQc) return QC_OPTIONS;

    return [];

  }, [stage, size]);

  const buildParams = (pageNumber: number) => {

    const params: any = {
      page: pageNumber,
      limit,
    };

    if (search) params.q = search;

    if (stageLower === "lathe") {
      params.status = "machine";
      params.machine_category = "Lathe";
      if (size) params.machine_size = size;
      if (second) params.machine_code = second;
    }

    if (stageLower === "cnc") {
      params.status = "machine";
      params.machine_category = "cnc";
      if (size) params.machine_size = size;
      if (second) params.machine_code = second;
    }

    if (stageLower === "umc") {
      params.status = "machine";
      params.machine_category = "UMC";
      if (second) params.machine_code = second;
    }

    if (stageLower === "milling") {
      params.status = "machine";
      params.machine_category = "Milling";
      if (second) params.machine_code = second;
    }

    if (stageLower === "drilling") {
      params.status = "machine";
      params.machine_category = "Drilling";
      if (second) params.machine_code = second;
    }

    if (stageLower === "vendor") {
      if (second === "In Vendor") params.status = "in-vendor";
      if (second === "Outsource") params.status = "vendor-outsource";
    }

    if (stageLower === "welding") {
      if (second === "In Welding") params.status = "in-welding";
      if (second === "Ready for QC") params.status = "ready-for-qc";
    }

    if (stageLower === "qc") {

      if (second === "Ready for QC") params.status = "ready-for-qc";

      if (second === "QC of Welding") params.status = "qc-welding";

      if (second === "QC of Vendor") params.status = "qc-vendor";

      if (second === "Not-ok") {
        params.status = "not-ok";
        if (reviewFor === "Welding") params.review_for = "welding";
        if (reviewFor === "Vendor") params.review_for = "vendor";
      }

      if (second === "Rejected") params.status = "rejected";

      if (docType) {
        if (docType === "Job") params.job_type = "JOB_SERVICE";
        if (docType === "TSO") params.job_type = "TSO_SERVICE";
        if (docType === "Kanban") params.job_type = "KANBAN";
        if (docType === "PO") params.job_type = "PO";
      }

    }

    if (isCompleted) {
      params.status = "completed";
    }

    return params;

  };

  const fetchData = async (pageNumber: number = 1) => {

    try {

      setLoading(true);

      const params = buildParams(pageNumber);

      const resp = await getMaterialMovement(params);

      setRows(resp.data || []);
      setPage(resp.pagination.page);
      setTotal(resp.pagination.total);
      setTotalPages(resp.pagination.totalPages);

    } catch {

      toast.error("Failed to load");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchData(1);
  }, []);

  useEffect(() => {

    const timer = setTimeout(() => {
      fetchData(1);
    }, 400);

    return () => clearTimeout(timer);

  }, [search]);

  return (

    <div className="min-h-screen bg-gray-100">

      <LeftSideBar />

      <div className="md:ml-[17%]">

        <DesktopHeader />

        <div className="p-6">

          <div className="bg-white rounded-xl p-6 shadow">

            <h1 className="text-xl font-bold mb-6">
              Material Movement
            </h1>

            {/* SEARCH */}

            <div className="relative mb-6">

              <FiSearch className="absolute left-3 top-3 text-gray-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border pl-10 h-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search JO / Serial / Machine"
              />

            </div>

            {/* FILTERS */}

            <div className="grid md:grid-cols-5 gap-4 mb-6">

              <select
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value);
                  setSize("");
                  setSecond("");
                  setDocType("");
                  setReviewFor("");
                }}
                className="border h-10 rounded px-2"
              >

                {STAGE_OPTIONS.map(v =>
                  <option key={v}>{v}</option>
                )}

              </select>

              {isLatheCnc && (

                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="border h-10 rounded px-2"
                >

                  <option value="">Size</option>

                  {SIZE_OPTIONS.map(v =>
                    <option key={v}>{v}</option>
                  )}

                </select>

              )}

              <select
                value={second}
                onChange={(e) => setSecond(e.target.value)}
                className="border h-10 rounded px-2"
              >

                <option value="">Select</option>

                {secondOptions.map(v =>
                  <option key={v}>{v}</option>
                )}

              </select>

              {isQc && (

                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="border h-10 rounded px-2"
                >

                  <option value="">Doc</option>

                  {DOC_OPTIONS.map(v =>
                    <option key={v}>{v}</option>
                  )}

                </select>

              )}

              {isQc && second === "Not-ok" && (

                <select
                  value={reviewFor}
                  onChange={(e) => setReviewFor(e.target.value)}
                  className="border h-10 rounded px-2"
                >

                  <option value="">Review For</option>
                  <option>Welding</option>
                  <option>Vendor</option>

                </select>

              )}

              <button
                onClick={() => fetchData(1)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded h-10"
              >

                Apply

              </button>

            </div>

            {/* TABLE */}

            <div className="overflow-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="p-3 text-left">JO</th>
                    <th className="p-3 text-left">Serial</th>
                    <th className="p-3 text-left">Item Description</th>
                    <th className="p-3 text-left">Item No</th>
                    <th className="p-3 text-left">Quantity</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Machine Code</th>
                    <th className="p-3 text-left">Machine </th>
                    <th className="p-3 text-left">Worker</th>
                    <th className="p-3 text-left">Vendor</th>

                  </tr>

                </thead>

                <tbody>

                  {loading && (

                    <tr>
                      <td colSpan={9} className="text-center p-6">
                        Loading...
                      </td>
                    </tr>

                  )}

                  {!loading && rows.length === 0 && (

                    <tr>
                      <td colSpan={9} className="text-center p-6 text-gray-500">
                        No Data Found
                      </td>
                    </tr>

                  )}

                  {rows.map((r) => (

                    <tr key={r.id} className="border-t hover:bg-gray-50">

                      <td className="p-3">{r.jo_no}</td>
                      <td className="p-3">{r.serial_no}</td>
                      <td className="p-3">{r.item_description}</td>
                      <td className="p-3">{r.item_no}</td>
                      <td className="p-3">{r.quantity_no}</td>
                      <td className="p-3">{r.status}</td>
                      <td className="p-3">{r.machine_code}</td>
                      <td className="p-3">{r.machine_category}</td>
                      <td className="p-3">{r.worker_name}</td>
                      <td className="p-3">{r.vendor_name}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* PAGINATION */}

            <div className="flex justify-between items-center mt-6">

              <button
                disabled={page === 1}
                onClick={() => fetchData(page - 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40"
              >
                Prev
              </button>

              <span>
                Page {page} / {totalPages} | Total {total}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => fetchData(page + 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40"
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