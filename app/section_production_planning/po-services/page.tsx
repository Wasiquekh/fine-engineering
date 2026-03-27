"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useCallback } from "react";
import { HiTrash, HiPlus, HiLightningBolt } from "react-icons/hi";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import LeftSideBar from "../../component/LeftSideBar";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";
import { IoCloseOutline } from "react-icons/io5";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import DatePickerInput from "../../component/DatePickerInput";
import { useRouter } from "next/navigation";

const axiosProvider = new AxiosProvider();

const validationSchema = Yup.object().shape({
  po_no: Yup.number().required("PO No is required").typeError("PO No must be a number"),
  po_date: Yup.date().required("PO Date is required").nullable(),
  client_name: Yup.string().required("Client Name is required"),
  assembly_items: Yup.array().of(
    Yup.object().shape({
      pn_no: Yup.number().required("PN No is required").typeError("PN No must be a number"),
      job_no: Yup.string().nullable(),
      assign_to: Yup.string().required("Assign To is required"),
      category: Yup.string().required("Category is required"),
      product_desc: Yup.string().required("Product Description is required"),
      product_qty: Yup.number().required("Product Quantity is required").typeError("Product Quantity must be a number").positive("Product Quantity must be positive"),
      description: Yup.string().required("Description is required"),
      item_no: Yup.number().required("Item No is required").typeError("Item No must be a number"),
      hsn_code: Yup.string().required("HSN Code is required"),
      po_qnty: Yup.number().required("Quantity is required").typeError("Quantity must be a number").positive("Quantity must be positive"),
      moc: Yup.string().required("MOC is required"),
      drg_no: Yup.string().required("Drawing No is required"),
    })
  ).min(1, "At least one assembly item is required."),
});

export default function POServices() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);

  const initialValues = {
    po_no: "",
    po_date: "",
    client_name: "",
    sub_type: "ASSEMBLY",
    assembly_items: [{ 
      pn_no: "",
      job_no: "",
      assign_to: "",
      category: "",
      product_desc: "",
      product_qty: "",
      hsn_code: "",
      description: '', 
      item_no: '', 
      po_qnty: '', 
      moc: '', 
      drg_no: '' 
    }],
  };

  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");

  const fetchData = useCallback(async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/po-services");
      setData(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching PO services:", error);
      toast.error("Failed to load PO services");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        const response = await axiosProvider.delete(`/fineengg_erp/system/po-services/${id}`);
        if (response.data.success) {
          toast.success("PO Service deleted successfully");
          fetchData();
        } else {
          toast.error("Failed to delete PO Service");
        }
      } catch (error: any) {
        console.error("Error deleting PO Service:", error);
        toast.error("Failed to delete PO Service");
      }
    }
  };

  const handleUrgent = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to mark this as Urgent?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#fbbf24",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Mark it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axiosProvider.post(`/fineengg_erp/system/po-services/${id}/urgent`, {});
        if (response.data.success) {
          toast.success("PO Service marked as urgent");
          fetchData();
        } else {
          toast.error("Failed to mark as urgent");
        }
      } catch (error: any) {
        console.error("Error marking PO Service as urgent:", error);
        toast.error("An error occurred");
      }
    }
  };

  const handleSubmit = async (values: any, { resetForm }: any) => {
    const formatDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const commonData = {
      po_no: values.po_no !== "" ? Number(values.po_no) : null,
      po_date: formatDate(values.po_date),
      client_name: values.client_name,
    };

    const bulkPayload = {
      common_data: commonData,
      items: values.assembly_items.map((item: any) => ({
        pn_no: item.pn_no !== "" ? Number(item.pn_no) : null,
        job_no: item.job_no === "" ? null : item.job_no,
        assign_to: item.assign_to,
        category: item.category,
        product_desc: item.product_desc,
        product_qty: Number(item.product_qty),
        hsn_code: item.hsn_code,
        status: "pending",
        reject: false,
        description: item.description,
        item_no: Number(item.item_no),
        po_qnty: Number(item.po_qnty),
        moc: item.moc,
        drg_no: item.drg_no,
      })),
    };

    try {
      const response = await axiosProvider.post("/fineengg_erp/system/po-services/bulk", bulkPayload);
      if (response.data.success) {
        toast.success("PO Service Assembly created successfully");
        setFlyoutOpen(false);
        fetchData();
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to create PO Service Assembly");
      }
    } catch (error: any) {
      console.error("Error creating PO Service Assembly:", error);
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const filteredData = useMemo(() => {
    const filterParam = searchParams.get("filter"); // Re-fetch filterParam here if needed for assign_to
    const filtered = data.filter((item) => {
      // Filter by Assignment (if 'filter' param is a name like 'Ramzaan')
      const assignParam = filterParam ? filterParam.toLowerCase() : null;
      // Assuming "fine", "press_flow", "all" are category filters, not assign_to names
      const isNameFilter = assignParam && !["fine", "press_flow", "all"].includes(assignParam);
      const matchesAssignment = !isNameFilter || (item.assign_to && item.assign_to.toLowerCase() === assignParam);

      // Filter by Client (e.g. Amar Equipment)
      const clientFilter = clientParam ? clientParam.toLowerCase() : null;
      const matchesClient = !clientFilter || (item.client_name && item.client_name.toLowerCase() === clientFilter);

      return matchesAssignment && matchesClient;
    });

    // Logic to show one PO number only once and avoid repeated entries
    const uniqueData: any[] = [];
    const seenPoNos = new Set();

    filtered.forEach((item) => {
      if (item.po_no && !seenPoNos.has(item.po_no)) {
        uniqueData.push(item);
        seenPoNos.add(item.po_no);
      } else if (!item.po_no) {
        uniqueData.push(item); // Keep entries without a PO number
      }
    });

    return uniqueData;
  }, [data, searchParams, clientParam]);

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
            alt="side desgin"
            width={100}
            height={100}
            className="w-full h-full"
          />
        </div>
        <DesktopHeader />

        <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-firstBlack">
              All PO Services
            </h2>
            <button
              onClick={() => setFlyoutOpen(true)}
              className="flex items-center gap-2 py-2 px-4 rounded-[4px] bg-primary-600 text-white group hover:bg-primary-500"
            >
              <HiPlus className="w-5 h-5" />
              <p className="text-base font-medium">Add PO</p>
            </button>
          </div>

          <div className="relative overflow-x-auto sm:rounded-lg">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-[#999999]">
                <tr className="border border-tableBorder">
                  <th scope="col" className="p-3 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        PO No
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        PO Date
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        PN No
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Job No
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Item No
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        MOC
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Drg No
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
                        Quantity
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Category
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-firstBlack text-base leading-normal">
                        Assign To
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-0 border border-tableBorder">
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
                    <td colSpan={12} className="px-4 py-6 text-center border border-tableBorder">
                      <p className="text-[#666666] text-base">No data found</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item: any) => (
                    <tr key={item.id} className="border border-tableBorder bg-white hover:bg-primary-100">
                      <td className="px-2 py-2 border border-tableBorder">
                        <p
                          onClick={() =>
                            router.push(
                              `/section_production_planning/po-services/${encodeURIComponent(item.po_no)}`
                            )
                          }
                          className={`text-base leading-normal cursor-pointer underline ${
                            item.urgent
                              ? "text-red-600 hover:text-red-700"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                        >
                          {item.po_no || "N/A"}
                        </p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.po_date || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.pn_no || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.job_no || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.item_no || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.moc || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.drg_no || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.description || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.po_qnty || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.category || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <p className="text-[#232323] text-base leading-normal">{item.assign_to || "N/A"}</p>
                      </td>
                      <td className="px-2 py-2 border border-tableBorder">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUrgent(item.id)}
                            className={`p-1.5 rounded transition-colors ${item.urgent ? 'bg-yellow-200 text-yellow-700' : 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'}`}
                            title="Mark as Urgent"
                          >
                            <HiLightningBolt className="w-4 h-4" />
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
      </div>
    </div>
      {isFlyoutOpen && (
        <div
          className="min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
          onClick={() => setFlyoutOpen(false)}
        ></div>
      )}
      <div className={`flyout ${isFlyoutOpen ? "open" : ""}`}>
        <div className="w-full min-h-auto">
          <div className="flex justify-between mb-4 sm:mb-6 md:mb-8">
            <p className="text-primary-600 text-[22px] sm:text-[24px] md:text-[26px] font-bold leading-8 sm:leading-9">
              Add PO Service (Assembly)
            </p>
            <IoCloseOutline
              onClick={() => setFlyoutOpen(false)}
              className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
            />
          </div>
          <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6"></div>

          <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isSubmitting, errors }) => (
              <Form>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">PO No</p>
                    <Field
                      type="number"
                      name="po_no"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter PO No"
                    />
                    <ErrorMessage name="po_no" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">PO Date</p>
                    <DatePickerInput
                      name="po_date"
                      value={values.po_date ? new Date(values.po_date) : null}
                      setFieldValue={setFieldValue}
                    />
                    <ErrorMessage name="po_date" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Client</p>
                    <Field
                      as="select"
                      name="client_name"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6"
                    >
                      <option value="">Select Client</option>
                      <option value="Amar Equipment">Amar Equipment</option>
                      <option value="Amar Biosystem">Amar Biosystem</option>
                    </Field>
                    <ErrorMessage name="client_name" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  </div>
                  
                  <FieldArray name="assembly_items">
                        {({ remove, push }) => (
                          <div className="col-span-1 md:col-span-2 space-y-6 mt-4">
                            <p className="text-[#0A0A0A] font-bold text-lg">Assembly Items</p>
                            {values.assembly_items && values.assembly_items.length > 0 &&
                              values.assembly_items.map((item, index) => (
                                <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
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
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">HSN Code</p>
                                      <Field type="text" name={`assembly_items.${index}.hsn_code`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter HSN Code" />
                                      <ErrorMessage name={`assembly_items.${index}.hsn_code`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">PN No</p>
                                      <Field type="number" name={`assembly_items.${index}.pn_no`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter PN No" />
                                      <ErrorMessage name={`assembly_items.${index}.pn_no`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Job No</p>
                                      <Field type="text" name={`assembly_items.${index}.job_no`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Job No" />
                                      <ErrorMessage name={`assembly_items.${index}.job_no`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Category</p>
                                      <Field as="select" name={`assembly_items.${index}.category`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6">
                                        <option value="">Select Category</option>
                                        <option value="FINE">Fine</option>
                                        <option value="PRESS_FLOW">Press Flow</option>
                                      </Field>
                                      <ErrorMessage name={`assembly_items.${index}.category`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Assign To</p>
                                      <Field as="select" name={`assembly_items.${index}.assign_to`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6">
                                        <option value="">Select Assignment</option>
                                        <option value="Riyaaz">Riyaaz</option>
                                        <option value="Ramzaan">Ramzaan</option>
                                      </Field>
                                      <ErrorMessage name={`assembly_items.${index}.assign_to`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Product Description</p>
                                      <Field type="text" name={`assembly_items.${index}.product_desc`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Product Description" />
                                      <ErrorMessage name={`assembly_items.${index}.product_desc`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Product Quantity</p>
                                      <Field type="number" name={`assembly_items.${index}.product_qty`} className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]" placeholder="Enter Product Quantity" />
                                      <ErrorMessage name={`assembly_items.${index}.product_qty`} component="div" className="text-red-500 text-sm mt-1" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                    <div className="w-full md:col-span-2">
                                      <p className="text-[#0A0A0A] font-medium text-sm mb-1">Description</p>
                                      <Field name={`assembly_items.${index}.description`} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary-600" placeholder="Enter Description" />
                                      <ErrorMessage name={`assembly_items.${index}.description`} component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-sm mb-1">Item No</p>
                                      <Field type="number" name={`assembly_items.${index}.item_no`} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary-600" placeholder="Enter Item No" />
                                      <ErrorMessage name={`assembly_items.${index}.item_no`} component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-sm mb-1">Quantity</p>
                                      <Field type="number" name={`assembly_items.${index}.po_qnty`} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary-600" placeholder="Enter Quantity" />
                                      <ErrorMessage name={`assembly_items.${index}.po_qnty`} component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-sm mb-1">MOC</p>
                                      <Field name={`assembly_items.${index}.moc`} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary-600" placeholder="Enter MOC" />
                                      <ErrorMessage name={`assembly_items.${index}.moc`} component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-[#0A0A0A] font-medium text-sm mb-1">Drawing No</p>
                                      <Field name={`assembly_items.${index}.drg_no`} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-primary-600" placeholder="Enter Drawing No" />
                                      <ErrorMessage name={`assembly_items.${index}.drg_no`} component="div" className="text-red-500 text-xs mt-1" />
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                            <button
                              type="button"
                              className="flex items-center gap-2 text-primary-600 font-medium py-2 px-4 border-2 border-dashed border-primary-600 rounded-lg hover:bg-primary-50"
                              onClick={() => push({ pn_no: "", job_no: "", assign_to: "", category: "", product_desc: "", product_qty: "", hsn_code: "", description: '', item_no: '', po_qnty: '', moc: '', drg_no: '' })}
                            >
                              <FaPlus /> Add Another Item
                            </button>
                          {typeof errors.assembly_items === 'string' && (
                            <div className="text-red-500 text-sm mt-1">{errors.assembly_items}</div>
                          )}
                          </div>
                        )}
                      </FieldArray>
                </div>
            
                <div className="mt-8 md:mt-10 w-full flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-[13px] px-[26px] bg-primary-600 hover:bg-primary-500 rounded-[4px] w-full md:w-auto text-base font-medium leading-6 text-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Add PO Service"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
