"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { HiCheck, HiX } from "react-icons/hi";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const router = useRouter();
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const filterParam = searchParams.get("filter");

  const handleApprove = async (items: any[]) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to approve this job?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve it!",
      cancelButtonText: "Cancel",
    });
  
    if (result.isConfirmed) {
      try {
        const itemsToApprove = items.filter(item => !item.is_approve && !item.is_rejected);
        if (itemsToApprove.length === 0) {
          toast.info("All items in this job are already approved.");
          return;
        }
  
        const approvalPromises = itemsToApprove.map(item =>
          axiosProvider.post(`/fineengg_erp/jobs/${item.id}/approve`, {})
        );
  
        await Promise.all(approvalPromises);
        toast.success("Job approved successfully");
        fetchData();
      } catch (error: any) {
        console.error("Error approving job:", error);
        toast.error("Failed to approve job");
      }
    }
  };

  const handleNotApprove = async (items: any[]) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this job as not approved?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, do not approve!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const itemsToNotApprove = items.filter((item) => !item.is_approve && !item.is_rejected);
        if (itemsToNotApprove.length === 0) {
          toast.info("No pending items to mark as not approved.");
          return;
        }

        const notApprovePromises = itemsToNotApprove.map((item) =>
          axiosProvider.post(`/fineengg_erp/jobs/${item.id}/not-approve`, {})
        );

        await Promise.all(notApprovePromises);
        toast.success("Job marked as not approved.");
        fetchData();
      } catch (error: any) {
        console.error("Error rejecting job:", error);
        toast.error("Failed to mark as not approved.");
      }
    }
  };

  const handleJobNoClick = (jobNo: string) => {
    if (!jobNo) return;
    router.push(`/inventory_material_approve/${encodeURIComponent(jobNo)}`);
  };

  const fetchData = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/jobs");
      const updatedData = response.data.data.map((item: any) => ({
        ...item,
        is_approve: item.job_status === 'approved' ? 1 : 0,
        is_rejected: item.job_status === 'not-approved' ? 1 : 0,
      }));
      setData(updatedData);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  };

  useEffect(() => {
    if (filterParam) {
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  const filteredData = useMemo(() => {
    let currentData = data;
    if (clientParam) {
      currentData = currentData.filter((item) => item.client_name === clientParam);
    }
    if (activeFilter === "ALL") return currentData;
    return currentData.filter((item: any) => item.job_type === activeFilter);
  }, [data, activeFilter, clientParam]);

  const groupedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    interface JobGroup {
      job_no: string;
      job_type: string;
      job_category: string;
      items: any[];
      is_approve: number;
      is_rejected: number;
      total_qty: number;
      jo_numbers_list: Set<string>;
    }

    const groups = filteredData.reduce((acc: Record<string, JobGroup>, item: any) => {
      const { job_no } = item;
      if (!job_no) return acc;

      if (!acc[job_no]) {
        acc[job_no] = {
          job_no: item.job_no,
          job_type: item.job_type,
          job_category: item.job_category,
          items: [],
          is_approve: 1,
          is_rejected: 1,
          total_qty: 0,
          jo_numbers_list: new Set<string>(),
        };
      }

      acc[job_no].items.push(item);
      if (!item.is_approve) {
        acc[job_no].is_approve = 0;
      }
      if (!item.is_rejected) {
        acc[job_no].is_rejected = 0;
      }
      acc[job_no].total_qty += Number(item.qty) || 0;
      if (item.jo_number) {
        acc[job_no].jo_numbers_list.add(item.jo_number);
      }

      return acc;
    }, {} as Record<string, JobGroup>);

    return Object.values(groups).map((group: JobGroup) => ({
      ...group,
      jo_numbers: Array.from(group.jo_numbers_list).join(', '),
    }));
  }, [filteredData]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <div className="flex justify-end min-h-screen">
        <LeftSideBar />
        {/* Main content right section */}
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
          <div className="absolute bottom-0 right-0">
            <Image
              src="/images/sideDesign.svg"
              alt="side desgin"
              width={100}
              height={100}
              className="w-full h-full"
            />
          </div>
          {/* left section top row */}
          <DesktopHeader />

          {/* Main content middle section */}
          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              {/* Search and filter table row */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
                <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "ALL"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter("JOB_SERVICE")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "JOB_SERVICE"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Job Service
                  </button>
                  <button
                    onClick={() => setActiveFilter("TSO_SERVICE")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "TSO_SERVICE"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    TSO Service
                  </button>
                  <button
                    onClick={() => setActiveFilter("KANBAN")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "KANBAN"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Kanban
                  </button>
                </div>
              </div>

              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job No
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          J/O Number
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job Type
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job Category
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Quantity
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Status
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Actions
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    groupedData.map((group: any) => (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={group.job_no}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          <button
                            onClick={() => handleJobNoClick(group.job_no)}
                            className="text-blue-600 hover:underline text-left"
                          >
                            <p className="text-base leading-normal">{group.job_no || "N/A"}</p>
                          </button>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {group.jo_numbers || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {group.job_type}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {group.job_category || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {group.total_qty}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              group.is_approve
                                ? "bg-green-100 text-green-600"
                                : group.is_rejected
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {group.is_approve ? "Approved" : (group.is_rejected ? "Not Approved" : "Pending")}
                          </span>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => !group.is_approve && !group.is_rejected && handleApprove(group.items)}
                              disabled={!!group.is_approve || !!group.is_rejected}
                              className={`p-1.5 rounded transition-colors ${
                                group.is_approve
                                  ? "bg-green-100 text-green-600 cursor-not-allowed"
                                  : group.is_rejected
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                              }`}
                              title={group.is_approve ? "Approved" : "Approve"}
                            >
                              <HiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => !group.is_approve && !group.is_rejected && handleNotApprove(group.items)}
                              disabled={!!group.is_approve || !!group.is_rejected}
                              className={`p-1.5 rounded transition-colors ${
                                group.is_rejected
                                  ? "bg-red-100 text-red-600 cursor-not-allowed"
                                  : group.is_approve
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-100 text-red-600 hover:bg-red-200"
                              }`}
                              title={group.is_rejected ? "Not Approved" : "Not Approve"}
                            >
                              <HiX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}