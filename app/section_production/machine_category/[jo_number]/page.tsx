"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import LeftSideBar from "../../../component/LeftSideBar";
import DesktopHeader from "../../../component/DesktopHeader";
import Image from "next/image";
import AxiosProvider from "../../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import StorageManager from "../../../../provider/StorageManager";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

// Permission helper function
const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

interface JobData {
  id: string;
  job_no: number;
  jo_number: string;
  job_type: string;
  job_category: string;
  item_description: string;
  item_no: number;
  serial_no: string;
  qty: number;
  qty_history?: number;
  moc: string;
  bin_location: string;
  is_approved: boolean | number;
  is_rejected?: boolean | number;
  rejected?: boolean | number;
  status?: string;
  assign_to?: string;
}

interface AssignedJob {
  id: string;
  jo_no: string | number;
  item_no: number;
  item_description?: string;
  machine_category: string;
  machine_size: string;
  machine_code: string;
  worker_name: string;
  quantity_no: number;
  assigning_date: string;
  serial_no: string;
}

export default function JoNumberPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw_jo_number = Array.isArray(params.jo_number) ? params.jo_number[0] : params.jo_number;
  const jo_number = raw_jo_number ? decodeURIComponent(raw_jo_number) : "";
  const clientName = searchParams.get("client") || "";
  const assignTo = searchParams.get("assign_to") || "";

  const [selectedOption, setSelectedOption] = useState("");
  const [machineSize, setMachineSize] = useState("");
  const [subSize, setSubSize] = useState("");
  const [worker, setWorker] = useState("");
  const [selectedSerialNo, setSelectedSerialNo] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedJobs, setAssignedJobs] = useState<AssignedJob[]>([]);

  const permissions = storage.getUserPermissions();
  
  const getProductionPrefix = () => {
    if (assignTo === "Usmaan") return "production1";
    if (assignTo === "Riyaaz") return "production2";
    if (assignTo === "Ramzaan") return "production3";
    return null;
  };

  // Edit permission must match exact production + client for this route context
  const getCanEdit = () => {
    if (!permissions) return false;

    const prodPrefix = getProductionPrefix();
    if (!prodPrefix) return false;

    const normalizedClient = String(clientName).toLowerCase();
    const clientKey = normalizedClient.includes("equip")
      ? "eqp"
      : normalizedClient.includes("bio")
      ? "bio"
      : null;

    if (!clientKey) return false;

    return hasPermission(permissions, `${prodPrefix}.${clientKey}.job.edit`);
  };
  
  const canEdit = getCanEdit();
  
  console.log("JOB Page - Client:", clientName, "Can Edit:", canEdit);
  console.log("User Permissions:", permissions?.map(p => p.name));

  const fetchJobs = useCallback(async () => {
    if (!jo_number) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        job_type: "JOB_SERVICE",
        // URLSearchParams handles encoding; manual encoding causes % to be encoded again.
        jo_number,
      });
      if (clientName) params.append("client_name", clientName);
      if (assignTo) params.append("assign_to", assignTo);

      const response = await axiosProvider.get(`/fineengg_erp/system/jobs?${params.toString()}`);
      if (response.data && Array.isArray(response.data.data)) {
        const validJobs = response.data.data
          .filter((job: JobData) => job.qty > 0)
          // Tab filter: each Usmaan / Ramzaan / Riyaaz list must only show that assignee (fallback if API ignores param)
          .filter((job: JobData) => !assignTo || job.assign_to === assignTo);
        setJobs(validJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [jo_number, clientName, assignTo]);

  const fetchAssignedJobs = useCallback(async () => {
    if (!jo_number) return;
    try {
      const params = new URLSearchParams();
      if (clientName) params.append("client_name", clientName);
      
      const response = await axiosProvider.get(`/fineengg_erp/system/assign-to-worker?${params.toString()}`);
      if (response.data && Array.isArray(response.data.data)) {
        const filtered = response.data.data.filter(
          (job: AssignedJob) => String(job.jo_no) === String(jo_number)
        );
        setAssignedJobs(filtered);
      }
    } catch (error) {
      console.error("Error fetching assigned jobs:", error);
    }
  }, [jo_number, clientName]);

  useEffect(() => {
    if (jo_number) {
      fetchJobs();
      fetchAssignedJobs();
    }
  }, [jo_number, fetchJobs, fetchAssignedJobs]);

  useEffect(() => {
    setSelectedQuantity("");
  }, [selectedSerialNo]);

  const getSizeOptions = () => {
    if (selectedOption === "Lathe" || selectedOption === "cnc") {
      return [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
      ];
    } else if (selectedOption === "vmc") {
      return [{ value: "FVMC01", label: "FVMC01" }];
    } else if (selectedOption === "Milling") {
      return [{ value: "FML01", label: "FML01" }];
    } else if (selectedOption === "Drilling") {
      return [{ value: "FDL01", label: "FDL01" }];
    }
    return [];
  };

  const getSubSizeOptions = () => {
    if (machineSize === "small") {
      return Array.from({ length: 9 }, (_, i) => ({
        value: `SFL${i + 1}`,
        label: `SFL${i + 1}`,
      }));
    } else if (machineSize === "medium") {
      return Array.from({ length: 3 }, (_, i) => ({
        value: `MFL${i + 1}`,
        label: `MFL${i + 1}`,
      }));
    } else if (machineSize === "large") {
      return Array.from({ length: 4 }, (_, i) => ({
        value: `LFL${i + 1}`,
        label: `LFL${i + 1}`,
      }));
    }
    return [];
  };

  const getWorkerOptions = () => {
    if (selectedOption === "Lathe" && machineSize === "small") {
      return ["Naseem","Sanjay","Choto bhai","Ali bhai","Gufran bhai","Mahtab alam","Jamaluddeen","Javed bhai","Hasib shaikh"];
    }
    if (selectedOption === "Lathe" && machineSize === "medium") {
      return ["Shoakat ali","Mohd Jumerati ansari","Usman bhai"];
    }
    if (selectedOption === "Lathe" && machineSize === "large") {
      return ["Pratab","Mujeeb bhai","Rangi laal","Mahtab mota bhai"];
    }
    if (selectedOption === "cnc" && machineSize === "small") {
      return ["Ramjan ali","Mustafa","Akramuddeen","Sufyan"];
    }
    if (selectedOption === "cnc" && machineSize === "medium") {
      return ["Ziyaul mustafa","Mufeed alam"];
    }
    if (selectedOption === "cnc" && machineSize === "large") {
      return ["Aqif khan"];
    }
    if (selectedOption === "vmc") return ["Rajnish kumar"];
    if (selectedOption === "Milling") return ["Ramakanat"];
    if (selectedOption === "Drilling") return ["Rahman"];
    return [];
  };

  const workerOptions = getWorkerOptions().map((name) => ({
    value: name,
    label: name,
  }));

  const serialNoOptions = Array.from(
    new Set(jobs.map((job) => job.serial_no).filter(Boolean))
  ).map((serialNo) => ({
    value: serialNo,
    label: serialNo,
  }));

  const selectedJob = useMemo(() => {
    if (!selectedSerialNo) return null;
    return jobs.find((job) => job.serial_no === selectedSerialNo);
  }, [jobs, selectedSerialNo]);

  const quantityOptions = useMemo(() => {
    if (!selectedJob) return [];
    return Array.from({ length: selectedJob.qty }, (_, i) => {
      const val = i + 1;
      return {
        value: String(val),
        label: String(val),
      };
    });
  }, [selectedJob]);

  const itemDescriptionBySerialNo = useMemo(() => {
    const descriptionMap = new Map<string, string>();
    jobs.forEach((job) => {
      if (job.serial_no) {
        descriptionMap.set(String(job.serial_no), job.item_description || "-");
      }
    });
    return descriptionMap;
  }, [jobs]);

  const handleAssign = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to assign jobs");
      return;
    }
    if (!selectedJob) return;

    const payload = {
      jo_no: jo_number,
      item_no: selectedJob.item_no,
      item_description: selectedJob.item_description,
      machine_category: selectedOption,
      machine_size: machineSize,
      machine_code: subSize || machineSize,
      worker_name: worker,
      quantity_no: Number(selectedQuantity),
      assigning_date: new Date().toISOString().split("T")[0],
      created_by: storage.getUserId(),
      updated_by: storage.getUserId(),
      serial_no: selectedJob.serial_no,
      job_id: selectedJob.id,
      client_name: clientName,
    };

    try {
      await axiosProvider.post("/fineengg_erp/system/assign-to-worker", payload);
      toast.success("Job assigned successfully");
      setSelectedSerialNo("");
      setSelectedOption("");
      setMachineSize("");
      setSubSize("");
      setWorker("");
      setSelectedQuantity("");
      fetchJobs();
      fetchAssignedJobs();
    } catch (error) {
      console.error("Error assigning job:", error);
      toast.error("Failed to assign job");
    }
  };

  const handleReject = async (job: JobData) => {
    if (!canEdit) {
      toast.error("You don't have permission to reject jobs");
      return;
    }

    const qtyHistory = Number(job.qty_history ?? job.qty);
    const qty = Number(job.qty);
    if (qtyHistory !== qty) {
      toast.error("Few quantity already assigned");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to reject this job?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosProvider.post(`/fineengg_erp/system/jobs/${job.id}/reject`, {});
      toast.success("Job rejected successfully");
      fetchJobs();
      fetchAssignedJobs();
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error("Failed to reject job");
    }
  };

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />

      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 relative">
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

        <div className="rounded-3xl shadow-lastTransaction bg-white px-4 py-6 md:p-6 relative">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back
          </button>

          <h1 className="text-xl font-semibold mb-6">
            Machine Category - {jo_number}
            {clientName && <span className="text-sm text-gray-500 ml-2">({clientName})</span>}
            {!canEdit && <span className="text-sm text-red-500 ml-2">(View Only Mode)</span>}
          </h1>

          {/* Jobs Table - Always visible */}
          <div className="mt-6 mb-8">
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                  <tr className="border border-tableBorder">
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item No</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Serial No</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Description</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Qty</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">MOC</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Bin Location</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Status</th>
                    {canEdit && <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={canEdit ? 8 : 7} className="text-center py-4 border border-tableBorder">Loading...</td></tr>
                  ) : jobs.length === 0 ? (
                    <tr><td colSpan={canEdit ? 8 : 7} className="text-center py-4 border border-tableBorder">No jobs found for this J/O number.</td></tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.item_no}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323] font-mono">{job.serial_no || "N/A"}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.item_description}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323] font-semibold text-yellow-600">{job.qty}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.moc}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.bin_location}</td>
                        <td className="px-4 py-3 border border-tableBorder">
                          {(job.is_rejected || job.rejected) ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejected</span>
                          ) : job.is_approved ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approved</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 border border-tableBorder">
                            <button
                              type="button"
                              onClick={() => handleReject(job)}
                              disabled={!!job.is_rejected || !!job.rejected || job.status === "completed" || job.status === "QC" || job.qty === 0}
                              className={`px-3 py-1 rounded text-sm text-white ${
                                (!!job.is_rejected || !!job.rejected || job.status === "completed" || job.status === "QC" || job.qty === 0)
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              Reject
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assignment Form - Only show if canEdit is true */}
          {canEdit && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Assign to Worker</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-6 gap-4 w-full max-w-full items-end">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serial No</label>
                  <select
                    value={selectedSerialNo}
                    onChange={(e) => setSelectedSerialNo(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                    disabled={serialNoOptions.length === 0}
                  >
                    <option value="">Select</option>
                    {serialNoOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Machine Category</label>
                  <select
                    value={selectedOption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedOption(val);
                      if (val === "vmc") setMachineSize("FVMC01");
                      else if (val === "Milling") setMachineSize("FML01");
                      else if (val === "Drilling") setMachineSize("FDL01");
                      else setMachineSize("");
                      setSubSize("");
                      setWorker("");
                    }}
                    disabled={!selectedSerialNo || !selectedJob?.is_approved}
                    className="w-full px-4 py-2 border rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="Lathe">Lathe</option>
                    <option value="cnc">CNC</option>
                    <option value="vmc">VMC</option>
                    <option value="Milling">Milling</option>
                    <option value="Drilling">Drilling</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Machine Size</label>
                  <select
                    value={machineSize}
                    onChange={(e) => {
                      setMachineSize(e.target.value);
                      setSubSize("");
                      setWorker("");
                    }}
                    className="w-full px-4 py-2 border rounded-md"
                    disabled={!selectedOption || !selectedJob?.is_approved}
                  >
                    <option value="">Select</option>
                    {getSizeOptions().map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {(machineSize === "small" || machineSize === "medium" || machineSize === "large") && (
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {machineSize} Machine Type
                    </label>
                    <select
                      value={subSize}
                      onChange={(e) => setSubSize(e.target.value)}
                      disabled={!machineSize || !selectedJob?.is_approved}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      <option value="">Select</option>
                      {getSubSizeOptions().map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {workerOptions.length > 0 && (
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Worker</label>
                    <select
                      value={worker}
                      onChange={(e) => setWorker(e.target.value)}
                      disabled={!machineSize || !selectedJob?.is_approved}
                      className="w-full px-4 py-2 border rounded-md"
                    >
                      <option value="">Select</option>
                      {workerOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-1">
                  {selectedJob && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  )}
                  <div className="flex gap-2">
                    {selectedJob && (
                      <select
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(e.target.value)}
                        className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                        disabled={!selectedSerialNo || quantityOptions.length === 0 || !selectedJob?.is_approved}
                      >
                        <option value="">Select</option>
                        {quantityOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                    <button
                      className={`${selectedJob ? "w-auto" : "w-full"} px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm`}
                      disabled={!selectedSerialNo || !worker || !selectedQuantity || !selectedJob?.is_approved}
                      onClick={handleAssign}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Jobs Table - Always visible */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Assigned Jobs History</h2>
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50">
                  <tr className="border border-tableBorder">
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Serial No</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item No</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Item Description</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Machine Category</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Machine Size</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Machine Code</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Worker</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Quantity</th>
                    <th className="px-4 py-4 border border-tableBorder whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedJobs.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-4 border border-tableBorder">No assigned jobs found.</td></tr>
                  ) : (
                    assignedJobs.map((job) => (
                      <tr key={job.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                        <td className="px-4 py-3 border border-tableBorder text-[#232323] font-mono">{job.serial_no || "N/A"}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.item_no}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.item_description}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.machine_category}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.machine_size}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.machine_code}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323] font-medium">{job.worker_name}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323] font-semibold text-green-600">{job.quantity_no}</td>
                        <td className="px-4 py-3 border border-tableBorder text-[#232323]">{job.assigning_date}</td>
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
  );
}