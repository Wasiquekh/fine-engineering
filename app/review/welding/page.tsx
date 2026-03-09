"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const axiosProvider = new AxiosProvider();

export default function ReviewWeldingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const client = searchParams.get("client");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosProvider.get(`/fineengg_erp/assign-to-worker`, {
        params: {
          status: "in-review",
          review_for: "welding",
          ...(client ? { client_name: client } : {}),
        },
      }as any);
      setData(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to load review/welding");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

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

  const postAction = async (id: string, endpoint: string, successMsg: string) => {
    try {
      await axiosProvider.post(`/fineengg_erp/assign-to-worker/${id}/${endpoint}`, null);
      toast.success(successMsg);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Action failed");
    }
  };

  const handleQc = async (id: string) => {
    if (!(await actionConfirm("QC?", "Mark Ready for QC?", "Yes, QC"))) return;
    postAction(id, "ready-for-qc", "Moved to Ready for QC");
  };

  const handleMachine = async (id: string) => {
    if (!(await actionConfirm("Machine?", "Send back to In-Progress?", "Yes, Machine"))) return;
    postAction(id, "reject", "Moved to In-Progress");
  };

  const handleWelding = async (id: string) => {
    if (!(await actionConfirm("Welding?", "Send to QC Welding queue?", "Yes, Welding"))) return;
    postAction(id, "welding", "Moved to QC Welding");
  };

  const handleVendor = async (id: string) => {
    if (!(await actionConfirm("Vendor?", "Send to Vendor Outsource queue?", "Yes, Vendor"))) return;
    postAction(id, "vendor", "Moved to Vendor Outsource");
  };

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
        <div className="absolute bottom-0 right-0 pointer-events-none">
          <Image src="/images/sideDesign.svg" alt="side design" width={100} height={100} className="w-full h-full" />
        </div>

        <DesktopHeader />

        <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h1 className="text-xl font-semibold text-firstBlack">
                Review • Welding
                {client && ` • ${client}`}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Status: <span className="font-semibold">in-review</span> | review_for:{" "}
                <span className="font-semibold">welding</span>
              </p>
            </div>
            {loading ? <span className="text-sm text-gray-500">Loading...</span> : null}
          </div>

          <div className="relative overflow-x-auto sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-[#999999]">
                <tr className="border border-tableBorder">
                  <th className="p-3 border border-tableBorder">Serial No</th>
                  <th className="px-2 py-0 border border-tableBorder">Item No</th>
                  <th className="px-2 py-0 border border-tableBorder">Quantity</th>
                  <th className="px-2 py-0 border border-tableBorder">Assigning Date</th>
                  <th className="px-2 py-0 border border-tableBorder">Action</th>
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center border border-tableBorder">
                      <p className="text-[#666666] text-base">{loading ? "Loading..." : "No data found"}</p>
                    </td>
                  </tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base">{item.serial_no || "-"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base">{item.item_no ?? "-"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base">{item.quantity_no ?? "-"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base">{item.assigning_date || "-"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => handleQc(item.id)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                            QC
                          </button>
                          <button onClick={() => handleMachine(item.id)} className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
                            Machine
                          </button>
                          <button onClick={() => handleWelding(item.id)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            Welding
                          </button>
                          <button onClick={() => handleVendor(item.id)} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
                            Vendor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="text-xs text-gray-500 mt-3 px-2">
              Note: Review/Welding shows only items coming from QC Welding Incoming.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}