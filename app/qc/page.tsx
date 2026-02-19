"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const axiosProvider = new AxiosProvider();

export default function ReviewPage() {
  const [data, setData] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "JOB_SERVICE";

  const fetchData = async () => {
    try {
      const response = await axiosProvider.get(`/fineengg_erp/assign-to-worker?job_type=${filterParam}&status=ready-for-qc`);
      const fetchedData = Array.isArray(response.data.data) ? response.data.data : [];
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching review data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterParam]);

  const groupedData = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    data.forEach((item) => {
      const jo = item.jo_no || "Unknown";
      if (!groups[jo]) {
        groups[jo] = [];
      }
      groups[jo].push(item);
    });
    return groups;
  }, [data]);

  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  const toggleGroup = (jo: string) => {
    setExpandedGroups((prev) => ({ ...prev, [jo]: !prev[jo] }));
  };

  // const handleQc = async (items: any[]) => {
  //   const result = await Swal.fire({
  //     title: "Are you sure?",
  //     text: `You want to mark ${items.length} item(s) as Ready for QC?`,
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#3085d6",
  //     cancelButtonColor: "#d33",
  //     confirmButtonText: "Yes, QC it!",
  //   });

  //   if (result.isConfirmed) {
  //     try {
  //       await Promise.all(items.map((item) => axiosProvider.post(`/fineengg_erp/assign-to-worker/${item.id}/ready-for-qc`, null)));
  //       toast.success("Marked as Ready for QC successfully");
  //       fetchData();
  //     } catch (error) {
  //       console.error("Error marking as Ready for QC:", error);
  //       toast.error("Failed to mark as Ready for QC");
  //     }
  //   }
  // };

  // const handleReject = async (items: any[]) => {
  //   const result = await Swal.fire({
  //     title: "Are you sure?",
  //     text: `You want to reject ${items.length} item(s)?`,
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#d33",
  //     cancelButtonColor: "#3085d6",
  //     confirmButtonText: "Yes, Reject it!",
  //   });

  //   if (result.isConfirmed) {
  //     try {
  //       await Promise.all(items.map((item) => axiosProvider.post(`/fineengg_erp/assign-to-worker/${item.id}/reject`, null)));
  //       toast.success("Rejected successfully");
  //       fetchData();
  //     } catch (error) {
  //       console.error("Error rejecting item:", error);
  //       toast.error("Failed to reject item");
  //     }
  //   }
  // };

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
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
        <DesktopHeader />
        <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
          <div className="relative overflow-x-auto sm:rounded-lg">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-[#999999]">
                <tr className="border border-tableBorder">
                  <th scope="col" className="p-3 border border-tableBorder">
                    JO No
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Serial No
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Item No
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Machine Category
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Machine Size
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Machine Code
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Worker Name
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Quantity
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Assigning Date
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedData).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center border border-tableBorder">
                      <p className="text-[#666666] text-base">No data found</p>
                    </td>
                  </tr>
                ) : (
                  Object.keys(groupedData).map((jo) => {
                    const items = groupedData[jo];
                    const isExpanded = expandedGroups[jo];

                    return (
                      <>
                        <tr key={jo} className="border border-tableBorder bg-white hover:bg-primary-100">
                          <td className="px-2 py-2 border border-tableBorder cursor-pointer" onClick={() => toggleGroup(jo)}>
                            <div className="flex items-center gap-2">
                              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                              <p className="text-[#232323] text-base leading-normal">{jo}</p>
                            </div>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder"></td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <div className="flex items-center gap-2">
                              {/* <button onClick={(e) => { e.stopPropagation(); handleQc(items); }} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"> */}
                              <button onClick={(e) => { e.stopPropagation();  }} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                                OK
                              </button>
                              {/* <button onClick={(e) => { e.stopPropagation(); handleReject(items); }} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"> */}
                              <button onClick={(e) => { e.stopPropagation();  }} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                                Rework
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && items.map((item: any) => (
                          <tr key={item.id} className="border border-tableBorder bg-gray-50">
                            <td className="px-2 py-2 border border-tableBorder"></td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.serial_no || "-"}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.item_no}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.machine_category}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.machine_size}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.machine_code}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.worker_name}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.quantity_no}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.assigning_date}</p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder"></td>
                          </tr>
                        ))}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
