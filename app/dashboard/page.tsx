// app/dashboard/page.tsx - COMPLETE FIXED MAIN DASHBOARD
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
  FiAlertCircle, FiClock, FiTruck, FiCheckCircle,
  FiTrendingUp, FiActivity,
  FiBarChart2, FiPieChart, FiCalendar, FiUserCheck,
  FiGrid, FiBox, FiTool, FiSettings,
  FiShoppingCart
} from "react-icons/fi";
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
  };
  workers: Array<{
    worker_name: string;
    total_assignments: number;
    total_quantity: number;
    completed_count: number;
    in_progress_count: number;
    in_review_count: number;
    not_ok_count: number;
    completion_rate: number;
  }>;
  machines: Array<{
    machine_category: string;
    total_jobs: number;
    total_quantity: number;
    completed_jobs: number;
    in_progress_jobs: number;
    utilization_rate: number;
  }>;
  categories: {
    total: number;
    list: Array<{
      id: string;
      job_no: string;
      job_category: string;
      description: string;
      qty: number;
      client_name: string;
    }>;
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
  urgent_items: Array<{
    id: string;
    job_no?: string;
    tso_no?: string;
    job_type: string;
    client_name: string;
    urgent_due_date: string;
    qty: number;
  }>;
}

export default function MainDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<"overview" | "workers" | "machines" | "pending" | "po">("overview");
  const [chartKey, setChartKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📊 Fetching Main Dashboard data...");
      
      // Fetch all data in parallel
      const [
        jobsRes,
        assignmentsRes,
        workersRes,
        machinesRes,
        categoriesRes,
        pendingRes,
        poRes,
        activitiesRes,
        urgentRes
      ] = await Promise.all([
        axiosProvider.get("/jobs", { params: { limit: 1000 } }),
        axiosProvider.get("/assign-to-worker", { params: { limit: 1000 } }),
        axiosProvider.get("/dashboard/worker-performance", { params: { limit: 100 } }),
        axiosProvider.get("/dashboard/machine-utilization"),
        axiosProvider.get("/categories", { params: { limit: 100 } }),
        axiosProvider.get("/pending-material", { params: { limit: 100 } }),
        axiosProvider.get("/po-services", { params: { limit: 100 } }),
        axiosProvider.get("/dashboard/recent-activities", { params: { limit: 50 } }),
        axiosProvider.get("/jobs", { params: { urgent: true, limit: 20 } })
      ]);
      
      console.log("📊 Jobs Response:", jobsRes.data);
      console.log("📊 Assignments Response:", assignmentsRes.data);
      console.log("👥 Workers Response:", workersRes.data);
      console.log("🔧 Machines Response:", machinesRes.data);
      
      // Process Jobs Data
      const jobs = jobsRes.data?.data || [];
      const jobServiceJobs = jobs.filter((j: any) => j.job_type === "JOB_SERVICE");
      const tsoJobs = jobs.filter((j: any) => j.job_type === "TSO_SERVICE");
      const kanbanJobs = jobs.filter((j: any) => j.job_type === "KANBAN");
      
      const jobStats = {
        total: jobs.length,
        totalQuantity: jobs.reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        inProcess: jobs.filter((j: any) => j.status === "in-process").length,
        completed: jobs.filter((j: any) => j.status === "completed").length,
        notOk: jobs.filter((j: any) => j.status === "not-ok").length,
        rejected: jobs.filter((j: any) => j.rejected === true).length,
        kanban: kanbanJobs.length,
        tso: tsoJobs.length,
        jobService: jobServiceJobs.length,
        urgent: jobs.filter((j: any) => j.urgent === true).length,
        approved: jobs.filter((j: any) => j.is_approved === true).length,
        tsoInProcess: tsoJobs.filter((j: any) => j.status === "in-process").length,
        tsoCompleted: tsoJobs.filter((j: any) => j.status === "completed").length,
        kanbanInProcess: kanbanJobs.filter((j: any) => j.status === "in-process").length,
        kanbanCompleted: kanbanJobs.filter((j: any) => j.status === "completed").length,
      };
      
      // Process Assignments Data
      const assignments = assignmentsRes.data?.data || [];
      const assignmentStats = {
        total: assignments.length,
        totalQuantity: assignments.reduce((sum: number, a: any) => sum + (Number(a.quantity_no) || 0), 0),
        inProgress: assignments.filter((a: any) => a.status === "in-progress").length,
        inReview: assignments.filter((a: any) => a.status === "in-review").length,
        completed: assignments.filter((a: any) => a.status === "completed").length,
        qcVendor: assignments.filter((a: any) => a.status === "qc-vendor").length,
        qcWelding: assignments.filter((a: any) => a.status === "qc-welding").length,
        notOk: assignments.filter((a: any) => a.status === "not-ok").length,
        machine: assignments.filter((a: any) => a.status === "machine").length,
        activeWorkers: new Set(assignments.filter((a: any) => a.worker_name && a.status !== "completed").map((a: any) => a.worker_name)).size,
        activeVendors: new Set(assignments.filter((a: any) => a.vendor_name).map((a: any) => a.vendor_name)).size,
      };
      
      // Process Workers Data - From Assignments
      const workerMap = new Map();
      assignments.forEach((a: any) => {
        if (a.worker_name) {
          if (!workerMap.has(a.worker_name)) {
            workerMap.set(a.worker_name, {
              worker_name: a.worker_name,
              total_assignments: 0,
              total_quantity: 0,
              completed_count: 0,
              in_progress_count: 0,
              in_review_count: 0,
              not_ok_count: 0,
            });
          }
          const w = workerMap.get(a.worker_name);
          w.total_assignments++;
          w.total_quantity += Number(a.quantity_no) || 0;
          if (a.status === "completed") w.completed_count++;
          if (a.status === "in-progress") w.in_progress_count++;
          if (a.status === "in-review") w.in_review_count++;
          if (a.status === "not-ok") w.not_ok_count++;
        }
      });
      
      const workersList = Array.from(workerMap.values()).map((w: any) => ({
        ...w,
        completion_rate: w.total_assignments > 0 ? Math.round((w.completed_count / w.total_assignments) * 100) : 0
      })).sort((a, b) => b.total_assignments - a.total_assignments);
      
      // Process Machines Data - From Assignments
      const machineMap = new Map();
      assignments.forEach((a: any) => {
        if (a.machine_category) {
          const cat = a.machine_category;
          if (!machineMap.has(cat)) {
            machineMap.set(cat, {
              machine_category: cat,
              total_jobs: 0,
              total_quantity: 0,
              completed_jobs: 0,
              in_progress_jobs: 0,
            });
          }
          const m = machineMap.get(cat);
          m.total_jobs++;
          m.total_quantity += Number(a.quantity_no) || 0;
          if (a.status === "completed") m.completed_jobs++;
          if (a.status === "in-progress") m.in_progress_jobs++;
        }
      });
      
      const machinesList = Array.from(machineMap.values()).map((m: any) => ({
        ...m,
        utilization_rate: m.total_jobs > 0 ? Math.round((m.completed_jobs / m.total_jobs) * 100) : 0
      })).sort((a, b) => b.total_jobs - a.total_jobs);
      
      // Process Categories
      const categories = categoriesRes.data?.data || [];
      const categoriesList = categories.map((c: any) => ({
        id: c.id,
        job_no: c.job_no,
        job_category: c.job_category || 'N/A',
        description: c.description,
        qty: c.qty,
        client_name: c.client_name,
      }));
      
      // Process Pending Materials
      const pendingMaterials = pendingRes.data?.data || [];
      const pendingStats = {
        total: pendingMaterials.length,
        totalQuantity: pendingMaterials.reduce((sum: number, p: any) => sum + (Number(p.qty) || 0), 0),
        completed: pendingMaterials.filter((p: any) => p.is_completed === true).length,
        pending: pendingMaterials.filter((p: any) => p.is_completed === false).length,
        pending_by_client: [],
      };
      
      // Group pending by client
      const pendingByClient = new Map();
      pendingMaterials.forEach((p: any) => {
        if (p.client_name && !p.is_completed) {
          if (!pendingByClient.has(p.client_name)) {
            pendingByClient.set(p.client_name, { count: 0, qty: 0 });
          }
          const pc = pendingByClient.get(p.client_name);
          pc.count++;
          pc.qty += Number(p.qty) || 0;
        }
      });
      pendingStats.pending_by_client = Array.from(pendingByClient.entries()).map(([name, data]) => ({
        client_name: name,
        count: data.count,
        qty: data.qty
      }));
      
      // Process PO Services
      const poServices = poRes.data?.data || [];
      const poStats = {
        total: poServices.length,
        pending: poServices.filter((p: any) => p.status === "pending").length,
        approved: poServices.filter((p: any) => p.status === "approved").length,
        rejected: poServices.filter((p: any) => p.status === "rejected").length,
        totalAmount: poServices.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0),
      };
      
      // Process Recent Activities
      const activities = activitiesRes.data?.data || [];
      
      // Process Urgent Items
      const urgentJobs = (urgentRes.data?.data || []).filter((j: any) => j.urgent === true);
      
      setStats({
        summary: {
          total_jobs: jobStats.total,
          total_assignments: assignmentStats.total,
          total_categories: categoriesList.length,
          total_pending_materials: pendingStats.total,
          total_po_services: poStats.total,
          active_workers: assignmentStats.activeWorkers,
          active_machines: machinesList.length,
        },
        jobs: jobStats,
        assignments: assignmentStats,
        workers: workersList,
        machines: machinesList,
        categories: {
          total: categoriesList.length,
          list: categoriesList,
        },
        pending_materials: pendingStats,
        po_services: poStats,
        recent_activities: activities.slice(0, 20),
        monthly_trends: { months: [], job_trends: [], assignment_trends: [] },
        urgent_items: urgentJobs,
      });
      
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
    const interval = setInterval(fetchData, 60000);
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
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">
            <CountUp start={0} end={value || 0} duration={1.5} separator="," />
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
    </div>
  );

  // Job Type Status Chart
  const jobTypeChartData = {
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

  // Assignment Status Chart
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
        <DesktopHeader />

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
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
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

          {/* Job Type Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Job Service</p>
              <p className="text-xl font-bold text-blue-600">{stats?.jobs.jobService || 0}</p>
              <p className="text-xs text-gray-400">Total Jobs</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">TSO Service</p>
              <p className="text-xl font-bold text-purple-600">{stats?.jobs.tso || 0}</p>
              <p className="text-xs text-gray-400">Total TSOs</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Kanban</p>
              <p className="text-xl font-bold text-green-600">{stats?.jobs.kanban || 0}</p>
              <p className="text-xs text-gray-400">Total Kanban</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">PO Services</p>
              <p className="text-xl font-bold text-orange-600">{stats?.po_services.total || 0}</p>
              <p className="text-xs text-gray-400">Total POs</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-xl font-bold text-teal-600">{stats?.categories?.total || 0}</p>
              <p className="text-xs text-gray-400">Total Categories</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[
                { id: "overview", label: "Overview", icon: FiBarChart2 },
                { id: "workers", label: "Workers", icon: FiUsers },
                { id: "machines", label: "Machines", icon: FiCpu },
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
                  <Bar key={`jobtype-${chartKey}`} data={jobTypeChartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Status</h3>
                  <div className="flex justify-center">
                    <Doughnut key={`assign-${chartKey}`} data={assignmentStatusChartData} options={{ responsive: true, plugins: { legend: { position: "bottom", labels: { font: { size: 10 } } } } }} />
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories Overview</h3>
                {stats?.categories?.list && stats.categories.list.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.categories.list.slice(0, 15).map((category) => (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.job_no}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{category.job_category}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{category.description || '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-yellow-600">{category.qty}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{category.client_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No categories found</div>
                )}
              </div>

              {/* Urgent Items */}
              {stats?.urgent_items && stats.urgent_items.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
                    <FiAlertCircle className="w-5 h-5" />
                    Urgent Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job/TSO No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.urgent_items.slice(0, 10).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.job_no || item.tso_no}</td>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats?.workers && stats.workers.length > 0 ? (
                      stats.workers.map((worker) => (
                        <tr key={worker.worker_name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{worker.worker_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{worker.total_assignments}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{worker.total_quantity}</td>
                          <td className="px-4 py-3 text-sm text-green-600">{worker.completed_count}</td>
                          <td className="px-4 py-3 text-sm text-yellow-600">{worker.in_progress_count}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${worker.completion_rate}%` }} />
                              </div>
                              <span className="text-xs">{worker.completion_rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">No worker data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Machines Tab */}
          {selectedTab === "machines" && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine Utilization</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats?.machines && stats.machines.length > 0 ? (
                      stats.machines.map((machine) => (
                        <tr key={machine.machine_category} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{machine.machine_category}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{machine.total_jobs}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{machine.total_quantity}</td>
                          <td className="px-4 py-3 text-sm text-green-600">{machine.completed_jobs}</td>
                          <td className="px-4 py-3 text-sm text-yellow-600">{machine.in_progress_jobs}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${machine.utilization_rate}%` }} />
                              </div>
                              <span className="text-xs">{machine.utilization_rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">No machine data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.po_services.total}</p>
                  <p className="text-xs text-gray-500">Total PO</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.po_services.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.po_services.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
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