"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import PageGuard from "../../component/PageGuard";

const axiosProvider = new AxiosProvider();

interface WeldingAssignment {
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

export default function WeldingPage() {
  const [data, setData] = useState<WeldingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentifier, setSelectedIdentifier] = useState<string | null>(null);
  const [selectedJO, setSelectedJO] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const client = searchParams.get("client") || "";

  const fetchWeldingAssignments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (client) params.client_name = client;
      
      const response = await axiosProvider.get("/fineengg_erp/system/assignments/in-welding", {
        params,
        headers: undefined
      });
      const fetchedData = response?.data?.data || [];
      
      // Identify job_type from job object
      const mappedData = fetchedData.map((item: any) => {
        let jobType = "JOB_SERVICE";
        
        if (item.job) {
          if (item.job.job_type === "TSO_SERVICE" || item.job.tso_no) {
            jobType = "TSO_SERVICE";
          } else if (item.job.job_type === "KANBAN" || (item.job.job_no === null && item.job.jo_number)) {
            jobType = "KANBAN";
          }
        }
        
        if (item.tso_no) jobType = "TSO_SERVICE";
        
        return {
          ...item,
          job_type: jobType,
          tso_no: item.tso_no || item.job?.tso_no,
        };
      });
      
      setData(mappedData);
    } catch (error) {
      console.error("Error fetching welding assignments:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeldingAssignments();
  }, [client]);

  // Get unique identifiers
  const getIdentifiers = () => {
    const ids = new Map<string, { type: string; clientName: string; jobNo: string }>();
    
    data.forEach((item) => {
      const jobType = item.job_type;
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
          clientName: item.job?.client_name || "N/A",
          jobNo: item.job?.job_no || "N/A",
        });
      }
    });
    
    return Array.from(ids.entries()).map(([id, info]) => ({
      identifier: id,
      type: info.type,
      clientName: info.clientName,
      jobNo: info.jobNo,
    }));
  };

  // Get items for identifier
  const getItemsForIdentifier = (identifier: string) => {
    return data.filter((item) => {
      const jobType = item.job_type;
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

  // Group by JO
  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const groups: Record<string, WeldingAssignment[]> = {};
  
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

  const getIdentifierSummary = (identifier: string) => {
    const items = getItemsForIdentifier(identifier);
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
    const uniqueJoCount = new Set(items.map((x) => x.jo_no || "Unknown")).size;
    return { totalQty, uniqueJoCount };
  };

  const getJobTypeBadge = (jobType: string | null | undefined) => {
    switch(jobType) {
      case "TSO_SERVICE": return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">TSO</span>;
      case "KANBAN": return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">KANBAN</span>;
      default: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">JOB</span>;
    }
  };

  const countsByType = {
    JOB_SERVICE: data.filter(d => d.job_type === "JOB_SERVICE").length,
    TSO_SERVICE: data.filter(d => d.job_type === "TSO_SERVICE").length,
    KANBAN: data.filter(d => d.job_type === "KANBAN").length,
    TOTAL: data.length
  };

  const WeldingContent = () => (
    <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
      <div className="absolute bottom-0 right-0"><Image src="/images/sideDesign.svg" alt="side design" width={100} height={100} className="w-full h-full" /></div>
      <DesktopHeader />
      <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
        <div className="mb-4 px-2">
          <h1 className="text-xl font-semibold text-firstBlack">Welding • In-Welding Status {client && ` • ${client}`}</h1>
          <p className="text-sm text-gray-500 mt-1">Items currently in welding process</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">JOB: {countsByType.JOB_SERVICE}</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">TSO: {countsByType.TSO_SERVICE}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">KANBAN: {countsByType.KANBAN}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">TOTAL: {countsByType.TOTAL}</span>
          </div>
        </div>

        <div className="relative overflow-x-auto sm:rounded-lg">
          {selectedIdentifier ? (
            <>
              <button onClick={() => { setSelectedIdentifier(null); setSelectedJO(null); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 mb-4"><FaArrowLeft /> Back</button>
              {selectedJO ? (
                <>
                  <button onClick={() => setSelectedJO(null)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded mb-4"><FaArrowLeft /> Back to JOs</button>
                  <h2 className="text-xl font-bold mb-4">JO: {selectedJO}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-[#999999]"><tr className="border bg-gray-50">
                        <th className="p-3 border">Serial No</th><th className="p-3 border">Item No</th><th className="p-3 border">Item Description</th>
                        <th className="p-3 border">MOC</th><th className="p-3 border">Machine</th><th className="p-3 border text-center">Quantity</th>
                        <th className="p-3 border text-center">QC Date</th><th className="p-3 border text-center">Gatepass No</th>
                      </tr></thead>
                      <tbody>
                        {getJoGroupsForIdentifier(selectedIdentifier)[selectedJO]?.map((item) => (
                          <tr key={item.id} className="border hover:bg-primary-50">
                            <td className="p-3 border font-mono text-blue-600">{item.serial_no || "N/A"}</td>
                            <td className="p-3 border">{item.item_no || "N/A"}</td>
                            <td className="p-3 border">{item.job?.item_description || "N/A"}</td>
                            <td className="p-3 border">{item.job?.moc || "N/A"}</td>
                            <td className="p-3 border">{item.machine_code} ({item.machine_category})</td>
                            <td className="p-3 border text-center font-semibold text-green-600">{item.quantity_no || 0}</td>
                            <td className="p-3 border text-center">{item.qc_date ? new Date(item.qc_date).toLocaleDateString() : "N/A"}</td>
                            <td className="p-3 border text-center">{item.gatepass_no || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-4">{selectedIdentifier}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-[#999999]"><tr className="border bg-gray-50">
                        <th className="p-3 border">JO Number</th><th className="p-3 border">Vendor Name</th><th className="p-3 border text-center">Items</th>
                        <th className="p-3 border text-center">Total Quantity</th><th className="p-3 border">Item Nos</th>
                        <th className="p-3 border">Item Description</th><th className="p-3 border">MOC</th><th className="p-3 border text-center">Action</th>
                      </tr></thead>
                      <tbody>
                        {Object.entries(getJoGroupsForIdentifier(selectedIdentifier)).map(([jo, items]) => {
                          const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity_no) || 0), 0);
                          const itemNos = [...new Set(items.map(i => i.item_no).filter(Boolean))];
                          const descriptions = [...new Set(items.map(i => i.job?.item_description).filter(Boolean))];
                          const mocList = [...new Set(items.map(i => i.job?.moc).filter(Boolean))];
                          return (
                            <tr key={jo} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedJO(jo)}>
                              <td className="p-3 border text-blue-600 font-medium">{jo}</td>
                              <td className="p-3 border">{items[0]?.vendor_name || "N/A"}</td>
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-[#999999]"><tr className="border bg-gray-50">
                    <th className="p-3 border">Identifier</th><th className="p-3 border">Type</th><th className="p-3 border">Client Name</th>
                    <th className="p-3 border text-center">Total JOs</th><th className="p-3 border text-center">Total Quantity</th><th className="p-3 border text-center">Action</th>
                  </tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr>
                    ) : getIdentifiers().length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-4">No welding assignments found</td></tr>
                    ) : (
                      getIdentifiers().map(({ identifier, type, clientName }) => {
                        const { totalQty, uniqueJoCount } = getIdentifierSummary(identifier);
                        return (
                          <tr key={identifier} className="border cursor-pointer hover:bg-primary-50" onClick={() => setSelectedIdentifier(identifier)}>
                            <td className="p-3 border text-blue-600 font-medium">{identifier}</td>
                            <td className="p-3 border">{getJobTypeBadge(type)}</td>
                            <td className="p-3 border">{clientName}</td>
                            <td className="p-3 border text-center"><span className="px-2 py-1 bg-blue-100 rounded-full text-xs">{uniqueJoCount}</span></td>
                            <td className="p-3 border text-center font-semibold text-green-600">{totalQty}</td>
                            <td className="p-3 border text-center"><button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">View Details</button></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-500 mt-4">Total Identifiers: <span className="font-semibold">{getIdentifiers().length}</span> | Total Items: <span className="font-semibold">{data.length}</span></div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard ><WeldingContent /></PageGuard>
    </div>
  );
}