"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { FiFilter } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import { HiTrash } from "react-icons/hi";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../component/DesktopHeader";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import SelectInput from "../component/SelectInput";
import DatePickerInput from "../component/DatePickerInput";
import AxiosProvider from "../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

const clientOptions = [
  { value: "Amar Equipment", label: "Amar Equipment" },
  { value: "Amar Biosystem", label: "Amar Biosystem" }
];

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

const kanbanJobCatOptions = [
  { value: "MinMax", label: "MinMax" },
  { value: "Kanban", label: "Kanban" },
];

const jobServiceSubTypeOptions = [
  { value: "PARTIAL", label: "Partial" },
  { value: "ASSEMBLY", label: "Assembly" },
];

// Validation Schema for Jobs form
const validationSchema = Yup.object().shape({
  job_type: Yup.string().required("Job Type is required"),
  client_name: Yup.string().required("Client Name is required"),
  jo_number: Yup.number()
    .required("J/O Number is required")
    .typeError("J/O Number must be a number")
    .positive("J/O Number must be positive")
    .integer("J/O Number must be an integer"),
  job_category: Yup.string().when("job_type", {
    is: (job_type: string) =>
      job_type === "TSO_SERVICE" || job_type === "KANBAN",
    then: (schema) => schema.required("Job Category is required"),
    otherwise: (schema) => schema,
  }),
  kanban_job_cat: Yup.string().when("job_type", {
    is: "KANBAN",
    then: (schema) => schema.required("Kanban Job Category is required"),
    otherwise: (schema) => schema.notRequired(),
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
  tso_no: Yup.string().when("job_type", {
    is: "TSO_SERVICE",
    then: (schema) => schema.required("TSO No is required"),
    otherwise: (schema) => schema,
  }),
  job_order_date: Yup.date().required("Job Order Date is required"),
  mtl_rcd_date: Yup.date().required("Material Received Date is required"),
  mtl_challan_no: Yup.number()
    .required("Material Challan No is required")
    .typeError("Material Challan No must be a number")
    .positive("Material Challan No must be positive")
    .integer("Material Challan No must be an integer"),
  item_description: Yup.string().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.notRequired(),
    otherwise: schema => schema.required("Item Description is required"),
  }),
  item_no: Yup.number().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.notRequired().nullable(),
    otherwise: schema => schema.when('job_type', {
      is: (job_type) => job_type !== 'KANBAN',
      then: (schema) => schema.required("Item No is required").typeError("Item No must be a number").positive("Item No must be positive").integer("Item No must be an integer"),
      otherwise: (schema) => schema.notRequired().nullable(),
    })
  }),
  qty: Yup.number().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.notRequired(),
    otherwise: schema => schema.required("Quantity is required").typeError("Quantity must be a number").positive("Quantity must be positive"),
  }),
  moc: Yup.string().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.notRequired(),
    otherwise: schema => schema.required("MOC is required"),
  }),
  product_desc: Yup.string().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.required("Product Description is required"),
    otherwise: schema => schema.notRequired(),
  }),
  product_qty: Yup.number().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.required("Product Quantity is required").typeError("Product Quantity must be a number").positive("Product Quantity must be positive").integer("Product Quantity must be an integer"),
    otherwise: schema => schema.notRequired().nullable(),
  }),
  bin_location: Yup.string().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.notRequired(),
    otherwise: schema => schema.required("Bin Location is required"),
  }),
  material_remark: Yup.string(),
  assembly_items: Yup.array().when('sub_type', {
    is: 'ASSEMBLY',
    then: schema => schema.of(
      Yup.object().shape({
        item_description: Yup.string().required("Item Description is required"),
        item_no: Yup.number().required("Item No is required").typeError("Item No must be a number").positive("Item No must be positive").integer("Item No must be an integer"),
        qty: Yup.number().required("Quantity is required").typeError("Quantity must be a number").positive("Quantity must be positive"),
        moc: Yup.string().required("MOC is required"),
        bin_location: Yup.string().required("Bin Location is required"),
        material_remark: Yup.string().notRequired(),
      })
    ).min(1, "At least one assembly item is required."),
    otherwise: schema => schema.notRequired(),
  }),
});

// Initial form values for Jobs
const initialValues = {
  job_type: "",
  client_name: "",
  jo_number: "",
  job_category: "",
  job_no: "",
  tso_no: "",
  kanban_job_cat:"",
  job_order_date: "",
  mtl_rcd_date: "",
  mtl_challan_no: "",
  item_description: "",
  item_no: "",
  qty: "",
  moc: "",
  bin_location: "",
  material_remark: "",
  product_desc: "",
  product_qty: "",
  sub_type: "",
  assembly_items: [],
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [flyoutType, setFlyoutType] = useState<
    "JOB_SERVICE" | "TSO_SERVICE" | "KANBAN"
  >("JOB_SERVICE");
  const [isJobServiceDropdownOpen, setJobServiceDropdownOpen] = useState<boolean>(false);
  const [isTsoServiceDropdownOpen, setTsoServiceDropdownOpen] = useState<boolean>(false);
  const [isKanbanDropdownOpen, setKanbanDropdownOpen] = useState<boolean>(false);
  const [selectedSubType, setSelectedSubType] = useState<string>("PARTIAL");
  const [data, setData] = useState<any | []>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const router = useRouter();

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

    if (values.sub_type === "ASSEMBLY") {
      const commonData: any = {
          job_type: values.job_type,
          jo_number: Number(values.jo_number),
          job_order_date: formatDate(values.job_order_date),
          mtl_rcd_date: formatDate(values.mtl_rcd_date),
          mtl_challan_no: Number(values.mtl_challan_no),
          product_desc: values.product_desc,
          product_qty: Number(values.product_qty),
          client_name: values.client_name,
      };

      if (values.job_type === "JOB_SERVICE") {
        commonData.job_no = Number(values.job_no);
      } else if (values.job_type === "TSO_SERVICE") {
        commonData.job_category = values.job_category;
        commonData.tso_no = values.tso_no;
      } else {
        commonData.job_category = values.job_category;
        commonData.kanban_job_cat = values.kanban_job_cat;
      }

      const bulkPayload = {
        common_data: commonData,
        items: values.assembly_items.map((item: any) => ({
          item_description: item.item_description,
          item_no: Number(item.item_no),
          qty: Number(item.qty),
          moc: item.moc,
          bin_location: item.bin_location,
          material_remark: item.material_remark || "",
        })),
      };

      try {
        await axiosProvider.post("/fineengg_erp/jobs/bulk", bulkPayload);
        toast.success("Assembly added successfully");
        fetchData();
        setFlyoutOpen(false);
      } catch (error: any) {
        console.error("Error saving assembly job:", error);
        toast.error("Failed to add Assembly");
      }
      return;
    }

    // Create payload based on job type
    let payload: any = {
      job_type: values.job_type,
      client_name: values.client_name,
      jo_number: Number(values.jo_number),
      job_order_date: formatDate(values.job_order_date),
      mtl_rcd_date: formatDate(values.mtl_rcd_date),
      mtl_challan_no: Number(values.mtl_challan_no),
      item_description: values.item_description,
      item_no: Number(values.item_no),
      qty: Number(values.qty),
      moc: values.moc,
      bin_location: values.bin_location,
      material_remark: values.material_remark || "",
      product_desc: values.product_desc || null,
      product_qty: values.product_qty ? Number(values.product_qty) : null,
    };

    // Add conditional fields
    if (values.job_type === "JOB_SERVICE") {
      payload.job_no = Number(values.job_no);
      payload.sub_type = values.sub_type;
    } else if (values.job_type === "TSO_SERVICE") {
      payload.tso_no = values.tso_no;
      payload.job_category = values.job_category;
    } else if (values.job_type === "KANBAN") {
      payload.job_category = values.job_category;
      payload.item_no = null;
      payload.kanban_job_cat = values.kanban_job_cat;
    }

    try {
      await axiosProvider.post("/fineengg_erp/jobs", payload);

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
        const response = await axiosProvider.delete(`/fineengg_erp/jobs/${id}`);

        if (response.data.success) {
          toast.success("Job deleted successfully");
          fetchData();
        } else {
          toast.error("Failed to delete job");
        }
      } catch (error: any) {
        console.error("Error deleting job:", error);
        toast.error("Failed to delete job");
      }
    }
  };

  const fetchData = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/jobs");
      setData(response.data.data);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  };

  const filteredData = useMemo(() => {
    if (activeFilter === "ALL") return data;
    if (activeFilter === "REJECTED") {
      return data.filter((item: any) => item.is_rejected || item.rejected);
    }
    return data.filter((item: any) => item.job_type === activeFilter);
  }, [data, activeFilter]);

  const resetFormState = () => {
    setFlyoutOpen(false);
  };

  const openJobServiceFlyout = (subType: string = "PARTIAL") => {
    setFlyoutType("JOB_SERVICE");
    setSelectedSubType(subType);
    setFlyoutOpen(true);
    setJobServiceDropdownOpen(false);
  };

  const openTsoServiceFlyout = (subType: string = "PARTIAL") => {
    setFlyoutType("TSO_SERVICE");
    setSelectedSubType(subType);
    setFlyoutOpen(true);
    setTsoServiceDropdownOpen(false);
  };

  const openKanbanFlyout = (subType: string = "PARTIAL") => {
    setFlyoutType("KANBAN");
    setSelectedSubType(subType);
    setFlyoutOpen(true);
    setKanbanDropdownOpen(false);
  };

  // Get initial values based on flyout type
  const getInitialValues = () => {
    const values = { ...initialValues, job_type: flyoutType, sub_type: selectedSubType };
    
    if (flyoutType === "KANBAN") {
      values.client_name = "Amar Equipment";
    }

    if (selectedSubType === 'ASSEMBLY') {
        values.assembly_items = [{ item_description: '', item_no: '', qty: '', moc: '', bin_location: '', material_remark: '' }];
        values.item_description = '';
        values.item_no = '';
        values.qty = '';
        values.moc = '';
        values.bin_location = '';
        values.material_remark = '';
        values.product_desc = '';
        values.product_qty = '';
    }
    return values;
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
    const subTypeLabel = selectedSubType === "PARTIAL" ? "Partial" : "Assembly";
    if (flyoutType === "JOB_SERVICE") return `Add Job Service (${subTypeLabel})`;
    if (flyoutType === "TSO_SERVICE") return `Add TSO Service (${subTypeLabel})`;
    if (flyoutType === "KANBAN") return `Add Kanban (${subTypeLabel})`;
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
    fetchData();
  }, []);

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
            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              {/* Search and filter table row */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
                <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "ALL"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter("JOB_SERVICE")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "JOB_SERVICE"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Job Service
                  </button>
                  <button
                    onClick={() => setActiveFilter("TSO_SERVICE")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "TSO_SERVICE"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    TSO Service
                  </button>
                  <button
                    onClick={() => setActiveFilter("KANBAN")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "KANBAN"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setActiveFilter("REJECTED")}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === "REJECTED"
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Rejected
                  </button>
                </div>
                <div className="flex justify-center items-center gap-4">
                  <div className="relative">
                    <div
                      className="flex items-center gap-2 py-[9px] px-[21px] rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-blue-600 group hover:bg-blue-500"
                      onClick={() => setJobServiceDropdownOpen(!isJobServiceDropdownOpen)}
                    >
                      <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        Add Job Service
                      </p>
                      <FaChevronDown className="w-3 h-3 text-white ml-2" />
                    </div>
                    {isJobServiceDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => openJobServiceFlyout("PARTIAL")}
                        >
                          Partial
                        </div>
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => openJobServiceFlyout("ASSEMBLY")}
                        >
                          Assembly
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className="flex items-center gap-2 py-[9px] px-[21px] rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-green-600 group hover:bg-green-500"
                      onClick={() => setTsoServiceDropdownOpen(!isTsoServiceDropdownOpen)}
                    >
                      <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        Add TSO Service
                      </p>
                      <FaChevronDown className="w-3 h-3 text-white ml-2" />
                    </div>
                    {isTsoServiceDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => openTsoServiceFlyout("PARTIAL")}
                        >
                          Partial
                        </div>
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => openTsoServiceFlyout("ASSEMBLY")}
                        >
                          Assembly
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className="flex items-center gap-2 py-[9px] px-[21px] rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-purple-600 group hover:bg-purple-500"
                      onClick={() => setKanbanDropdownOpen(!isKanbanDropdownOpen)}
                    >
                      <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        Add Kanban
                      </p>
                      <FaChevronDown className="w-3 h-3 text-white ml-2" />
                    </div>
                    {isKanbanDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => openKanbanFlyout("PARTIAL")}
                        >
                          Partial
                        </div>
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                          onClick={() => openKanbanFlyout("ASSEMBLY")}
                        >
                          Assembly
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job No
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
                          Actions
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item: any) => (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_no || "N/A"}
                          </p>
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
                          <div className="flex items-center gap-2">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FITLER FLYOUT */}
      <>
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
              {({ values, setFieldValue, handleSubmit, isSubmitting, errors }) => (
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

                      {/* Client Name */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Client Name
                        </p>
                        <SelectInput
                          name="client_name"
                          value={values.client_name}
                          setFieldValue={setFieldValue}
                          options={
                            values.job_type === "KANBAN"
                              ? [{ value: "Amar Equipment", label: "Amar Equipment" }]
                              : clientOptions
                          }
                          placeholder="Select Client Name"
                        />
                        <ErrorMessage
                          name="client_name"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

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

                      {/* TSO No - Only for TSO_SERVICE */}
                      {values.job_type === "TSO_SERVICE" && (
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                            TSO No
                          </p>
                          <input
                            type="text"
                            name="tso_no"
                            value={values.tso_no}
                            onChange={(e) =>
                              setFieldValue("tso_no", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                            placeholder="Enter TSO No"
                          />
                          <ErrorMessage
                            name="tso_no"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      )}

                      {/* J/O Number */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          J/O Number
                        </p>
                        <input
                          type="number"
                          name="jo_number"
                          value={values.jo_number}
                          onChange={(e) =>
                            setFieldValue("jo_number", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter J/O Number"
                        />
                        <ErrorMessage
                          name="jo_number"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Job Category - Only for TSO_SERVICE and KANBAN */}
                      { (values.job_type === "TSO_SERVICE" ||
                        values.job_type === "KANBAN") && (
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                            {values.job_type === "KANBAN" ? "Product Category" : "Job Category"}
                          </p>
                          <SelectInput
                            name="job_category"
                            value={values.job_category}
                            setFieldValue={setFieldValue}
                            options={getCategoryOptions(values.job_type)}
                            placeholder={values.job_type === "KANBAN" ? "Select Product Category" : "Select TSO Service Category"}
                          />
                          <ErrorMessage
                            name="job_category"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      )}

                      {/* Kanban Job Category - Only for KANBAN */}
                      {values.job_type === "KANBAN" && (
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                            Kanban Job Category
                          </p>
                          <SelectInput
                            name="kanban_job_cat"
                            value={values.kanban_job_cat}
                            setFieldValue={setFieldValue}
                            options={kanbanJobCatOptions}
                            placeholder="Select Kanban Job Category"
                          />
                          <ErrorMessage
                            name="kanban_job_cat"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      )}

                      {/* Job Order Date */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Job Order Date
                        </p>
                        <DatePickerInput
                          name="job_order_date"
                          value={values.job_order_date}
                          setFieldValue={setFieldValue}
                          placeholderText="Select Job Order Date"
                        />
                        <ErrorMessage
                          name="job_order_date"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Material Received Date */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Material Received Date
                        </p>
                        <DatePickerInput
                          name="mtl_rcd_date"
                          value={values.mtl_rcd_date}
                          setFieldValue={setFieldValue}
                          placeholderText="Select Material Received Date"
                        />
                        <ErrorMessage
                          name="mtl_rcd_date"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Material Challan No */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Material Challan No
                        </p>
                        <input
                          type="number"
                          name="mtl_challan_no"
                          value={values.mtl_challan_no}
                          onChange={(e) =>
                            setFieldValue("mtl_challan_no", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Material Challan No"
                        />
                        <ErrorMessage
                          name="mtl_challan_no"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* ====== CONDITIONAL FIELDS FOR PARTIAL VS ASSEMBLY ====== */}

                      {/* Fields for PARTIAL or other job types */}
                      {values.sub_type !== "ASSEMBLY" && (
                        <>
                          {/* Item Description */}
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                              Item Description
                            </p>
                            <input
                              type="text"
                              name="item_description"
                              value={values.item_description}
                              onChange={(e) =>
                                setFieldValue("item_description", e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                              placeholder="Enter Item Description"
                            />
                            <ErrorMessage
                              name="item_description"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          {/* Item No */}
                          {values.job_type !== "KANBAN" && (
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
                          )}

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

                          {/* Bin Location */}
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                              Bin Location
                            </p>
                            <input
                              type="text"
                              name="bin_location"
                              value={values.bin_location}
                              onChange={(e) =>
                                setFieldValue("bin_location", e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                              placeholder="Enter Bin Location"
                            />
                            <ErrorMessage
                              name="bin_location"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        </>
                      )}

                      {/* Assembly Items - Only for JOB_SERVICE - ASSEMBLY */}
                      {values.sub_type === "ASSEMBLY" && (
                        <>
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                              Product Description
                            </p>
                            <input
                              type="text"
                              name="product_desc"
                              value={values.product_desc}
                              onChange={(e) => setFieldValue("product_desc", e.target.value)}
                              className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                              placeholder="Enter Product Description"
                            />
                            <ErrorMessage
                              name="product_desc"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                              Product Quantity
                            </p>
                            <input
                              type="number"
                              name="product_qty"
                              value={values.product_qty}
                              onChange={(e) => setFieldValue("product_qty", e.target.value)}
                              className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                              placeholder="Enter Product Quantity"
                            />
                            <ErrorMessage
                              name="product_qty"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        <FieldArray name="assembly_items">
                          {({ remove, push }) => (
                            <div className="col-span-1 md:col-span-2 space-y-6">
                              {values.assembly_items && values.assembly_items.length > 0 &&
                                values.assembly_items.map((item, index) => (
                                  <div key={index} className="border border-gray-200 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                      <p className="font-semibold text-gray-700">Item #{index + 1}</p>
                                      {values.assembly_items.length > 1 && (
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
                                      <div className="w-full md:col-span-2">
                                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Item Description</p>
                                        <input type="text" name={`assembly_items.${index}.item_description`} value={item.item_description} onChange={(e) => setFieldValue(`assembly_items.${index}.item_description`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Item Description" />
                                        <ErrorMessage name={`assembly_items.${index}.item_description`} component="div" className="text-red-500 text-sm mt-1" />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Item No</p>
                                        <input type="number" name={`assembly_items.${index}.item_no`} value={item.item_no} onChange={(e) => setFieldValue(`assembly_items.${index}.item_no`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Item No" />
                                        <ErrorMessage name={`assembly_items.${index}.item_no`} component="div" className="text-red-500 text-sm mt-1" />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Quantity</p>
                                        <input type="number" name={`assembly_items.${index}.qty`} value={item.qty} onChange={(e) => setFieldValue(`assembly_items.${index}.qty`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Quantity" />
                                        <ErrorMessage name={`assembly_items.${index}.qty`} component="div" className="text-red-500 text-sm mt-1" />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">MOC</p>
                                        <input type="text" name={`assembly_items.${index}.moc`} value={item.moc} onChange={(e) => setFieldValue(`assembly_items.${index}.moc`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter MOC" />
                                        <ErrorMessage name={`assembly_items.${index}.moc`} component="div" className="text-red-500 text-sm mt-1" />
                                      </div>
                                      <div className="w-full">
                                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Bin Location</p>
                                        <input type="text" name={`assembly_items.${index}.bin_location`} value={item.bin_location} onChange={(e) => setFieldValue(`assembly_items.${index}.bin_location`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Bin Location" />
                                        <ErrorMessage name={`assembly_items.${index}.bin_location`} component="div" className="text-red-500 text-sm mt-1" />
                                      </div>
                                      <div className="w-full md:col-span-2">
                                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Material Remark</p>
                                        <textarea name={`assembly_items.${index}.material_remark`} value={item.material_remark} onChange={(e) => setFieldValue(`assembly_items.${index}.material_remark`, e.target.value)} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999] min-h-[100px]" placeholder="Enter Material Remark (Optional)" />
                                        <ErrorMessage name={`assembly_items.${index}.material_remark`} component="div" className="text-red-500 text-sm mt-1" />
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                              <button
                                type="button"
                                className="flex items-center gap-2 text-primary-600 font-medium py-2 px-4 border-2 border-dashed border-primary-600 rounded-lg hover:bg-primary-50"
                                onClick={() => push({ item_description: '', item_no: '', qty: '', moc: '', bin_location: '', material_remark: '' })}
                              >
                                <FaPlus /> Add Another Item
                              </button>
                               <ErrorMessage name="assembly_items" component="div" className="text-red-500 text-sm mt-1" />
                            </div>
                          )}
                        </FieldArray>
                        </>
                      )}

                      {/* Material Remark */}
                      {values.sub_type !== "ASSEMBLY" && (
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                            Material Remark
                          </p>
                          <textarea
                            name="material_remark"
                            value={values.material_remark}
                            onChange={(e) =>
                              setFieldValue("material_remark", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999] min-h-[100px]"
                            placeholder="Enter Material Remark (Optional)"
                          />
                          <ErrorMessage
                            name="material_remark"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      )}
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
      </>
      {/* FITLER FLYOUT END */}
    </>
  );
}