"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import Image from "next/image";

export default function JoNumberPage() {
  const params = useParams();
  const router = useRouter();
  const job_no = Array.isArray(params.job_no) ? params.job_no[0] : params.job_no;

  const [selectedOption, setSelectedOption] = useState("");
  const [machineSize, setMachineSize] = useState("");
  const [subSize, setSubSize] = useState("");
  const [worker, setWorker] = useState("");

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
            Machine Category - {job_no}
          </h1>

          {/* ✅ GRID LAYOUT FIX */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-full">

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

          </div>
        </div>
      </div>
    </div>
  );
}
