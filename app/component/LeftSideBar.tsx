"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MdOutlineInventory2,
  MdWorkOutline,
  MdDesignServices,
  MdPendingActions,
  MdPrecisionManufacturing,
  MdOutlineDashboard,
  MdOutlinePeopleOutline,
  MdCategory,
  MdOutlineSwapHoriz,
  MdViewKanban,
} from "react-icons/md";
import { TbDeviceMobileDollar } from "react-icons/tb";
import { usePathname, useSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import AxiosProvider from "../../provider/AxiosProvider";
import { FaChevronDown } from "react-icons/fa";
import { useState, useEffect } from "react";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const LeftSideBar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const permissions = storage.getUserPermissions();
  const hasCustomerView = permissions?.some((perm) => perm.name === "customer.view");
  const hasSystemUserView = permissions?.some((perm) => perm.name === "systemuser.view");
  const hasUserActivityView = permissions?.some((perm) => perm.name === "useractivity.view");

  const client = searchParams.get("client") || "";
  const filter = searchParams.get("filter") || "JOB_SERVICE";

  const isVendorNotOkPage =
    pathname === "/pp_not-ok/vendor" || pathname.startsWith("/pp_not-ok/vendor");
  const isWeldingNotOkPage =
    pathname === "/pp_not-ok/welding" || pathname.startsWith("/pp_not-ok/welding");
  const isMainNotOkPage =
    pathname === "/pp_not-ok" || (pathname.startsWith("/pp_not-ok") && !isVendorNotOkPage && !isWeldingNotOkPage);

  const handleLogout = async () => {
    localStorage.clear();
    try {
      await axiosProvider.post("/fineengg_erp/logout", {});
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      window.location.href = "/";
    }
  };

  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(pathname.includes("/inventory"));
  const [isInventory1Open, setIsInventory1Open] = useState<boolean>(false);
  const [isMaterialApprovedOpen, setIsMaterialApprovedOpen] = useState<boolean>(false);
  const [isMaterialApprovedAmarOpen, setIsMaterialApprovedAmarOpen] = useState<boolean>(false);

  const [isProductionOpen, setIsProductionOpen] = useState<boolean>(
    pathname.includes("/production_planning") ||
      pathname === "/category" ||
      pathname.includes("/po-services") ||
      pathname.includes("/vendors") ||
      pathname.includes("/pp_not-ok")
  );

  const [isAmarEquipmentOpen, setIsAmarEquipmentOpen] = useState<boolean>(
    pathname.includes("/production_planning") ||
      pathname.includes("/po-services") ||
      pathname.includes("/pp_not-ok") ||
      (pathname.includes("/production_module") && client === "Amar Equipment") ||
      (pathname.startsWith("/review") && client === "Amar Equipment") ||
      (pathname.startsWith("/qc") && client === "Amar Equipment")
  );

  const [isAmarBioOpen, setIsAmarBioOpen] = useState<boolean>(
    (pathname.includes("/production_planning") && client === "Amar Bio") ||
      (pathname.includes("/pp_not-ok") && client === "Amar Bio") ||
      (pathname.includes("/production_module") && client === "Amar Bio") ||
      (pathname.startsWith("/review") && client === "Amar Bio") ||
      (pathname.startsWith("/qc") && client === "Amar Bio")
  );

  const [isPOOpen, setIsPOOpen] = useState<boolean>(pathname.includes("/po-services"));

  const [isNotOkAmarEquipmentOpen, setIsNotOkAmarEquipmentOpen] = useState<boolean>(
    pathname.includes("/pp_not-ok") && client === "Amar Equipment"
  );
  const [isNotOkAmarBioOpen, setIsNotOkAmarBioOpen] = useState<boolean>(
    pathname.includes("/pp_not-ok") && client === "Amar Bio"
  );

  const [isProductionDropdownOpen, setIsProductionDropdownOpen] = useState<boolean>(
    pathname.includes("/production") && !pathname.includes("/production_planning")
  );

  const [isProduction1Open, setIsProduction1Open] = useState<boolean>(
    pathname.includes("/production_module") ||
      pathname.startsWith("/review") ||
      pathname.startsWith("/qc")
  );

  const [isQCOpen, setIsQCOpen] = useState<boolean>(pathname.startsWith("/qc"));
  const [isQCAmarEquipmentOpen, setIsQCAmarEquipmentOpen] = useState<boolean>(false);
  const [isQCAmarBioOpen, setIsQCAmarBioOpen] = useState<boolean>(false);

  const [isProdAmarEquipmentOpen, setIsProdAmarEquipmentOpen] = useState<boolean>(false);
  const [isProdAmarBioOpen, setIsProdAmarBioOpen] = useState<boolean>(false);
  const [isProdAmarEqReviewOpen, setIsProdAmarEqReviewOpen] = useState<boolean>(false);
  const [isProdAmarBioReviewOpen, setIsProdAmarBioReviewOpen] = useState<boolean>(false);

  useEffect(() => {
    if (pathname.includes("/production_module") || pathname.startsWith("/review")) {
      setIsProductionDropdownOpen(true);
      setIsProduction1Open(true);

      if (client === "Amar Equipment") {
        setIsProdAmarEquipmentOpen(true);
        if (pathname.startsWith("/review")) setIsProdAmarEqReviewOpen(true);
      } else if (client === "Amar Bio") {
        setIsProdAmarBioOpen(true);
        if (pathname.startsWith("/review")) setIsProdAmarBioReviewOpen(true);
      }
    }

    if (pathname.startsWith("/qc")) {
      setIsQCOpen(true);
      if (client === "Amar Equipment") setIsQCAmarEquipmentOpen(true);
      if (client === "Amar Bio") setIsQCAmarBioOpen(true);
    }

    if (pathname.startsWith("/pp_not-ok")) {
      setIsProductionOpen(true);

      if (client === "Amar Equipment") {
        setIsAmarEquipmentOpen(true);
        setIsNotOkAmarEquipmentOpen(true);
      }

      if (client === "Amar Bio") {
        setIsAmarBioOpen(true);
        setIsNotOkAmarBioOpen(true);
      }
    }
  }, [pathname, client]);

  const itemCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${
      active ? "bg-sideBarHoverbg" : ""
    }`;

  const textCls = (active: boolean) =>
    `text-base font-medium ${active ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`;

  const iconCls = (active: boolean) =>
    `w-5 h-5 ${active ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`;

  return (
    <div className="w-full hidden md:w-[17%] md:flex flex-col justify-between py-4 px-1 border-r-2 border-customBorder shadow-borderShadow mt-0 h-screen fixed top-0 left-0">
      <div className="z-10 overflow-y-auto custom-scrollbar">
        <Link href="/customer">
          <div className="flex gap-2 mb-12 px-0 py-2">
            <Image
              src="/images/fine-engineering-logo.jpeg"
              alt="Fine Engineering"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>
        </Link>

        <Link href="/dashboard">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
              pathname === "/dashboard"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <MdOutlineDashboard className="w-6 h-6" />
            <p>Dashboard</p>
          </div>
        </Link>

        <Link href="/material-movement">
          <div
            className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
              pathname === "/material-movement"
                ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                : ""
            }`}
          >
            <MdOutlineSwapHoriz className="w-6 h-6" />
            <p>Material Movement</p>
          </div>
        </Link>

        <div
          onClick={() => setIsInventoryOpen(!isInventoryOpen)}
          className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
            pathname.includes("/inventory")
              ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
              : ""
          }`}
        >
          <MdOutlineInventory2 className="w-6 h-6" />
          <p>Inventory</p>
          <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isInventoryOpen ? "rotate-180" : ""}`} />
        </div>

        {isInventoryOpen && (
          <div className="pl-4 mb-4 flex flex-col gap-1">
            <div
              onClick={() => setIsInventory1Open(!isInventory1Open)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
            >
              <MdOutlineInventory2 className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Inventory 1</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isInventory1Open ? "rotate-180" : ""}`} />
            </div>

            {isInventory1Open && (
              <div className="pl-4 flex flex-col gap-1">
                <Link href="/inventory">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                    <MdOutlineInventory2 className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Material Data</p>
                  </div>
                </Link>

                <div
                  onClick={() => setIsMaterialApprovedOpen(!isMaterialApprovedOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdOutlineInventory2 className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Material Approved</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedOpen ? "rotate-180" : ""}`} />
                </div>

                {isMaterialApprovedOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <div
                      onClick={() => setIsMaterialApprovedAmarOpen(!isMaterialApprovedAmarOpen)}
                      className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                    >
                      <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                      <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Equipment</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedAmarOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isMaterialApprovedAmarOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        <Link href="/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=Usmaan">
                          <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                            <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Job Service</p>
                          </div>
                        </Link>
                        <Link href="/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=Usmaan">
                          <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                            <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">TSO Service</p>
                          </div>
                        </Link>
                        <Link href="/inventory_material_approve?filter=KANBAN&client=Amar%20Equipment&assign_to=Usmaan">
                          <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                            <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Kanban</p>
                          </div>
                        </Link>
                        <Link href="/inventory_material_approve?client=Amar%20Equipment&assign_to_not=Usmaan">
                          <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                            <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Vendors</p>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          onClick={() => setIsProductionOpen(!isProductionOpen)}
          className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
            pathname.includes("/production_planning") ||
            pathname === "/category" ||
            pathname.includes("/po-services") ||
            pathname.includes("/vendors") ||
            pathname.includes("/pp_not-ok")
              ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
              : ""
          }`}
        >
          <TbDeviceMobileDollar className="w-6 h-6" />
          <p>Production Planning</p>
          <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProductionOpen ? "rotate-180" : ""}`} />
        </div>

        {isProductionOpen && (
          <div className="pl-4 mb-4 flex flex-col gap-1">
            <Link href="/vendors">
              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Vendors</p>
              </div>
            </Link>

            <Link href="/vendors/outsource?filter=JOB_SERVICE">
              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Outsource</p>
              </div>
            </Link>

            <Link href="/category">
              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Category</p>
              </div>
            </Link>

            <div
              onClick={() => setIsAmarEquipmentOpen(!isAmarEquipmentOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
            >
              <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Equipment</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEquipmentOpen ? "rotate-180" : ""}`} />
            </div>

            {isAmarEquipmentOpen && (
              <div className="pl-4 flex flex-col gap-1">
                <Link href="/production_planning?filter=JOB_SERVICE&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                    <MdWorkOutline className={iconCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                    <p className={textCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                  </div>
                </Link>

                <Link href="/production_planning?filter=TSO_SERVICE&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                    <MdDesignServices className={iconCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                    <p className={textCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
                  </div>
                </Link>

                <Link href="/production_planning?filter=KANBAN&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "KANBAN")}>
                    <MdViewKanban className={iconCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "KANBAN")} />
                    <p className={textCls(pathname === "/production_planning" && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                  </div>
                </Link>

                <div
                  onClick={() => setIsPOOpen(!isPOOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">P/O</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} />
                </div>

                {isPOOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/po-services?filter=FINE">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                      </div>
                    </Link>
                    <Link href="/po-services?filter=PRESS_FLOW">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Press Flow</p>
                      </div>
                    </Link>
                  </div>
                )}

                <div
                  onClick={() => setIsNotOkAmarEquipmentOpen(!isNotOkAmarEquipmentOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Not-Ok</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isNotOkAmarEquipmentOpen ? "rotate-180" : ""}`} />
                </div>

                {isNotOkAmarEquipmentOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/pp_not-ok?filter=JOB_SERVICE&client=Amar%20Equipment">
                      <div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                        <MdWorkOutline className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                        <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok?filter=TSO_SERVICE&client=Amar%20Equipment">
                      <div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                        <MdDesignServices className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                        <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok?filter=KANBAN&client=Amar%20Equipment">
                      <div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")}>
                        <MdViewKanban className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")} />
                        <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok/welding?filter=JOB_SERVICE&client=Amar%20Equipment">
                      <div className={itemCls(isWeldingNotOkPage && client === "Amar Equipment")}>
                        <MdPrecisionManufacturing className={iconCls(isWeldingNotOkPage && client === "Amar Equipment")} />
                        <p className={textCls(isWeldingNotOkPage && client === "Amar Equipment")}>Welding</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok/vendor?filter=JOB_SERVICE&client=Amar%20Equipment">
                      <div className={itemCls(isVendorNotOkPage && client === "Amar Equipment")}>
                        <MdOutlinePeopleOutline className={iconCls(isVendorNotOkPage && client === "Amar Equipment")} />
                        <p className={textCls(isVendorNotOkPage && client === "Amar Equipment")}>Vendor</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div
              onClick={() => setIsAmarBioOpen(!isAmarBioOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
            >
              <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Bio</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
            </div>

            {isAmarBioOpen && (
              <div className="pl-4 flex flex-col gap-1">
                <Link href="/production_planning?filter=JOB_SERVICE&client=Amar%20Biosystem">
                  <div className={itemCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "JOB_SERVICE")}>
                    <MdWorkOutline className={iconCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "JOB_SERVICE")} />
                    <p className={textCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "JOB_SERVICE")}>Job Service</p>
                  </div>
                </Link>

                <Link href="/production_planning?filter=TSO_SERVICE&client=Amar%20Biosystem">
                  <div className={itemCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "TSO_SERVICE")}>
                    <MdDesignServices className={iconCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "TSO_SERVICE")} />
                    <p className={textCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "TSO_SERVICE")}>TSO Service</p>
                  </div>
                </Link>

                <Link href="/production_planning?filter=KANBAN&client=Amar%20Biosystem">
                  <div className={itemCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "KANBAN")}>
                    <MdViewKanban className={iconCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "KANBAN")} />
                    <p className={textCls(pathname === "/production_planning" && client === "Amar Bio" && filter === "KANBAN")}>Kanban</p>
                  </div>
                </Link>

                <div
                  onClick={() => setIsNotOkAmarBioOpen(!isNotOkAmarBioOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Not-Ok</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isNotOkAmarBioOpen ? "rotate-180" : ""}`} />
                </div>

                {isNotOkAmarBioOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/pp_not-ok?filter=JOB_SERVICE&client=Amar%20Biosystem">
                      <div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>
                        <MdWorkOutline className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")} />
                        <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok?filter=TSO_SERVICE&client=Amar%20Biosystem">
                      <div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>
                        <MdDesignServices className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")} />
                        <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>TSO Service</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok?filter=KANBAN&client=Amar%20Biosystem">
                      <div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")}>
                        <MdViewKanban className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")} />
                        <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok/welding?filter=JOB_SERVICE&client=Amar%20Biosystem">
                      <div className={itemCls(isWeldingNotOkPage && client === "Amar Biosystem")}>
                        <MdPrecisionManufacturing className={iconCls(isWeldingNotOkPage && client === "Amar Biosystem")} />
                        <p className={textCls(isWeldingNotOkPage && client === "Amar Biosystem")}>Welding</p>
                      </div>
                    </Link>

                    <Link href="/pp_not-ok/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem">
                      <div className={itemCls(isVendorNotOkPage && client === "Amar Biosystem")}>
                        <MdOutlinePeopleOutline className={iconCls(isVendorNotOkPage && client === "Amar Biosystem")} />
                        <p className={textCls(isVendorNotOkPage && client === "Amar Biosystem")}>Vendor</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          onClick={() => setIsProductionDropdownOpen(!isProductionDropdownOpen)}
          className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
            pathname.includes("/production") && !pathname.includes("/production_planning")
              ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
              : ""
          }`}
        >
          <MdPrecisionManufacturing className="w-6 h-6" />
          <p>Production</p>
          <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProductionDropdownOpen ? "rotate-180" : ""}`} />
        </div>

        {isProductionDropdownOpen && (
          <div className="pl-4 mb-4 flex flex-col gap-1">
            <div
              onClick={() => setIsProduction1Open(!isProduction1Open)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
            >
              <MdPrecisionManufacturing className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Production 1</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProduction1Open ? "rotate-180" : ""}`} />
            </div>

            {isProduction1Open && (
              <div className="pl-4 flex flex-col gap-1">
                <div
                  onClick={() => setIsProdAmarEquipmentOpen(!isProdAmarEquipmentOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Equipment</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarEquipmentOpen ? "rotate-180" : ""}`} />
                </div>

                {isProdAmarEquipmentOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/production_module?filter=JOB_SERVICE&client=Amar%20Equipment&urgent=true">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/Job</p>
                      </div>
                    </Link>

                    <Link href="/production_module_2?filter=TSO_SERVICE&client=Amar%20Equipment&urgent=true">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/TSO</p>
                      </div>
                    </Link>

                    <div
                      onClick={() => setIsProdAmarEqReviewOpen(!isProdAmarEqReviewOpen)}
                      className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                    >
                      <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                      <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Review</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarEqReviewOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isProdAmarEqReviewOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        <Link href="/review?filter=JOB_SERVICE&client=Amar%20Equipment">
                          <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                            <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                            <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                          </div>
                        </Link>

                        <Link href="/review?filter=TSO_SERVICE&client=Amar%20Equipment">
                          <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                            <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                            <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
                          </div>
                        </Link>

                        <Link href="/review?filter=KANBAN&client=Amar%20Equipment">
                          <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN")}>
                            <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN")} />
                            <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                          </div>
                        </Link>

                        <Link href="/review/welding?filter=JOB_SERVICE">
                          <div className={itemCls(pathname === "/review/welding" && client === "Amar Equipment")}>
                            <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Equipment")} />
                            <p className={textCls(pathname === "/review/welding" && client === "Amar Equipment")}>Welding</p>
                          </div>
                        </Link>

                        <Link href="/review/vendor?filter=JOB_SERVICE">
                          <div className={itemCls(pathname === "/review/vendor" && client === "Amar Equipment")}>
                            <MdOutlinePeopleOutline className={iconCls(pathname === "/review/vendor" && client === "Amar Equipment")} />
                            <p className={textCls(pathname === "/review/vendor" && client === "Amar Equipment")}>Vendor</p>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div
                  onClick={() => setIsProdAmarBioOpen(!isProdAmarBioOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Bio</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarBioOpen ? "rotate-180" : ""}`} />
                </div>

                {isProdAmarBioOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/production_module?filter=JOB_SERVICE&client=Amar%20Biosystem&urgent=true">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/Job</p>
                      </div>
                    </Link>

                    <Link href="/production_module_2?filter=TSO_SERVICE&client=Amar%20Biosystem&urgent=true">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/TSO</p>
                      </div>
                    </Link>

                    <div
                      onClick={() => setIsProdAmarBioReviewOpen(!isProdAmarBioReviewOpen)}
                      className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                    >
                      <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                      <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Review</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarBioReviewOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isProdAmarBioReviewOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        <Link href="/review?filter=JOB_SERVICE&client=Amar%20Bio">
                          <div className={itemCls(pathname === "/review" && client === "Amar Bio" && filter === "JOB_SERVICE")}>
                            <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Bio" && filter === "JOB_SERVICE")} />
                            <p className={textCls(pathname === "/review" && client === "Amar Bio" && filter === "JOB_SERVICE")}>Job Service</p>
                          </div>
                        </Link>

                        <Link href="/review?filter=TSO_SERVICE&client=Amar%20Bio">
                          <div className={itemCls(pathname === "/review" && client === "Amar Bio" && filter === "TSO_SERVICE")}>
                            <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Bio" && filter === "TSO_SERVICE")} />
                            <p className={textCls(pathname === "/review" && client === "Amar Bio" && filter === "TSO_SERVICE")}>TSO Service</p>
                          </div>
                        </Link>

                        <Link href="/review?filter=KANBAN&client=Amar%20Bio">
                          <div className={itemCls(pathname === "/review" && client === "Amar Bio" && filter === "KANBAN")}>
                            <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Bio" && filter === "KANBAN")} />
                            <p className={textCls(pathname === "/review" && client === "Amar Bio" && filter === "KANBAN")}>Kanban</p>
                          </div>
                        </Link>

                        <Link href="/review/welding?filter=JOB_SERVICE&client=Amar%20Bio">
                          <div className={itemCls(pathname === "/review/welding" && client === "Amar Bio")}>
                            <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Bio")} />
                            <p className={textCls(pathname === "/review/welding" && client === "Amar Bio")}>Welding</p>
                          </div>
                        </Link>

                        <Link href="/review/vendor?filter=JOB_SERVICE&client=Amar%20Bio">
                          <div className={itemCls(pathname === "/review/vendor" && client === "Amar Bio")}>
                            <MdOutlinePeopleOutline className={iconCls(pathname === "/review/vendor" && client === "Amar Bio")} />
                            <p className={textCls(pathname === "/review/vendor" && client === "Amar Bio")}>Vendor</p>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Link href="/production/production-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                <MdPrecisionManufacturing className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Production 2</p>
              </div>
            </Link>

            <Link href="/production/production-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                <MdPrecisionManufacturing className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Production 3</p>
              </div>
            </Link>
          </div>
        )}

        <div
          onClick={() => setIsQCOpen(!isQCOpen)}
          className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
            pathname.startsWith("/qc")
              ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
              : ""
          }`}
        >
          <MdPrecisionManufacturing className="w-6 h-6" />
          <p>QC</p>
          <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCOpen ? "rotate-180" : ""}`} />
        </div>

        {isQCOpen && (
          <div className="pl-4 mb-4 flex flex-col gap-1">
            <div
              onClick={() => setIsQCAmarEquipmentOpen(!isQCAmarEquipmentOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
            >
              <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Equipment</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCAmarEquipmentOpen ? "rotate-180" : ""}`} />
            </div>

            {isQCAmarEquipmentOpen && (
              <div className="pl-4 flex flex-col gap-1">
                <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                    <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                    <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                  </div>
                </Link>

                <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                    <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                    <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
                  </div>
                </Link>

                <Link href="/qc?filter=KANBAN&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>
                    <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")} />
                    <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>PO</p>
                  </div>
                </Link>

                <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/qc/welding" && client === "Amar Equipment")}>
                    <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Equipment")} />
                    <p className={textCls(pathname === "/qc/welding" && client === "Amar Equipment")}>Welding</p>
                  </div>
                </Link>

                <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Equipment">
                  <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>
                    <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Equipment")} />
                    <p className={textCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>Vendor</p>
                  </div>
                </Link>
              </div>
            )}

            <div
              onClick={() => setIsQCAmarBioOpen(!isQCAmarBioOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
            >
              <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Bio</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCAmarBioOpen ? "rotate-180" : ""}`} />
            </div>

            {isQCAmarBioOpen && (
              <div className="pl-4 flex flex-col gap-1">
                <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Bio">
                  <div className={itemCls(pathname === "/qc" && client === "Amar Bio" && filter === "JOB_SERVICE")}>
                    <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Bio" && filter === "JOB_SERVICE")} />
                    <p className={textCls(pathname === "/qc" && client === "Amar Bio" && filter === "JOB_SERVICE")}>Job Service</p>
                  </div>
                </Link>

                <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Bio">
                  <div className={itemCls(pathname === "/qc" && client === "Amar Bio" && filter === "TSO_SERVICE")}>
                    <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Bio" && filter === "TSO_SERVICE")} />
                    <p className={textCls(pathname === "/qc" && client === "Amar Bio" && filter === "TSO_SERVICE")}>TSO Service</p>
                  </div>
                </Link>

                <Link href="/qc?filter=KANBAN&client=Amar%20Bio">
                  <div className={itemCls(pathname === "/qc" && client === "Amar Bio" && filter === "KANBAN")}>
                    <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Bio" && filter === "KANBAN")} />
                    <p className={textCls(pathname === "/qc" && client === "Amar Bio" && filter === "KANBAN")}>PO</p>
                  </div>
                </Link>

                <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Bio">
                  <div className={itemCls(pathname === "/qc/welding" && client === "Amar Bio")}>
                    <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Bio")} />
                    <p className={textCls(pathname === "/qc/welding" && client === "Amar Bio")}>Welding</p>
                  </div>
                </Link>

                <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Bio">
                  <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Bio")}>
                    <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Bio")} />
                    <p className={textCls(pathname === "/qc/vendor" && client === "Amar Bio")}>Vendor</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center px-3 py-2 z-10">
        <Image src="/images/logoutIcon.svg" alt="logout Icon" width={24} height={24} />
        <div
          className="text-base font-semibold leading-normal text-[#EB5757] cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </div>
      </div>

      <Image
        src="/images/sideBarDesign.svg"
        alt="sidebar design"
        width={100}
        height={100}
        className="w-full absolute bottom-0 right-0 -mb-24"
      />
    </div>
  );
};

export default LeftSideBar;