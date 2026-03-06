"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import StorageManager from "../../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaChevronDown, FaChevronRight, FaArrowLeft } from "react-icons/fa";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

type Row = {
  id: string;
  jo_no?: string | null;
  item_no?: number | null;
  machine_category?: string | null;
  machine_size?: string | null;
  machine_code?: string | null;
  worker_name?: string | null;
  quantity_no?: number | null;
  assigning_date?: string | null;
  serial_no?: string | null;
  job_id?: string | null;
  jobId?: string | null;
  job_category?: string | null;
  review_for?: "welding" | "vendor" | null;
  status?: string | null;
  job?: {
    id?: string | null;
  } | null;
};

export default function NotOkWeldingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJo, setSelectedJo] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";
  const REVIEW_FOR = "welding";

  const buildQS = () => {
    const q = new URLSearchParams();
    q.set("filter", filterParam);
    if (client) q.set("client", client);
    q.set("review_for", REVIEW_FOR);
    return q.toString();
  };

  const goQcWeldingPage = () => {
    router.push(`/qc/welding?${buildQS()}`);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosProvider.get("/fineengg_erp/assign-to-worker", {
        params: {
          job_type: filterParam,
          status: "not-ok",
          review_for: REVIEW_FOR,
          ...(client ? { client } : {}),
        },
      } as any);

      const fetchedData = Array.isArray(response?.data?.data) ? response.data.data : [];
      setData(fetchedData);
    } catch (error: any) {
      console.error("Error fetching not-ok welding data:", error);
      toast.error(error?.response?.data?.error || "Failed to load Not OK Welding data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterParam, client]);

  const groupedData = useMemo(() => {
    const groups: Record<string, Row[]> = {};
    data.forEach((item) => {
      const jo = item.jo_no || "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });
    return groups;
  }, [data]);

  const toggleGroup = (jo: string) => {
    setExpandedGroups((prev) => ({ ...prev, [jo]: !prev[jo] }));
  };

  const getJobId = (items: Row[]) =>
    items?.[0]?.jobId || items?.[0]?.job_id || items?.[0]?.job?.id;

  const handleJobBackToQC = async (items: Row[]) => {
    const result = await Swal.fire({
      title: "Send back to QC?",
      text: "This job will move back to QC Welding.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Send to QC",
    });

    if (!result.isConfirmed) return;

    const job_id = getJobId(items);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/backToQc`, {
        updated_by,
        review_for: REVIEW_FOR,
      });

      toast.success("Job sent back to QC Welding successfully");
      goQcWeldingPage();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send back to QC");
    }
  };

  const handleRework = async (items: Row[]) => {
    const result = await Swal.fire({
      title: "Send for rework?",
      text: "This job will be sent for rework.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Rework",
    });

    if (!result.isConfirmed) return;

    const job_id = getJobId(items);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/rework`, { updated_by });
      toast.success("Job sent for rework successfully");
      fetchData();
      setSelectedJo(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Rework failed");
    }
  };

  const handleJobRejected = async (items: Row[]) => {
    const result = await Swal.fire({
      title: "Reject this job?",
      text: "This will reject the selected Not OK job.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reject",
    });

    if (!result.isConfirmed) return;

    const job_id = getJobId(items);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/reject-not-ok`, {
        updated_by,
        review_for: REVIEW_FOR,
      });

      toast.success("Job rejected successfully");
      fetchData();
      setSelectedJo(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Reject failed");
    }
  };

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />

      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
        <div className="absolute bottom-0 right-0 pointer-events-none">
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#232323]">Not OK • Welding</h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing only <b>status = not-ok</b> and <b>review_for = welding</b>
              </p>
            </div>
          </div>

          <div className="relative overflow-x-auto sm:rounded-lg">
            {selectedJo ? (
              <>
                <button
                  onClick={() => setSelectedJo(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mb-4"
                >
                  <FaArrowLeft />
                  Back
                </button>

                <h3 className="text-lg font-semibold mb-4">Details for JO: {selectedJo}</h3>

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
                      <th className="px-2 py-0 border border-tableBorder">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(() => {
                      const jo = selectedJo;
                      if (!jo || !groupedData[jo]) {
                        return (
                          <tr>
                            <td colSpan={10} className="px-4 py-6 text-center border border-tableBorder">
                              Job not found or has no items.
                            </td>
                          </tr>
                        );
                      }

                      const items = groupedData[jo];
                      const isExpanded = expandedGroups[jo] ?? true;

                      return (
                        <>
                          <tr className="border border-tableBorder bg-white hover:bg-primary-100">
                            <td
                              className="px-2 py-2 border border-tableBorder cursor-pointer"
                              onClick={() => toggleGroup(jo)}
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                <p className="text-blue-600 text-base leading-normal">{jo}</p>
                              </div>
                            </td>

                            <td colSpan={8} className="px-2 py-2 border border-tableBorder"></td>

                            <td className="px-2 py-2 border border-tableBorder">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJobBackToQC(items);
                                  }}
                                  className="px-6 py-2 bg-[#EAB308] text-white rounded-md hover:opacity-90 text-sm font-medium"
                                >
                                  QC
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRework(items);
                                  }}
                                  className="px-6 py-2 bg-[#EF4444] text-white rounded-md hover:opacity-90 text-sm font-medium"
                                >
                                  Rework
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJobRejected(items);
                                  }}
                                  className="px-6 py-2 bg-[#22C55E] text-white rounded-md hover:opacity-90 text-sm font-medium"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded &&
                            items.map((item) => (
                              <tr key={item.id} className="border border-tableBorder bg-gray-50">
                                <td className="px-2 py-2 border border-tableBorder"></td>
                                <td className="px-2 py-2 border border-tableBorder">{item.serial_no || "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.item_no ?? "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.machine_category || "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.machine_size || "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.machine_code || "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.worker_name || "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.quantity_no ?? "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder">{item.assigning_date || "-"}</td>
                                <td className="px-2 py-2 border border-tableBorder"></td>
                              </tr>
                            ))}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4">Not OK Welding Jobs</h3>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">JO No</th>
                      <th className="px-2 py-0 border border-tableBorder">Job Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Items</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center border border-tableBorder">
                          Loading...
                        </td>
                      </tr>
                    ) : Object.keys(groupedData).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      Object.keys(groupedData).map((jo) => {
                        const items = groupedData[jo];
                        const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
                        const assigningDate = items.length > 0 ? items[0].assigning_date : "N/A";
                        const jobCategory = items.length > 0 ? items[0].job_category : "N/A";

                        return (
                          <tr
                            key={jo}
                            className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                            onClick={() => setSelectedJo(jo)}
                          >
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-blue-600 text-base leading-normal">{jo}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">{jobCategory || "-"}</td>
                            <td className="px-2 py-2 border border-tableBorder">{items.length}</td>
                            <td className="px-2 py-2 border border-tableBorder">{totalQty}</td>
                            <td className="px-2 py-2 border border-tableBorder">{assigningDate || "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </>
            )}

            <div className="text-xs text-gray-500 mt-3">
              QC will move the job back to <b>QC • Welding</b>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}