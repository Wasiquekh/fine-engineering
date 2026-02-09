"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import Image from "next/image";
import AxiosProvider from "../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import StorageManager from "../../../provider/StorageManager";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

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
  moc: string;
  bin_location: string;
  is_approved: boolean | number;
}

interface AssignedJob {
  id: string;
  jo_no: number;
  item_no: number;
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
  const jo_number = Array.isArray(params.jo_number) ? params.jo_number[0] : params.jo_number;

  const [selectedOption, setSelectedOption] = useState("");
  const [machineSize, setMachineSize] = useState("");
  const [subSize, setSubSize] = useState("");
  const [worker, setWorker] = useState("");
  const [selectedSerialNo, setSelectedSerialNo] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedJobs, setAssignedJobs] = useState<AssignedJob[]>([]);

  const fetchJobs = useCallback(async () => {
    if (!jo_number) return;
    setLoading(true);
    try {
      const response = await axiosProvider.get(
        `/fineengg_erp/jobs?job_type=KANBAN&jo_number=${jo_number}`
      );
      if (response.data && Array.isArray(response.data.data)) {
        const validJobs = response.data.data.filter((job: JobData) => job.qty > 0);
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
  }, [jo_number]);

  const fetchAssignedJobs = useCallback(async () => {
    if (!jo_number) return;
    try {
      const response = await axiosProvider.get("/fineengg_erp/assign-to-worker");
      if (response.data && Array.isArray(response.data.data)) {
        const filtered = response.data.data.filter(
          (job: AssignedJob) => String(job.jo_no) === String(jo_number)
        );
        setAssignedJobs(filtered);
      }
    } catch (error) {
      console.error("Error fetching assigned jobs:", error);
    }
  }, [jo_number]);

  useEffect(() => {
    if (jo_number) {
      fetchJobs();
      fetchAssignedJobs();
    }
  }, [jo_number, fetchJobs, fetchAssignedJobs]);

  useEffect(() => {
    // Reset quantity when serial number changes
    setSelectedQuantity("");
  }, [selectedSerialNo]);

  const getSizeOptions = () => {
    if (selectedOption === "Lathe" || selectedOption === "cnc") {
      return [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
      ];
    } else if (selectedOption === "umc") {
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
      return ["Naseem","Sanjay","Choto bhai","Ali bhai","Gufran bhai","Mahtab alam","Jamaluddeen","Javed bhai","Hasib shekh"];
    }
    if (selectedOption === "Lathe" && machineSize === "medium") {
      return ["Shoakat ali","Mohd Jumriti anshari","Usman bhai"];
    }
    if (selectedOption === "Lathe" && machineSize === "large") {
      return ["Partab","Mujeeb bhai","Rangi lala","Mahtab mota bhai"];
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

    if (selectedOption === "umc") return ["Rajnish kumar"];
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

  const handleAssign = async () => {
    if (!selectedJob) return;

    const payload = {
      jo_no: Number(jo_number),
      item_no: selectedJob.item_no,
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
    };

    try {
      await axiosProvider.post("/fineengg_erp/assign-to-worker", payload);
      toast.success("Job assigned successfully");
      setSelectedSerialNo("");
      fetchJobs();
      fetchAssignedJobs();
    } catch (error) {
      console.error("Error assigning job:", error);
      toast.error("Failed to assign job");
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

          <h1 className="text-2xl font-bold mb-6">
            Machine Category - {jo_number}
          </h1>

          {/* Jobs Table */}
          <div className="mt-6 mb-8">
            {/* <h2 className="text-xl font-bold mb-4">
              Jobs for J/O No: {jo_number}
            </h2> */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    {/* <th scope="col" className="p-3 border border-tableBorder">Job No</th> */}
                    <th scope="col" className="p-3 border border-tableBorder">Item No</th>
                    <th scope="col" className="p-3 border border-tableBorder">Serial No</th>
                    <th scope="col" className="p-3 border border-tableBorder">Description</th>
                    <th scope="col" className="p-3 border border-tableBorder">Qty</th>
                    <th scope="col" className="p-3 border border-tableBorder">MOC</th>
                    <th scope="col" className="p-3 border border-tableBorder">Bin Location</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 border border-tableBorder">
                        Loading...
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 border border-tableBorder">
                        No jobs found for this J/O number.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                        {/* <td className="px-2 py-2 border border-tableBorder">{job.job_no}</td> */}
                        <td className="px-2 py-2 border border-tableBorder">{job.item_no}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.serial_no || "N/A"}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.item_description}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.qty}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.moc}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.bin_location}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ GRID LAYOUT FIX */}
          <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-6 gap-4 w-full max-w-full items-end">
            {/* Serial No */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial No
              </label>
              <select
                value={selectedSerialNo}
                onChange={(e) => setSelectedSerialNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                disabled={serialNoOptions.length === 0}
              >
                <option value="">Select</option>
                {serialNoOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Machine Category */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Category
              </label>
              <select
                value={selectedOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOption(val);

                  if (val === "umc") setMachineSize("FVMC01");
                  else if (val === "Milling") setMachineSize("FML01");
                  else if (val === "Drilling") setMachineSize("FDL01");
                  else setMachineSize("");

                  setSubSize("");
                  setWorker("");
                }}
                className="w-full px-4 py-2 border rounded-md"
              >
                <option value="">Select</option>
                <option value="Lathe">Lathe</option>
                <option value="cnc">CNC</option>
                <option value="umc">UMC</option>
                <option value="Milling">Milling</option>
                <option value="Drilling">Drilling</option>
              </select>
            </div>

            {/* Machine Size */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Machine Size
              </label>
              <select
                value={machineSize}
                onChange={(e) => {
                  setMachineSize(e.target.value);
                  setSubSize("");
                  setWorker("");
                }}
                className="w-full px-4 py-2 border rounded-md"
                disabled={!selectedOption}
              >
                <option value="">Select</option>
                {getSizeOptions().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Machine Type */}
            {(machineSize === "small" || machineSize === "medium" || machineSize === "large") && (
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {machineSize} Machine Type
                </label>
                <select
                  value={subSize}
                  onChange={(e) => setSubSize(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Select</option>
                  {getSubSizeOptions().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Worker */}
            {workerOptions.length > 0 && (
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worker
                </label>
                <select
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="">Select</option>
                  {workerOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity and Assign Button */}
            <div className="col-span-1">
              {selectedJob && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
              )}
              <div className="flex gap-2">
                {selectedJob && (
                  <select
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                    disabled={!selectedSerialNo || quantityOptions.length === 0}
                  >
                    <option value="">Select</option>
                    {quantityOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
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

          {/* Assigned Jobs Table */}
          <div className="mt-12 mb-8">
            <h2 className="text-xl font-bold mb-4">
              Assigned Jobs History
            </h2>
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="p-3 border border-tableBorder">Serial No</th>
                    <th scope="col" className="p-3 border border-tableBorder">Item No</th>
                    <th scope="col" className="p-3 border border-tableBorder">Machine Category</th>
                    <th scope="col" className="p-3 border border-tableBorder">Machine Size</th>
                    <th scope="col" className="p-3 border border-tableBorder">Machine Code</th>
                    <th scope="col" className="p-3 border border-tableBorder">Worker</th>
                    <th scope="col" className="p-3 border border-tableBorder">Quantity</th>
                    <th scope="col" className="p-3 border border-tableBorder">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 border border-tableBorder">
                        No assigned jobs found.
                      </td>
                    </tr>
                  ) : (
                    assignedJobs.map((job) => (
                      <tr key={job.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                        <td className="px-2 py-2 border border-tableBorder">{job.serial_no || "N/A"}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.item_no}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.machine_category}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.machine_size}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.machine_code}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.worker_name}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.quantity_no}</td>
                        <td className="px-2 py-2 border border-tableBorder">{job.assigning_date}</td>
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
