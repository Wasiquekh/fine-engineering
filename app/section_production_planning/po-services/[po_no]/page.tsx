"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Image from "next/image";
import { FaChevronDown } from "react-icons/fa";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

interface POServiceDetail {
  id: string;
  po_no: string;
  po_date: string;
  pn_no: number;
  job_no: string;
  item_no: number;
  drg_no: string;
  moc: string;
  description: string;
  po_qnty: number;
  category: string;
  urgent: boolean;
  assign_to?: string;
  is_rejected?: boolean | number;
  rejected?: boolean | number;
  status?: string;
}

export default function JobDetailsPage() {
  const [poDetails, setPoDetails] = useState<POServiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJoNumbers, setExpandedJoNumbers] = useState<string[]>([]);
  const params = useParams();
  const router = useRouter();
  const po_no = params.po_no ? decodeURIComponent(params.po_no as string) : "";

  const groupedJobDetails = useMemo(() => {
    return poDetails.reduce((acc, po) => {
      const key = po.pn_no ? String(po.pn_no) : 'N/A';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(po);
      return acc;
    }, {} as Record<string, POServiceDetail[]>);
  }, [poDetails]);

  const toggleJoNumberExpansion = (joNumber: string) => {
    setExpandedJoNumbers((prev) =>
      prev.includes(joNumber)
        ? prev.filter((n) => n !== joNumber)
        : [...prev, joNumber]
    );
  };

  useEffect(() => {
    if (po_no) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [poResponse] = await Promise.all([
            axiosProvider.get(`/fineengg_erp/system/po-services?po_no=${encodeURIComponent(po_no)}`),
          ]);

          if (poResponse.data && Array.isArray(poResponse.data.data)) {
            const fetchedPOs = poResponse.data.data;
            setPoDetails(fetchedPOs);
          } else {
            setPoDetails([]);
          }
        } catch (error) {
          console.error("Error fetching data for PO:", error);
          toast.error("Failed to load data for this PO.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [po_no]);

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
              <h2 className="text-xl font-bold mb-4">PO Service Items for PO No: {po_no}</h2>
              <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder">
                      <th scope="col" className="p-3 border border-tableBorder">PN No</th>
                      <th scope="col" className="p-3 border border-tableBorder">Job No</th>
                      <th scope="col" className="p-3 border border-tableBorder">Item No</th>
                      <th scope="col" className="p-3 border border-tableBorder">Drg No</th>
                      <th scope="col" className="p-3 border border-tableBorder">MOC</th>
                      <th scope="col" className="p-3 border border-tableBorder">Description</th>
                      <th scope="col" className="p-3 border border-tableBorder">Quantity</th>
                      <th scope="col" className="p-3 border border-tableBorder">Category</th>
                      <th scope="col" className="p-3 border border-tableBorder">Assign To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4 border border-tableBorder">Loading...</td>
                      </tr>
                    ) : poDetails.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4 border border-tableBorder">No items to assign for this PO.</td>
                      </tr>
                    ) : (
                      Object.entries(groupedJobDetails).flatMap(([joNumber, jobs]) => {
                        const isExpanded = expandedJoNumbers.includes(joNumber);
                        const hasMultiple = jobs.length > 1;

                        const renderJobRow = (item: POServiceDetail, isFirst: boolean) => {
                          return (
                          <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                            <td className="px-2 py-2 border border-tableBorder">
                              {isFirst && (
                                <div className="flex items-center gap-2">
                                  {item.pn_no || "N/A"}
                                  {hasMultiple && (
                                    <button onClick={() => toggleJoNumberExpansion(joNumber)}>
                                      <FaChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">{item.job_no || "-"}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.item_no}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.drg_no || "-"}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.moc}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.description}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.po_qnty}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.category}</td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <p className="text-[#232323] text-base leading-normal">{item.assign_to || "N/A"}</p>
                            </td>
                          </tr>
                        );
                        };

                        const rows = [renderJobRow(jobs[0], true)];
                        if (hasMultiple && isExpanded) {
                          jobs.slice(1).forEach(job => rows.push(renderJobRow(job, false)));
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
