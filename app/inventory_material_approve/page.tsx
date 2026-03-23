"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { HiCheck, HiX } from "react-icons/hi";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter,useParams, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import Swal from "sweetalert2";
// import { group } from "console";

const axiosProvider = new AxiosProvider();

  interface JobGroup {
    groupId: string;
    job_type: string;
    job_category: string;
    items: any[];
    is_approve: number;
    is_rejected: number;
    total_qty: number;
    jo_numbers: string;
    jo_numbers_list?: Set<string>;
    assign_to: string;
  }

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVendorTab = !!searchParams.get("assign_to_not");
  const jobNo = params?.job_no as string;
  const clientParam = searchParams.get("client");
  const filterParam = searchParams.get("filter");

  const handleFilterChange = (newFilter: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (newFilter === "ALL") {
      currentParams.delete("filter");
    } else {
      currentParams.set("filter", newFilter);
    }
    router.push(`/inventory_material_approve?${currentParams.toString()}`);
  };

  const handleGroupClick = (group: JobGroup) => {
    if (!group || !group.groupId) return;

    const { groupId, job_type } = group;

    const params = searchParams.toString();
    const queryString = params ? `?${params}` : "";

    if (job_type === "TSO_SERVICE") {
      router.push(`/tso_approve/${encodeURIComponent(groupId)}${queryString}`);
    } else if (job_type === "KANBAN") {
      router.push(`/kanban_approve/${encodeURIComponent(groupId)}${queryString}`);
    } else {
      // Default behavior for JOB_SERVICE or other types
      router.push(
        `/inventory_material_approve/${encodeURIComponent(groupId)}${queryString}`
      );
    }
  };

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
  
        const approvalPromises = itemsToApprove.map((item) => {
          const endpoint = isVendorTab
            ? `/fineengg_erp/system/jobs/${item.id}/approve-vendors`
            : `/fineengg_erp/system/jobs/${item.id}/approve`;

          return axiosProvider.post(endpoint, { apply_to_group: true });
        });
  
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
          axiosProvider.post(`/fineengg_erp/system/jobs/${item.id}/not-approve`, { apply_to_group: true })
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

  //<p className="text-base leading-normal">{group.job_no || "N/A"}</p>

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();

      if (jobNo) {
        params.append("job_no", jobNo);
      }

      // const clientParam = searchParams.get("client");
      // const filterParam = searchParams.get("filter");

      if (clientParam) {
        params.append("client_name", clientParam);
      }

      if (filterParam) {
        params.append("job_type", filterParam);
      }

      searchParams.getAll("assign_to").forEach((val) => {
        params.append("assign_to", val);
      });

      searchParams.getAll("assign_to_not").forEach((val) => {
        params.append("assign_to_not", val);
      });

      const url = `/fineengg_erp/system/jobs?${params.toString()}`;

      const response = await axiosProvider.get(url);

      const updatedData = response.data.data
        .filter((item: any) => item.status !== "completed")
        .map((item: any) => ({
        ...item,
        is_approve: item.job_status === "approved" ? 1 : 0,
        is_rejected: item.job_status === "not-approved" ? 1 : 0,
      }));

      setData(updatedData);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load job data");
    }
  };

  useEffect(() => {
    if (filterParam) {
      setActiveFilter(filterParam);
    } else {
      setActiveFilter("ALL");
    }
  }, [filterParam]);

  const filteredData = data;

  const groupedData = useMemo<JobGroup[]>(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const groups = filteredData.reduce((acc: Record<string, any>, item: any) => {
      const { job_type, job_no, tso_no, jo_number } = item;
      let groupKey: string | null = null;

      if (job_type === "JOB_SERVICE") {
        groupKey = job_no;
      } else if (job_type === "TSO_SERVICE") {
        groupKey = tso_no;
      } else if (job_type === "KANBAN") {
        groupKey = jo_number;
      } else {
        // Fallback for items that might not have a job_type but have a job_no
        groupKey = job_no;
      }

      if (!groupKey) {
        return acc; // Skip items that cannot be grouped
      }

      if (!acc[groupKey]) {
        acc[groupKey] = {
          groupId: groupKey, // The identifier for the group
          job_type: item.job_type,
          job_category: item.job_category,
          items: [],
          is_approve: 1,
          is_rejected: 1,
          total_qty: 0,
          jo_numbers_list: new Set<string>(),
          assign_to_list: new Set<string>(),
        };
      }

      acc[groupKey].items.push(item);
      if (!item.is_approve) {
        acc[groupKey].is_approve = 0;
      }
      if (!item.is_rejected) {
        acc[groupKey].is_rejected = 0;
      }
      acc[groupKey].total_qty += Number(item.qty) || 0;
      if (item.jo_number) {
        acc[groupKey].jo_numbers_list.add(item.jo_number);
      }
      if (item.assign_to) {
        acc[groupKey].assign_to_list.add(item.assign_to);
      }

      return acc;
    }, {} as Record<string, JobGroup>);

    return Object.values(groups).map((group: any): JobGroup => ({
      ...group,
      jo_numbers: Array.from(group.jo_numbers_list).join(", "),
      assign_to: Array.from(group.assign_to_list).join(", "),
    }));
  }, [filteredData]);

  useEffect(() => {
    fetchData();
  }, [jobNo, searchParams]);

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
                    onClick={() => handleFilterChange("ALL")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "ALL"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilterChange("JOB_SERVICE")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "JOB_SERVICE"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Job Service
                  </button>
                  <button
                    onClick={() => handleFilterChange("TSO_SERVICE")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "TSO_SERVICE"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    TSO Service
                  </button>
                  <button
                    onClick={() => handleFilterChange("KANBAN")}
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
                          {activeFilter === "TSO_SERVICE"
                            ? "TSO No"
                            : activeFilter === "KANBAN"
                            ? "J/O Number"
                            : "Job No"}
                        </div>
                      </div>
                    </th>
                    {activeFilter !== "KANBAN" && (
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
                    )}
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
                          Assign To
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
                        colSpan={activeFilter === "KANBAN" ? 7 : 8}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    groupedData.map((group: JobGroup) => (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={group.groupId}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          <button
                            onClick={() => handleGroupClick(group)}
                            className="text-blue-600 hover:underline text-left"
                          >
                            <p className="text-base leading-normal">{group.groupId || "N/A"}</p>
                          </button>
                        </td>
                        {activeFilter !== "KANBAN" && (
                          <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                            <p className="text-[#232323] text-base leading-normal">
                              {group.jo_numbers || "N/A"}
                            </p>
                          </td>
                        )}
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
                            {group.assign_to || "N/A"}
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