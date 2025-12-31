"use client";
import Image from "next/image";
import { RxAvatar } from "react-icons/rx";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineCall } from "react-icons/md";
import { LiaArrowCircleDownSolid } from "react-icons/lia";
import { MdRemoveRedEye, MdModeEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { AppContext } from "../AppContext";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import SidebarUserUpdateForm from "../component/SidebarUserUpdateForm";
import StorageManager from "../../provider/StorageManager";
import React from "react";
import LeftSideBar from "../component/LeftSideBar";
import UserActivityLogger from "../../provider/UserActivityLogger";
import { useRouter } from "next/navigation";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { HiChevronDoubleRight } from "react-icons/hi";
import DesktopHeader from "../component/DesktopHeader";
import { Tooltip } from "react-tooltip";
import { FaEllipsisVertical } from "react-icons/fa6";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

interface User {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  role: string; // Add the role property
}
interface CurrentUserData {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  role: string;
}
const axiosProvider = new AxiosProvider();
const storage = new StorageManager();
const activityLogger = new UserActivityLogger();

export default function Home() {
  const isChecking = useAuthRedirect();
  const [data, setData] = useState<User[] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isEditFlyoutOpen, setIsEditFlyoutOpen] = useState<boolean>(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { accessToken } = useContext(AppContext);
  const router = useRouter();
  const permissions = storage.getUserPermissions();
  const hasSystemUserView = permissions?.some(
    (perm) => perm.name === "systemuser.view"
  );
  const hasSystemUserDelete = permissions?.some(
    (perm) => perm.name === "systemuser.delete"
  );
  const hasSystemUserAdd = permissions?.some(
    (perm) => perm.name === "systemuser.add"
  );
  useEffect(() => {
    const hasSystemUserView = permissions?.some(
      (perm) => perm.name === "systemuser.view"
    );
  }, []);

  const toggleEditFlyout = () => {
    setIsEditFlyoutOpen(!isEditFlyoutOpen);
  };

  const deleteUserData = async (item: User) => {
    const userID = item.id;

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#FFCCD0",
      cancelButtonColor: "#A3000E",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosProvider.post("/deleteuser", { id: userID });

          toast.success("Successfully Deleted");
          setShouldRefetch((prev) => !prev);
          await activityLogger.userDelete(userID);
        } catch (error) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user");
        }
      }
    });
  };

  const changeCurrentUserData = (item: User) => {
    setCurrentUserData(item);
    toggleEditFlyout();
  };

  const fetchData = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const response = await axiosProvider.get(
        `/getalluser?page=${currentPage}&limit=${limit}`
      );
      // console.log('get all user',response.data.data.users);
      const result = response.data.data.users;
      // console.log('BBBBBBBBBBBBBBBB',result)
      setTotalPages(response.data.data.totalPages);
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData(page);
  }, [shouldRefetch, page]);

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
  return (
    <>
      <div className=" flex justify-end  min-h-screen">
        {/* Left sidebar */}
        <LeftSideBar />
        {/* Main content right section */}
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px]  rounded p-4 mt-0 relative">
          <div className="absolute bottom-0 right-0">
            <Image
              src="/images/sideDesign.svg"
              alt="side desgin"
              width={100}
              height={100}
              className=" w-full h-full"
            />
          </div>
          {/* right section top row */}
          <DesktopHeader />

          <div className="rounded-3xl shadow-lastTransaction bg-white py-6 px-1  md:p-6 z-10 relative">
            {/* Main content middle section */}
            <div className="w-full flex justify-end items-center mt-0 mb-8 flex-wrap sm:flex-nowrap">
              <div className=" sm:w-auto">
                {hasSystemUserAdd ? (
                  <Link href="/useradd">
                    <button className="flex items-center gap-[10px]  h-12 px-3 py-[6px] rounded-[4px] shadow-borderShadow w-full sm:w-auto bg-primary-600 group hover:bg-primary-7  00">
                      <FaPlus className="h-[20px] w-[20px] text-white group-hover:text-white" />
                      <p className="text-white text-base leading-normal group-hover:text-white">
                        Create User
                      </p>
                    </button>
                  </Link>
                ) : (
                  <Link href="/useradd">
                    <button className="flex items-center gap-[10px]  h-12 px-3 py-[6px] rounded-[4px] shadow-borderShadow w-full sm:w-auto bg-primary-600 group hover:bg-primary-7  00">
                      <FaPlus className="h-[20px] w-[20px] text-white group-hover:text-white" />
                      <p className="text-white text-base leading-normal group-hover:text-white">
                        Create User
                      </p>
                    </button>
                  </Link>
                )}
              </div>
            </div>
            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto  sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th
                      scope="col"
                      className="px-1 p-3 md:p-3 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <RxAvatar className="w-5 h-5" />
                        <div className="font-semibold text-firstBlack text-base leading-normal">
                          Name - Mail
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-1 border border-tableBorder hidden md:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <MdOutlineCall className="w-5 h-5" />
                        <div className="font-semibold text-firstBlack text-base leading-normal">
                          Phone
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-1 border border-tableBorder hidden md:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <LiaArrowCircleDownSolid className="w-5 h-5" />
                        <div className="font-semibold text-firstBlack text-base leading-normal">
                          Role
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-1 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <LiaArrowCircleDownSolid className="w-5 h-5" />
                        <div className="font-semibold text-firstBlack text-base leading-normal">
                          Action
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Static hardcoded 4 rows */}
                  {[1, 2, 3, 4].map((_, index) => (
                    <tr
                      className="border border-tableBorder bg-white hover:bg-primary-100"
                      key={index}
                    >
                      <td className="px-1 md:p-3 py-2 flex md:flex-row gap-2">
                        <div>
                          <p className="text-[#232323] text-sm font-semibold leading-normal mb-1 truncate">
                            John Doe {index + 1}
                          </p>
                          <p className="text-[#232323] text-xs md:text-sm leading-normal truncate">
                            johndoe{index + 1}@example.com
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-1 border border-tableBorder hidden md:table-cell">
                        <p className="text-[#232323] text-sm leading-normal truncate">
                          987654321{index}
                        </p>
                      </td>
                      <td className="px-2 py-1 border border-tableBorder hidden md:table-cell">
                        <button className="py-[4px] px-6 bg-primary-400 rounded-xl w-auto text-xs md:text-sm sm:w-4/6">
                          <p className="text-white">Admin</p>
                        </button>
                      </td>
                      <td className="px-2 py-1 border border-tableBorder">
                        <div className="flex gap-1 md:gap-2 justify-center md:justify-start">
                          <button className="py-[4px] px-3 bg-primary-600 hover:bg-primary-800 active:bg-primary-900 group flex gap-1 items-center rounded-xl text-xs md:text-sm">
                            <MdRemoveRedEye className="text-white w-4 h-4 group-hover:text-white" />
                            <p className="text-white hidden md:block group-hover:text-white">
                              View
                            </p>
                          </button>
                          <button className="py-[4px] px-3 bg-black flex gap-1 items-center rounded-full text-xs md:text-sm group hover:bg-primary-600">
                            <RiDeleteBin6Line className="text-white w-4 h-4" />
                            <p className="text-white hidden md:block">Delete</p>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* ----------------End table--------------------------- */}
          {/* Pagination Controls */}
          <div className="flex justify-center items-center my-10 relative">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronDoubleLeft className=" w-6 h-auto" />
            </button>
            <span className="text-firstBlack text-sm">
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

      <SidebarUserUpdateForm
        isEditFlyoutOpen={isEditFlyoutOpen}
        setIsEditFlyoutOpen={setIsEditFlyoutOpen}
        currentUserData={currentUserData}
        setShouldRefetch={setShouldRefetch}
      />
    </>
  );
}
