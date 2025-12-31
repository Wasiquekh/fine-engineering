"use client";
import Image from "next/image";
import { useState } from "react";
import { FiFilter } from "react-icons/fi";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { IoCloseOutline } from "react-icons/io5";
import { RxAvatar } from "react-icons/rx";
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

const moduleOptions = [
  { value: "System", label: "System" },
  { value: "User Management", label: "User Management" },
  { value: "Customer", label: "Customer" },
];

// Static data for table
const staticData = [
  {
    id: 1,
    activity: "User logged in",
    userName: "John Doe",
    userUuid: "uuid-0000-001",
    date: "2025-07-25 10:30 AM",
    module: "Auth Module",
    type: "LOGIN",
  },
  {
    id: 2,
    activity: "User created new customer",
    userName: "Jane Smith",
    userUuid: "uuid-0000-002",
    date: "2025-07-25 11:45 AM",
    module: "Customer Management",
    type: "CREATE",
  },
  {
    id: 3,
    activity: "User updated profile",
    userName: "Robert Johnson",
    userUuid: "uuid-0000-003",
    date: "2025-07-25 02:15 PM",
    module: "User Management",
    type: "UPDATE",
  },
  {
    id: 4,
    activity: "User deleted record",
    userName: "Emily Davis",
    userUuid: "uuid-0000-004",
    date: "2025-07-25 03:30 PM",
    module: "System",
    type: "DELETE",
  },
  {
    id: 5,
    activity: "User viewed report",
    userName: "Michael Wilson",
    userUuid: "uuid-0000-005",
    date: "2025-07-25 04:45 PM",
    module: "Reports",
    type: "VIEW",
  },
  {
    id: 6,
    activity: "User logged out",
    userName: "Sarah Brown",
    userUuid: "uuid-0000-006",
    date: "2025-07-25 05:20 PM",
    module: "Auth Module",
    type: "LOGOUT",
  },
  {
    id: 7,
    activity: "User uploaded file",
    userName: "David Miller",
    userUuid: "uuid-0000-007",
    date: "2025-07-25 09:10 AM",
    module: "System",
    type: "UPLOAD",
  },
  {
    id: 8,
    activity: "User downloaded report",
    userName: "Lisa Anderson",
    userUuid: "uuid-0000-008",
    date: "2025-07-25 01:25 PM",
    module: "Reports",
    type: "DOWNLOAD",
  },
  {
    id: 9,
    activity: "User changed settings",
    userName: "James Taylor",
    userUuid: "uuid-0000-009",
    date: "2025-07-25 03:50 PM",
    module: "System",
    type: "UPDATE",
  },
  {
    id: 10,
    activity: "User accessed dashboard",
    userName: "Maria Garcia",
    userUuid: "uuid-0000-010",
    date: "2025-07-25 08:30 AM",
    module: "Dashboard",
    type: "VIEW",
  },
];

// Validation Schema
const validationSchema = Yup.object().shape({
  startDate: Yup.date()
    .nullable()
    .typeError("Please enter a valid date")
    .max(Yup.ref("endDate"), "Start date cannot be after end date"),
  endDate: Yup.date()
    .nullable()
    .typeError("Please enter a valid date")
    .min(Yup.ref("startDate"), "End date cannot be before start date"),
  module: Yup.string().nullable(),
});

// Initial form values
const initialValues = {
  startDate: null as Date | null,
  endDate: null as Date | null,
  module: "",
};

export default function Home() {
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [isFlyoutFilterOpen, setFlyoutFilterOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filteredData, setFilteredData] = useState(staticData);
  const itemsPerPage = 5;
  const storage = new StorageManager();
  const router = useRouter();

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const toggleFlyout = () => setFlyoutOpen(!isFlyoutOpen);
  const toggleFilterFlyout = () => setFlyoutFilterOpen(!isFlyoutFilterOpen);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: any
  ) => {
    console.log("Form values:", values);

    // Apply filters to static data
    let filtered = [...staticData];

    // Filter by module if selected
    if (values.module) {
      filtered = filtered.filter(
        (item) =>
          item.module.toLowerCase().includes(values.module.toLowerCase()) ||
          item.type.toLowerCase().includes(values.module.toLowerCase())
      );
    }

    // Filter by date range if both dates are selected
    if (values.startDate && values.endDate) {
      const startDateStr = format(values.startDate, "yyyy-MM-dd");
      const endDateStr = format(values.endDate, "yyyy-MM-dd");

      filtered = filtered.filter((item) => {
        const itemDateStr = item.date.split(" ")[0]; // Extract date part only
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filtering

    // Show success message
    toast.success("Filters applied successfully!");

    // Close the flyout
    setFlyoutFilterOpen(false);

    setSubmitting(false);
  };

  const handleClearAll = (resetForm: () => void) => {
    resetForm();
    setFilteredData(staticData);
    setCurrentPage(1);
    toast.info("Filters cleared");
  };

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
              <div className="flex justify-end items-center mb-6 w-full mx-auto">
                <div className="flex justify-center items-center gap-4">
                  <div
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 group hover:bg-primary-600"
                    onClick={toggleFilterFlyout}
                  >
                    <FiFilter className="w-4 h-4 text-white group-hover:text-white" />
                    <p className="text-white text-base font-medium group-hover:text-white">
                      Filter
                    </p>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <RxAvatar className="w-6 h-6" />
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Name and User Activity
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <HiOutlineBookOpen className="w-6 h-6" />
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          User&apos;s Name
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineBookOpen className="w-6 h-6" />
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          User&apos;s uuid
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineBookOpen className="w-6 h-6" />
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Date
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineBookOpen className="w-6 h-6" />
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Module
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineBookOpen className="w-6 h-6" />
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Type
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item) => (
                    <tr
                      className="border border-tableBorder bg-white hover:bg-primary-100"
                      key={item.id}
                    >
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">
                          {item.activity}
                        </p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                        <p className="text-[#232323] text-base leading-normal">
                          {item.userName}
                        </p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                        <p className="text-[#232323] text-base leading-normal">
                          {item.userUuid}
                        </p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                        <p className="text-[#232323] text-base leading-normal">
                          {item.date}
                        </p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                        <p className="text-[#232323] text-base leading-normal">
                          {item.module}
                        </p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                        <p className="text-[#232323] text-base leading-normal">
                          {item.type}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* ----------------End table--------------------------- */}

          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div className="flex justify-center items-center my-10 relative">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleLeft className="w-6 h-auto" />
              </button>
              <span className="text-[#717171] text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleRight className="w-6 h-auto" />
              </button>
            </div>
          )}
          {/* ------------------- */}
        </div>
      </div>

      {/* FITLER FLYOUT */}
      <>
        {/* DARK BG SCREEN */}
        {isFlyoutFilterOpen && (
          <div
            className="min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
            onClick={() => setFlyoutFilterOpen(!isFlyoutFilterOpen)}
          ></div>
        )}

        {/* NOW MY FLYOUT */}
        <div className={`flyout ${isFlyoutFilterOpen ? "open" : ""}`}>
          <div className="w-full min-h-auto">
            {/* Header */}
            <div className="flex justify-between mb-4 sm:mb-6 md:mb-8">
              <p className="text-primary-600 text-[22px] sm:text-[24px] md:text-[26px] font-bold leading-8 sm:leading-9">
                User Filter
              </p>
              <IoCloseOutline
                onClick={toggleFilterFlyout}
                className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6"></div>

            {/* FORM */}
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                setFieldValue,
                handleSubmit,
                isSubmitting,
                resetForm,
              }) => (
                <Form onSubmit={handleSubmit}>
                  <div className="w-full">
                    {/* Date Filters */}
                    <div className="w-full flex flex-col md:flex-row gap-4 md:justify-between mb-4 sm:mb-6">
                      {/* Start Date */}
                      <div className="w-full md:w-[49%]">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Start Date
                        </p>

                        <DatePickerInput
                          name="startDate"
                          value={values.startDate}
                          setFieldValue={setFieldValue}
                        />

                        <ErrorMessage name="startDate">
                          {(msg) => (
                            <div className="text-red-500 text-sm mt-1">
                              {msg}
                            </div>
                          )}
                        </ErrorMessage>
                      </div>

                      {/* End Date */}
                      <div className="w-full md:w-[49%]">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          End Date
                        </p>

                        <DatePickerInput
                          name="endDate"
                          value={values.endDate}
                          setFieldValue={setFieldValue}
                        />

                        <ErrorMessage name="endDate">
                          {(msg) => (
                            <div className="text-red-500 text-sm mt-1">
                              {msg}
                            </div>
                          )}
                        </ErrorMessage>
                      </div>
                    </div>
                    {/* Module Select */}
                    {/* Module Select */}
                    <div className="w-full mb-4 sm:mb-6">
                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Module
                      </p>

                      <SelectInput
                        name="module"
                        value={values.module}
                        setFieldValue={setFieldValue}
                        options={moduleOptions}
                        placeholder="Select Module"
                      />

                      <ErrorMessage
                        name="module"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="mt-8 md:mt-10 w-full flex flex-col md:flex-row md:justify-between items-center gap-y-4 md:gap-y-0">
                    <button
                      type="button"
                      onClick={() => handleClearAll(resetForm)}
                      className="py-[13px] px-[26px] border border-[#A3000E] hover:bg-[#FFF0F1] rounded-[4px] w-full md:w-[49%] text-base font-medium leading-6 text-[#A3000E] text-center"
                    >
                      Clear All
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-[13px] px-[26px] bg-primary-600 hover:bg-primary-500 rounded-[4px] w-full md:w-[49%] text-base font-medium leading-6 text-white text-center hover:bg-lightMaroon hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Applying..." : "Filter Now"}
                    </button>
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
