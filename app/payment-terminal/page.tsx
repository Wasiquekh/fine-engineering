"use client";
import Image from "next/image";
import Tabs from "../component/Tabs";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { PiArrowCircleUp } from "react-icons/pi";
import LeftSideBar from "../component/LeftSideBar";
import AxiosProvider from "../../provider/AxiosProvider";
import { useEffect, useState } from "react";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { HiChevronDoubleRight } from "react-icons/hi";
import DesktopHeader from "../component/DesktopHeader";
import { Tooltip } from "react-tooltip";
import { FaEllipsisVertical } from "react-icons/fa6";
import { RxAvatar } from "react-icons/rx";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { SiHomeassistantcommunitystore } from "react-icons/si";
import { MdOutlineCall } from "react-icons/md";
import { LiaArrowCircleDownSolid } from "react-icons/lia";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

export default function Home() {
  const isChecking = useAuthRedirect();

  return (
    <div className=" flex justify-end  min-h-screen">
      {/* Left sidebar */}
      <LeftSideBar />
      {/* Main content right section */}
      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
        <div className="absolute bottom-0 right-0">
          <Image
            src="/images/sideDesign.svg"
            alt="side desgin"
            width={100}
            height={100}
            className=" w-full h-full"
          />
        </div>
        {/* Right section top row */}
        {/* <div className="w-full flex justify-end items-center  p-4"> */}
        <DesktopHeader />
        {/* </div> */}
        <div className="w-full bg-[#F5F7FA] flex justify-center p-0 md:p-0">
          <div className="w-full min-h-[600px] bg-white rounded-3xl shadow-lastTransaction z-10">
            <div className="p-2 md:p-6">
              {/* ---------------- Table--------------------------- */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <thead className="text-xs text-firstBlack bg-white">
                    <tr className="border border-tableBorder">
                      <th className="px-3 py-2 border border-tableBorder">
                        Terminal ID
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Terminal Name
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Location
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Assigned To
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Status
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Last Sync Time
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        IP Address
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Device Type
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Transaction Count
                      </th>
                      <th className="px-3 py-2 border border-tableBorder">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, i) => (
                      <tr
                        key={i}
                        className="border border-tableBorder bg-white hover:bg-primary-100 text-[#232323]"
                      >
                        <td className="px-3 py-2 border border-tableBorder">
                          TID00{i + 1}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          Terminal {i + 1}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          Location {i + 1}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          User {i + 1}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          {i % 2 === 0 ? "Active" : "Inactive"}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          2024-03-29 {14 + i}:45
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          192.168.1.{i + 1}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          Device {i + 1}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          {(i + 1) * 5}
                        </td>
                        <td className="px-3 py-2 border border-tableBorder">
                          <button className="text-primary-600">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ----------------End table------------------------ */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
