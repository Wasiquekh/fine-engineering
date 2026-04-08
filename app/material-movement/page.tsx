// app/section_material_movement/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import { getMaterialMovement } from "../services/materialMovementApi";
import AxiosProvider from "../../provider/AxiosProvider";
import {
  STAGE_OPTIONS,
  SIZE_OPTIONS,
  MACHINE_CODES,
  UMC_CODES,
  MILLING_CODES,
  DRILLING_CODES,
  VENDOR_OPTIONS,
  WELDING_OPTIONS,
  QC_OPTIONS,
  DOC_OPTIONS,
  REVIEW_FOR_OPTIONS,
  TSO_SERVICE_CATEGORIES,
  KANBAN_CATEGORIES,
  WORKER_OPTIONS,
} from "./materialMovement.constants";

const axiosProvider = new AxiosProvider();

export default function MaterialMovementPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All Status");
  const [size, setSize] = useState("");
  const [machineCode, setMachineCode] = useState("");
  const [docType, setDocType] = useState("");
  const [reviewFor, setReviewFor] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const limit = 20;

  const stageLower = stage.toLowerCase();

  // Check stage types - IMPORTANT: "cnc" matches database value
  const isLathe = stageLower === "lathe";
  const isCnc = stageLower === "cnc";
  const isUmc = stageLower === "umc";
  const isMilling = stageLower === "milling";
  const isDrilling = stageLower === "drilling";
  const isVendor = stageLower === "vendor";
  const isWelding = stageLower === "welding";
  const isQc = stageLower === "qc";
  const isCompleted = stageLower === "completed";

  const isLatheOrCnc = isLathe || isCnc;

  // Get size options based on selected stage
  const getSizeOptions = () => {
    if (isLathe || isCnc) {
      return SIZE_OPTIONS;
    }
    return [];
  };

  // Get machine code options based on stage and size
  const getMachineCodeOptions = () => {
    if (isLatheOrCnc && size) {
      return MACHINE_CODES[size as keyof typeof MACHINE_CODES] || [];
    }
    if (isUmc) return UMC_CODES;
    if (isMilling) return MILLING_CODES;
    if (isDrilling) return DRILLING_CODES;
    if (isVendor) return VENDOR_OPTIONS;
    if (isWelding) return WELDING_OPTIONS;
    if (isQc) return QC_OPTIONS;
    return [];
  };

  // Get job category options based on document type
  const getJobCategoryOptions = () => {
    if (docType === "TSO_SERVICE") return TSO_SERVICE_CATEGORIES;
    if (docType === "KANBAN") return KANBAN_CATEGORIES;
    if (docType === "JOB_SERVICE") return categories;
    return [];
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      console.log("📁 Fetching categories for Material Movement...");
      const response = await axiosProvider.get("/fineengg_erp/system/categories");
      console.log("Categories API Response:", response?.data);
      
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

      // Add hardcoded categories
      const hardcodedCategories = ["SFR", "ANFD", "NON STD", "AD", "MD"];
      hardcodedCategories.forEach(cat => {
        if (!uniqueMap.has(cat)) {
          uniqueMap.set(cat, {
            value: cat,
            label: cat,
          });
        }
      });

      const formattedCats = Array.from(uniqueMap.values()).sort((a, b) => 
        a.label.localeCompare(b.label)
      );
      
      console.log("✅ Fetched categories:", formattedCats);
      setCategories(formattedCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      const fallbackCategories = ["SFR", "ANFD", "NON STD", "AD", "MD"].map(cat => ({
        value: cat,
        label: cat,
      }));
      setCategories(fallbackCategories);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Build API parameters - FIXED for CNC
  const buildParams = (pageNumber: number) => {
    const params: any = {
      page: pageNumber,
      limit,
    };

    if (search) params.q = search;

    console.log("🔍 Stage selected:", stage, "stageLower:", stageLower);
    console.log("🔍 isCnc:", isCnc, "isLathe:", isLathe);

    // ============= STAGE BASED FILTERS =============
    
    // Lathe
    if (isLathe) {
      params.status = "machine";
      params.machine_category = "Lathe";
      if (size) params.machine_size = size;
      if (machineCode) params.machine_code = machineCode;
      console.log("🔧 Lathe params:", params);
    }
    // CNC - FIXED: Use "cnc" (lowercase) to match database
    else if (isCnc) {
      params.status = "machine";
      params.machine_category = "cnc"; // ✅ This matches database value
      if (size) params.machine_size = size;
      if (machineCode) params.machine_code = machineCode;
      console.log("🔧 CNC params:", params);
    }
    // UMC
    else if (isUmc) {
      params.status = "machine";
      params.machine_category = "umc";
      if (machineCode) params.machine_code = machineCode;
      console.log("🔧 UMC params:", params);
    }
    // Milling
    else if (isMilling) {
      params.status = "machine";
      params.machine_category = "Milling";
      if (machineCode) params.machine_code = machineCode;
    }
    // Drilling
    else if (isDrilling) {
      params.status = "machine";
      params.machine_category = "Drilling";
      if (machineCode) params.machine_code = machineCode;
    }
    // Vendor stages
    else if (isVendor) {
      if (machineCode === "in-vendor") params.status = "in-vendor";
      if (machineCode === "outsource") params.status = "vendor-outsource";
    }
    // Welding stages
    else if (isWelding) {
      if (machineCode === "in-welding") params.status = "in-welding";
      if (machineCode === "ready-for-qc") params.status = "ready-for-qc";
    }
    // QC stages
    else if (isQc) {
      if (machineCode === "ready-for-qc") {
        params.status = "ready-for-qc";
      } else if (machineCode === "qc-welding") {
        params.status = "qc-welding";
      } else if (machineCode === "qc-vendor") {
        params.status = "qc-vendor";
      } else if (machineCode === "not-ok") {
        params.status = "not-ok";
        if (reviewFor) params.review_for = reviewFor;
      } else if (machineCode === "rejected") {
        params.status = "rejected";
      }
    }
    // Completed stage
    else if (isCompleted) {
      params.status = "completed";
    }

    // ============= DOCUMENT TYPE FILTER =============
    if (docType) {
      if (docType === "JOB_SERVICE") {
        params.job_type = "JOB_SERVICE";
      } else if (docType === "TSO_SERVICE") {
        params.job_type = "TSO_SERVICE";
      } else if (docType === "KANBAN") {
        params.job_type = "KANBAN";
      } else if (docType === "PO") {
        params.job_type = "PO";
      }
    }

    // Job category filter
    if (jobCategory) {
      params.job_category = jobCategory;
    }

    // For All Status, don't add any status filter
    if (stageLower === "all status") {
      delete params.status;
    }

    console.log("🚀 Final API Params:", JSON.stringify(params, null, 2));
    return params;
  };

  // Fetch data
  const fetchData = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const params = buildParams(pageNumber);
      
      console.log("📡 Sending request to API...");
      const resp = await getMaterialMovement(params);
      console.log("📡 Response received:", resp);
      
      if (resp && resp.data) {
        setRows(resp.data || []);
        setPage(resp.pagination?.page || 1);
        setTotal(resp.pagination?.total || 0);
        setTotalPages(resp.pagination?.totalPages || 1);
      } else {
        setRows([]);
      }
    } catch (error) {
      toast.error("Failed to load data");
      console.error("❌ Fetch error:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(1);
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset filters
  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    console.log("📌 Stage changed to:", newStage);
    setStage(newStage);
    setSize("");
    setMachineCode("");
    setDocType("");
    setReviewFor("");
    setJobCategory("");
  };

  const handleApplyFilters = () => {
    console.log("🎯 Apply Filters clicked with values:", {
      stage, size, machineCode, docType, jobCategory, reviewFor
    });
    fetchData(1);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'not-ok':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      case 'qc-welding':
      case 'qc-vendor':
        return 'bg-purple-100 text-purple-800';
      case 'machine':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <LeftSideBar />
      <div className="md:ml-[17%]">
        <DesktopHeader />
        <div className="p-6">
          <div className="bg-white rounded-xl p-6 shadow">
            <h1 className="text-xl font-bold mb-6">Material Movement</h1>

            {/* Search Bar */}
            <div className="relative mb-6">
              <FiSearch className="absolute left-3 top-3 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border pl-10 h-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search JO / Serial / Machine / Worker / Vendor / Job No / TSO No"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
              <select
                value={stage}
                onChange={handleStageChange}
                className="border h-10 rounded px-2"
              >
                {STAGE_OPTIONS.map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>

              {getSizeOptions().length > 0 && (
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    setMachineCode("");
                  }}
                  className="border h-10 rounded px-2"
                >
                  <option value="">Select Size</option>
                  {getSizeOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {getMachineCodeOptions().length > 0 && (
                <select
                  value={machineCode}
                  onChange={(e) => setMachineCode(e.target.value)}
                  className="border h-10 rounded px-2"
                >
                  <option value="">
                    {isLatheOrCnc ? "Select Machine Code" : 
                     isUmc ? "Select UMC Code" :
                     isMilling ? "Select Milling Code" :
                     isDrilling ? "Select Drilling Code" :
                     isVendor ? "Select Vendor Option" :
                     isWelding ? "Select Welding Option" :
                     isQc ? "Select QC Option" :
                     "Select"}
                  </option>
                  {getMachineCodeOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  setJobCategory("");
                }}
                className="border h-10 rounded px-2"
              >
                <option value="">All Document Types</option>
                {DOC_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Category Dropdowns */}
              {docType === "JOB_SERVICE" && categories.length > 0 && (
                <select
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  className="border h-10 rounded px-2"
                >
                  <option value="">All Categories</option>
                  {categories.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {docType === "TSO_SERVICE" && (
                <select
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  className="border h-10 rounded px-2"
                >
                  <option value="">All TSO Categories</option>
                  {TSO_SERVICE_CATEGORIES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {docType === "KANBAN" && (
                <select
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  className="border h-10 rounded px-2"
                >
                  <option value="">All Kanban Categories</option>
                  {KANBAN_CATEGORIES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {isQc && machineCode === "not-ok" && (
                <select
                  value={reviewFor}
                  onChange={(e) => setReviewFor(e.target.value)}
                  className="border h-10 rounded px-2"
                >
                  <option value="">All Review Types</option>
                  {REVIEW_FOR_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded h-10 px-4"
              >
                Apply Filters
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left border">JO No</th>
                    <th className="p-3 text-left border">Job/TSO No</th>
                    <th className="p-3 text-left border">Serial No</th>
                    <th className="p-3 text-left border">Item Description</th>
                    <th className="p-3 text-left border">Item No</th>
                    <th className="p-3 text-left border">Quantity</th>
                    <th className="p-3 text-left border">Status</th>
                    <th className="p-3 text-left border">Machine Category</th>
                    <th className="p-3 text-left border">Machine Size</th>
                    <th className="p-3 text-left border">Machine Code</th>
                    <th className="p-3 text-left border">Worker</th>
                    <th className="p-3 text-left border">Vendor</th>
                    <th className="p-3 text-left border">Review For</th>
                    <th className="p-3 text-left border">Job Type</th>
                    <th className="p-3 text-left border">Job Category</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={15} className="text-center p-6 border">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={15} className="text-center p-6 text-gray-500 border">
                        No Data Found
                      </td>
                    </tr>
                  )}

                  {rows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 border">{r.jo_no || "-"}</td>
                      <td className="p-3 border">{r.job_no || r.tso_no || "-"}</td>
                      <td className="p-3 border">{r.serial_no || "-"}</td>
                      <td className="p-3 border">{r.item_description || "-"}</td>
                      <td className="p-3 border">{r.item_no || "-"}</td>
                      <td className="p-3 border font-semibold">{r.quantity_no || 0}</td>
                      <td className="p-3 border">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(r.status)}`}>
                          {r.status || "-"}
                        </span>
                      </td>
                      <td className="p-3 border">{r.machine_category || "-"}</td>
                      <td className="p-3 border">{r.machine_size || "-"}</td>
                      <td className="p-3 border">{r.machine_code || "-"}</td>
                      <td className="p-3 border">{r.worker_name || "-"}</td>
                      <td className="p-3 border">{r.vendor_name || "-"}</td>
                      <td className="p-3 border">
                        {r.review_for && r.review_for !== "-" ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            r.review_for === 'welding' ? 'bg-orange-100 text-orange-800' :
                            r.review_for === 'vendor' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {r.review_for}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-3 border">{r.job_type || "-"}</td>
                      <td className="p-3 border">{r.job_category || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={page === 1}
                onClick={() => fetchData(page - 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40 hover:bg-gray-300"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages} | Total {total} records
              </span>
              
              <button
                disabled={page === totalPages}
                onClick={() => fetchData(page + 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40 hover:bg-gray-300"
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