"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { HiTrash, HiPlus } from "react-icons/hi";
import LeftSideBar from "../../component/LeftSideBar";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import Swal from "sweetalert2";
import { IoCloseOutline } from "react-icons/io5";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DatePickerInput from "../../component/DatePickerInput";

const axiosProvider = new AxiosProvider();

const validationSchema = Yup.object().shape({
  po_no: Yup.number().required("PO No is required").typeError("PO No must be a number"),
  po_date: Yup.date().required("PO Date is required").nullable(),
  pn_no: Yup.number().required("PN No is required").typeError("PN No must be a number"),
  client_name: Yup.string().required("Client Name is required"),
  description: Yup.string().required("Description is required"),
  po_qnty: Yup.number().required("Quantity is required").positive("Quantity must be positive").typeError("Quantity must be a number"),
  job_no: Yup.string().nullable(),
  item_no: Yup.number().required("Item No is required").typeError("Item No must be a number"),
  moc: Yup.string().required("MOC is required"),
  drg_no: Yup.string().required("Drawing No is required"),
  assign_to: Yup.string().required("Assign To is required"),
  category: Yup.string().required("Category is required"),
});

export default function POServices() {
  const [data, setData] = useState<any[]>([]);
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);

  const initialValues = {
    po_no: "",
    po_date: "",
    pn_no: "",
    description: "",
    po_qnty: "",
    job_no: "",
    item_no: "",
    moc: "",
    drg_no: "",
    assign_to: "",
    category: "",
    client_name: "",
  };

  const [formInitialValues, setFormInitialValues] = useState(initialValues);

  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");

  const fetchData = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/po-services");
      setData(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching PO services:", error);
      toast.error("Failed to load PO services");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

    const payload = {
      ...values,
      po_date: formatDate(values.po_date),
      po_qnty: values.po_qnty !== "" ? Number(values.po_qnty) : null,
      po_no: values.po_no !== "" ? Number(values.po_no) : null,
      pn_no: values.pn_no !== "" ? Number(values.pn_no) : null,
      item_no: values.item_no !== "" ? Number(values.item_no) : null,
      job_no: values.job_no === "" ? null : values.job_no,
    };

    try {
      const response = await axiosProvider.post("/fineengg_erp/system/po-services", payload);
      if (response.data.success) {
        toast.success("PO Service created successfully");
        setFlyoutOpen(false);
        fetchData();
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to create PO Service");
      }
    } catch (error: any) {
      console.error("Error creating PO Service:", error);
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  const filteredData = useMemo(() => {
    const filterParam = searchParams.get("filter"); // Re-fetch filterParam here if needed for assign_to
    return data.filter((item) => {
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
            <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFormInitialValues(initialValues);
                    setFlyoutOpen(true);
                  }}
                  className="flex items-center gap-2 py-2 px-4 rounded-[4px] bg-primary-600 text-white group hover:bg-primary-500"
                >
                  <HiPlus className="w-5 h-5" />
                  <p className="text-base font-medium">Add PO</p>
                </button>
            </div>
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
                        <p className="text-[#232323] text-base leading-normal">{item.po_no || "N/A"}</p>
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
              Add PO Service
            </p>
            <IoCloseOutline
              onClick={() => setFlyoutOpen(false)}
              className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
            />
          </div>
          <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6"></div>

          <Formik
            initialValues={formInitialValues}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form>
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

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">PN No</p>
                    <Field
                      type="number"
                      name="pn_no"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter PN No"
                    />
                    <ErrorMessage name="pn_no" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Job No</p>
                    <Field
                      type="text"
                      name="job_no"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter Job No"
                    />
                    <ErrorMessage name="job_no" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">DRG No</p>
                    <Field
                      type="text"
                      name="drg_no"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter DRG No"
                    />
                    <ErrorMessage name="drg_no" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Item No</p>
                    <Field
                      type="number"
                      name="item_no"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter Item No"
                    />
                    <ErrorMessage name="item_no" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">MOC</p>
                    <Field
                      type="text"
                      name="moc"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter MOC"
                    />
                    <ErrorMessage name="moc" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Drawing No</p>
                    <Field
                      type="text"
                      name="drg_no"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter Drawing No"
                    />
                    <ErrorMessage name="drg_no" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Category</p>
                    <Field
                      as="select"
                      name="category"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6"
                    >
                      <option value="">Select Category</option>
                      <option value="FINE">Fine</option>
                      <option value="PRESS_FLOW">Press Flow</option>
                    </Field>
                    <ErrorMessage name="category" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Assign To</p>
                    <Field
                      as="select"
                      name="assign_to"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6"
                    >
                      <option value="">Select Assignment</option>
                      <option value="Riyaaz">Riyaaz</option>
                      <option value="Ramzaam">Ramzaam</option>
                    </Field>
                    <ErrorMessage name="assign_to" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Quantity</p>
                    <Field
                      type="number"
                      name="po_qnty"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999]"
                      placeholder="Enter Quantity"
                    />
                    <ErrorMessage name="po_qnty" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="w-full md:col-span-2">
                    <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">Description</p>
                    <Field
                      as="textarea"
                      name="description"
                      className="w-full px-4 py-3 rounded-[4px] border border-[#E7E7E7] focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-transparent text-[#0A0A0A] text-base leading-6 placeholder:text-[#999999] min-h-[100px]"
                      placeholder="Enter Description"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
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
