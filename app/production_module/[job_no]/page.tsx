"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosProvider from "../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import Link from "next/link";
import Image from "next/image";

const axiosProvider = new AxiosProvider();

interface JobDetail {
  id: string;
  job_no: number;
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

export default function JobDetailsPage() {
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<{
    [key: string]: { assignTo: string; otherName: string; assignDate: string };
  }>({});
  const params = useParams();
  const router = useRouter();
  const job_no = params.job_no as string;

  useEffect(() => {
    if (job_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const jobsResponse = await axiosProvider.get(`/fineengg_erp/jobs?job_no=${job_no}`);

          if (jobsResponse.data && Array.isArray(jobsResponse.data.data)) {
            const fetchedJobs = jobsResponse.data.data;
            setJobDetails(fetchedJobs);

            const initialAssignments: { [key: string]: { assignTo: string; otherName: string; assignDate: string } } = {};
            fetchedJobs.forEach((job: JobDetail) => {
              if (job.assign_to) {
                const isStandard = ["Usmaan", "Ashfaq", "Ramzaan"].includes(job.assign_to);
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

      await axiosProvider.post(`/fineengg_erp/jobs/${id}/assign`, params);
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
          <div className="flex flex-col gap-8">
            {/* Left Side: Assignment Form */}
            <div className="w-full">
              <h2 className="text-xl font-bold mb-4">Material Recieved From Amar</h2>
              <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="p-3 border border-tableBorder">J/O No</th>
                      <th scope="col" className="p-3 border border-tableBorder">Job Type</th>
                      <th scope="col" className="p-3 border border-tableBorder">Job Category</th>
                      <th scope="col" className="p-3 border border-tableBorder">Item No</th>
                      <th scope="col" className="p-3 border border-tableBorder">Quantity</th>
                      <th scope="col" className="p-3 border border-tableBorder">MOC</th>
                      <th scope="col" className="p-3 border border-tableBorder">Bin Location</th>
                      <th scope="col" className="p-3 border border-tableBorder">Assign To</th>
                      <th scope="col" className="p-3 border border-tableBorder">Assign Date</th>
                      <th scope="col" className="p-3 border border-tableBorder">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 border border-tableBorder">Loading...</td>
                      </tr>
                    ) : jobDetails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 border border-tableBorder">No items to assign for this job.</td>
                      </tr>
                    ) : (
                      jobDetails.map((item) => (
                        <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                          
                          <td className="px-2 py-2 border border-tableBorder">
                            {item.jo_number ? (
                              <Link
                                href={`/production_module/${item.job_no}`}
                                target="_blank"
                                className="text-blue-600 hover:underline"
                              >
                                {item.jo_number}
                              </Link>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">{item.job_type}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.job_category}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.item_no}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.qty}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.moc}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.bin_location}</td>
                          <td className="px-2 py-2 border border-tableBorder">
                            {assignments[item.id]?.assignTo === "Others" ? (
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
                                  disabled={!!item.assign_to || !item.urgent}
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
                                disabled={!!item.assign_to || !item.urgent}
                              >
                                <option value="">Select</option>
                                <option value="Usmaan">Usmaan</option>
                                <option value="Ashfaq">Ashfaq</option>
                                <option value="Ramzaan">Ramzaan</option>
                                <option value="Others">Others</option>
                              </select>
                            )}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <input
                              type="date"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                              value={assignments[item.id]?.assignDate || ""}
                              onChange={(e) => handleAssignmentChange(item.id, "assignDate", e.target.value)}
                              disabled={!!item.assign_to || !item.urgent}
                            />
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <button
                              onClick={() => !item.assign_to && item.urgent && handleAssign(item.id)}
                              disabled={!!item.assign_to || !item.urgent}
                              className={`px-3 py-1 rounded text-sm transition-colors text-white ${
                                item.assign_to
                                  ? "bg-green-600 cursor-default"
                                  : !item.urgent
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {item.assign_to ? "Assigned" : "Assign"}
                            </button>
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
