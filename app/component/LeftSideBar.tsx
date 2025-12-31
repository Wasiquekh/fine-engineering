"use client";
import Link from "next/link";
import Image from "next/image";
import { BiSolidHome } from "react-icons/bi";
import { MdOutlineBarChart } from "react-icons/md";
import { TbDeviceMobileDollar } from "react-icons/tb";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { BsCreditCard2Back } from "react-icons/bs";
import { BiSolidUser } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import { usePathname } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import AxiosProvider from "../../provider/AxiosProvider";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";
import { useState } from "react";
import { AiOutlineDashboard } from "react-icons/ai";
import { RiHistoryLine } from "react-icons/ri";
import { FaUserEdit } from "react-icons/fa";
import { MdOutlineSwitchAccount } from "react-icons/md";
import { RiContactsBook3Fill } from "react-icons/ri";
import { SiGoogleadsense } from "react-icons/si";
import { ImQuotesLeft } from "react-icons/im";
import { AiFillProduct } from "react-icons/ai";
import { MdOutlineDashboard } from "react-icons/md";
import { MdOutlinePeopleOutline } from "react-icons/md";
import { MdCategory } from "react-icons/md";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();
const LeftSideBar: React.FC = () => {
  const pathname = usePathname();
  const permissions = storage.getUserPermissions();
  const hasCustomerView = permissions?.some(
    (perm) => perm.name === "customer.view"
  );
  const hasCustomerAdd = permissions?.some(
    (perm) => perm.name === "customer.add"
  );
  const hasCustomerDelete = permissions?.some(
    (perm) => perm.name === "customer.delete"
  );
  const hasCustomerEdit = permissions?.some(
    (perm) => perm.name === "customer.edit"
  );
  const hasCustomerAudit = permissions?.some(
    (perm) => perm.name === "customer.audit"
  );
  const hasSystemUserView = permissions?.some(
    (perm) => perm.name === "systemuser.view"
  );
  const hasSystemUserAdd = permissions?.some(
    (perm) => perm.name === "systemuser.add"
  );
  const hasSystemUserDelete = permissions?.some(
    (perm) => perm.name === "systemuser.delete"
  );
  const hasSystemUserEdit = permissions?.some(
    (perm) => perm.name === "systemuser.edit"
  );
  const hasSystemUserAudit = permissions?.some(
    (perm) => perm.name === "systemuser.audit"
  );
  const hasUserActivityView = permissions?.some(
    (perm) => perm.name === "useractivity.view"
  );
  const router = useRouter();

  const handleLogout = async () => {
    router.push("/");
    return;
    try {
      const response = await axiosProvider.post("/logout", {});
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const activePaths = [
    "/crm/total-quotes",
    "/crm/total-contacts",
    "/crm/total-accounts",
    "/crm/total-leads",
    "/crm/get-product",
    "/crm/get-category",
  ];

  const isActive = activePaths.includes(pathname);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState<boolean>(isActive);
  const toggleSubmenu = (): void => {
    setIsSubmenuOpen((prev) => !prev);
  };
  return (
    <div className="w-full hidden md:w-[17%]  md:flex flex-col justify-between py-4 px-1 border-r-2 border-customBorder shadow-borderShadow mt-0  h-screen fixed top-0 left-0">
      {/* SIDE LEFT BAR TOP SECTION */}
      <div className="z-10 overflow-y-auto custom-scrollbar">
        <Link href="/customer">
          <div className=" flex gap-2 mb-12 px-3 py-2">
            <Image
              src="/images/orizonIcon.svg"
              alt="Description of image"
              width={0}
              height={0}
              className=" w-11 h-auto"
            />
            <p className=" text-[25px] leading-normal font-bold uppercase text-primary-600">
              Orizon
            </p>
          </div>
        </Link>
        {/* MENU WITH ICONS */}
        <Link href="/dashboard">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/dashboard"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <MdOutlineDashboard className=" w-6 h-6   " />
            <p className="">Dashboard</p>
          </div>
        </Link>

        <Link href="/transaction">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/transaction"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <TbDeviceMobileDollar className=" w-6 h-6   " />
            <p className="">Transaction</p>
          </div>
        </Link>
        <Link href="/point-of-services">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/point-of-services"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <HiWrenchScrewdriver className=" w-6 h-6   " />
            <p className=""> Point of Services</p>
          </div>
        </Link>
        <Link href="/payment-terminal">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/payment-terminal"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <FaMoneyCheckDollar className=" w-6 h-6   " />
            <p className=""> Payment Terminal</p>
          </div>
        </Link>
        <Link href="/cards">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/cards"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <BsCreditCard2Back className=" w-6 h-6   " />
            <p className=""> Credit Cards</p>
          </div>
        </Link>

        <Link href="/usermanagement">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/usermanagement" || pathname === "/useradd"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <FaUserEdit className=" w-6 h-6   " />
            <p className=""> User Management</p>
          </div>
        </Link>

        <Link href="/user-activity">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/user-activity"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <RiHistoryLine className=" w-6 h-6   " />
            <p className=""> User Activity</p>
          </div>
        </Link>

        <Link href="/setting">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] relative cursor-pointer text-base leading-normal font-medium text-firstBlack  hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600 ${
              pathname === "/setting"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <IoMdSettings className=" w-6 h-6   " />
            <p className="">Setting</p>
          </div>
        </Link>
      </div>
      {/* END SIDE LEFT BAR TOP SECTION */}

      {/*  SIDE LEFT BAR BOTTOM SECTION */}
      <div className=" flex gap-2 items-center px-3 py-2 z-10 ">
        <div>
          <Image
            src="/images/logoutIcon.svg"
            alt="logout Icon"
            width={24}
            height={24}
          />
        </div>
        <div
          className=" text-base font-semibold leading-normal text-[#EB5757] cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </div>
      </div>
      {/*  END SIDE LEFT BAR BOTTOM SECTION */}
      <Image
        src="/images/sideBarDesign.svg"
        alt="logout Icon"
        width={100}
        height={100}
        className="w-full absolute bottom-0 right-0 -mb-24"
      />
    </div>
  );
};

export default LeftSideBar;
