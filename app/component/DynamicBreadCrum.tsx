import React from "react";
import { usePathname } from "next/navigation";
import { IoChevronForward } from "react-icons/io5";
import { useContext } from "react";
import { AppContext } from "../AppContext";
import Link from "next/link";

const DynamicBreadCrum = () => {
  const pathname = usePathname();
  const context = useContext(AppContext);
  const { customerFullName } = context;
  if (!context) {
    throw new Error("ProfileComponent must be used within an AppProvider");
  }

  return (
    <div>
      {pathname === "/dashboard" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Dashboard
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Dashboard
          </p>
        </div>
      )}
      {(pathname === "/customer" || pathname === "/customerdetails") && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Customers
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <Link href="/customer">
            <span className="text-primary-600 text-sm leading-5 font-medium hover:text-primary-600">
              All customers
            </span>
          </Link>
          <p className="text-primary-600 text-sm leading-5 font-medium capitalize">
            {pathname === "/customerdetails" && (
              <div className="flex items-center">
                <IoChevronForward className="text-[#99A1B7] w-3 h-3 mr-1" />
                {customerFullName}
              </div>
            )}
          </p>
        </div>
      )}
      {pathname === "/crm/total-accounts" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Accounts
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Total Accounts
          </p>
        </div>
      )}
      {pathname === "/crm/total-contacts" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Contacts
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Contacts
          </p>
        </div>
      )}
      {pathname === "/crm/total-leads" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">Leads</p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Leads
          </p>
        </div>
      )}
      {pathname === "/crm/total-quotes" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">Quotes</p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Quotes
          </p>
        </div>
      )}
      {pathname === "/crm/get-product" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Products
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Products
          </p>
        </div>
      )}
      {pathname === "/transaction" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Transactions
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Transactions
          </p>
        </div>
      )}
      {pathname === "/point-of-services" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Point of services
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Services
          </p>
        </div>
      )}
      {pathname === "/payment-terminal" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Payment terminal
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All payments
          </p>
        </div>
      )}
      {pathname === "/cards" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">Cards</p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Recently added
          </p>
        </div>
      )}
      {pathname === "/usermanagement" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            User Management
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Users
          </p>
        </div>
      )}
      {pathname === "/useradd" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            User Add
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Recently added
          </p>
        </div>
      )}
      {pathname === "/user-activity" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            User Activity
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Logs
          </p>
        </div>
      )}
      {pathname === "/setting" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Setting
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All setting
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicBreadCrum;
