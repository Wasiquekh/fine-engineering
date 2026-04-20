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
// PRODUCTION 1 USER MENU COMPONENT
// ============================================
const Production1UserMenu = ({
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

  // Production 1 specific permissions (No Kanban, No PO)
  const canViewEqpJob = hasPermission(permissions, "production1.eqp.job.view");
  const canViewEqpTSO = hasPermission(permissions, "production1.eqp.tso.view");
  const canViewEqpReview = hasPermission(permissions, "production1.eqp.review.view");
  const canViewEqpReviewJob = hasPermission(permissions, "production1.eqp.review.job.view");
  const canViewEqpReviewTSO = hasPermission(permissions, "production1.eqp.review.tso.view");
  const canViewEqpReviewWelding = hasPermission(permissions, "production1.eqp.review.welding.view");
  const canViewEqpReviewVendor = hasPermission(permissions, "production1.eqp.review.vendor.view");
  
  const canViewBioJob = hasPermission(permissions, "production1.bio.job.view");
  const canViewBioTSO = hasPermission(permissions, "production1.bio.tso.view");
  const canViewBioReview = hasPermission(permissions, "production1.bio.review.view");
  const canViewBioReviewJob = hasPermission(permissions, "production1.bio.review.job.view");
  const canViewBioReviewTSO = hasPermission(permissions, "production1.bio.review.tso.view");
  const canViewBioReviewWelding = hasPermission(permissions, "production1.bio.review.welding.view");
  const canViewBioReviewVendor = hasPermission(permissions, "production1.bio.review.vendor.view");

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

  if (!canViewEqpJob && !canViewEqpTSO && !canViewEqpReview && !canViewBioJob && !canViewBioTSO && !canViewBioReview) {
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
        <p className={`text-sm font-medium ${isMenuOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>{label}</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
      </div>

      {isMenuOpen && (
        <div className="pl-4 flex flex-col gap-1">
          {/* Amar Equipment Section */}
          {(canViewEqpJob || canViewEqpTSO || canViewEqpReview) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmarEquipmentOpen(!isAmarEquipmentOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-sm font-medium ${isAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEquipmentOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarEquipmentOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {canViewEqpJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentJobActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdWorkOutline className={`w-5 h-5 ${isUrgentJobActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentJobActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {canViewEqpTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentTSOActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdDesignServices className={`w-5 h-5 ${isUrgentTSOActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentTSOActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {canViewEqpReview && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProdAmarEqReviewOpen(!isProdAmarEqReviewOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isProdAmarEqReviewOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isProdAmarEqReviewOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isProdAmarEqReviewOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarEqReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarEqReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewEqpReviewJob && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>Tso Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewVendor && (
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
          {(canViewBioJob || canViewBioTSO || canViewBioReview) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmarBioOpen(!isAmarBioOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-sm font-medium ${isAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarBioOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {canViewBioJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentJobBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdWorkOutline className={`w-5 h-5 ${isUrgentJobBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentJobBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {canViewBioTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentTSOBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdDesignServices className={`w-5 h-5 ${isUrgentTSOBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentTSOBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {canViewBioReview && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProdAmarBioReviewOpen(!isProdAmarBioReviewOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isProdAmarBioReviewOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isProdAmarBioReviewOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isProdAmarBioReviewOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarBioReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarBioReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewBioReviewJob && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>Tso Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewVendor && (
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
// PRODUCTION 2 & 3 USER MENU COMPONENT (With Kanban & PO)
// ============================================
const Production23UserMenu = ({
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
  prodNumber,
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
  prodNumber: string;
}) => {
  const isActive = currentAssignTo === assignTo;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAmarEquipmentOpen, setIsAmarEquipmentOpen] = useState(false);
  const [isAmarBioOpen, setIsAmarBioOpen] = useState(false);
  const [isProdAmarEqReviewOpen, setIsProdAmarEqReviewOpen] = useState(false);
  const [isProdAmarBioReviewOpen, setIsProdAmarBioReviewOpen] = useState(false);
  const [isAmarEqPOOpen, setIsAmarEqPOOpen] = useState(false);
  const [isAmarBioPOOpen, setIsAmarBioPOOpen] = useState(false);

  // Production 2/3 specific permissions (With Kanban & PO)
  const canViewEqpJob = hasPermission(permissions, `${prodNumber}.eqp.job.view`);
  const canViewEqpTSO = hasPermission(permissions, `${prodNumber}.eqp.tso.view`);
  const canViewEqpKanban = hasPermission(permissions, `${prodNumber}.eqp.kanban.view`);
  const canViewEqpPO = hasPermission(permissions, `${prodNumber}.eqp.po.view`);
  const canViewEqpReview = hasPermission(permissions, `${prodNumber}.eqp.review.view`);
  const canViewEqpReviewJob = hasPermission(permissions, `${prodNumber}.eqp.review.job.view`);
  const canViewEqpReviewTSO = hasPermission(permissions, `${prodNumber}.eqp.review.tso.view`);
  const canViewEqpReviewKanban = hasPermission(permissions, `${prodNumber}.eqp.review.kanban.view`);
  const canViewEqpReviewPO = hasPermission(permissions, `${prodNumber}.eqp.review.po.view`);
  const canViewEqpReviewWelding = hasPermission(permissions, `${prodNumber}.eqp.review.welding.view`);
  const canViewEqpReviewVendor = hasPermission(permissions, `${prodNumber}.eqp.review.vendor.view`);
  
  const canViewBioJob = hasPermission(permissions, `${prodNumber}.bio.job.view`);
  const canViewBioTSO = hasPermission(permissions, `${prodNumber}.bio.tso.view`);
  const canViewBioKanban = hasPermission(permissions, `${prodNumber}.bio.kanban.view`);
  const canViewBioPO = hasPermission(permissions, `${prodNumber}.bio.po.view`);
  const canViewBioReview = hasPermission(permissions, `${prodNumber}.bio.review.view`);
  const canViewBioReviewJob = hasPermission(permissions, `${prodNumber}.bio.review.job.view`);
  const canViewBioReviewTSO = hasPermission(permissions, `${prodNumber}.bio.review.tso.view`);
  const canViewBioReviewKanban = hasPermission(permissions, `${prodNumber}.bio.review.kanban.view`);
  const canViewBioReviewPO = hasPermission(permissions, `${prodNumber}.bio.review.po.view`);
  const canViewBioReviewWelding = hasPermission(permissions, `${prodNumber}.bio.review.welding.view`);
  const canViewBioReviewVendor = hasPermission(permissions, `${prodNumber}.bio.review.vendor.view`);

  // Helper functions to check active states
  const isUrgentJobActive = () => {
    return (pathname === `/section_production/production_module` && 
            filter === "JOB_SERVICE" && 
            client === "Amar Equipment" && 
            isActive);
  };

  const isUrgentTSOActive = () => {
    return (pathname === `/section_production/production_module_2` && 
            filter === "TSO_SERVICE" && 
            client === "Amar Equipment" && 
            isActive);
  };

  const isKanbanActive = () => {
    return (pathname === `/section_production/production_module_3` && 
            filter === "KANBAN" && 
            client === "Amar Equipment" && 
            isActive);
  };

  const isUrgentJobBioActive = () => {
    return (pathname === `/section_production/production_module` && 
            filter === "JOB_SERVICE" && 
            client === "Amar Biosystem" && 
            isActive);
  };

  const isUrgentTSOBioActive = () => {
    return (pathname === `/section_production/production_module_2` && 
            filter === "TSO_SERVICE" && 
            client === "Amar Biosystem" && 
            isActive);
  };

  const isKanbanBioActive = () => {
    return (pathname === `/section_production/production_module_3` && 
            filter === "KANBAN" && 
            client === "Amar Biosystem" && 
            isActive);
  };

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

  if (!canViewEqpJob && !canViewEqpTSO && !canViewEqpKanban && !canViewEqpPO && !canViewEqpReview &&
      !canViewBioJob && !canViewBioTSO && !canViewBioKanban && !canViewBioPO && !canViewBioReview) {
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
        <p className={`text-sm font-medium ${isMenuOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>{label}</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
      </div>

      {isMenuOpen && (
        <div className="pl-4 flex flex-col gap-1">
          {/* Amar Equipment Section */}
          {(canViewEqpJob || canViewEqpTSO || canViewEqpKanban || canViewEqpPO || canViewEqpReview) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmarEquipmentOpen(!isAmarEquipmentOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-sm font-medium ${isAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEquipmentOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarEquipmentOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {canViewEqpJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentJobActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdWorkOutline className={`w-5 h-5 ${isUrgentJobActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentJobActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {canViewEqpTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentTSOActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdDesignServices className={`w-5 h-5 ${isUrgentTSOActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentTSOActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {canViewEqpKanban && (
                    <Link href={`/section_production/production_module_3?filter=KANBAN&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isKanbanActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdViewKanban className={`w-5 h-5 ${isKanbanActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isKanbanActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                      </div>
                    </Link>
                  )}

                  {canViewEqpPO && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAmarEqPOOpen(!isAmarEqPOOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEqPOOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isAmarEqPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isAmarEqPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEqPOOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isAmarEqPOOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          <Link href={`/section_production_planning/po-services?filter=FINE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                            </div>
                          </Link>
                          <Link href={`/section_production_planning/po-services?filter=PRESS_FLOW&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Press Flow</p>
                            </div>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {canViewEqpReview && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProdAmarEqReviewOpen(!isProdAmarEqReviewOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isProdAmarEqReviewOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isProdAmarEqReviewOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isProdAmarEqReviewOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarEqReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarEqReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewEqpReviewJob && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>Tso Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewKanban && (
                            <Link href={`/review?filter=KANBAN&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)}>
                                <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)}>Kanban</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewPO && (
                            <Link href={`/review?filter=PO&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "PO" && isActive)}>
                                <MdPendingActions className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "PO" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "PO" && isActive)}>PO</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          {canViewEqpReviewVendor && (
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
          {(canViewBioJob || canViewBioTSO || canViewBioKanban || canViewBioPO || canViewBioReview) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAmarBioOpen(!isAmarBioOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-sm font-medium ${isAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarBioOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {canViewBioJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentJobBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdWorkOutline className={`w-5 h-5 ${isUrgentJobBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentJobBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {canViewBioTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isUrgentTSOBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdDesignServices className={`w-5 h-5 ${isUrgentTSOBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isUrgentTSOBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {canViewBioKanban && (
                    <Link href={`/section_production/production_module_3?filter=KANBAN&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isKanbanBioActive() ? "bg-sideBarHoverbg" : ""}`}>
                        <MdViewKanban className={`w-5 h-5 ${isKanbanBioActive() ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isKanbanBioActive() ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                      </div>
                    </Link>
                  )}

                  {canViewBioPO && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAmarBioPOOpen(!isAmarBioPOOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioPOOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isAmarBioPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isAmarBioPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioPOOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isAmarBioPOOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          <Link href={`/section_production_planning/po-services?filter=FINE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                            </div>
                          </Link>
                          <Link href={`/section_production_planning/po-services?filter=PRESS_FLOW&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Press Flow</p>
                            </div>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {canViewBioReview && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProdAmarBioReviewOpen(!isProdAmarBioReviewOpen);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isProdAmarBioReviewOpen ? "bg-sideBarHoverbg" : ""}`}
                      >
                        <MdPendingActions className={`w-5 h-5 ${isProdAmarBioReviewOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                        <p className={`text-sm font-medium ${isProdAmarBioReviewOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarBioReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarBioReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewBioReviewJob && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>Tso Service</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewKanban && (
                            <Link href={`/review?filter=KANBAN&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)}>
                                <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)}>Kanban</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewPO && (
                            <Link href={`/review?filter=PO&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "PO" && isActive)}>
                                <MdPendingActions className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "PO" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "PO" && isActive)}>PO</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`} onClick={(e) => e.stopPropagation()}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          {canViewBioReviewVendor && (
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
// INVENTORY 1 SUBMENU COMPONENT
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
  searchParams,
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
  searchParams: URLSearchParams;
}) => {
  const [isMaterialApprovedOpen, setIsMaterialApprovedOpen] = useState(false);
  const [isMaterialApprovedAmarOpen, setIsMaterialApprovedAmarOpen] = useState(false);
  const [isMaterialApprovedAmarBioOpen, setIsMaterialApprovedAmarBioOpen] = useState(false);

  const urlFilter = searchParams.get("filter");
  const urlClient = searchParams.get("client");
  const hasAssignToNot = searchParams.has("assign_to_not");

  useEffect(() => {
    if (pathname.includes("/inventory_material_approve")) {
      setIsMaterialApprovedOpen(true);
      if (urlClient === "Amar Equipment") {
        setIsMaterialApprovedAmarOpen(true);
      }
      if (urlClient === "Amar Biosystem") {
        setIsMaterialApprovedAmarBioOpen(true);
      }
    }
  }, [pathname, urlClient]);

  const isMaterialDataActive = pathname === "/section_inventory/inventory";
  
  const isMaterialApproveJobActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlFilter === "JOB_SERVICE" && urlClient === "Amar Equipment" && !hasAssignToNot;
  const isMaterialApproveTSOActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlFilter === "TSO_SERVICE" && urlClient === "Amar Equipment" && !hasAssignToNot;
  const isMaterialApproveKanbanActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlFilter === "KANBAN" && urlClient === "Amar Equipment" && !hasAssignToNot;
  const isMaterialApproveVendorActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlClient === "Amar Equipment" && hasAssignToNot && !urlFilter;
  
  const isMaterialApproveJobBioActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlFilter === "JOB_SERVICE" && urlClient === "Amar Biosystem" && !hasAssignToNot;
  const isMaterialApproveTSOBioActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlFilter === "TSO_SERVICE" && urlClient === "Amar Biosystem" && !hasAssignToNot;
  const isMaterialApproveKanbanBioActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlFilter === "KANBAN" && urlClient === "Amar Biosystem" && !hasAssignToNot;
  const isMaterialApproveVendorBioActive = pathname === "/section_inventory/inventory_material_approve" && 
    urlClient === "Amar Biosystem" && hasAssignToNot && !urlFilter;

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
        <p className={`text-sm font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Inventory 1</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          <Link href="/section_inventory/inventory" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialDataActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdStorage className={`w-5 h-5 ${isMaterialDataActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isMaterialDataActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Data</p>
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
                <p className={`text-sm font-medium ${isMaterialApprovedOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Approved</p>
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
                    <p className={`text-sm font-medium ${isMaterialApprovedAmarOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                    <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedAmarOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isMaterialApprovedAmarOpen && (
                    <div className="pl-4 flex flex-col gap-1">
                      <Link href="/section_inventory/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveJobActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdWorkOutline className={`w-5 h-5 ${isMaterialApproveJobActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveJobActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Job Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveTSOActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdDesignServices className={`w-5 h-5 ${isMaterialApproveTSOActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveTSOActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Tso Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=KANBAN&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveKanbanActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdViewKanban className={`w-5 h-5 ${isMaterialApproveKanbanActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveKanbanActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?client=Amar%20Equipment&assign_to_not=Usmaan&assign_to_not=Riyaaz&assign_to_not=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveVendorActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdBusiness className={`w-5 h-5 ${isMaterialApproveVendorActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveVendorActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendors</p>
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
                    <p className={`text-sm font-medium ${isMaterialApprovedAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                    <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedAmarBioOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isMaterialApprovedAmarBioOpen && (
                    <div className="pl-4 flex flex-col gap-1">
                      <Link href="/section_inventory/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveJobBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdWorkOutline className={`w-5 h-5 ${isMaterialApproveJobBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveJobBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Job Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveTSOBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdDesignServices className={`w-5 h-5 ${isMaterialApproveTSOBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveTSOBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Tso Service</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?filter=KANBAN&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveKanbanBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdViewKanban className={`w-5 h-5 ${isMaterialApproveKanbanBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveKanbanBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Kanban</p>
                        </div>
                      </Link>
                      <Link href="/section_inventory/inventory_material_approve?client=Amar%20Biosystem&assign_to_not=Usmaan&assign_to_not=Riyaaz&assign_to_not=Ramzaan" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialApproveVendorBioActive ? "bg-sideBarHoverbg" : ""}`}>
                          <MdBusiness className={`w-5 h-5 ${isMaterialApproveVendorBioActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                          <p className={`text-sm font-medium ${isMaterialApproveVendorBioActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendors</p>
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
// INVENTORY 2 SUBMENU COMPONENT
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
        <p className={`text-sm font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Inventory 2</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          <Link href="/section_inventory/inventory_2" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMasterActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCategory className={`w-5 h-5 ${isMasterActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isMasterActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Master</p>
            </div>
          </Link>

          <Link href="/inventory2/in-out" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isInOutActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdOutlineSwapHoriz className={`w-5 h-5 ${isInOutActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isInOutActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>In/Out</p>
            </div>
          </Link>

          <Link href="/inventory2/material-transfer" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialTransferActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCompareArrows className={`w-5 h-5 ${isMaterialTransferActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isMaterialTransferActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Transfer</p>
            </div>
          </Link>

          <Link href="/section_inventory/inventory2/pr" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPRActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdPendingActions className={`w-5 h-5 ${isPRActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isPRActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>PR</p>
            </div>
          </Link>
        </div>
      )}
    </>
  );
};

// ============================================
// INVENTORY 3 SUBMENU COMPONENT
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
        <p className={`text-sm font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Inventory 3</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          <Link href="/section_inventory/inventory_3" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMasterActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCategory className={`w-5 h-5 ${isMasterActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isMasterActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Master</p>
            </div>
          </Link>

          <Link href="/inventory3/in-out" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isInOutActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdOutlineSwapHoriz className={`w-5 h-5 ${isInOutActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isInOutActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>In/Out</p>
            </div>
          </Link>

          <Link href="/inventory3/material-transfer" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isMaterialTransferActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdCompareArrows className={`w-5 h-5 ${isMaterialTransferActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isMaterialTransferActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Material Transfer</p>
            </div>
          </Link>

          <Link href="/inventory3/pr" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPRActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdPendingActions className={`w-5 h-5 ${isPRActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isPRActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>PR</p>
            </div>
          </Link>

          <Link href="/inventory3/por" onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPORActive ? "bg-sideBarHoverbg" : ""}`}>
              <MdOutlineShoppingCart className={`w-5 h-5 ${isPORActive ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
              <p className={`text-sm font-medium ${isPORActive ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>POR</p>
            </div>
          </Link>
        </div>
      )}
    </>
  );
};

// ============================================
// QC SUBMENU COMPONENT
// ============================================
const QCSubMenu = ({
  isOpen,
  setIsOpen,
  itemCls,
  iconCls,
  textCls,
  pathname,
  client,
  filter,
  permissions,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  itemCls: (active: boolean) => string;
  iconCls: (active: boolean) => string;
  textCls: (active: boolean) => string;
  pathname: string;
  client: string;
  filter: string;
  permissions: Permission[] | null;
}) => {
  const [isQCAmarEquipmentOpen, setIsQCAmarEquipmentOpen] = useState(false);
  const [isQCAmarBioOpen, setIsQCAmarBioOpen] = useState(false);

  // QC Equipment permissions
  const canViewEqpJob = hasPermission(permissions, "qc.eqp.job.view");
  const canViewEqpTSO = hasPermission(permissions, "qc.eqp.tso.view");
  const canViewEqpKanban = hasPermission(permissions, "qc.eqp.kanban.view");
  const canViewEqpPO = hasPermission(permissions, "qc.eqp.po.view");
  const canViewEqpWelding = hasPermission(permissions, "qc.eqp.welding.view");
  const canViewEqpVendor = hasPermission(permissions, "qc.eqp.vendor.view");

  // QC Biosystem permissions
  const canViewBioJob = hasPermission(permissions, "qc.bio.job.view");
  const canViewBioTSO = hasPermission(permissions, "qc.bio.tso.view");
  const canViewBioKanban = hasPermission(permissions, "qc.bio.kanban.view");
  const canViewBioPO = hasPermission(permissions, "qc.bio.po.view");
  const canViewBioWelding = hasPermission(permissions, "qc.bio.welding.view");
  const canViewBioVendor = hasPermission(permissions, "qc.bio.vendor.view");

  useEffect(() => {
    if (pathname.startsWith("/qc")) {
      if (client === "Amar Equipment") setIsQCAmarEquipmentOpen(true);
      if (client === "Amar Biosystem") setIsQCAmarBioOpen(true);
    }
  }, [pathname, client]);

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-3 px-3 py-3 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isOpen ? "bg-sideBarHoverbg" : ""}`}
      >
        <MdOutlineVerified className={`w-6 h-6 ${isOpen ? "text-primary-600" : "text-black-500 group-hover:text-primary-600"}`} />
        <p className={`text-sm font-medium ${isOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>QC</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="pl-4 flex flex-col gap-1">
          {/* Amar Equipment Section */}
          {(canViewEqpJob || canViewEqpTSO || canViewEqpKanban || canViewEqpPO || canViewEqpWelding || canViewEqpVendor) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQCAmarEquipmentOpen(!isQCAmarEquipmentOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isQCAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isQCAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-sm font-medium ${isQCAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCAmarEquipmentOpen ? "rotate-180" : ""}`} />
              </div>

              {isQCAmarEquipmentOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {canViewEqpJob && (
                    <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                        <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                      </div>
                    </Link>
                  )}
                  {canViewEqpTSO && (
                    <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                        <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>Tso Service</p>
                      </div>
                    </Link>
                  )}
                  {canViewEqpKanban && (
                    <Link href="/qc?filter=KANBAN&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>
                        <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p>
                      </div>
                    </Link>
                  )}
                  {canViewEqpPO && (
                    <Link href="/qc?filter=PO&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "PO")}>
                        <MdPendingActions className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "PO")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "PO")}>PO</p>
                      </div>
                    </Link>
                  )}
                  {canViewEqpWelding && (
                    <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc/welding" && client === "Amar Equipment")}>
                        <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Equipment")} />
                        <p className={textCls(pathname === "/qc/welding" && client === "Amar Equipment")}>Welding</p>
                      </div>
                    </Link>
                  )}
                  {canViewEqpVendor && (
                    <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Equipment" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>
                        <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Equipment")} />
                        <p className={textCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>Vendor</p>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Amar Biosystem Section */}
          {(canViewBioJob || canViewBioTSO || canViewBioKanban || canViewBioPO || canViewBioWelding || canViewBioVendor) && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQCAmarBioOpen(!isQCAmarBioOpen);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isQCAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}
              >
                <MdOutlinePeopleOutline className={`w-5 h-5 ${isQCAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                <p className={`text-sm font-medium ${isQCAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isQCAmarBioOpen ? "rotate-180" : ""}`} />
              </div>

              {isQCAmarBioOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {canViewBioJob && (
                    <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>
                        <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p>
                      </div>
                    </Link>
                  )}
                  {canViewBioTSO && (
                    <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>
                        <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>Tso Service</p>
                      </div>
                    </Link>
                  )}
                  {canViewBioKanban && (
                    <Link href="/qc?filter=KANBAN&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")}>
                        <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p>
                      </div>
                    </Link>
                  )}
                  {canViewBioPO && (
                    <Link href="/qc?filter=PO&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "PO")}>
                        <MdPendingActions className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "PO")} />
                        <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "PO")}>PO</p>
                      </div>
                    </Link>
                  )}
                  {canViewBioWelding && (
                    <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc/welding" && client === "Amar Biosystem")}>
                        <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Biosystem")} />
                        <p className={textCls(pathname === "/qc/welding" && client === "Amar Biosystem")}>Welding</p>
                      </div>
                    </Link>
                  )}
                  {canViewBioVendor && (
                    <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem" onClick={(e) => e.stopPropagation()}>
                      <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Biosystem")}>
                        <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Biosystem")} />
                        <p className={textCls(pathname === "/qc/vendor" && client === "Amar Biosystem")}>Vendor</p>
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
  
  useEffect(() => {
    const name = storage.getUserName();
    if (name) setUserName(name);
    if (storedUser) {
      setUserRoleName(storedUser.role?.name || "");
    }
  }, [storedUser]);
  
  // ============================================
  // MAIN MODULE VIEW PERMISSIONS
  // ============================================
  
  const hasDashboardView = hasPermission(permissions, "dashboard.view");
  const hasMaterialMovementView = hasPermission(permissions, "material.movement.view");
  
  // Inventory Views
  const hasInventoryView = hasPermission(permissions, "inventory.view");
  const hasInventory1View = hasPermission(permissions, "inventory1.view");
  const hasInventory2View = hasPermission(permissions, "inventory2.view");
  const hasInventory3View = hasPermission(permissions, "inventory3.view");
  const hasMaterialApproveView = hasInventory1View;
  
  // Production Planning Views
  const hasProductionPlanningView = hasPermission(permissions, "productionplanning.view");
  const hasProductionPlanningDashboardView = hasPermission(permissions, "production.planning.dashboard.view");
  const hasOutsourceView = hasPermission(permissions, "outsource.view");
  const hasCategoryView = hasPermission(permissions, "category.view");
  const hasVendorOutgoingView = hasPermission(permissions, "pp.vendor.outgoing.view");
  const hasVendorIncomingView = hasPermission(permissions, "pp.vendor.incoming.view");
  const hasEqpWeldingOutgoingView = hasPermission(permissions, "pp.eqp.welding.outgoing.view");
  const hasBioWeldingOutgoingView = hasPermission(permissions, "pp.bio.welding.outgoing.view");
  
  // PP Equipment Views
  const hasEqpView = hasPermission(permissions, "pp.equipment.view");
  const hasEqpJobView = hasPermission(permissions, "pp.eqp.job.view");
  const hasEqpTSOView = hasPermission(permissions, "pp.eqp.tso.view");
  const hasEqpKanbanView = hasPermission(permissions, "pp.eqp.kanban.view");
  const hasEqpPOView = hasPermission(permissions, "pp.eqp.po.view");
  const hasEqpNotOkView = hasPermission(permissions, "pp.eqp.notok.view");
  
  // PP Biosystem Views
  const hasBioView = hasPermission(permissions, "pp.biosystem.view");
  const hasBioJobView = hasPermission(permissions, "pp.bio.job.view");
  const hasBioTSOView = hasPermission(permissions, "pp.bio.tso.view");
  const hasBioKanbanView = hasPermission(permissions, "pp.bio.kanban.view");
  const hasBioPOView = hasPermission(permissions, "pp.bio.po.view");
  const hasBioNotOkView = hasPermission(permissions, "pp.bio.notok.view");
  
  // Production Views
  const hasProduction1View = hasPermission(permissions, "production1.view");
  const hasProduction2View = hasPermission(permissions, "production2.view");
  const hasProduction3View = hasPermission(permissions, "production3.view");
  const hasAnyProductionView = hasProduction1View || hasProduction2View || hasProduction3View;
  
  // QC View
  const hasQCView = hasPermission(permissions, "qc.view");
  
  // Procurement View
  const hasProcurementView = hasPermission(permissions, "procurement.view");
  
  // User Management Views
  const hasUserManagementView = hasPermission(permissions, "usermanagement.view");
  const hasUserActivityView = hasPermission(permissions, "useractivity.view");

  const client = searchParams.get("client") || "";
  const filter = searchParams.get("filter") || "JOB_SERVICE";
  const assignTo = searchParams.get("assign_to") || "";

  const isVendorNotOkPage = pathname === "/section_production_planning/pp_not-ok/vendor" || pathname.startsWith("/section_production_planning/pp_not-ok/vendor");
  const isWeldingNotOkPage = pathname === "/section_production_planning/pp_not-ok/welding" || pathname.startsWith("/section_production_planning/pp_not-ok/welding");
  const isMainNotOkPage = pathname === "/section_production_planning/pp_not-ok" || (pathname.startsWith("/section_production_planning/pp_not-ok") && !isVendorNotOkPage && !isWeldingNotOkPage);

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

  // State for dropdowns
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
  const [isNotOkAmarEquipmentOpen, setIsNotOkAmarEquipmentOpen] = useState<boolean>(pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Equipment");
  const [isNotOkAmarBioOpen, setIsNotOkAmarBioOpen] = useState<boolean>(pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Biosystem");
  const [isProductionDropdownOpen, setIsProductionDropdownOpen] = useState<boolean>((pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")) || pathname.startsWith("/review"));
  const [isQCOpen, setIsQCOpen] = useState<boolean>(pathname.startsWith("/qc"));
  const [isProcurementOpen, setIsProcurementOpen] = useState<boolean>(pathname.startsWith("/procurement"));
  const [isPROpen, setIsPROpen] = useState<boolean>(pathname.startsWith("/procurement/pr"));
  const [isRejectedPOOpen, setIsRejectedPOOpen] = useState<boolean>(pathname.startsWith("/procurement/rejected-po"));
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(pathname.includes("/user-management") || pathname.includes("/user-activity") || pathname.includes("/role-management") || pathname.includes("/permission-management"));
  const [isVendorOpen, setIsVendorOpen] = useState<boolean>(pathname.includes("/section_production_planning/vendors/outgoing") || pathname.includes("/section_production_planning/vendors/incoming"));

  useEffect(() => {
    if (pathname.startsWith("/qc")) {
      setIsQCOpen(true);
    }
    if (pathname.startsWith("/procurement")) {
      setIsProcurementOpen(true);
      if (pathname.includes("/pr")) setIsPROpen(true);
      if (pathname.includes("/rejected-po")) setIsRejectedPOOpen(true);
    }
    if (pathname.startsWith("/section_production_planning/pp_not-ok")) {
      setIsProductionOpen(true);
      if (client === "Amar Equipment") { setIsAmarEquipmentOpen(true); setIsNotOkAmarEquipmentOpen(true); }
      if (client === "Amar Biosystem") { setIsAmarBioOpen(true); setIsNotOkAmarBioOpen(true); }
    }
    if (pathname.startsWith("/review")) {
      setIsProductionDropdownOpen(true);
      if (client === "Amar Equipment") setIsAmarEquipmentOpen(true);
      else if (client === "Amar Biosystem") setIsAmarBioOpen(true);
    }
    if (pathname.includes("/user-management") || pathname.includes("/user-activity") || pathname.includes("/role-management") || pathname.includes("/permission-management")) setIsUserManagementOpen(true);
    if (pathname.includes("/section_inventory")) setIsInventoryOpen(true);
    if (pathname.includes("/section_inventory/inventory") || pathname.includes("/inventory_material_approve")) setIsInventory1Open(true);
    if (pathname.includes("/section_inventory/inventory_2") || pathname.includes("/inventory2/")) setIsInventory2Open(true);
    if (pathname.includes("/section_inventory/inventory_3") || pathname.includes("/inventory3/")) setIsInventory3Open(true);
    if (pathname.includes("/section_production_planning/production_planning") || pathname === "/section_production_planning/category" || pathname.includes("/section_production_planning/po-services") || pathname.includes("/section_production_planning/vendors") || pathname.includes("/section_production_planning/pp_not-ok") || pathname.includes("/section_production_planning/dashboard")) setIsProductionOpen(true);
    if ((pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")) || pathname.startsWith("/review")) setIsProductionDropdownOpen(true);
    if (pathname.includes("/section_production_planning/vendor")) { if (client === "Amar Equipment") setIsVendorOpen(true); }
  }, [pathname, client]);

  const itemCls = (active: boolean) => `flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${active ? "bg-sideBarHoverbg" : ""}`;
  const textCls = (active: boolean) => `text-sm font-medium ${active ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`;
  const iconCls = (active: boolean) => `w-5 h-5 ${active ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`;
  const hasAnyInventoryView = hasInventoryView || hasInventory1View || hasInventory2View || hasInventory3View;

  return (
    <div className="w-full hidden md:w-[17%] md:flex flex-col justify-between py-4 px-1 border-r-2 border-customBorder shadow-borderShadow mt-0 h-screen fixed top-0 left-0">
      <div className="z-10 overflow-y-auto custom-scrollbar">
        <Link href="/customer">
          <div className="mb-6 px-2 pt-6 pb-1 flex justify-center">
            <div className="relative w-full max-w-[250px] h-[100px] overflow-hidden">
              <Image
                src="/images/logo-fine.png"
                alt="Fine Engineering"
                width={250}
                height={250}
                className="absolute left-1/2 -translate-x-1/2 w-[250px] h-auto max-w-none"
                style={{ top: "-94px" }}
                priority
              />
            </div>
          </div>
        </Link>

        {userName && (
          <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="text-sm font-semibold text-primary-600">{userName}</p>
            <p className="text-xs text-gray-500">Role: {userRoleName || "User"}</p>
          </div>
        )}

        {/* Dashboard */}
        {hasDashboardView && (
          <Link href="/dashboard">
            <div className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${pathname === "/dashboard" ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"}`}>
              <MdOutlineDashboard className={`w-6 h-6 ${pathname === "/dashboard" ? "text-white" : "group-hover:text-primary-600"}`} />
              <p>Dashboard</p>
            </div>
          </Link>
        )}

        {/* Material Movement */}
        {hasMaterialMovementView && (
          <Link href="/material-movement">
            <div className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${pathname === "/material-movement" ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"}`}>
              <MdOutlineSwapHoriz className={`w-6 h-6 ${pathname === "/material-movement" ? "text-white" : "group-hover:text-primary-600"}`} />
              <p>Material Movement</p>
            </div>
          </Link>
        )}

        {/* Inventory Section */}
        {hasAnyInventoryView && (
          <>
            <div onClick={() => setIsInventoryOpen(!isInventoryOpen)} className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${pathname.includes("/section_inventory") ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"}`}>
              <MdOutlineInventory2 className={`w-6 h-6 ${pathname.includes("/section_inventory") ? "text-white" : "group-hover:text-primary-600"}`} />
              <p>Inventory</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isInventoryOpen ? "rotate-180" : ""} ${pathname.includes("/section_inventory") ? "text-white" : ""}`} />
            </div>

            {isInventoryOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
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
                    searchParams={searchParams}
                  />
                )}
                {hasInventory2View && (
                  <Inventory2SubMenu isOpen={isInventory2Open} setIsOpen={setIsInventory2Open} itemCls={itemCls} iconCls={iconCls} textCls={textCls} pathname={pathname} />
                )}
                {hasInventory3View && (
                  <Inventory3SubMenu isOpen={isInventory3Open} setIsOpen={setIsInventory3Open} itemCls={itemCls} iconCls={iconCls} textCls={textCls} pathname={pathname} />
                )}
              </div>
            )}
          </>
        )}

        {/* Production Planning Section */}
        {hasProductionPlanningView && (
          <>
            <div onClick={() => setIsProductionOpen(!isProductionOpen)} className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${pathname.includes("/section_production_planning/production_planning") || pathname === "/section_production_planning/category" || pathname.includes("/section_production_planning/po-services") || pathname.includes("/section_production_planning/vendors") || pathname.includes("/section_production_planning/pp_not-ok") || pathname.includes("/section_production_planning/dashboard") ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"}`}>
              <MdOutlineBuild className="w-6 h-6" />
              <p>Production Planning</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProductionOpen ? "rotate-180" : ""}`} />
            </div>

            {isProductionOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {hasProductionPlanningDashboardView && (
                  <Link href="/section_production_planning/dashboard">
                    <div className={itemCls(pathname === "/section_production_planning/dashboard")}>
                      <MdOutlineDashboard className={iconCls(pathname === "/section_production_planning/dashboard")} />
                      <p className={textCls(pathname === "/section_production_planning/dashboard")}>Dashboard</p>
                    </div>
                  </Link>
                )}

                {/* Vendor Section */}
                {(hasVendorOutgoingView || hasVendorIncomingView) && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setIsVendorOpen(!isVendorOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isVendorOpen ? "bg-sideBarHoverbg" : ""}`}>
                      <MdBusiness className={`w-5 h-5 ${isVendorOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-sm font-medium ${isVendorOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Vendor</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isVendorOpen ? "rotate-180" : ""}`} />
                    </div>
                    {isVendorOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        {hasVendorOutgoingView && (
                          <Link href="/section_production_planning/vendors/outgoing">
                            <div className={itemCls(pathname === "/section_production_planning/vendors/outgoing")}>
                              <MdOutlineSwapHoriz className={iconCls(pathname === "/section_production_planning/vendors/outgoing")} />
                              <p className={textCls(pathname === "/section_production_planning/vendors/outgoing")}>Outgoing</p>
                            </div>
                          </Link>
                        )}
                        {hasVendorIncomingView && (
                          <Link href="/section_production_planning/vendors/incoming">
                            <div className={itemCls(pathname === "/section_production_planning/vendors/incoming")}>
                              <MdOutlineSwapHoriz className={iconCls(pathname === "/section_production_planning/vendors/incoming")} />
                              <p className={textCls(pathname === "/section_production_planning/vendors/incoming")}>Incoming</p>
                            </div>
                          </Link>
                        )}
                      </div>
                    )}
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
                {(hasEqpView || hasEqpJobView || hasEqpTSOView || hasEqpKanbanView || hasEqpPOView || hasEqpNotOkView || hasEqpWeldingOutgoingView) && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setIsAmarEquipmentOpen(!isAmarEquipmentOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}>
                      <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-sm font-medium ${isAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Equipment</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEquipmentOpen ? "rotate-180" : ""}`} />
                    </div>
                    {isAmarEquipmentOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        {hasEqpJobView && <Link href="/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Equipment"><div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")}><MdWorkOutline className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")} /><p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p></div></Link>}
                        {hasEqpTSOView && <Link href="/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Equipment"><div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}><MdDesignServices className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")} /><p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>Tso Service</p></div></Link>}
                        {hasEqpKanbanView && <Link href="/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Equipment"><div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "KANBAN")}><MdViewKanban className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "KANBAN")} /><p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p></div></Link>}
                        {hasEqpPOView && (<><div onClick={(e) => { e.stopPropagation(); setIsPOOpen(!isPOOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPOOpen ? "bg-sideBarHoverbg" : ""}`}><MdPendingActions className={`w-5 h-5 ${isPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} /><p className={`text-sm font-medium ${isPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p><FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} /></div>
                        {isPOOpen && (<div className="pl-4 flex flex-col gap-1"><Link href={`/section_production_planning/po-services?filter=Riyaaz&client=Amar%20Equipment`}><div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"><MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" /><p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Riyaaz</p></div></Link><Link href={`/section_production_planning/po-services?filter=Ramzaan&client=Amar%20Equipment`}><div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"><MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" /><p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Ramzaan</p></div></Link></div>)}</>)}
                        {hasEqpWeldingOutgoingView && <Link href="/section_production_planning/welding?client=Amar%20Equipment"><div className={itemCls(pathname === "/section_production_planning/welding" && client === "Amar Equipment")}><MdPrecisionManufacturing className={iconCls(pathname === "/section_production_planning/welding" && client === "Amar Equipment")} /><p className={textCls(pathname === "/section_production_planning/welding" && client === "Amar Equipment")}>Welding Outgoing</p></div></Link>}
                        {hasEqpNotOkView && (<><div onClick={(e) => { e.stopPropagation(); setIsNotOkAmarEquipmentOpen(!isNotOkAmarEquipmentOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isNotOkAmarEquipmentOpen ? "bg-sideBarHoverbg" : ""}`}><MdErrorOutline className={`w-5 h-5 ${isNotOkAmarEquipmentOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} /><p className={`text-sm font-medium ${isNotOkAmarEquipmentOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Not-Ok</p><FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isNotOkAmarEquipmentOpen ? "rotate-180" : ""}`} /></div>
                        {isNotOkAmarEquipmentOpen && (<div className="pl-4 flex flex-col gap-1"><Link href="/section_production_planning/pp_not-ok?filter=JOB_SERVICE&client=Amar%20Equipment"><div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")}><MdWorkOutline className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")} /><p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p></div></Link><Link href="/section_production_planning/pp_not-ok?filter=TSO_SERVICE&client=Amar%20Equipment"><div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}><MdDesignServices className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")} /><p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}>Tso Service</p></div></Link><Link href="/section_production_planning/pp_not-ok?filter=KANBAN&client=Amar%20Equipment"><div className={itemCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")}><MdViewKanban className={iconCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")} /><p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "KANBAN")}>Kanban</p></div></Link><Link href="/section_production_planning/pp_not-ok/welding?filter=JOB_SERVICE&client=Amar%20Equipment"><div className={itemCls(isWeldingNotOkPage && client === "Amar Equipment")}><MdPrecisionManufacturing className={iconCls(isWeldingNotOkPage && client === "Amar Equipment")} /><p className={textCls(isWeldingNotOkPage && client === "Amar Equipment")}>Welding</p></div></Link><Link href="/section_production_planning/pp_not-ok/vendor?filter=JOB_SERVICE&client=Amar%20Equipment"><div className={itemCls(isVendorNotOkPage && client === "Amar Equipment")}><MdOutlinePeopleOutline className={iconCls(isVendorNotOkPage && client === "Amar Equipment")} /><p className={textCls(isVendorNotOkPage && client === "Amar Equipment")}>Vendor</p></div></Link></div>)}</>)}
                      </div>
                    )}
                  </>
                )}

                {/* Amar Bio Section */}
                {(hasBioView || hasBioJobView || hasBioTSOView || hasBioKanbanView || hasBioPOView || hasBioNotOkView || hasBioWeldingOutgoingView) && (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setIsAmarBioOpen(!isAmarBioOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}>
                      <MdOutlinePeopleOutline className={`w-5 h-5 ${isAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
                      <p className={`text-sm font-medium ${isAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Amar Biosystem</p>
                      <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
                    </div>
                    {isAmarBioOpen && (
                      <div className="pl-4 flex flex-col gap-1">
                        {hasBioJobView && <Link href="/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Biosystem"><div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}><MdWorkOutline className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "JOB_SERVICE")} /><p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p></div></Link>}
                        {hasBioTSOView && <Link href="/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Biosystem"><div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}><MdDesignServices className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "TSO_SERVICE")} /><p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>Tso Service</p></div></Link>}
                        {hasBioKanbanView && <Link href="/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Biosystem"><div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "KANBAN")}><MdViewKanban className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "KANBAN")} /><p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p></div></Link>}
                        {hasBioPOView && (<><div onClick={(e) => { e.stopPropagation(); setIsPOOpen(!isPOOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPOOpen ? "bg-sideBarHoverbg" : ""}`}><MdPendingActions className={`w-5 h-5 ${isPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} /><p className={`text-sm font-medium ${isPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>P/O</p><FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} /></div>
                        {isPOOpen && (<div className="pl-4 flex flex-col gap-1"><Link href={`/section_production_planning/po-services?filter=Riyaaz&client=Amar%20Biosystem`}><div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"><MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" /><p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Riyaaz</p></div></Link><Link href={`/section_production_planning/po-services?filter=Ramzaan&client=Amar%20Biosystem`}><div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"><MdPerson className="w-5 h-5 text-gray-500 group-hover:text-primary-600" /><p className="text-sm font-medium text-firstBlack group-hover:text-primary-600">Ramzaan</p></div></Link></div>)}</>)}
                        {hasBioWeldingOutgoingView && <Link href="/section_production_planning/welding?client=Amar%20Biosystem"><div className={itemCls(pathname === "/section_production_planning/welding" && client === "Amar Biosystem")}><MdPrecisionManufacturing className={iconCls(pathname === "/section_production_planning/welding" && client === "Amar Biosystem")} /><p className={textCls(pathname === "/section_production_planning/welding" && client === "Amar Biosystem")}>Welding Outgoing</p></div></Link>}
                        {hasBioNotOkView && (<><div onClick={(e) => { e.stopPropagation(); setIsNotOkAmarBioOpen(!isNotOkAmarBioOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isNotOkAmarBioOpen ? "bg-sideBarHoverbg" : ""}`}><MdErrorOutline className={`w-5 h-5 ${isNotOkAmarBioOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} /><p className={`text-sm font-medium ${isNotOkAmarBioOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Not-Ok</p><FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isNotOkAmarBioOpen ? "rotate-180" : ""}`} /></div>
                        {isNotOkAmarBioOpen && (<div className="pl-4 flex flex-col gap-1"><Link href="/section_production_planning/pp_not-ok?filter=JOB_SERVICE&client=Amar%20Biosystem"><div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")}><MdWorkOutline className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")} /><p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p></div></Link><Link href="/section_production_planning/pp_not-ok?filter=TSO_SERVICE&client=Amar%20Biosystem"><div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}><MdDesignServices className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")} /><p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>Tso Service</p></div></Link><Link href="/section_production_planning/pp_not-ok?filter=KANBAN&client=Amar%20Biosystem"><div className={itemCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")}><MdViewKanban className={iconCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")} /><p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "KANBAN")}>Kanban</p></div></Link><Link href="/section_production_planning/pp_not-ok/welding?filter=JOB_SERVICE&client=Amar%20Biosystem"><div className={itemCls(isWeldingNotOkPage && client === "Amar Biosystem")}><MdPrecisionManufacturing className={iconCls(isWeldingNotOkPage && client === "Amar Biosystem")} /><p className={textCls(isWeldingNotOkPage && client === "Amar Biosystem")}>Welding</p></div></Link><Link href="/section_production_planning/pp_not-ok/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem"><div className={itemCls(isVendorNotOkPage && client === "Amar Biosystem")}><MdOutlinePeopleOutline className={iconCls(isVendorNotOkPage && client === "Amar Biosystem")} /><p className={textCls(isVendorNotOkPage && client === "Amar Biosystem")}>Vendor</p></div></Link></div>)}</>)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Production Section */}
        {hasAnyProductionView && (
          <>
            <div onClick={() => setIsProductionDropdownOpen(!isProductionDropdownOpen)} className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${(pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")) || pathname.startsWith("/review") ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"}`}>
              <MdPrecisionManufacturing className="w-6 h-6" />
              <p>Production</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProductionDropdownOpen ? "rotate-180" : ""}`} />
            </div>
            {isProductionDropdownOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {hasProduction1View && <Production1UserMenu label="Production 1" assignTo="Usmaan" pathname={pathname} client={client} filter={filter} currentAssignTo={assignTo} itemCls={itemCls} iconCls={iconCls} textCls={textCls} permissions={permissions} />}
                {hasProduction2View && <Production23UserMenu label="Production 2" assignTo="Riyaaz" pathname={pathname} client={client} filter={filter} currentAssignTo={assignTo} itemCls={itemCls} iconCls={iconCls} textCls={textCls} permissions={permissions} prodNumber="production2" />}
                {hasProduction3View && <Production23UserMenu label="Production 3" assignTo="Ramzaan" pathname={pathname} client={client} filter={filter} currentAssignTo={assignTo} itemCls={itemCls} iconCls={iconCls} textCls={textCls} permissions={permissions} prodNumber="production3" />}
              </div>
            )}
          </>
        )}

        {/* QC Section */}
        {hasQCView && (
          <QCSubMenu isOpen={isQCOpen} setIsOpen={setIsQCOpen} itemCls={itemCls} iconCls={iconCls} textCls={textCls} pathname={pathname} client={client} filter={filter} permissions={permissions} />
        )}

        {/* Procurement Section */}
        {hasProcurementView && (
          <>
            <div onClick={() => setIsProcurementOpen(!isProcurementOpen)} className={`mb-4 flex gap-4 items-center group px-3 py-3 rounded-[4px] cursor-pointer text-sm font-medium ${pathname.startsWith("/procurement") ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"}`}>
              <MdOutlineShoppingCart className="w-6 h-6" />
              <p>Procurement</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProcurementOpen ? "rotate-180" : ""}`} />
            </div>
            {isProcurementOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                <Link href="/procurement/dashboard"><div className={itemCls(pathname === "/procurement/dashboard")}><MdOutlineDashboard className={iconCls(pathname === "/procurement/dashboard")} /><p className={textCls(pathname === "/procurement/dashboard")}>Procurement Dashboard</p></div></Link>
                <Link href="/procurement/master"><div className={itemCls(pathname === "/procurement/master")}><MdCategory className={iconCls(pathname === "/procurement/master")} /><p className={textCls(pathname === "/procurement/master")}>Master</p></div></Link>
                <div onClick={(e) => { e.stopPropagation(); setIsPROpen(!isPROpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isPROpen ? "bg-sideBarHoverbg" : ""}`}><MdPendingActions className={`w-5 h-5 ${isPROpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} /><p className={`text-sm font-medium ${isPROpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>PR</p><FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPROpen ? "rotate-180" : ""}`} /></div>
                {isPROpen && (<div className="pl-4 flex flex-col gap-1"><Link href="/procurement/pr/inventory2"><div className={itemCls(pathname === "/procurement/pr/inventory2")}><MdPendingActions className={iconCls(pathname === "/procurement/pr/inventory2")} /><p className={textCls(pathname === "/procurement/pr/inventory2")}>Inventory 2 PR</p></div></Link><Link href="/procurement/pr/inventory3"><div className={itemCls(pathname === "/procurement/pr/inventory3")}><MdPendingActions className={iconCls(pathname === "/procurement/pr/inventory3")} /><p className={textCls(pathname === "/procurement/pr/inventory3")}>Inventory 3 PR</p></div></Link></div>)}
                <Link href="/procurement/po"><div className={itemCls(pathname === "/procurement/po")}><MdWorkOutline className={iconCls(pathname === "/procurement/po")} /><p className={textCls(pathname === "/procurement/po")}>PO</p></div></Link>
                <Link href="/procurement/reports"><div className={itemCls(pathname === "/procurement/reports")}><MdHistory className={iconCls(pathname === "/procurement/reports")} /><p className={textCls(pathname === "/procurement/reports")}>Reports</p></div></Link>
                <div onClick={(e) => { e.stopPropagation(); setIsRejectedPOOpen(!isRejectedPOOpen); }} className={`flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer ${isRejectedPOOpen ? "bg-sideBarHoverbg" : ""}`}><MdOutlineCancel className={`w-5 h-5 ${isRejectedPOOpen ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} /><p className={`text-sm font-medium ${isRejectedPOOpen ? "text-primary-600" : "text-firstBlack group-hover:text-primary-600"}`}>Rejected PO</p><FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isRejectedPOOpen ? "rotate-180" : ""}`} /></div>
                {isRejectedPOOpen && (<div className="pl-4 flex flex-col gap-1"><Link href="/procurement/rejected-po/inventory2"><div className={itemCls(pathname === "/procurement/rejected-po/inventory2")}><MdOutlineInventory2 className={iconCls(pathname === "/procurement/rejected-po/inventory2")} /><p className={textCls(pathname === "/procurement/rejected-po/inventory2")}>Inventory 2</p></div></Link><Link href="/procurement/rejected-po/inventory3"><div className={itemCls(pathname === "/procurement/rejected-po/inventory3")}><MdOutlineInventory2 className={iconCls(pathname === "/procurement/rejected-po/inventory3")} /><p className={textCls(pathname === "/procurement/rejected-po/inventory3")}>Inventory 3</p></div></Link></div>)}
              </div>
            )}
          </>
        )}

      {/* Manage Users - Separate Top Menu */}
{hasUserManagementView && (
  <Link href="/user-management">
    <div className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${
      pathname === "/user-management" 
        ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" 
        : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
    }`}>
      <MdOutlineAdminPanelSettings className="w-6 h-6" />
      <p>User Management</p>
    </div>
  </Link>
)}

{/* User Activity - Separate Top Menu */}
{hasUserActivityView && (
  <Link href="/user-activity">
    <div className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-sm font-medium ${
      pathname === "/user-activity" 
        ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white" 
        : "text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600"
    }`}>
      <FaHistoryIcon className="w-6 h-6" />
      <p>User Activity</p>
    </div>
  </Link>
)}

   </div>

      <div className="flex gap-2 items-center px-3 py-2 z-10">
        <Image src="/images/logoutIcon.svg" alt="logout Icon" width={24} height={24} />
        <div className="text-sm font-semibold leading-normal text-[#EB5757] cursor-pointer" onClick={handleLogout}>Logout</div>
      </div>

      <Image src="/images/sideBarDesign.svg" alt="sidebar design" width={100} height={100} className="w-full absolute bottom-0 right-0 -mb-24" />
    </div>
  );
};

export default LeftSideBar;