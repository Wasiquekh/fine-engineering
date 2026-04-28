"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import { toast } from "react-toastify";
import { ASSIGN_STATUS } from "../../../constants/assignStatus";
import { getAssignments, postAssignVendor } from "../../../services/assignToWorkerApi";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import Image from "next/image";
import PageGuard from "../../../component/PageGuard";
import StorageManager from "../../../../provider/StorageManager";
import Swal from "sweetalert2";

type Row = any;

const VENDOR_OPTIONS = ["Ashfaq", "Others"];
const storage = new StorageManager();

// Permission helper function
const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

export default function VendorOutsourcePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "ALL";
  const client = searchParams.get("client") || "";
  
  const permissions = storage.getUserPermissions();
  const canEditOutsource = hasPermission(permissions, "outsource.edit");

  const fetchCategories = async (data: Row[]) => {
    const uniqueMap = new Map<string, { value: string; label: string }>();

    data.forEach((item: any) => {
      const jobCategory = String(item?.job_category || item?.job?.job_category || "").trim();
      if (jobCategory && !uniqueMap.has(jobCategory)) {
        uniqueMap.set(jobCategory, {
          value: jobCategory,
          label: jobCategory,
        });
      }
    });

    setCategories(Array.from(uniqueMap.values()));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL job types for vendor outsource
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allData: Row[] = [];

      for (const jobType of jobTypes) {
        const data = await getAssignments({
          status: ASSIGN_STATUS.VENDOR_OUTSOURCE,
          job_type: jobType,
          ...(client ? { client_name: client } : {}),
        });

        const list = Array.isArray(data) ? data : data?.data || [];
        
        // Add job_type to each item
        const dataWithJobType = list.map((item: any) => ({
          ...item,
          job_type: jobType
        }));
        
        allData = [...allData, ...dataWithJobType];
      }

      console.log("Total rows fetched:", allData.length);
      console.log("Rows by type:", {
        JOB: allData.filter(r => r.job_type === "JOB_SERVICE").length,
        TSO: allData.filter(r => r.job_type === "TSO_SERVICE").length,
        KANBAN: allData.filter(r => r.job_type === "KANBAN").length
      });

      setRows(allData);
      fetchCategories(allData);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load outsource list");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [client]);

  const filteredData = useMemo(() => {
    if (jobServiceCategoryFilter === "ALL") return rows;

    return rows.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  }, [rows, jobServiceCategoryFilter]);

  // FIXED: Get unique identifiers based on job type with proper prefixes
  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    
    filteredData.forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let identifier: string | null | undefined = null;
      
      if (jobType === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
        if (identifier) ids.add(`TSO:${identifier}`);
      } 
      else if (jobType === "KANBAN") {
        // KANBAN uses jo_no as primary identifier
        identifier = item.jo_no;
        if (identifier) ids.add(`KANBAN:${identifier}`);
      } 
      else {
        // JOB_SERVICE uses job_no
        identifier = item.job_no || item.job?.job_no;
        if (identifier) ids.add(`JOB:${identifier}`);
      }
    });
    
    console.log("Job Identifiers:", Array.from(ids));
    return Array.from(ids);
  }, [filteredData]);

  // FIXED: Get items for identifier
  const getItemsForIdentifier = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    
    return filteredData.filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (type === "TSO" && jobType === "TSO_SERVICE") {
        return (item.tso_no || item.job?.tso_no) === actualId;
      } 
      else if (type === "KANBAN" && jobType === "KANBAN") {
        return item.jo_no === actualId;
      } 
      else if (type === "JOB" && jobType === "JOB_SERVICE") {
        return (item.job_no || item.job?.job_no) === actualId;
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

  const jobSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        totalQty: number;
        uniqueJoCount: number;
        jobCategory: string;
        jobType: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = getItemsForIdentifier(identifier);
      
      const totalQty = items.reduce(
        (sum, item) => sum + (Number(item.quantity_no) || 0),
        0
      );

      const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;

      const jobCategory =
        items.length > 0
          ? items[0].job_category || items[0].job?.job_category || "N/A"
          : "N/A";

      const jobType = items.length > 0 
        ? (items[0].job_type || items[0].job?.job_type || "JOB_SERVICE")
        : "JOB_SERVICE";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        jobType,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers]);

  const onAssign = async (r: Row) => {
    // Show confirmation popup first
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to assign this item to vendor?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, assign it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

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
      setSelectedJobNo(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to assign vendor");
    }
  };

  // FIXED: Get display name for identifier
  const getIdentifierDisplayName = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    if (type === "TSO") {
      return `TSO: ${actualId}`;
    } else if (type === "KANBAN") {
      return `KANBAN: ${actualId}`;
    }
    return actualId;
  };

  // Get job type badge
  const getJobTypeBadge = (jobType: string) => {
    switch(jobType) {
      case "TSO_SERVICE":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TSO</span>;
      case "KANBAN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">KANBAN</span>;
      default:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">JOB</span>;
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
    
    rows.forEach(item => {
      const type = item.job_type || item.job?.job_type;
      if (type === "JOB_SERVICE") counts.JOB_SERVICE++;
      else if (type === "TSO_SERVICE") counts.TSO_SERVICE++;
      else if (type === "KANBAN") counts.KANBAN++;
    });
    
    return counts;
  }, [rows]);

  // per-row UI states
  const [vendorPick, setVendorPick] = useState<Record<string, string>>({});
  const [otherName, setOtherName] = useState<Record<string, string>>({});

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard requiredPermission="outsource.view">
      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
        <div className="absolute bottom-0 right-0">
          <Image
            src="/images/sideDesign.svg"
            alt="side design"
            width={100}
            height={100}
            className="w-full h-full"
          />
        </div>

        <DesktopHeader />

        <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
          <div className="mb-4 px-2">
            <h1 className="text-xl font-semibold text-firstBlack">
              Vendor Outsource • All Services
              {client && ` • ${client}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className="font-semibold">{ASSIGN_STATUS.VENDOR_OUTSOURCE}</span>
            </p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">JOB: {countsByType.JOB_SERVICE}</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">TSO: {countsByType.TSO_SERVICE}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">KANBAN: {countsByType.KANBAN}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">TOTAL: {countsByType.TOTAL}</span>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
              <button
                onClick={() => setJobServiceCategoryFilter("ALL")}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  jobServiceCategoryFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setJobServiceCategoryFilter(cat.value)}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    jobServiceCategoryFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative overflow-x-auto sm:rounded-lg">
            {selectedJobNo ? (
              <>
                <button
                  onClick={() => setSelectedJobNo(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mb-4"
                >
                  <FaArrowLeft />
                  Back to Jobs
                </button>

                <h2 className="text-2xl font-semibold mb-4">
                  {getIdentifierDisplayName(selectedJobNo)}
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-[#999999]">
                      <tr className="border border-tableBorder">
                        <th className="p-3 border border-tableBorder">JO No</th>
                        <th className="px-2 py-0 border border-tableBorder">Type</th>
                        <th className="px-2 py-0 border border-tableBorder">Serial No</th>
                        <th className="px-2 py-0 border border-tableBorder">Item Description</th>
                        <th className="px-2 py-0 border border-tableBorder">Item No</th>
                        <th className="px-2 py-0 border border-tableBorder">Quantity</th>
                        {canEditOutsource && (
                          <th className="px-2 py-0 border border-tableBorder">Assign Vendor</th>
                        )}
                       </tr>
                    </thead>
                    <tbody>
                      {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).length === 0 ? (
                        <tr>
                          <td colSpan={canEditOutsource ? 7 : 6} className="px-4 py-6 text-center border border-tableBorder">
                            <p className="text-[#666666] text-sm">No JO data found</p>
                          </td>
                        </tr>
                      ) : (
                        Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                          <Fragment key={jo}>
                            {/* JO Group Header */}
                            <tr className="border border-tableBorder bg-gray-100">
                              <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={canEditOutsource ? 7 : 6}>
                                JO: {jo} ({items.length} item(s))
                              </td>
                            </tr>
                            
                            {/* Individual Items with Actions */}
                            {items.map((item) => {
                              const picked = vendorPick[item.id] || "Ashfaq";
                              return (
                                <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                                  <td className="px-2 py-2 border border-tableBorder">{jo}</td>
                                  <td className="px-2 py-2 border border-tableBorder">
                                    {getJobTypeBadge(item.job_type || item.job?.job_type || "JOB_SERVICE")}
                                  </td>
                                  <td className="px-2 py-2 border border-tableBorder font-mono">{item.serial_no || "-"}</td>
                                  <td className="px-2 py-2 border border-tableBorder">{item.job?.item_description || "-"}</td>
                                  <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                                  <td className="px-2 py-2 border border-tableBorder font-semibold">{item.quantity_no ?? "-"}</td>
                                  {canEditOutsource && (
                                    <td className="px-2 py-2 border border-tableBorder">
                                      <div className="flex flex-col gap-2 min-w-[200px]">
                                        <select
                                          aria-label="Select vendor"
                                          className="border border-customBorder bg-white rounded-lg px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-primary-200"
                                          value={picked}
                                          onChange={(e) =>
                                            setVendorPick((p) => ({ ...p, [item.id]: e.target.value }))
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
                                            className="border border-customBorder bg-white rounded-lg px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-primary-200"
                                            placeholder="Vendor name"
                                            value={otherName[item.id] || ""}
                                            onChange={(e) =>
                                              setOtherName((p) => ({ ...p, [item.id]: e.target.value }))
                                            }
                                          />
                                        ) : null}

                                        <button
                                          onClick={() => onAssign(item)}
                                          className="px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs font-semibold"
                                        >
                                          Assign
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Vendor Outsource - All Services</h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">Job/TSO No</th>
                      <th className="px-2 py-0 border border-tableBorder">Type</th>
                      <th className="px-2 py-0 border border-tableBorder">Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Total JO</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-sm">Loading...</p>
                        </td>
                      </tr>
                    ) : jobIdentifiers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-sm">No vendor outsource data found</p>
                        </td>
                      </tr>
                    ) : (
                      jobIdentifiers.map((identifier) => {
                        const summary = jobSummary[identifier];
                        if (!summary) return null;

                        return (
                          <tr
                            key={identifier}
                            className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                            onClick={() => setSelectedJobNo(identifier)}
                          >
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-blue-600 text-sm leading-normal">
                                {getIdentifierDisplayName(identifier)}
                              </p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {getJobTypeBadge(summary.jobType)}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-sm">{summary.jobCategory}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-sm">{summary.uniqueJoCount}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-sm">{summary.totalQty}</p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 mt-3 px-2 flex justify-between">
            <div>
              Total Jobs: {jobIdentifiers.length} | Total Items: {filteredData.length}
            </div>
          </div>
        </div>
      </div>
      </PageGuard>
    </div>
  );
}