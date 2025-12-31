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
import { MdOutlineSecurity } from "react-icons/md";
import { MdOutlineRuleFolder } from "react-icons/md";
import Link from "next/link";
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
        <div className="w-full bg-[#F5F7FA] flex justify-center p-0 md:p-0 mt-6 md:mt-0">
          <div className="w-full min-h-80 md:min-h-[600px] bg-white rounded-3xl shadow-lastTransaction z-10">
            <div className="p-3 md:p-6  flex w-full">
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <Link
                  href="/"
                  target="_blank"
                  className="shadow-dashboardShadow p-8 rounded w-full md:w-2/6  flex items-center gap-2 bg-gradient-to-b from-primary-200 to-primary-100 hover:from-primary-300 hover:to-primary-200 active:from-primary-400 active:to-primary-300"
                >
                  <MdOutlineSecurity className=" text-primary-600 text-2xl" />
                  <p className="text-firstBlack text-xl font-medium">
                    Terms and conditions
                  </p>
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="shadow-dashboardShadow p-8 rounded w-full md:w-2/6 flex items-center gap-2 bg-gradient-to-b from-primary-200 to-primary-100 hover:from-primary-300 hover:to-primary-200 active:from-primary-400 active:to-primary-300"
                >
                  <MdOutlineRuleFolder className=" text-primary-600 text-2xl" />
                  <p className="text-firstBlack text-xl font-medium">
                    Privacy policy
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
