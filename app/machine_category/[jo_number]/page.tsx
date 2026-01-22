"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import Image from "next/image";

export default function JoNumberPage() {
  const params = useParams();
  const router = useRouter();
  const job_no = params.job_no;
  const [selectedOption, setSelectedOption] = useState("");

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
          
          <h1 className="text-2xl font-bold mb-6">Machine Category {job_no}</h1>

          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Option
            </label>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select</option>
              <option value="Lathe">Lathe</option>
              <option value="cnc">CNC</option>
              <option value="umc">UMC</option>
              <option value="Milling">Milling</option>
              <option value="Drilling">Drilling</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
