"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Image from "next/image";
import { FaChevronDown, FaBan, FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

interface JobDetail {
  id: string;
  job_no: string;
  jo_number: string;
  job_type: string;
  job_category: string;
  item_description: string;
  item_no: number;
  serial_no: string;
  qty: number;
  moc: string;
  bin_location: string;
  urgent: boolean;
  assign_to?: string;
  assign_date?: string;
  product_desc?: string;
  product_qty?: number;
  is_rejected?: boolean | number;
  rejected?: boolean | number;
  status?: string;
}

interface CategoryDetail {
  id: string;
  job_category: string;
  job_no: string;
  description: string;
  material_type: string;
  bar: string;
  tempp: string;
  qty: string;
  remark: string;
  client_name: string;
  drawing_recieved_date: string;
  urgent_due_date: string | null;
  is_urgent: boolean;
}

interface PendingMaterial {
  id: string;
  job_no: string;
  item_no: number;
  size: string;
  moc: string;
  qty: number;
  description: string;
  is_completed: boolean;
}

export default function JobDetailsPage() {
  const [pendingData, setPendingData] = useState<PendingMaterial[]>([]);
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<{
    [key: string]: { assignTo: string; otherName: string; assignDate: string };
  }>({});
  const [expandedJoNumbers, setExpandedJoNumbers] = useState<string[]>([]);
  const params = useParams();
  const router = useRouter();
  const job_no = params.job_no ? decodeURIComponent(params.job_no as string) : "";

  const groupedJobDetails = useMemo(() => {
    return jobDetails.reduce((acc, job) => {
      const key = job.jo_number || 'N/A';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(job);
      return acc;
    }, {} as Record<string, JobDetail[]>);
  }, [jobDetails]);

  const toggleJoNumberExpansion = (joNumber: string) => {
    setExpandedJoNumbers((prev) =>
      prev.includes(joNumber)
        ? prev.filter((n) => n !== joNumber)
        : [...prev, joNumber]
    );
  };

  useEffect(() => {
    if (job_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [jobsResponse, pendingResponse, categoriesResponse] = await Promise.all([
            axiosProvider.get(`/fineengg_erp/system/jobs?job_no=${encodeURIComponent(job_no)}`),
            axiosProvider.get(`/fineengg_erp/system/pending-materials?job_no=${encodeURIComponent(job_no)}`),
            axiosProvider.get(`/fineengg_erp/system/categories`),
          ]);

          if (jobsResponse.data && Array.isArray(jobsResponse.data.data)) {
            const fetchedJobs = jobsResponse.data.data;
            setJobDetails(fetchedJobs);

            const initialAssignments: { [key: string]: { assignTo: string; otherName: string; assignDate: string } } = {};
            fetchedJobs.forEach((job: JobDetail) => {
              if (job.assign_to) {
                const isStandard = ["Usmaan", "Ashfaq", "Ramzaan", "Riyaaz"].includes(job.assign_to);
                initialAssignments[job.id] = {
                  assignTo: isStandard ? job.assign_to : "Others",
                  otherName: isStandard ? "" : job.assign_to,
                  assignDate: job.assign_date ? job.assign_date.replace(/\//g, "-") : "",
                };
              }
            });
            setAssignments(initialAssignments);
          } else {
            setJobDetails([]);
          }

          if (pendingResponse.data && Array.isArray(pendingResponse.data.data)) {
            setPendingData(pendingResponse.data.data);
          } else {
            setPendingData([]);
          }

          if (categoriesResponse.data && Array.isArray(categoriesResponse.data.data)) {
            const allCategories = categoriesResponse.data.data;
            const filteredCategories = allCategories.filter((cat: CategoryDetail) => String(cat.job_no) === String(job_no));
            setCategoryDetails(filteredCategories);
          } else {
            setCategoryDetails([]);
          }
        } catch (error) {
          console.error("Error fetching data for job:", error);
          toast.error("Failed to load data for this job.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [job_no]);

  const handleAssignmentChange = (id: string, field: string, value: string) => {
    setAssignments((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { assignTo: "", otherName: "", assignDate: "" }),
        [field]: value,
      },
    }));
  };

  const handleAssign = async (id: string) => {
    const assignment = assignments[id];

    if (!assignment?.assignTo) {
      toast.error("Please select who to assign to");
      return;
    }

    if (assignment.assignTo === "Others" && !assignment.otherName) {
      toast.error("Please enter the name");
      return;
    }

    if (!assignment.assignDate) {
      toast.error("Please select a date");
      return;
    }

    const assignToName = assignment.assignTo === "Others" ? assignment.otherName : assignment.assignTo;
    const formattedDate = assignment.assignDate.replace(/-/g, '/');

    try {
      const params = new URLSearchParams();
      params.append('assign_to', assignToName);
      params.append('assign_date', formattedDate);

      await axiosProvider.post(`/fineengg_erp/system/jobs/${id}/assign`, params);
      toast.success("Job assigned successfully");

      setJobDetails((prev) =>
        prev.map((job) =>
          job.id === id
            ? { ...job, assign_to: assignToName, assign_date: formattedDate }
            : job
        )
      );
    } catch (error) {
      console.error("Error assigning job:", error);
      toast.error("Failed to assign job");
    }
  };

  const handleReject = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to reject this job?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${id}/reject`, {});
        toast.success("Job rejected successfully");

        setJobDetails((prev) =>
          prev.map((job) => (job.id === id ? { ...job, is_rejected: true } : job))
        );
      } catch (error) {
        console.error("Error rejecting job:", error);
        toast.error("Failed to reject job");
      }
    }
  };

  const handleMarkCompleted = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this job as completed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, complete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${id}/direct_complete`, {});
        toast.success("Job marked as completed successfully");
        setJobDetails((prev) =>
          prev.map((job) => (job.id === id ? { ...job, status: "completed" } : job))
        );
      } catch (error) {
        console.error("Error completing job:", error);
        toast.error("Failed to complete job");
      }
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
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline mb-4"
          >
            &larr; Back
          </button>

          {/* Job Details Section */}
          {/* <div className="mb-12">
            <h1 className="text-2xl font-bold mb-6">
              Job Details for Job No: {job_no}
            </h1>
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    
                    <th scope="col" className="p-3 border border-tableBorder">
                      Client Name
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Job Category
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Drawing Rec. Date
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Description
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Material Type
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Quantity
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Pressure[Bar]
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Temperature
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Due Date
                    </th>
                    <th scope="col" className="p-3 border border-tableBorder">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : categoryDetails.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        No job details found for this job number.
                      </td>
                    </tr>
                  ) : (
                    categoryDetails.map((item) => (
                      <tr
                        key={item.id}
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                      >
                        
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.client_name}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.job_category || "N/A"}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.drawing_recieved_date}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.description}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.material_type}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.qty}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.bar}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.tempp}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          {item.urgent_due_date || "-"}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              item.is_urgent
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {item.is_urgent ? "Urgent" : "Normal"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div> */}

          {/* Job Details Section */}
          <div className="mb-12">
            <h1 className="text-2xl font-bold mb-6">
              Job Details for Job No: {job_no}
            </h1>

            {loading ? (
              <p className="text-center py-4 text-gray-500">Loading...</p>
            ) : categoryDetails.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                No job details found for this job number.
              </p>
            ) : (
              <div className="space-y-8">
                {categoryDetails.map((item) => (
                  <div key={item.id} className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Job Info
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.is_urgent
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {item.is_urgent ? "Urgent" : "Normal"}
                      </span>
                    </div>

                    {/* First Row - 4 Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Client Name
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.client_name || "-"}
                        </span>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Job Category
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.job_category || "N/A"}
                        </span>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Drawing Rec. Date
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.drawing_recieved_date || "-"}
                        </span>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Material Type
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.material_type || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Second Row - 4 Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Quantity
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.qty || "-"}
                        </span>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Pressure [Bar]
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.bar || "-"}
                        </span>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Temperature
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.tempp || "-"}
                        </span>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          Due Date
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.urgent_due_date || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Third Row - Description */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                        Description
                      </span>
                      <p className="text-base text-gray-900 font-medium leading-relaxed">
                        {item.description || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-8">
            {/* Left Side: Assignment Form */}
            <div className="w-full">
              <h2 className="text-xl font-bold mb-4">Material Recieved From Amar</h2>
              <div className="relative overflow-x-auto sm:rounded-lg border border-tableBorder shadow-sm">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 min-w-[1600px]">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">J/O No</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Job Type</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Job Category</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Product Desc</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Product Qty</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Serial No</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item Desc</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item No</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">MOC</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Quantity</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Bin Location</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Assign To</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Assign Date</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={14} className="text-center py-4 border border-tableBorder">Loading...</td>
                      </tr>
                    ) : jobDetails.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="text-center py-4 border border-tableBorder">No items to assign for this job.</td>
                      </tr>
                    ) : (
                      Object.entries(groupedJobDetails).flatMap(([joNumber, jobs]) => {
                        const isExpanded = expandedJoNumbers.includes(joNumber);
                        const hasMultiple = jobs.length > 1;

                        const renderJobRow = (item: JobDetail, isFirst: boolean, isChild: boolean) => {
                          const isRejected = item.is_rejected || item.rejected;
                          return (
                          <tr key={item.id + (isChild ? '-child' : '-header')} className={`border border-tableBorder bg-white hover:bg-primary-100 transition-colors ${isChild ? "bg-gray-50" : ""}`}>
                            <td className="px-4 py-3 border border-tableBorder">
                              {isFirst && (
                                <div className="flex items-center gap-2">
                                  {joNumber}
                                  {hasMultiple && (
                                    <button onClick={() => toggleJoNumberExpansion(joNumber)}>
                                      <FaChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? item.job_type : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? item.job_category : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_desc || "-") : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_qty || "-") : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.serial_no || 'N/A') : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.item_description || "-") : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.item_no : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.moc : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.qty : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.bin_location : ""}</td>
                                <td className="px-4 py-3 border border-tableBorder">
                                  {isFirst && (assignments[item.id]?.assignTo === "Others" ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        placeholder="Enter Name"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        value={assignments[item.id]?.otherName || ""}
                                        onChange={(e) =>
                                          handleAssignmentChange(item.id, "otherName", e.target.value)
                                        }
                                        autoFocus={!item.assign_to}
                                        disabled={!!item.assign_to || !item.urgent || item.status === 'completed'}
                                      />
                                      {!item.assign_to && (
                                        <button
                                          onClick={() => {
                                            handleAssignmentChange(item.id, "assignTo", "");
                                            handleAssignmentChange(item.id, "otherName", "");
                                          }}
                                          className="text-gray-500 hover:text-red-500 px-1"
                                          title="Clear"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                      value={assignments[item.id]?.assignTo || ""}
                                      onChange={(e) =>
                                        handleAssignmentChange(
                                          item.id,
                                          "assignTo",
                                          e.target.value
                                        )
                                      }
                                      disabled={!!item.assign_to || !item.urgent || item.status === 'completed'}
                                    >
                                      <option value="">Select</option>
                                      <option value="Usmaan">Usmaan</option>
                                      <option value="Ashfaq">Ashfaq</option>
                                      <option value="Ramzaan">Ramzaan</option>
                                      <option value="Riyaaz">Riyaaz</option>
                                      <option value="Others">Others</option>
                                    </select>
                                  ))}
                                </td>
                                <td className="px-4 py-3 border border-tableBorder">
                                  {isFirst && (
                                  <input
                                    type="date"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                    value={assignments[item.id]?.assignDate || ""}
                                    onChange={(e) => handleAssignmentChange(item.id, "assignDate", e.target.value)}
                                    disabled={!!item.assign_to || !item.urgent || item.status === 'completed'}
                                  />
                                  )}
                                </td>
                                <td className="px-4 py-3 border border-tableBorder">
                                  <div className="flex items-center gap-2">
                                    {isFirst && !isChild && (
                                      <button
                                        onClick={() => !item.assign_to && item.urgent && !isRejected && item.status !== 'completed' && handleAssign(item.id)}
                                        disabled={!!item.assign_to || !item.urgent || !!isRejected || item.status === 'completed'}
                                        className={`px-3 py-1 rounded text-sm transition-colors text-white ${
                                          item.status === 'completed' ? 'bg-indigo-500 cursor-default' :
                                          item.assign_to ? "bg-green-600 cursor-default" :
                                          !item.urgent || isRejected ? "bg-gray-400 cursor-not-allowed" :
                                          "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                      >
                                        {item.status === 'completed' ? 'Completed' : item.assign_to ? "Assigned" : "Assign"}
                                      </button>
                                    )}
                                    {!isChild && ( <>
                                    <button
                                      onClick={() => !item.assign_to && !isRejected && item.status !== 'completed' && handleReject(item.id)}
                                      disabled={!!item.assign_to || !!isRejected || item.status === 'completed'}
                                      className={`p-2 rounded-md transition-colors ${
                                        isRejected
                                          ? "bg-red-200 text-red-800 cursor-not-allowed"
                                          : !!item.assign_to || item.status === 'completed'
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                          : "bg-red-100 text-red-600 hover:bg-red-200"
                                      }`}
                                      title={isRejected ? "Rejected" : "Reject"}
                                    >
                                      <FaBan className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => !item.assign_to && item.status !== 'completed' && handleMarkCompleted(item.id)}
                                      disabled={!!item.assign_to || item.status === 'completed'}
                                      className={`p-2 rounded-md transition-colors ${
                                        !!item.assign_to || item.status === 'completed'
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                          : "bg-green-100 text-green-600 hover:bg-green-200"
                                      }`}
                                      title={item.status === 'completed' ? 'Completed' : 'Mark as Completed'}
                                    >
                                      <FaCheckCircle className="w-4 h-4" />
                                    </button>
                                    </> )}
                                  </div>
                                </td>
                          </tr>
                        );
                        };

                        if (!hasMultiple) {
                          return [renderJobRow(jobs[0], true, false)];
                        }

                        const rows = [renderJobRow(jobs[0], true, false)];
                        if (isExpanded) {
                          jobs.forEach(job => rows.push(renderJobRow(job, false, true)));
                        }
                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: Pending Materials */}
            <div className="w-full">
              <h1 className="text-2xl font-bold mb-6">
                Pending Materials for Job No: {job_no}
              </h1>
              <div className="relative overflow-x-auto sm:rounded-lg border border-tableBorder shadow-sm">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 min-w-[1000px]">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        Job No
                      </th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        Description
                      </th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        Item No
                      </th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        Size
                      </th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        MOC
                      </th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        Quantity
                      </th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : pendingData.filter((item) => !item.is_completed).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          No pending materials found for this job number.
                        </td>
                      </tr>
                    ) : (
                      pendingData.filter((item) => !item.is_completed).map((item) => (
                        <tr
                          key={item.id}
                          className="border border-tableBorder bg-white hover:bg-primary-100"
                        >
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.job_no}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.item_no}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.size}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.moc}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                item.is_completed
                                  ? "bg-green-100 text-green-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {item.is_completed ? "Completed" : "Pending"}
                            </span>
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
      </div>
    </div>
  );
}
