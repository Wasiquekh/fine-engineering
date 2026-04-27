"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
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
  product_desc?: string | null;
  product_item_no?: string | null;
  product_qty?: number | string | null;
}

export default function JobDetailsPage() {
  const [jobDetails, setJobDetails] = useState<JobDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const job_no = decodeURIComponent(params.job_no as string);
  const client = searchParams.get("client");
  const filter = searchParams.get("filter");
  const assign_to = searchParams.get("assign_to");

  const uniqueJobDetails = useMemo(() => {
    const seen = new Set();
    return jobDetails.filter((job) => {
      if (!job.jo_number) return true;
      if (seen.has(job.jo_number)) return false;
      seen.add(job.jo_number);
      return true;
    });
  }, [jobDetails]);

  useEffect(() => {
    if (job_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const urlParams = new URLSearchParams({ job_no: job_no });

          if (client) {
            urlParams.append("client_name", client);
          }

          if (filter && filter !== "ALL") {
            urlParams.append("job_type", filter);
          }

          if (assign_to) {
            urlParams.append("assign_to", assign_to);
          }
          const jobsResponse = await axiosProvider.get(`/fineengg_erp/system/jobs?${urlParams.toString()}`);

          if (jobsResponse.data && Array.isArray(jobsResponse.data.data)) {
            const fetchedJobs = jobsResponse.data.data;
            setJobDetails(fetchedJobs);
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
  }, [job_no, client, filter, assign_to]);

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
              <h2 className="text-xl font-semibold mb-4">Material Received From {client || "Client"}</h2>
              <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">J/O No</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Job Category</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Product Description</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Product Item No</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Product Qty</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Item Description</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Item No</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">MOC</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Assign To</div>
                        </div>
                      </th>
                      <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">Assign Date</div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4 border border-tableBorder">
                          <p className="text-[#666666] text-base">Loading...</p>
                        </td>
                      </tr>
                    ) : uniqueJobDetails.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-4 border border-tableBorder">
                          <p className="text-[#666666] text-base">No items to assign for this job.</p>
                        </td>
                      </tr>
                    ) : (
                      uniqueJobDetails.map((item) => (
                        <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                          <td className="px-4 py-3 border border-tableBorder">
                            {item.jo_number ? (
                              <Link
                                href={`/section_production/machine_category/${encodeURIComponent(item.jo_number)}?filter=${encodeURIComponent(filter || "")}&client=${encodeURIComponent(client || "")}&assign_to=${encodeURIComponent(assign_to || "")}`}
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                {item.jo_number}
                              </Link>
                            ) : "N/A"}
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.job_category}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.product_desc || "-"}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.product_item_no || "-"}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.product_qty || "-"}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.item_description}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.item_no}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.moc}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.assign_to || "Not Assigned"}</p>
                          </td>
                          <td className="px-4 py-3 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.assign_date || "-"}</p>
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