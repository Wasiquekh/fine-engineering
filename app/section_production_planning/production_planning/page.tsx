"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import SelectInput from "../../component/SelectInput";
import DatePickerInput from "../../component/DatePickerInput";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

const clientOptions = [
  { value: "Amar Equipment", label: "Amar Equipment" },
  { value: "Amar Biosystem", label: "Amar Biosystem" },
];

// Options for TSO Service Category
const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

// Options for Kanban Category - UPDATED based on API validation
const kanbanCategory = [
  { value: "VESSEL", label: "VESSEL" },
  { value: "HEAD", label: "HEAD" },
  { value: "CLAMP", label: "CLAMP" },
  { value: "PILLER_DRIVE_ASSEMBLY", label: "PILLER DRIVE ASSEMBLY" },
  { value: "HEATER_PLATE", label: "HEATER PLATE" },
  { value: "COMPRESSION_RING", label: "COMPRESSION RING" },
  { value: "HEATER_SHELL", label: "HEATER SHELL" },
  { value: "OUTER_RING", label: "OUTER RING" },
  { value: "COOLING_COIL", label: "COOLING COIL" },
  { value: "SPARGER", label: "SPARGER" },
  { value: "HOLLOW_SHAFT", label: "HOLLOW SHAFT" },
  { value: "STIRRER_SHAFT", label: "STIRRER SHAFT" },
];

// Validation Schema for Jobs form
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

// Initial form values for Jobs
const initialValues = {
  job_type: "PENDING_MATERIAL",
  client_name: "",
  job_no: "",
  pending_items: [],
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [flyoutType, setFlyoutType] = useState<"PENDING_MATERIAL">("PENDING_MATERIAL");
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [currentDataset, setCurrentDataset] = useState<"JOBS" | "CATEGORIES">("JOBS");
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState<string>("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState<string>("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<any[]>([]);
  const [isUrgentModalOpen, setUrgentModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [urgentDate, setUrgentDate] = useState<string>("");
  const lastFetchedEndpoint = useRef<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const clientParam = searchParams.get("client");

  useEffect(() => {
    if (filterParam) {
      // Update active filter if a valid param is present
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  const filteredData = useMemo(() => {
    let currentData = data;

    if (currentDataset === "CATEGORIES") {
      if (jobServiceCategoryFilter === "URGENT_TAB") {
        return currentData.filter((item) => item.urgent || item.is_urgent);
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
          return item.urgent;
        }
        if (jobServiceCategoryFilter !== "ALL" && item.job_category !== jobServiceCategoryFilter) return false;
        return true;
      });
    }
    if (activeFilter === "TSO_SERVICE") {
      const tsoData = currentData.filter((item) => {
        if (item.job_type !== "TSO_SERVICE") return false;
        if (tsoSubFilter === "URGENT_TAB") {
          return item.urgent || item.is_urgent;
        }
        if (tsoSubFilter === "ALL") return true;
        return item.job_category === tsoSubFilter;
      });

      const uniqueTsoData: any[] = [];
      const seenTsoNos = new Set();

      tsoData.forEach((item) => {
        if (item.tso_no && !seenTsoNos.has(item.tso_no)) {
          seenTsoNos.add(item.tso_no);
          uniqueTsoData.push(item);
        } else if (!item.tso_no) {
          uniqueTsoData.push(item);
        }
      });

      return uniqueTsoData;
    }
    if (activeFilter === "KANBAN") {
      const kanbanData = currentData.filter((item) => {
        if (item.job_type !== "KANBAN") return false;
        if (kanbanSubFilter === "URGENT_TAB") {
          return item.urgent || item.is_urgent;
        }
        if (kanbanSubFilter === "ALL") return true;
        return item.job_category === kanbanSubFilter;
      });

      const uniqueKanbanData: any[] = [];
      const seenJoNumbers = new Set();

      kanbanData.forEach((item) => {
        if (item.jo_number && !seenJoNumbers.has(item.jo_number)) {
          seenJoNumbers.add(item.jo_number);
          uniqueKanbanData.push(item);
        } else if (!item.jo_number) {
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
    // Format dates to YYYY-MM-DD format
    const formatDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

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
  const handleUrgent = (job_no: string | number) => {
    setSelectedJobId(String(job_no));
    setUrgentDate("");
    setUrgentModalOpen(true);
  };

  const submitUrgent = async () => {
    if (!selectedJobId || !urgentDate) {
      toast.error("Please select a due date");
      return;
    }

    try {
      let response;

      if (activeFilter === "TSO_SERVICE") {
        const params = new URLSearchParams();
        params.append("tso_no", selectedJobId);
        params.append("urgent_due_date", urgentDate.replace(/-/g, "/"));

        response = await axiosProvider.post(
          `/fineengg_erp/system/jobs/mark-urgent-by-tso`,
          params,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
          }
        );
      } else if (activeFilter === "KANBAN") {
        const params = new URLSearchParams();
        params.append("jo_number", selectedJobId);
        params.append("urgent_due_date", urgentDate.replace(/-/g, "/"));

        response = await axiosProvider.post(
          `/fineengg_erp/system/jobs/mark-urgent-by-jo-number`,
          params,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
          }
        );
      } else {
        response = await axiosProvider.post(`/fineengg_erp/system/jobs/mark-urgent`, {
          job_no: selectedJobId,
          urgent_due_date: urgentDate,
        });
      }

      //Always treat jobs API as source of truth
      if (response.status === 200) {
        // try {
        //   const params = new URLSearchParams();
        //   params.append("job_no", selectedJobId);
        //   params.append("urgent_due_date", urgentDate);

        //   await axiosProvider.post(
        //     "/fineengg_erp/system/categories/mark-urgent",
        //     params,
        //     {
        //       headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
        //     }
        //   );
        // } catch (error) {
        //   console.warn("Category urgent update failed (safe to ignore)", error);
        // }

        toast.success("Job marked as urgent");
        fetchData();
        setUrgentModalOpen(false);
        setSelectedJobId(null);
      } else {
        toast.error("Failed to mark as urgent");
      }
    } catch (error: any) {
      console.error("Error marking job as urgent:", error);
      toast.error("Failed to mark as urgent");
    }
  };

  const handleDelete = async (id: string) => {
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

      if (clientParam) {
        params.set("client_name", clientParam);
      }
      const url = `${baseUrl}?${params.toString()}`;
      const response = await axiosProvider.get(url);
      setData(Array.isArray(response.data.data) ? response.data.data : []);
      lastFetchedEndpoint.current = url;

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
          new Map( // Using Array.from to explicitly convert MapIterator to Array
            cats.map((cat: any) => [
              cat.job_category,
              { value: cat.job_category, label: cat.job_category }
            ])
          ).values() // .values() returns a MapIterator
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
    setFlyoutType("PENDING_MATERIAL");
    setFlyoutOpen(true);
  };

  // Get initial values based on flyout type
  const getInitialValues = () => {
    return { ...initialValues, pending_items: [{ item_description: "", item_no: "", qty: "", size: "", moc: "" }] };
  };

  // Get flyout title
  const getFlyoutTitle = () => {
    return "Add Pending Material";
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    return "Add Pending Material";
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
        // For TSO_SERVICE and KANBAN, filter by job_type on the backend.
        // "ALL" should fetch all job types.
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
        {/* Main content right section */}
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
          <div className="absolute bottom-0 right-0">
            <Image
              src="/images/sideDesign.svg"
              alt="side desgin"
              width={100}
              height={100}
              className="w-full h-full"
            />
          </div>
          {/* left section top row */}
          <DesktopHeader />

          {/* Main content middle section */}
          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
            {/* Search and filter table row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
              <div className="flex items-center gap-4 max-w-full min-w-0">
                {/* TSO Service Tabs */}
                {activeFilter === "TSO_SERVICE" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => setTsoSubFilter("ALL")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        tsoSubFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {tsoServiceCategory.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setTsoSubFilter(cat.value)}
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          tsoSubFilter === cat.value
                            ? "bg-primary-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setTsoSubFilter("URGENT_TAB")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        tsoSubFilter === "URGENT_TAB"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Urgent
                    </button>
                  </div>
                )}
                {/* Kanban Tabs */}
                {activeFilter === "KANBAN" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => setKanbanSubFilter("ALL")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        kanbanSubFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {kanbanCategory.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setKanbanSubFilter(cat.value)}
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          kanbanSubFilter === cat.value
                            ? "bg-primary-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setKanbanSubFilter("URGENT_TAB")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        kanbanSubFilter === "URGENT_TAB"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Urgent
                    </button>
                  </div>
                )}
                {/* Job Service Tabs */}
                {activeFilter === "JOB_SERVICE" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => setJobServiceCategoryFilter("ALL")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        jobServiceCategoryFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setJobServiceCategoryFilter(cat.value)}
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                          jobServiceCategoryFilter === cat.value
                            ? "bg-primary-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setJobServiceCategoryFilter("URGENT_TAB")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        jobServiceCategoryFilter === "URGENT_TAB"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Urgent
                    </button>
                  </div>
                )}
              </div>

              {/* Pending Material Button */}
              <div className="relative shrink-0">
                {activeFilter === "JOB_SERVICE" && (
                  <button
                    onClick={openPendingMaterialFlyout}
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 text-white group hover:bg-primary-500"
                  >
                    <FiFilter className="w-4 h-4 text-white" />
                    <p className="text-sm font-medium">Add Pending</p>
                  </button>
                )}
              </div>
            </div>

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    {currentDataset === "CATEGORIES" ? (
                      <>
                        <th scope="col" className="p-3 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Job No
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Job Category
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Description
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Material Type
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Quantity
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Bar
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Temperature
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Due Date
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Status
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                              Actions
                            </div>
                          </div>
                        </th>
                      </>
                    ) : (
                      <>
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          {activeFilter === "TSO_SERVICE"
                            ? "TSO No"
                            : activeFilter === "KANBAN"
                            ? "J/O Number"
                            : "Job No"}
                        </div>
                      </div>
                    </th>
                    {activeFilter !== "KANBAN" && (
                      <th
                        scope="col"
                        className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                            J/O Number
                          </div>
                        </div>
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Job Type
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Job Category
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Item Description
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Item No
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Quantity
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          MOC
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Bin Location
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Status
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-firstBlack text-xs uppercase leading-normal">
                          Actions
                        </div>
                      </div>
                    </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          currentDataset === "CATEGORIES" ? 10
                          : activeFilter === "KANBAN" ? 10
                          : 11
                        }
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-sm">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item: any) => (
                      currentDataset === "CATEGORIES" ? (
                        <tr
                          className="border border-tableBorder bg-white hover:bg-primary-100"
                          key={item.id}
                        >
                          <td className="px-2 py-2 border border-tableBorder">
                            <p
                              onClick={() =>
                                router.push(
                                  `/section_production_planning/production_planning/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}`
                                )
                              }
                              className={`text-sm leading-normal cursor-pointer underline ${
                                item.urgent || item.is_urgent
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.job_category}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.description}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.material_type}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.qty}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.bar}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.tempp}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-sm leading-normal">{item.urgent_due_date || "-"}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                item.urgent || item.is_urgent
                                  ? "bg-red-100 text-red-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {item.urgent || item.is_urgent ? "Urgent" : "Normal"}
                            </span>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleUrgent(item.job_no)} className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors" title="Mark as Urgent">
                                <HiLightningBolt className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors" title="Delete">
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          {activeFilter === "KANBAN" ? (
                            item.jo_number ? (
                              <p
                                onClick={() => router.push(`/section_production_planning/kanban_details/${item.jo_number}`)}
                                className={`text-sm leading-normal cursor-pointer underline ${
                                  item.urgent
                                    ? "text-red-600 hover:text-red-700"
                                    : "text-blue-600 hover:text-blue-800"
                                }`}
                              >
                                {item.jo_number}
                              </p>
                            ) : (
                              <p className="text-[#232323] text-sm leading-normal">N/A</p>
                            )
                          ) : activeFilter === "TSO_SERVICE" ? (
                            <p
                              onClick={() => router.push(`/section_production_planning/tso_details/${item.tso_no}`)}
                              className={`text-sm leading-normal cursor-pointer underline ${
                                item.urgent
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.tso_no || "N/A"}
                            </p>
                          ) : item.job_no ? (
                            <p
                              onClick={() =>
                                router.push(
                                  `/section_production_planning/production_planning/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}`
                                )
                              }
                              className={`text-sm leading-normal cursor-pointer underline ${
                                item.urgent
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          ) : (
                            <p className="text-[#232323] text-sm leading-normal">N/A</p>
                          )}
                        </td>
                        {activeFilter !== "KANBAN" && (
                          <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                            <p className="text-[#232323] text-sm leading-normal">
                              {item.jo_number || "N/A"}
                            </p>
                          </td>
                        )}
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.job_type}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.job_category || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.item_description}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.item_no}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.qty}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.moc}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-sm leading-normal">
                            {item.bin_location}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              item.urgent
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {item.urgent ? "Urgent" : "Normal"}
                          </span>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            {(activeFilter === "JOB_SERVICE" || (activeFilter === "TSO_SERVICE" && item.tso_no) || (activeFilter === "KANBAN" && item.jo_number)) && (
                              <button
                                onClick={() =>
                                  handleUrgent(
                                    activeFilter === "TSO_SERVICE"
                                      ? item.tso_no
                                      : activeFilter === "KANBAN"
                                      ? item.jo_number
                                      : item.job_no
                                  )
                                }
                                className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors"
                                title="Mark as Urgent"
                              >
                                <HiLightningBolt className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                              title="Delete"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FITLER FLYOUT */}
        {/* DARK BG SCREEN */}
        {isFlyoutOpen && (
          <div
            className="min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
            onClick={() => {
              setFlyoutOpen(false);
              resetFormState();
            }}
          ></div>
        )}

        {/* NOW MY FLYOUT */}
        <div className={`flyout ${isFlyoutOpen ? "open" : ""}`}>
          <div className="w-full min-h-auto">
            {/* Header */}
            <div className="flex justify-between mb-4 sm:mb-6 md:mb-8">
              <p className="text-primary-600 text-2xl font-semibold leading-8 sm:leading-9">
                {getFlyoutTitle()}
              </p>
              <IoCloseOutline
                onClick={() => {
                  setFlyoutOpen(false);
                  resetFormState();
                }}
                className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6"></div>

            {/* FORM */}
            <Formik
              initialValues={getInitialValues()}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize={true}
            >
              {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
                <Form onSubmit={handleSubmit} autoComplete="off">
                  <div className="w-full">
                    {/* Grid container for form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Job Type - Hidden but required for form */}
                      <input
                        type="hidden"
                        name="job_type"
                        value={values.job_type}
                      />

                      {/* Job No - Only for JOB_SERVICE */}
                        <div className="w-full mb-4">
                          <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                            Job No
                          </p>
                          <input
                            type="text"
                            name="job_no"
                            value={values.job_no}
                            onChange={(e) =>
                              setFieldValue("job_no", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                            placeholder="Enter Job No"
                          />
                          <ErrorMessage
                            name="job_no"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                    </div>

                      {/* Pending Items - Only for PENDING_MATERIAL */}
                        <FieldArray name="pending_items">
                          {({ remove, push }) => (
                            <div className="col-span-1 md:col-span-2 space-y-6">
                              {values.pending_items &&
                                values.pending_items.length > 0 &&
                                values.pending_items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="border border-gray-200 p-4 rounded-lg"
                                  >
                                    <div className="flex justify-between items-center mb-4">
                                      <p className="font-semibold text-gray-700">
                                        Item #{index + 1}
                                      </p>
                                      {values.pending_items.length > 1 && (
                                        <button
                                          type="button"
                                          className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                          onClick={() => remove(index)}
                                        >
                                          <HiTrash className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                          Item No
                                        </p>
                                        <input
                                          type="text"
                                          name={`pending_items.${index}.item_no`}
                                          value={item.item_no}
                                          onChange={(e) =>
                                            setFieldValue(`pending_items.${index}.item_no`, e.target.value)
                                          }
                                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                          placeholder="Enter Item No"
                                        />
                                        <ErrorMessage
                                          name={`pending_items.${index}.item_no`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                          Size
                                        </p>
                                        <input
                                          type="text"
                                          name={`pending_items.${index}.size`}
                                          value={item.size}
                                          onChange={(e) =>
                                            setFieldValue(`pending_items.${index}.size`, e.target.value)
                                          }
                                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                          placeholder="Enter Size"
                                        />
                                        <ErrorMessage
                                          name={`pending_items.${index}.size`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                          MOC
                                        </p>
                                        <input
                                          type="text"
                                          name={`pending_items.${index}.moc`}
                                          value={item.moc}
                                          onChange={(e) =>
                                            setFieldValue(`pending_items.${index}.moc`, e.target.value)
                                          }
                                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                          placeholder="Enter MOC"
                                        />
                                        <ErrorMessage
                                          name={`pending_items.${index}.moc`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                          Quantity
                                        </p>

                                        <input
                                          type="text"
                                          name={`pending_items.${index}.qty`}
                                          value={item.qty}
                                          onChange={(e) => {
                                            const value = e.target.value;

                                            // Allow only digits 0-9
                                            if (/^[0-9]*$/.test(value)) {
                                              setFieldValue(`pending_items.${index}.qty`, value);
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            const allowedKeys = [
                                              "Backspace",
                                              "Delete",
                                              "ArrowLeft",
                                              "ArrowRight",
                                              "Tab",
                                            ];

                                            // Prevent anything except 0-9 and control keys
                                            if (
                                              !allowedKeys.includes(e.key) &&
                                              !/^[0-9]$/.test(e.key)
                                            ) {
                                              e.preventDefault();
                                            }
                                          }}
                                          onWheel={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.blur();
                                          }}
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                          placeholder="Enter Quantity"
                                        />

                                        <ErrorMessage
                                          name={`pending_items.${index}.qty`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>
                                      <div className="w-full md:col-span-2">
                                        <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                          Description
                                        </p>
                                        <textarea
                                          name={`pending_items.${index}.item_description`}
                                          value={item.item_description}
                                          onChange={(e) =>
                                            setFieldValue(`pending_items.${index}.item_description`, e.target.value)
                                          }
                                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999] min-h-[100px]"
                                          placeholder="Enter Description"
                                        />
                                        <ErrorMessage
                                          name={`pending_items.${index}.item_description`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              <button
                                type="button"
                                className="flex items-center gap-2 text-primary-600 font-medium py-2 px-4 border-2 border-dashed border-primary-600 rounded-lg hover:bg-primary-50"
                                onClick={() =>
                                  push({
                                    item_description: "",
                                    item_no: "",
                                    qty: "",
                                    size: "",
                                    moc: "",
                                  })
                                }
                              >
                                <FaPlus /> Add Another Item
                              </button>
                            </div>
                          )}
                        </FieldArray>

                    <div className="mt-8 md:mt-10 w-full flex flex-col md:flex-row md:justify-between items-center gap-y-4 md:gap-y-0 gap-x-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-[13px] px-[26px] bg-primary-600 hover:bg-primary-500 rounded-[4px] w-full md:full text-sm font-medium leading-6 text-white text-center hover:bg-lightMaroon hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Submitting..." : getSubmitButtonText()}
                      </button>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      {/* FITLER FLYOUT END */}

      {/* URGENT MODAL */}
      {isUrgentModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mark as Urgent</h3>
              <button
                onClick={() => setUrgentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-600"
                value={urgentDate}
                onChange={(e) => setUrgentDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUrgentModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitUrgent}
                className="px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}