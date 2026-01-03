"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiFilter } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { HiTrash } from "react-icons/hi";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter } from "next/navigation";
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
  { value: "RAW_MATERIAL", label: "RAW MATERIAL" },
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "FINISHED_GOODS", label: "FINISHED GOODS" },
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
  serial_no: Yup.number()
    .required("Serial No is required")
    .typeError("Serial No must be a number")
    .positive("Serial No must be positive")
    .integer("Serial No must be an integer"),
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
  serial_no: "",
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
  const [flyoutType, setFlyoutType] = useState<
    "JOB_SERVICE" | "TSO_SERVICE" | "KANBAN"
  >("JOB_SERVICE");
  const [data, setData] = useState<any | []>([]);

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

    // Create payload based on job type
    let payload: any = {
      job_type: values.job_type,
      serial_no: Number(values.serial_no),
      job_order_date: formatDate(values.job_order_date),
      mtl_rcd_date: formatDate(values.mtl_rcd_date),
      mtl_challan_no: Number(values.mtl_challan_no),
      item_description: values.item_description,
      item_no: Number(values.item_no),
      qty: Number(values.qty),
      moc: values.moc,
      remark: values.remark || "",
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
    if (flyoutType === "JOB_SERVICE") return "Add Job Service";
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
    fetchData();
  }, []);

  return (
    <>
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
              <div className="flex flex-col md:flex-row justify-end items-center gap-4 mb-6 w-full mx-auto">
                <div className="flex justify-center items-center gap-4">
                  <div
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-blue-600 group hover:bg-blue-500"
                    onClick={openJobServiceFlyout}
                  >
                    <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                    <p className="text-white text-base font-medium group-hover:text-white">
                      Add Job Service
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-green-600 group hover:bg-green-500"
                    onClick={openTsoServiceFlyout}
                  >
                    <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                    <p className="text-white text-base font-medium group-hover:text-white">
                      Add TSO Service
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-purple-600 group hover:bg-purple-500"
                    onClick={openKanbanFlyout}
                  >
                    <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                    <p className="text-white text-base font-medium group-hover:text-white">
                      Add Kanban
                    </p>
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
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
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
                    data.map((item: any) => (
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

                      {/* Job Category - Only for TSO_SERVICE and KANBAN */}
                      {(values.job_type === "TSO_SERVICE" ||
                        values.job_type === "KANBAN") && (
                        <div className="w-full">
                          <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                            Job Category
                          </p>
                          <SelectInput
                            name="job_category"
                            value={values.job_category}
                            setFieldValue={setFieldValue}
                            options={getCategoryOptions(values.job_type)}
                            placeholder={`Select ${
                              values.job_type === "TSO_SERVICE"
                                ? "TSO Service"
                                : "Kanban"
                            } Category`}
                          />
                          <ErrorMessage
                            name="job_category"
                            component="div"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>
                      )}

                      {/* Serial No */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Serial No
                        </p>
                        <input
                          type="number"
                          name="serial_no"
                          value={values.serial_no}
                          onChange={(e) =>
                            setFieldValue("serial_no", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Serial No"
                        />
                        <ErrorMessage
                          name="serial_no"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

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

                      {/* Remark */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Remark
                        </p>
                        <input
                          type="text"
                          name="remark"
                          value={values.remark}
                          onChange={(e) =>
                            setFieldValue("remark", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Remark (Optional)"
                        />
                        <ErrorMessage
                          name="remark"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Material Remark */}
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