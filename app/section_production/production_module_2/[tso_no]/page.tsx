"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Link from "next/link";
import Image from "next/image";
import StorageManager from "../../../../provider/StorageManager";
import { sendRoleNotificationByEvent } from "../../../services/pushNotificationApi";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

const hasAnyPermission = (permissions: any[] | null, permissionNames: string[]): boolean => {
  if (!permissions) return false;
  return permissionNames.some(name => permissions.some(p => p.name === name));
};

interface JobDetail {
  id: string;
  tso_no: number;
  jo_number: string;
  job_type: string;
  job_category: string;
  item_description: string;
  item_no: number;
  qty: number;
  moc: string;
  bin_location: string;
  urgent: boolean;
  assign_to?: string;
  assign_date?: string;
}

export default function TsoDetailsPage() {
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<{
    [key: string]: { assignTo: string; otherName: string; assignDate: string };
  }>({});
  const params = useParams();
  const router = useRouter();
  const tso_no = params.tso_no as string;
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const filterParam = searchParams.get("filter");
  const assignToParam = searchParams.get("assign_to");

  const permissions = storage.getUserPermissions();

  // Edit permission based on client (Equipment or Biosystem)
  const canEdit = clientParam === "Amar Equipment" 
    ? hasPermission(permissions, "production1.eqp.tso.edit") || hasPermission(permissions, "production2.eqp.tso.edit") || hasPermission(permissions, "production3.eqp.tso.edit")
    : hasPermission(permissions, "production1.bio.tso.edit") || hasPermission(permissions, "production2.bio.tso.edit") || hasPermission(permissions, "production3.bio.tso.edit");

  const uniqueJobDetails = useMemo(() => {
    const seen = new Set();
    return jobDetails.filter((job) => {
      if (!job.jo_number) return true;
      if (seen.has(job.jo_number)) return false;
      seen.add(job.jo_number);
      return true;
    });
  }, [jobDetails]);

  const allQtyZeroByJoNumber = useMemo(() => {
    return jobDetails.reduce<Record<string, boolean>>((acc, job) => {
      if (!job.jo_number) return acc;
      const joKey = String(job.jo_number);
      if (!(joKey in acc)) {
        acc[joKey] = true;
      }
      if (job.qty !== 0) {
        acc[joKey] = false;
      }
      return acc;
    }, {});
  }, [jobDetails]);

  useEffect(() => {
    if (tso_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          params.append('tso_no', tso_no);
          if (clientParam) params.append('client_name', clientParam);
          if (assignToParam) params.append('assign_to', assignToParam);

          const jobsResponse = await axiosProvider.get(`/fineengg_erp/system/jobs?${params.toString()}`);

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
  }, [tso_no, clientParam, assignToParam]);

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

  const handleAssign = async (id: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to assign");
      return;
    }
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
    const formattedDate = assignment.assignDate;
    const updatedBy = storage.getUserId();

    try {
      const payload: Record<string, any> = {
        id,
        assign_to: assignToName,
        assign_date: formattedDate,
      };
      if (updatedBy) payload.updated_by = updatedBy;
      const response = await axiosProvider.post(`/fineengg_erp/system/jobs/assign`, payload);
      const updatedIds: string[] = response?.data?.updated_ids || [];
      const notFoundIds: string[] = response?.data?.not_found_ids || [];
      const assignedJob = jobDetails.find((job) => job.id === id);

      await sendRoleNotificationByEvent({
        eventKey: "assignment_created",
        joNo: String(assignedJob?.jo_number || ""),
        joNumber: String(assignedJob?.jo_number || ""),
        jobNo: String(assignedJob?.tso_no || ""),
        workerName: assignToName,
        clientName: String(clientParam || ""),
        jobType: "TSO_SERVICE",
        sendAll: false,
      });

      if (updatedIds.length > 0) {
        toast.success(`Job assigned successfully (${updatedIds.length})`);
      } else {
        toast.success("Job assigned successfully");
      }
      if (notFoundIds.length > 0) {
        toast.warn(`${notFoundIds.length} selected job(s) were not found`);
      }

      setJobDetails((prev) =>
        prev.map((job) =>
          (updatedIds.length > 0 ? updatedIds.includes(job.id) : job.id === id)
            ? { ...job, assign_to: assignToName, assign_date: formattedDate }
            : job
        )
      );
    } catch (error) {
      console.error("Error assigning job:", error);
      toast.error("Failed to assign job");
    }
  };

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
        <div className="absolute bottom-0 right-0">
          <Image src="/images/sideDesign.svg" alt="side design" width={100} height={100} className="w-full h-full" />
        </div>
        <DesktopHeader />
        <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4">&larr; Back</button>

          <div className="flex flex-col gap-8">
            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Material Received From Amar</h2>
              <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">J/O No</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Job Category</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item Description</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item No</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">MOC</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Quantity</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Assign To</th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Assign Date</th>
                      {canEdit && <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-4 border border-tableBorder">Loading...</td></tr>
                    ) : uniqueJobDetails.length === 0 ? (
                      <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-4 border border-tableBorder">No items to assign for this job.</td></tr>
                    ) : (
                      uniqueJobDetails.map((item) => {
                        const isFullyAssigned =
                          !!item.jo_number && allQtyZeroByJoNumber[String(item.jo_number)];
                        return (
                        <tr
                          key={item.id}
                          className={`border border-tableBorder ${
                            isFullyAssigned ? "bg-green-100" : "bg-white"
                          } hover:bg-primary-100`}
                        >
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.jo_number ? (
                              <Link
                                href={`/section_production/machine_category(tso)/${encodeURIComponent(item.jo_number)}?filter=${encodeURIComponent(filterParam || "")}&client=${encodeURIComponent(clientParam || "")}&assign_to=${encodeURIComponent(assignToParam || "")}`}
                                className="text-blue-600 hover:underline"
                              >
                                {item.jo_number}
                              </Link>
                            ) : "N/A"}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">{item.job_category}</td>
                          <td className="px-4 py-3 border border-tableBorder">{item.item_description}</td>
                          <td className="px-4 py-3 border border-tableBorder">{item.item_no}</td>
                          <td className="px-4 py-3 border border-tableBorder">{item.moc}</td>
                          <td className="px-4 py-3 border border-tableBorder font-semibold text-yellow-600">{item.qty}</td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {!canEdit ? (
                              <p className="text-[#232323]">{item.assign_to || "Not Assigned"}</p>
                            ) : assignments[item.id]?.assignTo === "Others" ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Enter Name"
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                  value={assignments[item.id]?.otherName || ""}
                                  onChange={(e) => handleAssignmentChange(item.id, "otherName", e.target.value)}
                                  disabled={!!item.assign_to}
                                />
                              </div>
                            ) : (
                              <select
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                value={assignments[item.id]?.assignTo || ""}
                                onChange={(e) => handleAssignmentChange(item.id, "assignTo", e.target.value)}
                                disabled={!!item.assign_to}
                                title="Assign to"
                              >
                                <option value="">Select</option>
                                <option value="Usmaan">Usmaan</option>
                                <option value="Ashfaq">Ashfaq</option>
                                <option value="Ramzaan">Ramzaan</option>
                                <option value="Riyaaz">Riyaaz</option>
                                <option value="Others">Others</option>
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            {canEdit ? (
                              <input
                                type="date"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                value={assignments[item.id]?.assignDate || ""}
                                onChange={(e) => handleAssignmentChange(item.id, "assignDate", e.target.value)}
                                disabled={!!item.assign_to}
                                title="Assign date"
                              />
                            ) : (
                              <p className="text-[#232323]">{item.assign_date || "-"}</p>
                            )}
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 border border-tableBorder">
                              <button
                                onClick={() => !item.assign_to && handleAssign(item.id)}
                                disabled={!!item.assign_to}
                                className={`px-3 py-1 rounded text-sm transition-colors text-white ${
                                  item.assign_to ? "bg-green-600 cursor-default" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                {item.assign_to ? "Assigned" : "Assign"}
                              </button>
                            </td>
                          )}
                        </tr>
                        );
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