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

// Permission helper function
const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

// Client-based permission check for Amar clients
const canEditForClient = (permissions: any[] | null, clientName: string): boolean => {
  if (!permissions) return false;
  
  // Amar Biosystem client specific permission
  if (clientName === "Amar Biosystem" && hasPermission(permissions, "pp.bio.notok.edit")) {
    return true;
  }
  
  // Amar Equipment client specific permission
  if (clientName === "Amar Equipment" && hasPermission(permissions, "pp.eqp.notok.edit")) {
    return true;
  }
  
  // Default permission for other clients
  return hasPermission(permissions, "not-ok.edit");
};

// TSO Service Categories
const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

// Kanban Categories
const kanbanCategory = [
  { value: "VESSEL", label: "VESSEL" },
  { value: "HEAD", label: "HEAD" },
  { value: "CLAMP", label: "CLAMP" },
  { value: "PILLER_DRIVE_ASSEMBLY", label: "PILLER DRIVE ASSEMBLY" },
  { value: "HEATER_PLATE", label: "HEATER PLATE" },
  { value: "COMPRESSION_RING", label: "COMPRESSION RING" },
  { value: "HEATER_SHELL", label: "HEATER SHELL" },
  { value: "OUTER_RING", label: "OUTER RING" },
  { value: "COOLING_COIL", label: "COOLING COIL" },
  { value: "SPARGER", label: "SPARGER" },
  { value: "HOLLOW_SHAFT", label: "HOLLOW SHAFT" },
  { value: "STIRRER_SHAFT", label: "STIRRER SHAFT" },
];

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
  job?: {
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    client_name?: string | null;
    reason?: string | null;
  } | null;
};

export default function NotokMainPage() {
  const [data, setData] = useState<QcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);

  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";

  const permissions = storage.getUserPermissions();
  // Use client-based permission check for Amar clients
  const canEditNotOk = canEditForClient(permissions, client);

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories");
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

      const formattedCats = Array.from(uniqueMap.values());
      setCategories(formattedCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
        params: {
          job_type: filterParam,
          status: "not-ok",
          ...(client ? { client_name: client } : {}),
        },
      } as any);

      let fetchedData = Array.isArray(response?.data?.data) ? response.data.data : [];

      if (filterParam === "JOB_SERVICE") {
        fetchedData = fetchedData.filter(
          (item: any) => item?.review_for !== "vendor" && item?.review_for !== "welding"
        );
      }

      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching QC data:", error);
      toast.error("Failed to load QC data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [filterParam, client]);

  const getJobId = (item: QcRow) => item.job_id || item.job?.id;

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

  const handleBackToQC = async (item: QcRow) => {
    if (!canEditNotOk) return;
    if (!(await actionConfirm("Send back to QC?", "This serial will move back to QC.", "Yes, Send to QC"))) return;
    
    const job_id = getJobId(item);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/system/jobs/${job_id}/backToQc`, {
        updated_by,
      });

      toast.success("Serial sent back to QC successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send back to QC");
    }
  };

  const handleRework = async (item: QcRow) => {
    if (!canEditNotOk) return;
    if (!item) return;

    if (!(await actionConfirm(
      "Send for rework?",
      `Serial: ${item.serial_no || 'N/A'} will be sent for rework.`,
      "Yes, Rework"
    ))) return;

    const updated_by = storage.getUserId();

    if (!updated_by) {
      toast.error("User not found");
      return;
    }

    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/reject`, {
        updated_by,
      });

      toast.success(`Item ${item.serial_no} sent for rework`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Rework failed");
    }
  };

  const handleReject = async (item: QcRow) => {
    if (!canEditNotOk) return;
    if (!(await actionConfirm("Reject this serial?", "This will reject the selected Not OK serial.", "Yes, Reject"))) return;
    
    const job_id = getJobId(item);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/system/jobs/${job_id}/reject-not-ok`, {
        updated_by,
      });

      toast.success("Serial rejected successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Reject failed");
    }
  };

  const filteredData = useMemo(() => {
    let currentData = [...data];

    if (filterParam === "JOB_SERVICE") {
      if (jobServiceCategoryFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === jobServiceCategoryFilter;
        });
      }
    } else if (filterParam === "TSO_SERVICE") {
      if (tsoSubFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === tsoSubFilter;
        });
      }
    } else if (filterParam === "KANBAN") {
      if (kanbanSubFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === kanbanSubFilter;
        });
      }
    }

    return currentData;
  }, [data, filterParam, jobServiceCategoryFilter, tsoSubFilter, kanbanSubFilter]);

  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    filteredData.forEach((item) => {
      let identifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        identifier = item.jo_no || item.job_no || item.job?.job_no;
      } else {
        identifier = item.job_no || item.job?.job_no;
      }
      if (identifier) ids.add(identifier);
    });
    return Array.from(ids);
  }, [filteredData, filterParam]);

  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = filteredData.filter((item) => {
      let itemIdentifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
      } else {
        itemIdentifier = item.job_no || item.job?.job_no;
      }
      return itemIdentifier === identifier;
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
        reason: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = filteredData.filter((item) => {
        let itemIdentifier: string | null | undefined;
        if (filterParam === "TSO_SERVICE") {
          itemIdentifier = item.tso_no || item.job?.tso_no;
        } else if (filterParam === "KANBAN") {
          itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
        } else {
          itemIdentifier = item.job_no || item.job?.job_no;
        }
        return itemIdentifier === identifier;
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
      
      const reason = items.length > 0 ? (items[0].job?.reason || "-") : "-";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
        reason,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers, filterParam]);

  const uniqueCategories = useMemo(() => {
    if (filterParam === "JOB_SERVICE") return categories;
    if (filterParam === "TSO_SERVICE") return tsoServiceCategory;
    if (filterParam === "KANBAN") return kanbanCategory;
    return [];
  }, [filterParam, categories]);

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
              Not Ok • {filterParam.replace("_", " ")}
              {client && ` • ${client === "BIO" ? "Amar Biosystem" : client === "EQUIPMENT" ? "Amar Equipment" : client}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className="font-semibold">not-ok</span>
            </p>
          </div>

          {uniqueCategories.length > 0 && (
            <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
              <button
                onClick={() => {
                  if (filterParam === "JOB_SERVICE") setJobServiceCategoryFilter("ALL");
                  if (filterParam === "TSO_SERVICE") setTsoSubFilter("ALL");
                  if (filterParam === "KANBAN") setKanbanSubFilter("ALL");
                }}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filterParam === "JOB_SERVICE"
                    ? jobServiceCategoryFilter === "ALL"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : filterParam === "TSO_SERVICE"
                    ? tsoSubFilter === "ALL"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : filterParam === "KANBAN"
                    ? kanbanSubFilter === "ALL"
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>

              {uniqueCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    if (filterParam === "JOB_SERVICE") setJobServiceCategoryFilter(cat.value);
                    if (filterParam === "TSO_SERVICE") setTsoSubFilter(cat.value);
                    if (filterParam === "KANBAN") setKanbanSubFilter(cat.value);
                  }}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    filterParam === "JOB_SERVICE"
                      ? jobServiceCategoryFilter === cat.value
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                      : filterParam === "TSO_SERVICE"
                      ? tsoSubFilter === cat.value
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                      : filterParam === "KANBAN"
                      ? kanbanSubFilter === cat.value
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
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
                  {filterParam === "TSO_SERVICE"
                    ? "TSO"
                    : filterParam === "KANBAN"
                    ? "J/O Number"
                    : "Job"}: {selectedJobNo}
                </h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999] uppercase font-semibold">
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
                      <th className="px-2 py-0 border border-tableBorder">Reason</th>
                      {canEditNotOk && (
                        <th className="px-2 py-0 border border-tableBorder">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).length === 0 ? (
                      <tr>
                        <td colSpan={canEditNotOk ? 11 : 10} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-sm">No JO data found</p>
                        </td>
                      </tr>
                    ) : (
                      Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                        <Fragment key={jo}>
                          <tr className="border border-tableBorder bg-gray-100">
                            <td className="px-2 py-2 border border-tableBorder font-semibold" colSpan={canEditNotOk ? 11 : 10}>
                              JO: {jo}
                            </td>
                          </tr>

                          {items.map((item) => (
                            <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50">
                              <td className="px-2 py-2 border border-tableBorder">—</td>
                              <td className="px-2 py-2 border border-tableBorder font-mono">{item.serial_no || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_category || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_size || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.machine_code || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.worker_name || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder font-semibold">{item.quantity_no ?? "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">{item.assigning_date || "-"}</td>
                              <td className="px-2 py-2 border border-tableBorder">
                                <span className="text-red-600 text-xs font-medium">
                                  {item.job?.reason || "-"}
                                </span>
                              </td>
                              {canEditNotOk && (
                                <td className="px-2 py-2 border border-tableBorder">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <button
                                      onClick={() => handleBackToQC(item)}
                                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                      title="Send back to QC"
                                    >
                                      QC
                                    </button>
                                    <button
                                      onClick={() => handleRework(item)}
                                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                      title="Send for rework"
                                    >
                                      Rework
                                    </button>
                                    <button
                                      onClick={() => handleReject(item)}
                                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                                      title="Reject this serial"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>

                {canEditNotOk && (
                  <div className="text-xs text-gray-400 mt-2 px-2 text-right">
                    Actions are per serial number
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  {filterParam === "TSO_SERVICE"
                    ? "Not OK TSOs"
                    : filterParam === "KANBAN"
                    ? "Not OK Kanban"
                    : "Not OK Jobs"}
                </h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">
                        {filterParam === "TSO_SERVICE"
                          ? "TSO No"
                          : filterParam === "KANBAN"
                          ? "J/O Number"
                          : "Job No"}
                      </th>
                      <th className="px-2 py-0 border border-tableBorder">Job Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Total JO</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                      <th className="px-2 py-0 border border-tableBorder">Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-sm">Loading...</p>
                        </td>
                      </tr>
                    ) : jobIdentifiers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-sm">No data found</p>
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
                              <p className="text-blue-600 text-sm leading-normal">{identifier}</p>
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
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-sm">{summary.assigningDate || "-"}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-red-600 text-xs font-medium">{summary.reason}</p>
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

          <div className="text-xs text-gray-500 mt-3 px-2">
            Total {filterParam === "TSO_SERVICE" ? "TSOs" : filterParam === "KANBAN" ? "J/O Numbers" : "Jobs"}: {jobIdentifiers.length} | Total Items: {filteredData.length}
          </div>
        </div>
      </div>
    </div>
  );
}