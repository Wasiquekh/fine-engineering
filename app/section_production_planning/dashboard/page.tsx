// // app/section_production_planning/dashboard/page.tsx
// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   PointElement,
//   LineElement,
//   Filler,
// } from "chart.js";
// import { Bar, Doughnut, Line } from "react-chartjs-2";
// import {
//   FiRefreshCw,
//   FiDownload,
//   FiBriefcase,
//   FiAlertCircle,
//   FiClock,
//   FiCheckCircle,
//   FiTrendingUp,
//   FiActivity,
//   FiBarChart2,
//   FiPieChart,
//   FiCalendar,
//   FiUserCheck,
//   FiGrid,
//   FiBox,
//   FiTruck,
//   FiUsers,
//   FiCpu,
//   FiFileText,
//   FiShoppingCart,
//   FiXCircle,
//   FiCheck,
//   FiPlus,
//   FiEye,
//   FiEdit,
//   FiTrash2,
// } from "react-icons/fi";
// import { MdPendingActions, MdWorkOutline, MdDesignServices, MdViewKanban } from "react-icons/md";
// import LeftSideBar from "../../component/LeftSideBar";
// import DesktopHeader from "../../component/DesktopHeader";
// import StorageManager from "../../provider/StorageManager";
// import AxiosProvider from "../../provider/AxiosProvider";
// import { hasPermission } from "../../component/utils/permissionUtils";

// // Register ChartJS
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   PointElement,
//   LineElement,
//   Filler
// );

// const axiosProvider = new AxiosProvider();
// const storage = new StorageManager();

// interface ProductionStats {
//   jobService: {
//     total: number;
//     pending: number;
//     approved: number;
//     inProcess: number;
//     completed: number;
//     notOk: number;
//     rejected: number;
//     urgent: number;
//     totalQty: number;
//     completedQty: number;
//     pendingQty: number;
//   };
//   tsoService: {
//     total: number;
//     pending: number;
//     approved: number;
//     inProcess: number;
//     completed: number;
//     notOk: number;
//     rejected: number;
//     urgent: number;
//     totalQty: number;
//     completedQty: number;
//     pendingQty: number;
//   };
//   kanban: {
//     total: number;
//     pending: number;
//     approved: number;
//     inProcess: number;
//     completed: number;
//     notOk: number;
//     rejected: number;
//     urgent: number;
//     totalQty: number;
//     completedQty: number;
//     pendingQty: number;
//   };
//   pendingMaterials: {
//     total: number;
//     pending: number;
//     completed: number;
//     totalQty: number;
//     byClient: Array<{ client_name: string; count: number; qty: number }>;
//   };
//   poServices: {
//     total: number;
//     fine: number;
//     pressFlow: number;
//     approved: number;
//     pending: number;
//     rejected: number;
//     urgent: number;
//     totalAmount: number;
//   };
//   vendors: {
//     total: number;
//     active: number;
//     byCategory: Array<{ category: string; count: number }>;
//   };
//   recentActivities: Array<{
//     id: string;
//     activity: string;
//     type: string;
//     module: string;
//     created_at: string;
//   }>;
//   weeklyTrends: {
//     labels: string[];
//     jobService: number[];
//     tsoService: number[];
//     kanban: number[];
//   };
//   assigneeStats: Array<{
//     assign_to: string;
//     jobServiceCount: number;
//     tsoServiceCount: number;
//     kanbanCount: number;
//     total: number;
//   }>;
//   urgentItems: Array<{
//     id: string;
//     job_no?: string;
//     tso_no?: string;
//     jo_number?: string;
//     job_type: string;
//     client_name: string;
//     urgent_due_date: string;
//     qty: number;
//   }>;
// }

// interface PendingItem {
//   id: string;
//   job_no: string;
//   item_no: number;
//   description: string;
//   qty: number;
//   client_name: string;
//   created_at: string;
// }

// interface POItem {
//   id: string;
//   po_no: string;
//   vendor_name: string;
//   amount: number;
//   status: string;
//   filter_type: string;
//   urgent: boolean;
//   created_at: string;
// }

// interface VendorItem {
//   id: string;
//   vendor: string;
//   company: string;
//   category: string;
//   city: string;
//   gstin: string;
//   mobile: string;
// }

// export default function ProductionPlanningDashboard() {
//   const router = useRouter();
//   const [stats, setStats] = useState<ProductionStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [lastRefreshed, setLastRefreshed] = useState(new Date());
//   const [selectedTab, setSelectedTab] = useState<"overview" | "jobs" | "tso" | "kanban" | "pending" | "po" | "vendors">("overview");
//   const [selectedClient, setSelectedClient] = useState<"all" | "Amar Equipment" | "Amar Biosystem">("all");
//   const [selectedAssignee, setSelectedAssignee] = useState<"all" | "Usmaan" | "Riyaaz" | "Ramzaan">("all");
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showAddPendingModal, setShowAddPendingModal] = useState(false);
//   const [showVendorModal, setShowVendorModal] = useState(false);
//   const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
//   const [poItems, setPoItems] = useState<POItem[]>([]);
//   const [vendors, setVendors] = useState<VendorItem[]>([]);
//   const [filterType, setFilterType] = useState<"all" | "JOB_SERVICE" | "TSO_SERVICE" | "KANBAN">("all");

//   // Get user permissions
//   const permissions = storage.getUserPermissions();
//   const canCreateJob = hasPermission(permissions, "job.create");
//   const canEditJob = hasPermission(permissions, "job.edit");
//   const canDeleteJob = hasPermission(permissions, "job.delete");
//   const canViewPO = hasPermission(permissions, "po.view");
//   const canViewVendors = hasPermission(permissions, "vendors.view");
//   const canViewOutsource = hasPermission(permissions, "outsource.view");
//   const canViewCategory = hasPermission(permissions, "category.view");

//   const fetchData = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosProvider.get("/production-planning/dashboard-stats", {
//         params: {
//           client: selectedClient !== "all" ? selectedClient : undefined,
//           assign_to: selectedAssignee !== "all" ? selectedAssignee : undefined,
//         }
//       });
      
//       if (response.data?.success) {
//         setStats(response.data.data);
//       }
      
//       // Fetch pending materials
//       const pendingRes = await axiosProvider.get("/pending-material", {
//         params: { is_completed: false, limit: 100 }
//       });
//       if (pendingRes.data?.success) {
//         setPendingItems(pendingRes.data.data || []);
//       }
      
//       // Fetch PO services
//       const poRes = await axiosProvider.get("/po-services", {
//         params: { limit: 50 }
//       });
//       if (poRes.data?.success) {
//         setPoItems(poRes.data.data || []);
//       }
      
//       // Fetch vendors
//       const vendorRes = await axiosProvider.get("/vendors", {
//         params: { limit: 50 }
//       });
//       if (vendorRes.data?.success) {
//         setVendors(vendorRes.data.data?.vendors || []);
//       }
      
//       setLastRefreshed(new Date());
//       setError(null);
//     } catch (err: any) {
//       console.error("Failed to fetch dashboard data:", err);
//       setError(err.response?.data?.error || "Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedClient, selectedAssignee]);

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 60000);
//     return () => clearInterval(interval);
//   }, [fetchData]);

//   const handleRefresh = () => fetchData();

//   const handleExport = async () => {
//     try {
//       const response = await axiosProvider.get("/production-planning/export-dashboard");
//       const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `production_planning_export_${new Date().toISOString().split("T")[0]}.json`;
//       a.click();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("Export failed:", err);
//     }
//   };

//   const handleAddJob = (type: string) => {
//     if (type === "JOB_SERVICE") {
//       router.push("/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Equipment");
//     } else if (type === "TSO_SERVICE") {
//       router.push("/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Equipment");
//     } else if (type === "KANBAN") {
//       router.push("/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Equipment");
//     }
//   };

//   const handleAddPending = () => {
//     router.push("/section_production_planning/pending-material/create");
//   };

//   const handleAddVendor = () => {
//     router.push("/section_production_planning/vendors/create");
//   };

//   if (loading && !stats) {
//     return (
//       <div className="flex justify-end min-h-screen bg-gray-50">
//         <LeftSideBar />
//         <div className="w-full md:w-[83%] bg-[#F5F7FA] flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading Production Planning Dashboard...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
//     <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all duration-200">
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
//           <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
//           {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
//           {trend && (
//             <div className="flex items-center gap-1 mt-2">
//               <FiTrendingUp className="text-green-500 w-3 h-3" />
//               <span className="text-xs text-green-500">{trend}</span>
//             </div>
//           )}
//         </div>
//         <div className={`p-3 rounded-xl ${color}`}>
//           {Icon && <Icon className="w-5 h-5 text-white" />}
//         </div>
//       </div>
//     </div>
//   );

//   // Chart Data
//   const jobTypeChartData = {
//     labels: ["Job Service", "TSO Service", "Kanban"],
//     datasets: [
//       {
//         label: "Pending",
//         data: [
//           stats?.jobService.pending || 0,
//           stats?.tsoService.pending || 0,
//           stats?.kanban.pending || 0,
//         ],
//         backgroundColor: "#F59E0B",
//         borderRadius: 8,
//       },
//       {
//         label: "Approved",
//         data: [
//           stats?.jobService.approved || 0,
//           stats?.tsoService.approved || 0,
//           stats?.kanban.approved || 0,
//         ],
//         backgroundColor: "#10B981",
//         borderRadius: 8,
//       },
//       {
//         label: "In Process",
//         data: [
//           stats?.jobService.inProcess || 0,
//           stats?.tsoService.inProcess || 0,
//           stats?.kanban.inProcess || 0,
//         ],
//         backgroundColor: "#3B82F6",
//         borderRadius: 8,
//       },
//       {
//         label: "Completed",
//         data: [
//           stats?.jobService.completed || 0,
//           stats?.tsoService.completed || 0,
//           stats?.kanban.completed || 0,
//         ],
//         backgroundColor: "#8B5CF6",
//         borderRadius: 8,
//       },
//     ],
//   };

//   const weeklyTrendsData = {
//     labels: stats?.weeklyTrends.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//     datasets: [
//       {
//         label: "Job Service",
//         data: stats?.weeklyTrends.jobService || [0, 0, 0, 0, 0, 0, 0],
//         borderColor: "#3B82F6",
//         backgroundColor: "rgba(59,130,246,0.1)",
//         fill: true,
//         tension: 0.4,
//       },
//       {
//         label: "TSO Service",
//         data: stats?.weeklyTrends.tsoService || [0, 0, 0, 0, 0, 0, 0],
//         borderColor: "#8B5CF6",
//         backgroundColor: "rgba(139,92,246,0.1)",
//         fill: true,
//         tension: 0.4,
//       },
//       {
//         label: "Kanban",
//         data: stats?.weeklyTrends.kanban || [0, 0, 0, 0, 0, 0, 0],
//         borderColor: "#10B981",
//         backgroundColor: "rgba(16,185,129,0.1)",
//         fill: true,
//         tension: 0.4,
//       },
//     ],
//   };

//   const statusDistributionData = {
//     labels: ["Pending", "Approved", "In Process", "Completed", "Not OK", "Rejected"],
//     datasets: [
//       {
//         data: [
//           (stats?.jobService.pending || 0) + (stats?.tsoService.pending || 0) + (stats?.kanban.pending || 0),
//           (stats?.jobService.approved || 0) + (stats?.tsoService.approved || 0) + (stats?.kanban.approved || 0),
//           (stats?.jobService.inProcess || 0) + (stats?.tsoService.inProcess || 0) + (stats?.kanban.inProcess || 0),
//           (stats?.jobService.completed || 0) + (stats?.tsoService.completed || 0) + (stats?.kanban.completed || 0),
//           (stats?.jobService.notOk || 0) + (stats?.tsoService.notOk || 0) + (stats?.kanban.notOk || 0),
//           (stats?.jobService.rejected || 0) + (stats?.tsoService.rejected || 0) + (stats?.kanban.rejected || 0),
//         ],
//         backgroundColor: ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#6B7280"],
//         borderWidth: 0,
//       },
//     ],
//   };

//   const assigneeChartData = {
//     labels: stats?.assigneeStats.map(a => a.assign_to) || [],
//     datasets: [
//       {
//         label: "Job Service",
//         data: stats?.assigneeStats.map(a => a.jobServiceCount) || [],
//         backgroundColor: "#3B82F6",
//         borderRadius: 8,
//       },
//       {
//         label: "TSO Service",
//         data: stats?.assigneeStats.map(a => a.tsoServiceCount) || [],
//         backgroundColor: "#8B5CF6",
//         borderRadius: 8,
//       },
//       {
//         label: "Kanban",
//         data: stats?.assigneeStats.map(a => a.kanbanCount) || [],
//         backgroundColor: "#10B981",
//         borderRadius: 8,
//       },
//     ],
//   };

//   return (
//     <div className="flex justify-end min-h-screen bg-gray-50">
//       <LeftSideBar />

//       <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-screen">
//         <DesktopHeader />

//         <div className="p-4 md:p-6">
//           {/* Header */}
//           <div className="mb-6">
//             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//               <div>
//                 <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Production Planning Dashboard</h1>
//                 <p className="text-gray-500 text-sm mt-1">
//                   Last updated: {lastRefreshed.toLocaleString()}
//                 </p>
//               </div>
//               <div className="flex gap-3 flex-wrap">
//                 <button
//                   onClick={handleRefresh}
//                   className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
//                 >
//                   <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//                   Refresh
//                 </button>
//                 <button
//                   onClick={handleExport}
//                   className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
//                 >
//                   <FiDownload className="w-4 h-4" />
//                   Export
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Filters */}
//           <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
//             <div className="flex flex-wrap gap-4 items-center">
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-500">Client:</span>
//                 <select
//                   value={selectedClient}
//                   onChange={(e) => setSelectedClient(e.target.value as any)}
//                   className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
//                 >
//                   <option value="all">All Clients</option>
//                   <option value="Amar Equipment">Amar Equipment</option>
//                   <option value="Amar Biosystem">Amar Biosystem</option>
//                 </select>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-500">Assignee:</span>
//                 <select
//                   value={selectedAssignee}
//                   onChange={(e) => setSelectedAssignee(e.target.value as any)}
//                   className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
//                 >
//                   <option value="all">All Assignees</option>
//                   <option value="Usmaan">Usmaan (Production 1)</option>
//                   <option value="Riyaaz">Riyaaz (Production 2)</option>
//                   <option value="Ramzaan">Ramzaan (Production 3)</option>
//                 </select>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-500">Type:</span>
//                 <select
//                   value={filterType}
//                   onChange={(e) => setFilterType(e.target.value as any)}
//                   className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="JOB_SERVICE">Job Service</option>
//                   <option value="TSO_SERVICE">TSO Service</option>
//                   <option value="KANBAN">Kanban</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-wrap gap-3 mb-6">
//             {canCreateJob && (
//               <>
//                 <button
//                   onClick={() => handleAddJob("JOB_SERVICE")}
//                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   <MdWorkOutline className="w-4 h-4" />
//                   Add Job Service
//                 </button>
//                 <button
//                   onClick={() => handleAddJob("TSO_SERVICE")}
//                   className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//                 >
//                   <MdDesignServices className="w-4 h-4" />
//                   Add TSO Service
//                 </button>
//                 <button
//                   onClick={() => handleAddJob("KANBAN")}
//                   className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                 >
//                   <MdViewKanban className="w-4 h-4" />
//                   Add Kanban
//                 </button>
//               </>
//             )}
//             <button
//               onClick={handleAddPending}
//               className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
//             >
//               <FiBox className="w-4 h-4" />
//               Add Pending Material
//             </button>
//             {canViewVendors && (
//               <button
//                 onClick={handleAddVendor}
//                 className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
//               >
//                 <FiUsers className="w-4 h-4" />
//                 Add Vendor
//               </button>
//             )}
//           </div>

//           {/* Summary Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
//             <StatCard
//               title="Total Jobs"
//               value={(stats?.jobService.total || 0) + (stats?.tsoService.total || 0) + (stats?.kanban.total || 0)}
//               icon={FiBriefcase}
//               color="bg-blue-500"
//               subtitle={`Qty: ${(stats?.jobService.totalQty || 0) + (stats?.tsoService.totalQty || 0) + (stats?.kanban.totalQty || 0)}`}
//             />
//             <StatCard
//               title="Pending Jobs"
//               value={(stats?.jobService.pending || 0) + (stats?.tsoService.pending || 0) + (stats?.kanban.pending || 0)}
//               icon={MdPendingActions}
//               color="bg-yellow-500"
//               subtitle="Awaiting approval"
//             />
//             <StatCard
//               title="In Process"
//               value={(stats?.jobService.inProcess || 0) + (stats?.tsoService.inProcess || 0) + (stats?.kanban.inProcess || 0)}
//               icon={FiActivity}
//               color="bg-green-500"
//               subtitle="Currently in production"
//             />
//             <StatCard
//               title="Urgent Items"
//               value={(stats?.jobService.urgent || 0) + (stats?.tsoService.urgent || 0) + (stats?.kanban.urgent || 0)}
//               icon={FiAlertCircle}
//               color="bg-red-500"
//               subtitle="Need immediate attention"
//             />
//             <StatCard
//               title="Completed"
//               value={(stats?.jobService.completed || 0) + (stats?.tsoService.completed || 0) + (stats?.kanban.completed || 0)}
//               icon={FiCheckCircle}
//               color="bg-purple-500"
//               subtitle={`Qty: ${(stats?.jobService.completedQty || 0) + (stats?.tsoService.completedQty || 0) + (stats?.kanban.completedQty || 0)}`}
//             />
//           </div>

//           {/* Tabs */}
//           <div className="border-b border-gray-200 mb-6 overflow-x-auto">
//             <div className="flex gap-6 min-w-max">
//               {[
//                 { id: "overview", label: "Overview", icon: FiBarChart2 },
//                 { id: "jobs", label: "Job Service", icon: MdWorkOutline },
//                 { id: "tso", label: "TSO Service", icon: MdDesignServices },
//                 { id: "kanban", label: "Kanban", icon: MdViewKanban },
//                 { id: "pending", label: "Pending Materials", icon: FiBox },
//                 { id: "po", label: "P/O", icon: FiShoppingCart },
//                 { id: "vendors", label: "Vendors", icon: FiUsers },
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setSelectedTab(tab.id as any)}
//                   className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
//                     selectedTab === tab.id
//                       ? "border-blue-500 text-blue-600"
//                       : "border-transparent text-gray-500 hover:text-gray-700"
//                   }`}
//                 >
//                   <tab.icon className="w-4 h-4" />
//                   <span className="font-medium">{tab.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Overview Tab */}
//           {selectedTab === "overview" && (
//             <>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//                 <div className="bg-white rounded-xl shadow-sm p-5">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-gray-800">Job Type Status</h3>
//                     <FiPieChart className="text-blue-500 w-5 h-5" />
//                   </div>
//                   <Bar
//                     data={jobTypeChartData}
//                     options={{
//                       responsive: true,
//                       maintainAspectRatio: true,
//                       plugins: {
//                         legend: { position: "top" as const },
//                         tooltip: { mode: "index" as const, intersect: false },
//                       },
//                       scales: {
//                         x: { stacked: true },
//                         y: { stacked: true, beginAtZero: true, title: { display: true, text: "Number of Jobs" } },
//                       },
//                     }}
//                   />
//                 </div>
//                 <div className="bg-white rounded-xl shadow-sm p-5">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-gray-800">Weekly Trends</h3>
//                     <FiTrendingUp className="text-green-500 w-5 h-5" />
//                   </div>
//                   <Line
//                     data={weeklyTrendsData}
//                     options={{
//                       responsive: true,
//                       maintainAspectRatio: true,
//                       plugins: {
//                         legend: { position: "top" as const },
//                         tooltip: { mode: "index" as const, intersect: false },
//                       },
//                     }}
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//                 <div className="bg-white rounded-xl shadow-sm p-5">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-gray-800">Status Distribution</h3>
//                     <FiPieChart className="text-purple-500 w-5 h-5" />
//                   </div>
//                   <div className="flex justify-center">
//                     <Doughnut
//                       data={statusDistributionData}
//                       options={{
//                         responsive: true,
//                         maintainAspectRatio: true,
//                         plugins: {
//                           legend: { position: "bottom" as const },
//                         },
//                       }}
//                     />
//                   </div>
//                 </div>
//                 <div className="bg-white rounded-xl shadow-sm p-5">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-gray-800">Workload by Assignee</h3>
//                     <FiUsers className="text-blue-500 w-5 h-5" />
//                   </div>
//                   <Bar
//                     data={assigneeChartData}
//                     options={{
//                       responsive: true,
//                       maintainAspectRatio: true,
//                       plugins: {
//                         legend: { position: "top" as const },
//                       },
//                       scales: {
//                         x: { stacked: true },
//                         y: { stacked: true, beginAtZero: true, title: { display: true, text: "Number of Jobs" } },
//                       },
//                     }}
//                   />
//                 </div>
//               </div>

//               {/* Urgent Items */}
//               {stats?.urgentItems && stats.urgentItems.length > 0 && (
//                 <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
//                       <FiAlertCircle className="w-5 h-5" />
//                       Urgent Items
//                     </h3>
//                   </div>
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job No/TSO No</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {stats.urgentItems.map((item) => (
//                           <tr key={item.id} className="hover:bg-gray-50">
//                             <td className="px-4 py-3 text-sm text-gray-900">
//                               {item.job_no || item.tso_no || item.jo_number}
//                             </td>
//                             <td className="px-4 py-3 text-sm">
//                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                 item.job_type === "JOB_SERVICE" ? "bg-blue-100 text-blue-700" :
//                                 item.job_type === "TSO_SERVICE" ? "bg-purple-100 text-purple-700" :
//                                 "bg-green-100 text-green-700"
//                               }`}>
//                                 {item.job_type === "JOB_SERVICE" ? "Job Service" :
//                                  item.job_type === "TSO_SERVICE" ? "TSO Service" : "Kanban"}
//                               </span>
//                             </td>
//                             <td className="px-4 py-3 text-sm text-gray-600">{item.client_name}</td>
//                             <td className="px-4 py-3 text-sm text-red-600 font-medium">
//                               {item.urgent_due_date ? new Date(item.urgent_due_date).toLocaleDateString() : "N/A"}
//                             </td>
//                             <td className="px-4 py-3 text-sm text-gray-600">{item.qty}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}

//               {/* Recent Activities */}
//               <div className="bg-white rounded-xl shadow-sm p-5">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
//                   <FiCalendar className="text-gray-500 w-5 h-5" />
//                 </div>
//                 <div className="space-y-3 max-h-80 overflow-y-auto">
//                   {stats?.recentActivities.slice(0, 15).map((activity) => (
//                     <div key={activity.id} className="flex items-start gap-3 p-2 border-b border-gray-100 hover:bg-gray-50 rounded transition-colors">
//                       <div className={`w-2 h-2 rounded-full mt-2 ${
//                         activity.type === "create" ? "bg-green-500" :
//                         activity.type === "update" ? "bg-blue-500" :
//                         activity.type === "delete" ? "bg-red-500" : "bg-gray-500"
//                       }`} />
//                       <div className="flex-1">
//                         <p className="text-sm text-gray-700">{activity.activity?.substring(0, 150)}</p>
//                         <p className="text-xs text-gray-400 mt-1">
//                           {activity.created_at ? new Date(activity.created_at).toLocaleString() : "N/A"}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </>
//           )}

//           {/* Job Service Tab */}
//           {selectedTab === "jobs" && stats && (
//             <div className="bg-white rounded-xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-800">Job Service Details</h3>
//                 <div className="flex gap-2">
//                   <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
//                     Total: {stats.jobService.total}
//                   </span>
//                   <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
//                     Pending: {stats.jobService.pending}
//                   </span>
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
//                     Completed: {stats.jobService.completed}
//                   </span>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-blue-600">{stats.jobService.approved}</p>
//                   <p className="text-xs text-gray-500">Approved</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-indigo-600">{stats.jobService.inProcess}</p>
//                   <p className="text-xs text-gray-500">In Process</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{stats.jobService.notOk}</p>
//                   <p className="text-xs text-gray-500">Not OK</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-gray-600">{stats.jobService.rejected}</p>
//                   <p className="text-xs text-gray-500">Rejected</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Total Quantity</p>
//                   <p className="text-xl font-semibold">{stats.jobService.totalQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Completed Quantity</p>
//                   <p className="text-xl font-semibold text-green-600">{stats.jobService.completedQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Pending Quantity</p>
//                   <p className="text-xl font-semibold text-yellow-600">{stats.jobService.pendingQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Urgent Jobs</p>
//                   <p className="text-xl font-semibold text-red-600">{stats.jobService.urgent}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* TSO Service Tab */}
//           {selectedTab === "tso" && stats && (
//             <div className="bg-white rounded-xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-800">TSO Service Details</h3>
//                 <div className="flex gap-2">
//                   <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
//                     Total: {stats.tsoService.total}
//                   </span>
//                   <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
//                     Pending: {stats.tsoService.pending}
//                   </span>
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
//                     Completed: {stats.tsoService.completed}
//                   </span>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-purple-600">{stats.tsoService.approved}</p>
//                   <p className="text-xs text-gray-500">Approved</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-indigo-600">{stats.tsoService.inProcess}</p>
//                   <p className="text-xs text-gray-500">In Process</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{stats.tsoService.notOk}</p>
//                   <p className="text-xs text-gray-500">Not OK</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-gray-600">{stats.tsoService.rejected}</p>
//                   <p className="text-xs text-gray-500">Rejected</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Total Quantity</p>
//                   <p className="text-xl font-semibold">{stats.tsoService.totalQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Completed Quantity</p>
//                   <p className="text-xl font-semibold text-green-600">{stats.tsoService.completedQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Pending Quantity</p>
//                   <p className="text-xl font-semibold text-yellow-600">{stats.tsoService.pendingQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Urgent TSOs</p>
//                   <p className="text-xl font-semibold text-red-600">{stats.tsoService.urgent}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Kanban Tab */}
//           {selectedTab === "kanban" && stats && (
//             <div className="bg-white rounded-xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-800">Kanban Details</h3>
//                 <div className="flex gap-2">
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
//                     Total: {stats.kanban.total}
//                   </span>
//                   <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
//                     Pending: {stats.kanban.pending}
//                   </span>
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
//                     Completed: {stats.kanban.completed}
//                   </span>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-green-600">{stats.kanban.approved}</p>
//                   <p className="text-xs text-gray-500">Approved</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-indigo-600">{stats.kanban.inProcess}</p>
//                   <p className="text-xs text-gray-500">In Process</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{stats.kanban.notOk}</p>
//                   <p className="text-xs text-gray-500">Not OK</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-gray-600">{stats.kanban.rejected}</p>
//                   <p className="text-xs text-gray-500">Rejected</p>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Total Quantity</p>
//                   <p className="text-xl font-semibold">{stats.kanban.totalQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Completed Quantity</p>
//                   <p className="text-xl font-semibold text-green-600">{stats.kanban.completedQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Pending Quantity</p>
//                   <p className="text-xl font-semibold text-yellow-600">{stats.kanban.pendingQty}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-500 mb-1">Urgent Kanban</p>
//                   <p className="text-xl font-semibold text-red-600">{stats.kanban.urgent}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Pending Materials Tab */}
//           {selectedTab === "pending" && (
//             <div className="bg-white rounded-xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-800">Pending Materials</h3>
//                 <div className="flex gap-2">
//                   <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
//                     Total: {stats?.pendingMaterials.total || 0}
//                   </span>
//                   <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
//                     Pending: {stats?.pendingMaterials.pending || 0}
//                   </span>
//                 </div>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job No</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {pendingItems
//                       .filter(item => filterType === "all" || true)
//                       .slice(0, 20)
//                       .map((item) => (
//                         <tr key={item.id} className="hover:bg-gray-50">
//                           <td className="px-4 py-3 text-sm text-gray-900">{item.job_no}</td>
//                           <td className="px-4 py-3 text-sm text-gray-600">{item.item_no}</td>
//                           <td className="px-4 py-3 text-sm text-gray-600">{item.description}</td>
//                           <td className="px-4 py-3 text-sm font-medium text-yellow-600">{item.qty}</td>
//                           <td className="px-4 py-3 text-sm text-gray-600">{item.client_name}</td>
//                           <td className="px-4 py-3 text-sm text-gray-500">
//                             {new Date(item.created_at).toLocaleDateString()}
//                           </td>
//                         </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//               {stats?.pendingMaterials.pending_by_client && stats.pendingMaterials.pending_by_client.length > 0 && (
//                 <div className="mt-6">
//                   <h4 className="text-md font-medium text-gray-700 mb-3">Pending by Client</h4>
//                   <div className="space-y-3">
//                     {stats.pendingMaterials.pending_by_client.map((client) => (
//                       <div key={client.client_name}>
//                         <div className="flex justify-between text-sm mb-1">
//                           <span className="font-medium">{client.client_name}</span>
//                           <span>{client.qty} units ({client.count} items)</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2">
//                           <div
//                             className="bg-orange-500 h-2 rounded-full"
//                             style={{ width: `${(client.qty / (stats.pendingMaterials.totalQty || 1)) * 100}%` }}
//                           />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* P/O Tab */}
//           {selectedTab === "po" && stats && (
//             <div className="bg-white rounded-xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-800">Purchase Orders (P/O)</h3>
//                 <div className="flex gap-2">
//                   <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
//                     Total: {stats.poServices.total}
//                   </span>
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
//                     Fine: {stats.poServices.fine}
//                   </span>
//                   <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
//                     Press Flow: {stats.poServices.pressFlow}
//                   </span>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-green-600">{stats.poServices.approved}</p>
//                   <p className="text-xs text-gray-500">Approved</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-yellow-600">{stats.poServices.pending}</p>
//                   <p className="text-xs text-gray-500">Pending</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{stats.poServices.rejected}</p>
//                   <p className="text-xs text-gray-500">Rejected</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-red-600">{stats.poServices.urgent}</p>
//                   <p className="text-xs text-gray-500">Urgent</p>
//                 </div>
//                 <div className="bg-gray-50 rounded-lg p-3 text-center">
//                   <p className="text-2xl font-bold text-blue-600">₹{stats.poServices.totalAmount.toLocaleString()}</p>
//                   <p className="text-xs text-gray-500">Total Amount</p>
//                 </div>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO No</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgent</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {poItems.slice(0, 15).map((po) => (
//                       <tr key={po.id} className="hover:bg-gray-50">
//                         <td className="px-4 py-3 text-sm font-medium text-gray-900">{po.po_no}</td>
//                         <td className="px-4 py-3 text-sm text-gray-600">{po.vendor_name}</td>
//                         <td className="px-4 py-3 text-sm">
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                             po.filter_type === "FINE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
//                           }`}>
//                             {po.filter_type}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3 text-sm text-gray-600">₹{po.amount.toLocaleString()}</td>
//                         <td className="px-4 py-3 text-sm">
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                             po.status === "approved" ? "bg-green-100 text-green-700" :
//                             po.status === "rejected" ? "bg-red-100 text-red-700" :
//                             "bg-yellow-100 text-yellow-700"
//                           }`}>
//                             {po.status}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3 text-sm">
//                           {po.urgent ? <FiAlertCircle className="text-red-500 w-4 h-4" /> : <FiCheckCircle className="text-gray-300 w-4 h-4" />}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Vendors Tab */}
//           {selectedTab === "vendors" && stats && (
//             <div className="bg-white rounded-xl shadow-sm p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-800">Vendors</h3>
//                 <div className="flex gap-2">
//                   <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
//                     Total: {stats.vendors.total}
//                   </span>
//                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
//                     Active: {stats.vendors.active}
//                   </span>
//                 </div>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {vendors.slice(0, 20).map((vendor) => (
//                       <tr key={vendor.id} className="hover:bg-gray-50">
//                         <td className="px-4 py-3 text-sm font-medium text-gray-900">{vendor.vendor}</td>
//                         <td className="px-4 py-3 text-sm text-gray-600">{vendor.company}</td>
//                         <td className="px-4 py-3 text-sm">
//                           <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
//                             {vendor.category}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3 text-sm text-gray-600">{vendor.city}</td>
//                         <td className="px-4 py-3 text-sm text-gray-500">{vendor.gstin}</td>
//                         <td className="px-4 py-3 text-sm text-gray-500">{vendor.mobile}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               {stats.vendors.by_category && stats.vendors.by_category.length > 0 && (
//                 <div className="mt-6">
//                   <h4 className="text-md font-medium text-gray-700 mb-3">Vendors by Category</h4>
//                   <div className="flex flex-wrap gap-3">
//                     {stats.vendors.by_category.map((cat) => (
//                       <div key={cat.category} className="bg-gray-100 rounded-lg px-4 py-2">
//                         <span className="font-medium">{cat.category}</span>
//                         <span className="ml-2 text-gray-500">({cat.count})</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }