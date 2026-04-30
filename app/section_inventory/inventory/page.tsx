"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FiFilter, FiSearch } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { FaChevronDown, FaPlus, FaRegEdit } from "react-icons/fa";
import { HiTrash } from "react-icons/hi";
import LeftSideBar from "../../component/LeftSideBar";
import { toast } from "react-toastify";
import DesktopHeader from "../../component/DesktopHeader";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import SelectInput from "../../component/SelectInput";
import DatePickerInput from "../../component/DatePickerInput";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";
import PageGuard from "../../component/PageGuard";
import StorageManager from "../../../provider/StorageManager";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

// Permission helper function
const hasPermission = (permissions: any[] | null, permissionName: string): boolean => {
  if (!permissions) return false;
  return permissions.some(p => p.name === permissionName);
};

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

const kanbanJobCatOptions = [
  { value: "MinMax", label: "MinMax" },
  { value: "Kanban", label: "Kanban" },
];

// Validation Schema for Jobs form
const validationSchema = Yup.object().shape({
  job_type: Yup.string().required("Job Type is required"),
  client_name: Yup.string().required("Client Name is required"),
  jo_number: Yup.string().required("J/O Number is required"),
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
  job_no: Yup.string().when("job_type", {
    is: "JOB_SERVICE",
    then: (schema) => schema.required("Job No is required"),
    otherwise: (schema) => schema,
  }),
  tso_no: Yup.string().when("job_type", {
    is: "TSO_SERVICE",
    then: (schema) => schema.required("TSO No is required"),
    otherwise: (schema) => schema,
  }),
  job_order_date: Yup.date().required("Job Order Date is required"),
  mtl_rcd_date: Yup.date().required("Material Received Date is required"),
  mtl_challan_no: Yup.string()
    .required("Material Challan No is required"),
  item_description: Yup.string().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.required("Item Description is required"),
  }),
  item_no: Yup.string().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.notRequired().nullable(),
    otherwise: (schema) =>
      schema.when("job_type", {
        is: (job_type) => job_type !== "KANBAN",
        then: (schema) =>
          schema
            .required("Item No is required"),
        otherwise: (schema) => schema.notRequired().nullable(),
      }),
  }),
  qty: Yup.number().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) =>
      schema
        .required("Quantity is required")
        .typeError("Quantity must be a number")
        .positive("Quantity must be positive"),
  }),
  moc: Yup.string().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.required("MOC is required"),
  }),
  product_item_no: Yup.string().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.required("Product Item No is required"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  product_desc: Yup.string().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.required("Product Description is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  product_qty: Yup.number().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) =>
      schema
        .required("Product Quantity is required")
        .typeError("Product Quantity must be a number")
        .positive("Product Quantity must be positive")
        .integer("Product Quantity must be an integer"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  bin_location: Yup.string().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.required("Bin Location is required"),
  }),
  material_remark: Yup.string(),
  assembly_items: Yup.array().when("sub_type", {
    is: "ASSEMBLY",
    then: (schema) =>
      schema
        .of(
          Yup.object().shape({
            item_description: Yup.string().required(
              "Item Description is required"
            ),
            item_no: Yup.string()
              .required("Item No is required"),
            qty: Yup.number()
              .required("Quantity is required")
              .typeError("Quantity must be a number")
              .positive("Quantity must be positive"),
            moc: Yup.string().required("MOC is required"),
            bin_location: Yup.string().required("Bin Location is required"),
            material_remark: Yup.string().notRequired(),
          })
        )
        .min(1, "At least one assembly item is required."),
    otherwise: (schema) => schema.notRequired(),
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
  kanban_job_cat: "",
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
  product_item_no: "",
  product_qty: "",
  sub_type: "",
  assembly_items: [],
};

// Format dates to YYYY-MM-DD format
const formatDate = (date: any) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [flyoutType, setFlyoutType] = useState<
    "JOB_SERVICE" | "TSO_SERVICE" | "KANBAN"
  >("JOB_SERVICE");
  const [isJobServiceDropdownOpen, setJobServiceDropdownOpen] =
    useState<boolean>(false);
  const [isTsoServiceDropdownOpen, setTsoServiceDropdownOpen] =
    useState<boolean>(false);
  const [isKanbanDropdownOpen, setKanbanDropdownOpen] =
    useState<boolean>(false);
  const [selectedSubType, setSelectedSubType] = useState<string>("PARTIAL");
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 10;
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchField, setSearchField] = useState<string>("jo_number");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get user permissions
  const permissions = storage.getUserPermissions();
  
  // ALL buttons (Add Job Service, Add TSO Service, Add Kanban, Delete) controlled by material.data.edit
  const canEditInventory = hasPermission(permissions, "material.data.edit");

  const getSearchConfig = (filter: string) => {
    switch (filter) {
      case "JOB_SERVICE":
        return { key: "job_no", placeholder: "Search Job No..." };
      case "TSO_SERVICE":
        return { key: "tso_no", placeholder: "Search TSO No..." };
      case "KANBAN":
        return { key: "jo_number", placeholder: "Search J/O Number..." };
      default:
        return { key: "jo_number", placeholder: "Search Job/TSO/JO No..." };
    }
  };
  const getSearchFieldOptions = (filter: string) => {
    if (filter === "JOB_SERVICE") {
      return [{ value: "job_no", label: "Job No" }];
    }
    if (filter === "TSO_SERVICE") {
      return [{ value: "tso_no", label: "TSO No" }];
    }
    if (filter === "KANBAN") {
      return [{ value: "jo_number", label: "J/O Number" }];
    }
    return [
      { value: "job_no", label: "Job No" },
      { value: "tso_no", label: "TSO No" },
      { value: "jo_number", label: "J/O Number" },
    ];
  };
  const isAllOrRejectedTab = activeFilter === "ALL" || activeFilter === "REJECTED";
  const selectedSearchFieldLabel =
    getSearchFieldOptions(activeFilter).find((option) => option.value === searchField)?.label ||
    getSearchConfig(activeFilter).placeholder;
  const showJobNoColumn = activeFilter !== "TSO_SERVICE" && activeFilter !== "KANBAN";
  const showTsoNoColumn = activeFilter !== "JOB_SERVICE" && activeFilter !== "KANBAN";
  const tableColSpan = 15 + (showJobNoColumn ? 1 : 0) + (showTsoNoColumn ? 1 : 0);

  const fetchData = useCallback(async (filter: string, page: number, search: string = "", field: string = searchField) => {
    try {
      let query = `?page=${page}&limit=${pageSize}`;
      if (filter !== "ALL" && filter !== "REJECTED") {
        query += `&job_type=${filter}`;
      } else if (filter === "REJECTED") {
        query += `&rejected=true`;
      }
      if (search && field) {
        query += `&${field}=${encodeURIComponent(search)}`;
      }
      const response = await axiosProvider.get(`/fineengg_erp/system/jobs${query}`);
      setData(response.data.data);
      if (response.data.meta) {
        setTotalPages(response.data.meta.totalPages);
        setCurrentPage(response.data.meta.page);
      }
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    }
  }, [pageSize, searchField]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

    // Debounced search handler 👈 ADD THIS ENTIRE FUNCTION
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout for debouncing
    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 500); // Wait 500ms after user stops typing
  };

  const handleEdit = async (item: any) => {
    if (!canEditInventory) {
      toast.error("You don't have permission to edit jobs");
      return;
    }
    
    const subType = item.product_item_no ? "ASSEMBLY" : "PARTIAL";
    
    if (subType === "ASSEMBLY") {
      try {
        // Fetch all items in this assembly group using product_item_no
        const response = await axiosProvider.get(`/fineengg_erp/system/jobs?product_item_no=${item.product_item_no}`);
        const relatedItems = response.data.data.map((job: any) => ({
          id: job.id,
          item_description: job.item_description || "",
          item_no: job.item_no || "",
          qty: job.qty_history || job.qty || "",
          moc: job.moc || "",
          bin_location: job.bin_location || "",
          material_remark: job.material_remark || "",
        }));
        
        setEditingJob({ ...item, assembly_items: relatedItems });
      } catch (error) {
        console.error("Error fetching assembly items:", error);
        toast.error("Failed to load complete assembly data");
        return;
      }
    } else {
      setEditingJob(item);
    }

    setFlyoutType(item.job_type);
    setSelectedSubType(subType);
    setFlyoutOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!canEditInventory) {
      toast.error("You don't have permission to add/edit jobs");
      return;
    }
    
    if (values.sub_type === "ASSEMBLY") {
      const commonData: any = {
        job_type: values.job_type,
        jo_number: values.jo_number,
        job_order_date: formatDate(values.job_order_date),
        mtl_rcd_date: formatDate(values.mtl_rcd_date),
        mtl_challan_no: values.mtl_challan_no,
        product_desc: values.product_desc,
        product_item_no: values.product_item_no,
        product_qty: Number(values.product_qty),
        client_name: values.client_name,
      };

      if (values.job_type === "JOB_SERVICE") {
        commonData.job_no = values.job_no;
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
          item_no: item.item_no,
          qty: Number(item.qty),
          moc: item.moc,
          bin_location: item.bin_location,
          material_remark: item.material_remark || "",
        })),
      };

      try {
        if (editingJob) {
          const bulkUpdatePayload = {
            common_data: {
              job_type: values.job_type,
              client_name: values.client_name,
              jo_number: values.jo_number,
              job_order_date: formatDate(values.job_order_date),
              mtl_rcd_date: formatDate(values.mtl_rcd_date),
              mtl_challan_no: values.mtl_challan_no,
              product_desc: values.product_desc,
              product_item_no: values.product_item_no,
              product_qty: Number(values.product_qty),
              job_no: values.job_no || null,
              job_category: values.job_category || null,
              tso_no: values.tso_no || null,
              kanban_job_cat: values.kanban_job_cat || null,
            },
            items: values.assembly_items.map((item: any) => ({
              id: item.id,
              item_description: item.item_description,
              item_no: item.item_no,
              qty: Number(item.qty),
              moc: item.moc,
              bin_location: item.bin_location,
              material_remark: item.material_remark || null,
            })),
          };
          
          await axiosProvider.put("/fineengg_erp/system/jobs/bulk", bulkUpdatePayload);
          toast.success("Assembly updated successfully");
          fetchData(activeFilter, currentPage);
          resetFormState();
          return;
        }
        await axiosProvider.post("/fineengg_erp/system/jobs/bulk", bulkPayload);
        toast.success("Assembly added successfully");
        fetchData(activeFilter, currentPage);
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
      jo_number: values.jo_number,
      job_order_date: formatDate(values.job_order_date),
      mtl_rcd_date: formatDate(values.mtl_rcd_date),
      mtl_challan_no: values.mtl_challan_no,
      item_description: values.item_description,
      item_no: values.item_no,
      qty: Number(values.qty),
      moc: values.moc,
      bin_location: values.bin_location,
      material_remark: values.material_remark || "",
      product_desc: values.product_desc || null,
      product_item_no: null,
      product_qty: values.product_qty ? Number(values.product_qty) : null,
    };

    // Add conditional fields
    if (values.job_type === "JOB_SERVICE") {
      payload.job_no = values.job_no;
    } else if (values.job_type === "TSO_SERVICE") {
      payload.tso_no = values.tso_no;
      payload.job_category = values.job_category;
    } else if (values.job_type === "KANBAN") {
      payload.job_category = values.job_category;
      payload.kanban_job_cat = values.kanban_job_cat;
    }

    try {
      if (editingJob) {
        await axiosProvider.put(`/fineengg_erp/system/jobs/${editingJob.id}`, payload);
        toast.success(`${values.job_type.replace('_', ' ')} updated successfully`);
      } else {
        await axiosProvider.post("/fineengg_erp/system/jobs", payload);
        toast.success(`${values.job_type.replace('_', ' ')} added successfully`);
      }

      fetchData(activeFilter, currentPage);
      resetFormState();
    } catch (error: any) {
      console.error("Error saving job:", error);
      toast.error(
        error?.response?.data?.message || 
        `Failed to ${editingJob ? "update" : "add"} ${values.job_type}`
      );
    }
  };

  const handleDelete = async (id: string) => {
    // Check edit permission for delete
    if (!canEditInventory) {
      toast.error("You don't have permission to delete jobs");
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
        const response = await axiosProvider.delete(
          `/fineengg_erp/system/jobs/${id}`
        );

        if (response.data.success) {
          toast.success("Job deleted successfully");
          fetchData(activeFilter, currentPage);
        } else {
          toast.error("Failed to delete job");
        }
      } catch (error: any) {
        console.error("Error deleting job:", error);
        toast.error("Failed to delete job");
      }
    }
  };

  const resetFormState = () => {
    setFlyoutOpen(false);
    setEditingJob(null);
  };

  const openJobServiceFlyout = (subType: string = "PARTIAL") => {
    if (!canEditInventory) {
      toast.error("You don't have permission to add Job Service");
      return;
    }
    setFlyoutType("JOB_SERVICE");
    setSelectedSubType(subType);
    setFlyoutOpen(true);
    setJobServiceDropdownOpen(false);
  };

  const openTsoServiceFlyout = (subType: string = "PARTIAL") => {
    if (!canEditInventory) {
      toast.error("You don't have permission to add TSO Service");
      return;
    }
    setFlyoutType("TSO_SERVICE");
    setSelectedSubType(subType);
    setFlyoutOpen(true);
    setTsoServiceDropdownOpen(false);
  };

  const openKanbanFlyout = (subType: string = "PARTIAL") => {
    if (!canEditInventory) {
      toast.error("You don't have permission to add Kanban");
      return;
    }
    setFlyoutType("KANBAN");
    setSelectedSubType(subType);
    setFlyoutOpen(true);
    setKanbanDropdownOpen(false);
  };

  // Get initial values based on flyout type
  const initialFormValues = useMemo(() => {
    if (editingJob) {
      const subType = editingJob.product_item_no ? "ASSEMBLY" : "PARTIAL";
      return {
        job_type: editingJob.job_type || flyoutType,
        client_name: editingJob.client_name || "",
        jo_number: editingJob.jo_number || "",
        job_category: editingJob.job_category || "",
        job_no: editingJob.job_no || "",
        tso_no: editingJob.tso_no || "",
        kanban_job_cat: editingJob.kanban_job_cat || "",
        job_order_date: editingJob.job_order_date || "",
        mtl_rcd_date: editingJob.mtl_rcd_date || "",
        mtl_challan_no: editingJob.mtl_challan_no || "",
        item_description: editingJob.item_description || "",
        item_no: editingJob.item_no || "",
        qty: editingJob.qty || editingJob.qty_history || "",
        moc: editingJob.moc || "",
        bin_location: editingJob.bin_location || "",
        material_remark: editingJob.material_remark || "",
        product_desc: editingJob.product_desc || "",
        product_item_no: editingJob.product_item_no || "",
        product_qty: editingJob.product_qty || "",
        sub_type: subType,
        assembly_items: editingJob.assembly_items || (subType === "ASSEMBLY" ? [{}] : []),
      };
    }

    const values: any = {
      ...initialValues,
      job_type: flyoutType,
      sub_type: selectedSubType,
    };

    if (flyoutType === "KANBAN") {
      values.client_name = "Amar Equipment";
    }

    if (selectedSubType === "ASSEMBLY") {
      values.assembly_items = [
        {
          item_description: "",
          item_no: "",
          qty: "",
          moc: "",
          bin_location: "",
          material_remark: "",
        },
      ];
      values.item_description = "";
      values.item_no = "";
      values.qty = "";
      values.moc = "";
      values.bin_location = "";
      values.material_remark = "";
      values.product_desc = "";
      values.product_item_no = "";
      values.product_qty = "";
    }
    return values;
  }, [flyoutType, selectedSubType, editingJob]);

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
    const mode = editingJob ? "Edit" : "Add";
    const subTypeLabel = selectedSubType === "PARTIAL" ? "Partial" : "Assembly";
    if (flyoutType === "JOB_SERVICE")
      return `${mode} Job Service (${subTypeLabel})`;
    if (flyoutType === "TSO_SERVICE")
      return `${mode} TSO Service (${subTypeLabel})`;
    if (flyoutType === "KANBAN") return `${mode} Kanban (${subTypeLabel})`;
    return `${mode} Job`;
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (editingJob) return "Update Job";
    if (flyoutType === "JOB_SERVICE") return "Add Job Service";
    if (flyoutType === "TSO_SERVICE") return "Add TSO Service";
    if (flyoutType === "KANBAN") return "Add Kanban";
    return "Add Job";
  };

  useEffect(() => {
    fetchData(activeFilter, currentPage, searchTerm, searchField);
  }, [activeFilter, currentPage, searchTerm, searchField]);

  useEffect(() => {
    if (activeFilter === "ALL" || activeFilter === "REJECTED") {
      setSearchField("");
      setSearchInput("");
      setSearchTerm("");
      return;
    }

    const defaultKey = getSearchConfig(activeFilter).key;
    setSearchField(defaultKey);
  }, [activeFilter]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
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
      <PageGuard requiredPermission="inventory1.view">
        <div className="flex justify-end min-h-screen">
          <LeftSideBar />
          {/* Main content right section */}
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
            {/* left section top row */}
            <DesktopHeader />

            {/* Main content middle section */}
            <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
              {/* Search and filter table row */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-1 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => handleFilterChange("ALL")}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleFilterChange("JOB_SERVICE")}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeFilter === "JOB_SERVICE"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Job Service
                    </button>
                    <button
                      onClick={() => handleFilterChange("TSO_SERVICE")}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeFilter === "TSO_SERVICE"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      TSO Service
                    </button>
                    <button
                      onClick={() => handleFilterChange("KANBAN")}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeFilter === "KANBAN"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Kanban
                    </button>
                    <button
                      onClick={() => handleFilterChange("REJECTED")}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeFilter === "REJECTED"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Rejected
                    </button>
                  </div>

                  <div className="w-full lg:w-[340px] xl:w-[280px]">
                    {isAllOrRejectedTab && !searchField ? (
                      <select
                        value={searchField}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchField(value);
                          setSearchInput("");
                          setSearchTerm("");
                          setCurrentPage(1);
                        }}
                        aria-label="Select search field"
                        title="Select search field"
                        className="w-full py-2.5 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-600"
                      >
                        <option value="">Select search type</option>
                        {getSearchFieldOptions(activeFilter).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center w-full rounded-lg border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-primary-600">
                        {isAllOrRejectedTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchField("");
                              setSearchInput("");
                              setSearchTerm("");
                              setCurrentPage(1);
                            }}
                            className="py-2.5 px-3 text-sm text-primary-600 border-r border-gray-200 whitespace-nowrap"
                            title="Change search field"
                          >
                            Change
                          </button>
                        )}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder={`Search ${selectedSearchFieldLabel}...`}
                            value={searchInput}
                            onChange={handleSearchChange}
                            className="w-full py-2.5 px-4 pr-10 text-sm focus:outline-none bg-transparent"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FiSearch className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-start xl:justify-end items-center gap-3 w-full xl:w-auto">
                  {/* Add Job Service Button - Disabled if no edit permission */}
                  <div className="relative">
                    <div
                      className={`flex items-center gap-2 py-[9px] px-4 rounded-[4px] border border-[#E7E7E7] cursor-pointer ${
                        canEditInventory ? "bg-blue-600 group hover:bg-blue-500" : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => canEditInventory && setJobServiceDropdownOpen(!isJobServiceDropdownOpen)}
                    >
                      <FiFilter className="w-4 h-4 text-white" />
                      <p className="text-white text-sm font-medium">Add Job</p>
                    </div>
                    {canEditInventory && isJobServiceDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-50">
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

                  {/* Add TSO Service Button - Disabled if no edit permission */}
                  <div className="relative">
                    <div
                      className={`flex items-center gap-2 py-[9px] px-4 rounded-[4px] border border-[#E7E7E7] cursor-pointer ${
                        canEditInventory ? "bg-green-600 group hover:bg-green-500" : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => canEditInventory && setTsoServiceDropdownOpen(!isTsoServiceDropdownOpen)}
                    >
                      <FiFilter className="w-4 h-4 text-white" />
                      <p className="text-white text-sm font-medium">Add TSO</p>
                    </div>
                    {canEditInventory && isTsoServiceDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-50">
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

                  {/* Add Kanban Button - Disabled if no edit permission */}
                  <div className="relative">
                    <div
                      className={`flex items-center gap-2 py-[9px] px-4 rounded-[4px] border border-[#E7E7E7] cursor-pointer ${
                        canEditInventory ? "bg-purple-600 group hover:bg-purple-500" : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => canEditInventory && setKanbanDropdownOpen(!isKanbanDropdownOpen)}
                    >
                      <FiFilter className="w-4 h-4 text-white" />
                      <p className="text-white text-sm font-medium">Add Kanban</p>
                    </div>
                    {canEditInventory && isKanbanDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-50">
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

              {/* ----------------Table----------------------- */}
              <div className="relative overflow-x-auto overflow-y-auto sm:rounded-lg max-h-[500px] border border-tableBorder">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-separate border-spacing-0">
                  <thead className="text-xs text-[#999999] sticky top-0 z-20 bg-gray-50">
                    <tr className="border border-tableBorder">
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Client Name
                      </th>
                      {showJobNoColumn && (
                        <th
                          scope="col"
                          className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                        >
                          Job No
                        </th>
                      )}
                      {showTsoNoColumn && (
                        <th
                          scope="col"
                          className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                        >
                          TSO No
                        </th>
                      )}
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        J/O Number
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Product Desc
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Product Item No
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Product Qty
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Item Desc
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Item No
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Qty
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        MOC
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Job Order Date
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Mtl Rcd Date
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Mtl Challan No
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Bin Location
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Mtl Remark
                      </th>
                      <th
                        scope="col"
                        className="p-3 border border-tableBorder font-semibold text-firstBlack text-sm leading-normal whitespace-nowrap bg-gray-50 sticky top-0"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tableColSpan}
                          className="px-4 py-6 text-center border border-tableBorder"
                        >
                          <p className="text-[#666666] text-sm">
                            No data found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      data.map((item: any) => (
                        <tr
                          className="border border-tableBorder bg-white hover:bg-primary-100"
                          key={item.id}
                        >
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            <div className="flex flex-col">
                              <span>{item.client_name || "N/A"}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-1 ${
                                item.product_item_no 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.product_item_no ? 'ASSEMBLY' : 'PARTIAL'}
                              </span>
                            </div>
                          </td>
                          {showJobNoColumn && (
                            <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                              {item.job_no || "N/A"}
                            </td>
                          )}
                          {showTsoNoColumn && (
                            <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                              {item.tso_no || "N/A"}
                            </td>
                          )}
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.jo_number || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.product_desc || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.product_item_no || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.product_qty || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.item_description || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.item_no || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.qty_history || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.moc || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.job_order_date || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.mtl_rcd_date || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.mtl_challan_no || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.bin_location || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder text-[#232323] text-sm leading-normal">
                            {item.material_remark || "N/A"}
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            {canEditInventory && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors"
                                  title="Edit"
                                >
                                  <FaRegEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                  title="Delete"
                                >
                                  <HiTrash className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 px-2">
                <p className="text-[#666666] text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER FLYOUT */}
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
                initialValues={initialFormValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
              >
                {({
                  values,
                  setFieldValue,
                  handleSubmit,
                  isSubmitting,
                }) => (
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

                        {/* Client Name */}
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                            Client Name
                          </p>
                          <SelectInput
                            name="client_name"
                            value={values.client_name}
                            setFieldValue={setFieldValue}
                            options={
                              values.job_type === "KANBAN"
                                ? [
                                    {
                                      value: "Amar Equipment",
                                      label: "Amar Equipment",
                                    },
                                  ]
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
                        )}

                        {/* TSO No - Only for TSO_SERVICE */}
                        {values.job_type === "TSO_SERVICE" && (
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                              TSO No
                            </p>
                            <input
                              type="text"
                              name="tso_no"
                              value={values.tso_no}
                              onChange={(e) =>
                                setFieldValue("tso_no", e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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
                          <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                            J/O Number
                          </p>
                          <input
                            type="text"
                            name="jo_number"
                            value={values.jo_number}
                            onChange={(e) =>
                              setFieldValue("jo_number", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                            placeholder="Enter J/O Number"
                          />
                          <ErrorMessage
                            name="jo_number"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* Job Category - Only for TSO_SERVICE and KANBAN */}
                        {(values.job_type === "TSO_SERVICE" ||
                          values.job_type === "KANBAN") && (
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                              {values.job_type === "KANBAN"
                                ? "Product Category"
                                : "Job Category"}
                            </p>
                            <SelectInput
                              name="job_category"
                              value={values.job_category}
                              setFieldValue={setFieldValue}
                              options={getCategoryOptions(values.job_type)}
                              placeholder={
                                values.job_type === "KANBAN"
                                  ? "Select Product Category"
                                  : "Select TSO Service Category"
                              }
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
                            <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
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
                          <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                            Job Order Date
                          </p>
                          <DatePickerInput
                            name="job_order_date"
                            value={values.job_order_date}
                            setFieldValue={setFieldValue}
                            placeholderText="Select Job Order Date"
                            dateFormat="yyyy-MM-dd"
                          />
                          <ErrorMessage
                            name="job_order_date"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* Material Received Date */}
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                            Material Received Date
                          </p>
                          <DatePickerInput
                            name="mtl_rcd_date"
                            value={values.mtl_rcd_date}
                            setFieldValue={setFieldValue}
                            placeholderText="Select Material Received Date"
                            dateFormat="yyyy-MM-dd"
                          />
                          <ErrorMessage
                            name="mtl_rcd_date"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* Material Challan No */}
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                            Material Challan No
                          </p>
                          <input
                            type="text"
                            name="mtl_challan_no"
                            value={values.mtl_challan_no}
                            onChange={(e) =>
                              setFieldValue("mtl_challan_no", e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                Item Description
                              </p>
                              <input
                                type="text"
                                name="item_description"
                                value={values.item_description}
                                onChange={(e) =>
                                  setFieldValue(
                                    "item_description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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
                                <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                  Item No
                                </p>
                                <input
                                  type="text"
                                  name="item_no"
                                  value={values.item_no}
                                  onChange={(e) =>
                                    setFieldValue("item_no", e.target.value)
                                  }
                                  className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                Quantity
                              </p>
                              <input
                                type="number"
                                name="qty"
                                value={values.qty}
                                onChange={(e) =>
                                  setFieldValue("qty", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                MOC
                              </p>
                              <input
                                type="text"
                                name="moc"
                                value={values.moc}
                                onChange={(e) =>
                                  setFieldValue("moc", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                Bin Location
                              </p>
                              <input
                                type="text"
                                name="bin_location"
                                value={values.bin_location}
                                onChange={(e) =>
                                  setFieldValue("bin_location", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
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

                        {/* Assembly Items - Only for ASSEMBLY type */}
                        {values.sub_type === "ASSEMBLY" && (
                          <>
                            <div className="w-full">
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                Product Item No
                              </p>
                              <input
                                type="text"
                                name="product_item_no"
                                value={values.product_item_no}
                                onChange={(e) =>
                                  setFieldValue("product_item_no", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                placeholder="Enter Product Item No"
                              />
                              <ErrorMessage
                                name="product_item_no"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>
                            <div className="w-full">
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                Product Description
                              </p>
                              <input
                                type="text"
                                name="product_desc"
                                value={values.product_desc}
                                onChange={(e) =>
                                  setFieldValue("product_desc", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                placeholder="Enter Product Description"
                              />
                              <ErrorMessage
                                name="product_desc"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>
                            <div className="w-full">
                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                Product Quantity
                              </p>
                              <input
                                type="number"
                                name="product_qty"
                                value={values.product_qty}
                                onChange={(e) =>
                                  setFieldValue("product_qty", e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                placeholder="Enter Product Quantity"
                              />
                              <ErrorMessage
                                name="product_qty"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                              <FieldArray name="assembly_items">
                                {({ remove, push }) => (
                                  <div className="space-y-6">
                                    {values.assembly_items &&
                                      values.assembly_items.length > 0 &&
                                      values.assembly_items.map((item: any, index: number) => (
                                        <div
                                          key={index}
                                          className="border border-gray-200 p-4 rounded-lg"
                                        >
                                          <div className="flex justify-between items-center mb-4">
                                            <p className="font-semibold text-gray-700">
                                              Item #{index + 1}
                                            </p>
                                            {values.assembly_items.length > 1 && (
                                              <button
                                                type="button"
                                                className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                                onClick={() => remove(index)}
                                                aria-label={`Remove item ${index + 1}`}
                                                title={`Remove item ${index + 1}`}
                                              >
                                                <HiTrash className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="w-full md:col-span-2">
                                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                                Item Description
                                              </p>
                                              <input
                                                type="text"
                                                name={`assembly_items.${index}.item_description`}
                                                value={item.item_description}
                                                onChange={(e) =>
                                                  setFieldValue(
                                                    `assembly_items.${index}.item_description`,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                                placeholder="Enter Item Description"
                                              />
                                              <ErrorMessage
                                                name={`assembly_items.${index}.item_description`}
                                                component="div"
                                                className="text-red-500 text-sm mt-1"
                                              />
                                            </div>
                                            <div className="w-full">
                                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                                Item No
                                              </p>
                                              <input
                                                type="text"
                                                name={`assembly_items.${index}.item_no`}
                                                value={item.item_no}
                                                onChange={(e) =>
                                                  setFieldValue(
                                                    `assembly_items.${index}.item_no`,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                                placeholder="Enter Item No"
                                              />
                                              <ErrorMessage
                                                name={`assembly_items.${index}.item_no`}
                                                component="div"
                                                className="text-red-500 text-sm mt-1"
                                              />
                                            </div>
                                            <div className="w-full">
                                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                                Quantity
                                              </p>
                                              <input
                                                type="number"
                                                name={`assembly_items.${index}.qty`}
                                                value={item.qty}
                                                onChange={(e) =>
                                                  setFieldValue(
                                                    `assembly_items.${index}.qty`,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                                placeholder="Enter Quantity"
                                              />
                                              <ErrorMessage
                                                name={`assembly_items.${index}.qty`}
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
                                                name={`assembly_items.${index}.moc`}
                                                value={item.moc}
                                                onChange={(e) =>
                                                  setFieldValue(
                                                    `assembly_items.${index}.moc`,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                                placeholder="Enter MOC"
                                              />
                                              <ErrorMessage
                                                name={`assembly_items.${index}.moc`}
                                                component="div"
                                                className="text-red-500 text-sm mt-1"
                                              />
                                            </div>
                                            <div className="w-full">
                                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                                Bin Location
                                              </p>
                                              <input
                                                type="text"
                                                name={`assembly_items.${index}.bin_location`}
                                                value={item.bin_location}
                                                onChange={(e) =>
                                                  setFieldValue(
                                                    `assembly_items.${index}.bin_location`,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999]"
                                                placeholder="Enter Bin Location"
                                              />
                                              <ErrorMessage
                                                name={`assembly_items.${index}.bin_location`}
                                                component="div"
                                                className="text-red-500 text-sm mt-1"
                                              />
                                            </div>
                                            <div className="w-full md:col-span-2">
                                              <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                                                Material Remark
                                              </p>
                                              <textarea
                                                name={`assembly_items.${index}.material_remark`}
                                                value={item.material_remark}
                                                onChange={(e) =>
                                                  setFieldValue(
                                                    `assembly_items.${index}.material_remark`,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999] min-h-[100px]"
                                                placeholder="Enter Material Remark (Optional)"
                                              />
                                              <ErrorMessage
                                                name={`assembly_items.${index}.material_remark`}
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
                                          moc: "",
                                          bin_location: "",
                                          material_remark: "",
                                        })
                                      }
                                    >
                                      <FaPlus /> Add Another Item
                                    </button>
                                    <ErrorMessage
                                      name="assembly_items"
                                      component="div"
                                      className="text-red-500 text-sm mt-1"
                                    />
                                  </div>
                                )}
                              </FieldArray>
                            </div>
                          </>
                        )}

                        {/* Material Remark - For non-assembly */}
                        {values.sub_type !== "ASSEMBLY" && (
                          <div className="w-full">
                            <p className="text-[#0A0A0A] font-medium text-sm leading-6 mb-2">
                              Material Remark
                            </p>
                            <textarea
                              name="material_remark"
                              value={values.material_remark}
                              onChange={(e) =>
                                setFieldValue("material_remark", e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-sm leading-6 placeholder:text-[#999999] min-h-[100px]"
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
                          className="py-[13px] px-[26px] bg-primary-600 hover:bg-primary-500 rounded-[4px] w-full md:w-auto text-sm font-medium leading-6 text-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : getSubmitButtonText()}
                        </button>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </>
      </PageGuard>
    </>
  );
}