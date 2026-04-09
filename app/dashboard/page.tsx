// app/dashboard/page.tsx - COMPLETE CORRECTED MAIN DASHBOARD
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
import { Bar, Doughnut } from "react-chartjs-2";
import {
  FiRefreshCw,
  FiUsers,
  FiCpu,
  FiBriefcase,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiBarChart2,
  FiUserCheck,
  FiBox,
  FiShoppingCart,
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

export default function MainDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "workers" | "machines" | "pending" | "po"
  >("overview");

  // All data states
  const [jobs, setJobs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<any[]>([]);
  const [poServices, setPoServices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📊 Fetching all dashboard data...");

      // Fetch all data in parallel
      const [
        jobsRes,
        assignmentsRes,
        categoriesRes,
        pendingRes,
        poRes,
        activitiesRes,
      ] = await Promise.all([
        axiosProvider.get("/jobs", {
          params: { limit: 10000 },
          headers: undefined,
        }),
        axiosProvider.get("/assign-to-worker", {
          params: { limit: 10000 },
          headers: undefined,
        }),
        axiosProvider.get("/categories", {
          params: { limit: 1000 },
          headers: undefined,
        }),
        axiosProvider.get("/pending-material", {
          params: { limit: 1000 },
          headers: undefined,
        }),
        axiosProvider.get("/po-services", {
          params: { limit: 1000 },
          headers: undefined,
        }),
        axiosProvider
          .get("/activities", { params: { limit: 100 }, headers: undefined })
          .catch(() => ({ data: { data: [] } })),
      ]);

      console.log("✅ Jobs:", jobsRes?.data?.data?.length || 0);
      console.log("✅ Assignments:", assignmentsRes?.data?.data?.length || 0);
      console.log("✅ Categories:", categoriesRes?.data?.data?.length || 0);
      console.log("✅ Pending:", pendingRes?.data?.data?.length || 0);
      console.log("✅ PO:", poRes?.data?.data?.length || 0);

      setJobs(jobsRes?.data?.data || []);
      setAssignments(assignmentsRes?.data?.data || []);
      setCategories(categoriesRes?.data?.data || []);
      setPendingMaterials(pendingRes?.data?.data || []);
      setPoServices(poRes?.data?.data || []);
      setActivities(activitiesRes?.data?.data || []);

      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err?.response?.data?.error || "Failed to load dashboard");
      if (err?.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRefresh = () => fetchAllData();

  if (loading && jobs.length === 0) {
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
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ JOB STATISTICS ============
  const jobServiceJobs = jobs.filter((j: any) => j.job_type === "JOB_SERVICE");
  const tsoJobs = jobs.filter((j: any) => j.job_type === "TSO_SERVICE");
  const kanbanJobs = jobs.filter((j: any) => j.job_type === "KANBAN");

  const jobStats = {
    total: jobs.length,
    totalQuantity: jobs.reduce(
      (sum: number, j: any) => sum + (Number(j.qty) || 0),
      0
    ),
    inProcess: jobs.filter((j: any) => j.status === "in-process").length,
    completed: jobs.filter((j: any) => j.status === "completed").length,
    notOk: jobs.filter((j: any) => j.status === "not-ok").length,
    rejected: jobs.filter((j: any) => j.rejected === true).length,
    kanban: kanbanJobs.length,
    tso: tsoJobs.length,
    jobService: jobServiceJobs.length,
    urgent: jobs.filter(
      (j: any) => j.urgent === true && j.status !== "completed"
    ).length,
    approved: jobs.filter((j: any) => j.is_approved === true).length,
    tsoInProcess: tsoJobs.filter((j: any) => j.status === "in-process").length,
    tsoCompleted: tsoJobs.filter((j: any) => j.status === "completed").length,
    kanbanInProcess: kanbanJobs.filter((j: any) => j.status === "in-process")
      .length,
    kanbanCompleted: kanbanJobs.filter((j: any) => j.status === "completed")
      .length,
  };

  // ============ ASSIGNMENT STATISTICS ============
  const assignmentStats = {
    total: assignments.length,
    totalQuantity: assignments.reduce(
      (sum: number, a: any) => sum + (Number(a.quantity_no) || 0),
      0
    ),
    inProgress: assignments.filter((a: any) => a.status === "in-progress")
      .length,
    inReview: assignments.filter((a: any) => a.status === "in-review").length,
    completed: assignments.filter((a: any) => a.status === "completed").length,
    qcVendor: assignments.filter((a: any) => a.status === "qc-vendor").length,
    qcWelding: assignments.filter((a: any) => a.status === "qc-welding").length,
    notOk: assignments.filter((a: any) => a.status === "not-ok").length,
    machine: assignments.filter((a: any) => a.status === "machine").length,
    activeWorkers: new Set(
      assignments
        .filter(
          (a: any) =>
            a.worker_name && a.status !== "completed" && a.status !== "rejected"
        )
        .map((a: any) => a.worker_name)
    ).size,
    totalWorkers: new Set(
      assignments
        .filter((a: any) => a.worker_name)
        .map((a: any) => a.worker_name)
    ).size,
  };

  // ============ WORKER PERFORMANCE ============
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
          machine_count: 0,
        });
      }
      const w = workerMap.get(a.worker_name);
      w.total_assignments++;
      w.total_quantity += Number(a.quantity_no) || 0;
      if (a.status === "completed") w.completed_count++;
      if (a.status === "in-progress") w.in_progress_count++;
      if (a.status === "in-review") w.in_review_count++;
      if (a.status === "not-ok") w.not_ok_count++;
      if (a.status === "machine") w.machine_count++;
    }
  });

  const workersList = Array.from(workerMap.values())
    .map((w: any) => ({
      ...w,
      completion_rate:
        w.total_assignments > 0
          ? Math.round((w.completed_count / w.total_assignments) * 100)
          : 0,
      active_jobs: w.in_progress_count + w.in_review_count + w.machine_count,
    }))
    .sort((a, b) => b.total_assignments - a.total_assignments);

  // ============ MACHINE UTILIZATION ============
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

  const machinesList = Array.from(machineMap.values())
    .map((m: any) => ({
      ...m,
      utilization_rate:
        m.total_jobs > 0
          ? Math.round((m.completed_jobs / m.total_jobs) * 100)
          : 0,
    }))
    .sort((a, b) => b.total_jobs - a.total_jobs);

  // ============ PENDING MATERIALS ============
  const pendingStats = {
    total: pendingMaterials.length,
    totalQuantity: pendingMaterials.reduce(
      (sum: number, p: any) => sum + (Number(p.qty) || 0),
      0
    ),
    completed: pendingMaterials.filter((p: any) => p.is_completed === true)
      .length,
    pending: pendingMaterials.filter((p: any) => p.is_completed === false)
      .length,
  };

  const pendingByClientMap = new Map();
  pendingMaterials.forEach((p: any) => {
    if (p.client_name && !p.is_completed) {
      if (!pendingByClientMap.has(p.client_name)) {
        pendingByClientMap.set(p.client_name, { count: 0, qty: 0 });
      }
      const pc = pendingByClientMap.get(p.client_name);
      pc.count++;
      pc.qty += Number(p.qty) || 0;
    }
  });
  const pendingByClient = Array.from(pendingByClientMap.entries()).map(
    ([name, data]) => ({
      client_name: name,
      count: data.count,
      qty: data.qty,
    })
  );

  // ============ PO STATISTICS ============
  const poStats = {
    total: poServices.length,
    pending: poServices.filter((p: any) => p.status === "pending").length,
    approved: poServices.filter((p: any) => p.status === "approved").length,
    rejected: poServices.filter((p: any) => p.status === "rejected").length,
    totalAmount: poServices.reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0),
      0
    ),
  };

  // ============ URGENT ITEMS ============
  const urgentJobs = jobs.filter(
    (j: any) => j.urgent === true && j.status !== "completed"
  );

  // ============ CATEGORIES SUMMARY ============
  const categoryStats = {
    total: categories.length,
    withJobNo: categories.filter((c: any) => c.job_no).length,
  };

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

  // Chart Data
  const jobTypeChartData = {
    labels: ["Job Service", "TSO Service", "Kanban"],
    datasets: [
      {
        label: "In Progress",
        data: [
          jobStats.inProcess,
          jobStats.tsoInProcess,
          jobStats.kanbanInProcess,
        ],
        backgroundColor: "#F59E0B",
        borderRadius: 8,
      },
      {
        label: "Completed",
        data: [
          jobStats.completed,
          jobStats.tsoCompleted,
          jobStats.kanbanCompleted,
        ],
        backgroundColor: "#10B981",
        borderRadius: 8,
      },
    ],
  };

  const assignmentStatusData = {
    labels: [
      "In Progress",
      "In Review",
      "QC Vendor",
      "QC Welding",
      "Completed",
      "Not OK",
      "Machine",
    ],
    datasets: [
      {
        data: [
          assignmentStats.inProgress,
          assignmentStats.inReview,
          assignmentStats.qcVendor,
          assignmentStats.qcWelding,
          assignmentStats.completed,
          assignmentStats.notOk,
          assignmentStats.machine,
        ],
        backgroundColor: [
          "#F59E0B",
          "#3B82F6",
          "#8B5CF6",
          "#EC4899",
          "#10B981",
          "#EF4444",
          "#6B7280",
        ],
        borderWidth: 0,
      },
    ],
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  🏭 Main Production Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Last updated: {lastRefreshed.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
                >
                  <FiRefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard
              title="Total Jobs"
              value={jobStats.total}
              icon={FiBriefcase}
              color="bg-blue-500"
              subtitle={`Qty: ${jobStats.totalQuantity}`}
            />
            <StatCard
              title="Active Workers"
              value={assignmentStats.activeWorkers}
              icon={FiUserCheck}
              color="bg-green-500"
              subtitle="Currently working"
            />
            <StatCard
              title="Pending Materials"
              value={pendingStats.pending}
              icon={FiClock}
              color="bg-yellow-500"
              subtitle={`Qty: ${pendingStats.totalQuantity}`}
            />
            <StatCard
              title="Urgent Items"
              value={jobStats.urgent}
              icon={FiAlertCircle}
              color="bg-red-500"
              subtitle="Need immediate attention"
            />
          </div>

          {/* Job Type Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Job Service</p>
              <p className="text-xl font-bold text-blue-600">
                {jobStats.jobService}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">TSO Service</p>
              <p className="text-xl font-bold text-purple-600">
                {jobStats.tso}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Kanban</p>
              <p className="text-xl font-bold text-green-600">
                {jobStats.kanban}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">PO Services</p>
              <p className="text-xl font-bold text-orange-600">
                {poStats.total}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-xl font-bold text-teal-600">
                {categoryStats.total}
              </p>
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Job Type Status
                  </h3>
                  <Bar
                    data={jobTypeChartData}
                    options={{
                      responsive: true,
                      scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true },
                      },
                    }}
                  />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Assignment Status
                  </h3>
                  <div className="flex justify-center">
                    <Doughnut
                      data={assignmentStatusData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: { font: { size: 10 } },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Categories Table */}
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Categories
                </h3>
                {categories.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Job No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Client
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {categories.slice(0, 10).map((cat: any) => (
                          <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {cat.job_no}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {cat.job_category || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {cat.description || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">
                              {cat.qty}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {cat.client_name || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No categories found
                  </div>
                )}
              </div>

              {/* Urgent Items */}
              {urgentJobs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
                    <FiAlertCircle className="w-5 h-5" />
                    Urgent Items ({urgentJobs.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Job/TSO No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Client
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {urgentJobs.slice(0, 10).map((job: any) => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {job.job_no || job.tso_no}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  job.job_type === "JOB_SERVICE"
                                    ? "bg-blue-100 text-blue-700"
                                    : job.job_type === "TSO_SERVICE"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {job.job_type === "JOB_SERVICE"
                                  ? "Job Service"
                                  : job.job_type === "TSO_SERVICE"
                                  ? "TSO"
                                  : "Kanban"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {job.client_name || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {job.qty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Activities
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activities.length > 0 ? (
                    activities.slice(0, 15).map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 border-b border-gray-100 hover:bg-gray-50 rounded"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === "create"
                              ? "bg-green-500"
                              : activity.type === "update"
                              ? "bg-blue-500"
                              : activity.type === "delete"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">
                            {activity.activity?.substring(0, 150)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.created_at
                              ? new Date(activity.created_at).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent activities
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Workers Tab */}
          {selectedTab === "workers" && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Worker Performance
                </h3>
                <div className="flex gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Active Workers: {assignmentStats.activeWorkers}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Total Workers: {assignmentStats.totalWorkers}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Worker
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Jobs
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        In Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        In Review
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Not OK
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workersList.length > 0 ? (
                      workersList.map((worker: any) => (
                        <tr
                          key={worker.worker_name}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {worker.worker_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {worker.total_assignments}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {worker.total_quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                            {worker.completed_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-600">
                            {worker.in_progress_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-blue-600">
                            {worker.in_review_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            {worker.not_ok_count}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{
                                    width: `${worker.completion_rate}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold">
                                {worker.completion_rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-8 text-gray-500"
                        >
                          No worker data available
                        </td>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Machine Utilization
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Machine
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Jobs
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        In Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Utilization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {machinesList.length > 0 ? (
                      machinesList.map((machine: any) => (
                        <tr
                          key={machine.machine_category}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {machine.machine_category}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {machine.total_jobs}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {machine.total_quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            {machine.completed_jobs}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-600">
                            {machine.in_progress_jobs}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${machine.utilization_rate}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold">
                                {machine.utilization_rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No machine data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Materials Tab */}
          {selectedTab === "pending" && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Pending Materials
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingStats.pending}
                  </p>
                  <p className="text-xs text-gray-500">Pending Items</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {pendingStats.completed}
                  </p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
              {pendingByClient.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">
                    Pending by Client
                  </h4>
                  {pendingByClient.map((client: any) => (
                    <div key={client.client_name} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                          {client.client_name}
                        </span>
                        <span>
                          {client.qty} units ({client.count} items)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (client.qty / (pendingStats.totalQuantity || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PO Tab */}
          {selectedTab === "po" && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Purchase Orders
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {poStats.total}
                  </p>
                  <p className="text-xs text-gray-500">Total PO</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {poStats.approved}
                  </p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {poStats.pending}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {poStats.rejected}
                  </p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{poStats.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
