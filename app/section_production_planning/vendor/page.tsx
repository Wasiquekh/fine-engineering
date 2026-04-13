"use client";

import Image from "next/image";
import { useEffect, useState, Fragment } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import PageGuard from "../../component/PageGuard";

const axiosProvider = new AxiosProvider();

interface VendorAssignment {
  id: string;
  jo_no: string | null;
  item_no: string | null;
  machine_category: string | null;
  machine_size: string | null;
  machine_code: string | null;
  worker_name: string | null;
  quantity_no: number | null;
  assigning_date: string | null;
  serial_no: string | null;
  job_id: string | null;
  vendor_name: string | null;
  qc_date: string | null;
  qc_quantity: number | null;
  gatepass_no: string | null;
  review_for: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  job: {
    id: string;
    job_type: string;
    job_category: string;
    job_no: string;
    jo_number: string;
    tso_no: string | null;
    serial_no: string;
    item_description: string;
    item_no: string;
    product_desc: string | null;
    qty: number;
    moc: string;
    client_name: string;
    assign_to: string;
    status: string;
  } | null;
}

export default function VendorPage() {
  const [data, setData] = useState<VendorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJO, setSelectedJO] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const client = searchParams.get("client") || "";

  const fetchVendorAssignments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (client) {
        params.client_name = client;
      }
      
      const response = await axiosProvider.get("/fineengg_erp/system/assignments/in-vendor", {
        params,
        headers: undefined
      });
      
      let fetchedData = response?.data?.data || [];
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching vendor assignments:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorAssignments();
  }, [client]);

  // Group by JO Number
  const josGrouped = () => {
    const joMap = new Map<string, {
      joNumber: string;
      items: VendorAssignment[];
      totalQty: number;
      jobNo: string;
      clientName: string;
      vendorName: string;
      itemDescriptions: string[];
      itemNos: string[];
      serialNos: string[];
      mocList: string[];
    }>();
    
    data.forEach((item) => {
      const joNumber = item.jo_no || item.job?.jo_number;
      if (joNumber) {
        if (!joMap.has(joNumber)) {
          joMap.set(joNumber, {
            joNumber,
            items: [],
            totalQty: 0,
            jobNo: item.job?.job_no || "N/A",
            clientName: item.job?.client_name || "N/A",
            vendorName: item.vendor_name || "N/A",
            itemDescriptions: [],
            itemNos: [],
            serialNos: [],
            mocList: [],
          });
        }
        const joData = joMap.get(joNumber)!;
        joData.items.push(item);
        joData.totalQty += Number(item.quantity_no) || 0;
        if (item.job?.item_description && !joData.itemDescriptions.includes(item.job.item_description)) {
          joData.itemDescriptions.push(item.job.item_description);
        }
        if (item.item_no && !joData.itemNos.includes(String(item.item_no))) {
          joData.itemNos.push(String(item.item_no));
        }
        if (item.serial_no && !joData.serialNos.includes(item.serial_no)) {
          joData.serialNos.push(item.serial_no);
        }
        if (item.job?.moc && !joData.mocList.includes(item.job.moc)) {
          joData.mocList.push(item.job.moc);
        }
      }
    });
    
    return Array.from(joMap.values());
  };

  const getItemsForJO = (joNumber: string) => {
    return data.filter(item => (item.jo_no || item.job?.jo_number) === joNumber);
  };

  const VendorContent = () => (
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
          <h1 className="text-2xl font-semibold text-firstBlack">
            Vendor • In-Vendor Status
            {client && ` • ${client}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Items currently with vendors for outsourcing
          </p>
        </div>

        <div className="relative overflow-x-auto sm:rounded-lg">
          {selectedJO ? (
            // Item Level View - Show items for selected JO
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedJO(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FaArrowLeft />
                  Back to JO List
                </button>
              </div>

              <h2 className="text-xl font-bold mb-4">
                JO: {selectedJO}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder bg-gray-50">
                      <th className="p-3 border border-tableBorder font-semibold">Serial No</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Item No</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Item Description</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">MOC</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Vendor Name</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Quantity</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Assigning Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(() => {
                      const items = getItemsForJO(selectedJO);
                      if (items.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="px-4 py-6 text-center border border-tableBorder">
                              <p className="text-[#666666] text-base">No items found</p>
                            </td>
                          </tr>
                        );
                      }
                      
                      return items.map((item) => (
                        <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-50">
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-sm font-mono text-blue-600">
                              {item.serial_no || "N/A"}
                            </p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{item.item_no || "N/A"}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{item.job?.item_description || "N/A"}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{item.job?.moc || "N/A"}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{item.vendor_name || "N/A"}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <span className="font-semibold text-green-600">{item.quantity_no || 0}</span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <p className="text-sm">{item.assigning_date ? new Date(item.assigning_date).toLocaleDateString() : "N/A"}</p>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            // JO Level View - Show all JOs
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  JO Groups with Vendors
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border border-tableBorder bg-gray-50">
                      <th className="p-3 border border-tableBorder font-semibold">JO Number</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Job No</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Client Name</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Vendor Name</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Serial Nos</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Item Nos</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">Item Description</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold">MOC</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Total Items</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Total Quantity</th>
                      <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center border border-tableBorder">
                          <div className="flex justify-center items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                            <p className="text-[#666666] text-base">Loading...</p>
                          </div>
                        </td>
                      </tr>
                    ) : josGrouped().length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center border border-tableBorder">
                          <p className="text-[#666666] text-base">No vendor assignments found</p>
                        </td>
                      </tr>
                    ) : (
                      josGrouped().map((jo) => (
                        <tr
                          key={jo.joNumber}
                          className="border border-tableBorder cursor-pointer bg-white hover:bg-primary-50 transition-colors"
                          onClick={() => setSelectedJO(jo.joNumber)}
                        >
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-sm leading-normal text-blue-600 font-medium">
                              {jo.joNumber}
                            </p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{jo.jobNo}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{jo.clientName}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm">{jo.vendorName}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <div className="text-sm max-w-[200px]">
                              {jo.serialNos.slice(0, 2).map((serial, idx) => (
                                <div key={idx} className="font-mono text-xs mb-1">{serial}</div>
                              ))}
                              {jo.serialNos.length > 2 && (
                                <div className="text-gray-400 text-xs">+{jo.serialNos.length - 2} more</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <div className="text-sm">
                              {jo.itemNos.map((itemNo, idx) => (
                                <div key={idx} className="mb-1">{itemNo}</div>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <div className="text-sm max-w-[250px]">
                              {jo.itemDescriptions.slice(0, 2).map((desc, idx) => (
                                <div key={idx} className="mb-1 truncate">{desc}</div>
                              ))}
                              {jo.itemDescriptions.length > 2 && (
                                <div className="text-gray-400 text-xs">+{jo.itemDescriptions.length - 2} more</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <div className="text-sm">
                              {jo.mocList.slice(0, 2).map((moc, idx) => (
                                <div key={idx} className="mb-1">{moc}</div>
                              ))}
                              {jo.mocList.length > 2 && (
                                <div className="text-gray-400 text-xs">+{jo.mocList.length - 2} more</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {jo.items.length}
                            </span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <span className="font-semibold text-green-600">{jo.totalQty}</span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJO(jo.joNumber);
                              }}
                              className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 transition-colors"
                            >
                              View Items
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-4 px-2 flex justify-between items-center">
          <div>
            {selectedJO ? (
              <>Total Items: <span className="font-semibold">{getItemsForJO(selectedJO).length}</span> | Total Quantity: <span className="font-semibold">{getItemsForJO(selectedJO).reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0)}</span></>
            ) : (
              <>Total JOs: <span className="font-semibold">{josGrouped().length}</span> | Total Items: <span className="font-semibold">{data.length}</span></>
            )}
          </div>
          <div className="text-gray-400">
            💡 Click on any row to view details
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard requiredPermission="vendors.view">
        <VendorContent />
      </PageGuard>
    </div>
  );
}