// app/dashboard/page.tsx - MAIN DASHBOARD (Full Project Data)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CountUp from "react-countup";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { 
  FiRefreshCw, FiDownload, FiUsers, FiCpu, FiBriefcase, 
  FiAlertCircle, FiClock, FiTruck, FiInfo, FiCheckCircle,
  FiTrendingUp, FiTrendingDown, FiActivity,
  FiBarChart2, FiPieChart, FiCalendar, FiUserCheck,
  FiGrid, FiLayers, FiBox, FiTool, FiSettings,
  FiShoppingCart, FiFileText, FiXCircle
} from "react-icons/fi";
import { MdPendingActions, MdWorkOutline, MdDesignServices, MdViewKanban } from "react-icons/md";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import StorageManager from "../../provider/StorageManager";
import AxiosProvider from "../../provider/AxiosProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

interface DashboardStats {
  summary: {
    total_jobs: number;
    total_assignments: number;
    total_categories: number;
    total_pending_materials: number;
    total_po_services: number;
    active_workers: number;
    active_machines: number;
  };
  jobs: {
    total: number;
    totalQuantity: number;
    inProcess: number;
    completed: number;
    notOk: number;
    rejected: number;
    kanban: number;
    tso: number;
    jobService: number;
    urgent: number;
    approved: number;
    tsoInProcess: number;
    tsoCompleted: number;
    kanbanInProcess: number;
    kanbanCompleted: number;
    jobs_by_assignee: Array<{ assign_to: string; count: number }>;
  };
  assignments: {
    total: number;
    totalQuantity: number;
    inProgress: number;
    inReview: number;
    completed: number;
    qcVendor: number;
    qcWelding: number;
    notOk: number;
    machine: number;
    activeWorkers: number;
    activeVendors: number;
    assignments_by_worker: Array<{ worker_name: string; count: number; totalQty: number }>;
    assignments_by_machine: Array<{ machine_category: string; count: number; totalQty: number }>;
  };
  categories: {
    total: number;
    totalQuantity: number;
    top_categories: Array<{ job_category: string; jobCount: number; totalQty: number }>;
  };
  pending_materials: {
    total: number;
    totalQuantity: number;
    completed: number;
    pending: number;
    pending_by_client: Array<{ client_name: string; count: number; qty: number }>;
  };
  po_services: {
    total: number;
    urgent: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  };
  recent_activities: Array<{
    id: string;
    activity: string;
    type: string;
    module: string;
    created_at: string;
  }>;
  monthly_trends: {
    months: string[];
    job_trends: Array<{ month: string; job_count: number; total_quantity: number }>;
    assignment_trends: Array<{ month: string; completed_count: number; completed_quantity: number }>;
  };
  status_distribution: {
    job_status: Array<{ status: string; count: number }>;
    assignment_status: Array<{ status: string; count: number }>;
  };
  urgent_items: {
    urgent_jobs: Array<any>;
    urgent_categories: Array<any>;
    urgent_po_services: Array<any>;
  };
  last_updated: string;
}

interface RealTimeStats {
  active_jobs: number;
  pending_reviews: number;
  today_completed: number;
  pending_assignments: number;
  recent_completions: Array<{
    id: string;
    serial_no: string;
    worker_name: string;
    updated_at: string;
  }>;
  timestamp: string;
}

export default function MainDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realtime, setRealtime] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<"overview" | "workers" | "machines" | "clients" | "pending" | "po">("overview");
  const [chartKey, setChartKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, realtimeData] = await Promise.all([
        axiosProvider.get("/fineengg_erp/dashboard/stats"),
        axiosProvider.get("/fineengg_erp/dashboard/realtime")
      ]);
      
      if (statsData.data?.success) {
        setStats(statsData.data.data);
      }
      if (realtimeData.data?.success) {
        setRealtime(realtimeData.data.data);
      }
      setLastRefreshed(new Date());
      setError(null);
      setChartKey(prev => prev + 1);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.response?.data?.error || "Failed to load dashboard");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      axiosProvider.get("/dashboard/realtime").then(res => {
        if (res.data?.success) setRealtime(res.data.data);
      }).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => fetchData();

  const handleExport = async () => {
    try {
      const response = await axiosProvider.get("/dashboard/export");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-end min-h-screen bg-gray-50">
        <LeftSideBar />
        <div className="w-full md:w-[83%] bg-[#F5F7FA] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Main Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-end min-h-screen bg-gray-50">
        <LeftSideBar />
        <div className="w-full md:w-[83%] bg-[#F5F7FA] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={handleRefresh} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">
            <CountUp start={0} end={value} duration={1.5} separator="," />
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
    </div>
  );

  // Machine Categories from actual data
  const machineCategories = [
    { name: "Lathe", icon: FiTool, color: "bg-blue-500", jobs: stats?.assignments.assignments_by_machine?.find(m => m.machine_category === "Lathe")?.count || 0 },
    { name: "CNC", icon: FiSettings, color: "bg-purple-500", jobs: stats?.assignments.assignments_by_machine?.find(m => m.machine_category === "CNC")?.count || 0 },
    { name: "UMC", icon: FiCpu, color: "bg-green-500", jobs: stats?.assignments.assignments_by_machine?.find(m => m.machine_category === "UMC")?.count || 0 },
    { name: "Milling", icon: FiGrid, color: "bg-orange-500", jobs: stats?.assignments.assignments_by_machine?.find(m => m.machine_category === "Milling")?.count || 0 },
    { name: "Drilling", icon: FiActivity, color: "bg-red-500", jobs: stats?.assignments.assignments_by_machine?.find(m => m.machine_category === "Drilling")?.count || 0 },
  ];

  const machineUtilizationData = {
    labels: machineCategories.map(m => m.name),
    datasets: [{
      data: machineCategories.map(m => m.jobs),
      backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"],
      borderWidth: 0,
    }],
  };

  // Worker Performance Data
  const workerData = stats?.assignments.assignments_by_worker || [];
  
  const workerPerformanceData = {
    labels: workerData.slice(0, 10).map(w => w.worker_name || "Unknown"),
    datasets: [{
      label: 'Active Jobs',
      data: workerData.slice(0, 10).map(w => w.count),
      backgroundColor: '#8B5CF6',
      borderRadius: 8,
    }]
  };

  // Job Type Status Data
  const jobTypeStatusData = {
    labels: ['Job Service', 'TSO Service', 'Kanban'],
    datasets: [
      {
        label: 'In Progress',
        data: [
          stats?.jobs.inProcess || 0,
          stats?.jobs.tsoInProcess || 0,
          stats?.jobs.kanbanInProcess || 0,
        ],
        backgroundColor: '#F59E0B',
        borderRadius: 8,
      },
      {
        label: 'Completed',
        data: [
          stats?.jobs.completed || 0,
          stats?.jobs.tsoCompleted || 0,
          stats?.jobs.kanbanCompleted || 0,
        ],
        backgroundColor: '#10B981',
        borderRadius: 8,
      }
    ]
  };

  // Monthly Trends Data
  const monthlyTrendsData = {
    labels: stats?.monthly_trends?.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { 
        label: "Jobs Created", 
        data: stats?.monthly_trends?.job_trends?.map(t => t.job_count) || Array(12).fill(0),
        borderColor: "#3B82F6", 
        backgroundColor: "rgba(59,130,246,0.1)", 
        fill: true, 
        tension: 0.4,
      },
      { 
        label: "Completed Assignments", 
        data: stats?.monthly_trends?.assignment_trends?.map(t => t.completed_count) || Array(12).fill(0),
        borderColor: "#10B981", 
        backgroundColor: "rgba(16,185,129,0.1)", 
        fill: true, 
        tension: 0.4,
      }
    ]
  };

  // Job Status Distribution
  const jobStatusChartData = {
    labels: (stats?.status_distribution?.job_status || []).map(s => s.status === 'in-process' ? 'In Process' : s.status === 'completed' ? 'Completed' : s.status === 'not-ok' ? 'Not OK' : s.status === 'rejected' ? 'Rejected' : s.status),
    datasets: [{
      data: (stats?.status_distribution?.job_status || []).map(s => s.count),
      backgroundColor: ['#F59E0B', '#10B981', '#EF4444', '#6B7280', '#3B82F6', '#8B5CF6'],
      borderWidth: 0,
    }],
  };

  // Assignment Status Data
  const assignmentStatusLabels = ['In Progress', 'In Review', 'QC Vendor', 'QC Welding', 'Completed', 'Not OK', 'Machine'];
  const assignmentStatusData = [
    stats?.assignments.inProgress || 0,
    stats?.assignments.inReview || 0,
    stats?.assignments.qcVendor || 0,
    stats?.assignments.qcWelding || 0,
    stats?.assignments.completed || 0,
    stats?.assignments.notOk || 0,
    stats?.assignments.machine || 0,
  ];

  const assignmentStatusChartData = {
    labels: assignmentStatusLabels,
    datasets: [{
      data: assignmentStatusData,
      backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#EF4444', '#6B7280'],
      borderWidth: 0,
    }],
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🏭 Main Production Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Complete project overview - Last updated: {lastRefreshed.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
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
                  Export All Data
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Stats Cards */}
          {realtime && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Today Completed</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.today_completed}</p>
                    <p className="text-xs opacity-75 mt-1">Items dispatched</p>
                  </div>
                  <FiCheckCircle className="w-8 h-8 opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Active Jobs</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.active_jobs}</p>
                    <p className="text-xs opacity-75 mt-1">In progress</p>
                  </div>
                  <FiActivity className="w-8 h-8 opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Pending Reviews</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.pending_reviews}</p>
                    <p className="text-xs opacity-75 mt-1">Awaiting QC</p>
                  </div>
                  <FiClock className="w-8 h-8 opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Machine Load</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.pending_assignments}</p>
                    <p className="text-xs opacity-75 mt-1">On machine</p>
                  </div>
                  <FiCpu className="w-8 h-8 opacity-75" />
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards - Full Project Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard 
              title="Total Jobs" 
              value={stats?.jobs.total || 0} 
              icon={FiBriefcase}
              color="bg-blue-500"
              subtitle={`Total Qty: ${stats?.jobs.totalQuantity || 0}`}
            />
            <StatCard 
              title="Active Workers" 
              value={stats?.assignments.activeWorkers || 0} 
              icon={FiUserCheck}
              color="bg-green-500"
              subtitle="Currently working"
            />
            <StatCard 
              title="Pending Materials" 
              value={stats?.pending_materials.pending || 0} 
              icon={FiClock}
              color="bg-yellow-500"
              subtitle={`Qty: ${stats?.pending_materials.totalQuantity || 0}`}
            />
            <StatCard 
              title="Urgent Items" 
              value={stats?.jobs.urgent || 0} 
              icon={FiAlertCircle}
              color="bg-red-500"
              subtitle="Need immediate attention"
            />
          </div>

          {/* Additional Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Job Service</p>
              <p className="text-xl font-bold text-blue-600">{stats?.jobs.jobService || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">TSO Service</p>
              <p className="text-xl font-bold text-purple-600">{stats?.jobs.tso || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Kanban</p>
              <p className="text-xl font-bold text-green-600">{stats?.jobs.kanban || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">PO Services</p>
              <p className="text-xl font-bold text-orange-600">{stats?.po_services.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-xl font-bold text-teal-600">{stats?.categories.total || 0}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[
                { id: "overview", label: "Overview", icon: FiBarChart2 },
                { id: "workers", label: "Workers Performance", icon: FiUsers },
                { id: "machines", label: "Machines", icon: FiCpu },
                { id: "clients", label: "Clients", icon: FiTruck },
                { id: "pending", label: "Pending Materials", icon: FiBox },
                { id: "po", label: "Purchase Orders", icon: FiShoppingCart },
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Type Status</h3>
                  <Bar data={jobTypeStatusData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: "top" } }, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
                  <Line data={monthlyTrendsData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Status Distribution</h3>
                  <div className="flex justify-center">
                    <Doughnut data={jobStatusChartData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: "bottom" } } }} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Status</h3>
                  <div className="flex justify-center">
                    <Doughnut data={assignmentStatusChartData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: "bottom", labels: { font: { size: 10 } } } } }} />
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                    stats.recent_activities.slice(0, 15).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 border-b border-gray-100 hover:bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "create" ? "bg-green-500" :
                          activity.type === "update" ? "bg-blue-500" :
                          activity.type === "delete" ? "bg-red-500" : "bg-gray-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{activity.activity?.substring(0, 150)}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.created_at ? new Date(activity.created_at).toLocaleString() : "N/A"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No recent activities</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Workers Tab */}
          {selectedTab === "workers" && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Jobs</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats?.assignments.assignments_by_worker.map((worker) => (
                      <tr key={worker.worker_name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{worker.worker_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{worker.count}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{worker.totalQty}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (worker.count / 20) * 100)}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Machines Tab */}
          {selectedTab === "machines" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine Distribution</h3>
                <div className="flex justify-center">
                  <Doughnut data={machineUtilizationData} options={{ responsive: true }} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine-wise Load</h3>
                <div className="space-y-4">
                  {machineCategories.map((machine) => (
                    <div key={machine.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{machine.name}</span>
                        <span>{machine.jobs} jobs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${machine.color.replace('bg-', '')} h-2 rounded-full`} style={{ width: `${(machine.jobs / (stats?.assignments.total || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {selectedTab === "clients" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Jobs by Client</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium text-gray-500 border-b pb-2">
                  <span>Client</span>
                  <span>Jobs</span>
                  <span>Quantity</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Amar Equipment</span>
                    <span className="text-blue-600 font-semibold">{stats.jobs.jobService || 0}</span>
                    <span className="text-gray-600">{stats.jobs.totalQuantity || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Amar Biosystem</span>
                    <span className="text-purple-600 font-semibold">{stats.jobs.tso || 0}</span>
                    <span className="text-gray-600">-</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Materials Tab */}
          {selectedTab === "pending" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Materials</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_materials.pending}</p>
                  <p className="text-xs text-gray-500">Pending Items</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.pending_materials.completed}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
              {stats.pending_materials.pending_by_client.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Pending by Client</h4>
                  {stats.pending_materials.pending_by_client.map((client) => (
                    <div key={client.client_name} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{client.client_name}</span>
                        <span>{client.qty} units ({client.count} items)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(client.qty / (stats.pending_materials.totalQuantity || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PO Tab */}
          {selectedTab === "po" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Purchase Orders</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.po_services.total}</p>
                  <p className="text-xs text-gray-500">Total PO</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.po_services.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.po_services.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.po_services.rejected}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">₹{stats.po_services.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}