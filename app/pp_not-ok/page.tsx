"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

export default function NotOkMainPage() {
  const [data, setData] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";

  const fetchData = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/assign-to-worker", {
        params: {
          job_type: filterParam,
          status: "not-ok",
          ...(client ? { client } : {}),
        },
      } as any);

      let fetchedData = Array.isArray(response.data.data) ? response.data.data : [];

      fetchedData = fetchedData.filter(
        (item: any) => item?.review_for !== "vendor" && item?.review_for !== "welding"
      );

      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching not-ok main data:", error);
      toast.error("Failed to load Not OK data");
      setData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterParam, client]);

  const groupedData = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    data.forEach((item) => {
      const jo = item.jo_no || "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });
    return groups;
  }, [data]);

  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  const toggleGroup = (jo: string) => {
    setExpandedGroups((prev) => ({ ...prev, [jo]: !prev[jo] }));
  };

  const handleJobRejected = async (items: any[]) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to reject this job?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Reject Job!",
    });

    if (!result.isConfirmed) return;

    const job_id = items[0]?.jobId || items[0]?.job_id || items[0]?.job?.id;
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found for the selected items.");
    if (!updated_by) return toast.error("User ID not found. Please log in again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/reject-not-ok`, { updated_by });
      toast.success("Job Rejected successfully");
      fetchData();
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.error || (error as Error).message || "An unknown error occurred";
      toast.error(errorMessage);
    }
  };

  const handleJobBackToQC = async (items: any[]) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to send this job back to QC?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Send Back to QC!",
    });

    if (!result.isConfirmed) return;

    const job_id = items[0]?.jobId || items[0]?.job_id || items[0]?.job?.id;
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found for the selected items.");
    if (!updated_by) return toast.error("User ID not found. Please log in again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/backToQc`, { updated_by });
      toast.success("Job sent back to QC successfully");
      fetchData();
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.error || (error as Error).message || "An unknown error occurred";
      toast.error(errorMessage);
    }
  };

  const handleRework = async (items: any[]) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to send this job for rework?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Rework it!",
    });

    if (!result.isConfirmed) return;

    const job_id = items[0]?.jobId || items[0]?.job_id || items[0]?.job?.id;
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found for the selected items.");
    if (!updated_by) return toast.error("User ID not found. Please log in again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/rework`, { updated_by });
      toast.success("Job sent for rework successfully");
      fetchData();
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.error || (error as Error).message || "An unknown error occurred";
      toast.error(errorMessage);
    }
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
          <div className="mb-4">
            <h2 className="text-xl font-bold">Not OK Jobs</h2>
            <p className="text-sm text-gray-500 mt-1">
              Only normal not-ok data. Vendor/Welding not-ok stay in separate pages.
            </p>
          </div>

          <div className="relative overflow-x-auto sm:rounded-lg">
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
                {Object.keys(groupedData).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center border border-tableBorder">
                      <p className="text-[#666666] text-base">No data found</p>
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedData).map((jo) => {
                    const items = groupedData[jo];
                    const isExpanded = expandedGroups[jo];

                    return (
                      <>
                        <tr key={jo} className="border border-tableBorder bg-white hover:bg-primary-100">
                          <td
                            className="px-2 py-2 border border-tableBorder cursor-pointer"
                            onClick={() => toggleGroup(jo)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                              <p className="text-[#232323] text-base leading-normal">{jo}</p>
                            </div>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJobBackToQC(items);
                                }}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                              >
                                QC
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRework(items);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              >
                                Rework
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJobRejected(items);
                                }}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded &&
                          items.map((item: any) => (
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}