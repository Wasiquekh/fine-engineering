"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiCheck, HiArrowLeft, HiX } from "react-icons/hi";
import LeftSideBar from "../../../component/LeftSideBar";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../../../component/DesktopHeader";
import AxiosProvider from "../../../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

export default function JobDetailsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [jobInfo, setJobInfo] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isVendorTab = !!searchParams.get("assign_to_not");
  const joNumber = params.jo_number ? decodeURIComponent(params.jo_number as string) : "";

  const handleApprove = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to approve this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const endpoint = isVendorTab
          ? `/fineengg_erp/system/jobs/${id}/approve-vendors`
          : `/fineengg_erp/system/jobs/${id}/approve`;

        const response = await axiosProvider.post(endpoint, { apply_to_group: false });
        if (response.data.success) {
          toast.success("Item approved successfully");
          fetchData();
        } else {
          toast.error("Failed to approve item");
        }
      } catch (error: any) {
        console.error("Error approving item:", error);
        toast.error("Failed to approve item");
      }
    }
  };

  const handleNotApprove = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this item as not approved?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, do not approve!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/jobs/${id}/not-approve`, { apply_to_group: false });
        toast.success("Item marked as not approved.");
        fetchData();
      } catch (error: any) {
        console.error("Error marking item as not approved:", error);
        toast.error("Failed to mark as not approved.");
      }
    }
  };

  const fetchData = async () => {
    if (!joNumber) return;
    try {
      const params = new URLSearchParams();
      params.append("jo_number", joNumber);

      const clientParam = searchParams.get("client");
      const filterParam = searchParams.get("filter");

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
      const response = await axiosProvider.get(`/fineengg_erp/system/jobs?${params.toString()}`);
      const jobItems = response.data.data
        .filter((item: any) => item.status !== 'completed')
        .map((item: any) => ({
        ...item,
        is_approve: item.job_status === 'approved' ? 1 : 0,
        is_rejected: item.job_status === 'not-approved' ? 1 : 0,
      }));

      if (jobItems.length > 0) {
        setItems(jobItems);
        setJobInfo({
          job_type: jobItems[0].job_type,
          job_category: jobItems[0].job_category,
        });
      } else {
        toast.error("Job not found.");
        router.push('/inventory_material_approve');
      }
    } catch (error: any) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to load job details");
    }
  };

  useEffect(() => {
    fetchData();
  }, [joNumber,searchParams]);

  return (
    <>
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
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mb-6"
            >
              <HiArrowLeft />
              Back
            </button>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Job Details: {joNumber}</h1>
              {/* {jobInfo && (
                  <div className="text-sm text-gray-500 mt-1">
                      <span>Job Type: {jobInfo.job_type}</span>
                      <span className="mx-2">|</span>
                      <span>Job Category: {jobInfo.job_category}</span>
                  </div>
              )} */}
            </div>

            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="p-3 border border-tableBorder">J/O Number</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">Item Description</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">Item No</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">Quantity</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">MOC</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">Bin Location</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">Status</th>
                    <th scope="col" className="px-2 py-3 border border-tableBorder">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center border border-tableBorder">
                        <p className="text-[#666666] text-base">No items found for this job.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item: any) => (
                      <tr className="border border-tableBorder bg-white hover:bg-primary-100" key={item.id}>
                        <td className="px-2 py-2 border border-tableBorder">{item.jo_number || "N/A"}</td>
                        <td className="px-2 py-2 border border-tableBorder">{item.item_description}</td>
                        <td className="px-2 py-2 border border-tableBorder">{item.item_no}</td>
                        <td className="px-2 py-2 border border-tableBorder">{item.qty}</td>
                        <td className="px-2 py-2 border border-tableBorder">{item.moc}</td>
                        <td className="px-2 py-2 border border-tableBorder">{item.bin_location}</td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              item.is_approve
                                ? "bg-green-100 text-green-600"
                                : item.is_rejected
                                ? "bg-red-100 text-red-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {item.is_approve ? "Approved" : (item.is_rejected ? "Not Approved" : "Pending")}
                          </span>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => !item.is_approve && handleApprove(item.id)}
                              disabled={!!item.is_approve || !!item.is_rejected}
                              className={`p-1.5 rounded transition-colors ${
                                item.is_approve
                                  ? "bg-green-100 text-green-600 cursor-not-allowed"
                                  : item.is_rejected
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                              }`}
                              title={item.is_approve ? "Approved" : "Approve"}
                            >
                              <HiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => !item.is_approve && !item.is_rejected && handleNotApprove(item.id)}
                              disabled={!!item.is_approve || !!item.is_rejected}
                              className={`p-1.5 rounded transition-colors ${
                                item.is_rejected
                                  ? "bg-red-100 text-red-600 cursor-not-allowed"
                                  : item.is_approve
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-100 text-red-600 hover:bg-red-200"
                              }`}
                              title={item.is_rejected ? "Not Approved" : "Not Approve"}
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