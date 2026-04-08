// app/section_production_planning/dashboard/page.tsx - PRODUCTION PLANNING DASHBOARD (Limited Data)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  FiRefreshCw,
  FiDownload,
  FiBriefcase,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiCalendar,
  FiBox,
  FiUsers,
  FiShoppingCart,
} from "react-icons/fi";
import { MdPendingActions, MdWorkOutline, MdDesignServices, MdViewKanban, MdCategory } from "react-icons/md";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import StorageManager from "../../../provider/StorageManager";
import AxiosProvider from "../../../provider/AxiosProvider";
import { hasPermission } from "../../component/utils/permissionUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface ProductionStats {
  jobService: {
    total: number;
    pending: number;
    approved: number;
    inProcess: number;
    completed: number;
    notOk: number;
    rejected: number;
    urgent: number;
    totalQty: number;
    completedQty: number;
    pendingQty: number;
  };
  tsoService: {
    total: number;
    pending: number;
    approved: number;
    inProcess: number;
    completed: number;
    notOk: number;
    rejected: number;
    urgent: number;
    totalQty: number;
    completedQty: number;
    pendingQty: number;
  };
  kanban: {
    total: number;
    pending: number;
    approved: number;
    inProcess: number;
    completed: number;
    notOk: number;
    rejected: number;
    urgent: number;
    totalQty: number;
    completedQty: number;
    pendingQty: number;
  };
  pendingMaterials: {
    total: number;
    pending: number;
    completed: number;
    totalQty: number;
    byClient: Array<{ client_name: string; count: number; qty: number }>;
  };
  poServices: {
    total: number;
    fine: number;
    pressFlow: number;
    approved: number;
    pending: number;
    rejected: number;
    urgent: number;
    totalAmount: number;
  };
  vendors: {
    total: number;
    active: number;
    byCategory: Array<{ category: string; count: number }>;
  };
  recentActivities: Array<{
    id: string;
    activity: string;
    type: string;
    module: string;
    created_at: string;
  }>;
  weeklyTrends: {
    labels: string[];
    jobService: number[];
    tsoService: number[];
    kanban: number[];
  };
  assigneeStats: Array<{
    assign_to: string;
    jobServiceCount: number;
    tsoServiceCount: number;
    kanbanCount: number;
    total: number;
  }>;
  urgentItems: Array<{
    id: string;
    job_no?: string;
    tso_no?: string;
    jo_number?: string;
    job_type: string;
    client_name: string;
    urgent_due_date: string;
    qty: number;
  }>;
}

export default function ProductionPlanningDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<"overview" | "category" | "jobs" | "tso" | "kanban">("overview");
  const [selectedClient, setSelectedClient] = useState<"all" | "Amar Equipment" | "Amar Biosystem">("all");
  const [selectedAssignee, setSelectedAssignee] = useState<"all" | "Usmaan" | "Riyaaz" | "Ramzaan">("all");

  const permissions = storage.getUserPermissions();
  const canCreateJob = hasPermission(permissions, "job.create");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosProvider.get("/fineengg_erp/producitondashboard/production-planning/dashboard-stats", {
          params: {
              client: selectedClient !== "all" ? selectedClient : undefined,
              assign_to: selectedAssignee !== "all" ? selectedAssignee : undefined,
          },
          headers: undefined
      });
      
      if (response.data?.success) {
        setStats(response.data.data);
      }
      
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedAssignee]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => fetchData();

  const handleExport = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/producitondashboard/production-planning/export-dashboard");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `production_planning_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleAddJob = (type: string) => {
    if (type === "JOB_SERVICE") {
      router.push("/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Equipment");
    } else if (type === "TSO_SERVICE") {
      router.push("/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Equipment");
    } else if (type === "KANBAN") {
      router.push("/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Equipment");
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-end min-h-screen bg-gray-50">
        <LeftSideBar />
        <div className="w-full md:w-[83%] bg-[#F5F7FA] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Production Planning Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-xl ${color}`}>
          {Icon && <Icon className="w-4 h-4 text-white" />}
        </div>
      </div>
    </div>
  );

  // Chart Data - Limited to Planning View
  const jobTypeChartData = {
    labels: ["Job Service", "TSO Service", "Kanban"],
    datasets: [
      {
        label: "Pending",
        data: [
          stats?.jobService.pending || 0,
          stats?.tsoService.pending || 0,
          stats?.kanban.pending || 0,
        ],
        backgroundColor: "#F59E0B",
        borderRadius: 8,
      },
      {
        label: "Approved",
        data: [
          stats?.jobService.approved || 0,
          stats?.tsoService.approved || 0,
          stats?.kanban.approved || 0,
        ],
        backgroundColor: "#10B981",
        borderRadius: 8,
      },
      {
        label: "In Process",
        data: [
          stats?.jobService.inProcess || 0,
          stats?.tsoService.inProcess || 0,
          stats?.kanban.inProcess || 0,
        ],
        backgroundColor: "#3B82F6",
        borderRadius: 8,
      },
      {
        label: "Completed",
        data: [
          stats?.jobService.completed || 0,
          stats?.tsoService.completed || 0,
          stats?.kanban.completed || 0,
        ],
        backgroundColor: "#8B5CF6",
        borderRadius: 8,
      },
    ],
  };

  const weeklyTrendsData = {
    labels: stats?.weeklyTrends.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Job Service",
        data: stats?.weeklyTrends.jobService || [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "TSO Service",
        data: stats?.weeklyTrends.tsoService || [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139,92,246,0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Kanban",
        data: stats?.weeklyTrends.kanban || [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#10B981",
        backgroundColor: "rgba(16,185,129,0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const assigneeChartData = {
    labels: stats?.assigneeStats.map(a => a.assign_to) || [],
    datasets: [
      {
        label: "Job Service",
        data: stats?.assigneeStats.map(a => a.jobServiceCount) || [],
        backgroundColor: "#3B82F6",
        borderRadius: 8,
      },
      {
        label: "TSO Service",
        data: stats?.assigneeStats.map(a => a.tsoServiceCount) || [],
        backgroundColor: "#8B5CF6",
        borderRadius: 8,
      },
      {
        label: "Kanban",
        data: stats?.assigneeStats.map(a => a.kanbanCount) || [],
        backgroundColor: "#10B981",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="flex justify-end min-h-screen bg-gray-50">
      <LeftSideBar />

      <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-screen">
        {/* <DesktopHeader /> */}

        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📋 Production Planning Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Planning & Category View - Last updated: {lastRefreshed.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FiDownload className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Client:</span>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Clients</option>
                  <option value="Amar Equipment">Amar Equipment</option>
                  <option value="Amar Biosystem">Amar Biosystem</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Assignee:</span>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Assignees</option>
                  <option value="Usmaan">Usmaan (Production 1)</option>
                  <option value="Riyaaz">Riyaaz (Production 2)</option>
                  <option value="Ramzaan">Ramzaan (Production 3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons - Only Planning Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {canCreateJob && (
              <>
                <button
                  onClick={() => handleAddJob("JOB_SERVICE")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <MdWorkOutline className="w-4 h-4" />
                  Plan Job Service
                </button>
                <button
                  onClick={() => handleAddJob("TSO_SERVICE")}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <MdDesignServices className="w-4 h-4" />
                  Plan TSO Service
                </button>
                <button
                  onClick={() => handleAddJob("KANBAN")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <MdViewKanban className="w-4 h-4" />
                  Plan Kanban
                </button>
              </>
            )}
          </div>

          {/* Summary Cards - Limited to Planning View */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Total Jobs" value={(stats?.jobService.total || 0) + (stats?.tsoService.total || 0) + (stats?.kanban.total || 0)} icon={FiBriefcase} color="bg-blue-500" />
            <StatCard title="Pending Approval" value={(stats?.jobService.pending || 0) + (stats?.tsoService.pending || 0) + (stats?.kanban.pending || 0)} icon={MdPendingActions} color="bg-yellow-500" />
            <StatCard title="In Production" value={(stats?.jobService.inProcess || 0) + (stats?.tsoService.inProcess || 0) + (stats?.kanban.inProcess || 0)} icon={FiActivity} color="bg-green-500" />
            <StatCard title="Urgent" value={(stats?.jobService.urgent || 0) + (stats?.tsoService.urgent || 0) + (stats?.kanban.urgent || 0)} icon={FiAlertCircle} color="bg-red-500" />
            <StatCard title="Completed" value={(stats?.jobService.completed || 0) + (stats?.tsoService.completed || 0) + (stats?.kanban.completed || 0)} icon={FiCheckCircle} color="bg-purple-500" />
          </div>

          {/* Tabs - Planning Focused */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[
                { id: "overview", label: "Planning Overview", icon: FiBarChart2 },
                { id: "category", label: "Categories", icon: MdCategory },
                { id: "jobs", label: "Job Service", icon: MdWorkOutline },
                { id: "tso", label: "TSO Service", icon: MdDesignServices },
                { id: "kanban", label: "Kanban", icon: MdViewKanban },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-1 py-3 border-b-2 transition-colors ${
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {selectedTab === "overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Type Status (Planning View)</h3>
                  <Bar data={jobTypeChartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Planning Trends</h3>
                  <Line data={weeklyTrendsData} options={{ responsive: true }} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Workload by Assignee</h3>
                  <Bar data={assigneeChartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quantity Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Total Quantity Planned</span>
                      <span className="font-bold">{(stats?.jobService.totalQty || 0) + (stats?.tsoService.totalQty || 0) + (stats?.kanban.totalQty || 0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span>Completed Quantity</span>
                      <span className="font-bold text-green-600">{(stats?.jobService.completedQty || 0) + (stats?.tsoService.completedQty || 0) + (stats?.kanban.completedQty || 0)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-yellow-50 rounded-lg">
                      <span>Pending Quantity</span>
                      <span className="font-bold text-yellow-600">{(stats?.jobService.pendingQty || 0) + (stats?.tsoService.pendingQty || 0) + (stats?.kanban.pendingQty || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Urgent Items */}
              {stats?.urgentItems && stats.urgentItems.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
                    <FiAlertCircle className="w-5 h-5" />
                    Urgent Planning Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job No/TSO No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.urgentItems.slice(0, 10).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.job_no || item.tso_no || item.jo_number}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.job_type === "JOB_SERVICE" ? "bg-blue-100 text-blue-700" :
                                item.job_type === "TSO_SERVICE" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                              }`}>
                                {item.job_type === "JOB_SERVICE" ? "Job Service" : item.job_type === "TSO_SERVICE" ? "TSO Service" : "Kanban"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.client_name}</td>
                            <td className="px-4 py-3 text-sm text-red-600 font-medium">
                              {item.urgent_due_date ? new Date(item.urgent_due_date).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Category Tab */}
          {selectedTab === "category" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Categories</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.jobService.total}</p>
                    <p className="text-sm text-gray-600">Job Service Categories</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.tsoService.total}</p>
                    <p className="text-sm text-gray-600">TSO Categories</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 text-center">Categories help organize and track different types of production jobs</p>
                </div>
              </div>
            </div>
          )}

          {/* Job Service Tab */}
          {selectedTab === "jobs" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Service Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.jobService.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.jobService.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.jobService.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.jobService.inProcess}</p>
                  <p className="text-xs text-gray-500">In Process</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-xl font-semibold">{stats.jobService.totalQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Quantity</p>
                  <p className="text-xl font-semibold text-green-600">{stats.jobService.completedQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Quantity</p>
                  <p className="text-xl font-semibold text-yellow-600">{stats.jobService.pendingQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Urgent Jobs</p>
                  <p className="text-xl font-semibold text-red-600">{stats.jobService.urgent}</p>
                </div>
              </div>
            </div>
          )}

          {/* TSO Service Tab */}
          {selectedTab === "tso" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TSO Service Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.tsoService.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.tsoService.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.tsoService.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.tsoService.inProcess}</p>
                  <p className="text-xs text-gray-500">In Process</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-xl font-semibold">{stats.tsoService.totalQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Quantity</p>
                  <p className="text-xl font-semibold text-green-600">{stats.tsoService.completedQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Quantity</p>
                  <p className="text-xl font-semibold text-yellow-600">{stats.tsoService.pendingQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Urgent TSOs</p>
                  <p className="text-xl font-semibold text-red-600">{stats.tsoService.urgent}</p>
                </div>
              </div>
            </div>
          )}

          {/* Kanban Tab */}
          {selectedTab === "kanban" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Kanban Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.kanban.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.kanban.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.kanban.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.kanban.inProcess}</p>
                  <p className="text-xs text-gray-500">In Process</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-xl font-semibold">{stats.kanban.totalQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Quantity</p>
                  <p className="text-xl font-semibold text-green-600">{stats.kanban.completedQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Quantity</p>
                  <p className="text-xl font-semibold text-yellow-600">{stats.kanban.pendingQty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Urgent Kanban</p>
                  <p className="text-xl font-semibold text-red-600">{stats.kanban.urgent}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}