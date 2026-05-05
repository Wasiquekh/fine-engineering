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
import { sendRoleNotificationByEvent } from "../../services/pushNotificationApi";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some((p) => p.name === permissionName);
};

const canPerformReviewAction = (
  permissions: any[] | null,
  clientName: string,
  reviewType: "welding" | "vendor",
  assignTo: string
): boolean => {
  if (!permissions) return false;

  const normalizedClient = String(clientName || "").toLowerCase();
  const clientKey = normalizedClient.includes("equip")
    ? "eqp"
    : normalizedClient.includes("bio")
    ? "bio"
    : null;

  if (!clientKey) return false;

  const normalizedAssignTo = String(assignTo || "").trim().toLowerCase();
  const productionKey =
    normalizedAssignTo === "usmaan"
      ? "production1"
      : normalizedAssignTo === "riyaaz"
      ? "production2"
      : normalizedAssignTo === "ramzaan"
      ? "production3"
      : null;

  if (productionKey) {
    return hasPermission(
      permissions,
      `${productionKey}.${clientKey}.review.${reviewType}.edit`
    );
  }

  return (
    hasPermission(permissions, `production1.${clientKey}.review.${reviewType}.edit`) ||
    hasPermission(permissions, `production2.${clientKey}.review.${reviewType}.edit`) ||
    hasPermission(permissions, `production3.${clientKey}.review.${reviewType}.edit`)
  );
};

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
    item_no: string | number;
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    job_category?: string | null;
    client_name?: string | null;
    job_type?: string | null;
    jo_number?: string | null;
    item_description?: string | null;
    product_desc?: string | null;
    product_qty?: number | string | null;
    product_item_no?: string | null;
    qty?: number | string | null;
    moc?: string | null;
    bin_location?: string | null;
    assign_to?: string | null;
    assign_date?: string | null;
  } | null;
};

export default function ReviewVendorPage() {
  const [data, setData] = useState<QcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);

  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [jobServiceMetaByJobNo, setJobServiceMetaByJobNo] = useState<
    Record<
      string,
      {
        job_category?: string | null;
        description?: string | null;
        material_type?: string | null;
        qty?: number | string | null;
        bar?: string | null;
        tempp?: string | null;
      }
    >
  >({});

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "ALL";
  const client = searchParams.get("client") || "";
  const assignTo = searchParams.get("assign_to") || "";
  const permissions = storage.getUserPermissions();
  const currentUserName = storage.getUserName() || storage.getUserEmail() || "";
  const canReview = canPerformReviewAction(permissions, client, "vendor", assignTo);

  console.log("Review Vendor Page - URL Params:", { filterParam, client, assignTo });

  const fetchCategories = async () => {
    try {
      let url = "/fineengg_erp/system/categories";
      if (filterParam === "TSO_SERVICE") {
        url = "/fineengg_erp/system/tso-service-categories";
      } else if (filterParam === "KANBAN") {
        url = "/fineengg_erp/system/kanban-categories";
      }
      const response = await axiosProvider.get(url, {
        params: {
          ...(client ? { client_name: client } : {}),
        },
      } as any);
      const cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      const uniqueMap = new Map<string, { value: string; label: string }>();
      const metaMap: Record<
        string,
        {
          job_category?: string | null;
          description?: string | null;
          material_type?: string | null;
          qty?: number | string | null;
          bar?: string | null;
          tempp?: string | null;
        }
      > = {};

      cats.forEach((cat: any) => {
        const jobCategory = String(cat?.job_category || "").trim();
        const jobNo = String(cat?.job_no || "").trim();
        if (jobCategory && !uniqueMap.has(jobCategory)) {
          uniqueMap.set(jobCategory, {
            value: jobCategory,
            label: jobCategory,
          });
        }
        if (jobNo && !metaMap[jobNo]) {
          metaMap[jobNo] = {
            job_category: cat?.job_category ?? null,
            description: cat?.description ?? null,
            material_type: cat?.material_type ?? null,
            qty: cat?.qty ?? null,
            bar: cat?.bar ?? null,
            tempp: cat?.tempp ?? null,
          };
        }
      });

      setCategories(Array.from(uniqueMap.values()));
      setJobServiceMetaByJobNo(metaMap);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      setJobServiceMetaByJobNo({});
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const allowedJobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      const jobTypes = allowedJobTypes;
      let allData: QcRow[] = [];

      for (const jobType of jobTypes) {
        const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
          params: {
            job_type: jobType,
            status: "in-review",
            review_for: "vendor",
            ...(client ? { client_name: client } : {}),
            ...(assignTo ? { assign_to: assignTo } : {}),
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
      console.log("Items by type:", {
        JOB: allData.filter(d => d.job_type === "JOB_SERVICE").length,
        TSO: allData.filter(d => d.job_type === "TSO_SERVICE").length,
        KANBAN: allData.filter(d => d.job_type === "KANBAN").length
      });
      
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
  }, [client, filterParam]);

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [client, assignTo]);

  const filteredData = useMemo(() => {
    let current = [...data];

    if (jobServiceCategoryFilter === "ALL") return current;

    return current.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  }, [data, jobServiceCategoryFilter, filterParam]);

  // Get unique identifiers based on job type
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
        identifier = item.jo_no;
        if (identifier) ids.add(`KANBAN:${identifier}`);
      } 
      else {
        identifier = item.job_no || item.job?.job_no;
        if (identifier) ids.add(`JOB:${identifier}`);
      }
    });
    
    return Array.from(ids);
  }, [filteredData]);

  // Get items for identifier
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
      else if (type === "JOB" && (jobType === "JOB_SERVICE" || jobType === "KANBAN")) {
        return (item.job_no || item.job?.job_no) === actualId;
      }
      return false;
    });
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

      const selectedRow = data.find((x) => String(x.id) === String(id));
      const notifyPayload = {
        joNo: String(selectedRow?.jo_no || selectedRow?.job?.jo_number || selectedRow?.job_no || ""),
        joNumber: String(selectedRow?.job?.jo_number || selectedRow?.jo_no || ""),
        jobNo: String(selectedRow?.job_no || selectedRow?.job?.job_no || ""),
        clientName: String(selectedRow?.job?.client_name || client || ""),
        jobType: String(selectedRow?.job_type || selectedRow?.job?.job_type || filterParam || "JOB_SERVICE"),
        assignedBy: currentUserName,
        sendAll: false as const,
      };

      if (endpoint === "ready-for-qc") {
        await sendRoleNotificationByEvent({
          eventKey: "moved_to_qc",
          ...notifyPayload,
          source: "review_vendor_ready_for_qc",
        });
      } else if (endpoint === "vendor") {
        await sendRoleNotificationByEvent({
          eventKey: "sent_to_vendor",
          ...notifyPayload,
          source: "review_vendor_sent_to_vendor",
        });
      } else if (endpoint === "welding") {
        await sendRoleNotificationByEvent({
          eventKey: "moved_to_welding",
          ...notifyPayload,
          source: "review_vendor_sent_to_welding",
        });
      } else if (endpoint === "reject") {
        await sendRoleNotificationByEvent({
          eventKey: "returned_to_in_progress",
          ...notifyPayload,
          source: "review_vendor_returned_to_in_progress",
        });
      }

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

  const getIdentifierDisplayName = (identifier: string) => {
    const [type, actualId] = identifier.split(':');
    if (type === "TSO") {
      return `TSO: ${actualId}`;
    } else if (type === "KANBAN") {
      return `KANBAN: ${actualId}`;
    }
    return actualId;
  };

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
            <div className="inline-flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
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
                  {getIdentifierDisplayName(selectedJobNo)}
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
                            <div className="font-semibold">Job Category</div>
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
                            <div className="font-semibold">Machine</div>
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
                              <td colSpan={11} className="px-4 py-6 text-center border border-tableBorder">
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
                              <p className="text-[#232323] text-sm leading-normal">
                                {item.job_category || item.job?.job_category || "-"}
                              </p>
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
                              <p className="text-[#232323] text-sm leading-normal">{item.machine_category || item.machine_code || "-"}</p>
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
                                  title={`Ready for QC - Serial: ${item.serial_no || 'N/A'}`}
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
                                  title={`Send to Machine - Serial: ${item.serial_no || 'N/A'}`}
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
                                  title={`Send to Welding - Serial: ${item.serial_no || 'N/A'}`}
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
                                  title={`Send to Vendor - Serial: ${item.serial_no || 'N/A'}`}
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
                <h2 className="text-xl font-bold mb-4">Vendor Review - All Services</h2>

                {/* Jobs Summary Table */}
                <div className="relative overflow-x-auto sm:rounded-lg">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                      <tr className="border border-tableBorder">
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Job/TSO No</div>
                          </div>
                        </th>
                        {filterParam !== "JOB_SERVICE" && (
                          <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">Type</div>
                            </div>
                          </th>
                        )}
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">Category</div>
                          </div>
                        </th>
                        {filterParam === "JOB_SERVICE" && (
                          <>
                            <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">Description</div>
                              </div>
                            </th>
                            <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">Material Type</div>
                              </div>
                            </th>
                            <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">Quantity</div>
                              </div>
                            </th>
                            <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">Bar</div>
                              </div>
                            </th>
                            <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold">Temperature</div>
                              </div>
                            </th>
                          </>
                        )}
                        {filterParam !== "JOB_SERVICE" && (
                          <>
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
                          </>
                        )}
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
                          <td colSpan={filterParam === "JOB_SERVICE" ? 8 : 6} className="px-4 py-6 text-center border border-tableBorder">
                            <p className="text-[#666666] text-base">Loading...</p>
                          </td>
                        </tr>
                      ) : jobIdentifiers.length === 0 ? (
                        <tr>
                          <td colSpan={filterParam === "JOB_SERVICE" ? 8 : 6} className="px-4 py-6 text-center border border-tableBorder">
                            <p className="text-[#666666] text-base">No vendor review data found</p>
                          </td>
                        </tr>
                      ) : (
                        jobIdentifiers.map((identifier) => {
                          const summary = jobSummary[identifier];
                          if (!summary) return null;
                          const rawIdentifier = identifier.split(":")[1] || "";
                          const meta = jobServiceMetaByJobNo[rawIdentifier];

                          return (
                            <tr
                              key={identifier}
                              className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                              onClick={() => setSelectedJobNo(identifier)}
                            >
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-blue-600 text-sm font-medium leading-normal cursor-pointer underline">
                                  {getIdentifierDisplayName(identifier)}
                                </p>
                              </td>
                              {filterParam !== "JOB_SERVICE" && (
                                <td className="px-4 py-3 border border-tableBorder">
                                  {getJobTypeBadge(summary.jobType)}
                                </td>
                              )}
                              <td className="px-4 py-3 border border-tableBorder">
                                <p className="text-[#232323] text-sm leading-normal">{summary.jobCategory}</p>
                              </td>
                              {filterParam === "JOB_SERVICE" && (
                                <>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm leading-normal">{meta?.description || "-"}</p>
                                  </td>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm leading-normal">{meta?.material_type || "-"}</p>
                                  </td>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm font-semibold text-yellow-600 leading-normal">{meta?.qty ?? summary.totalQty}</p>
                                  </td>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm leading-normal">{meta?.bar || "-"}</p>
                                  </td>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm leading-normal">{meta?.tempp || "-"}</p>
                                  </td>
                                </>
                              )}
                              {filterParam !== "JOB_SERVICE" && (
                                <>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm leading-normal">{summary.uniqueJoCount}</p>
                                  </td>
                                  <td className="px-4 py-3 border border-tableBorder">
                                    <p className="text-[#232323] text-sm font-semibold text-yellow-600 leading-normal">{summary.totalQty}</p>
                                  </td>
                                </>
                              )}
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
              {canReview ? "Actions are per serial number - hover buttons to see serial" : "You don't have permission to review"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}