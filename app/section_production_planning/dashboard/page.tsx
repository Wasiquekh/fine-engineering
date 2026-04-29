// app/section_production_planning/dashboard/page.tsx
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
  FiGrid,
  FiTool,
  FiTruck,
} from "react-icons/fi";
import { MdPendingActions, MdWorkOutline, MdDesignServices, MdViewKanban, MdCategory } from "react-icons/md";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import StorageManager from "../../../provider/StorageManager";
import AxiosProvider from "../../../provider/AxiosProvider";
import { hasPermission, normalizeUrgent, urgentBadgeClass, type UrgentStatus } from "../../component/utils/permissionUtils";

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
  categories: {
    total: number;
    list: Array<{
      id: string;
      job_no: string;
      job_category: string;
      description: string;
      qty: number;
      client_name: string;
      material_type: string;
      is_urgent: UrgentStatus;
      created_at: string;
    }>;
  };
  welding: {
    total: number;
    totalQty: number;
    items: Array<{
      id: string;
      serial_no: string;
      jo_no: string;
      item_no: number;
      quantity_no: number;
      status: string;
      job_type: string;
      job_no: string;
      tso_no: string;
      client_name: string;
      worker_name: string;
      created_at: string;
    }>;
  };
  vendor: {
    total: number;
    totalQty: number;
    items: Array<{
      id: string;
      serial_no: string;
      jo_no: string;
      item_no: number;
      quantity_no: number;
      status: string;
      vendor_name: string;
      job_type: string;
      job_no: string;
      tso_no: string;
      client_name: string;
      created_at: string;
    }>;
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
  recentActivities: Array<{
    id: string;
    activity: string;
    type: string;
    module: string;
    created_at: string;
  }>;
}

export default function ProductionPlanningDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<"overview" | "category" | "jobs" | "tso" | "kanban" | "welding" | "vendor">("overview");
  const [selectedClient, setSelectedClient] = useState<"all" | "Amar Equipment" | "Amar Biosystem">("all");
  const [selectedAssignee, setSelectedAssignee] = useState<"all" | "Usmaan" | "Riyaaz" | "Ramzan">("all");

  const permissions = storage.getUserPermissions();
  const canCreateJob = hasPermission(permissions, "job.create");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("📊 Fetching Production Planning Dashboard data...");
      
      // Build params
      const params: any = {};
      if (selectedClient !== "all") params.client_name = selectedClient;
      if (selectedAssignee !== "all") params.assign_to = selectedAssignee;
      
      // Fetch all data in parallel
      const [
        jobServiceRes,
        tsoServiceRes,
        kanbanRes,
        categoriesRes,
        weldingRes,
        vendorRes,
        assigneeRes,
        urgentRes,
        activitiesRes
      ] = await Promise.all([
        axiosProvider.get("/fineengg_erp/system/jobs", {
          params: { ...params, job_type: "JOB_SERVICE", limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/jobs", {
          params: { ...params, job_type: "TSO_SERVICE", limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/jobs", {
          params: { ...params, job_type: "KANBAN", limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/categories", {
          params: { ...params, limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
          params: { ...params, status: "qc-welding", limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
          params: { ...params, status: "qc-vendor", limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/jobs", {
          params: { ...params, limit: 1000 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/jobs", {
          params: { ...params, urgent: true, limit: 100 },
          headers: undefined
        }),
        axiosProvider.get("/fineengg_erp/system/activities", {
          params: { limit: 50 },
          headers: undefined
        }).catch(() => ({ data: { data: [] } }))
      ]);
      
      // Process Job Service Stats
      const jobServiceData = jobServiceRes?.data?.data || [];
      const jobServiceStats = {
        total: jobServiceData.length,
        totalQty: jobServiceData.reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        pending: jobServiceData.filter((j: any) => j.job_status === "pending_approval").length,
        approved: jobServiceData.filter((j: any) => j.is_approved === true).length,
        inProcess: jobServiceData.filter((j: any) => j.status === "in-process").length,
        completed: jobServiceData.filter((j: any) => j.status === "completed").length,
        notOk: jobServiceData.filter((j: any) => j.status === "not-ok").length,
        rejected: jobServiceData.filter((j: any) => j.rejected === true).length,
        urgent: jobServiceData.filter((j: any) => normalizeUrgent(j.urgent) === "Urgent").length,
        completedQty: jobServiceData.filter((j: any) => j.status === "completed").reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        pendingQty: jobServiceData.filter((j: any) => j.job_status === "pending_approval").reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
      };
      
      // Process TSO Service Stats
      const tsoServiceData = tsoServiceRes?.data?.data || [];
      const tsoServiceStats = {
        total: tsoServiceData.length,
        totalQty: tsoServiceData.reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        pending: tsoServiceData.filter((j: any) => j.job_status === "pending_approval").length,
        approved: tsoServiceData.filter((j: any) => j.is_approved === true).length,
        inProcess: tsoServiceData.filter((j: any) => j.status === "in-process").length,
        completed: tsoServiceData.filter((j: any) => j.status === "completed").length,
        notOk: tsoServiceData.filter((j: any) => j.status === "not-ok").length,
        rejected: tsoServiceData.filter((j: any) => j.rejected === true).length,
        urgent: tsoServiceData.filter((j: any) => normalizeUrgent(j.urgent) === "Urgent").length,
        completedQty: tsoServiceData.filter((j: any) => j.status === "completed").reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        pendingQty: tsoServiceData.filter((j: any) => j.job_status === "pending_approval").reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
      };
      
      // Process Kanban Stats
      const kanbanData = kanbanRes?.data?.data || [];
      const kanbanStats = {
        total: kanbanData.length,
        totalQty: kanbanData.reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        pending: kanbanData.filter((j: any) => j.job_status === "pending_approval").length,
        approved: kanbanData.filter((j: any) => j.is_approved === true).length,
        inProcess: kanbanData.filter((j: any) => j.status === "in-process").length,
        completed: kanbanData.filter((j: any) => j.status === "completed").length,
        notOk: kanbanData.filter((j: any) => j.status === "not-ok").length,
        rejected: kanbanData.filter((j: any) => j.rejected === true).length,
        urgent: kanbanData.filter((j: any) => normalizeUrgent(j.urgent) === "Urgent").length,
        completedQty: kanbanData.filter((j: any) => j.status === "completed").reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
        pendingQty: kanbanData.filter((j: any) => j.job_status === "pending_approval").reduce((sum: number, j: any) => sum + (Number(j.qty) || 0), 0),
      };
      
      // Process Categories
      const categoriesData = categoriesRes?.data?.data || [];
      const categoriesList = categoriesData.map((c: any) => ({
        id: c.id,
        job_no: c.job_no,
        job_category: c.job_category || 'N/A',
        description: c.description,
        qty: c.qty,
        client_name: c.client_name,
        material_type: c.material_type,
        is_urgent: normalizeUrgent(c.is_urgent),
        created_at: c.created_at,
      }));
      
      // Process Welding Data
      const weldingData = weldingRes?.data?.data || [];
      const weldingItems = weldingData.map((item: any) => ({
        id: item.id,
        serial_no: item.serial_no || '-',
        jo_no: item.jo_no || '-',
        item_no: item.item_no || '-',
        quantity_no: item.quantity_no || 0,
        status: item.status,
        job_type: item.job?.job_type,
        job_no: item.job?.job_no,
        tso_no: item.job?.tso_no,
        client_name: item.job?.client_name,
        worker_name: item.worker_name || '-',
        created_at: item.created_at,
      }));
      
      // Process Vendor Data
      const vendorData = vendorRes?.data?.data || [];
      const vendorItems = vendorData.map((item: any) => ({
        id: item.id,
        serial_no: item.serial_no || '-',
        jo_no: item.jo_no || '-',
        item_no: item.item_no || '-',
        quantity_no: item.quantity_no || 0,
        status: item.status,
        vendor_name: item.vendor_name || '-',
        job_type: item.job?.job_type,
        job_no: item.job?.job_no,
        tso_no: item.job?.tso_no,
        client_name: item.job?.client_name,
        created_at: item.created_at,
      }));
      
      // Process Assignee Stats
      const allJobsData = assigneeRes?.data?.data || [];
      const assigneeMap = new Map();
      ["Usmaan", "Riyaaz", "Ramzan"].forEach(assignee => {
        assigneeMap.set(assignee, { jobServiceCount: 0, tsoServiceCount: 0, kanbanCount: 0 });
      });
      
      allJobsData.forEach((job: any) => {
        const assignee = job.assign_to;
        if (assigneeMap.has(assignee)) {
          const stats = assigneeMap.get(assignee);
          if (job.job_type === "JOB_SERVICE") stats.jobServiceCount++;
          else if (job.job_type === "TSO_SERVICE") stats.tsoServiceCount++;
          else if (job.job_type === "KANBAN") stats.kanbanCount++;
        }
      });
      
      const assigneeStats = Array.from(assigneeMap.entries()).map(([assignee, data]) => ({
        assign_to: assignee,
        jobServiceCount: data.jobServiceCount,
        tsoServiceCount: data.tsoServiceCount,
        kanbanCount: data.kanbanCount,
        total: data.jobServiceCount + data.tsoServiceCount + data.kanbanCount,
      }));
      
      // Process Urgent Items
      const urgentData = urgentRes?.data?.data || [];
      const urgentItems = urgentData.map((item: any) => ({
        id: item.id,
        job_no: item.job_no,
        tso_no: item.tso_no,
        jo_number: item.jo_number,
        job_type: item.job_type,
        client_name: item.client_name,
        urgent_due_date: item.urgent_due_date,
        qty: item.qty,
      }));
      
      // Process Recent Activities
      const activitiesData = activitiesRes?.data?.data || [];
      
      setStats({
        jobService: jobServiceStats,
        tsoService: tsoServiceStats,
        kanban: kanbanStats,
        categories: {
          total: categoriesList.length,
          list: categoriesList,
        },
        welding: {
          total: weldingItems.length,
          totalQty: weldingItems.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0),
          items: weldingItems,
        },
        vendor: {
          total: vendorItems.length,
          totalQty: vendorItems.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0),
          items: vendorItems,
        },
        assigneeStats,
        urgentItems,
        recentActivities: activitiesData.slice(0, 30),
      });
      
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err?.response?.data?.error || "Failed to load dashboard");
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
      const exportData = {
        stats,
        exported_at: new Date().toISOString(),
        filters: { client: selectedClient, assignee: selectedAssignee }
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
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
      router.push("/section_production_planning/production_planning?filter=JOB_SERVICE");
    } else if (type === "TSO_SERVICE") {
      router.push("/section_production_planning/production_planning?filter=TSO_SERVICE");
    } else if (type === "KANBAN") {
      router.push("/section_production_planning/production_planning?filter=KANBAN");
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

  // Chart Data
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
                  title="Client filter"
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
                  title="Assignee filter"
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Assignees</option>
                  <option value="Usmaan">Usmaan (Production 1)</option>
                  <option value="Riyaaz">Riyaaz (Production 2)</option>
                  <option value="Ramzan">Ramzan (Production 3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard title="Total Jobs" value={(stats?.jobService.total || 0) + (stats?.tsoService.total || 0) + (stats?.kanban.total || 0)} icon={FiBriefcase} color="bg-blue-500" />
            <StatCard title="Pending Approval" value={(stats?.jobService.pending || 0) + (stats?.tsoService.pending || 0) + (stats?.kanban.pending || 0)} icon={MdPendingActions} color="bg-yellow-500" />
            <StatCard title="In Production" value={(stats?.jobService.inProcess || 0) + (stats?.tsoService.inProcess || 0) + (stats?.kanban.inProcess || 0)} icon={FiActivity} color="bg-green-500" />
            <StatCard title="Urgent" value={(stats?.jobService.urgent || 0) + (stats?.tsoService.urgent || 0) + (stats?.kanban.urgent || 0)} icon={FiAlertCircle} color="bg-red-500" />
            <StatCard title="Completed" value={(stats?.jobService.completed || 0) + (stats?.tsoService.completed || 0) + (stats?.kanban.completed || 0)} icon={FiCheckCircle} color="bg-purple-500" />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[
                { id: "overview", label: "Planning Overview", icon: FiBarChart2 },
                { id: "category", label: "Categories", icon: MdCategory },
                { id: "jobs", label: "Job Service", icon: MdWorkOutline },
                { id: "tso", label: "TSO Service", icon: MdDesignServices },
                { id: "kanban", label: "Kanban", icon: MdViewKanban },
                { id: "welding", label: "Welding QC", icon: FiTool },
                { id: "vendor", label: "Vendor QC", icon: FiTruck },
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
                  <Bar data={jobTypeChartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Workload by Assignee</h3>
                  <Bar data={assigneeChartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">QC Status Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats?.welding?.total || 0}</p>
                      <p className="text-xs text-gray-500">QC Welding</p>
                      <p className="text-xs text-gray-400">Qty: {stats?.welding?.totalQty || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats?.vendor?.total || 0}</p>
                      <p className="text-xs text-gray-500">QC Vendor</p>
                      <p className="text-xs text-gray-400">Qty: {stats?.vendor?.totalQty || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Urgent Items */}
              {stats?.urgentItems && stats.urgentItems.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
                    <FiAlertCircle className="w-5 h-5" />
                    Urgent Planning Items ({stats.urgentItems.length})
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
                        {stats.urgentItems.slice(0, 10).map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.job_no || item.tso_no || item.jo_number}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.job_type === "JOB_SERVICE" ? "bg-blue-100 text-blue-700" :
                                item.job_type === "TSO_SERVICE" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                              }`}>
                                {item.job_type === "JOB_SERVICE" ? "Job Service" : item.job_type === "TSO_SERVICE" ? "TSO" : "Kanban"}
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
                  {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                    stats.recentActivities.slice(0, 15).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 border-b border-gray-100 hover:bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === "create" ? "bg-green-500" :
                          activity.type === "update" ? "bg-blue-500" :
                          activity.type === "delete" ? "bg-red-500" : "bg-gray-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{activity.activity?.substring(0, 150)}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {activity.created_at ? new Date(activity.created_at).toLocaleString() : "N/A"}
                          </p>
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

          {/* Category Tab */}
          {selectedTab === "category" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📁 Categories List</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.categories?.total || 0}</p>
                  <p className="text-sm text-gray-600">Total Categories</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.categories?.list?.filter(c => c.is_urgent === "Urgent").length || 0}</p>
                  <p className="text-sm text-gray-600">Urgent Categories</p>
                </div>
              </div>
              
              {stats.categories?.list && stats.categories.list.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.categories.list.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.job_no}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{category.job_category}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{category.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{category.material_type || '-'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-yellow-600">{category.qty}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{category.client_name || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${urgentBadgeClass(normalizeUrgent(category.is_urgent))}`}>
                              {normalizeUrgent(category.is_urgent)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No categories found</div>
              )}
            </div>
          )}

          {/* Job Service Tab */}
          {selectedTab === "jobs" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Service Planning</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.jobService.total}</p>
                  <p className="text-xs text-gray-500">Total Jobs</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.jobService.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.jobService.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.jobService.inProcess}</p>
                  <p className="text-xs text-gray-500">In Process</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-xl font-semibold">{stats.jobService.totalQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Completed Quantity</p>
                  <p className="text-xl font-semibold text-green-600">{stats.jobService.completedQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Pending Quantity</p>
                  <p className="text-xl font-semibold text-yellow-600">{stats.jobService.pendingQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Urgent Jobs</p>
                  <p className="text-xl font-semibold text-red-600">{stats.jobService.urgent}</p>
                </div>
              </div>
            </div>
          )}

          {/* TSO Service Tab */}
          {selectedTab === "tso" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TSO Service Planning</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.tsoService.total}</p>
                  <p className="text-xs text-gray-500">Total TSO</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.tsoService.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.tsoService.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.tsoService.inProcess}</p>
                  <p className="text-xs text-gray-500">In Process</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-xl font-semibold">{stats.tsoService.totalQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Completed Quantity</p>
                  <p className="text-xl font-semibold text-green-600">{stats.tsoService.completedQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Pending Quantity</p>
                  <p className="text-xl font-semibold text-yellow-600">{stats.tsoService.pendingQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Urgent TSOs</p>
                  <p className="text-xl font-semibold text-red-600">{stats.tsoService.urgent}</p>
                </div>
              </div>
            </div>
          )}

          {/* Kanban Tab */}
          {selectedTab === "kanban" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Kanban Planning</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.kanban.total}</p>
                  <p className="text-xs text-gray-500">Total Kanban</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.kanban.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.kanban.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stats.kanban.inProcess}</p>
                  <p className="text-xs text-gray-500">In Process</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-xl font-semibold">{stats.kanban.totalQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Completed Quantity</p>
                  <p className="text-xl font-semibold text-green-600">{stats.kanban.completedQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Pending Quantity</p>
                  <p className="text-xl font-semibold text-yellow-600">{stats.kanban.pendingQty}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Urgent Kanban</p>
                  <p className="text-xl font-semibold text-red-600">{stats.kanban.urgent}</p>
                </div>
              </div>
            </div>
          )}

          {/* Welding Tab */}
          {selectedTab === "welding" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiTool className="w-5 h-5 text-orange-500" />
                  QC Welding Items
                </h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    Total Items: {stats.welding?.total || 0}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Total Qty: {stats.welding?.totalQty || 0}
                  </span>
                </div>
              </div>
              
              {stats.welding?.items && stats.welding.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">JO No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job/TSO No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.welding.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.jo_no || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.job_no || item.tso_no || '-'}</td>
                          <td className="px-4 py-3 text-sm font-mono">{item.serial_no || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.item_no || '-'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-600">{item.quantity_no}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.worker_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.client_name || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.job_type === "JOB_SERVICE" ? "bg-blue-100 text-blue-700" :
                              item.job_type === "TSO_SERVICE" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                            }`}>
                              {item.job_type === "JOB_SERVICE" ? "Job" : item.job_type === "TSO_SERVICE" ? "TSO" : "Kanban"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No welding items found</div>
              )}
            </div>
          )}

          {/* Vendor Tab */}
          {selectedTab === "vendor" && stats && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiTruck className="w-5 h-5 text-purple-500" />
                  QC Vendor Items
                </h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    Total Items: {stats.vendor?.total || 0}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Total Qty: {stats.vendor?.totalQty || 0}
                  </span>
                </div>
              </div>
              
              {stats.vendor?.items && stats.vendor.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">JO No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job/TSO No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.vendor.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.jo_no || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.job_no || item.tso_no || '-'}</td>
                          <td className="px-4 py-3 text-sm font-mono">{item.serial_no || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.item_no || '-'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-purple-600">{item.quantity_no}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.vendor_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.client_name || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.job_type === "JOB_SERVICE" ? "bg-blue-100 text-blue-700" :
                              item.job_type === "TSO_SERVICE" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                            }`}>
                              {item.job_type === "JOB_SERVICE" ? "Job" : item.job_type === "TSO_SERVICE" ? "TSO" : "Kanban"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No vendor items found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}