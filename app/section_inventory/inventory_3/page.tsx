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
  unique_item_code: "",
  pn_no: "",
  material_desc: "",
  grade: "",
  thickness: "",
  diameter: "",
  length: "",
  width: "",
  across_flat: "",
  center_to_face: "",
  hsn_code: "",
  min_stock_level: "",
  max_stock_level: "",
  re_order_qty: "",
  purchase_uom: "",
  issue_production_uom: "",
  por_uom: "",
  conversion_factor: "",
  rack_no: "",
  bin_shelf_location: "",
};

const stepSchemas = [
  Yup.object({
    unique_item_code: Yup.string().required("Unique Item Code is required"),
    pn_no: Yup.string().notRequired(),
    material_desc: Yup.string().notRequired(),
    grade: Yup.string().notRequired(),
    thickness: Yup.number().typeError("Thickness must be a number").nullable(),
    diameter: Yup.number().typeError("Diameter must be a number").nullable(),
    length: Yup.number().typeError("Length must be a number").nullable(),
    width: Yup.number().typeError("Width must be a number").nullable(),
    across_flat: Yup.number().typeError("Across Flat must be a number").nullable(),
    center_to_face: Yup.number().typeError("Center to Face must be a number").nullable(),
    hsn_code: Yup.string().notRequired(),
  }),
  Yup.object({
    purchase_uom: Yup.string().required("Purchase UOM is required"),
    issue_production_uom: Yup.string().required("Issue Production UOM is required"),
    por_uom: Yup.string().required("POR UOM is required"),
    conversion_factor: Yup.number()
      .typeError("Conversion Factor must be a number")
      .required("Conversion Factor is required"),
  }),
  Yup.object({
    rack_no: Yup.string().notRequired(),
    bin_shelf_location: Yup.string().notRequired(),
  }),
  Yup.object({
    min_stock_level: Yup.number()
      .typeError("Min Stock Level must be a number")
      .required("Min Stock Level is required"),
    max_stock_level: Yup.number()
      .typeError("Max Stock Level must be a number")
      .required("Max Stock Level is required"),
    re_order_qty: Yup.number()
      .typeError("Re Order Qty must be a number")
      .required("Re Order Qty is required"),
  }),
];

const stepTitles = [
  "Item Identification",
  "Unit & Conversion",
  "Warehouse & Storage",
  "Inventory Control",
];

export default function MaterialsMasterPage() {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<any[]>([]);

  const fieldsByStep = useMemo(() => [
    [
      "unique_item_code", "pn_no", "material_desc", "grade",
      "thickness", "diameter", "length", "width", "across_flat", "center_to_face", "hsn_code"
    ],
    ["purchase_uom", "issue_production_uom", "por_uom", "conversion_factor"],
    ["rack_no", "bin_shelf_location"],
    ["min_stock_level", "max_stock_level", "re_order_qty"],
  ], []);

  const fetchData = async () => {
    try {
      const res = await axiosProvider.get("/fineengg_erp/system/inventory3-materials");
      setData(res?.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load materials");
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
      await axiosProvider.delete(`/fineengg_erp/system/inventory3-materials/${id}`);
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
        unique_item_code: values.unique_item_code,
        pn_no: values.pn_no,
        material_desc: values.material_desc || "",
        grade: values.grade || "",
        thickness: values.thickness ? Number(values.thickness) : 0,
        diameter: values.diameter ? Number(values.diameter) : 0,
        length: values.length ? Number(values.length) : 0,
        width: values.width ? Number(values.width) : 0,
        across_flat: values.across_flat || "",
        center_to_face_distance: values.center_to_face || "",
        hsn_code: values.hsn_code || "",
        min_stock_level: values.min_stock_level ? Number(values.min_stock_level) : 0,
        max_stock_level: values.max_stock_level ? Number(values.max_stock_level) : 0,
        re_order_qty: values.re_order_qty ? Number(values.re_order_qty) : 0,
        purchase_uom: values.purchase_uom || "",
        issue_production_uom: values.issue_production_uom || "",
        por_uom: values.por_uom || "",
        conversion_factor: values.conversion_factor ? Number(values.conversion_factor) : 0,
        rack_no: values.rack_no || "",
        bin_shelf_location: values.bin_shelf_location || "",
      };

      await axiosProvider.post("/fineengg_erp/system/inventory3-materials", payload);

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
              <label className="block mb-2 font-medium">Unique Item Code</label>
              <input
                name="unique_item_code"
                value={values.unique_item_code}
                onChange={(e) => setFieldValue("unique_item_code", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter unique item code"
              />
              <ErrorMessage name="unique_item_code" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">PN No</label>
              <input
                name="pn_no"
                value={values.pn_no}
                onChange={(e) => setFieldValue("pn_no", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter PN No"
              />
              <ErrorMessage name="pn_no" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">Material Description</label>
              <textarea
                name="material_desc"
                value={values.material_desc}
                onChange={(e) => setFieldValue("material_desc", e.target.value)}
                className="w-full border rounded px-4 py-3 min-h-[110px]"
                placeholder="Enter material description"
              />
              <ErrorMessage name="material_desc" component="div" className="text-red-500 text-sm mt-1" />
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

            <div className="md:col-span-2 mt-2">
              <label className="block mb-2 font-medium">HSN Code</label>
              <input
                name="hsn_code"
                value={values.hsn_code}
                onChange={(e) => setFieldValue("hsn_code", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter HSN code"
              />
              <ErrorMessage name="hsn_code" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block mb-2 font-medium">Issue Production UOM</label>
              <input
                name="issue_production_uom"
                value={values.issue_production_uom}
                onChange={(e) => setFieldValue("issue_production_uom", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="e.g. pcs"
              />
              <ErrorMessage name="issue_production_uom" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">POR UOM</label>
              <input
                name="por_uom"
                value={values.por_uom}
                onChange={(e) => setFieldValue("por_uom", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="e.g. mtrs"
              />
              <ErrorMessage name="por_uom" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium"> 1Conversion Factor</label>
              <input
                type="number"
                step="0.0001"
                name="conversion_factor"
                value={values.conversion_factor}
                onChange={(e) => setFieldValue("conversion_factor", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="1.00"
              />
              <ErrorMessage name="conversion_factor" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Rack No</label>
              <input
                name="rack_no"
                value={values.rack_no}
                onChange={(e) => setFieldValue("rack_no", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter rack no"
              />
              <ErrorMessage name="rack_no" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Bin / Shelf Location</label>
              <input
                name="bin_shelf_location"
                value={values.bin_shelf_location}
                onChange={(e) => setFieldValue("bin_shelf_location", e.target.value)}
                className="w-full border rounded px-4 py-3"
                placeholder="Enter location"
              />
              <ErrorMessage name="bin_shelf_location" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Min Stock Level</label>
              <input
                type="number"
                step="0.01"
                name="min_stock_level"
                value={values.min_stock_level}
                onChange={(e) => setFieldValue("min_stock_level", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="min_stock_level" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Max Stock Level</label>
              <input
                type="number"
                step="0.01"
                name="max_stock_level"
                value={values.max_stock_level}
                onChange={(e) => setFieldValue("max_stock_level", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="max_stock_level" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div>
              <label className="block mb-2 font-medium">Re Order Qty</label>
              <input
                type="number"
                step="0.01"
                name="re_order_qty"
                value={values.re_order_qty}
                onChange={(e) => setFieldValue("re_order_qty", e.target.value)}
                className="w-full border rounded px-4 py-3"
              />
              <ErrorMessage name="re_order_qty" component="div" className="text-red-500 text-sm mt-1" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleColumns = useMemo(
    () => [
      "unique_item_code",
      "pn_no",
      "material_desc",
      "grade",
      "thickness",
      "diameter",
      "length",
      "width",
      "across_flat",
      "center_to_face_distance",
      "hsn_code",
      "min_stock_level",
      "max_stock_level",
      "re_order_qty",
      "purchase_uom",
      "issue_production_uom",
      "por_uom",
      "conversion_factor",
      "rack_no",
      "bin_shelf_location",
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
              <h2 className="text-2xl font-bold text-gray-800">Materials Master</h2>
              <button
                onClick={openFlyout}
                className="bg-primary-600 text-white px-5 py-3 rounded-md font-medium hover:bg-primary-500"
              >
                Add Material
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
                    Add Material
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Step {activeStep + 1} of 4 — {stepTitles[activeStep]}
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

                {activeStep < 3 ? (
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
                    {isSubmitting ? "Saving..." : "Save Material"}
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