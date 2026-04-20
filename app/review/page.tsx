"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, Fragment } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
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

// ==================== PERMISSION CHECKS FOR JOB, TSO, KANBAN ONLY ====================

// Check review edit permission by client + tab.
// Backend commonly provides production1.* for review edit; keep prod2/3 as fallback.
const canPerformReviewAction = (
  permissions: any[] | null,
  clientName: string,
  filterType: string,
  assignTo: string
): boolean => {
  if (!permissions) return false;

  const normalizedClient = String(clientName || "").toLowerCase();
  const clientKey = normalizedClient.includes("equip")
    ? "eqp"
    : normalizedClient.includes("bio")
    ? "bio"
    : null;

  const filterKeyMap: Record<string, string> = {
    JOB_SERVICE: "job",
    TSO_SERVICE: "tso",
    KANBAN: "kanban",
  };
  const filterKey = filterKeyMap[filterType];

  if (!clientKey || !filterKey) return false;

  const normalizedAssignTo = String(assignTo || "").trim().toLowerCase();
  const productionKey =
    normalizedAssignTo === "usmaan"
      ? "production1"
      : normalizedAssignTo === "riyaaz"
      ? "production2"
      : normalizedAssignTo === "ramzaan"
      ? "production3"
      : null;

  // If assign_to is present, enforce exact production permission only.
  if (productionKey) {
    return hasPermission(
      permissions,
      `${productionKey}.${clientKey}.review.${filterKey}.edit`
    );
  }

  // Fallback for legacy routes where assign_to is missing.
  return (
    hasPermission(permissions, `production1.${clientKey}.review.${filterKey}.edit`) ||
    hasPermission(permissions, `production2.${clientKey}.review.${filterKey}.edit`) ||
    hasPermission(permissions, `production3.${clientKey}.review.${filterKey}.edit`)
  );
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
  status?: string | null;
  job?: {
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    client_name?: string | null;
    assign_to?: string | null;
    jo_number?: string | null;
    item_description?: string | null;
    item_no?: string | null;
    product_desc?: string | null;
    product_qty?: number | string | null;
    product_item_no?: string | null;
    qty?: number | string | null;
    moc?: string | null;
    bin_location?: string | null;
    assign_date?: string | null;
  } | null;
};

export default function QcMainPage() {
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
  const assignTo = searchParams.get("assign_to") || "";

  const permissions = storage.getUserPermissions();
  
  // Single permission check for all review actions (QC, Machine, Welding, Vendor)
  // All actions use the same permission - based on client + filter type
  const canReview = canPerformReviewAction(permissions, client, filterParam, assignTo);

  console.log("URL Parameters:", { filterParam, client, assignTo });
  console.log("Has Review Permission:", canReview);
  console.log("User Permissions:", permissions?.map(p => p.name));

  const fetchCategories = async () => {
    try {
      let url = "/fineengg_erp/system/categories";
      const params: any = {};
      
      if (filterParam === "TSO_SERVICE") {
        url = "/fineengg_erp/system/tso-service-categories";
      } else if (filterParam === "KANBAN") {
        url = "/fineengg_erp/system/kanban-categories";
      }
      
      if (client) params.client_name = client;
      if (assignTo) params.assign_to = assignTo;
      
      const response = await axiosProvider.get(url, { params } as any);
      let cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      if (filterParam === "JOB_SERVICE") {
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
        cats = Array.from(uniqueMap.values());
      }
      
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log(`Fetching ${filterParam} data with params:`, {
        job_type: filterParam,
        status: "in-review",
        client_name: client,
        assign_to: assignTo
      });

      const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
        params: {
          job_type: filterParam,
          status: "in-review",
          ...(client ? { client_name: client } : {}),
          ...(assignTo ? { assign_to: assignTo } : {}),
        },
      } as any);

      console.log("API Response:", response?.data);

      let fetchedData = Array.isArray(response?.data?.data) ? response.data.data : [];
      
      console.log("Fetched Data length:", fetchedData.length);
      
      if (fetchedData.length > 0) {
        console.log("Sample data item:", fetchedData[0]);
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
  }, [client, assignTo, filterParam]);

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [filterParam, client, assignTo]);

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

    if (assignTo) {
      currentData = currentData.filter((item) => item.job?.assign_to === assignTo);
    }

    return currentData;
  }, [data, jobServiceCategoryFilter, tsoSubFilter, kanbanSubFilter, filterParam, assignTo]);

  // Get unique job numbers
  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    
    filteredData.forEach((item) => {
      let identifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        identifier = item.jo_no;
      } else {
        identifier = item.job_no || item.job?.job_no;
      }
      if (identifier) ids.add(identifier);
    });
    
    return Array.from(ids);
  }, [filteredData, filterParam]);

  const getItemsForIdentifier = (identifier: string) => {
    const items = filteredData.filter((item) => {
      let itemIdentifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        itemIdentifier = item.jo_no;
      } else {
        itemIdentifier = item.job_no || item.job?.job_no;
      }
      return itemIdentifier === identifier;
    });
    
    return items;
  };

  const jobSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        totalQty: number;
        uniqueJoCount: number;
        jobCategory: string;
        assigningDate: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = filteredData.filter((item) => {
        let itemIdentifier: string | null | undefined;
        if (filterParam === "TSO_SERVICE") {
          itemIdentifier = item.tso_no || item.job?.tso_no;
        } else if (filterParam === "KANBAN") {
          itemIdentifier = item.jo_no;
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

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
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

  const actionConfirm = async (title: string, text: string, confirm: string, serialNo?: string) => {
    const message = serialNo ? `${text} (Serial: ${serialNo})` : text;
    const r = await Swal.fire({
      title,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirm,
    });
    return r.isConfirmed;
  };

  const postAction = async (id: string, endpoint: string, successMsg: string, serialNo?: string) => {
    if (!canReview) {
      toast.error("You don't have permission to perform this action");
      return;
    }
    
    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${id}/${endpoint}`, null);
      const msg = serialNo ? `${successMsg} - Serial: ${serialNo}` : successMsg;
      toast.success(msg);
      fetchData();
      setSelectedJobNo(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Action failed");
    }
  };

  const handleQc = async (id: string, serialNo?: string) => {
    if (!canReview) {
      toast.error("You don't have permission to perform QC action");
      return;
    }
    if (!(await actionConfirm("QC?", "Mark Ready for QC?", "Yes, QC", serialNo))) return;
    postAction(id, "ready-for-qc", "Moved to Ready for QC", serialNo);
  };

  const handleMachine = async (id: string, serialNo?: string) => {
    if (!canReview) {
      toast.error("You don't have permission to perform Machine action");
      return;
    }
    if (!(await actionConfirm("Machine?", "Send back to In-Progress?", "Yes, Machine", serialNo))) return;
    postAction(id, "reject", "Moved to In-Progress", serialNo);
  };

  const handleWelding = async (id: string, serialNo?: string) => {
    if (!canReview) {
      toast.error("You don't have permission to perform Welding action");
      return;
    }
    if (!(await actionConfirm("Welding?", "Send to QC Welding queue?", "Yes, Welding", serialNo))) return;
    postAction(id, "welding", "Moved to QC Welding", serialNo);
  };

  const handleVendor = async (id: string, serialNo?: string) => {
    if (!canReview) {
      toast.error("You don't have permission to perform Vendor action");
      return;
    }
    if (!(await actionConfirm("Vendor?", "Send to Vendor Outsource queue?", "Yes, Vendor", serialNo))) return;
    postAction(id, "vendor", "Moved to Vendor Outsource", serialNo);
  };

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
              Review • {filterParam.replace("_", " ")}
              {client && ` • ${client === "BIO" ? "Amar Biosystem" : client === "EQUIPMENT" ? "Amar Equipment" : client}`}
              {assignTo && ` • ${assignTo}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className="font-semibold">in-review</span>
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

                <h2 className="text-xl font-bold mb-4">
                  {filterParam === "TSO_SERVICE"
                    ? "TSO"
                    : filterParam === "KANBAN"
                    ? "J/O Number"
                    : "Job"}: {selectedJobNo}
                </h2>

                {/* JO Details Table */}
                <div className="relative overflow-x-auto sm:rounded-lg">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                      <tr className="border border-tableBorder">
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">J/O No</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Product Desc</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Product Item No</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Product Qty</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Item Description</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Item No</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">MOC</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Qty</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Serial No</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Actions</div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const items = getItemsForIdentifier(selectedJobNo);
                        if (items.length === 0) {
                          return (
                            <tr>
                              <td colSpan={10} className="px-4 py-6 text-center border border-tableBorder">
                                <p className="text-[#666666] text-base">No data found</p>
                              </td>
                            </tr>
                          );
                        }
                        return items.map((item) => (
                          <tr
                            className="border border-tableBorder bg-white hover:bg-primary-100"
                            key={item.id}
                          >
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.jo_no || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.job?.product_desc || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.job?.product_item_no || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.job?.product_qty || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.job?.item_description || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.item_no ?? item.job?.item_no ?? "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm leading-normal">{item.job?.moc || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm font-semibold text-yellow-600 leading-normal">{item.quantity_no ?? item.job?.qty ?? "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <p className="text-[#232323] text-sm font-mono leading-normal">{item.serial_no || "-"}</p>
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  onClick={() => handleQc(item.id, item.serial_no || undefined)}
                                  className={`px-2 py-1 rounded text-xs ${
                                    canReview 
                                      ? "bg-green-500 hover:bg-green-600 text-white" 
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                  title={`QC Serial: ${item.serial_no || 'N/A'}`}
                                  disabled={!canReview}
                                >
                                  QC
                                </button>
                                <button
                                  onClick={() => handleMachine(item.id, item.serial_no || undefined)}
                                  className={`px-2 py-1 rounded text-xs ${
                                    canReview 
                                      ? "bg-orange-500 hover:bg-orange-600 text-white" 
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                  title={`Machine Serial: ${item.serial_no || 'N/A'}`}
                                  disabled={!canReview}
                                >
                                  M/C
                                </button>
                                <button
                                  onClick={() => handleWelding(item.id, item.serial_no || undefined)}
                                  className={`px-2 py-1 rounded text-xs ${
                                    canReview 
                                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                  title={`Welding Serial: ${item.serial_no || 'N/A'}`}
                                  disabled={!canReview}
                                >
                                  WLD
                                </button>
                                <button
                                  onClick={() => handleVendor(item.id, item.serial_no || undefined)}
                                  className={`px-2 py-1 rounded text-xs ${
                                    canReview 
                                      ? "bg-purple-500 hover:bg-purple-600 text-white" 
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                  title={`Vendor Serial: ${item.serial_no || 'N/A'}`}
                                  disabled={!canReview}
                                >
                                  VEN
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {filterParam === "TSO_SERVICE"
                    ? "TSO Review"
                    : filterParam === "KANBAN"
                    ? "Kanban Review"
                    : "Jobs Review"}
                </h2>

                {/* Jobs Summary Table */}
                <div className="relative overflow-x-auto sm:rounded-lg">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                      <tr className="border border-tableBorder">
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">
                              {filterParam === "TSO_SERVICE" ? "TSO No" : filterParam === "KANBAN" ? "J/O Number" : "Job No"}
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Category</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Total JO</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Total Quantity</div>
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Assigning Date</div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                            <p className="text-[#666666] text-base">Loading...</p>
                          </td>
                        </tr>
                      ) : jobIdentifiers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                            <p className="text-[#666666] text-base">No data found</p>
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
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-blue-600 text-sm font-medium leading-normal cursor-pointer underline">
                                  {identifier}
                                </p>
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-[#232323] text-sm leading-normal">{summary.jobCategory}</p>
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-[#232323] text-sm leading-normal">{summary.uniqueJoCount}</p>
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-[#232323] text-sm font-semibold text-yellow-600 leading-normal">{summary.totalQty}</p>
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-[#232323] text-sm leading-normal">{summary.assigningDate || "-"}</p>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 mt-3 px-2 flex justify-between">
            <div>
              Total Jobs: {jobIdentifiers.length} | Total Items: {filteredData.length}
            </div>
            <div className="text-xs text-gray-400">
              {canReview ? "Actions are per serial number" : "You don't have permission to review"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}