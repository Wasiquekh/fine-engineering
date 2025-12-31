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
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

interface Tab {
  label: string;
  content: JSX.Element;
}
interface Transaction {
  amount: string;
  card: string;
  date: string;
  description: string;
  transaction_id: string;
  type: string;
}

export default function Home() {
  const isChecking = useAuthRedirect();
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // useEffect(() => {
  //   fetchData();
  // }, [page]);
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center">
        <Image
          src="/images/orizonIcon.svg"
          alt="Table image"
          width={500}
          height={500}
          style={{ width: "150px", height: "auto" }}
          className="animate-pulse rounded"
        />
      </div>
    );
  }
  const tabs: Tab[] = [
    {
      label: "All Transactions",
      content: (
        <>
          {/* ----------------Table----------------------- */}
          <div className="relative overflow-x-auto  sm:rounded-[12px]">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-[#999999]">
                <tr className="border border-tableBorder">
                  <th
                    scope="col"
                    className="p-2 py-0 border border-tableBorder"
                  >
                    <div className="flex items-center gap-2 p-3">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Description
                      </div>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-0 border border-tableBorder hidden md:table-cell"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Transaction ID
                      </div>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-0 border border-tableBorder hidden md:table-cell"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Type
                      </div>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-0 border border-tableBorder hidden md:table-cell"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Card
                      </div>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-0 border border-tableBorder hidden md:table-cell"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Date
                      </div>
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-0 border border-tableBorder hidden md:table-cell"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Amount
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-tableBorder bg-white hover:bg-primary-100">
                  <td className="p-4 flex items-center gap-2">
                    <p className="text-[#232323] text-base leading-normal">
                      Grocery Purchase
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      TXN123456
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      debit
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      **** 1234
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      2025-07-25
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#FE5C73] text-base font-medium leading-normal">
                      ₹500.00
                    </p>
                  </td>
                </tr>

                <tr className="border border-tableBorder bg-white hover:bg-primary-100">
                  <td className="p-4 flex items-center gap-2">
                    <p className="text-[#232323] text-base leading-normal">
                      Salary Credit
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      TXN789012
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      credit
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      **** 5678
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      2025-07-24
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-green-500 text-base font-medium leading-normal">
                      ₹25,000.00
                    </p>
                  </td>
                </tr>

                <tr className="border border-tableBorder bg-white hover:bg-primary-100">
                  <td className="p-4 flex items-center gap-2">
                    <p className="text-[#232323] text-base leading-normal">
                      Mobile Recharge
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      TXN345678
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      debit
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      **** 9101
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      2025-07-23
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#FE5C73] text-base font-medium leading-normal">
                      ₹299.00
                    </p>
                  </td>
                </tr>

                <tr className="border border-tableBorder bg-white hover:bg-primary-100">
                  <td className="p-4 flex items-center gap-2">
                    <p className="text-[#232323] text-base leading-normal">
                      Cashback
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      TXN654321
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      credit
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      **** 1122
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-[#232323] text-base leading-normal">
                      2025-07-22
                    </p>
                  </td>
                  <td className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                    <p className="text-green-500 text-base font-medium leading-normal">
                      ₹150.00
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ----------------End table--------------------------- */}
        </>
      ),
    },
  ];

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
            <div className="p-1 md:p-6">
              <Tabs tabs={tabs} />
            </div>
          </div>
        </div>
        {/* PAGINATION */}
        <div className="flex justify-center items-center my-10 relative">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronDoubleLeft className=" w-6 h-auto" />
          </button>
          <span className="text-[#717171] text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronDoubleRight className=" w-6 h-auto" />
          </button>
        </div>
        {/* END PAGINATION */}
      </div>
    </div>
  );
}
