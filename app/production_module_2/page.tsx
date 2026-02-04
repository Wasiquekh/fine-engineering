"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { FiFilter } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { HiTrash, HiLightningBolt } from "react-icons/hi";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../component/DesktopHeader";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import SelectInput from "../component/SelectInput";
import DatePickerInput from "../component/DatePickerInput";
import AxiosProvider from "../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

// Options for Job Type
const jobTypeOptions = [
  { value: "JOB_SERVICE", label: "Job Service" },
  { value: "TSO_SERVICE", label: "TSO Service" },
  { value: "KANBAN", label: "Kanban" },
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
  job_category: Yup.string().when("job_type", {
    is: (job_type: string) =>
      job_type === "TSO_SERVICE" || job_type === "KANBAN",
    then: (schema) => schema.required("Job Category is required"),
    otherwise: (schema) => schema,
  }),
  job_no: Yup.number().when("job_type", {
    is: "JOB_SERVICE",
    then: (schema) =>
      schema
        .required("Job No is required")
        .typeError("Job No must be a number")
        .positive("Job No must be positive")
        .integer("Job No must be an integer"),
    otherwise: (schema) => schema,
  }),
  job_order_date: Yup.date().required("Job Order Date is required"),
  mtl_rcd_date: Yup.date().required("Material Received Date is required"),
  mtl_challan_no: Yup.number()
    .required("Material Challan No is required")
    .typeError("Material Challan No must be a number")
    .positive("Material Challan No must be positive")
    .integer("Material Challan No must be an integer"),
  item_description: Yup.string().required("Item Description is required"),
  item_no: Yup.number()
    .required("Item No is required")
    .typeError("Item No must be a number")
    .positive("Item No must be positive")
    .integer("Item No must be an integer"),
  qty: Yup.number()
    .required("Quantity is required")
    .typeError("Quantity must be a number")
    .positive("Quantity must be positive"),
  size: Yup.string(),
  moc: Yup.string().required("MOC is required"),
  remark: Yup.string(),
  bin_location: Yup.string().required("Bin Location is required"),
  material_remark: Yup.string(),
});

// Initial form values for Jobs
const initialValues = {
  job_type: "",
  job_category: "",
  job_no: "",
  // serial_no: "",
  job_order_date: "",
  mtl_rcd_date: "",
  mtl_challan_no: "",
  item_description: "",
  item_no: "",
  qty: "",
  moc: "",
  remark: "",
  bin_location: "",
  material_remark: "",
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [flyoutType, setFlyoutType] = useState<"JOB_SERVICE" | "TSO_SERVICE" | "KANBAN">("JOB_SERVICE");
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
  const [usmaanJobNos, setUsmaanJobNos] = useState<number[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const clientParam = searchParams.get("client");
  const urgentParam = searchParams.get("urgent");

  useEffect(() => {
    if (filterParam) {
      // Update active filter if a valid param is present
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    fetchUsmaanJobNos();
  }, []);

  const filteredData = useMemo(() => {
    let currentData = data;

    if (usmaanJobNos.length > 0) {
      currentData = currentData.filter((item) => usmaanJobNos.includes(item.job_no));
    }

    if (urgentParam === "true") {
      currentData = currentData.filter((item) => item.urgent || item.is_urgent);
    }

    if (currentDataset === "CATEGORIES") {
      if (jobServiceCategoryFilter === "URGENT_TAB") {
        return currentData.filter((item) => item.urgent || item.is_urgent);
      }
      if (jobServiceCategoryFilter !== "ALL") {
        return currentData.filter((item) => item.job_category === jobServiceCategoryFilter);
      }
      return currentData;
    }

    if (clientParam) {
      currentData = currentData.filter((item) => item.client_name === clientParam);
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
      return currentData.filter((item) => {
        if (item.job_type !== "TSO_SERVICE") return false;
        if (tsoSubFilter === "ALL") return true;
        return item.job_category === tsoSubFilter;
      });
    }
    if (activeFilter === "KANBAN") {
      return currentData.filter((item) => {
        if (item.job_type !== "KANBAN") return false;
        if (kanbanSubFilter === "ALL") return true;
        return item.job_category === kanbanSubFilter;
      });
    }
    if (activeFilter === "ALL") {
      return currentData;
    }
    return currentData.filter((item) => item.job_type === activeFilter);
  }, [data, activeFilter, tsoSubFilter, kanbanSubFilter, jobServiceCategoryFilter, clientParam, currentDataset, urgentParam, usmaanJobNos]);

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

    let payload: any = {};

    // Create payload based on job type
    payload = {
        job_type: values.job_type,
        item_no: Number(values.item_no),
        qty: Number(values.qty),
        moc: values.moc,
        remark: values.remark || "",
        // serial_no: Number(values.serial_no),
        job_order_date: formatDate(values.job_order_date),
        mtl_rcd_date: formatDate(values.mtl_rcd_date),
        mtl_challan_no: Number(values.mtl_challan_no),
        item_description: values.item_description,
        bin_location: values.bin_location,
        material_remark: values.material_remark || "",
    };
    // Add conditional fields
      if (values.job_type === "JOB_SERVICE") {
        payload.job_no = Number(values.job_no);
      } else if (values.job_type === "TSO_SERVICE") {
        payload.job_category = values.job_category;
      } else if (values.job_type === "KANBAN") {
        payload.job_category = values.job_category;
      }

    try {
      const response = await axiosProvider.post("/fineengg_erp/jobs", payload);

      // Different success messages based on job type
      if (values.job_type === "JOB_SERVICE") {
        toast.success("Job Service added successfully");
      } else if (values.job_type === "TSO_SERVICE") {
        toast.success("TSO Service added successfully");
      } else if (values.job_type === "KANBAN") {
        toast.success("Kanban added successfully");
      }

      fetchData();
      setFlyoutOpen(false);
    } catch (error: any) {
      console.error("Error saving job:", error);

      // Different error messages based on job type
      if (values.job_type === "JOB_SERVICE") {
        toast.error("Failed to add Job Service");
      } else if (values.job_type === "TSO_SERVICE") {
        toast.error("Failed to add TSO Service");
      } else if (values.job_type === "KANBAN") {
        toast.error("Failed to add Kanban");
      }
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
      const response = await axiosProvider.post(
        `/fineengg_erp/jobs/mark-urgent`,
        {
          job_no: selectedJobId,
          urgent_due_date: urgentDate,
        }
      );

      const params = new URLSearchParams();
      params.append("job_no", selectedJobId);
      params.append("urgent_due_date", urgentDate);
      await axiosProvider.post(
        "/fineengg_erp/categories/mark-urgent",
        params,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" } as any,
        }
      );

      if (response.data.success) {
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
          ? `/fineengg_erp/categories/${id}` 
          : `/fineengg_erp/jobs/${id}`;
        const response = await axiosProvider.delete(endpoint);

        if (response.data.success) {
          toast.success("Job deleted successfully");
          fetchData(currentDataset === "CATEGORIES" ? "/fineengg_erp/categories" : "/fineengg_erp/jobs");
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
      let url = endpoint;
      if (!url) {
        url = activeFilter === "JOB_SERVICE" ? "/fineengg_erp/categories" : "/fineengg_erp/jobs";
      }
      const response = await axiosProvider.get(url);
      const fetchedData = Array.isArray(response.data.data) ? response.data.data : [];
      setData(fetchedData);

      // if (url.includes("/fineengg_erp/jobs")) {
      //   const usmaanJobs = fetchedData
      //     .filter((job: any) => job.assign_to === "Usmaan")
      //     .map((job: any) => job.job_no);
      //   setUsmaanJobNos(usmaanJobs);
      // }
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  };

  const fetchUsmaanJobNos = async () => {
  try {
    const res = await axiosProvider.get(
      "/fineengg_erp/jobs?assign_to=Usmaan&limit=1000"
    );

    const jobNos = Array.isArray(res.data.data)
      ? res.data.data.map((job: any) => job.job_no)
      : [];

    setUsmaanJobNos(jobNos);
  } catch (err) {
    console.error("Failed to fetch Usmaan jobs", err);
  }
};

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/categories");
      if (response.data && response.data.data) {
        const cats = Array.isArray(response.data.data) ? response.data.data : response.data.data.categories || [];
        const formattedCats = cats.map((cat: any) => ({
          value: cat.job_category,
          label: cat.job_category
        }));
        setCategories(formattedCats);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const resetFormState = () => {
    setFlyoutOpen(false);
  };

  const openJobServiceFlyout = () => {
    setFlyoutType("JOB_SERVICE");
    setFlyoutOpen(true);
  };

  const openTsoServiceFlyout = () => {
    setFlyoutType("TSO_SERVICE");
    setFlyoutOpen(true);
  };

  const openKanbanFlyout = () => {
    setFlyoutType("KANBAN");
    setFlyoutOpen(true);
  };

  // Get initial values based on flyout type
  const getInitialValues = () => {
    if (flyoutType === "JOB_SERVICE") {
      return { ...initialValues, job_type: "JOB_SERVICE" };
    } else if (flyoutType === "TSO_SERVICE") {
      return { ...initialValues, job_type: "TSO_SERVICE" };
    } else if (flyoutType === "KANBAN") {
      return { ...initialValues, job_type: "KANBAN" };
    }
    return initialValues;
  };

  // Get category options based on job type
  const getCategoryOptions = (jobType: string) => {
    if (jobType === "TSO_SERVICE") {
      return tsoServiceCategory;
    } else if (jobType === "KANBAN") {
      return kanbanCategory;
    }
    return [];
  };

  // Get flyout title
  const getFlyoutTitle = () => {
    if (flyoutType === "JOB_SERVICE") return "Add JOB Service";
    if (flyoutType === "TSO_SERVICE") return "Add TSO Service";
    if (flyoutType === "KANBAN") return "Add Kanban";
    return "Add Job";
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (flyoutType === "JOB_SERVICE") return "Add Job Service";
    if (flyoutType === "TSO_SERVICE") return "Add TSO Service";
    if (flyoutType === "KANBAN") return "Add Kanban";
    return "Add Job";
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      let endpoint = "/fineengg_erp/jobs";
      let dataset: "JOBS" | "CATEGORIES" = "JOBS";

      if (activeFilter === "JOB_SERVICE") {
        endpoint = "/fineengg_erp/categories";
        dataset = "CATEGORIES";
      }

      if (currentDataset !== dataset) {
        setCurrentDataset(dataset);
        setData([]);
      }

      try {
        const response = await axiosProvider.get(endpoint);
        if (isMounted) {
          const fetchedData = Array.isArray(response.data.data) ? response.data.data : [];
          setData(fetchedData);

          // if (endpoint.includes("/fineengg_erp/jobs")) {
          //   const usmaanJobs = fetchedData
          //     .filter((job: any) => job.assign_to === "Usmaan")
          //     .map((job: any) => job.job_no);
          //   setUsmaanJobNos(usmaanJobs);
          // }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

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
                    {/* <button
                      onClick={() => setJobServiceCategoryFilter("URGENT_TAB")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        jobServiceCategoryFilter === "URGENT_TAB"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Urgent
                    </button> */}
                  </div>
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
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Job No
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Job Category
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Description
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Material Type
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Quantity
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Bar
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Temperature
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Due Date
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Status
                            </div>
                          </div>
                        </th>
                        {/* <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Actions
                            </div>
                          </div>
                        </th> */}
                      </>
                    ) : (
                      <>
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          {activeFilter === "TSO_SERVICE" ? "TSO No" : "Job No"}
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          J/O Number
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job Type
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job Category
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Item Description
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Item No
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Quantity
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          MOC
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Bin Location
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Status
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
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
                        colSpan={11}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
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
                              onClick={() => router.push(`/production_planning/${item.job_no}`)}
                              className={`text-base leading-normal cursor-pointer underline ${
                                item.urgent || item.is_urgent
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.job_category}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.description}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.material_type}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.qty}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.bar}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.tempp}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.urgent_due_date || "-"}</p>
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
                          {/* <td className="px-2 py-2 border border-tableBorder">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleUrgent(item.job_no)} className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors" title="Mark as Urgent">
                                <HiLightningBolt className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors" title="Delete">
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td> */}
                        </tr>
                      ) : (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          {activeFilter === "TSO_SERVICE" ? (
                            <p
                              onClick={() => router.push(`/tso_details/${item.tso_no}`)}
                              className={`text-base leading-normal cursor-pointer underline ${
                                item.urgent_due_date &&
                                new Date(item.urgent_due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.tso_no || "N/A"}
                            </p>
                          ) : item.job_no ? (
                            <p
                              onClick={() => router.push(`/production_planning/${item.job_no}`)}
                              className={`text-base leading-normal cursor-pointer underline ${
                                item.urgent_due_date &&
                                new Date(item.urgent_due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          ) : (
                            <p className="text-[#232323] text-base leading-normal">N/A</p>
                          )}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.jo_number || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_type}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_category || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.item_description}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.item_no}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.qty}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.moc}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
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
                            {activeFilter === "JOB_SERVICE" && (
                              <button
                                onClick={() => handleUrgent(item.job_no)}
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
              <p className="text-primary-600 text-[22px] sm:text-[24px] md:text-[26px] font-bold leading-8 sm:leading-9">
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
                <Form onSubmit={handleSubmit}>
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
                      {values.job_type === "JOB_SERVICE" && (
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                            Job No
                          </p>
                          <input
                            type="number"
                            name="job_no"
                            value={values.job_no}
                            onChange={(e) =>
                              setFieldValue("job_no", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                            placeholder="Enter Job No"
                          />
                          <ErrorMessage
                            name="job_no"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      )}

                      {/* Item No */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Item No
                        </p>
                        <input
                          type="number"
                          name="item_no"
                          value={values.item_no}
                          onChange={(e) =>
                            setFieldValue("item_no", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Item No"
                        />
                        <ErrorMessage
                          name="item_no"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* MOC */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          MOC
                        </p>
                        <input
                          type="text"
                          name="moc"
                          value={values.moc}
                          onChange={(e) => setFieldValue("moc", e.target.value)}
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter MOC (Material of Construction)"
                        />
                        <ErrorMessage
                          name="moc"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Quantity
                        </p>
                        <input
                          type="number"
                          name="qty"
                          value={values.qty}
                          onChange={(e) => setFieldValue("qty", e.target.value)}
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Quantity"
                        />
                        <ErrorMessage
                          name="qty"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Bin Location */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Bin Location
                        </p>
                        <input
                          type="text"
                          name="bin_location"
                          value={values.bin_location}
                          onChange={(e) => setFieldValue("bin_location", e.target.value)}
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Bin Location"
                        />
                        <ErrorMessage
                          name="bin_location"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Description */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Description
                        </p>
                        <textarea
                          name="item_description"
                          value={values.item_description}
                          onChange={(e) =>
                            setFieldValue("item_description", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999] min-h-[100px]"
                          placeholder="Enter Description (Optional)"
                        />
                        <ErrorMessage
                          name="item_description"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="mt-8 md:mt-10 w-full flex flex-col md:flex-row md:justify-between items-center gap-y-4 md:gap-y-0 gap-x-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-[13px] px-[26px] bg-primary-600 hover:bg-primary-500 rounded-[4px] w-full md:full text-base font-medium leading-6 text-white text-center hover:bg-lightMaroon hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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