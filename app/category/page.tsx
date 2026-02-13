"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiFilter } from "react-icons/fi";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { IoCloseOutline } from "react-icons/io5";
import { RxAvatar } from "react-icons/rx";
import { HiPencil, HiTrash } from "react-icons/hi";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter } from "next/navigation";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { HiChevronDoubleRight } from "react-icons/hi";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import Select from "react-select";
import DesktopHeader from "../component/DesktopHeader";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import SelectInput from "../component/SelectInput";
import DatePickerInput from "../component/DatePickerInput";
import AxiosProvider from "../../provider/AxiosProvider";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

// Options for Job Category
const jobCategoryOptions = [
  { value: "STD", label: "STD" },
  { value: "NON STD", label: "NON STD" },
  { value: "SFR", label: "SFR" },
  { value: "ANFD", label: "ANFD" },
  { value: "SPARES", label: "SPARES" },
  { value: "INTSO", label: "INTSO" },
  { value: "ASO", label: "ASO" },
  { value: "AD", label: "AD" },
  { value: "MD", label: "MD" },
  { value: "TBR", label: "TBR" },
];

// Options for Material Type
const materialTypeOptions = [{ value: "GST", label: "GST" }];

// Validation Schema for Category form
const validationSchema = Yup.object().shape({
  job_no: Yup.string().required("Job No is required"),
  job_category: Yup.string().required("Job Category is required"),
  description: Yup.string()
    .required("Description is required")
    .max(200, "Description cannot exceed 200 characters"),
  material_type: Yup.string().required("Material Type is required"),
  qty: Yup.number()
    .required("Quantity is required")
    .typeError("Quantity must be a number")
    .positive("Quantity must be positive"),
  bar: Yup.string()
    .required("Bar is required"),
  tempp: Yup.string().required("Temperature is required"),
  remark: Yup.string().max(200, "Remark cannot exceed 200 characters"),
  client_name: Yup.string().required("Client Name is required"),
  drawing_recieved_date: Yup.date().required("Drawing Received Date is required").nullable(),
});

// Initial form values for Category
const initialValues = {
  job_no: "",
  job_category: "",
  description: "",
  material_type: "",
  qty: "",
  bar: "",
  tempp: "",
  remark: "",
  client_name: "",
  drawing_recieved_date: null,
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [data, setData] = useState<any | []>([]);
  console.log("DDDDDDDDDDDDDDDD", data);

  const storage = new StorageManager();
  const userID = storage.getUserId();
  const router = useRouter();

  const handleSubmit = async (values: any) => {
    const formatDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const payload = {
      ...values,
      drawing_recieved_date: formatDate(values.drawing_recieved_date),
      user_id: userID,
    };

    try {
      if (isEditMode && editId) {
        // Edit existing category
        const response = await axiosProvider.put(
          `/fineengg_erp/categories/${editId}`,
          payload
        );
        toast.success("Category updated successfully");
      } else {
        // Add new category
        const response = await axiosProvider.post(
          "/fineengg_erp/categories",
          payload
        );
        toast.success("Category added successfully");
      }

      fetchData();
      setFlyoutOpen(false);
      resetFormState();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(
        isEditMode ? "Failed to update category" : "Failed to add category"
      );
    }
  };

  const handleEdit = (item: any) => {
    setIsEditMode(true);
    setEditId(item.id);
    setFlyoutOpen(true);

    // Pre-fill form with existing data
    const editValues = {
      job_no: item.job_no,
      job_category: item.job_category,
      description: item.description,
      material_type: item.material_type,
      qty: item.qty,
      bar: item.bar,
      tempp: item.tempp,
      remark: item.remark || "",
      client_name: item.client_name || "",
      drawing_recieved_date: item.drawing_recieved_date || null,
    };

    // Store these values to populate form when flyout opens
    setEditValues(editValues);
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
        const response = await axiosProvider.delete(
          `/fineengg_erp/categories/${id}`
        );

        if (response.data.success) {
          toast.success("Category deleted successfully");
          fetchData();
        } else {
          toast.error("Failed to delete category");
        }
      } catch (error: any) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  const [editValues, setEditValues] = useState(initialValues);

  const fetchData = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/categories");
      setData(response.data.data);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const resetFormState = () => {
    setIsEditMode(false);
    setEditId(null);
    setEditValues(initialValues);
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
            {/* Active Filters Display */}

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              {/* Search and filter table row */}
              <div className="flex justify-end items-center mb-6 w-full mx-auto">
                <div className="flex justify-center items-center gap-4">
                  <div
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 group hover:bg-primary-500"
                    onClick={() => {
                      resetFormState();
                      setFlyoutOpen(true);
                    }}
                  >
                    <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                    <p className="text-white text-base font-medium group-hover:text-white">
                      Add Category
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
                          Client Name
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Drawing Rec. Date
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Description
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Material Type
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
                          Bar
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Temperature
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
                        colSpan={8}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_no}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_category}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.client_name}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">{item.drawing_recieved_date}</p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">{item.description}</p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.material_type}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.qty}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.bar}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.tempp}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <HiPencil className="w-4 h-4" />
                            </button>
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
          {/* ----------------End table--------------------------- */}

          {/* ------------------- */}
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
                {isEditMode ? "Edit Category" : "Add Category"}
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
              initialValues={isEditMode ? editValues : initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize={true}
            >
              {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
                <Form onSubmit={handleSubmit}>
                  <div className="w-full">
                    {/* Grid container for form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Job No */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Job No
                        </p>
                        <input
                          type="text"
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

                      {/* Job Category */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Job Category
                        </p>
                        <SelectInput
                          name="job_category"
                          value={values.job_category}
                          setFieldValue={setFieldValue}
                          options={jobCategoryOptions}
                          placeholder="Select Job Category"
                        />
                        <ErrorMessage
                          name="job_category"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Client Name */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Client Name
                        </p>
                        <input
                          type="text"
                          name="client_name"
                          value={values.client_name}
                          onChange={(e) => setFieldValue("client_name", e.target.value)}
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter Client Name"
                        />
                        <ErrorMessage
                          name="client_name"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Drawing Received Date */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Drawing Received Date
                        </p>
                        <DatePickerInput
                          name="drawing_recieved_date"
                          value={values.drawing_recieved_date}
                          setFieldValue={setFieldValue}
                          placeholderText="Select Date"
                        />
                        <ErrorMessage
                          name="drawing_recieved_date"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Description */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Description
                        </p>
                        <input
                          type="text"
                          name="description"
                          value={values.description}
                          onChange={(e) =>
                            setFieldValue("description", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter description"
                        />
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Material Type */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Material Type
                        </p>                        
                        <input
                          type="text"
                          name="material_type"
                          value={values.material_type}
                          onChange={(e) =>
                            setFieldValue("material_type", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter description"
                        />
                        <ErrorMessage
                          name="material_type"
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
                          placeholder="Enter quantity"
                        />
                        <ErrorMessage
                          name="qty"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Bar */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Bar
                        </p>
                        <input
                          type="text"
                          name="bar"
                          value={values.bar}
                          onChange={(e) => setFieldValue("bar", e.target.value)}
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter bar"
                        />
                        <ErrorMessage
                          name="bar"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Temperature */}
                      <div className="w-full md:col-span-2">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Temperature
                        </p>
                        <input
                          type="text"
                          name="tempp"
                          value={values.tempp}
                          onChange={(e) =>
                            setFieldValue("tempp", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                          placeholder="Enter temperature (e.g., Room Temperature)"
                        />
                        <ErrorMessage
                          name="tempp"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Remark */}
                      <div className="w-full md:col-span-2">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Remark
                        </p>
                        <textarea
                          name="remark"
                          value={values.remark}
                          onChange={(e) =>
                            setFieldValue("remark", e.target.value)
                          }
                          className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999] min-h-[100px]"
                          placeholder="Enter remark (optional)"
                        />
                        <ErrorMessage
                          name="remark"
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
                        {isSubmitting
                          ? "Submitting..."
                          : isEditMode
                          ? "Update Category"
                          : "Add Category"}
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
