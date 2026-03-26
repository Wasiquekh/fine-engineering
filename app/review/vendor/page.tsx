"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, Fragment } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import StorageManager from "../../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

// Types
type QcRow = {
  id: string;
  job_id?: string | null;
  job_no?: string | null;
  tso_no?: string | null;
  jo_no?: string | null;
  serial_no?: string | null;
  item_no?: number | string | null;
  machine_category?: string | null;
  machine_size?: string | null;
  machine_code?: string | null;
  worker_name?: string | null;
  quantity_no?: number | string | null;
  assigning_date?: string | null;
  review_for?: "vendor" | "welding" | null;
  job_category?: string | null;
  job_type?: string | null;
  job?: {
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    client_name?: string | null;
    job_type?: string | null;
  } | null;
};

export default function ReviewVendorPage() {
  const [data, setData] = useState<QcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);

  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";
  const assignTo = searchParams.get("assign_to") || "";

  console.log("Review Vendor Page - URL Params:", { filterParam, client, assignTo });

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories", {
        params: {
          ...(client ? { client_name: client } : {}),
        },
      } as any);
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

      setCategories(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL job types for vendor review
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allData: QcRow[] = [];

      for (const jobType of jobTypes) {
        const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
          params: {
            job_type: jobType,
            status: "in-review",
            review_for: "vendor",
            ...(client ? { client_name: client } : {}),
          },
        } as any);

        const fetchedData = Array.isArray(response?.data?.data) ? response.data.data : [];
        
        // Add job_type to each item
        const dataWithJobType = fetchedData.map((item: any) => ({
          ...item,
          job_type: jobType
        }));
        
        allData = [...allData, ...dataWithJobType];
      }

      console.log(`Fetched ${allData.length} vendor review items`);
      setData(allData);
    } catch (error) {
      console.error("Error fetching vendor review data:", error);
      toast.error("Failed to load vendor review data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [client]);

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [client]);

  const filteredData = useMemo(() => {
    if (jobServiceCategoryFilter === "ALL") return data;

    return data.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  }, [data, jobServiceCategoryFilter]);

  // Get unique identifiers based on job type
  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    
    filteredData.forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (jobType === "TSO_SERVICE") {
        const tsoNo = item.tso_no || item.job?.tso_no;
        if (tsoNo) ids.add(`TSO:${tsoNo}`);
      } else {
        const jobNo = item.job_no || item.job?.job_no;
        if (jobNo) ids.add(`JOB:${jobNo}`);
      }
    });
    
    return Array.from(ids);
  }, [filteredData]);

  const getJoGroupsForIdentifier = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    
    const items = filteredData.filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      
      if (type === "TSO" && jobType === "TSO_SERVICE") {
        return (item.tso_no || item.job?.tso_no) === actualId;
      } else if (type === "JOB" && (jobType === "JOB_SERVICE" || jobType === "KANBAN")) {
        return (item.job_no || item.job?.job_no) === actualId;
      }
      return false;
    });
    
    const groups: Record<string, QcRow[]> = {};

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
        assigningDate: string;
        jobType: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const [type, actualId] = identifier.split(':');
      
      const items = filteredData.filter((item) => {
        const jobType = item.job_type || item.job?.job_type;
        
        if (type === "TSO" && jobType === "TSO_SERVICE") {
          return (item.tso_no || item.job?.tso_no) === actualId;
        } else if (type === "JOB" && (jobType === "JOB_SERVICE" || jobType === "KANBAN")) {
          return (item.job_no || item.job?.job_no) === actualId;
        }
        return false;
      });

      const totalQty = items.reduce(
        (sum, item) => sum + (Number(item.quantity_no) || 0),
        0
      );

      const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;

      const jobCategory =
        items.length > 0
          ? items[0].job_category || items[0].job?.job_category || "N/A"
          : "N/A";

      const assigningDate = items.length > 0 ? items[0].assigning_date || "N/A" : "N/A";
      
      const jobType = items.length > 0 
        ? (items[0].job_type || items[0].job?.job_type || "JOB_SERVICE")
        : "JOB_SERVICE";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
        jobType,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers]);

  const uniqueCategories = useMemo(() => categories, [categories]);

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

  const postAction = async (id: string, endpoint: string, successMsg: string) => {
    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${id}/${endpoint}`, null);
      toast.success(successMsg);
      fetchData();
      setSelectedJobNo(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Action failed");
    }
  };

  const handleQc = async (id: string) => {
    if (!(await actionConfirm("QC?", "Mark Ready for QC?", "Yes, QC"))) return;
    postAction(id, "ready-for-qc", "Moved to Ready for QC");
  };

  const handleMachine = async (id: string) => {
    if (!(await actionConfirm("Machine?", "Send back to In-Progress?", "Yes, Machine"))) return;
    postAction(id, "reject", "Moved to In-Progress");
  };

  const handleWelding = async (id: string) => {
    if (!(await actionConfirm("Welding?", "Send to QC Welding queue?", "Yes, Welding"))) return;
    postAction(id, "welding", "Moved to QC Welding");
  };

  const handleVendor = async (id: string) => {
    if (!(await actionConfirm("Vendor?", "Send to Vendor Outsource queue?", "Yes, Vendor"))) return;
    postAction(id, "vendor", "Moved to Vendor Outsource");
  };

  // Get display name for identifier
  const getIdentifierDisplayName = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    if (type === "TSO") {
      return `TSO: ${actualId}`;
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
      TOTAL: data.length
    };
    
    data.forEach(item => {
      const type = item.job_type || item.job?.job_type;
      if (type === "JOB_SERVICE") counts.JOB_SERVICE++;
      else if (type === "TSO_SERVICE") counts.TSO_SERVICE++;
      else if (type === "KANBAN") counts.KANBAN++;
    });
    
    return counts;
  }, [data]);

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
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
              Review Vendor • All Services
              {client && ` • ${client}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className="font-semibold">in-review</span> | review_for:{" "}
              <span className="font-semibold">vendor</span>
            </p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">JOB: {countsByType.JOB_SERVICE}</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">TSO: {countsByType.TSO_SERVICE}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">KANBAN: {countsByType.KANBAN}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">TOTAL: {countsByType.TOTAL}</span>
            </div>
          </div>

          {uniqueCategories.length > 0 && (
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

              {uniqueCategories.map((cat) => (
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

                <h2 className="text-xl font-bold mb-4">
                  {selectedJobNo.startsWith('TSO:') ? 'TSO' : 'Job'}: {selectedJobNo.split(':')[1] || selectedJobNo}
                </h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">JO No</th>
                      <th className="px-2 py-0 border border-tableBorder">Serial No</th>
                      <th className="px-2 py-0 border border-tableBorder">Item No</th>
                      <th className="px-2 py-0 border border-tableBorder">Machine Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Machine Size</th>
                      <th className="px-2 py-0 border border-tableBorder">Machine Code</th>
                      <th className="px-2 py-0 border border-tableBorder">Worker Name</th>
                      <th className="px-2 py-0 border border-tableBorder">Quantity</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                      <th className="px-2 py-0 border border-tableBorder">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No JO data found</p>
                        </td>
                      </tr>
                    ) : (
                      Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                        <Fragment key={jo}>
                          {/* JO Group Header */}
                          <tr className="border border-tableBorder bg-gray-100">
                            <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={10}>
                              JO: {jo}
                            </td>
                          </tr>
                          
                          {/* Individual Items with Actions */}
                          {items.map((item) => (
                            <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                              <td className="px-2 py-2 border border-tableBorder"></td>
                              <td className="px-2 py-2 border border-tableBorder font-mono">{item.serial_no || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_category || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_size || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_code || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.worker_name || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder font-semibold">{item.quantity_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.assigning_date || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <button
                                    onClick={() => handleQc(item.id)}
                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                    title="Ready for QC"
                                  >
                                    QC
                                  </button>
                                  <button
                                    onClick={() => handleMachine(item.id)}
                                    className="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs"
                                    title="Send to Machine"
                                  >
                                    M/C
                                  </button>
                                  <button
                                    onClick={() => handleWelding(item.id)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                    title="Send to Welding"
                                  >
                                    WLD
                                  </button>
                                  <button
                                    onClick={() => handleVendor(item.id)}
                                    className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                                    title="Send to Vendor"
                                  >
                                    VEN
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Vendor Review - All Services</h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">Job/TSO No</th>
                      <th className="px-2 py-0 border border-tableBorder">Type</th>
                      <th className="px-2 py-0 border border-tableBorder">Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Total JO</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">Loading...</p>
                        </td>
                      </tr>
                    ) : jobIdentifiers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No vendor review data found</p>
                        </td>
                      </tr>
                    ) : (
                      jobIdentifiers.map((identifier) => {
                        const summary = jobSummary[identifier];

                        return (
                          <tr
                            key={identifier}
                            className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                            onClick={() => setSelectedJobNo(identifier)}
                          >
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-blue-600 text-base leading-normal">
                                {getIdentifierDisplayName(identifier)}
                              </p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              {getJobTypeBadge(summary.jobType)}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.jobCategory}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.uniqueJoCount}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.totalQty}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.assigningDate || "-"}</p>
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
            <div className="text-xs text-gray-400">
              Actions are per serial number
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}