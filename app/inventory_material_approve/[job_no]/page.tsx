"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiCheck, HiArrowLeft, HiX, HiUserGroup } from "react-icons/hi";
import LeftSideBar from "../../component/LeftSideBar";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

export default function JobDetailsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [jobInfo, setJobInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isVendorTab = !!searchParams.get("assign_to_not");
  const jobNo = params.job_no ? decodeURIComponent(params.job_no as string) : "";
  
  // Get assign_to and assign_to_not from searchParams
  const assignTo = searchParams.get("assign_to");
  const assignToNot = searchParams.get("assign_to_not");

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
        toast.error(error?.response?.data?.error || "Failed to approve item");
      }
    }
  };

  // Handler for vendor approval
  const handleApproveForVendors = async (id: string, displayId: string, jobType: string) => {
    const jobTypeDisplay = 
      jobType === "JOB_SERVICE" ? "Job Service" :
      jobType === "TSO_SERVICE" ? "TSO Service" : "Kanban";

    const result = await Swal.fire({
      title: "Approve for Vendors?",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>${jobTypeDisplay}:</strong> ${displayId || 'N/A'}</p>
          <p class="mb-2"><strong>Type:</strong> ${jobType}</p>
          <p class="text-sm text-gray-500 mt-4">This will:</p>
          <ul class="text-sm text-gray-500 list-disc pl-5 mt-2 text-left">
            <li>Mark the job as approved for vendors</li>
            <li>Create QC vendor assignments (no worker assigned)</li>
            <li>Move the job to QC Vendor queue with status "qc-vendor"</li>
          </ul>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      confirmButtonText: "Yes, approve for vendors",
      cancelButtonText: "Cancel",
      width: '500px',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await axiosProvider.post(`/fineengg_erp/system/jobs/${id}/approve-vendors`, {
          apply_to_group: true,
        });

        if (response.data.success) {
          toast.success(response.data.message);
          fetchData(); // Refresh the data
        }
      } catch (error: any) {
        console.error("Error approving for vendors:", error);
        toast.error(error?.response?.data?.error || "Failed to approve for vendors");
      } finally {
        setLoading(false);
      }
    }
  };

  // Navigate to QC Vendor page
  const handleViewQcVendor = (jobId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    window.open(`/qc/vendor?job_id=${jobId}&${params.toString()}`, '_blank');
  };

  // Get display ID based on job type
  const getDisplayId = (item: any) => {
    if (item.job_type === "JOB_SERVICE") return item.job_no;
    if (item.job_type === "TSO_SERVICE") return item.tso_no;
    if (item.job_type === "KANBAN") return item.jo_number;
    return "N/A";
  };

  // Get job type badge
  const getJobTypeBadge = (jobType: string) => {
    switch(jobType) {
      case "JOB_SERVICE":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Job</span>;
      case "TSO_SERVICE":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TSO</span>;
      case "KANBAN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Kanban</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Unknown</span>;
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
        toast.error(error?.response?.data?.error || "Failed to mark as not approved.");
      }
    }
  };

  const fetchData = async () => {
    if (!jobNo) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("job_no", jobNo);

      const clientParam = searchParams.get("client");
      const filterParam = searchParams.get("filter");

      if (clientParam) {
        params.append("client_name", clientParam);
      }
      if (filterParam) {
        params.append("job_type", filterParam);
      }
      
      // Handle assign_to and assign_to_not parameters
      if (assignTo) {
        params.append("assign_to", assignTo);
      }
      if (assignToNot) {
        params.append("assign_to_not", assignToNot);
      }
      
      const response = await axiosProvider.get(`/fineengg_erp/system/jobs?${params.toString()}`);
      const jobItems = response.data.data.map((item: any) => ({
        ...item,
        is_approve: item.job_status === 'approved' ? 1 : 0,
        is_rejected: item.job_status === 'not-approved' ? 1 : 0,
        is_vendor_approved: item.status === 'qc-vendors' ? 1 : 0,
      }));

      if (jobItems.length > 0) {
        setItems(jobItems);
        setJobInfo({
          job_type: jobItems[0].job_type,
          job_category: jobItems[0].job_category,
          kanban_job_cat: jobItems[0].kanban_job_cat,
        });
      } else {
        toast.error("Job not found.");
        router.push('/inventory_material_approve');
      }
    } catch (error: any) {
      console.error("Error fetching job details:", error);
      toast.error(error?.response?.data?.error || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobNo, searchParams, assignTo, assignToNot]);

  return (
    <>
      <style jsx>{`
        .badge-vendor-approved {
          background-color: #f3e8ff;
          color: #8b5cf6;
        }
      `}</style>
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
              disabled={loading}
            >
              <HiArrowLeft />
              Back
            </button>
            
            {/* Header with view button */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Job Details: {jobNo}</h1>
                {jobInfo && (
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    {getJobTypeBadge(jobInfo.job_type)}
                    {jobInfo.job_category && (
                      <span>Category: {jobInfo.job_category}</span>
                    )}
                    {jobInfo.kanban_job_cat && (
                      <span>Kanban: {jobInfo.kanban_job_cat}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick navigation to QC Vendor page */}
              {items.some(item => item.is_vendor_approved) && (
                <button
                  onClick={() => handleViewQcVendor(items[0]?.id)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  <HiUserGroup className="w-5 h-5" />
                  View in QC Vendor
                </button>
              )}
            </div>

            <div className="relative overflow-x-auto sm:rounded-lg">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="p-3 border border-tableBorder">ID</th>
                      <th scope="col" className="px-2 py-3 border border-tableBorder">Type</th>
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
                        <td colSpan={9} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No items found for this job.</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item: any) => (
                        <tr className="border border-tableBorder bg-white hover:bg-primary-100" key={item.id}>
                          <td className="px-2 py-2 border border-tableBorder font-medium">
                            {getDisplayId(item)}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            {getJobTypeBadge(item.job_type)}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">{item.item_description || "-"}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.item_no || "-"}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.qty}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.moc}</td>
                          <td className="px-2 py-2 border border-tableBorder">{item.bin_location}</td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <span
                              className={`px-2 py-1 rounded text-sm inline-flex items-center ${
                                item.is_vendor_approved
                                  ? "bg-purple-100 text-purple-600"
                                  : item.is_approve
                                  ? "bg-green-100 text-green-600"
                                  : item.is_rejected
                                  ? "bg-red-100 text-red-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {item.is_vendor_approved 
                                ? "QC Vendor" 
                                : item.is_approve 
                                ? "Approved" 
                                : item.is_rejected 
                                ? "Not Approved" 
                                : "Pending"}
                            </span>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <div className="flex items-center gap-2">
                              {/* Regular Approve Button */}
                              {!item.is_vendor_approved && !item.is_approve && !item.is_rejected && (
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors"
                                  title="Approve"
                                >
                                  <HiCheck className="w-4 h-4" />
                                </button>
                              )}

                              {/* Vendor Approval Button */}
                              {!item.is_vendor_approved && !item.is_approve && !item.is_rejected && (
                                <button
                                  onClick={() => handleApproveForVendors(
                                    item.id, 
                                    getDisplayId(item), 
                                    item.job_type
                                  )}
                                  className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                                  title="Send to QC Vendor (No Worker)"
                                >
                                  <HiUserGroup className="w-4 h-4" />
                                </button>
                              )}

                              {/* View in QC Vendor Button */}
                              {item.is_vendor_approved && (
                                <button
                                  onClick={() => handleViewQcVendor(item.id)}
                                  className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                                  title="View in QC Vendor"
                                >
                                  <HiUserGroup className="w-4 h-4" />
                                </button>
                              )}

                              {/* Not Approve Button */}
                              {!item.is_vendor_approved && !item.is_rejected && (
                                <button
                                  onClick={() => !item.is_approve && handleNotApprove(item.id)}
                                  disabled={!!item.is_approve}
                                  className={`p-1.5 rounded transition-colors ${
                                    item.is_approve
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-red-100 text-red-600 hover:bg-red-200"
                                  }`}
                                  title="Not Approve"
                                >
                                  <HiX className="w-4 h-4" />
                                </button>
                              )}

                              {/* Show disabled state for approved items */}
                              {item.is_approve && !item.is_vendor_approved && (
                                <span className="px-2 py-1 text-xs text-green-600">✓</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}