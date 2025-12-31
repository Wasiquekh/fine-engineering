"use client";
import Link from "next/link";
import Image from "next/image";
import {
  MdOutlinePeopleOutline,
  MdOutlineSwitchAccount,
  MdOutlineDashboard,
  MdCategory,
} from "react-icons/md";
import { BiSolidHome, BiSolidUser } from "react-icons/bi";
import { TbDeviceMobileDollar } from "react-icons/tb";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { FaMoneyCheckDollar } from "react-icons/fa6";
import { BsCreditCard2Back } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import { AiOutlineDashboard, AiFillProduct } from "react-icons/ai";
import { RiContactsBook3Fill, RiHistoryLine } from "react-icons/ri";
import { SiGoogleadsense } from "react-icons/si";
import { ImQuotesLeft } from "react-icons/im";
import { FaChevronDown } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import StorageManager from "../../provider/StorageManager";
import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const LeftSideBarMobile: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = storage.getUserPermissions();

  const hasCustomerView = permissions?.some(
    (perm) => perm.name === "customer.view"
  );
  const hasSystemUserView = permissions?.some(
    (perm) => perm.name === "systemuser.view"
  );
  const hasUserActivityView = permissions?.some(
    (perm) => perm.name === "useractivity.view"
  );

  const crmPaths = [
    "/crm/total-accounts",
    "/crm/total-contacts",
    "/crm/total-leads",
    "/crm/total-quotes",
    "/crm/get-product",
    "/crm/get-category",
  ];

  const isCRMActive = crmPaths.includes(pathname);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState<boolean>(isCRMActive);

  const toggleSubmenu = () => setIsSubmenuOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      const response = await axiosProvider.post("/logout", {});
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="w-full md:hidden flex flex-col justify-between py-2 px-2 mt-2">
      {/* Logo */}
      <Link href="/customer" className="flex gap-2 mb-8 px-3 py-2">
        <Image
          src="/images/orizonIcon.svg"
          alt="Orizon Logo"
          width={0}
          height={0}
          className="w-11 h-auto"
        />
        <p className="text-[25px] font-bold uppercase text-primary-600">
          Orizon
        </p>
      </Link>

      {/* Navigation */}
      <nav>
        <SidebarItem
          href="/dashboard"
          label="Dashboard"
          icon={<BiSolidHome />}
          pathname={pathname}
        />
        {hasCustomerView && (
          <SidebarItem
            href="/customer"
            label="Customers"
            icon={<MdOutlinePeopleOutline />}
            pathname={pathname}
          />
        )}

        {hasCustomerView && (
          <>
            <div
              onClick={toggleSubmenu}
              className={`mb-2 flex items-center gap-4 px-3 py-3 cursor-pointer rounded-[4px] ${
                isCRMActive
                  ? "bg-primary-600 text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600"
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <AiOutlineDashboard className="w-6 h-6" />
              </div>
              <p className="text-base font-medium leading-none">CRM</p>
              <FaChevronDown className="ml-auto" />
            </div>

            {isSubmenuOpen && (
              <div className="pl-6">
                <SidebarItem
                  href="/crm/total-accounts"
                  label="Accounts"
                  icon={<MdOutlineSwitchAccount />}
                  pathname={pathname}
                />
                <SidebarItem
                  href="/crm/total-contacts"
                  label="Contacts"
                  icon={<RiContactsBook3Fill />}
                  pathname={pathname}
                />
                <SidebarItem
                  href="/crm/total-leads"
                  label="Leads"
                  icon={<SiGoogleadsense />}
                  pathname={pathname}
                />
                <SidebarItem
                  href="/crm/total-quotes"
                  label="Quotes"
                  icon={<ImQuotesLeft />}
                  pathname={pathname}
                />
                <SidebarItem
                  href="/crm/get-product"
                  label="Products"
                  icon={<AiFillProduct />}
                  pathname={pathname}
                />
                <SidebarItem
                  href="/crm/get-category"
                  label="Product Category"
                  icon={<MdCategory />}
                  pathname={pathname}
                />
              </div>
            )}
          </>
        )}

        <SidebarItem
          href="/transaction"
          label="Transaction"
          icon={<TbDeviceMobileDollar />}
          pathname={pathname}
        />
        <SidebarItem
          href="/point-of-services"
          label="Point of Services"
          icon={<HiWrenchScrewdriver />}
          pathname={pathname}
        />
        <SidebarItem
          href="/payment-terminal"
          label="Payment Terminal"
          icon={<FaMoneyCheckDollar />}
          pathname={pathname}
        />
        <SidebarItem
          href="/cards"
          label="Credit Cards"
          icon={<BsCreditCard2Back />}
          pathname={pathname}
        />

        {hasSystemUserView && (
          <SidebarItem
            href="/usermanagement"
            label="User Management"
            icon={<BiSolidUser />}
            pathname={pathname}
          />
        )}
        {hasUserActivityView && (
          <SidebarItem
            href="/user-activity"
            label="User Activity"
            icon={<RiHistoryLine />}
            pathname={pathname}
          />
        )}
        <SidebarItem
          href="/setting"
          label="Setting"
          icon={<IoMdSettings />}
          pathname={pathname}
        />
      </nav>

      {/* Logout */}
      <div className="flex gap-2 items-center px-3 mt-6">
        <Image
          src="/images/logoutIcon.svg"
          alt="logout Icon"
          width={24}
          height={24}
        />
        <button
          onClick={handleLogout}
          className="text-base font-semibold text-[#EB5757]"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

// ✅ Updated SidebarItem with vertical centering and padding
const SidebarItem = ({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  pathname: string;
}) => {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-4 px-3 py-3 rounded-[4px] ${
          isActive
            ? "bg-primary-600 text-white"
            : "text-firstBlack hover:bg-sideBarHoverbg active:bg-sideBarHoverbgPressed hover:text-primary-600"
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
        <p className="text-base font-medium leading-none">{label}</p>
      </div>
    </Link>
  );
};

export default LeftSideBarMobile;
