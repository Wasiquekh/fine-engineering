"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import { FiFilter } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { HiTrash, HiLightningBolt } from "react-icons/hi";
import LeftSideBar from "../../component/LeftSideBar";
import { FaPlus } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../../component/DesktopHeader";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";
import StorageManager from "../../../provider/StorageManager";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

// Permission helper function
const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

const hasAnyPermission = (permissions: any[] | null, permissionNames: string[]): boolean => {
  if (!permissions) return false;
  return permissionNames.some(name => permissions.some(p => p.name === name));
};

const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

const kanbanCategory = [
  { value: "VESSEL", label: "VESSEL" },
  { value: "HEAD", label: "HEAD" },
  { value: "CLAMP", label: "CLAMP" },
  { value: "PILLER_DRIVE_ASSEMBLY", label: "PILLER DRIVE ASSEMBLY" },
  { value: "HEATER_PLATE", label: "HEATER PLATE" },
  { value: "COMPRESSION_RING", label: "COMPRESSION RING" },
  { value: "HEATER_SHELL", label: "HEATER SHELL" },
  { value: "OUTER_RING", label: "OUTER_RING" },
  { value: "COOLING_COIL", label: "COOLING COIL" },
  { value: "SPARGER", label: "SPARGER" },
  { value: "HOLLOW_SHAFT", label: "HOLLOW SHAFT" },
  { value: "STIRRER_SHAFT", label: "STIRRER SHAFT" },
];

const validationSchema = Yup.object().shape({
  job_type: Yup.string().required("Job Type is required"),
  job_no: Yup.string().required("Job No is required"),
  pending_items: Yup.array()
    .of(
      Yup.object().shape({
        item_description: Yup.string().required("Item Description is required"),
        item_no: Yup.string().required("Item No is required"),
        qty: Yup.number()
          .required("Quantity is required")
          .typeError("Quantity must be a number")
          .integer("Quantity must be a whole number")
          .positive("Quantity must be positive"),
        size: Yup.string().required("Size is required"),
        moc: Yup.string().required("MOC is required"),
      })
    )
    .min(1, "At least one item is required."),
});

const initialValues = {
  job_type: "PENDING_MATERIAL",
  client_name: "",
  job_no: "",
  pending_items: [],
};

// Helper function to check if item is urgent
const isItemUrgent = (item: any): boolean => {
  return !!(item.urgent || item.is_urgent || item.urgent === true || item.is_urgent === true || item.urgent === 1 || item.is_urgent === 1);
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [currentDataset, setCurrentDataset] = useState<"JOBS" | "CATEGORIES">("JOBS");
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState<string>("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState<string>("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<any[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const clientParam = searchParams.get("client");

  const permissions = storage.getUserPermissions();
  
  // VIEW PERMISSIONS
  const canViewEqpJob = hasAnyPermission(permissions, ["pp.eqp.job.view", "pp.eqp.job.edit"]);
  const canViewEqpTSO = hasAnyPermission(permissions, ["pp.eqp.tso.view", "pp.eqp.tso.edit"]);
  const canViewEqpKanban = hasAnyPermission(permissions, ["pp.eqp.kanban.view", "pp.eqp.kanban.edit"]);
  
  const canViewBioJob = hasAnyPermission(permissions, ["pp.bio.job.view", "pp.bio.job.edit"]);
  const canViewBioTSO = hasAnyPermission(permissions, ["pp.bio.tso.view", "pp.bio.tso.edit"]);
  const canViewBioKanban = hasAnyPermission(permissions, ["pp.bio.kanban.view", "pp.bio.kanban.edit"]);
  
  // EDIT PERMISSIONS
  const canEditEqpJob = hasPermission(permissions, "pp.eqp.job.edit");
  const canEditEqpTSO = hasPermission(permissions, "pp.eqp.tso.edit");
  const canEditEqpKanban = hasPermission(permissions, "pp.eqp.kanban.edit");
  
  const canEditBioJob = hasPermission(permissions, "pp.bio.job.edit");
  const canEditBioTSO = hasPermission(permissions, "pp.bio.tso.edit");
  const canEditBioKanban = hasPermission(permissions, "pp.bio.kanban.edit");
  
  const getCurrentEditPermission = () => {
    if (clientParam === "Amar Equipment") {
      if (activeFilter === "JOB_SERVICE") return canEditEqpJob;
      if (activeFilter === "TSO_SERVICE") return canEditEqpTSO;
      if (activeFilter === "KANBAN") return canEditEqpKanban;
    } else if (clientParam === "Amar Biosystem") {
      if (activeFilter === "JOB_SERVICE") return canEditBioJob;
      if (activeFilter === "TSO_SERVICE") return canEditBioTSO;
      if (activeFilter === "KANBAN") return canEditBioKanban;
    }
    return false;
  };
  
  const canEdit = getCurrentEditPermission();
  const canAddPending = canEdit && activeFilter === "JOB_SERVICE";

  useEffect(() => {
    if (filterParam) {
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  const filteredData = useMemo(() => {
    let currentData = data;

    if (currentDataset === "CATEGORIES") {
      if (jobServiceCategoryFilter === "URGENT_TAB") {
        return currentData.filter((item) => isItemUrgent(item));
      }
      if (jobServiceCategoryFilter !== "ALL") {
        return currentData.filter((item) => item.job_category === jobServiceCategoryFilter);
      }
      return currentData;
    }

    if (activeFilter === "JOB_SERVICE") {
      return currentData.filter((item) => {
        if (item.job_type !== "JOB_SERVICE") return false;
        if (jobServiceCategoryFilter === "URGENT_TAB") {
          return isItemUrgent(item);
        }
        if (jobServiceCategoryFilter !== "ALL" && item.job_category !== jobServiceCategoryFilter) return false;
        return true;
      });
    }
    
    if (activeFilter === "TSO_SERVICE") {
      // First filter by job type
      let tsoData = currentData.filter((item) => item.job_type === "TSO_SERVICE");
      
      // Apply urgent filter if needed
      if (tsoSubFilter === "URGENT_TAB") {
        tsoData = tsoData.filter((item) => isItemUrgent(item));
      } else if (tsoSubFilter !== "ALL") {
        tsoData = tsoData.filter((item) => item.job_category === tsoSubFilter);
      }

      // Deduplicate after filtering to avoid losing data
      const uniqueTsoData: any[] = [];
      const seenTsoNos = new Set();

      tsoData.forEach((item) => {
        // Only deduplicate if there's a tso_no
        if (item.tso_no) {
          if (!seenTsoNos.has(item.tso_no)) {
            seenTsoNos.add(item.tso_no);
            uniqueTsoData.push(item);
          }
        } else {
          // Keep items without tso_no
          uniqueTsoData.push(item);
        }
      });

      return uniqueTsoData;
    }
    
    if (activeFilter === "KANBAN") {
      // First filter by job type
      let kanbanData = currentData.filter((item) => item.job_type === "KANBAN");
      
      // Apply urgent filter if needed
      if (kanbanSubFilter === "URGENT_TAB") {
        kanbanData = kanbanData.filter((item) => isItemUrgent(item));
      } else if (kanbanSubFilter !== "ALL") {
        kanbanData = kanbanData.filter((item) => item.job_category === kanbanSubFilter);
      }

      // Deduplicate after filtering to avoid losing data
      const uniqueKanbanData: any[] = [];
      const seenJoNumbers = new Set();

      kanbanData.forEach((item) => {
        // Only deduplicate if there's a jo_number
        if (item.jo_number) {
          if (!seenJoNumbers.has(item.jo_number)) {
            seenJoNumbers.add(item.jo_number);
            uniqueKanbanData.push(item);
          }
        } else {
          // Keep items without jo_number
          uniqueKanbanData.push(item);
        }
      });

      return uniqueKanbanData;
    }
    
    if (activeFilter === "ALL") {
      return currentData;
    }
    
    return currentData.filter((item) => item.job_type === activeFilter);
  }, [data, activeFilter, tsoSubFilter, kanbanSubFilter, jobServiceCategoryFilter, currentDataset]);

  const handleSubmit = async (values: any) => {
    if (!canEdit) {
      toast.error("You don't have permission to add pending materials");
      return;
    }
    const bulkPayload = {
      common_data: {
        job_no: values.job_no,
        client_name: clientParam || values.client_name || "",
      },
      items: values.pending_items.map((item: any) => ({
        item_no: item.item_no,
        description: item.item_description,
        size: item.size,
        moc: item.moc,
        qty: Number(item.qty),
      })),
    };

    try {
      await axiosProvider.post("/fineengg_erp/system/pending-materials/bulk", bulkPayload);
      toast.success("Pending Materials added successfully");
      fetchData();
      setFlyoutOpen(false);
    } catch (error: any) {
      console.error("Error saving pending materials:", error);
      toast.error("Failed to add Pending Materials");
    }
  };

  const handleUrgent = async (job_no: string | number) => {
    if (!canEdit) {
      toast.error("You don't have permission to mark as urgent");
      return;
    }
    
    const result = await Swal.fire({
      title: "Mark as Urgent?",
      text: "Are you sure you want to mark this job as urgent?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#facc15",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, mark urgent!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        let response;
        const id = String(job_no);

        if (activeFilter === "TSO_SERVICE") {
          const params = new URLSearchParams();
          params.append("tso_no", id);
          response = await axiosProvider.post(
            `/fineengg_erp/system/jobs/mark-urgent-by-tso`,
            params,
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
            }
          );
        } else if (activeFilter === "KANBAN") {
          const params = new URLSearchParams();
          params.append("jo_number", id);
          response = await axiosProvider.post(
            `/fineengg_erp/system/jobs/mark-urgent-by-jo-number`,
            params,
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
            }
          );
        } else {
          response = await axiosProvider.post(`/fineengg_erp/system/jobs/mark-urgent`, {
            job_no: id,
          });
        }

        if (response.status === 200) {
          toast.success("Job marked as urgent");
          
          // Store current filter values before refetching
          const currentTsoFilter = tsoSubFilter;
          const currentKanbanFilter = kanbanSubFilter;
          
          // Refetch data
          await fetchData();
          
          // Ensure filters are still applied
          if (activeFilter === "TSO_SERVICE") {
            setTsoSubFilter(currentTsoFilter);
          } else if (activeFilter === "KANBAN") {
            setKanbanSubFilter(currentKanbanFilter);
          }
        } else {
          toast.error("Failed to mark as urgent");
        }
      } catch (error: any) {
        console.error("Error marking job as urgent:", error);
        toast.error("Failed to mark as urgent");
      }
    }
  };

  const updateDueDate = async (job_no: string, date: string) => {
    if (!date) return;
    if (!canEdit) return;
    try {
      const params = new URLSearchParams();
      params.append("job_no", job_no);
      params.append("urgent_due_date", date.replace(/-/g, "/"));

      const response = await axiosProvider.post(
        "/fineengg_erp/system/categories/update-due-date",
        params,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
        }
      );

      if (response.status === 200) {
        toast.success("Due date updated successfully");
        fetchData();
      } else {
        toast.error("Failed to update due date");
      }
    } catch (error: any) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete");
      return;
    }
    
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const endpoint = currentDataset === "CATEGORIES" 
          ? `/fineengg_erp/system/categories/${id}` 
          : `/fineengg_erp/system/jobs/${id}`;
        const response = await axiosProvider.delete(endpoint);

        if (response.data.success) {
          toast.success("Job deleted successfully");
          fetchData(currentDataset === "CATEGORIES" ? "/fineengg_erp/system/categories" : "/fineengg_erp/system/jobs");
        } else {
          toast.error("Failed to delete job");
        }
      } catch (error: any) {
        console.error("Error deleting job:", error);
        toast.error("Failed to delete job");
      }
    }
  };

  const fetchData = async (endpoint?: string) => {
    try {
      let baseUrl = endpoint;
      const params = new URLSearchParams();

      if (!baseUrl) {
        if (activeFilter === "JOB_SERVICE") {
          baseUrl = `/fineengg_erp/system/categories`;
        } else {
          baseUrl = "/fineengg_erp/system/jobs";
        }
      }

      // Ensure job_type filter is applied for TSO and KANBAN when using the jobs endpoint
      if (baseUrl && baseUrl.includes("/system/jobs") && activeFilter !== "ALL" && activeFilter !== "JOB_SERVICE") {
        params.set("job_type", activeFilter);
      }

      if (clientParam) {
        params.set("client_name", clientParam);
      }
      const url = `${baseUrl}?${params.toString()}`;
      const response = await axiosProvider.get(url);
      setData(Array.isArray(response.data.data) ? response.data.data : []);

    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  };

  const fetchCategories = async () => {
    try {
      let url = "/fineengg_erp/system/categories";
      if (clientParam) {
        url += `?client_name=${encodeURIComponent(clientParam)}`;
      }

      const response = await axiosProvider.get(url);
      if (response.data && response.data.data) {
        const cats = Array.isArray(response.data.data) ? response.data.data : response.data.data.categories || [];
        const uniqueCategories = Array.from(
          new Map(
            cats.map((cat: any) => [
              cat.job_category,
              { value: cat.job_category, label: cat.job_category }
            ])
          ).values()
        );
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const resetFormState = () => {
    setFlyoutOpen(false);
  };

  const openPendingMaterialFlyout = () => {
    if (!canEdit) {
      toast.error("You don't have permission to add pending materials");
      return;
    }
    setFlyoutOpen(true);
  };

  const getInitialValues = () => {
    return { ...initialValues, pending_items: [{ item_description: "", item_no: "", qty: "", size: "", moc: "" }] };
  };

  useEffect(() => {
    fetchCategories();
  }, [clientParam]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      let baseUrl = "/fineengg_erp/system/jobs";
      let dataset: "JOBS" | "CATEGORIES" = "JOBS";
      const params = new URLSearchParams();

      if (activeFilter === "JOB_SERVICE") {
        baseUrl = "/fineengg_erp/system/categories";
        dataset = "CATEGORIES";
      } else if (activeFilter !== "ALL") {
        params.set("job_type", activeFilter);
      }

      if (clientParam) {
        params.set("client_name", clientParam);
      }
      const endpoint = `${baseUrl}?${params.toString()}`;

      if (currentDataset !== dataset) {
        setCurrentDataset(dataset);
        setData([]);
      }

      try {
        const response = await axiosProvider.get(endpoint);
        if (isMounted) {
          setData(Array.isArray(response.data.data) ? response.data.data : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, clientParam]);

  const canViewCurrentData = () => {
    if (clientParam === "Amar Equipment") {
      if (activeFilter === "JOB_SERVICE") return canViewEqpJob;
      if (activeFilter === "TSO_SERVICE") return canViewEqpTSO;
      if (activeFilter === "KANBAN") return canViewEqpKanban;
    } else if (clientParam === "Amar Biosystem") {
      if (activeFilter === "JOB_SERVICE") return canViewBioJob;
      if (activeFilter === "TSO_SERVICE") return canViewBioTSO;
      if (activeFilter === "KANBAN") return canViewBioKanban;
    }
    return true;
  };

  if (!canViewCurrentData()) {
    return (
      <div className="flex justify-end min-h-screen">
        <LeftSideBar />
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
          <div className="flex justify-center items-center h-96">
            <p className="text-red-500 text-lg">You don't have permission to view this data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="flex justify-end min-h-screen">
        <LeftSideBar />
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
          <div className="absolute bottom-0 right-0">
            <Image
              src="/images/sideDesign.svg"
              alt="side design"
              width={100}
              height={100}
              className="w-full h-full"
            />
          </div>
          <DesktopHeader />

          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
              <div className="flex items-center gap-4 max-w-full min-w-0">
                {activeFilter === "TSO_SERVICE" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button onClick={() => setTsoSubFilter("ALL")} className={`py-2 px-4 rounded-md text-sm font-medium ${tsoSubFilter === "ALL" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>All</button>
                    {tsoServiceCategory.map((cat) => (
                      <button key={cat.value} onClick={() => setTsoSubFilter(cat.value)} className={`py-2 px-4 rounded-md text-sm font-medium ${tsoSubFilter === cat.value ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{cat.label}</button>
                    ))}
                    <button onClick={() => setTsoSubFilter("URGENT_TAB")} className={`py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap ${tsoSubFilter === "URGENT_TAB" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Urgent</button>
                  </div>
                )}
                {activeFilter === "KANBAN" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button onClick={() => setKanbanSubFilter("ALL")} className={`py-2 px-4 rounded-md text-sm font-medium ${kanbanSubFilter === "ALL" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>All</button>
                    {kanbanCategory.map((cat) => (
                      <button key={cat.value} onClick={() => setKanbanSubFilter(cat.value)} className={`py-2 px-4 rounded-md text-sm font-medium ${kanbanSubFilter === cat.value ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{cat.label}</button>
                    ))}
                    <button onClick={() => setKanbanSubFilter("URGENT_TAB")} className={`py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap ${kanbanSubFilter === "URGENT_TAB" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Urgent</button>
                  </div>
                )}
                {activeFilter === "JOB_SERVICE" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button onClick={() => setJobServiceCategoryFilter("ALL")} className={`py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap ${jobServiceCategoryFilter === "ALL" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>All</button>
                    {categories.map((cat) => (
                      <button key={cat.value} onClick={() => setJobServiceCategoryFilter(cat.value)} className={`py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap ${jobServiceCategoryFilter === cat.value ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{cat.label}</button>
                    ))}
                    <button onClick={() => setJobServiceCategoryFilter("URGENT_TAB")} className={`py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap ${jobServiceCategoryFilter === "URGENT_TAB" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>Urgent</button>
                  </div>
                )}
              </div>

              {canAddPending && (
                <button onClick={openPendingMaterialFlyout} className="flex items-center gap-2 py-3 px-6 rounded-[4px] bg-primary-600 text-white hover:bg-primary-500">
                  <FiFilter className="w-4 h-4" />
                  <p className="text-sm font-medium">Add Pending</p>
                </button>
              )}
            </div>

            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    {currentDataset === "CATEGORIES" ? (
                      <>
                        <th className="p-3 border border-tableBorder">Job No</th>
                        <th className="px-2 py-0 border border-tableBorder">Job Category</th>
                        <th className="px-2 py-0 border border-tableBorder">Description</th>
                        <th className="px-2 py-0 border border-tableBorder">Material Type</th>
                        <th className="px-2 py-0 border border-tableBorder">Quantity</th>
                        <th className="px-2 py-0 border border-tableBorder">Bar</th>
                        <th className="px-2 py-0 border border-tableBorder">Temperature</th>
                        <th className="px-2 py-0 border border-tableBorder">Due Date</th>
                        <th className="px-2 py-0 border border-tableBorder">Status</th>
                        {canEdit && <th className="px-2 py-0 border border-tableBorder">Actions</th>}
                      </>
                    ) : (
                      <>
                        <th className="p-3 border border-tableBorder">{activeFilter === "TSO_SERVICE" ? "TSO No" : activeFilter === "KANBAN" ? "J/O Number" : "Job No"}</th>
                        {activeFilter !== "KANBAN" && <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">J/O Number</th>}
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">Job Type</th>
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">Job Category</th>
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">Item Description</th>
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">Item No</th>
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">Quantity</th>
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">MOC</th>
                        <th className="px-2 py-0 border border-tableBorder hidden sm:table-cell">Bin Location</th>
                        <th className="px-2 py-0 border border-tableBorder">Status</th>
                        {canEdit && <th className="px-2 py-0 border border-tableBorder">Actions</th>}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={100} className="px-4 py-6 text-center">No data found</td></tr>
                  ) : (
                    filteredData.map((item: any) => {
                      const isUrgent = isItemUrgent(item);
                      return (
                        currentDataset === "CATEGORIES" ? (
                          <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                            <td className="px-2 py-2 border border-tableBorder">
                              <p onClick={() => router.push(`/section_production_planning/production_planning/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}`)} className={`text-sm cursor-pointer underline ${isUrgent ? "text-red-600 hover:text-red-800 font-semibold" : "text-blue-600 hover:text-blue-800"}`}>
                                {item.job_no}
                              </p>
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">{item.job_category}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.description}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.material_type}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.qty}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.bar}</td>
                            <td className="px-2 py-2 border border-tableBorder">{item.tempp}</td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <input type="date" className="border border-gray-300 rounded px-1 disabled:bg-gray-100" value={item.urgent_due_date ? item.urgent_due_date.replace(/\//g, "-") : ""} onChange={(e) => updateDueDate(item.job_no, e.target.value)} disabled={!canEdit} />
                            </td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <span className={`px-2 py-1 rounded text-sm ${isUrgent ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {isUrgent ? "Urgent" : "Normal"}
                              </span>
                            </td>
                            {canEdit && (
                              <td className="px-2 py-2 border border-tableBorder">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleUrgent(item.job_no)} className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200" title="Mark as Urgent"><HiLightningBolt className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Delete"><HiTrash className="w-4 h-4" /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ) : (
                          <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                            <td className="px-2 py-2 border border-tableBorder">
                              {activeFilter === "KANBAN" ? (
                                <p onClick={() => router.push(`/section_production_planning/kanban_details/${item.jo_number}`)} className={`text-sm cursor-pointer underline ${isUrgent ? "text-red-600 hover:text-red-700 font-semibold" : "text-blue-600 hover:text-blue-800"}`}>
                                  {item.jo_number}
                                </p>
                              ) : activeFilter === "TSO_SERVICE" ? (
                                <p onClick={() => router.push(`/section_production_planning/tso_details/${item.tso_no}`)} className={`text-sm cursor-pointer underline ${isUrgent ? "text-red-600 hover:text-red-700 font-semibold" : "text-blue-600 hover:text-blue-800"}`}>
                                  {item.tso_no || "N/A"}
                                </p>
                              ) : (
                                <p onClick={() => router.push(`/section_production_planning/production_planning/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}`)} className={`text-sm cursor-pointer underline ${isUrgent ? "text-red-600 hover:text-red-700 font-semibold" : "text-blue-600 hover:text-blue-800"}`}>
                                  {item.job_no}
                                </p>
                              )}
                            </td>
                            {activeFilter !== "KANBAN" && <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.jo_number || "N/A"}</td>}
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.job_type}</td>
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.job_category || "N/A"}</td>
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.item_description}</td>
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.item_no}</td>
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.qty}</td>
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.moc}</td>
                            <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">{item.bin_location}</td>
                            <td className="px-2 py-2 border border-tableBorder">
                              <span className={`px-2 py-1 rounded text-sm ${isUrgent ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {isUrgent ? "Urgent" : "Normal"}
                              </span>
                            </td>
                            {canEdit && (
                              <td className="px-2 py-2 border border-tableBorder">
                                <button onClick={() => handleUrgent(activeFilter === "TSO_SERVICE" ? item.tso_no : activeFilter === "KANBAN" ? item.jo_number : item.job_no)} className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200" title="Mark as Urgent"><HiLightningBolt className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 ml-2" title="Delete"><HiTrash className="w-4 h-4" /></button>
                              </td>
                            )}
                          </tr>
                        )
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {canAddPending && isFlyoutOpen && (
        <>
          <div className="min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]" onClick={() => { setFlyoutOpen(false); resetFormState(); }}></div>
          <div className="flyout open">
            <div className="w-full min-h-auto">
              <div className="flex justify-between mb-4">
                <p className="text-primary-600 text-2xl font-semibold">Add Pending Material</p>
                <IoCloseOutline onClick={() => { setFlyoutOpen(false); resetFormState(); }} className="h-8 w-8 border border-[#E7E7E7] rounded cursor-pointer" />
              </div>
              <div className="w-full border-b border-[#E7E7E7] mb-4"></div>
              <Formik initialValues={getInitialValues()} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize={true}>
                {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
                  <Form onSubmit={handleSubmit}>
                    <div className="w-full">
                      <div className="mb-4">
                        <p className="font-medium text-sm mb-2">Job No</p>
                        <input type="text" name="job_no" value={values.job_no} onChange={(e) => setFieldValue("job_no", e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]" placeholder="Enter Job No" />
                        <ErrorMessage name="job_no" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      <FieldArray name="pending_items">
                        {({ remove, push }) => (
                          <div className="space-y-6">
                            {values.pending_items.map((item, index) => (
                              <div key={index} className="border border-gray-200 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                  <p className="font-semibold">Item #{index + 1}</p>
                                  {values.pending_items.length > 1 && <button type="button" onClick={() => remove(index)} className="p-1.5 bg-red-100 text-red-600 rounded-full"><HiTrash className="w-4 h-4" /></button>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><p className="font-medium text-sm mb-2">Item No</p><input type="text" name={`pending_items.${index}.item_no`} value={item.item_no} onChange={(e) => setFieldValue(`pending_items.${index}.item_no`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]" placeholder="Enter Item No" /><ErrorMessage name={`pending_items.${index}.item_no`} component="div" className="text-red-500 text-sm" /></div>
                                  <div><p className="font-medium text-sm mb-2">Size</p><input type="text" name={`pending_items.${index}.size`} value={item.size} onChange={(e) => setFieldValue(`pending_items.${index}.size`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]" placeholder="Enter Size" /><ErrorMessage name={`pending_items.${index}.size`} component="div" className="text-red-500 text-sm" /></div>
                                  <div><p className="font-medium text-sm mb-2">MOC</p><input type="text" name={`pending_items.${index}.moc`} value={item.moc} onChange={(e) => setFieldValue(`pending_items.${index}.moc`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]" placeholder="Enter MOC" /><ErrorMessage name={`pending_items.${index}.moc`} component="div" className="text-red-500 text-sm" /></div>
                                  <div><p className="font-medium text-sm mb-2">Quantity</p><input type="text" name={`pending_items.${index}.qty`} value={item.qty} onChange={(e) => setFieldValue(`pending_items.${index}.qty`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7]" placeholder="Enter Quantity" /><ErrorMessage name={`pending_items.${index}.qty`} component="div" className="text-red-500 text-sm" /></div>
                                  <div className="md:col-span-2"><p className="font-medium text-sm mb-2">Description</p><textarea name={`pending_items.${index}.item_description`} value={item.item_description} onChange={(e) => setFieldValue(`pending_items.${index}.item_description`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] min-h-[100px]" placeholder="Enter Description" /><ErrorMessage name={`pending_items.${index}.item_description`} component="div" className="text-red-500 text-sm" /></div>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => push({ item_description: "", item_no: "", qty: "", size: "", moc: "" })} className="flex items-center gap-2 text-primary-600 font-medium py-2 px-4 border-2 border-dashed border-primary-600 rounded-lg"><FaPlus /> Add Another Item</button>
                          </div>
                        )}
                      </FieldArray>
                      <div className="mt-8"><button type="submit" disabled={isSubmitting} className="py-3 px-6 bg-primary-600 rounded-[4px] text-white disabled:opacity-50">{isSubmitting ? "Submitting..." : "Add Pending Material"}</button></div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </>
      )}
    </>
  );
}