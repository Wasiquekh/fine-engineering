"use client";

import Image from "next/image";
import { useEffect, useState, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import AxiosProvider from "../../../../provider/AxiosProvider";
import StorageManager from "../../../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import PageGuard from "../../../component/PageGuard";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface VendorOutgoingAssignment {
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
  job_type?: string | null;
  tso_no?: string | null;
  job_category?: string | null;
  job: {
    id: string;
    job_no: string;
    jo_number: string;
    job_category: string;
    client_name: string;
    item_description: string;
    item_no: string;
    product_desc: string | null;
    moc: string;
    qty: number;
    job_type?: string;
    tso_no?: string | null;
  } | null;
}

export default function VendorOutgoingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<VendorOutgoingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string | null>(null);
  const [selectedJO, setSelectedJO] = useState<string | null>(null);
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const client = searchParams.get("client") || "";

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories", {
        params: { ...(client ? { client_name: client } : {}) },
      } as any);
      const cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      const uniqueMap = new Map<string, { value: string; label: string }>();
      cats.forEach((cat: any) => {
        const jobCategory = String(cat?.job_category || "").trim();
        if (jobCategory && !uniqueMap.has(jobCategory)) {
          uniqueMap.set(jobCategory, { value: jobCategory, label: jobCategory });
        }
      });
      setCategories(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchVendorOutgoing = async () => {
    setLoading(true);
    try {
      // Fetch all job types: JOB_SERVICE, TSO_SERVICE, KANBAN
      const jobTypes = ["JOB_SERVICE", "TSO_SERVICE", "KANBAN"];
      let allData: VendorOutgoingAssignment[] = [];

      for (const jobType of jobTypes) {
        const params: any = { job_type: jobType };
        if (client) params.client_name = client;
        
        const response = await axiosProvider.get("/fineengg_erp/system/assignments/in-vendor", { params });
        const fetchedData = response?.data?.data || [];
        
        const dataWithType = fetchedData.map((item: any) => ({
          ...item,
          job_type: jobType,
          tso_no: item.tso_no || item.job?.tso_no,
          job_category: item.job_category || item.job?.job_category,
        }));
        
        allData = [...allData, ...dataWithType];
      }
      
      setData(allData);
    } catch (error) {
      console.error("Error fetching vendor outgoing:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [client]);

  useEffect(() => {
    setSelectedIdentifier(null);
    setSelectedJO(null);
    fetchVendorOutgoing();
  }, [client]);

  // Filter by category
  const filteredData = () => {
    if (jobServiceCategoryFilter === "ALL") return data;
    return data.filter((item) => {
      const category = item.job_category || item.job?.job_category || "";
      return category === jobServiceCategoryFilter;
    });
  };

  // Get unique identifiers (Job No for JOB_SERVICE, TSO No for TSO_SERVICE, JO No for KANBAN)
  const getIdentifiers = () => {
    const ids = new Map<string, { type: string; category: string; vendorName: string; assigningDate: string }>();
    
    filteredData().forEach((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let identifier: string | null = null;
      
      if (jobType === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        identifier = item.jo_no;
      } else {
        identifier = item.job?.job_no;
      }
      
      if (identifier && !ids.has(identifier)) {
        ids.set(identifier, {
          type: jobType || "JOB_SERVICE",
          category: item.job_category || item.job?.job_category || "N/A",
          vendorName: item.vendor_name || "N/A",
          assigningDate: item.assigning_date || "N/A",
        });
      }
    });
    
    return Array.from(ids.entries()).map(([id, info]) => ({
      identifier: id,
      type: info.type,
      category: info.category,
      vendorName: info.vendorName,
      assigningDate: info.assigningDate,
    }));
  };

  // Get items for a specific identifier
  const getItemsForIdentifier = (identifier: string) => {
    return filteredData().filter((item) => {
      const jobType = item.job_type || item.job?.job_type;
      let itemIdentifier: string | null = null;
      
      if (jobType === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (jobType === "KANBAN") {
        itemIdentifier = item.jo_no;
      } else {
        itemIdentifier = item.job?.job_no;
      }
      
      return itemIdentifier === identifier;
    });
  };

  // Group by JO for selected identifier
  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const groups: Record<string, VendorOutgoingAssignment[]> = {};
  
    items.forEach((item) => {
      let jo = item.jo_no;
      if (!jo && item.serial_no) {
        const match = item.serial_no.match(/^([^-]+-[^-]+-[^/]+\/[^/]+\/[^/]+)/);
        if (match) jo = match[1];
        else jo = item.serial_no.substring(0, 20);
      }
      if (!jo) jo = "Unknown";
      if (!groups[jo]) groups[jo] = [];
      groups[jo].push(item);
    });
    return groups;
  };

  // Get summary for identifier
  const getIdentifierSummary = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
    const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;
    return { totalQty, uniqueJoCount };
  };

  const getJobTypeBadge = (jobType: string | null | undefined) => {
    switch(jobType) {
      case "TSO_SERVICE":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TSO</span>;
      case "KANBAN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">KANBAN</span>;
      case "JOB_SERVICE":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">JOB</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">-</span>;
    }
  };

  const countsByType = {
    JOB_SERVICE: data.filter(d => (d.job_type || d.job?.job_type) === "JOB_SERVICE").length,
    TSO_SERVICE: data.filter(d => (d.job_type || d.job?.job_type) === "TSO_SERVICE").length,
    KANBAN: data.filter(d => (d.job_type || d.job?.job_type) === "KANBAN").length,
    TOTAL: data.length
  };

  const VendorOutgoingContent = () => (
    <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
      <div className="absolute bottom-0 right-0">
        <Image src="/images/sideDesign.svg" alt="side design" width={100} height={100} className="w-full h-full" />
      </div>
      <DesktopHeader />

      <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
        <div className="mb-4 px-2">
          <h1 className="text-xl font-semibold text-firstBlack">
            Vendor Outgoing • In-Vendor Status {client && ` • ${client}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Items sent to vendors for outsourcing</p>
          
          <div className="flex gap-3 mt-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">JOB: {countsByType.JOB_SERVICE}</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">TSO: {countsByType.TSO_SERVICE}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">KANBAN: {countsByType.KANBAN}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">TOTAL: {countsByType.TOTAL}</span>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
            <button
              onClick={() => setJobServiceCategoryFilter("ALL")}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                jobServiceCategoryFilter === "ALL" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setJobServiceCategoryFilter(cat.value)}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  jobServiceCategoryFilter === cat.value ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative overflow-x-auto sm:rounded-lg">
          {selectedIdentifier ? (
            // JO Level View
            <>
              <button onClick={() => { setSelectedIdentifier(null); setSelectedJO(null); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 mb-4">
                <FaArrowLeft /> Back
              </button>

              {selectedJO ? (
                // Item Level View
                <>
                  <button onClick={() => setSelectedJO(null)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded mb-4 hover:bg-gray-200">
                    <FaArrowLeft /> Back to JOs
                  </button>
                  <h2 className="text-xl font-bold mb-4">JO: {selectedJO}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-[#999999]">
                        <tr className="border bg-gray-50">
                          <th className="p-3 border">Serial No</th>
                          <th className="p-3 border">Item No</th>
                          <th className="p-3 border">Item Description</th>
                          <th className="p-3 border">MOC</th>
                          <th className="p-3 border">Vendor Name</th>
                          <th className="p-3 border">Machine</th>
                          <th className="p-3 border text-center">Quantity</th>
                          <th className="p-3 border text-center">Assigning Date</th>
                         </tr>
                      </thead>
                      <tbody>
                        {getJoGroupsForIdentifier(selectedIdentifier)[selectedJO]?.map((item) => (
                          <tr key={item.id} className="border hover:bg-primary-50">
                            <td className="p-3 border font-mono text-blue-600">{item.serial_no || "N/A"}</td>
                            <td className="p-3 border">{item.item_no || "N/A"}</td>
                            <td className="p-3 border">{item.job?.item_description || "N/A"}</td>
                            <td className="p-3 border">{item.job?.moc || "N/A"}</td>
                            <td className="p-3 border">{item.vendor_name || "N/A"}</td>
                            <td className="p-3 border">{item.machine_code} ({item.machine_category})</td>
                            <td className="p-3 border text-center font-semibold text-green-600">{item.quantity_no || 0}</td>
                            <td className="p-3 border text-center">{item.assigning_date ? new Date(item.assigning_date).toLocaleDateString() : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // JO Level Table
                <>
                  <h2 className="text-xl font-bold mb-4">{selectedIdentifier}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-[#999999]">
                        <tr className="border bg-gray-50">
                          <th className="p-3 border">JO Number</th>
                          <th className="p-3 border">Vendor Name</th>
                          <th className="p-3 border text-center">Items</th>
                          <th className="p-3 border text-center">Total Quantity</th>
                          <th className="p-3 border">Item Nos</th>
                          <th className="p-3 border">Item Description</th>
                          <th className="p-3 border">MOC</th>
                          <th className="p-3 border text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(getJoGroupsForIdentifier(selectedIdentifier)).map(([jo, items]) => {
                          const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity_no) || 0), 0);
                          const itemNos = [...new Set(items.map(i => i.item_no).filter(Boolean))];
                          const descriptions = [...new Set(items.map(i => i.job?.item_description).filter(Boolean))];
                          const mocList = [...new Set(items.map(i => i.job?.moc).filter(Boolean))];
                          const vendorName = items[0]?.vendor_name || "N/A";
                          
                          return (
                            <tr key={jo} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedJO(jo)}>
                              <td className="p-3 border text-blue-600 font-medium">{jo}</td>
                              <td className="p-3 border">{vendorName}</td>
                              <td className="p-3 border text-center"><span className="px-2 py-1 bg-blue-100 rounded-full text-xs">{items.length}</span></td>
                              <td className="p-3 border text-center font-semibold text-green-600">{totalQty}</td>
                              <td className="p-3 border"><div className="text-sm">{itemNos.slice(0, 3).join(", ")}{itemNos.length > 3 && ` +${itemNos.length - 3}`}</div></td>
                              <td className="p-3 border"><div className="text-sm max-w-[200px]">{descriptions.slice(0, 2).join(", ")}{descriptions.length > 2 && ` +${descriptions.length - 2}`}</div></td>
                              <td className="p-3 border"><div className="text-sm">{mocList.slice(0, 2).join(", ")}{mocList.length > 2 && ` +${mocList.length - 2}`}</div></td>
                              <td className="p-3 border text-center"><button className="px-3 py-1 bg-primary-600 text-white rounded text-sm">View Items</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            // Identifier Level View (Jobs/TSOs/Kanbans)
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]">
                    <tr className="border bg-gray-50">
                      <th className="p-3 border">Identifier</th>
                      <th className="p-3 border">Type</th>
                      <th className="p-3 border">Category</th>
                      <th className="p-3 border">Vendor Name</th>
                      <th className="p-3 border text-center">Total JOs</th>
                      <th className="p-3 border text-center">Total Quantity</th>
                      <th className="p-3 border text-center">Assigning Date</th>
                      <th className="p-3 border text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center p-4">Loading...</td></tr>
                    ) : getIdentifiers().length === 0 ? (
                      <tr><td colSpan={8} className="text-center p-4">No vendor outgoing assignments found</td></tr>
                    ) : (
                      getIdentifiers().map(({ identifier, type, category, vendorName, assigningDate }) => {
                        const { totalQty, uniqueJoCount } = getIdentifierSummary(identifier);
                        return (
                          <tr key={identifier} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedIdentifier(identifier)}>
                            <td className="p-3 border text-blue-600 font-medium">{identifier}</td>
                            <td className="p-3 border">{getJobTypeBadge(type)}</td>
                            <td className="p-3 border">{category}</td>
                            <td className="p-3 border">{vendorName}</td>
                            <td className="p-3 border text-center"><span className="px-2 py-1 bg-blue-100 rounded-full text-xs">{uniqueJoCount}</span></td>
                            <td className="p-3 border text-center font-semibold text-green-600">{totalQty}</td>
                            <td className="p-3 border text-center">{assigningDate}</td>
                            <td className="p-3 border text-center"><button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">View Details</button></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                Total Identifiers: <span className="font-semibold">{getIdentifiers().length}</span> | 
                Total Items: <span className="font-semibold">{data.length}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard requiredPermission="vendors.view"><VendorOutgoingContent /></PageGuard>
    </div>
  );
}