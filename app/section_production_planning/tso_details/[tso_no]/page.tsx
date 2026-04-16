"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Image from "next/image";
import { FaChevronDown, FaBan } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md"; // Import MdOutlineVerified for QC icon
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

interface JobDetail {
  id: string;
  tso_no: string;
  jo_number: string;
  job_type: string;
  job_category: string;
  item_description: string;
  item_no: string;
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

export default function JobDetailsPage() {
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<{
    [key: string]: { assignTo: string; otherName: string; assignDate: string };
  }>({});
  const [expandedJoNumbers, setExpandedJoNumbers] = useState<string[]>([]);
  const params = useParams();
  const router = useRouter();
  const tso_no = params.tso_no as string;

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
    if (tso_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const jobsResponse = await axiosProvider.get(`/fineengg_erp/system/jobs?tso_no=${tso_no}`);

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
        } catch (error) {
          console.error("Error fetching data for job:", error);
          toast.error("Failed to load data for this job.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [tso_no]);

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

  const handleReject = async (item: JobDetail) => {
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
        await axiosProvider.post(`/fineengg_erp/system/jobs/${item.id}/reject`, {});
        toast.success("Job rejected successfully");

        setJobDetails((prev) =>
          prev.map((job) => (job.id === item.id ? { ...job, is_rejected: true } : job))
        );
      } catch (error) {
        console.error("Error rejecting job:", error);
        toast.error("Failed to reject job");
      }
    }
  };

  const handleMarkQc = async (item: JobDetail) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this job for QC?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, send to QC!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${item.id}/direct_qc`, {});
        toast.success("Job marked Ready-For-QC successfully");
        setJobDetails((prev) =>
          prev.map((job) => (job.id === item.id ? { ...job, status: "QC", qty: 0 } : job))
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

          {/* Bottom Section */}
          <div className="flex flex-col gap-6">
            {/* Left Side: Assignment Form */}
            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Material Recieved From Amar</h2>
              <div className="relative overflow-x-auto sm:rounded-lg border border-tableBorder shadow-sm">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 min-w-[1100px]">
                  <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">J/O No</th>
                      {/* <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Job Type</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Job Category</th> */}
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Product Desc</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Product Qty</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Serial No</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item Desc</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item No</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">MOC</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Qty</th>
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Bin Location</th>
                      <th scope="col" className="px-6 py-4 border border-tableBorder whitespace-nowrap">Assign To</th>
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
                          const isProcessed = item.status === 'completed' || item.status === 'QC' || (item.status !== 'completed' && item.qty === 0 && !isRejected);
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
                            {/* <td className="px-4 py-3 border border-tableBorder">{!isChild ? item.job_type : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? item.job_category : ""}</td> */}
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_desc || "-") : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_qty || "-") : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.serial_no || 'N/A') : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.item_description || "-") : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.item_no : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.moc : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (isRejected ? "true" : item.qty) : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? item.bin_location : ""}</td>
                            <td className="px-4 py-3 border border-tableBorder">
                              {isRejected ? (
                                  <div className="flex items-center gap-2 text-red-600 font-medium">
                                    <FaBan className="w-4 h-4" />
                                    <span>Rejected</span>
                                  </div>
                                ) : isFirst && (assignments[item.id]?.assignTo === "Others" ? (
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
                                    disabled={!!item.assign_to || isProcessed || !!isRejected}
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
                                  disabled={!!item.assign_to || isProcessed || !!isRejected}
                                >
                                  <option value="">Select</option>
                                  <option value="Usmaan">Usmaan</option>
                                  <option value="Ramzaan">Ramzaan</option>
                                  <option value="Riyaaz">Riyaaz</option>
                                  <option value="Ashfaq">Ashfaq</option>
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
                                disabled={!!item.assign_to || isProcessed || !!isRejected}
                              />
                              )}
                            </td>
                            <td className="px-4 py-3 border border-tableBorder">
                              <div className="flex items-center gap-2">
                                {isFirst && !isRejected && !isProcessed && (
                                  <button
                                    onClick={() => !item.assign_to && !isRejected && item.status !== 'completed' && handleAssign(item.id)}
                                    disabled={!!item.assign_to || !!isRejected || isProcessed}
                                    className={`px-3 py-1 rounded text-sm transition-colors text-white ${
                                      item.status === 'completed' ? 'bg-indigo-500 cursor-default' :
                                      item.status === 'QC' ? 'bg-orange-500 cursor-default' :
                                      item.assign_to
                                        ? "bg-green-600 cursor-default"
                                        : isRejected
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                  >
                                    {item.status === 'completed' ? 'Completed' : item.status === 'QC' ? 'In QC' : item.assign_to ? "Assigned" : "Assign"}
                                  </button>
                                )}
                                {(isChild || !hasMultiple) && ( <>
                                <button
                                  onClick={() => !item.assign_to && !isRejected && !isProcessed && handleReject(item)}
                                  disabled={!!item.assign_to || !!isRejected || isProcessed}
                                  className={`p-2 rounded-md transition-colors ${
                                    isRejected
                                      ? "bg-red-200 text-red-800 cursor-not-allowed"
                                      : !!item.assign_to || isProcessed
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                      : "bg-red-100 text-red-600 hover:bg-red-200"
                                  }`}
                                  title={isRejected ? "Rejected" : "Reject Item"}
                                >
                                  <FaBan className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => !item.assign_to && !isProcessed && !isRejected && handleMarkQc(item)}
                                  disabled={!!item.assign_to || isProcessed || !!isRejected}
                                  className={`p-2 rounded-md transition-colors ${
                                    !!item.assign_to || isProcessed || !!isRejected
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                      : "bg-green-100 text-green-600 hover:bg-green-200"
                                  }`}
                                  title={item.status === 'completed' ? 'Completed' : item.status === 'QC' ? 'Sent to QC' : 'Mark for QC'}
                                >
                                  <MdOutlineVerified className="w-4 h-4" /> {/* Use MdOutlineVerified icon */}
                                </button>
                                </> )}
                              </div>
                            </td>
                          </tr>
                        );
                        }

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
          </div>
        </div>
      </div>
    </div>
  );
}
