"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaArrowLeft, FaChevronDown, FaChevronRight } from "react-icons/fa";

import AxiosProvider from "../../../provider/AxiosProvider";
import StorageManager from "../../../provider/StorageManager";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";

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
  vendor_name?: string | null;
  job_id?: string | null;
  jobId?: string | null;
  job_category?: string | null;
  review_for?: "welding" | "vendor" | null;
  status?: string | null;
  job?: {
    id?: string | null;
    job_no?: string | null;
    job_category?: string | null;
    client_name?: string | null;
  } | null;
};

export default function NotOkVendorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";
  const REVIEW_FOR = "vendor";

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/categories");
      const cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      const uniqueMap = new Map<string, { value: string; label: string }>();

      cats.forEach((cat: any) => {
        const jobCategory = String(cat?.job_category || "").trim();
        if (jobCategory && !uniqueMap.has(jobCategory)) {
          uniqueMap.set(jobCategory, {
            value: jobCategory,
            label: jobCategory,
          });
        }
      });

      setCategories(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const buildQS = () => {
    const q = new URLSearchParams();
    q.set("filter", filterParam);
    if (client) q.set("client", client);
    q.set("review_for", REVIEW_FOR);
    return q.toString();
  };

  const goQcVendorPage = () => {
    router.push(`/qc/vendor?${buildQS()}`);
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
      console.error("Error fetching not-ok vendor data:", error);
      toast.error(error?.response?.data?.error || "Failed to load Not OK Vendor data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedJobNo(null);
    fetchData();
  }, [filterParam, client]);

  const toggleGroup = (jo: string) => {
    setExpandedGroups((prev) => ({ ...prev, [jo]: !prev[jo] }));
  };

  const getJobId = (items: Row[]) =>
    items?.[0]?.jobId || items?.[0]?.job_id || items?.[0]?.job?.id;

  const actionConfirm = async (title: string, text: string, confirm: string) => {
    const r = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirm,
    });
    return r.isConfirmed;
  };

  const handleJobBackToQC = async (items: Row[]) => {
    if (!(await actionConfirm("Send back to QC?", "This job will move back to QC Vendor.", "Yes, Send to QC"))) return;

    const job_id = getJobId(items);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/backToQc`, {
        updated_by,
        review_for: REVIEW_FOR,
      });

      toast.success("Job sent back to QC Vendor successfully");
      goQcVendorPage();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to send back to QC");
    }
  };

  const handleRework = async (items: Row[]) => {
    if (!(await actionConfirm("Send for rework?", "This job will be sent for rework.", "Yes, Rework"))) return;

    const job_id = getJobId(items);
    const updated_by = storage.getUserId();

    if (!job_id) return toast.error("Job ID not found.");
    if (!updated_by) return toast.error("User ID not found. Please login again.");

    try {
      await axiosProvider.post(`/fineengg_erp/jobs/${job_id}/rework`, { updated_by });
      toast.success("Job sent for rework successfully");
      fetchData();
      setSelectedJobNo(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Rework failed");
    }
  };

  const handleJobRejected = async (items: Row[]) => {
    if (!(await actionConfirm("Reject this job?", "This will reject the selected Not OK job.", "Yes, Reject"))) return;

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
      setSelectedJobNo(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Reject failed");
    }
  };

  const filteredData = useMemo(() => {
    if (jobServiceCategoryFilter === "ALL") return data;

    return data.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  }, [data, jobServiceCategoryFilter]);

  const jobNumbers = useMemo(() => {
    const jobs = new Set<string>();
    filteredData.forEach((item) => {
      const jobNo = item.job?.job_no;
      if (jobNo) jobs.add(jobNo);
    });
    return Array.from(jobs);
  }, [filteredData]);

  const getJoGroupsForJob = (jobNo: string) => {
    const items = filteredData.filter((item) => item.job?.job_no === jobNo);
    const groups: Record<string, Row[]> = {};

    items.forEach((item) => {
      const jo = item.jo_no || "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });

    return groups;
  };

  const jobSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        totalQty: number;
        uniqueJoCount: number;
        jobCategory: string;
        assigningDate: string;
      }
    > = {};

    jobNumbers.forEach((jobNo) => {
      const items = filteredData.filter((item) => item.job?.job_no === jobNo);

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

      summary[jobNo] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
      };
    });

    return summary;
  }, [filteredData, jobNumbers]);

  const uniqueCategories = useMemo(() => categories, [categories]);

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
              Not OK • Vendor • {filterParam.replace("_", " ")}
              {client && ` • ${client}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className="font-semibold">not-ok</span> | Review for:{" "}
              <span className="font-semibold">vendor</span>
            </p>
          </div>

          {uniqueCategories.length > 0 && (
            <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
              <button
                onClick={() => setJobServiceCategoryFilter("ALL")}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  jobServiceCategoryFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
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

                <h2 className="text-xl font-bold mb-4">Job: {selectedJobNo}</h2>

                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">JO No</th>
                      <th className="px-2 py-0 border border-tableBorder">Serial No</th>
                      <th className="px-2 py-0 border border-tableBorder">Item No</th>
                      <th className="px-2 py-0 border border-tableBorder">Vendor Name</th>
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
                    {Object.entries(getJoGroupsForJob(selectedJobNo)).length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No JO data found</p>
                        </td>
                      </tr>
                    ) : (
                      Object.entries(getJoGroupsForJob(selectedJobNo)).map(([jo, items]) => {
                        const isExpanded = expandedGroups[jo] ?? true;
                        return (
                          <>
                            <tr
                              key={`${jo}-head`}
                              className="border border-tableBorder bg-white hover:bg-primary-100"
                            >
                              <td
                                className="px-2 py-2 border border-tableBorder cursor-pointer"
                                onClick={() => toggleGroup(jo)}
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                  <p className="text-blue-600 text-base leading-normal">{jo}</p>
                                </div>
                              </td>
                              <td className="px-2 py-2 border border-tableBorder" colSpan={9}></td>
                              <td className="px-2 py-2 border border-tableBorder">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleJobBackToQC(items)}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                                  >
                                    QC
                                  </button>
                                  <button
                                    onClick={() => handleRework(items)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                  >
                                    Rework
                                  </button>
                                  <button
                                    onClick={() => handleJobRejected(items)}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
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
                                  <td className="px-2 py-2 border border-tableBorder">{item.vendor_name || "-"}</td>
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
              </>
            ) : (
              <>
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th className="p-3 border border-tableBorder">Job No</th>
                      <th className="px-2 py-0 border border-tableBorder">Job Category</th>
                      <th className="px-2 py-0 border border-tableBorder">Total JO</th>
                      <th className="px-2 py-0 border border-tableBorder">Total Quantity</th>
                      <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">Loading...</p>
                        </td>
                      </tr>
                    ) : jobNumbers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No data found</p>
                        </td>
                      </tr>
                    ) : (
                      jobNumbers.map((jobNo) => {
                        const summary = jobSummary[jobNo];

                        return (
                          <tr
                            key={jobNo}
                            className="border border-tableBorder bg-white hover:bg-primary-100 cursor-pointer"
                            onClick={() => setSelectedJobNo(jobNo)}
                          >
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-blue-600 text-base leading-normal">{jobNo}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.jobCategory}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.uniqueJoCount}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.totalQty}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base">{summary.assigningDate || "-"}</p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="text-xs text-gray-500 mt-3 px-2">
            Total Jobs: {jobNumbers.length} | Total Items: {filteredData.length}
          </div>
        </div>
      </div>
    </div>
  );
}