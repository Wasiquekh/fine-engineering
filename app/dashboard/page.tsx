"use client";
import Image from "next/image";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { GoArrowRight } from "react-icons/go";
import { MdOutlineCircle } from "react-icons/md";
import { IoCheckmarkCircleSharp } from "react-icons/io5";
import LineChartComponent from "../component/LineChartComponent";
import PieChartComponent from "../component/PieChartComponent";
import CountUp from "react-countup";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

export default function Home() {
  // const isChecking = useAuthRedirect();
  // if (isChecking) {
  //   return (
  //     <div className="h-screen flex flex-col gap-5 justify-center items-center bg-white">
  //       <Image
  //         src="/images/orizonIcon.svg"
  //         alt="Loading"
  //         width={150}
  //         height={150}
  //         className="animate-pulse rounded"
  //       />
  //     </div>
  //   );
  // }

  return (
    <>
      <div className=" flex justify-end">
        {/* Left sidebar */}
        <LeftSideBar />
        {/* Main content right section */}
        <div className="w-full md:w-[83%] bg-[#F5F7FA]  rounded p-4 mt-0 relative">
          {/* Right section top row */}
          <DesktopHeader />
          {/* DASHBOARD CONTENT */}
          <div className=" w-full flex flex-col md:flex-row md:justify-between mb-4 mt-12">
            <div className=" w-full md:w-[69.5%]">
              <div className="flex flex-col md:flex-row justify-between mb-5">
                <div className="w-full md:w-[49.5%] shadow-dashboardShadow rounded-xl bg-white p-4 mb-5 md:mb-0 ">
                  <div className="flex justify-between mb-3">
                    <Image
                      src="/images/maroonIcon.svg"
                      alt="side desgin"
                      width={50}
                      height={50}
                      className=""
                    />
                    <Image
                      src="/images/tooltip.svg"
                      alt="side desgin"
                      width={30}
                      height={30}
                      className=""
                    />
                  </div>
                  <p className="text-textGrey text-sm font-medium mb-3">
                    Total Revenue
                  </p>
                  <p className="text-firstBlack text-[40px] font-bold mb-3">
                    <CountUp
                      start={0}
                      end={154140}
                      duration={2}
                      separator=","
                      decimals={2}
                      prefix="$"
                    />
                  </p>
                  <div className="flex gap-4 items-center mb-3">
                    <Image
                      src="/images/activity.svg"
                      alt="side desgin"
                      width={70}
                      height={70}
                      className=""
                    />
                    <p className="text-textGrey text-sm font-medium">
                      Activity from July 1st to July 31th
                    </p>
                  </div>
                  <div className=" border border-b-[#99B2C64A]"></div>
                  <div className="flex gap-2 items-center py-5 px-2">
                    <p className="text-base text-firstBlack font-semibold">
                      View Report
                    </p>
                    <GoArrowRight />
                  </div>
                </div>
                <div className="w-full md:w-[49.5%] shadow-dashboardShadow rounded-xl bg-white p-4 ">
                  <div className="flex justify-between mb-3">
                    <Image
                      src="/images/yellowIcon.svg"
                      alt="side desgin"
                      width={50}
                      height={50}
                      className=""
                    />
                    <Image
                      src="/images/tooltip.svg"
                      alt="side desgin"
                      width={30}
                      height={30}
                      className=""
                    />
                  </div>
                  <p className="text-textGrey text-sm font-medium mb-3">
                    Total Audience
                  </p>
                  <p className="text-firstBlack text-[40px] font-bold mb-3">
                    <CountUp
                      start={0}
                      end={148.043}
                      duration={2}
                      separator=","
                      decimals={2}
                      prefix=""
                    />
                  </p>
                  <div className="flex gap-4 items-center mb-3">
                    <Image
                      src="/images/activity.svg"
                      alt="side desgin"
                      width={70}
                      height={70}
                      className=""
                    />
                    <p className="text-textGrey text-sm font-medium">
                      Activity from July 1st to July 31th
                    </p>
                  </div>
                  <div className=" border border-b-[#99B2C64A]"></div>
                  <div className="flex gap-2 items-center py-5 px-2">
                    <p className="text-base text-firstBlack font-semibold">
                      View Report
                    </p>
                    <GoArrowRight />
                  </div>
                </div>
              </div>
              <div className="shadow-dashboardShadow rounded-xl bg-white p-5 mb-5 md:mb-0">
                <div className="flex flex-col md:flex-row justify-between">
                  <p className="text-2xl font-bold text-firstBlack mb-2 md:mb-0">
                    Advanced Insights
                  </p>
                  <div className="flex gap-5">
                    <div className="flex p-2 px-3 items-center gap-2 border-[1.5px] border-[#F1F5F7] rounded-lg">
                      <MdOutlineCircle className="w-3 text-[#8571F4]" />
                      <p className=" text-textGrey text-sm font-medium">
                        Total Views
                      </p>
                    </div>
                    <div className="flex p-2 px-3 items-center gap-2 border-[1.5px] border-[#F1F5F7] rounded-lg">
                      <MdOutlineCircle className="w-3 text-[#C686F8]" />
                      <p className=" text-textGrey text-sm font-medium">
                        Product Sales
                      </p>
                    </div>
                  </div>
                </div>
                <LineChartComponent />
                {/* <Image
                                    src="/images/bars.svg"
                                    alt="side desgin"
                                    width={100}
                                    height={100}
                                    className=" w-full h-full"
                                /> */}
              </div>
            </div>
            <div className=" w-full md:w-[29.5%] bg-white rounded-xl shadow-dashboardShadow p-4">
              <p className="text-firstBlack text-xl font-bold">Sales History</p>
              <div className="relative overflow-x-auto">
                <table className="w-full  text-left">
                  <thead className=""></thead>
                  <tbody>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Domain Purchase
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          Nigeria
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Domain Purchase
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          Nigeria
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Premium Package
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          Kenya
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Domain Purchase
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          South Africa
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Investment Guide
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          Ghana
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Go To Market
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          Egypt
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                    <tr className="bg-white border-b border-[#F1F5F7]">
                      <td scope="row" className=" py-3 ">
                        <span className="block text-base font-semibold text-firstBlack">
                          Website Design
                        </span>
                        <span className="block text-textGrey text-sm font-medium">
                          Tanzania
                        </span>
                      </td>
                      <td className="">
                        <div className=" flex gap-1 items-center">
                          <IoCheckmarkCircleSharp className="text-primary-500" />
                          <p className=" text-textGrey text-sm font-medium">
                            paid
                          </p>
                        </div>
                      </td>
                      <td className=" text-sm text-[#4B5675] font-semibold">
                        $ 59,99
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center py-6 text-xl font-bold text-firstBlack">
                Conversation Rate
              </p>
              <PieChartComponent />
              {/* <Image
                                src="/images/chart.svg"
                                alt="side desgin"
                                width={100}
                                height={100}
                                className=" w-full mb-5"
                            /> */}

              <div className=" flex gap-3 justify-center items-center mb-6">
                <p className="text-[13px] font-semibold text-primary-500">
                  +3,5%
                </p>
                <p className="text-firstBlack text-sm font-medium">
                  latest activity
                </p>
              </div>
              <div className="flex justify-between">
                <div className="flex justify-center  p-2  items-center gap-1 border-[1.5px] border-firstBlack rounded-lg w-[32%]">
                  <MdOutlineCircle className="w-3 text-[#CD95F9] " />
                  <p className=" text-firstBlack text-sm font-medium">
                    Audience
                  </p>
                </div>
                <div className="flex justify-center  p-2  items-center gap-1 border-[1.5px] border-firstBlack rounded-lg w-[32%]">
                  <MdOutlineCircle className="w-3 text-[#86F3A6] " />
                  <p className=" text-firstBlack text-sm font-medium">
                    Visitors
                  </p>
                </div>
                <div className="flex justify-center  p-2  items-center gap-1 border-[1.5px] border-firstBlack rounded-lg w-[32%]">
                  <MdOutlineCircle className="w-3 text-[#FBCFEE] " />
                  <p className=" text-firstBlack text-sm font-medium">Sales</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative overflow-x-auto bg-white rounded-xl shadow-dashboardShadow p-4 ">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className=" border border-[#F1F5F7] rounded text-textGrey text-[13px] font-semibold">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    No.
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border border-b-[#F1F5F7] text-[13px] font-medium text-firstBlack">
                  <td className="px-6 py-4">01</td>
                  <td className="px-6 py-4">Innovative Cover</td>
                  <td className="px-6 py-4">$135,00</td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1 border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      <IoCheckmarkCircleSharp className="text-primary-500" />
                      View Details
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <p className=" text-textGrey">11/02/2023</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Image
                      src="/images/cell.svg"
                      alt="side desgin"
                      width={100}
                      height={100}
                      className=""
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      View Details
                    </div>
                  </td>
                </tr>
                <tr className="bg-white border border-b-[#F1F5F7] text-[13px] font-medium text-firstBlack">
                  <td className="px-6 py-4">02</td>
                  <td className="px-6 py-4">Process Blueprint</td>
                  <td className="px-6 py-4">$135,00</td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1 border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      <IoCheckmarkCircleSharp className="text-primary-500" />
                      View Details
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <p className=" text-textGrey">11/02/2023</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Image
                      src="/images/cell.svg"
                      alt="side desgin"
                      width={100}
                      height={100}
                      className=""
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      View Details
                    </div>
                  </td>
                </tr>
                <tr className="bg-white border border-b-[#F1F5F7] text-[13px] font-medium text-firstBlack">
                  <td className="px-6 py-4">03</td>
                  <td className="px-6 py-4">Identity Designs</td>
                  <td className="px-6 py-4">$135,00</td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1 border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      <IoCheckmarkCircleSharp className="text-primary-500" />
                      View Details
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <p className=" text-textGrey">11/02/2023</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Image
                      src="/images/cell.svg"
                      alt="side desgin"
                      width={100}
                      height={100}
                      className=""
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      View Details
                    </div>
                  </td>
                </tr>
                <tr className="bg-white border border-b-[#F1F5F7] text-[13px] font-medium text-firstBlack">
                  <td className="px-6 py-4">04</td>
                  <td className="px-6 py-4">Artistic Cover</td>
                  <td className="px-6 py-4">$135,00</td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1 border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      <IoCheckmarkCircleSharp className="text-primary-500" />
                      View Details
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <p className=" text-textGrey">11/02/2023</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Image
                      src="/images/cell.svg"
                      alt="side desgin"
                      width={100}
                      height={100}
                      className=""
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-block border rounded font-semibold border-[#D9E1E7] py-2 px-3 w-auto">
                      View Details
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0">
        <Image
          src="/images/sideDesign.svg"
          alt="side desgin"
          width={100}
          height={100}
          className=" w-full h-full -z-10 hidden"
        />
      </div>
    </>
  );
}
