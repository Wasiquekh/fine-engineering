import React, { useState } from "react";
import Image from "next/image";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiMenu2Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import LeftSideBarMobile from "./LeftSideBarMobile";
import DynamicBreadCrum from "./DynamicBreadCrum";

import { usePathname } from "next/navigation";

const DesktopHeader = () => {
  const [isFlyoutFilterOpen, setFlyoutFilterOpen] = useState<boolean>(false);
  const toggleFilterFlyout = () => setFlyoutFilterOpen(!isFlyoutFilterOpen);
  const pathname = usePathname();
  return (
    <>
      <div className=" w-full flex justify-between  items-center gap-7 md:mb-14">
        <div className="w-full h-24 bg-header-gradient opacity-20 absolute top-0 left-0 right-0 "></div>
        {/* SEARCH INPUT WITH ICON */}
        <div className=" hidden md:block md:w-auto z-10">
          <DynamicBreadCrum />
        </div>
        <div className=" hidden md:w-auto md:flex md:justify-end md:items-center md:gap-7 w-auto z-10">
          <input
            type="text"
            placeholder="Search for something"
            className=" bg-white w-64 h-[50px] rounded-[4px] px-6 border border-[#E7E7E7] hover:shadow-hoverInputShadow focus-border-primary  placeholder-[#8BA3CB] text-[15px] leading-normal"
          />
          <div className=" w-[50px] h-[50px] bg-white rounded-full flex justify-center items-center">
            <CiSettings className=" text-[#718EBF] w-[25px] h-[25px]" />
          </div>
          <div className=" w-[50px] h-[50px] bg-white rounded-full flex justify-center items-center">
            <IoIosNotificationsOutline className=" text-[#FE5C73] w-[25px] h-[25px]" />
          </div>
          <div className=" w-[50px] h-[50px]  rounded-full flex justify-center items-center z-10">
            <Image
              src="/images/dummy-image.jpg"
              alt="Orizon profile"
              width={50}
              height={50}
              className="rounded-full border-2 border-primary-500"
            />
          </div>
        </div>
        <RiMenu2Line
          onClick={toggleFilterFlyout}
          className="text-black text-xl cursor-pointer md:hidden z-20"
        />
        <div className=" md:hidden w-[50px] h-[50px]  rounded-full flex justify-center items-center z-10">
          <Image
            src="/images/dummy-image.jpg"
            alt="Orizon profile"
            width={50}
            height={50}
            className="rounded-full border-2 border-primary-500"
          />
        </div>
      </div>
      <div className="w-full mt-1 mb-4 md:hidden z-[30] relative">
        <DynamicBreadCrum />
      </div>
      {/* LEFT SIDEBAR MENU */}
      {isFlyoutFilterOpen && (
        <>
          <div
            className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
            onClick={() => {
              setFlyoutFilterOpen(!isFlyoutFilterOpen);
            }}
          ></div>
          <div
            className={`leftSideBar ${
              isFlyoutFilterOpen ? "leftSideBarOpen" : ""
            }`}
          >
            <div className=" w-full flex min-h-auto">
              {/* Flyout content here */}
              <LeftSideBarMobile />
              <IoCloseOutline
                onClick={toggleFilterFlyout}
                className=" h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer absolute top-[69px] right-4"
              />
            </div>
          </div>
        </>
      )}
      {/*  LEFT SIDEBAR MENU END */}
    </>
  );
};

export default DesktopHeader;
