"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { IoCloseOutline } from "react-icons/io5";
import { HiTrash } from "react-icons/hi";
import LeftSideBar from "../../component/LeftSideBar";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const axiosProvider = new AxiosProvider();

const initialValues = {
  pr_no: "",
  pr_date: new Date().toISOString().split("T")[0],
  pr_type: "stock",
  pr_type_detail: "stock",
  transaction_category: "",
  site: "",
  priority: "a",
  item_code: "",
  item_desc: "",
  grade: "",
  thickness: "",
  diameter: "",
  length: "",
  width: "",
  across_flat: "",
  center_to_face: "",
  hsn_code: "",
  current_stock: "",
  reorder_qty: "",
  req_qty: "",
  purchase_uom: "",
  req_date: "",
};

const stepSchemas = [
  Yup.object({
    pr_no: Yup.string().notRequired(),
    pr_date: Yup.date().required("PR Date is required"),
    pr_type: Yup.string().required("PR Type is required"),
    pr_type_detail: Yup.string().notRequired(),
    transaction_category: Yup.string().notRequired(),
    site: Yup.string().required("Site is required"),
    priority: Yup.string().required("Priority is required"),
  }),
  Yup.object({
    item_code: Yup.string().required("Item Code is required"),
    item_desc: Yup.string().required("Item Description is required"),
    grade: Yup.string().notRequired(),
    thickness: Yup.number().typeError("Thickness must be a number").nullable(),
    diameter: Yup.number().typeError("Diameter must be a number").nullable(),
    length: Yup.number().typeError("Length must be a number").nullable(),
    width: Yup.number().typeError("Width must be a number").nullable(),
    across_flat: Yup.string().notRequired(),
    center_to_face: Yup.string().notRequired(),
    hsn_code: Yup.string().notRequired(),
  }),
  Yup.object({
    current_stock: Yup.number().typeError("Current Stock must be a number").nullable(),
    reorder_qty: Yup.number().typeError("Reorder Qty must be a number").nullable(),
    req_qty: Yup.number().typeError("Req Qty must be a number").required("Req Qty is required"),
    purchase_uom: Yup.string().required("Purchase UOM is required"),
    req_date: Yup.date().required("Req Date is required"),
  }),
];

const stepTitles = [
  "PR Header",
  "Item Details",
  "Requirement info",
];

export default function MaterialsMasterPage() {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchingField, setSearchingField] = useState<string | null>(null);

  const handleSearchMaterial = async (val: string, field: string) => {
    if (!val || val.length < 2) {
      setSuggestions([]);
      setSearchingField(null);
      return;
    }
    try {
      // Use the inventory3-materials endpoint for searching master records
      const res = await axiosProvider.get(`/fineengg_erp/system/materials?search=${val}`);
      setSuggestions(res?.data?.data || []);
      setSearchingField(field);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSelectMaterial = (material: any, setFieldValue: any) => {
    setFieldValue("item_code", material.unique_item_code || "");
    setFieldValue("item_desc", material.material_desc || "");
    setFieldValue("grade", material.grade || "");
    setFieldValue("thickness", material.thickness || "");
    setFieldValue("diameter", material.diameter || "");
    setFieldValue("length", material.length || "");
    setFieldValue("width", material.width || "");
    setFieldValue("across_flat", material.across_flat || "");
    setFieldValue("center_to_face", material.center_to_face_distance || "");
    setFieldValue("hsn_code", material.hsn_code || "");
    
    if (material.purchase_uom) {
      setFieldValue("purchase_uom", material.purchase_uom);
    }
    
    setSuggestions([]);
    setSearchingField(null);
  };

  const fieldsByStep = useMemo(() => [
    [
      "pr_no", "pr_date", "pr_type", "pr_type_detail", "transaction_category", "site", "priority"
    ],
    [
      "item_code", "item_desc", "grade", "thickness", "diameter", "length", "width",
      "across_flat", "center_to_face", "hsn_code"
    ],
    ["current_stock", "reorder_qty", "req_qty", "purchase_uom", "req_date"],
  ], []);

  const fetchData = async () => {
    try {
      const res = await axiosProvider.get("/fineengg_erp/system/inventory2-pr");
      setData(res?.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load PR data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openFlyout = () => {
    setActiveStep(0);
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    setIsFlyoutOpen(false);
    setActiveStep(0);
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

    if (!result.isConfirmed) return;

    try {
      await axiosProvider.delete(`/fineengg_erp/system/inventory2-pr/${id}`);
      toast.success("Material deleted successfully");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete material");
    }
  };

  const handleSubmit = async (values: any, actions: any) => {
    try {
      const payload = {
        pr_no: values.pr_no,
        pr_date: values.pr_date,
        pr_type: values.pr_type,
        pr_type_detail: values.pr_type_detail || "",
        transaction_category: values.transaction_category || "",
        site: values.site,
        priority: values.priority,
        item_code: values.item_code,
        item_desc: values.item_desc,
        grade: values.grade || "",
        thickness: values.thickness ? Number(values.thickness) : 0,
        diameter: values.diameter ? Number(values.diameter) : 0,
        length: values.length ? Number(values.length) : 0,
        width: values.width ? Number(values.width) : 0,
        hsn_code: values.hsn_code || "",
        across_flat: values.across_flat || "",
        center_to_face_distance: values.center_to_face || "",
        current_stock: values.current_stock ? Number(values.current_stock) : 0,
        reorder_qty: values.reorder_qty ? Number(values.reorder_qty) : 0,
        req_qty: values.req_qty ? Number(values.req_qty) : 0,
        purchase_uom: values.purchase_uom || "",
        req_date: values.req_date || null,
      };

      await axiosProvider.post("/fineengg_erp/system/inventory2-pr", payload);

      toast.success("Material added successfully");
      actions.resetForm();
      closeFlyout();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add material");
    } finally {
      actions.setSubmitting(false);
    }
  };

  const renderStepFields = (
    values: any,
    setFieldValue: any,
    touched: any,
    errors: any
  ) => {
    switch (activeStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">PR No</label>
              <input
                value="Auto-generated"
                className="w-full border rounded px-4 py-3 bg-gray-50"
                placeholder="Auto-generated"
                readOnly
              />
              <ErrorMessage name="pr_no" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">PR Date</label>
              <input
                type="date"
                name="pr_date"
                value={values.pr_date}
                onChange={(e) => setFieldValue("pr_date", e.target.value)}
                className="w-full border rounded px-4 py-3 bg-gray-50"
                readOnly
              />
              <ErrorMessage name="pr_date" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">PR Type</label>
              <select
                name="pr_type"
                value={values.pr_type}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue("pr_type", val);
                  if (val === "stock") {
                    setFieldValue("pr_type_detail", "stock");
                  } else {
                    setFieldValue("pr_type_detail", "");
                  }
                }}
                className="w-full border rounded px-4 py-3"
              >
                <option value="stock">Stock</option>
                <option value="direct">Direct</option>
                <option value="planned">Planned</option>
              </select>
              <ErrorMessage name="pr_type" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">PR Type Detail</label>
              <input
                name="pr_type_detail"
                value={values.pr_type_detail}
                onChange={(e) => setFieldValue("pr_type_detail", e.target.value)}
                className={`w-full border rounded px-4 py-3 ${values.pr_type === "stock" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter PR type detail"
                disabled={values.pr_type === "stock"}
              />
              <ErrorMessage name="pr_type_detail" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Transaction Category</label>
              <input
                name="transaction_category"
                value={values.transaction_category}
                onChange={(e) => setFieldValue("transaction_category", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter category"
              />
              <ErrorMessage name="transaction_category" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Site</label>
              <input
                name="site"
                value={values.site}
                onChange={(e) => setFieldValue("site", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter site name"
              />
              <ErrorMessage name="site" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Priority</label>
              <select
                name="priority"
                value={values.priority}
                onChange={(e) => setFieldValue("priority", e.target.value)}
                className="w-full border rounded px-4 py-3"
              >
                <option value="a">Low</option>
                <option value="b">Medium</option>
                <option value="c">High</option>
              </select>
              <ErrorMessage name="priority" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block mb-2 font-medium">Item Code</label>
              <input
                name="item_code"
                value={values.item_code}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue("item_code", val);
                  handleSearchMaterial(val, "item_code");
                }}
                onBlur={() => setTimeout(() => setSearchingField(null), 200)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter item code"
              />
              {searchingField === "item_code" && (
                <div className="absolute z-50 w-full bg-white border rounded shadow-xl max-h-60 overflow-y-auto mt-1"> {/* Moved to be positioned absolutely */}
                  {suggestions
                    .filter(s => s.unique_item_code.toLowerCase().includes(values.item_code.toLowerCase()))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-3 hover:bg-primary-50 cursor-pointer border-b last:border-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents onBlur from closing dropdown before selection
                          handleSelectMaterial(s, setFieldValue);
                        }}
                      >
                        <p className="font-bold text-sm text-primary-600">{s.unique_item_code}</p>
                        <p className="text-xs text-gray-600 truncate">{s.material_desc}</p>
                      </div>
                    ))}
                </div>
              )}
              <ErrorMessage name="item_code" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="md:col-span-2 relative">
              <label className="block mb-2 font-medium">Item Description</label>
              <textarea
                name="item_desc"
                value={values.item_desc}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue("item_desc", val);
                  handleSearchMaterial(val, "item_desc");
                }}
                onBlur={() => setTimeout(() => setSearchingField(null), 200)}
                className="w-full border rounded px-4 py-3 min-h-[110px]"
                placeholder="Enter item description"
              />
              {searchingField === "item_desc" && (
                <div className="absolute z-50 w-full bg-white border rounded shadow-xl max-h-60 overflow-y-auto mt-1"> {/* Moved to be positioned absolutely */}
                  {suggestions
                    .filter(s => s.material_desc.toLowerCase().includes(values.item_desc.toLowerCase()))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-3 hover:bg-primary-50 cursor-pointer border-b last:border-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents onBlur from closing dropdown before selection
                          handleSelectMaterial(s, setFieldValue);
                        }}
                      >
                        <p className="font-bold text-sm text-primary-600">{s.unique_item_code}</p>
                        <p className="text-xs text-gray-600 truncate">{s.material_desc}</p>
                      </div>
                    ))}
                </div>
              )}
              <ErrorMessage name="item_desc" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Grade</label>
              <input
                name="grade"
                value={values.grade}
                onChange={(e) => setFieldValue("grade", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter grade"
              />
              <ErrorMessage name="grade" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="md:col-span-2 mt-4">
              <p className="font-bold text-gray-700 border-b pb-2 mb-4">Technical Specification</p>
            </div>

            {[
              ["thickness", "Thickness"],
              ["diameter", "Diameter"],
              ["length", "Length"],
              ["width", "Width"],
              ["across_flat", "Across Flat"],
              ["center_to_face", "Center to Face"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block mb-2 font-medium">{label}</label>
                <input
                  type="number"
                  step="0.001"
                  name={key}
                  value={values[key]}
                  onChange={(e) => setFieldValue(key, e.target.value)}
                  className="w-full border rounded px-4 py-3"
                  placeholder="0.00"
                />
                <ErrorMessage name={key} component="div" className="text-red-500 text-sm mt-1" />
              </div>
            ))}

            <div>
              <label className="block mb-2 font-medium">HSN Code</label>
              <input
                name="hsn_code"
                value={values.hsn_code}
                onChange={(e) => setFieldValue("hsn_code", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="hsn_code" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Current Stock</label>
              <input
                type="number"
                name="current_stock"
                value={values.current_stock}
                onChange={(e) => setFieldValue("current_stock", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="current_stock" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Reorder Qty</label>
              <input
                type="number"
                name="reorder_qty"
                value={values.reorder_qty}
                onChange={(e) => setFieldValue("reorder_qty", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="reorder_qty" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Req Qty</label>
              <input
                type="number"
                name="req_qty"
                value={values.req_qty}
                onChange={(e) => setFieldValue("req_qty", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="req_qty" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Purchase UOM</label>
              <input
                name="purchase_uom"
                value={values.purchase_uom}
                onChange={(e) => setFieldValue("purchase_uom", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="e.g. kg"
              />
              <ErrorMessage name="purchase_uom" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Req Date</label>
              <input
                type="date"
                name="req_date"
                value={values.req_date}
                onChange={(e) => setFieldValue("req_date", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="req_date" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Visual Status</label>
              <div className="flex gap-4 p-3 border rounded">
                {["needed", "not needed"].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visual_status"
                      value={option}
                      checked={values.visual_status === option}
                      onChange={() => setFieldValue("visual_status", option)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {touched.visual_status && errors.visual_status && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.visual_status}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">Dimensional Status</label>
              <div className="flex gap-4 p-3 border rounded">
                {["needed", "not needed"].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dimensional_status"
                      value={option}
                      checked={values.dimensional_status === option}
                      onChange={() => setFieldValue("dimensional_status", option)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {touched.dimensional_status && errors.dimensional_status && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.dimensional_status}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">MTC Received</label>
              <div className="flex gap-4 p-3 border rounded"> {/* Changed options to "yes", "no" */}
                {["yes", "no"].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mtc_received"
                      value={option}
                      checked={values.mtc_received === option}
                      onChange={() => setFieldValue("mtc_received", option)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div> {/* End of change */}
              {touched.mtc_received && errors.mtc_received && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.mtc_received}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">Heat No Matched</label>
              <div className="flex gap-4 p-3 border rounded"> {/* Changed options to "yes", "no" */}
                {["yes", "no"].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="heat_no_matched"
                      value={option}
                      checked={values.heat_no_matched === option}
                      onChange={() => setFieldValue("heat_no_matched", option)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div> {/* End of change */}
              {touched.heat_no_matched && errors.heat_no_matched && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.heat_no_matched}
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium">Final Status</label>
              <div className="flex gap-4 p-3 border rounded">
                {["needed", "not needed"].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="final_status"
                      value={option}
                      checked={values.final_status === option}
                      onChange={() => setFieldValue("final_status", option)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {touched.final_status && errors.final_status && (
                <div className="text-red-500 text-sm mt-1">
                  {errors.final_status}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleColumns = useMemo(
    () => [
      "pr_no",
      "pr_date",
      "pr_type",
      "pr_type_detail",
      "transaction_category",
      "site",
      "priority",
      "item_code",
      "item_desc",
      "grade",
      "thickness",
      "diameter",
      "length",
      "width",
      "across_flat",
      "center_to_face_distance",
      "hsn_code",
      "current_stock",
      "reorder_qty",
      "req_qty",
      "purchase_uom",
      "req_date",
    ],
    []
  );

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
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-screen p-4 relative">
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

          <div className="rounded-3xl shadow bg-white px-4 py-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Inventory 2 PR</h2>
              <button
                onClick={openFlyout}
                className="bg-primary-600 text-white px-5 py-3 rounded-md font-medium hover:bg-primary-500"
              >
                Create PR
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border">
                    {visibleColumns.map((col) => (
                      <th key={col} className="p-3 border font-medium whitespace-nowrap">
                        {col.replaceAll("_", " ").toUpperCase()}
                      </th>
                    ))}
                    <th className="p-3 border font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="text-center py-8 border">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="border hover:bg-gray-50">
                        {visibleColumns.map((col) => (
                          <td key={col} className="p-3 border whitespace-nowrap">
                            {typeof item[col] === "boolean"
                              ? item[col]
                                ? "Yes"
                                : "No"
                              : item[col] ?? "N/A"}
                          </td>
                        ))}
                        <td className="p-3 border">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                            title="Delete"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
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
          className="fixed inset-0 bg-black/50 z-[999]"
          onClick={closeFlyout}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-white z-[1000] shadow-2xl transform transition-transform duration-300 ${
          isFlyoutOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={stepSchemas[activeStep]}
          onSubmit={handleSubmit}
          enableReinitialize
          validateOnChange={false}
          validateOnBlur={false}
        >
          {({ values, setFieldValue, validateForm, isSubmitting, touched, errors, setTouched, setErrors }) => (
            <Form className="h-full flex flex-col">
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-primary-600">
                    New Purchase Requisition
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Step {activeStep + 1} of 3 — {stepTitles[activeStep]}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeFlyout}
                  className="border rounded p-2"
                >
                  <IoCloseOutline className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 border-b">
                <div className="flex gap-2">
                  {stepTitles.map((title, index) => (
                    <div
                      key={title}
                      className={`flex-1 h-2 rounded-full ${
                        index <= activeStep ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {renderStepFields(values, setFieldValue, touched, errors)}
              </div>

              <div className="p-6 border-t flex gap-3 justify-between">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={async () => {
                    await setTouched({}, false);
                    setErrors({});

                    setTimeout(() => {
                      setActiveStep((prev) => Math.max(prev - 1, 0));
                    }, 0);
                  }}
                  className="px-5 py-3 rounded-md border disabled:opacity-40"
                >
                  Back
                </button>

                {activeStep < 2 ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const currentStepFields = fieldsByStep[activeStep];
                      const formErrors = await validateForm();
                      const hasError = currentStepFields.some(
                        (field) => Boolean((formErrors as any)[field])
                      );

                      if (!hasError) {
                        await setTouched({}, false);
                        setErrors({});

                        setTimeout(() => {
                          setActiveStep((prev) => prev + 1);
                        }, 0);
                      }else {
                        // Only touch current fields to show errors if validation fails
                        const stepTouched = currentStepFields.reduce(
                          (acc, field) => ({ ...acc, [field]: true }),
                          {}
                        );
                        setTouched(stepTouched, false);
                      }
                    }}
                    className="px-5 py-3 rounded-md bg-primary-600 text-white"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-3 rounded-md bg-primary-600 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Submit PR"}
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
}