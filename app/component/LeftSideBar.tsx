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
  MdOutlineSecurity,
  MdOutlineAdminPanelSettings,
  MdHistory,
  MdOutlineShoppingCart,
  MdOutlineCancel,
  MdCompareArrows,
  MdCheckCircleOutline,
  MdBusiness,
  MdOutlineBuild,
  MdErrorOutline,
  MdPerson,
  MdFactory,
  MdStorage,
  MdOutlineVerified,
} from "react-icons/md";
import { TbDeviceMobileDollar } from "react-icons/tb";
import { FaChevronDown, FaHistory as FaHistoryIcon } from "react-icons/fa";
import { usePathname, useSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import AxiosProvider from "../../provider/AxiosProvider";
import { useState, useEffect } from "react";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface Permission {
  id: string;
  name: string;
  description: string;
}

// Permission helper functions
const hasPermission = (permissions: Permission[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

const hasAnyPermission = (permissions: Permission[] | null, permissionNames: string[]): boolean => {
  if (!permissions) return false;
  return permissionNames.some(name => permissions.some(p => p.name === name));
};

// ============================================
// PRODUCTION USER MENU COMPONENT (FIXED)
// ============================================
const ProductionUserMenu = ({
  label,
  assignTo,
  pathname,
  client,
  filter,
  currentAssignTo,
  itemCls,
  iconCls,
  textCls,
  permissions,
}: {
  label: string;
  assignTo: string;
  pathname: string;
  client: string;
  filter: string;
  currentAssignTo: string;
  itemCls: (active: boolean) => string;
  iconCls: (active: boolean) => string;
  textCls: (active: boolean) => string;
  permissions: Permission[] | null;
}) => {
  const isActive = currentAssignTo === assignTo;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAmarEquipmentOpen, setIsAmarEquipmentOpen] = useState(false);
  const [isAmarBioOpen, setIsAmarBioOpen] = useState(false);
  const [isProdAmarEqReviewOpen, setIsProdAmarEqReviewOpen] = useState(false);
  const [isProdAmarBioReviewOpen, setIsProdAmarBioReviewOpen] = useState(false);
  const [isAmarEqPOOpen, setIsAmarEqPOOpen] = useState(false);
  const [isAmarBioPOOpen, setIsAmarBioPOOpen] = useState(false);

  // Permission-based visibility checks
  const canViewUrgentJob = hasAnyPermission(permissions, ["job.view", "job.assign"]);
  const canViewUrgentTSO = hasAnyPermission(permissions, ["tso-service.view", "tso.view", "tso.assign"]);
  const canViewKanban = hasAnyPermission(permissions, ["kanban.view"]);
  const canViewReview = hasAnyPermission(permissions, ["review.view"]);
  const canViewPO = hasAnyPermission(permissions, ["po.view", "purchase.view"]);
  
  const canViewReviewJobService = canViewReview && hasAnyPermission(permissions, ["job.view"]);
  const canViewReviewTSO = canViewReview && hasAnyPermission(permissions, ["tso-service.view", "tso.view"]);
  const canViewReviewKanban = canViewReview && hasAnyPermission(permissions, ["kanban.view"]);
  const canViewReviewWelding = canViewReview && hasAnyPermission(permissions, ["welding.view"]);
  const canViewReviewVendor = canViewReview && hasAnyPermission(permissions, ["vendors.view"]);

  // Helper functions to check active states
  const isUrgentJobActive = () => {
    return (pathname === "/section_production/production_module" && 
            filter === "JOB_SERVICE" && 
            client === "Amar Equipment" && 
            isActive);
  };

  const isUrgentTSOActive = () => {
    return (pathname === "/section_production/production_module_2" && 
            filter === "TSO_SERVICE" && 
            client === "Amar Equipment" && 
            isActive);
  };

  const isKanbanActive = () => {
    return (pathname === "/section_production/production_module_3" && 
            filter === "KANBAN" && 
            client === "Amar Equipment" && 
            isActive);
  };

  const isUrgentJobBioActive = () => {
    return (pathname === "/section_production/production_module" && 
            filter === "JOB_SERVICE" && 
            client === "Amar Biosystem" && 
            isActive);
  };

  const isUrgentTSOBioActive = () => {
    return (pathname === "/section_production/production_module_2" && 
            filter === "TSO_SERVICE" && 
            client === "Amar Biosystem" && 
            isActive);
  };

  const isKanbanBioActive = () => {
    return (pathname === "/section_production/production_module_3" && 
            filter === "KANBAN" && 
            client === "Amar Biosystem" && 
            isActive);
  };

  // Keep menus open when active
  useEffect(() => {
    if (isActive) {
      if (pathname.includes("/section_production/production_module") || pathname.startsWith("/review")) {
        setIsMenuOpen(true);
        if (client === "Amar Equipment") {
          setIsAmarEquipmentOpen(true);
          if (pathname.startsWith("/review")) {
            setIsProdAmarEqReviewOpen(true);
          }
        } else if (client === "Amar Biosystem") {
          setIsAmarBioOpen(true);
          if (pathname.startsWith("/review")) {
            setIsProdAmarBioReviewOpen(true);
          }
        }
      }
    }
  }, [pathname, client, isActive]);

  // Don't render if user has no production permissions
  if (!canViewUrgentJob && !canViewUrgentTSO && !canViewKanban && !canViewReview) {
    return null;
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMenuOpen ? "bg-sideBarHoverbg" : ""}`}
      >
        <MdFactory className={`w-5 h-5 ${isMenuOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
        <p className={`text-base font-medium ${isMenuOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>{label}</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
      </div>

      {isMenuOpen && (
        <div className="pl-4 flex flex-col gap-1">
          {/* Amar Equipment Section */}
          {(canViewUrgentJob || canViewUrgentTSO || canViewKanban || canViewReview || canViewPO) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmarEquipmentOpen(!isAmarEquipmentOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-base font-medium ${isAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEquipmentOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarEquipmentOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {/* Urgent/Job */}
                  {canViewUrgentJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Equipment&urgent=true&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentJobActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdWorkOutline className={`w-5 h-5 ${isUrgentJobActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isUrgentJobActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {/* Urgent/TSO */}
                  {canViewUrgentTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Equipment&urgent=true&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentTSOActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdDesignServices className={`w-5 h-5 ${isUrgentTSOActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isUrgentTSOActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {/* Kanban */}
                  {canViewKanban && (
                    <Link href={`/section_production/production_module_3?filter=KANBAN&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isKanbanActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdViewKanban className={`w-5 h-5 ${isKanbanActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isKanbanActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                      </div>
                    </Link>
                  )}

                  {/* P/O Section */}
                  {canViewPO && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAmarEqPOOpen(!isAmarEqPOOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEqPOOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isAmarEqPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isAmarEqPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEqPOOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isAmarEqPOOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          <Link href={`/section_production_planning/po-services?filter=FINE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                            </div>
                          </Link>
                          <Link href={`/section_production_planning/po-services?filter=PRESS_FLOW&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Press Flow</p>
                            </div>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {/* Review Section */}
                  {canViewReview && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProdAmarEqReviewOpen(!isProdAmarEqReviewOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isProdAmarEqReviewOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isProdAmarEqReviewOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isProdAmarEqReviewOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarEqReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarEqReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewReviewJobService && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>Tso Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewKanban && ( 
                            <Link href={`/review?filter=KANBAN&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)}>
                                <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)}>Kanban</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewVendor && (
                            <Link href={`/review/vendor?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/vendor" && client === "Amar Equipment" && isActive)}>
                                <MdOutlinePeopleOutline className={iconCls(pathname === "/review/vendor" && client === "Amar Equipment" && isActive)} />
                                <p className={textCls(pathname === "/review/vendor" && client === "Amar Equipment" && isActive)}>Vendor</p>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Amar Bio Section */}
          {(canViewUrgentJob || canViewUrgentTSO || canViewKanban || canViewReview || canViewPO) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmarBioOpen(!isAmarBioOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-base font-medium ${isAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarBioOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {/* Urgent/Job */}
                  {canViewUrgentJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Biosystem&urgent=true&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentJobBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdWorkOutline className={`w-5 h-5 ${isUrgentJobBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isUrgentJobBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {/* Urgent/TSO */}
                  {canViewUrgentTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Biosystem&urgent=true&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentTSOBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdDesignServices className={`w-5 h-5 ${isUrgentTSOBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isUrgentTSOBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {/* Kanban */}
                  {canViewKanban && (
                    <Link href={`/section_production/production_module_3?filter=KANBAN&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isKanbanBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdViewKanban className={`w-5 h-5 ${isKanbanBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isKanbanBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                      </div>
                    </Link>
                  )}

                  {/* P/O Section for Amar Bio */}
                  {canViewPO && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAmarBioPOOpen(!isAmarBioPOOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioPOOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isAmarBioPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isAmarBioPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioPOOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isAmarBioPOOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          <Link href={`/section_production_planning/po-services?filter=FINE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                            </div>
                          </Link>
                          <Link href={`/section_production_planning/po-services?filter=PRESS_FLOW&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Press Flow</p>
                            </div>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {/* Review Section */}
                  {canViewReview && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProdAmarBioReviewOpen(!isProdAmarBioReviewOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isProdAmarBioReviewOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isProdAmarBioReviewOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-base font-medium ${isProdAmarBioReviewOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarBioReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarBioReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewReviewJobService && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>Tso Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewKanban && (
                            <Link href={`/review?filter=KANBAN&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)}>
                                <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)}>Kanban</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewVendor && (
                            <Link href={`/review/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/vendor" && client === "Amar Biosystem" && isActive)}>
                                <MdOutlinePeopleOutline className={iconCls(pathname === "/review/vendor" && client === "Amar Biosystem" && isActive)} />
                                <p className={textCls(pathname === "/review/vendor" && client === "Amar Biosystem" && isActive)}>Vendor</p>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

// ============================================
// INVENTORY 1 SUBMENU COMPONENT (FIXED - NO AUTO CLOSE)
// ============================================
const Inventory1SubMenu = ({
  isOpen,
  setIsOpen,
  hasMaterialApprove,
  itemCls,
  iconCls,
  textCls,
  pathname,
  client,
  filter,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  hasMaterialApprove: boolean;
  itemCls: (active: boolean) => string;
  iconCls: (active: boolean) => string;
  textCls: (active: boolean) => string;
  pathname: string;
  client: string;
  filter: string;
}) => {
  const [isMaterialApprovedOpen, setIsMaterialApprovedOpen] = useState(false);
  const [isMaterialApprovedAmarOpen, setIsMaterialApprovedAmarOpen] = useState(false);
  const [isMaterialApprovedAmarBioOpen, setIsMaterialApprovedAmarBioOpen] = useState(false);

  // Keep material approved open if on related pages
  useEffect(() => {
    if (pathname.includes("/inventory_material_approve")) {
      setIsMaterialApprovedOpen(true);
      if (client === "Amar Equipment") {
        setIsMaterialApprovedAmarOpen(true);
      }
      if (client === "Amar Biosystem") {
        setIsMaterialApprovedAmarBioOpen(true);
      }
    }
  }, [pathname, client]);

  // Check if Material Data is active
  const isMaterialDataActive = pathname === "/section_inventory/inventory";
  
  // Check if specific material approve pages are active
  const isMaterialApproveJobActive = pathname === "/section_inventory/inventory_material_approve" && filter === "JOB_SERVICE" && client === "Amar Equipment";
  const isMaterialApproveTSOActive = pathname === "/section_inventory/inventory_material_approve" && filter === "TSO_SERVICE" && client === "Amar Equipment";
  const isMaterialApproveKanbanActive = pathname === "/section_inventory/inventory_material_approve" && filter === "KANBAN" && client === "Amar Equipment";
  const isMaterialApproveVendorActive = pathname === "/section_inventory/inventory_material_approve" && !filter && client === "Amar Equipment";
  
  const isMaterialApproveJobBioActive = pathname === "/section_inventory/inventory_material_approve" && filter === "JOB_SERVICE" && client === "Amar Biosystem";
  const isMaterialApproveTSOBioActive = pathname === "/section_inventory/inventory_material_approve" && filter === "TSO_SERVICE" && client === "Amar Biosystem";
  const isMaterialApproveKanbanBioActive = pathname === "/section_inventory/inventory_material_approve" && filter === "KANBAN" && client === "Amar Biosystem";
  const isMaterialApproveVendorBioActive = pathname === "/section_inventory/inventory_material_approve" && !filter && client === "Amar Biosystem";

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isOpen ? "bg-sideBarHoverbg" : ""}`}
      >
        <MdStorage className={`w-5 h-5 ${isOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
        <p className={`text-base font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Inventory 1</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          <Link href="/section_inventory/inventory" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialDataActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdStorage className={`w-5 h-5 ${isMaterialDataActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isMaterialDataActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Data</p>
            </div>
          </Link>

          {hasMaterialApprove && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaterialApprovedOpen(!isMaterialApprovedOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApprovedOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdCheckCircleOutline className={`w-5 h-5 ${isMaterialApprovedOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-base font-medium ${isMaterialApprovedOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Approved</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedOpen ? "rotate-180" : ""}`} />
              </div>

              {isMaterialApprovedOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMaterialApprovedAmarOpen(!isMaterialApprovedAmarOpen);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApprovedAmarOpen ? "bg-sideBarHoverbg" : ""}`}
                  >
                    <MdOutlinePeopleOutline className={`w-5 h-5 ${isMaterialApprovedAmarOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                    <p className={`text-base font-medium ${isMaterialApprovedAmarOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                    <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedAmarOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isMaterialApprovedAmarOpen && (
                    <div className="pl-4 flex flex-col gap-1">
                      <Link href="/section_inventory/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveJobActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdWorkOutline className={`w-5 h-5 ${isMaterialApproveJobActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveJobActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Job Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveTSOActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdDesignServices className={`w-5 h-5 ${isMaterialApproveTSOActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveTSOActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Tso Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=KANBAN&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveKanbanActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdViewKanban className={`w-5 h-5 ${isMaterialApproveKanbanActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveKanbanActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?client=Amar%20Equipment&assign_to_not=Usmaan&assign_to_not=Riyaaz&assign_to_not=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveVendorActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdBusiness className={`w-5 h-5 ${isMaterialApproveVendorActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveVendorActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendors</p>
                        </div>
                      </Link>
                    </div>
                  )}

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMaterialApprovedAmarBioOpen(!isMaterialApprovedAmarBioOpen);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApprovedAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
                  >
                    <MdOutlinePeopleOutline className={`w-5 h-5 ${isMaterialApprovedAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                    <p className={`text-base font-medium ${isMaterialApprovedAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                    <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedAmarBioOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isMaterialApprovedAmarBioOpen && (
                    <div className="pl-4 flex flex-col gap-1">
                      <Link href="/section_inventory/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveJobBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdWorkOutline className={`w-5 h-5 ${isMaterialApproveJobBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveJobBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Job Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveTSOBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdDesignServices className={`w-5 h-5 ${isMaterialApproveTSOBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveTSOBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Tso Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=KANBAN&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveKanbanBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdViewKanban className={`w-5 h-5 ${isMaterialApproveKanbanBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveKanbanBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?client=Amar%20Biosystem&assign_to_not=Usmaan&assign_to_not=Riyaaz&assign_to_not=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveVendorBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdBusiness className={`w-5 h-5 ${isMaterialApproveVendorBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-base font-medium ${isMaterialApproveVendorBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendors</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

// ============================================
// INVENTORY 2 SUBMENU COMPONENT (FIXED - NO AUTO CLOSE)
// ============================================
const Inventory2SubMenu = ({
  isOpen,
  setIsOpen,
  itemCls,
  iconCls,
  textCls,
  pathname,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  itemCls: (active: boolean) => string;
  iconCls: (active: boolean) => string;
  textCls: (active: boolean) => string;
  pathname: string;
}) => {
  // Check active states for inventory 2 pages
  const isMasterActive = pathname === "/section_inventory/inventory_2";
  const isInOutActive = pathname === "/inventory2/in-out";
  const isMaterialTransferActive = pathname === "/inventory2/material-transfer";
  const isPRActive = pathname === "/section_inventory/inventory2/pr";

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isOpen ? "bg-sideBarHoverbg" : ""}`}
      >
        <MdStorage className={`w-5 h-5 ${isOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
        <p className={`text-base font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Inventory 2</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          <Link href="/section_inventory/inventory_2" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMasterActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCategory className={`w-5 h-5 ${isMasterActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isMasterActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Master</p>
            </div>
          </Link>

          <Link href="/inventory2/in-out" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isInOutActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdOutlineSwapHoriz className={`w-5 h-5 ${isInOutActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isInOutActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>In/Out</p>
            </div>
          </Link>

          <Link href="/inventory2/material-transfer" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialTransferActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCompareArrows className={`w-5 h-5 ${isMaterialTransferActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isMaterialTransferActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Transfer</p>
            </div>
          </Link>

          <Link href="/section_inventory/inventory2/pr" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPRActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdPendingActions className={`w-5 h-5 ${isPRActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isPRActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>PR</p>
            </div>
          </Link>
        </div>
      )}
    </>
  );
};

// ============================================
// INVENTORY 3 SUBMENU COMPONENT (FIXED - NO AUTO CLOSE)
// ============================================
const Inventory3SubMenu = ({
  isOpen,
  setIsOpen,
  itemCls,
  iconCls,
  textCls,
  pathname,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  itemCls: (active: boolean) => string;
  iconCls: (active: boolean) => string;
  textCls: (active: boolean) => string;
  pathname: string;
}) => {
  // Check active states for inventory 3 pages
  const isMasterActive = pathname === "/section_inventory/inventory_3";
  const isInOutActive = pathname === "/inventory3/in-out";
  const isMaterialTransferActive = pathname === "/inventory3/material-transfer";
  const isPRActive = pathname === "/inventory3/pr";
  const isPORActive = pathname === "/inventory3/por";

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isOpen ? "bg-sideBarHoverbg" : ""}`}
      >
        <MdStorage className={`w-5 h-5 ${isOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
        <p className={`text-base font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Inventory 3</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          <Link href="/section_inventory/inventory_3" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMasterActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCategory className={`w-5 h-5 ${isMasterActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isMasterActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Master</p>
            </div>
          </Link>

          <Link href="/inventory3/in-out" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isInOutActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdOutlineSwapHoriz className={`w-5 h-5 ${isInOutActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isInOutActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>In/Out</p>
            </div>
          </Link>

          <Link href="/inventory3/material-transfer" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialTransferActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCompareArrows className={`w-5 h-5 ${isMaterialTransferActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isMaterialTransferActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Transfer</p>
            </div>
          </Link>

          <Link href="/inventory3/pr" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPRActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdPendingActions className={`w-5 h-5 ${isPRActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isPRActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>PR</p>
            </div>
          </Link>

          <Link href="/inventory3/por" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPORActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdOutlineShoppingCart className={`w-5 h-5 ${isPORActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-base font-medium ${isPORActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>POR</p>
            </div>
          </Link>
        </div>
      )}
    </>
  );
};

// ============================================
// MAIN LEFT SIDEBAR COMPONENT
// ============================================
const LeftSideBar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string>("");
  const [userRoleName, setUserRoleName] = useState<string>("");

  const permissions = storage.getUserPermissions();
  const storedUser = storage.getUser();
  
  // Get current user info
  useEffect(() => {
    const name = storage.getUserName();
    if (name) setUserName(name);
    
    if (storedUser) {
      setUserRoleName(storedUser.role?.name || "");
    }
  }, [storedUser]);
  
  // ============================================
  // MAIN MODULE PERMISSIONS
  // ============================================
  
  // Dashboard Module
  const hasDashboardView = hasPermission(permissions, "dashboard.view");
  
  // Material Movement Module
  const hasMaterialMovementView = hasPermission(permissions, "material.movement.view");
  
  // Production Planning Dashboard Module - NEW
  const hasProductionPlanningDashboardView = hasPermission(permissions, "production.planning.dashboard.view");
  
  // Inventory 1 Permissions (only view now)
  const hasInventory1View = hasPermission(permissions, "inventory1.view");
  
  // Inventory 2 Permissions (only view now)
  const hasInventory2View = hasPermission(permissions, "inventory2.view");
  
  // Inventory 3 Permissions (only view now)
  const hasInventory3View = hasPermission(permissions, "inventory3.view");
  
  // Material Approve View (uses inventory1.view)
  const hasMaterialApproveView = hasInventory1View;
  
  // Production Planning Module
  const hasProductionPlanningView = hasPermission(permissions, "production.planning.view");
  
  // Production Planning Sub-modules
  const hasVendorsView = hasPermission(permissions, "vendors.view");
  const hasOutsourceView = hasPermission(permissions, "outsource.view");
  const hasCategoryView = hasPermission(permissions, "category.view");
  const hasAmarEquipmentView = hasPermission(permissions, "amar-equipment.view");
  const hasAmarBioView = hasPermission(permissions, "amar-bio.view");
  const hasJobServiceView = hasPermission(permissions, "job-service.view");
  const hasTSOServiceView = hasPermission(permissions, "tso-service.view");
  const hasKanbanView = hasPermission(permissions, "kanban.view");
  const hasPOView = hasPermission(permissions, "po.view");
  const hasNotOkView = hasPermission(permissions, "not-ok.view");
  
  // Production Module
  const hasProduction1View = hasPermission(permissions, "production.1.view");
  const hasProduction2View = hasPermission(permissions, "production.2.view");
  const hasProduction3View = hasPermission(permissions, "production.3.view");
  const hasAnyProductionView = hasProduction1View || hasProduction2View || hasProduction3View;
  
  // QC Module
  const hasQCView = hasPermission(permissions, "qc.view");
  const hasWeldingView = hasPermission(permissions, "welding.view");
  
  // Procurement Module
  const hasProcurementView = hasPermission(permissions, "procurement.view");
  
  // User Management Module
  const hasUserManagementView = hasPermission(permissions, "user.management.view");
  
  // User Management Sub-modules
  const hasSystemUserView = hasPermission(permissions, "system.systemuser.view");
  const hasUserActivityView = hasPermission(permissions, "system.systemuser.audit");
  const hasRoleView = hasPermission(permissions, "system.masterroles.view");
  const hasPermissionView = hasPermission(permissions, "permission.view");

  const client = searchParams.get("client") || "";
  const filter = searchParams.get("filter") || "JOB_SERVICE";
  const assignTo = searchParams.get("assign_to") || "";

  const isVendorNotOkPage =
    pathname === "/section_production_planning/pp_not-ok/vendor" || pathname.startsWith("/section_production_planning/pp_not-ok/vendor");
  const isWeldingNotOkPage =
    pathname === "/section_production_planning/pp_not-ok/welding" || pathname.startsWith("/section_production_planning/pp_not-ok/welding");
  const isMainNotOkPage =
    pathname === "/section_production_planning/pp_not-ok" || (pathname.startsWith("/section_production_planning/pp_not-ok") && !isVendorNotOkPage && !isWeldingNotOkPage);

  const handleLogout = async () => {
    try {
      await axiosProvider.post("/fineengg_erp/system/logout", {});
      storage.clearAll();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      storage.clearAll();
      window.location.href = "/";
    }
  };

  // State for dropdowns - Initialize based on current path
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(pathname.includes("/section_inventory"));
  const [isInventory1Open, setIsInventory1Open] = useState<boolean>(pathname.includes("/section_inventory/inventory") || pathname.includes("/inventory_material_approve"));
  const [isInventory2Open, setIsInventory2Open] = useState<boolean>(pathname.includes("/section_inventory/inventory_2") || pathname.includes("/inventory2/"));
  const [isInventory3Open, setIsInventory3Open] = useState<boolean>(pathname.includes("/section_inventory/inventory_3") || pathname.includes("/inventory3/"));

  const [isProductionOpen, setIsProductionOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/production_planning") ||
      pathname === "/section_production_planning/category" ||
      pathname.includes("/section_production_planning/po-services") ||
      pathname.includes("/section_production_planning/vendors") ||
      pathname.includes("/section_production_planning/pp_not-ok") ||
      pathname.includes("/section_production_planning/dashboard")
  );

  const [isAmarEquipmentOpen, setIsAmarEquipmentOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/production_planning") ||
      pathname.includes("/section_production_planning/po-services") ||
      pathname.includes("/section_production_planning/pp_not-ok") ||
      (pathname.includes("/section_production/production_module") && client === "Amar Equipment") ||
      (pathname.startsWith("/review") && client === "Amar Equipment") ||
      (pathname.startsWith("/qc") && client === "Amar Equipment")
  );

  const [isAmarBioOpen, setIsAmarBioOpen] = useState<boolean>(
    (pathname.includes("/section_production_planning/production_planning") && client === "Amar Biosystem") ||
      (pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Biosystem") ||
      (pathname.includes("/section_production/production_module") && client === "Amar Biosystem") ||
      (pathname.startsWith("/review") && client === "Amar Biosystem") ||
      (pathname.startsWith("/qc") && client === "Amar Biosystem")
  );

  const [isPOOpen, setIsPOOpen] = useState<boolean>(pathname.includes("/section_production_planning/po-services"));

  const [isNotOkAmarEquipmentOpen, setIsNotOkAmarEquipmentOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Equipment"
  );
  const [isNotOkAmarBioOpen, setIsNotOkAmarBioOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Biosystem"
  );

  const [isProductionDropdownOpen, setIsProductionDropdownOpen] = useState<boolean>(
    (pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")) ||
    pathname.startsWith("/review")
  );

  const [isQCOpen, setIsQCOpen] = useState<boolean>(pathname.startsWith("/qc"));
  const [isQCAmarEquipmentOpen, setIsQCAmarEquipmentOpen] = useState<boolean>(pathname.startsWith("/qc") && client === "Amar Equipment");
  const [isQCAmarBioOpen, setIsQCAmarBioOpen] = useState<boolean>(pathname.startsWith("/qc") && client === "Amar Biosystem");

  const [isProcurementOpen, setIsProcurementOpen] = useState<boolean>(pathname.startsWith("/procurement"));
  const [isPROpen, setIsPROpen] = useState<boolean>(pathname.startsWith("/procurement/pr"));
  const [isRejectedPOOpen, setIsRejectedPOOpen] = useState<boolean>(
    pathname.startsWith("/procurement/rejected-po")
  );

  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(
    pathname.includes("/user-management") || 
    pathname.includes("/user-activity") || 
    pathname.includes("/role-management") ||
    pathname.includes("/permission-management")
  );

  // NEW: Vendor dropdown states
  const [isVendorOpen, setIsVendorOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/vendors/outgoing") || 
    pathname.includes("/section_production_planning/vendors/incoming")
  );

  // Keep dropdowns open when on related pages
  useEffect(() => {
    if (pathname.startsWith("/qc")) {
      setIsQCOpen(true);
      if (client === "Amar Equipment") setIsQCAmarEquipmentOpen(true);
      if (client === "Amar Biosystem") setIsQCAmarBioOpen(true);
    }

    if (pathname.startsWith("/procurement")) {
      setIsProcurementOpen(true);
      if (pathname.includes("/pr")) setIsPROpen(true);
      if (pathname.includes("/rejected-po")) setIsRejectedPOOpen(true);
    }

    if (pathname.startsWith("/section_production_planning/pp_not-ok")) {
      setIsProductionOpen(true);

      if (client === "Amar Equipment") {
        setIsAmarEquipmentOpen(true);
        setIsNotOkAmarEquipmentOpen(true);
      }

      if (client === "Amar Biosystem") {
        setIsAmarBioOpen(true);
        setIsNotOkAmarBioOpen(true);
      }
    }

    if (pathname.startsWith("/review")) {
      setIsProductionDropdownOpen(true);
      if (client === "Amar Equipment") {
        setIsAmarEquipmentOpen(true);
      } else if (client === "Amar Biosystem") {
        setIsAmarBioOpen(true);
      }
    }

    if (pathname.includes("/user-management") || 
        pathname.includes("/user-activity") || 
        pathname.includes("/role-management") ||
        pathname.includes("/permission-management")) {
      setIsUserManagementOpen(true);
    }

    if (pathname.includes("/section_inventory")) {
      setIsInventoryOpen(true);
    }

    if (pathname.includes("/section_inventory/inventory") || pathname.includes("/inventory_material_approve")) {
      setIsInventory1Open(true);
    }

    if (pathname.includes("/section_inventory/inventory_2") || pathname.includes("/inventory2/")) {
      setIsInventory2Open(true);
    }

    if (pathname.includes("/section_inventory/inventory_3") || pathname.includes("/inventory3/")) {
      setIsInventory3Open(true);
    }

    if (pathname.includes("/section_production_planning/production_planning") ||
        pathname === "/section_production_planning/category" ||
        pathname.includes("/section_production_planning/po-services") ||
        pathname.includes("/section_production_planning/vendors") ||
        pathname.includes("/section_production_planning/pp_not-ok") ||
        pathname.includes("/section_production_planning/dashboard")) {
      setIsProductionOpen(true);
    }

    if ((pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")) ||
        pathname.startsWith("/review")) {
      setIsProductionDropdownOpen(true);
    }

    // Keep vendor dropdowns open
    if (pathname.includes("/section_production_planning/vendor")) {
      if (client === "Amar Equipment") setIsVendorOpen(true);
      // if (client === "Amar Biosystem") setIsVendorBioOpen(true);
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

  const hasAnyInventoryView = hasInventory1View || hasInventory2View || hasInventory3View;

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

        {/* User Info */}
        {userName && (
          <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="font-semibold text-primary-600">{userName}</p>
            <p className="text-xs text-gray-500">Role: {userRoleName || "User"}</p>
          </div>
        )}

        {/* Dashboard */}
        {hasDashboardView && (
          <Link href="/dashboard">
            <div
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname === "/dashboard"
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineDashboard className={`w-6 h-6 ${pathname === "/dashboard" ? "text-white" : "group-hover:text-primary-600"}`} />
              <p>Dashboard</p>
            </div>
          </Link>
        )}

        {/* Material Movement */}
        {hasMaterialMovementView && (
          <Link href="/material-movement">
            <div
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname === "/material-movement"
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineSwapHoriz className={`w-6 h-6 ${pathname === "/material-movement" ? "text-white" : "group-hover:text-primary-600"}`} />
              <p>Material Movement</p>
            </div>
          </Link>
        )}

        {/* Inventory Section */}
        {hasAnyInventoryView && (
          <>
            <div
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname.includes("/section_inventory")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineInventory2 className={`w-6 h-6 ${pathname.includes("/section_inventory") ? "text-white" : "group-hover:text-primary-600"}`} />
              <p>Inventory</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isInventoryOpen ? "rotate-180" : ""} ${pathname.includes("/section_inventory") ? "text-white" : ""}`} />
            </div>

            {isInventoryOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {/* Inventory 1 */}
                {hasInventory1View && (
                  <Inventory1SubMenu
                    isOpen={isInventory1Open}
                    setIsOpen={setIsInventory1Open}
                    hasMaterialApprove={hasMaterialApproveView}
                    itemCls={itemCls}
                    iconCls={iconCls}
                    textCls={textCls}
                    pathname={pathname}
                    client={client}
                    filter={filter}
                  />
                )}

                {/* Inventory 2 */}
                {hasInventory2View && (
                  <Inventory2SubMenu
                    isOpen={isInventory2Open}
                    setIsOpen={setIsInventory2Open}
                    itemCls={itemCls}
                    iconCls={iconCls}
                    textCls={textCls}
                    pathname={pathname}
                  />
                )}

                {/* Inventory 3 */}
                {hasInventory3View && (
                  <Inventory3SubMenu
                    isOpen={isInventory3Open}
                    setIsOpen={setIsInventory3Open}
                    itemCls={itemCls}
                    iconCls={iconCls}
                    textCls={textCls}
                    pathname={pathname}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Production Planning Section */}
        {hasProductionPlanningView && (
          <>
            <div
              onClick={() => setIsProductionOpen(!isProductionOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname.includes("/section_production_planning/production_planning") ||
                pathname === "/section_production_planning/category" ||
                pathname.includes("/section_production_planning/po-services") ||
                pathname.includes("/section_production_planning/vendors") ||
                pathname.includes("/section_production_planning/pp_not-ok") ||
                pathname.includes("/section_production_planning/dashboard")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineBuild className="w-6 h-6" />
              <p>Production Planning</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProductionOpen ? "rotate-180" : ""}`} />
            </div>

            {isProductionOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {/* Production Planning Dashboard - NEW */}
                {hasProductionPlanningDashboardView && (
                  <Link href="/section_production_planning/dashboard">
                    <div className={itemCls(pathname === "/section_production_planning/dashboard")}>
                      <MdOutlineDashboard className={iconCls(pathname === "/section_production_planning/dashboard")} />
                      <p className={textCls(pathname === "/section_production_planning/dashboard")}>Dashboard</p>
                    </div>
                  </Link>
                )}

                {/* Vendors */}
                {hasVendorsView && (
                  <>
                    {/* Vendor for Amar Equipment */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVendorOpen(!isVendorOpen);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isVendorOpen ? "bg-sideBarHoverbg" : ""}`}
                    >
                      <MdBusiness className={`w-5 h-5 ${isVendorOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-base font-medium ${isVendorOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendor</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isVendorOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isVendorOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        <Link href="/section_production_planning/vendors/outgoing">
                          <div className={itemCls(pathname === "/section_production_planning/vendor/outgoing" && client === "Amar Equipment")}>
                            <MdOutlineSwapHoriz className={iconCls(pathname === "/section_production_planning/vendor/outgoing" && client === "Amar Equipment")} />
                            <p className={textCls(pathname === "/section_production_planning/vendor/outgoing" && client === "Amar Equipment")}>Outgoing</p>
                          </div>
                        </Link>
                        <Link href="/section_production_planning/vendors/incoming">
                          <div className={itemCls(pathname === "/section_production_planning/vendor/incoming" && client === "Amar Equipment")}>
                            <MdOutlineSwapHoriz className={iconCls(pathname === "/section_production_planning/vendor/incoming" && client === "Amar Equipment")} />
                            <p className={textCls(pathname === "/section_production_planning/vendor/incoming" && client === "Amar Equipment")}>Incoming</p>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Vendor for Amar Bio */}
                    {/* <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVendorBioOpen(!isVendorBioOpen);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isVendorBioOpen ? "bg-sideBarHoverbg" : ""}`}
                    >
                      <MdBusiness className={`w-5 h-5 ${isVendorBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-base font-medium ${isVendorBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendor</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isVendorBioOpen ? "rotate-180" : ""}`} />
                    </div> */}

                    {/* {isVendorBioOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        <Link href="/section_production_planning/vendor/outgoing?client=Amar%20Biosystem">
                          <div className={itemCls(pathname === "/section_production_planning/vendor/outgoing" && client === "Amar Biosystem")}>
                            <MdOutlineSwapHoriz className={iconCls(pathname === "/section_production_planning/vendor/outgoing" && client === "Amar Biosystem")} />
                            <p className={textCls(pathname === "/section_production_planning/vendor/outgoing" && client === "Amar Biosystem")}>Outgoing</p>
                          </div>
                        </Link>
                        <Link href="/section_production_planning/vendor/incoming?client=Amar%20Biosystem">
                          <div className={itemCls(pathname === "/section_production_planning/vendor/incoming" && client === "Amar Biosystem")}>
                            <MdOutlineSwapHoriz className={iconCls(pathname === "/section_production_planning/vendor/incoming" && client === "Amar Biosystem")} />
                            <p className={textCls(pathname === "/section_production_planning/vendor/incoming" && client === "Amar Biosystem")}>Incoming</p>
                          </div>
                        </Link>
                      </div>
                    )} */}
                  </>
                )}

                {/* Outsource */}
                {hasOutsourceView && (
                  <Link href="/section_production_planning/vendors/outsource">
                    <div className={itemCls(pathname === "/section_production_planning/vendors/outsource")}>
                      <MdPendingActions className={iconCls(pathname === "/section_production_planning/vendors/outsource")} />
                      <p className={textCls(pathname === "/section_production_planning/vendors/outsource")}>Outsource</p>
                    </div>
                  </Link>
                )}

                {/* Category */}
                {hasCategoryView && (
                  <Link href="/section_production_planning/category">
                    <div className={itemCls(pathname === "/section_production_planning/category")}>
                      <MdCategory className={iconCls(pathname === "/section_production_planning/category")} />
                      <p className={textCls(pathname === "/section_production_planning/category")}>Category</p>
                    </div>
                  </Link>
                )}

                {/* Amar Equipment Section */}
                {hasAmarEquipmentView && (
                  <>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAmarEquipmentOpen(!isAmarEquipmentOpen);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
                    >
                      <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-base font-medium ${isAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEquipmentOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isAmarEquipmentOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        {/* Job Service */}
                        {hasJobServiceView && (
                          <Link href="/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Equipment">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                              <MdWorkOutline className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                            </div>
                          </Link>
                        )}

                        {/* TSO Service */}
                        {hasTSOServiceView && (
                          <Link href="/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Equipment">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                              <MdDesignServices className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>Tso Service</p>
                            </div>
                          </Link>
                        )}

                        {/* Kanban */}
                        {hasKanbanView && (
                          <Link href="/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Equipment">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "KANBAN")}>
                              <MdViewKanban className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "KANBAN")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                            </div>
                          </Link>
                        )}

                        {/* P/O */}
                        {hasPOView && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPOOpen(!isPOOpen);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPOOpen ? "bg-sideBarHoverbg" : ""}`}
                          >
                            <MdPendingActions className={`w-5 h-5 ${isPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                            <p className={`text-base font-medium ${isPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p>
                            <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} />
                          </div>
                        )}

                        {hasPOView && isPOOpen && (
                          <div className="pl-4 flex flex-col gap-1">
                            <Link href={`/section_production_planning/po-services?filter=Riyaaz&client=Amar%20Equipment`}>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Riyaaz</p>
                              </div>
                            </Link>
                            <Link href={`/section_production_planning/po-services?filter=Ramzaan&client=Amar%20Equipment`}>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Ramzaan</p>
                              </div>
                            </Link>
                          </div>
                        )}
                        {hasWeldingView && (
                
                    <Link href="/section_production_planning/welding?client=Amar%20Equipment">
                      <div className={itemCls(pathname === "/section_production_planning/welding" && client === "Amar Equipment")}>
                        <MdPrecisionManufacturing className={iconCls(pathname === "/section_production_planning/welding" && client === "Amar Equipment")} />
                        <p className={textCls(pathname === "/section_production_planning/welding" && client === "Amar Equipment")}>Welding</p>
                      </div>
                    </Link>
                    )}

                        {/* Not-Ok */}
                        {hasNotOkView && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsNotOkAmarEquipmentOpen(!isNotOkAmarEquipmentOpen);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isNotOkAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
                          >
                            <MdErrorOutline className={`w-5 h-5 ${isNotOkAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                            <p className={`text-base font-medium ${isNotOkAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Not-Ok</p>
                            <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isNotOkAmarEquipmentOpen ? "rotate-180" : ""}`} />
                          </div>
                        )}

                        {hasNotOkView && isNotOkAmarEquipmentOpen && (
                          <div className="pl-4 flex flex-col gap-1">
                            <Link href="/section_production_planning/pp_not-ok?filter=JOB_SERVICE&client=Amar%20Equipment">
                              <div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                                <MdWorkOutline className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                                <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok?filter=TSO_SERVICE&client=Amar%20Equipment">
                              <div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                                <MdDesignServices className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                                <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}>Tso Service</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok?filter=KANBAN&client=Amar%20Equipment">
                              <div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")}>
                                <MdViewKanban className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")} />
                                <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok/welding?filter=JOB_SERVICE&client=Amar%20Equipment">
                              <div className={itemCls(isWeldingNotOkPage && client === "Amar Equipment")}>
                                <MdPrecisionManufacturing className={iconCls(isWeldingNotOkPage && client === "Amar Equipment")} />
                                <p className={textCls(isWeldingNotOkPage && client === "Amar Equipment")}>Welding</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok/vendor?filter=JOB_SERVICE&client=Amar%20Equipment">
                              <div className={itemCls(isVendorNotOkPage && client === "Amar Equipment")}>
                                <MdOutlinePeopleOutline className={iconCls(isVendorNotOkPage && client === "Amar Equipment")} />
                                <p className={textCls(isVendorNotOkPage && client === "Amar Equipment")}>Vendor</p>
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Amar Bio Section - Similar structure */}
                {hasAmarBioView && (
                  <>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAmarBioOpen(!isAmarBioOpen);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
                    >
                      <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-base font-medium ${isAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
                    </div>

                    {isAmarBioOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        {/* Job Service */}
                        {hasJobServiceView && (
                          <Link href="/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Biosystem">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>
                              <MdWorkOutline className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "JOB_SERVICE")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p>
                            </div>
                          </Link>
                        )}

                        {/* TSO Service */}
                        {hasTSOServiceView && (
                          <Link href="/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Biosystem">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>
                              <MdDesignServices className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "TSO_SERVICE")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>Tso Service</p>
                            </div>
                          </Link>
                        )}

                        {/* Kanban */}
                        {hasKanbanView && (
                          <Link href="/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Biosystem">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "KANBAN")}>
                              <MdViewKanban className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "KANBAN")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p>
                            </div>
                          </Link>
                        )}

                        {/* P/O */}
                        {hasPOView && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPOOpen(!isPOOpen);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPOOpen ? "bg-sideBarHoverbg" : ""}`}
                          >
                            <MdPendingActions className={`w-5 h-5 ${isPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                            <p className={`text-base font-medium ${isPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p>
                            <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} />
                          </div>
                        )}

                        {hasPOView && isPOOpen && (
                          <div className="pl-4 flex flex-col gap-1">
                            <Link href={`/section_production_planning/po-services?filter=Riyaaz&client=Amar%20Biosystem`}>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Riyaaz</p>
                              </div>
                            </Link>
                            <Link href={`/section_production_planning/po-services?filter=Ramzaan&client=Amar%20Biosystem`}>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Ramzaan</p>
                              </div>
                            </Link>
                          </div>
                        )}
                        {hasWeldingView && (
                  
                  <Link href="/section_production_planning/welding?client=Amar%20Biosystem">
                    <div className={itemCls(pathname === "/section_production_planning/welding" && client === "Amar Biosystem")}>
                      <MdPrecisionManufacturing className={iconCls(pathname === "/section_production_planning/welding" && client === "Amar Biosystem")} />
                      <p className={textCls(pathname === "/section_production_planning/welding" && client === "Amar Biosystem")}>Welding</p>
                    </div>
                  </Link>
               
              )}

                        {/* Not-Ok */}
                        {hasNotOkView && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsNotOkAmarBioOpen(!isNotOkAmarBioOpen);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isNotOkAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
                          >
                            <MdErrorOutline className={`w-5 h-5 ${isNotOkAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                            <p className={`text-base font-medium ${isNotOkAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Not-Ok</p>
                            <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isNotOkAmarBioOpen ? "rotate-180" : ""}`} />
                          </div>
                        )}

                        {hasNotOkView && isNotOkAmarBioOpen && (
                          <div className="pl-4 flex flex-col gap-1">
                            <Link href="/section_production_planning/pp_not-ok?filter=JOB_SERVICE&client=Amar%20Biosystem">
                              <div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>
                                <MdWorkOutline className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")} />
                                <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok?filter=TSO_SERVICE&client=Amar%20Biosystem">
                              <div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>
                                <MdDesignServices className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")} />
                                <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>Tso Service</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok?filter=KANBAN&client=Amar%20Biosystem">
                              <div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")}>
                                <MdViewKanban className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")} />
                                <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok/welding?filter=JOB_SERVICE&client=Amar%20Biosystem">
                              <div className={itemCls(isWeldingNotOkPage && client === "Amar Biosystem")}>
                                <MdPrecisionManufacturing className={iconCls(isWeldingNotOkPage && client === "Amar Biosystem")} />
                                <p className={textCls(isWeldingNotOkPage && client === "Amar Biosystem")}>Welding</p>
                              </div>
                            </Link>

                            <Link href="/section_production_planning/pp_not-ok/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem">
                              <div className={itemCls(isVendorNotOkPage && client === "Amar Biosystem")}>
                                <MdOutlinePeopleOutline className={iconCls(isVendorNotOkPage && client === "Amar Biosystem")} />
                                <p className={textCls(isVendorNotOkPage && client === "Amar Biosystem")}>Vendor</p>
                              </div>
                            </Link>
                          </div>
                        )}
                           
                        
                      </div>
                    )}
                  </>
                )}

                {/* ============================================ */}
                {/* NEW - WELDING SECTION */}
                {/* ============================================ */}
               

                {/* ============================================ */}
                {/* NEW - VENDOR SECTION WITH OUTGOING/INCOMING */}
                {/* ============================================ */}
                
              </div>
            )}
          </>
        )}

        {/* Production Section */}
        {hasAnyProductionView && (
          <>
            <div
              onClick={() => setIsProductionDropdownOpen(!isProductionDropdownOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                (pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")) ||
                pathname.startsWith("/review")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdPrecisionManufacturing className="w-6 h-6" />
              <p>Production</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProductionDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {isProductionDropdownOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {/* Production 1 */}
                {hasProduction1View && (
                  <ProductionUserMenu 
                    label="Production 1" 
                    assignTo="Usmaan" 
                    pathname={pathname}
                    client={client} 
                    filter={filter} 
                    currentAssignTo={assignTo} 
                    itemCls={itemCls} 
                    iconCls={iconCls} 
                    textCls={textCls}
                    permissions={permissions}
                  />
                )}
                
                {/* Production 2 */}
                {hasProduction2View && (
                  <ProductionUserMenu 
                    label="Production 2" 
                    assignTo="Riyaaz" 
                    pathname={pathname}
                    client={client} 
                    filter={filter} 
                    currentAssignTo={assignTo} 
                    itemCls={itemCls} 
                    iconCls={iconCls} 
                    textCls={textCls}
                    permissions={permissions}
                  />
                )}
                
                {/* Production 3 */}
                {hasProduction3View && (
                  <ProductionUserMenu 
                    label="Production 3" 
                    assignTo="Ramzaan" 
                    pathname={pathname}
                    client={client} 
                    filter={filter} 
                    currentAssignTo={assignTo} 
                    itemCls={itemCls} 
                    iconCls={iconCls} 
                    textCls={textCls}
                    permissions={permissions}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* QC Section */}
        {hasQCView && (
          <>
            <div
              onClick={() => setIsQCOpen(!isQCOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname.startsWith("/qc")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineVerified className="w-6 h-6" />
              <p>QC</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCOpen ? "rotate-180" : ""}`} />
            </div>

            {isQCOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsQCAmarEquipmentOpen(!isQCAmarEquipmentOpen);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isQCAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
                >
                  <MdOutlinePeopleOutline className={`w-5 h-5 ${isQCAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                  <p className={`text-base font-medium ${isQCAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCAmarEquipmentOpen ? "rotate-180" : ""}`} />
                </div>

                {isQCAmarEquipmentOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    {  (
                      <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                          <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                        </div>
                      </Link>
                    )}

                    {  (
                      <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                          <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>Tso Service</p>
                        </div>
                      </Link>
                    )}

                    {  (
                      <Link href="/qc?filter=KANBAN&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>
                          <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                        </div>
                      </Link>
                    )}

                    {  (
                      <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc/welding" && client === "Amar Equipment")}>
                          <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Equipment")} />
                          <p className={textCls(pathname === "/qc/welding" && client === "Amar Equipment")}>Welding</p>
                        </div>
                      </Link>
                    )}

                    {  (
                      <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>
                          <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Equipment")} />
                          <p className={textCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>Vendor</p>
                        </div>
                      </Link>
                    )}
                  </div>
                )}

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsQCAmarBioOpen(!isQCAmarBioOpen);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isQCAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
                >
                  <MdOutlinePeopleOutline className={`w-5 h-5 ${isQCAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                  <p className={`text-base font-medium ${isQCAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCAmarBioOpen ? "rotate-180" : ""}`} />
                </div>

                {isQCAmarBioOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    { (
                      <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>
                          <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p>
                        </div>
                      </Link>
                    )}

                    { (
                      <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>
                          <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>Tso Service</p>
                        </div>
                      </Link>
                    )}

                    { (
                      <Link href="/qc?filter=KANBAN&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")}>
                          <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p>
                        </div>
                      </Link>
                    )}

                    { (
                      <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc/welding" && client === "Amar Biosystem")}>
                          <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Biosystem")} />
                          <p className={textCls(pathname === "/qc/welding" && client === "Amar Biosystem")}>Welding</p>
                        </div>
                      </Link>
                    )}

                    {  (
                      <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                        <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Biosystem")}>
                          <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Biosystem")} />
                          <p className={textCls(pathname === "/qc/vendor" && client === "Amar Biosystem")}>Vendor</p>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Procurement Section */}
        {hasProcurementView && (
          <>
            <div
              onClick={() => setIsProcurementOpen(!isProcurementOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname.startsWith("/procurement")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineShoppingCart className="w-6 h-6" />
              <p>Procurement</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProcurementOpen ? "rotate-180" : ""}`} />
            </div>

            {isProcurementOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                <Link href="/procurement/dashboard" onClick={(e) => e.stopPropagation()}>
                  <div className={itemCls(pathname === "/procurement/dashboard")}>
                    <MdOutlineDashboard className={iconCls(pathname === "/procurement/dashboard")} />
                    <p className={textCls(pathname === "/procurement/dashboard")}>Procurement Dashboard</p>
                  </div>
                </Link>
                <Link href="/procurement/master" onClick={(e) => e.stopPropagation()}>
                  <div className={itemCls(pathname === "/procurement/master")}>
                    <MdCategory className={iconCls(pathname === "/procurement/master")} />
                    <p className={textCls(pathname === "/procurement/master")}>Master</p>
                  </div>
                </Link>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPROpen(!isPROpen);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPROpen ? "bg-sideBarHoverbg" : ""}`}
                >
                  <MdPendingActions className={`w-5 h-5 ${isPROpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                  <p className={`text-base font-medium ${isPROpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>PR</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPROpen ? "rotate-180" : ""}`} />
                </div>

                {isPROpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/procurement/pr/inventory2" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/procurement/pr/inventory2")}>
                        <MdPendingActions className={iconCls(pathname === "/procurement/pr/inventory2")} />
                        <p className={textCls(pathname === "/procurement/pr/inventory2")}>Inventory 2 PR</p>
                      </div>
                    </Link>
                    <Link href="/procurement/pr/inventory3" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/procurement/pr/inventory3")}>
                        <MdPendingActions className={iconCls(pathname === "/procurement/pr/inventory3")} />
                        <p className={textCls(pathname === "/procurement/pr/inventory3")}>Inventory 3 PR</p>
                      </div>
                    </Link>
                  </div>
                )}

                <Link href="/procurement/po" onClick={(e) => e.stopPropagation()}>
                  <div className={itemCls(pathname === "/procurement/po")}>
                    <MdWorkOutline className={iconCls(pathname === "/procurement/po")} />
                    <p className={textCls(pathname === "/procurement/po")}>PO</p>
                  </div>
                </Link>
                <Link href="/procurement/reports" onClick={(e) => e.stopPropagation()}>
                  <div className={itemCls(pathname === "/procurement/reports")}>
                    <MdHistory className={iconCls(pathname === "/procurement/reports")} />
                    <p className={textCls(pathname === "/procurement/reports")}>Reports</p>
                  </div>
                </Link>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRejectedPOOpen(!isRejectedPOOpen);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isRejectedPOOpen ? "bg-sideBarHoverbg" : ""}`}
                >
                  <MdOutlineCancel className={`w-5 h-5 ${isRejectedPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                  <p className={`text-base font-medium ${isRejectedPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Rejected PO</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isRejectedPOOpen ? "rotate-180" : ""}`} />
                </div>

                {isRejectedPOOpen && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/procurement/rejected-po/inventory2" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/procurement/rejected-po/inventory2")}>
                        <MdOutlineInventory2 className={iconCls(pathname === "/procurement/rejected-po/inventory2")} />
                        <p className={textCls(pathname === "/procurement/rejected-po/inventory2")}>Inventory 2</p>
                      </div>
                    </Link>
                    <Link href="/procurement/rejected-po/inventory3" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/procurement/rejected-po/inventory3")}>
                        <MdOutlineInventory2 className={iconCls(pathname === "/procurement/rejected-po/inventory3")} />
                        <p className={textCls(pathname === "/procurement/rejected-po/inventory3")}>Inventory 3</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* User Management Section */}
        {hasUserManagementView && (
          <>
            <div
              onClick={() => setIsUserManagementOpen(!isUserManagementOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium ${
                pathname.includes("/user-management") || 
                pathname.includes("/user-activity") || 
                pathname.includes("/role-management") ||
                pathname.includes("/permission-management")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
              }`}
            >
              <MdOutlineAdminPanelSettings className="w-6 h-6" />
              <p>User Management</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isUserManagementOpen ? "rotate-180" : ""}`} />
            </div>

            {isUserManagementOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {hasSystemUserView && (
                  <Link href="/user-management" onClick={(e) => e.stopPropagation()}>
                    <div className={itemCls(pathname === "/user-management")}>
                      <MdOutlinePeopleOutline className={iconCls(pathname === "/user-management")} />
                      <p className={textCls(pathname === "/user-management")}>Manage Users</p>
                    </div>
                  </Link>
                )}

                {hasUserActivityView && (
                  <Link href="/user-activity" onClick={(e) => e.stopPropagation()}>
                    <div className={itemCls(pathname === "/user-activity")}>
                      <FaHistoryIcon className={iconCls(pathname === "/user-activity")} />
                      <p className={textCls(pathname === "/user-activity")}>User Activity</p>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </>
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