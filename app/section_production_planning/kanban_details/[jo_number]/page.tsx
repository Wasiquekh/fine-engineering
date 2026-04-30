"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Image from "next/image";
import { FaChevronDown, FaBan } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";
import Swal from "sweetalert2";
import StorageManager from "../../../../provider/StorageManager";
import { sendRoleNotificationByEvent } from "../../../services/pushNotificationApi";
import type { UrgentStatus } from "../../../component/utils/permissionUtils";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const hasAnyPermission = (permissions: any[] | null, permissionNames: string[]): boolean => {
  if (!permissions) return false;
  return permissionNames.some((name) => permissions.some((p) => p.name === name));
};

interface JobDetail {
  id: string;
  tso_no: string;
  jo_number: string;
  job_no?: string;
  client_name?: string;
  job_type: string;
  job_category: string;
  item_description: string;
  item_no: string;
  serial_no: string;
  qty: number;
  moc: string;
  bin_location: string;
  urgent: UrgentStatus;
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
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const params = useParams();
  const router = useRouter();
  const jo_number = params.jo_number as string;

  const permissions = storage.getUserPermissions();
  const canEdit = hasAnyPermission(permissions, [
    "pp.eqp.job.edit", "pp.eqp.tso.edit", "pp.eqp.kanban.edit",
    "pp.bio.job.edit", "pp.bio.tso.edit", "pp.bio.kanban.edit",
  ]);

  const groupedJobDetails = useMemo(() => {
    return jobDetails.reduce((acc, job) => {
      const key = job.jo_number || "N/A";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(job);
      return acc;
    }, {} as Record<string, JobDetail[]>);
  }, [jobDetails]);

  const toggleJoNumberExpansion = (joNumber: string) => {
    setExpandedJoNumbers((prev) =>
      prev.includes(joNumber) ? prev.filter((n) => n !== joNumber) : [...prev, joNumber]
    );
  };

  const isJobSelectable = (job: JobDetail) => {
    const isRejected = job.is_rejected || job.rejected;
    const isProcessed = job.status === "completed" || job.status === "QC" || job.qty === 0;
    return !job.assign_to && !isRejected && !isProcessed;
  };

  const toggleSingleJobSelection = (job: JobDetail) => {
    if (!isJobSelectable(job)) return;
    setSelectedJobIds((prev) =>
      prev.includes(job.id) ? prev.filter((id) => id !== job.id) : [...prev, job.id]
    );
  };

  const toggleJoGroupSelection = (joNumber: string, jobs: JobDetail[]) => {
    const groupIds = jobs.filter(isJobSelectable).map((job) => job.id);
    const uniqueGroupIds = Array.from(new Set(groupIds));
    if (uniqueGroupIds.length === 0) return;
    const allSelected = uniqueGroupIds.every((id) => selectedJobIds.includes(id));

    setSelectedJobIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !uniqueGroupIds.includes(id));
      }
      return Array.from(new Set([...prev, ...uniqueGroupIds]));
    });

    if (!allSelected) {
      setExpandedJoNumbers((prev) => (prev.includes(joNumber) ? prev : [...prev, joNumber]));
    }
  };

  useEffect(() => {
    if (jo_number) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const jobsResponse = await axiosProvider.get(
            `/fineengg_erp/system/jobs?job_type=KANBAN&jo_number=${encodeURIComponent(jo_number)}`
          );

          if (jobsResponse.data && Array.isArray(jobsResponse.data.data)) {
            const fetchedJobs = jobsResponse.data.data;
            setJobDetails(fetchedJobs);

            const joCounts = fetchedJobs.reduce((acc: Record<string, number>, job: JobDetail) => {
              const key = job.jo_number || "N/A";
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});

            const initialAssignments: {
              [key: string]: { assignTo: string; otherName: string; assignDate: string };
            } = {};
            fetchedJobs.forEach((job: JobDetail) => {
              const joKey = job.jo_number || "N/A";
              const isSingleRowJo = (joCounts[joKey] || 0) === 1;
              if (job.assign_to && isSingleRowJo) {
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
  }, [jo_number]);

  const handleAssignmentChange = (id: string, field: string, value: string) => {
    if (!canEdit) return;
    setAssignments((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { assignTo: "", otherName: "", assignDate: "" }),
        [field]: value,
      },
    }));
  };

  const handleAssign = async (sourceId: string) => {
    if (!canEdit) return;
    const assignment = assignments[sourceId];
    const uniqueSelectedIds = Array.from(new Set(selectedJobIds));

    if (uniqueSelectedIds.length === 0) {
      toast.error("Please select at least one checkbox");
      return;
    }

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
    const formattedDate = assignment.assignDate;
    const updatedBy = storage.getUserId();

    try {
      const payload: Record<string, any> = {
        assign_to: assignToName,
        assign_date: formattedDate,
      };
      if (uniqueSelectedIds.length === 1) {
        payload.id = uniqueSelectedIds[0];
      } else {
        payload.ids = uniqueSelectedIds;
      }
      if (updatedBy) payload.updated_by = updatedBy;

      const response = await axiosProvider.post(`/fineengg_erp/system/jobs/assign`, payload);
      const updatedIds: string[] = response?.data?.updated_ids || [];
      const notFoundIds: string[] = response?.data?.not_found_ids || [];

      if (updatedIds.length > 0) {
        toast.success(`Job assigned successfully (${updatedIds.length})`);
      } else {
        toast.success("Job assigned successfully");
      }
      if (notFoundIds.length > 0) {
        toast.warn(`${notFoundIds.length} selected job(s) were not found`);
      }

      const notifiedIds = updatedIds.length > 0 ? updatedIds : uniqueSelectedIds;
      notifiedIds.forEach((jobId) => {
        const assignedJob = jobDetails.find((job) => job.id === jobId);
        if (!assignedJob) return;
        sendRoleNotificationByEvent({
          eventKey: "assignment_created",
          joNo: String(assignedJob.jo_number || ""),
          joNumber: String(assignedJob.jo_number || ""),
          jobNo: String(assignedJob.job_no || ""),
          workerName: assignToName,
          clientName: String(assignedJob.client_name || ""),
          jobType: "KANBAN",
          sendAll: false,
        });
      });

      setJobDetails((prev) =>
        prev.map((job) =>
          (updatedIds.length > 0 ? updatedIds.includes(job.id) : uniqueSelectedIds.includes(job.id))
            ? { ...job, assign_to: assignToName, assign_date: formattedDate }
            : job
        )
      );
      if (updatedIds.length > 0) {
        setSelectedJobIds((prev) => prev.filter((jobId) => !updatedIds.includes(jobId)));
      } else {
        setSelectedJobIds([]);
      }
      setAssignments((prev) => ({
        ...prev,
        [sourceId]: { assignTo: "", otherName: "", assignDate: "" },
      }));
    } catch (error) {
      console.error("Error assigning job:", error);
      toast.error("Failed to assign job");
    }
  };

  const handleReject = async (item: JobDetail) => {
    if (!canEdit) return;
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
        await sendRoleNotificationByEvent({
          eventKey: "job_rejected",
          joNo: String(item.jo_number || ""),
          joNumber: String(item.jo_number || ""),
          jobNo: String(item.job_no || ""),
          clientName: String(item.client_name || ""),
          jobType: "KANBAN",
          sendAll: false,
        });
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
    if (!canEdit) return;
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
        await sendRoleNotificationByEvent({
          eventKey: "moved_to_qc",
          joNo: String(item.jo_number || ""),
          joNumber: String(item.jo_number || ""),
          jobNo: String(item.job_no || ""),
          clientName: String(item.client_name || ""),
          jobType: "KANBAN",
          sendAll: false,
        });
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

  const colSpan = canEdit ? 15 : 14;

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

          <div className="flex flex-col gap-8">
            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Material Recieved From Amar</h2>
              <div className="relative overflow-x-auto overflow-y-auto max-h-[min(70vh,720px)] sm:rounded-lg border border-tableBorder shadow-sm">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 min-w-[1600px] border-separate border-spacing-0">
                  <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50 sticky top-0 z-40">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap sticky left-0 top-0 z-50 bg-gray-50 shadow-[2px_0_6px_rgba(0,0,0,0.06)]">Select</th>
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
                      {canEdit && (
                        <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={colSpan} className="text-center py-4 border border-tableBorder">Loading...</td>
                      </tr>
                    ) : jobDetails.length === 0 ? (
                      <tr>
                        <td colSpan={colSpan} className="text-center py-4 border border-tableBorder">No items to assign for this job.</td>
                      </tr>
                    ) : (
                      Object.entries(groupedJobDetails).flatMap(([joKey, jobs]) => {
                        const isExpanded = expandedJoNumbers.includes(joKey);
                        const hasMultiple = jobs.length > 1;
                        const groupSelectableIds = jobs.filter(isJobSelectable).map((job) => job.id);
                        const allGroupSelected =
                          groupSelectableIds.length > 0 && groupSelectableIds.every((id) => selectedJobIds.includes(id));
                        const isGroupSelectionDisabled = groupSelectableIds.length === 0;

                        const renderJobRow = (item: JobDetail, isFirst: boolean, isChild: boolean) => {
                          const isRejected = item.is_rejected || item.rejected;
                          const isProcessed = item.status === "completed" || item.status === "QC" || item.qty === 0;
                          const showParentAssignControls = !hasMultiple || isFirst;
                          const showAssignedTextOnly = !hasMultiple && !!item.assign_to;
                          const isParentSelectionLocked = (hasMultiple ? jobs : [item]).every((job) => {
                            const jr = job.is_rejected || job.rejected;
                            const jp = job.status === "completed" || job.status === "QC" || job.qty === 0;
                            return !!job.assign_to || !!jr || jp;
                          });
                          return (
                            <tr
                              key={item.id + (isChild ? "-child" : "-header")}
                              className={`border border-tableBorder bg-white hover:bg-primary-100 transition-colors ${
                                isChild ? "bg-gray-50" : ""
                              }`}
                            >
                              <td
                                className={`px-4 py-3 border border-tableBorder sticky left-0 z-30 shadow-[2px_0_6px_rgba(0,0,0,0.06)] ${
                                  isChild ? "bg-gray-50" : "bg-white"
                                }`}
                              >
                                {isFirst && hasMultiple ? (
                                  <input
                                    type="checkbox"
                                    title={`Select JO group ${joKey}`}
                                    aria-label={`Select JO group ${joKey}`}
                                    checked={allGroupSelected}
                                    disabled={isGroupSelectionDisabled}
                                    onChange={() => toggleJoGroupSelection(joKey, jobs)}
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    title={`Select job ${item.id}`}
                                    aria-label={`Select job ${item.id}`}
                                    checked={item.assign_to ? true : selectedJobIds.includes(item.id)}
                                    disabled={!isJobSelectable(item)}
                                    onChange={() => toggleSingleJobSelection(item)}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                {isFirst && (
                                  <div className="flex items-center gap-2">
                                    {joKey}
                                    {hasMultiple && (
                                      <button
                                        type="button"
                                        title={`Toggle rows for ${joKey}`}
                                        aria-label={`Toggle rows for ${joKey}`}
                                        onClick={() => toggleJoNumberExpansion(joKey)}
                                      >
                                        <FaChevronDown
                                          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">{!isChild ? item.job_type : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{!isChild ? item.job_category : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">
                                {!isChild ? <span className="inline-block max-w-[260px] whitespace-normal break-words">{item.product_desc || "-"}</span> : ""}
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">{!isChild ? (item.product_qty || "-") : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">{(isChild || !hasMultiple) ? (item.serial_no || "N/A") : ""}</td>
                              <td className="px-4 py-3 border border-tableBorder">
                                {(isChild || !hasMultiple) ? <span className="inline-block max-w-[260px] whitespace-normal break-words">{item.item_description || "-"}</span> : ""}
                              </td>
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
                                ) : showAssignedTextOnly ? (
                                  item.assign_to || "-"
                                ) : showParentAssignControls ? (
                                  assignments[item.id]?.assignTo === "Others" ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        placeholder="Enter Name"
                                        title="Other assignee"
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                        value={assignments[item.id]?.otherName || ""}
                                        onChange={(e) => handleAssignmentChange(item.id, "otherName", e.target.value)}
                                        disabled={isParentSelectionLocked || !canEdit}
                                      />
                                    </div>
                                  ) : (
                                    <select
                                      title="Assign to"
                                      aria-label="Assign to"
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                      value={assignments[item.id]?.assignTo || ""}
                                      onChange={(e) => handleAssignmentChange(item.id, "assignTo", e.target.value)}
                                      disabled={isParentSelectionLocked || !canEdit}
                                    >
                                      <option value="">Select</option>
                                      <option value="Usmaan">Usmaan</option>
                                      <option value="Ramzaan">Ramzaan</option>
                                      <option value="Riyaaz">Riyaaz</option>
                                      <option value="Ashfaq">Ashfaq</option>
                                      <option value="Others">Others</option>
                                    </select>
                                  )
                                ) : (
                                  item.assign_to || "-"
                                )}
                              </td>
                              <td className="px-4 py-3 border border-tableBorder">
                                {showAssignedTextOnly ? (
                                  item.assign_date || "-"
                                ) : showParentAssignControls ? (
                                  <input
                                    type="date"
                                    title="Assign date"
                                    aria-label="Assign date"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                    value={assignments[item.id]?.assignDate || ""}
                                    onChange={(e) => handleAssignmentChange(item.id, "assignDate", e.target.value)}
                                    disabled={isParentSelectionLocked || !canEdit}
                                  />
                                ) : (
                                  item.assign_date || "-"
                                )}
                              </td>
                              {canEdit && (
                                <td className="px-4 py-3 border border-tableBorder">
                                  <div className="flex items-center gap-2">
                                    {showParentAssignControls && !isRejected && !isProcessed && (
                                      <button
                                        type="button"
                                        onClick={() => handleAssign(item.id)}
                                        disabled={isParentSelectionLocked}
                                        className={`px-3 py-1 rounded text-sm text-white ${
                                          isParentSelectionLocked ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                      >
                                        {item.status === "completed"
                                          ? "Completed"
                                          : item.status === "QC"
                                            ? "In QC"
                                            : item.assign_to
                                              ? "Assigned"
                                              : "Assign"}
                                      </button>
                                    )}
                                    {(isChild || !hasMultiple) && (
                                      <>
                                        <button
                                          type="button"
                                          title="Reject item"
                                          aria-label="Reject item"
                                          onClick={() => !item.assign_to && !isRejected && !isProcessed && handleReject(item)}
                                          disabled={!!item.assign_to || !!isRejected || isProcessed}
                                          className={`p-2 rounded-md transition-colors ${
                                            isRejected
                                              ? "bg-red-200 text-red-800 cursor-not-allowed"
                                              : !!item.assign_to || isProcessed
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                                : "bg-red-100 text-red-600 hover:bg-red-200"
                                          }`}
                                        >
                                          <FaBan className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          title="Mark for QC"
                                          aria-label="Mark for QC"
                                          onClick={() => !item.assign_to && !isProcessed && !isRejected && handleMarkQc(item)}
                                          disabled={!!item.assign_to || isProcessed || !!isRejected}
                                          className={`p-2 rounded-md transition-colors ${
                                            !!item.assign_to || isProcessed || !!isRejected
                                              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                              : "bg-green-100 text-green-600 hover:bg-green-200"
                                          }`}
                                        >
                                          <MdOutlineVerified className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        };

                        if (!hasMultiple) {
                          return [renderJobRow(jobs[0], true, false)];
                        }

                        const rows = [renderJobRow(jobs[0], true, false)];
                        if (isExpanded) {
                          jobs.forEach((job) => rows.push(renderJobRow(job, false, true)));
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
