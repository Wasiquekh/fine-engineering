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
} from "react-icons/md";
import { TbDeviceMobileDollar } from "react-icons/tb";
import { FaChevronDown, FaHistory } from "react-icons/fa";
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
  const canViewReviewVendor = canViewReview && hasAnyPermission(permissions, ["vendor.view"]);

  useEffect(() => {
    if (isActive && (pathname.includes("/section_production/production_module") || pathname.startsWith("/review"))) {
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
  }, [pathname, client, isActive]);

  // Don't render if user has no production permissions
  if (!canViewUrgentJob && !canViewUrgentTSO && !canViewKanban && !canViewReview) {
    return null;
  }

  return (
    <>
      <div
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
      >
        <MdPrecisionManufacturing className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">{label}</p>
        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
      </div>

      {isMenuOpen && (
        <div className="pl-4 flex flex-col gap-1">
          {/* Amar Equipment Section */}
          {(canViewUrgentJob || canViewUrgentTSO || canViewKanban || canViewReview || canViewPO) && (
            <>
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
                  {/* Urgent/Job */}
                  {canViewUrgentJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Equipment&urgent=true&assign_to=${assignTo}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {/* Urgent/TSO */}
                  {canViewUrgentTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Equipment&urgent=true&assign_to=${assignTo}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {/* Kanban */}
                  {canViewKanban && (
                    <Link href={`/section_production/production_module_3?filter=KANBAN&client=Amar%20Equipment&assign_to=${assignTo}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Kanban</p>
                      </div>
                    </Link>
                  )}

                  {/* P/O Section */}
                  {canViewPO && (
                    <>
                      <div
                        onClick={() => setIsAmarEqPOOpen(!isAmarEqPOOpen)}
                        className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                      >
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">P/O</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarEqPOOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isAmarEqPOOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          <Link href={`/section_production_planning/po-services?filter=FINE&client=Amar%20Equipment&assign_to=${assignTo}`}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                            </div>
                          </Link>
                          <Link href={`/section_production_planning/po-services?filter=PRESS_FLOW&client=Amar%20Equipment&assign_to=${assignTo}`}>
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
                        onClick={() => setIsProdAmarEqReviewOpen(!isProdAmarEqReviewOpen)}
                        className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                      >
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarEqReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarEqReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewReviewJobService && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "TSO_SERVICE" && isActive)}>TSO Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewKanban && (
                            <Link href={`/review?filter=KANBAN&client=Amar%20Equipment&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)}>
                                <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Equipment" && filter === "KANBAN" && isActive)}>Kanban</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Equipment" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewVendor && (
                            <Link href={`/review/vendor?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=${assignTo}`}>
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
                onClick={() => setIsAmarBioOpen(!isAmarBioOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
              >
                <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Bio</p>
                <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioOpen ? "rotate-180" : ""}`} />
              </div>

              {isAmarBioOpen && (
                <div className="pl-4 flex flex-col gap-1">
                  {/* Urgent/Job */}
                  {canViewUrgentJob && (
                    <Link href={`/section_production/production_module?filter=JOB_SERVICE&client=Amar%20Biosystem&urgent=true&assign_to=${assignTo}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/Job</p>
                      </div>
                    </Link>
                  )}

                  {/* Urgent/TSO */}
                  {canViewUrgentTSO && (
                    <Link href={`/section_production/production_module_2?filter=TSO_SERVICE&client=Amar%20Biosystem&urgent=true&assign_to=${assignTo}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Urgent/TSO</p>
                      </div>
                    </Link>
                  )}

                  {/* Kanban */}
                  {canViewKanban && (
                    <Link href={`/section_production/production_module_3?filter=KANBAN&client=Amar%20Biosystem&assign_to=${assignTo}`}>
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Kanban</p>
                      </div>
                    </Link>
                  )}

                  {/* P/O Section for Amar Bio */}
                  {canViewPO && (
                    <>
                      <div
                        onClick={() => setIsAmarBioPOOpen(!isAmarBioPOOpen)}
                        className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                      >
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">P/O</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isAmarBioPOOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isAmarBioPOOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          <Link href={`/section_production_planning/po-services?filter=FINE&client=Amar%20Biosystem&assign_to=${assignTo}`}>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                              <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Fine</p>
                            </div>
                          </Link>
                          <Link href={`/section_production_planning/po-services?filter=PRESS_FLOW&client=Amar%20Biosystem&assign_to=${assignTo}`}>
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
                        onClick={() => setIsProdAmarBioReviewOpen(!isProdAmarBioReviewOpen)}
                        className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                      >
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Review</p>
                        <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isProdAmarBioReviewOpen ? "rotate-180" : ""}`} />
                      </div>

                      {isProdAmarBioReviewOpen && (
                        <div className="pl-4 flex flex-col gap-1">
                          {canViewReviewJobService && (
                            <Link href={`/review?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>
                                <MdWorkOutline className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "JOB_SERVICE" && isActive)}>Job Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewTSO && (
                            <Link href={`/review?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>
                                <MdDesignServices className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "TSO_SERVICE" && isActive)}>TSO Service</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewKanban && (
                            <Link href={`/review?filter=KANBAN&client=Amar%20Biosystem&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)}>
                                <MdViewKanban className={iconCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)} />
                                <p className={textCls(pathname === "/review" && client === "Amar Biosystem" && filter === "KANBAN" && isActive)}>Kanban</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewWelding && (
                            <Link href={`/review/welding?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`}>
                              <div className={itemCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>
                                <MdPrecisionManufacturing className={iconCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)} />
                                <p className={textCls(pathname === "/review/welding" && client === "Amar Biosystem" && isActive)}>Welding</p>
                              </div>
                            </Link>
                          )}
                          
                          {canViewReviewVendor && (
                            <Link href={`/review/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=${assignTo}`}>
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
  // MAIN MODULE PERMISSIONS - MATCHES SQL
  // ============================================
  
  // Dashboard Module
  const hasDashboardView = hasPermission(permissions, "dashboard.view");
  
  // Material Movement Module
  const hasMaterialMovementView = hasPermission(permissions, "material.movement.view");
  
  // Inventory Module
  const hasInventoryView = hasPermission(permissions, "inventory.view");
  const hasMaterialApproveView = hasAnyPermission(permissions, [
    "inventory.view"
  ]);
  
  // Production Planning Module
  const hasProductionPlanningView = hasPermission(permissions, "production.planning.view");
  
  // Production Planning Sub-modules (Matches SQL)
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
  
  // User Management Module
  const hasUserManagementView = hasPermission(permissions, "user.management.view");
  
  // User Management Sub-modules (Matches SQL)
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

  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(pathname.includes("/section_inventory/section_inventory/inventory"));
  const [isInventory1Open, setIsInventory1Open] = useState<boolean>(false);
  const [isInventory2Open, setIsInventory2Open] = useState<boolean>(false);
  const [isMaterialApprovedOpen, setIsMaterialApprovedOpen] = useState<boolean>(false);
  const [isMaterialApprovedAmarOpen, setIsMaterialApprovedAmarOpen] = useState<boolean>(false);
  const [isMaterialApprovedAmarBioOpen, setIsMaterialApprovedAmarBioOpen] = useState<boolean>(false);

  const [isProductionOpen, setIsProductionOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/section_production_planning/production_planning") ||
      pathname === "/section_production_planning/category" ||
      pathname.includes("/section_production_planning/section_production_planning/po-services") ||
      pathname.includes("/section_production_planning/vendors") ||
      pathname.includes("/section_production_planning/pp_not-ok")
  );

  const [isAmarEquipmentOpen, setIsAmarEquipmentOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/section_production_planning/production_planning") ||
      pathname.includes("/section_production_planning/section_production_planning/po-services") ||
      pathname.includes("/section_production_planning/pp_not-ok") ||
      (pathname.includes("/section_production/production_module") && client === "Amar Equipment") ||
      (pathname.startsWith("/review") && client === "Amar Equipment") ||
      (pathname.startsWith("/qc") && client === "Amar Equipment")
  );

  const [isAmarBioOpen, setIsAmarBioOpen] = useState<boolean>(
    (pathname.includes("/section_production_planning/section_production_planning/production_planning") && client === "Amar Bio") ||
      (pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Bio") ||
      (pathname.includes("/section_production/production_module") && client === "Amar Bio") ||
      (pathname.startsWith("/review") && client === "Amar Bio") ||
      (pathname.startsWith("/qc") && client === "Amar Bio")
  );

  const [isPOOpen, setIsPOOpen] = useState<boolean>(pathname.includes("/section_production_planning/section_production_planning/po-services"));

  const [isNotOkAmarEquipmentOpen, setIsNotOkAmarEquipmentOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Equipment"
  );
  const [isNotOkAmarBioOpen, setIsNotOkAmarBioOpen] = useState<boolean>(
    pathname.includes("/section_production_planning/pp_not-ok") && client === "Amar Bio"
  );

  const [isProductionDropdownOpen, setIsProductionDropdownOpen] = useState<boolean>(
    pathname.includes("/production") && !pathname.includes("/section_production_planning/section_production_planning/production_planning")
  );

  const [isQCOpen, setIsQCOpen] = useState<boolean>(pathname.startsWith("/qc"));
  const [isQCAmarEquipmentOpen, setIsQCAmarEquipmentOpen] = useState<boolean>(false);
  const [isQCAmarBioOpen, setIsQCAmarBioOpen] = useState<boolean>(false);

  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(
    pathname.includes("/user-management") || 
    pathname.includes("/user-activity") || 
    pathname.includes("/role-management") ||
    pathname.includes("/permission-management")
  );

  useEffect(() => {
    if (pathname.startsWith("/qc")) {
      setIsQCOpen(true);
      if (client === "Amar Equipment") setIsQCAmarEquipmentOpen(true);
      if (client === "Amar Biosystem") setIsQCAmarBioOpen(true);
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

    if (pathname.includes("/user-management") || 
        pathname.includes("/user-activity") || 
        pathname.includes("/role-management") ||
        pathname.includes("/permission-management")) {
      setIsUserManagementOpen(true);
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
        )}

        {/* Material Movement */}
        {hasMaterialMovementView && (
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
        )}

        {/* Inventory Section */}
        {hasInventoryView && (
          <>
            <div
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
                pathname.includes("/section_inventory/inventory")
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
                    <Link href="/section_inventory/inventory">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdOutlineInventory2 className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Material Data</p>
                      </div>
                    </Link>

                    {hasMaterialApproveView && (
                      <>
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
                                <Link href="/section_inventory/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Job Service</p>
                                  </div>
                                </Link>
                                <Link href="/section_inventory/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">TSO Service</p>
                                  </div>
                                </Link>
                                <Link href="/section_inventory/inventory_material_approve?filter=KANBAN&client=Amar%20Equipment&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Kanban</p>
                                  </div>
                                </Link>
                                <Link href="/section_inventory/inventory_material_approve?client=Amar%20Equipment&assign_to_not=Usmaan&assign_to_not=Riyaaz&assign_to_not=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Vendors</p>
                                  </div>
                                </Link>
                              </div>
                            )}

                            <div
                              onClick={() => setIsMaterialApprovedAmarBioOpen(!isMaterialApprovedAmarBioOpen)}
                              className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                            >
                              <MdOutlinePeopleOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                              <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Amar Biosystem</p>
                              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isMaterialApprovedAmarBioOpen ? "rotate-180" : ""}`} />
                            </div>

                            {isMaterialApprovedAmarBioOpen && (
                              <div className="pl-4 flex flex-col gap-1">
                                <Link href="/section_inventory/inventory_material_approve?filter=JOB_SERVICE&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdWorkOutline className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Job Service</p>
                                  </div>
                                </Link>
                                <Link href="/section_inventory/inventory_material_approve?filter=TSO_SERVICE&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdDesignServices className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">TSO Service</p>
                                  </div>
                                </Link>
                                <Link href="/section_inventory/inventory_material_approve?filter=KANBAN&client=Amar%20Biosystem&assign_to=Usmaan&assign_to=Riyaaz&assign_to=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Kanban</p>
                                  </div>
                                </Link>
                                <Link href="/section_inventory/inventory_material_approve?client=Amar%20Biosystem&assign_to_not=Usmaan&assign_to_not=Usmaan&assign_to_not=Riyaaz&assign_to_not=Ramzaan">
                                  <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                    <MdViewKanban className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                    <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Vendors</p>
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
                <div
                  onClick={() => setIsInventory2Open(!isInventory2Open)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                >
                  <MdOutlineInventory2 className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                  <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Inventory 2</p>
                  <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isInventory2Open ? "rotate-180" : ""}`} />
                </div>

                {isInventory2Open && (
                  <div className="pl-4 flex flex-col gap-1">
                    <Link href="/section_inventory/inventory_2">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Master</p>
                      </div>
                    </Link>
                    <Link href="/inventory2/in-out">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdOutlineSwapHoriz className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">In/Out</p>
                      </div>
                    </Link>
                    <Link href="/inventory2/material-transfer">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdOutlineSwapHoriz className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Material Transfer</p>
                      </div>
                    </Link>
                    <Link href="/inventory2/pr">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                        <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">PR</p>
                      </div>
                    </Link>
                  </div>
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
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
                pathname.includes("/section_production_planning/section_production_planning/production_planning") ||
                pathname === "/section_production_planning/category" ||
                pathname.includes("/section_production_planning/section_production_planning/po-services") ||
                pathname.includes("/section_production_planning/vendors") ||
                pathname.includes("/section_production_planning/pp_not-ok")
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
                {/* Vendors */}
                {hasVendorsView && (
                  <Link href="/section_production_planning/vendors">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                      <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                      <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Vendors</p>
                    </div>
                  </Link>
                )}

                {/* Outsource */}
                {hasOutsourceView && (
                  <Link href="/section_production_planning/vendors/outsource?filter=JOB_SERVICE">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                      <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                      <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Outsource</p>
                    </div>
                  </Link>
                )}

                {/* Category */}
                {hasCategoryView && (
                  <Link href="/section_production_planning/category">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                      <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                      <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Category</p>
                    </div>
                  </Link>
                )}

                {/* Amar Equipment Section */}
                {hasAmarEquipmentView && (
                  <>
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
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
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
                            onClick={() => setIsPOOpen(!isPOOpen)}
                            className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                          >
                            <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">P/O</p>
                            <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} />
                          </div>
                        )}

                        {hasPOView && isPOOpen && (
                          <div className="pl-4 flex flex-col gap-1">
                            <Link href="/section_production_planning/po-services?filter=Riyaaz&client=Amar%20Equipment">
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Riyaaz</p>
                              </div>
                            </Link>
                            <Link href="/section_production_planning/po-services?filter=Ramzaan&client=Amar%20Equipment">
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Ramzaan</p>
                              </div>
                            </Link>
                          </div>
                        )}

                        {/* Not-Ok */}
                        {hasNotOkView && (
                          <div
                            onClick={() => setIsNotOkAmarEquipmentOpen(!isNotOkAmarEquipmentOpen)}
                            className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                          >
                            <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Not-Ok</p>
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
                                <p className={textCls(isMainNotOkPage && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
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

                {/* Amar Bio Section */}
                {hasAmarBioView && (
                  <>
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
                        {/* Job Service */}
                        {hasJobServiceView && (
                          <Link href="/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Biosystem">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "JOB_SERVICE")}>
                              <MdWorkOutline className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "JOB_SERVICE")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "JOB_SERVICE")}>Job Service</p>
                            </div>
                          </Link>
                        )}

                        {/* TSO Service */}
                        {hasTSOServiceView && (
                          <Link href="/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Biosystem">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "TSO_SERVICE")}>
                              <MdDesignServices className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "TSO_SERVICE")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "TSO_SERVICE")}>TSO Service</p>
                            </div>
                          </Link>
                        )}

                        {/* Kanban */}
                        {hasKanbanView && (
                          <Link href="/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Biosystem">
                            <div className={itemCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "KANBAN")}>
                              <MdViewKanban className={iconCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "KANBAN")} />
                              <p className={textCls(pathname === "/section_production_planning/production_planning" && client === "Amar Bio" && filter === "KANBAN")}>Kanban</p>
                            </div>
                          </Link>
                        )}

                        {/* P/O */}
                        {hasPOView && (
                          <div
                            onClick={() => setIsPOOpen(!isPOOpen)}
                            className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                          >
                            <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">P/O</p>
                            <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isPOOpen ? "rotate-180" : ""}`} />
                          </div>
                        )}

                        {hasPOView && isPOOpen && (
                          <div className="pl-4 flex flex-col gap-1">
                            <Link href="/section_production_planning/po-services?filter=Riyaaz&client=Amar%20Biosystem">
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Riyaaz</p>
                              </div>
                            </Link>
                            <Link href="/section_production_planning/po-services?filter=Ramzaan&client=Amar%20Biosystem">
                              <div className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer">
                                <MdPendingActions className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                                <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Ramzaan</p>
                              </div>
                            </Link>
                          </div>
                        )}

                        {/* Not-Ok */}
                        {hasNotOkView && (
                          <div
                            onClick={() => setIsNotOkAmarBioOpen(!isNotOkAmarBioOpen)}
                            className="flex items-center gap-3 px-3 py-2 rounded-[4px] hover:bg-sideBarHoverbg group cursor-pointer"
                          >
                            <MdCategory className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                            <p className="text-base font-medium text-firstBlack group-hover:text-primary-600">Not-Ok</p>
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
                                <p className={textCls(isMainNotOkPage && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>TSO Service</p>
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
              </div>
            )}
          </>
        )}

        {/* Production Section */}
        {hasAnyProductionView && (
          <>
            <div
              onClick={() => setIsProductionDropdownOpen(!isProductionDropdownOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
                pathname.includes("/production") && !pathname.includes("/section_production_planning/production_planning")
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
                    {hasJobServiceView && (
                      <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Equipment">
                        <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>
                          <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "JOB_SERVICE")}>Job Service</p>
                        </div>
                      </Link>
                    )}

                    {hasTSOServiceView && (
                      <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Equipment">
                        <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>
                          <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "TSO_SERVICE")}>TSO Service</p>
                        </div>
                      </Link>
                    )}

                    {hasKanbanView && (
                      <Link href="/qc?filter=KANBAN&client=Amar%20Equipment">
                        <div className={itemCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>
                          <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Equipment" && filter === "KANBAN")}>PO</p>
                        </div>
                      </Link>
                    )}

                    {hasPermission(permissions, "welding.view") && (
                      <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Equipment">
                        <div className={itemCls(pathname === "/qc/welding" && client === "Amar Equipment")}>
                          <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Equipment")} />
                          <p className={textCls(pathname === "/qc/welding" && client === "Amar Equipment")}>Welding</p>
                        </div>
                      </Link>
                    )}

                    {hasVendorsView && (
                      <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Equipment">
                        <div className={itemCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>
                          <MdOutlinePeopleOutline className={iconCls(pathname === "/qc/vendor" && client === "Amar Equipment")} />
                          <p className={textCls(pathname === "/qc/vendor" && client === "Amar Equipment")}>Vendor</p>
                        </div>
                      </Link>
                    )}
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
                    {hasJobServiceView && (
                      <Link href="/qc?filter=JOB_SERVICE&client=Amar%20Biosystem">
                        <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>
                          <MdWorkOutline className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "JOB_SERVICE")}>Job Service</p>
                        </div>
                      </Link>
                    )}

                    {hasTSOServiceView && (
                      <Link href="/qc?filter=TSO_SERVICE&client=Amar%20Biosystem">
                        <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>
                          <MdDesignServices className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "TSO_SERVICE")}>TSO Service</p>
                        </div>
                      </Link>
                    )}

                    {hasKanbanView && (
                      <Link href="/qc?filter=KANBAN&client=Amar%20Biosystem">
                        <div className={itemCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")}>
                          <MdViewKanban className={iconCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")} />
                          <p className={textCls(pathname === "/qc" && client === "Amar Biosystem" && filter === "KANBAN")}>PO</p>
                        </div>
                      </Link>
                    )}

                    {hasPermission(permissions, "welding.view") && (
                      <Link href="/qc/welding?filter=JOB_SERVICE&client=Amar%20Biosystem">
                        <div className={itemCls(pathname === "/qc/welding" && client === "Amar Biosystem")}>
                          <MdPrecisionManufacturing className={iconCls(pathname === "/qc/welding" && client === "Amar Biosystem")} />
                          <p className={textCls(pathname === "/qc/welding" && client === "Amar Biosystem")}>Welding</p>
                        </div>
                      </Link>
                    )}

                    {hasVendorsView && (
                      <Link href="/qc/vendor?filter=JOB_SERVICE&client=Amar%20Biosystem">
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

        {/* User Management Section */}
        {hasUserManagementView && (
          <>
            <div
              onClick={() => setIsUserManagementOpen(!isUserManagementOpen)}
              className={`mb-4 flex gap-4 items-center group px-3 py-2 rounded-[4px] cursor-pointer text-base font-medium text-firstBlack hover:bg-sideBarHoverbg hover:text-primary-600 ${
                pathname.includes("/user-management") || 
                pathname.includes("/user-activity") || 
                pathname.includes("/role-management") ||
                pathname.includes("/permission-management")
                  ? "bg-primary-600 text-white hover:!bg-primary-600 hover:!text-white"
                  : ""
              }`}
            >
              <MdOutlineAdminPanelSettings className="w-6 h-6" />
              <p>User Management</p>
              <FaChevronDown className={`ml-auto w-3 h-3 transition-transform ${isUserManagementOpen ? "rotate-180" : ""}`} />
            </div>

            {isUserManagementOpen && (
              <div className="pl-4 mb-4 flex flex-col gap-1">
                {hasSystemUserView && (
                  <Link href="/user-management">
                    <div className={itemCls(pathname === "/user-management")}>
                      <MdOutlinePeopleOutline className={iconCls(pathname === "/user-management")} />
                      <p className={textCls(pathname === "/user-management")}>Manage Users</p>
                    </div>
                  </Link>
                )}

                {hasUserActivityView && (
                  <Link href="/user-activity">
                    <div className={itemCls(pathname === "/user-activity")}>
                      <FaHistory className={iconCls(pathname === "/user-activity")} />
                      <p className={textCls(pathname === "/user-activity")}>User Activity</p>
                    </div>
                  </Link>
                )}

                {hasRoleView && (
                  <Link href="/role-management">
                    <div className={itemCls(pathname === "/role-management")}>
                      <MdOutlineAdminPanelSettings className={iconCls(pathname === "/role-management")} />
                      <p className={textCls(pathname === "/role-management")}>Roles</p>
                    </div>
                  </Link>
                )}

                {hasPermissionView && (
                  <Link href="/permission-management">
                    <div className={itemCls(pathname === "/permission-management")}>
                      <MdOutlineSecurity className={iconCls(pathname === "/permission-management")} />
                      <p className={textCls(pathname === "/permission-management")}>Permissions</p>
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