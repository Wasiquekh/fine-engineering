"use client";
import Image from "next/image";
import appleImage from "../images/apple.png";
import { CiFolderOn } from "react-icons/ci";
import { CiHeart } from "react-icons/ci";
import { AiOutlinePlus } from "react-icons/ai";
import { IoIosSearch } from "react-icons/io";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { IoIosList } from "react-icons/io";
import { RxAvatar } from "react-icons/rx";
import { CiCalendar } from "react-icons/ci";
import { TbGenderDemiboy } from "react-icons/tb";
import { CiFlag1 } from "react-icons/ci";
import { TfiHome } from "react-icons/tfi";
import { PiCityThin } from "react-icons/pi";
import { CiMobile4 } from "react-icons/ci";
import { FiEye } from "react-icons/fi";
import { useState } from "react";
import { BiSolidHome } from "react-icons/bi";
import { MdOutlineBarChart } from "react-icons/md";
import { TbDeviceMobileDollar } from "react-icons/tb";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { BsCreditCard2Back } from "react-icons/bs";
import { BiSolidUser } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaGreaterThan } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { FiFilter } from "react-icons/fi";
import { LuPencilLine } from "react-icons/lu";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { SiHomeassistantcommunitystore } from "react-icons/si";
import { MdOutlineCall } from "react-icons/md";
import { LiaArrowCircleDownSolid } from "react-icons/lia";
import { MdRemoveRedEye } from "react-icons/md";
import { MdModeEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { HiOutlineWallet } from "react-icons/hi2";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";

export default function Home() {
  return (
    <>
      <div className=" flex justify-end  min-h-screen">
        {/* Left sidebar */}
        <LeftSideBar />
        {/* Main content right section */}
        <div className=" w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px]  rounded p-4">
          {/* right section top row */}
          {/* <div className=" w-full flex justify-end items-center   p-4"> */}
          <DesktopHeader />
          {/* </div> */}
          <div className=" w-full   bg-[#F5F7FA] flex justify-center">
            <div className=" w-full min-h-[600px] bg-[#F5F7FA] rounded-[25px]">
              <div className="">
                <p className="text-[#333B69] text-2xl font-semibold leading-normal mb-5">
                  My Cards
                </p>
                {/* THREE CARDS */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-8 w-full">
                  {/* CARD 1 */}
                  <div className="w-full md:w-1/3 h-[225px] bg-cardBg rounded-2xl p-4 relative">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <p className="text-white text-[11px] leading-normal">
                          Balance
                        </p>
                        <p className="text-white text-base font-semibold leading-normal">
                          $5,756
                        </p>
                      </div>
                      <div>
                        <Image
                          src="/images/Chip_Card.svg"
                          width={29}
                          height={29}
                          alt="Card Chip"
                          className="w-[29px] h-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="text-white opacity-70 text-[10px] leading-normal">
                          CARD HOLDER
                        </p>
                        <p className="text-white text-[13px] font-semibold leading-normal">
                          Eddy Cusuma
                        </p>
                      </div>
                      <div>
                        <p className="text-white opacity-70 text-[10px] leading-normal">
                          VALID THRU
                        </p>
                        <p className="text-white text-[13px] font-semibold leading-normal">
                          12/22
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-cardFooter absolute bottom-0 left-0 right-0 w-full h-[70px] mx-auto p-4">
                      <p className="text-[15px] font-semibold text-white">
                        3778 **** **** 1234
                      </p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="44"
                        height="30"
                        viewBox="0 0 44 30"
                        fill="none"
                      >
                        <circle
                          cx="15"
                          cy="15"
                          r="15"
                          fill="white"
                          fillOpacity="0.5"
                        />
                        <circle
                          cx="29"
                          cy="15"
                          r="15"
                          fill="white"
                          fillOpacity="0.5"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* END CARD 1 */}

                  {/* CARD 2 */}
                  <div className="w-full md:w-1/3 h-[225px] bg-card rounded-2xl p-4 relative">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <p className="text-white text-[11px] leading-normal">
                          Balance
                        </p>
                        <p className="text-white text-base font-semibold leading-normal">
                          $5,756
                        </p>
                      </div>
                      <div>
                        <Image
                          src="/images/Chip_Card.svg"
                          width={29}
                          height={29}
                          alt="Card Chip"
                          className="w-[29px] h-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="text-white opacity-70 text-[10px] leading-normal">
                          CARD HOLDER
                        </p>
                        <p className="text-white text-[13px] font-semibold leading-normal">
                          Eddy Cusuma
                        </p>
                      </div>
                      <div>
                        <p className="text-white opacity-70 text-[10px] leading-normal">
                          VALID THRU
                        </p>
                        <p className="text-white text-[13px] font-semibold leading-normal">
                          12/22
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-cardFooter absolute bottom-0 left-0 right-0 w-full h-[70px] mx-auto p-4">
                      <p className="text-[15px] font-semibold text-white">
                        3778 **** **** 1234
                      </p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="44"
                        height="30"
                        viewBox="0 0 44 30"
                        fill="none"
                      >
                        <circle
                          cx="15"
                          cy="15"
                          r="15"
                          fill="white"
                          fillOpacity="0.5"
                        />
                        <circle
                          cx="29"
                          cy="15"
                          r="15"
                          fill="white"
                          fillOpacity="0.5"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* END CARD 2 */}

                  {/* CARD 3 */}
                  <div className="w-full md:w-1/3 h-[225px] border bg-white border-[#DFEAF2] rounded-2xl p-4 relative">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <p className="text-[#718EBF] text-[11px] leading-normal">
                          Balance
                        </p>
                        <p className="text-[#343C6A] text-base font-semibold leading-normal">
                          $5,756
                        </p>
                      </div>
                      <div>
                        <Image
                          src="/images/white-card.svg"
                          width={29}
                          height={29}
                          alt="Card Chip"
                          className="w-[29px] h-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="text-[#718EBF] opacity-70 text-[10px] leading-normal">
                          CARD HOLDER
                        </p>
                        <p className="text-[#343C6A] text-[13px] font-semibold leading-normal">
                          Eddy Cusuma
                        </p>
                      </div>
                      <div>
                        <p className="text-[#718EBF] opacity-70 text-[10px] leading-normal">
                          VALID THRU
                        </p>
                        <p className="text-[#343C6A] text-[13px] font-semibold leading-normal">
                          12/22
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-cardFooter absolute bottom-0 left-0 right-0 w-full h-[70px] mx-auto p-4 border-t border-[#DFEAF2]">
                      <p className="text-[15px] font-semibold text-[#343C6A]">
                        3778 **** **** 1234
                      </p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="44"
                        height="30"
                        viewBox="0 0 44 30"
                        fill="none"
                      >
                        <circle
                          cx="15"
                          cy="15"
                          r="15"
                          fill="#9199AF"
                          fillOpacity="0.5"
                        />
                        <circle
                          cx="29"
                          cy="15"
                          r="15"
                          fill="#9199AF"
                          fillOpacity="0.5"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* END CARD 3 */}
                </div>
                {/* CARD EXPENSE */}
                <div className="flex justify-between">
                  <div className=" w-[34%]">
                    <p className="text-[#333B69] text-2xl font-semibold leading-normal  mb-5">
                      Card Expense Statistics
                    </p>
                  </div>
                  <div className=" w-[64%]">
                    <p className="text-[#333B69] text-2xl font-semibold leading-normal  mb-5">
                      Card List
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
                  {/* Left Card */}
                  <div className="w-full md:w-[34%] h-auto md:h-[310px] bg-white flex justify-center items-center rounded-[25px] p-6">
                    <div className="flex flex-col justify-center items-center">
                      <Image
                        src="/images/cardStatic.svg"
                        alt="Orizon profile"
                        width={173}
                        height={169}
                        className="h-[169px] w-[173px]"
                      />
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex gap-3 justify-center items-center">
                          <GoDotFill className="text-[#4C78FF] text-[28px]" />
                          <p className="text-[#718EBF] text-[15px] font-medium">
                            DBL Bank
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center items-center">
                          <GoDotFill className="text-[#FF82AC] text-[28px]" />
                          <p className="text-[#718EBF] text-[15px] font-medium">
                            DBL Bank
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center items-center">
                          <GoDotFill className="text-[#16DBCC] text-[28px]" />
                          <p className="text-[#718EBF] text-[15px] font-medium">
                            ABM Bank
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center items-center">
                          <GoDotFill className="text-[#FFBB38] text-[28px]" />
                          <p className="text-[#718EBF] text-[15px] font-medium">
                            MCP Bank
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Cards Section */}
                  <div className="w-full md:w-[64%] flex flex-col gap-6">
                    {["#E7EDFF", "#FFE0EB", "#FFF5D9"].map((bgColor, index) => (
                      <div
                        key={index}
                        className="p-[20px] rounded-[20px] bg-white flex justify-between items-center shadow-md"
                      >
                        <div className="flex items-center w-full">
                          <div
                            className={`bg-[${bgColor}] rounded-[12px] h-[45px] w-[45px] flex justify-center items-center mr-5`}
                          >
                            <HiOutlineWallet
                              className={`h-5 w-5 text-${bgColor}`}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 sm:gap-0">
                            <div>
                              <p className="text-[#232323] text-base font-medium">
                                Card Type
                              </p>
                              <p className="text-[#718EBF] text-[15px]">
                                Secondary
                              </p>
                            </div>
                            <div>
                              <p className="text-[#232323] text-base font-medium">
                                Bank
                              </p>
                              <p className="text-[#718EBF] text-[15px]">
                                BRC Bank
                              </p>
                            </div>
                            <div>
                              <p className="text-[#232323] text-base font-medium">
                                Card Number
                              </p>
                              <p className="text-[#718EBF] text-[15px]">
                                **** **** 5600
                              </p>
                            </div>
                            <div>
                              <p className="text-[#232323] text-base font-medium">
                                Name on Card
                              </p>
                              <p className="text-[#718EBF] text-[15px]">
                                William
                              </p>
                            </div>
                            <div className="text-[#1814F3] text-[15px] font-medium cursor-pointer">
                              View Details
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Card Expense Statistics*/}
                <div className="flex justify-between">
                  <div className=" w-[75%]">
                    <p className="text-[#333B69] text-2xl font-semibold leading-normal  mb-5">
                      Card Expense Statistics
                    </p>
                  </div>
                  <div className=" w-[25%]">
                    <p className="text-[#333B69] text-2xl font-semibold leading-normal  mb-5">
                      Card List
                    </p>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="w-full lg:w-[69%] bg-white p-6 rounded-[25px] shadow-md">
                    <p className="text-[#718EBF] text-base leading-7 mb-8">
                      Credit Card generally means a plastic card issued by
                      Scheduled Commercial Banks assigned to a Cardholder, with
                      a credit limit, that can be used to purchase goods and
                      services on credit or obtain cash advances.
                    </p>
                    <div className="w-full flex flex-col md:flex-row gap-4 mb-4">
                      <div className="w-full">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Card Type
                        </p>
                        <input
                          type="text"
                          placeholder="Diners Club"
                          className="focus:outline-none w-full border border-[#DFEAF2] rounded-[12px] text-[15px] leading-4 placeholder-[#718EBF] py-4 px-4"
                        />
                      </div>
                      <div className="w-full">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Name On Card
                        </p>
                        <input
                          type="text"
                          placeholder="My Cards"
                          className="focus:outline-none w-full border border-[#DFEAF2] rounded-[12px] text-[15px] leading-4 placeholder-[#718EBF] py-4 px-4"
                        />
                      </div>
                    </div>
                    <div className="w-full flex flex-col md:flex-row gap-4 mb-4">
                      <div className="w-full">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Card Number
                        </p>
                        <input
                          type="text"
                          placeholder="**** **** **** ****"
                          className="focus:outline-none w-full border border-[#DFEAF2] rounded-[12px] text-[15px] leading-4 placeholder-[#718EBF] py-4 px-4"
                        />
                      </div>
                      <div className="w-full">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Expiration Date
                        </p>
                        <input
                          type="text"
                          placeholder="25 January 2025"
                          className="focus:outline-none w-full border border-[#DFEAF2] rounded-[12px] text-[15px] leading-4 placeholder-[#718EBF] py-4 px-4"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-[29%] p-6 bg-white rounded-[25px] shadow-md">
                    <div className="w-full flex flex-col gap-4">
                      {[
                        "#FFF5D9",
                        "#E7EDFF",
                        "#FFE0EB",
                        "#DCFAF8",
                        "#DCFAF8",
                      ].map((bgColor, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 w-full"
                        >
                          <div
                            className={`bg-[${bgColor}] rounded-[20px] w-[60px] h-[60px] flex items-center justify-center mr-2`}
                          >
                            <HiOutlineWallet className="h-[25px] w-[25px] text-[#232323]" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[#232323] text-base font-medium leading-normal">
                              Block Card
                            </p>
                            <p className="text-[#718EBF] text-[15px] leading-normal">
                              Instantly block your card
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
