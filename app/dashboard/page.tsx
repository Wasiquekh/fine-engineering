// app/dashboard/page.tsx
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
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import { 
  FiRefreshCw, FiDownload, FiUsers, FiCpu, FiBriefcase, 
  FiAlertCircle, FiClock, FiTruck, FiInfo, FiCheckCircle,
  FiTrendingUp, FiTrendingDown, FiActivity,
  FiBarChart2, FiPieChart, FiCalendar, FiUserCheck,
  FiGrid, FiLayers, FiBox, FiTool, FiSettings
} from "react-icons/fi";
import { dashboardService, DashboardStats, RealTimeStats } from "../services/dashboard.service";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
// Option 1: Use MdVerified
import { MdVerified } from "react-icons/md";

// Option 3: Use IoCheckmarkCircle from react-icons/io5
import { IoCheckmarkCircle } from "react-icons/io5";

// Register ChartJS components
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

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realtime, setRealtime] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<"overview" | "workers" | "machines" | "clients">("overview");
  const [showTypeExplainer, setShowTypeExplainer] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, realtimeData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRealTimeStats()
      ]);
      setStats(statsData);
      setRealtime(realtimeData);
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
      dashboardService.getRealTimeStats().then(setRealtime).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = async () => {
    try {
      const data = await dashboardService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
            <p className="text-gray-600">Loading dashboard...</p>
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

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, trendValue }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">
            <CountUp start={0} end={value} duration={1.5} separator="," />
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <FiTrendingUp className="text-green-500 w-3 h-3" />
              ) : (
                <FiTrendingDown className="text-red-500 w-3 h-3" />
              )}
              <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
    </div>
  );

  // Machine Categories from your system
  const machineCategories = [
    { name: "Lathe", icon: FiTool, color: "blue", subTypes: ["Small", "Medium", "Large"] },
    { name: "CNC", icon: FiSettings, color: "purple", subTypes: ["Small", "Medium", "Large"] },
    { name: "UMC", icon: FiCpu, color: "green", subTypes: ["FVMC01"] },
    { name: "Milling", icon: FiGrid, color: "orange", subTypes: ["FML01"] },
    { name: "Drilling", icon: FiActivity, color: "red", subTypes: ["FDL01"] },
  ];

  // Mock machine utilization data based on your system
  const machineUtilizationData = {
    labels: machineCategories.map(m => m.name),
    datasets: [{
      data: [35, 28, 15, 12, 10],
      backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"],
      borderWidth: 0,
    }],
  };

  // Machine load details
  const machineLoadDetails = [
    { name: "Lathe", totalJobs: 35, completed: 28, inProgress: 7, workers: ["Naseem", "Sanjay", "Choto bhai", "Ali bhai"] },
    { name: "CNC", totalJobs: 28, completed: 20, inProgress: 8, workers: ["Ramjan ali", "Mustafa", "Akramuddeen", "Sufyan"] },
    { name: "UMC", totalJobs: 15, completed: 12, inProgress: 3, workers: ["Rajnish kumar"] },
    { name: "Milling", totalJobs: 12, completed: 9, inProgress: 3, workers: ["Ramakanat"] },
    { name: "Drilling", totalJobs: 10, completed: 7, inProgress: 3, workers: ["Rahman"] },
  ];

  // Job Type Status Data
  const jobTypeStatusData = {
    labels: ['Job Service', 'TSO Service', 'Kanban'],
    datasets: [
      {
        label: 'In Progress',
        data: [stats?.jobs.inProcess || 45, stats?.jobs.tsoInProcess || 18, stats?.jobs.kanbanInProcess || 12],
        backgroundColor: '#F59E0B',
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Completed',
        data: [stats?.jobs.completed || 38, stats?.jobs.tsoCompleted || 15, stats?.jobs.kanbanCompleted || 10],
        backgroundColor: '#10B981',
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ]
  };

  // Monthly Trends Data
  const monthlyTrendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { 
        label: "Jobs Created", 
        data: [12, 19, 15, 17, 14, 18, 22, 25, 28, 30, 32, 35], 
        borderColor: "#3B82F6", 
        backgroundColor: "rgba(59,130,246,0.1)", 
        fill: true, 
        tension: 0.4,
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      { 
        label: "Completed Assignments", 
        data: [8, 12, 11, 14, 12, 15, 18, 20, 22, 25, 28, 30], 
        borderColor: "#10B981", 
        backgroundColor: "rgba(16,185,129,0.1)", 
        fill: true, 
        tension: 0.4,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  // Job Status Distribution
  const jobStatusChartData = {
    labels: ['In Process', 'Completed', 'Not OK', 'Rejected'],
    datasets: [{
      data: [stats?.jobs.inProcess || 75, stats?.jobs.completed || 63, stats?.jobs.notOk || 12, stats?.jobs.rejected || 8],
      backgroundColor: ['#F59E0B', '#10B981', '#EF4444', '#6B7280'],
      borderWidth: 0,
    }],
  };

  // Assignment Status Data
  const assignmentStatusChartData = {
    labels: ['In Progress', 'In Review', 'QC Vendor', 'QC Welding', 'Completed', 'Not OK', 'Machine'],
    datasets: [{
      data: [
        realtime?.pending_assignments || 25,
        realtime?.pending_reviews || 12,
        stats?.assignments.qcVendor || 8,
        stats?.assignments.qcWelding || 5,
        stats?.assignments.completed || 63,
        stats?.assignments.notOk || 6,
        stats?.assignments.machine || 10,
      ],
      backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#EF4444', '#6B7280'],
      borderWidth: 0,
    }],
  };

  // Worker Performance Data
  const workerPerformanceData = {
    labels: ['Naseem', 'Sanjay', 'Ramjan', 'Mustafa', 'Rajnish', 'Ramakanat', 'Rahman'],
    datasets: [{
      label: 'Completed Jobs',
      data: [18, 15, 22, 18, 12, 9, 7],
      backgroundColor: '#8B5CF6',
      borderRadius: 8,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    }]
  };

  const JobTypeExplainer = () => (
    <div className="mb-4">
      <button
        onClick={() => setShowTypeExplainer(!showTypeExplainer)}
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <FiInfo className="w-4 h-4" />
        What are Jobs, JO, TSO & Kanban?
      </button>
      
      {showTypeExplainer && (
        <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">📊 Job Types Explained:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="font-bold text-blue-600 flex items-center gap-1">📋 JOB (Job Service)</span>
              <p className="text-gray-600 mt-1 text-xs">Regular manufacturing job with unique job_no</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="px-1 bg-yellow-100 text-yellow-700 rounded">In Progress: {stats?.jobs.inProcess || 45}</span>
                <span className="px-1 bg-green-100 text-green-700 rounded">Completed: {stats?.jobs.completed || 38}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="font-bold text-green-600 flex items-center gap-1">📦 JO (Job Order)</span>
              <p className="text-gray-600 mt-1 text-xs">Groups multiple items together under one order</p>
              <div className="mt-2 text-xs text-gray-500">Group orders for efficient tracking</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="font-bold text-purple-600 flex items-center gap-1">🔧 TSO (Technical Service)</span>
              <p className="text-gray-600 mt-1 text-xs">Service/maintenance work with unique tso_no</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="px-1 bg-yellow-100 text-yellow-700 rounded">Active: {stats?.jobs.tsoInProcess || 18}</span>
                <span className="px-1 bg-green-100 text-green-700 rounded">Completed: {stats?.jobs.tsoCompleted || 15}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <span className="font-bold text-orange-600 flex items-center gap-1">📊 KANBAN (Pull System)</span>
              <p className="text-gray-600 mt-1 text-xs">Just-in-time production system</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="px-1 bg-yellow-100 text-yellow-700 rounded">Active: {stats?.jobs.kanbanInProcess || 12}</span>
                <span className="px-1 bg-green-100 text-green-700 rounded">Completed: {stats?.jobs.kanbanCompleted || 10}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
            <span className="font-semibold">💡 Tip:</span> A single JO (Job Order) can contain multiple items of different types! This allows grouping related work together like Jobs, TSOs, and Kanban items under one order number.
          </div>
        </div>
      )}
    </div>
  );

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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Production Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Last updated: {lastRefreshed.toLocaleString()}
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
                  Export
                </button>
              </div>
            </div>
            <JobTypeExplainer />
          </div>

          {/* Real-time Stats Cards */}
          {realtime && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Today Completed</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.today_completed}</p>
                    <p className="text-xs opacity-75 mt-1">Items dispatched</p>
                  </div>
                  <FiCheckCircle className="w-8 h-8 opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Active Jobs</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.active_jobs}</p>
                    <p className="text-xs opacity-75 mt-1">In progress</p>
                  </div>
                  <FiActivity className="w-8 h-8 opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90">Pending Reviews</p>
                    <p className="text-2xl md:text-3xl font-bold">{realtime.pending_reviews}</p>
                    <p className="text-xs opacity-75 mt-1">Awaiting QC</p>
                  </div>
                  <FiClock className="w-8 h-8 opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white transform hover:scale-105 transition-transform duration-200">
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard 
              title="Total Jobs" 
              value={stats?.jobs.total || 158} 
              icon={FiBriefcase}
              color="bg-blue-500"
              subtitle={`Total Qty: ${stats?.jobs.totalQuantity || 6840}`}
              trend="up"
              trendValue="+12%"
            />
            <StatCard 
              title="Active Workers" 
              value={stats?.summary.active_workers || 24} 
              icon={FiUserCheck}
              color="bg-green-500"
              subtitle="Currently working"
            />
            <StatCard 
              title="Pending Materials" 
              value={stats?.pending_materials.pending || 15} 
              icon={FiClock}
              color="bg-yellow-500"
              subtitle={`Qty: ${stats?.pending_materials.totalQuantity || 320}`}
            />
            <StatCard 
              title="Urgent Items" 
              value={stats?.jobs.urgent || 8} 
              icon={FiAlertCircle}
              color="bg-red-500"
              subtitle="Need immediate attention"
            />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[
                { id: "overview", label: "Overview", icon: FiBarChart2 },
                { id: "workers", label: "Workers", icon: FiUsers },
                { id: "machines", label: "Machines", icon: FiCpu },
                { id: "clients", label: "Clients", icon: FiTruck },
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
              {/* Job Type Status Chart */}
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Job Type Status (In Progress vs Completed)</h3>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-xs text-gray-600">In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-gray-600">Completed</span>
                    </div>
                  </div>
                </div>
                <Bar 
                  key={`jobtype-${chartKey}`}
                  data={jobTypeStatusData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: { 
                      legend: { display: false },
                      tooltip: { 
                        callbacks: { 
                          label: (context) => `${context.dataset.label}: ${context.raw} jobs` 
                        } 
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true, 
                        grid: { color: "#e5e7eb" },
                        title: { display: true, text: "Number of Jobs", font: { size: 12 } }
                      },
                      x: { 
                        title: { display: true, text: "Job Type", font: { size: 12 } }
                      }
                    }
                  }} 
                />
              </div>

              {/* Two Column Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Monthly Trends</h3>
                    <FiTrendingUp className="text-green-500 w-5 h-5" />
                  </div>
                  <Line 
                    key={`trends-${chartKey}`}
                    data={monthlyTrendsData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: true,
                      plugins: { 
                        legend: { position: "top" as const },
                        tooltip: { mode: "index" as const, intersect: false }
                      },
                      scales: {
                        y: { beginAtZero: true, grid: { color: "#e5e7eb" }, title: { display: true, text: "Count" } },
                        x: { grid: { display: false }, title: { display: true, text: "Month" } }
                      }
                    }} 
                  />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Job Status Distribution</h3>
                    <FiPieChart className="text-blue-500 w-5 h-5" />
                  </div>
                  <div className="flex justify-center">
                    <Doughnut 
                      key={`jobstatus-${chartKey}`}
                      data={jobStatusChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: true,
                        plugins: { 
                          legend: { position: "bottom" as const },
                          tooltip: { 
                            callbacks: { 
                              label: (context) => `${context.label}: ${context.raw} jobs` 
                            } 
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Status and Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Assignment Status</h3>
                    <FiActivity className="text-purple-500 w-5 h-5" />
                  </div>
                  <div className="flex justify-center">
                    <Doughnut 
                      key={`assignstatus-${chartKey}`}
                      data={assignmentStatusChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: true,
                        plugins: { 
                          legend: { position: "bottom" as const, labels: { font: { size: 10 } } },
                          tooltip: { 
                            callbacks: { 
                              label: (context) => `${context.label}: ${context.raw} assignments` 
                            } 
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
                    <FiCalendar className="text-gray-500 w-5 h-5" />
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {stats?.recent_activities.slice(0, 10).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 border-b border-gray-100 hover:bg-gray-50 rounded transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "create" ? "bg-green-500" :
                          activity.type === "update" ? "bg-blue-500" :
                          activity.type === "delete" ? "bg-red-500" : 
                          activity.type === "dispatch" ? "bg-purple-500" : "bg-gray-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{activity.activity?.substring(0, 120) || "No description"}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.created_at ? new Date(activity.created_at).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Job Type Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Job Service</p>
                      <p className="text-2xl font-bold">{stats?.jobs.jobService || 83}</p>
                    </div>
                    <FiBriefcase className="w-8 h-8 opacity-75" />
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-yellow-400 rounded">In Progress: {stats?.jobs.inProcess || 45}</span>
                    <span className="px-2 py-1 bg-green-400 rounded">Completed: {stats?.jobs.completed || 38}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">TSO Service</p>
                      <p className="text-2xl font-bold">{stats?.jobs.tso || 33}</p>
                    </div>
                    <FiCpu className="w-8 h-8 opacity-75" />
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-yellow-400 rounded">Active: {stats?.jobs.tsoInProcess || 18}</span>
                    <span className="px-2 py-1 bg-green-400 rounded">Completed: {stats?.jobs.tsoCompleted || 15}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Kanban</p>
                      <p className="text-2xl font-bold">{stats?.jobs.kanban || 22}</p>
                    </div>
                    <FiGrid className="w-8 h-8 opacity-75" />
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-yellow-400 rounded">Active: {stats?.jobs.kanbanInProcess || 12}</span>
                    <span className="px-2 py-1 bg-green-400 rounded">Completed: {stats?.jobs.kanbanCompleted || 10}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Workers Tab */}
          {selectedTab === "workers" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Worker Performance</h3>
                  <FiUsers className="text-purple-500 w-5 h-5" />
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {[
                    { name: "Naseem", completed: 18, inProgress: 3, machine: "Lathe Small" },
                    { name: "Sanjay", completed: 15, inProgress: 2, machine: "Lathe Small" },
                    { name: "Ramjan ali", completed: 22, inProgress: 4, machine: "CNC Small" },
                    { name: "Mustafa", completed: 18, inProgress: 3, machine: "CNC Small" },
                    { name: "Rajnish kumar", completed: 12, inProgress: 3, machine: "UMC" },
                    { name: "Ramakanat", completed: 9, inProgress: 3, machine: "Milling" },
                    { name: "Rahman", completed: 7, inProgress: 2, machine: "Drilling" },
                    { name: "Ali bhai", completed: 12, inProgress: 2, machine: "Lathe Small" },
                    { name: "Aqif khan", completed: 8, inProgress: 1, machine: "CNC Large" },
                  ].map((worker, idx) => (
                    <div key={worker.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? "bg-yellow-100 text-yellow-700" :
                          idx === 1 ? "bg-gray-100 text-gray-700" :
                          idx === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{worker.name}</p>
                          <p className="text-xs text-gray-400">{worker.machine}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">{worker.completed} completed</p>
                          <p className="text-xs text-yellow-600">{worker.inProgress} in progress</p>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(worker.completed / 25) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Distribution</h3>
                <Bar 
                  key={`worker-${chartKey}`}
                  data={workerPerformanceData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: { 
                      legend: { display: false },
                      tooltip: { callbacks: { label: (context) => `${context.raw} completed jobs` } }
                    },
                    scales: {
                      y: { beginAtZero: true, grid: { color: "#e5e7eb" }, title: { display: true, text: "Completed Jobs" } },
                      x: { ticks: { maxRotation: 45, minRotation: 45, autoSkip: true } }
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {/* Machines Tab - Using your actual machine categories */}
          {selectedTab === "machines" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Machine Distribution</h3>
                  <FiPieChart className="text-pink-500 w-5 h-5" />
                </div>
                <div className="flex justify-center">
                  <Pie 
                    key={`machine-${chartKey}`}
                    data={machineUtilizationData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: true,
                      plugins: { 
                        legend: { position: "bottom" as const },
                        tooltip: { 
                          callbacks: { 
                            label: (context) => `${context.label}: ${context.raw} jobs` 
                          } 
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Machine-wise Load Details</h3>
                  <FiCpu className="text-blue-500 w-5 h-5" />
                </div>
                <div className="space-y-6 max-h-[450px] overflow-y-auto">
                  {machineLoadDetails.map((machine) => (
                    <div key={machine.name} className="border-b border-gray-100 pb-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            machine.name === "Lathe" ? "bg-blue-500" :
                            machine.name === "CNC" ? "bg-purple-500" :
                            machine.name === "UMC" ? "bg-green-500" :
                            machine.name === "Milling" ? "bg-orange-500" : "bg-red-500"
                          }`} />
                          <span className="font-semibold text-gray-800">{machine.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{machine.totalJobs} total jobs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            machine.name === "Lathe" ? "bg-blue-500" :
                            machine.name === "CNC" ? "bg-purple-500" :
                            machine.name === "UMC" ? "bg-green-500" :
                            machine.name === "Milling" ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${(machine.completed / machine.totalJobs) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Completed: {machine.completed}</span>
                        <span className="text-yellow-600">In Progress: {machine.inProgress}</span>
                        <span className="text-gray-400">Workers: {machine.workers.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {selectedTab === "clients" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Jobs by Client</h3>
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                  {[
                    { name: "Amar Equipment", jobs: 95, qty: 4250 },
                    { name: "Amar Biosystem", jobs: 63, qty: 2590 },
                  ].map((client) => (
                    <div key={client.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{client.name}</span>
                        <span className="text-gray-500">{client.jobs} jobs • {client.qty} units</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(client.jobs / 158) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Materials by Client</h3>
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                  {[
                    { name: "Amar Equipment", qty: 210, items: 9 },
                    { name: "Amar Biosystem", qty: 110, items: 6 },
                  ].map((client) => (
                    <div key={client.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{client.name}</span>
                        <span className="text-gray-500">{client.qty} units pending</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(client.qty / 320) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}