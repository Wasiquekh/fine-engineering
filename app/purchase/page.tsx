"use client";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef, ChangeEvent } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { MdOutlineSwitchAccount } from "react-icons/md";
import { MdRemoveRedEye } from "react-icons/md";
import { FaMoneyBillWave, FaRegEdit } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FieldArray,
  FieldProps,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import UserActivityLogger from "../../provider/UserActivityLogger";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import { IoWarningOutline } from "react-icons/io5";
import AdvancePaymentModal from "../component/AdvancePaymentModal";

// -----------------------------
// Types (GRN types removed)
// -----------------------------
type VendorRow = {
  id: string;
  company: string;
  vendor: string;
  email_id?: string;
  mobile?: string;
  address?: string | null;
  city?: string;
  state?: string;
  pin_code?: string;
  gstin?: string;
  category?: string;
  shipping_address?: string;
  created_at?: string;
  updated_at?: string;
};

interface PurchaseOrder {
  advance_applied: any;
  bill(bill: any): boolean;
  created_by: string;
  creator?: {
    id: string;
    name: string;
  };
  id: string;
  po_number: string;
  vendor_id: string;
  delivery_address: string | null;
  delivery_phone: string | null;
  notes: string | null;
  purchase_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
  site_issue: string | null;
  items: {
    id: string;
    item: string;
    description: string;
    unit: string;
    hsn_sac: string;
    quantity: number;
    rate: number;
    make?: string | null;
    gst_pct?: number;
  }[];
  vendor: {
    id: string;
    company: string;
    vendor: string;
    bill?: { id: string; bill_number: string };
  };

  signed_po_file?: string | null;
  has_signed_po?: boolean;
  signed_po_url?: string | null;

  deductions?: PODeduction[];
  total_deductions?: number;
  original_subtotal?: number;

  advances?: VendorAdvance[];
  total_advances?: number;
  pending_advances?: number;
  net_payable_after_advances?: number;
}

interface VendorAdvance {
  id: string;
  advance_number: string;
  amount: number;
  remaining_amount: number;
  advance_date: string;
  purpose: string;
  status: "pending" | "adjusted" | "refunded" | "cancelled";
}

interface VendorAdvanceSummary {
  total_advances: number;
  total_amount: number;
  total_remaining: number;
  pending_count: number;
  advances: VendorAdvance[];
}

interface ItemDetail {
  item: string;
  description: string;
  unit: string;
  make: string;
  hsn: string;
  quantity: string;
  rate: string;
  gst: string;
}

interface FormValues {
  user_id: string;
  vendor_id: string;
  delivery: string;
  notes: string;
  purchase_type: string;
  shipping_address?: string;
  shipping_state?: string;
  site_issue?: string | null;
  itemDetails: ItemDetail[];
  deductions?: {
    id?: string | null;
    amount: string;
    description: string;
    grn_id?: string | null;
    _destroy?: boolean;
  }[];
}

type Option = { value: string; label: string; raw?: any };
interface GstOption {
  value: string;
  label: string;
}

interface PODeduction {
  id: string;
  amount: number;
  description: string;
  grn_id?: string | null;
  created_at: string;
}

const PURCHASE_TYPE_OPTIONS = [
  { value: "HVAC", label: "HVAC" },
  { value: "air_conditioning", label: "Air Conditioning" },
];

// -----------------------------
// Constants
// -----------------------------
const RATE_OPTIONS = [
  { label: "No Tax", value: "0" },
  { label: "18% Tax", value: "18" },
];

const initialVendorSearchValues = { vendor_id: "" };
const vendorSearchSchema = Yup.object().shape({
  vendor_id: Yup.string().required("Vendor is required"),
});

// -----------------------------
// Helper function to convert GST string to number
// -----------------------------
const parseGstValue = (gstValue: string): number => {
  if (!gstValue) return 0;
  const num = parseFloat(gstValue);
  return isNaN(num) ? 0 : num;
};

// -----------------------------
// Instances
// -----------------------------
const axiosProvider = new AxiosProvider();
const activityLogger = new UserActivityLogger();

// -----------------------------
// Component
// -----------------------------
export default function Home() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [page, setPage] = useState<number>(1);
  const LIMIT = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedPoForUpload, setSelectedPoForUpload] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRightSideBarFormHidden, setisRightSideBarFormHidden] =
    useState<boolean>(true);
  const [addEstimate, setAddEstimate] = useState<boolean>(false);
  const [editEstimate, setEditEstimate] = useState<PurchaseOrder | null>(null);
  const [searchEstimate, setsearchEstimate] = useState<boolean>(false);
  const [grnOptions, setGrnOptions] = useState<Option[]>([]);
  const DEFAULT_SHIPPING_ADDRESS =
    "Off no.103, 1st floor, Hi Tech Premises Co-Op.Soc.Ltd, Near SCLR Road, Kurla (W)\nMumbai, Maharashtra, India";
  const DEFAULT_SHIPPING_STATE = "Maharashtra";
  const [selectedPOData, setSelectedPOData] = useState<{
    po_number: string;
    items: Array<{
      quantity: number;
      rate: number;
      gst_pct?: number;
    }>;
    deductions?: Array<{ amount: number }>;
    advances?: Array<{ amount: number }>;
    total_advances?: number;
    pending_advances?: number;
  } | null>(null);
  const [filterData, setFilterData] = useState<{ vendor_id?: string }>({});
  const [hasGRNDiscrepancies, setHasGRNDiscrepancies] =
    useState<boolean>(false);
  const [grnDiscrepancies, setGrnDiscrepancies] = useState<any[]>([]);
  const [loadingDiscrepancies, setLoadingDiscrepancies] =
    useState<boolean>(false);
  const [deductionsAlreadyProcessed, setDeductionsAlreadyProcessed] =
    useState<boolean>(false); // FIXED: Added missing state
  const storage = new StorageManager();
  const user_id = storage.getUserId();
  const [vendorOption, setVendorOption] = useState<Option | null>(null);
  const sidebarWidth = searchEstimate ? "md:w-[40%]" : "md:w-[85%]";
  const [discrepanciesMap, setDiscrepanciesMap] = useState<
    Record<string, boolean>
  >({});
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [selectedVendorForAdvance, setSelectedVendorForAdvance] = useState<{
    id: string;
    company: string;
    vendor: string;
  } | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  const addInitialValues = useMemo<FormValues>(() => {
    return {
      user_id,
      vendor_id: "",
      delivery: "",
      notes: "",
      purchase_type: "HVAC",
      shipping_address: DEFAULT_SHIPPING_ADDRESS,
      shipping_state: DEFAULT_SHIPPING_STATE,
      site_issue: "",
      itemDetails: [
        {
          item: "",
          description: "",
          unit: "",
          make: "",
          hsn: "",
          quantity: "",
          rate: "",
          gst: RATE_OPTIONS[0].value,
        },
      ],
    };
  }, [user_id, DEFAULT_SHIPPING_ADDRESS, DEFAULT_SHIPPING_STATE]);

  // -----------------------------
  // UI Toggles
  // -----------------------------
  const toggleSidebar = () => {
    setisRightSideBarFormHidden((v) => !v);
    if (!isRightSideBarFormHidden) {
      setEditEstimate(null);
      setVendorOption(null);
      setAddEstimate(false);
      setsearchEstimate(false);
    } else {
      setAddEstimate(true);
      setEditEstimate(null);
      setsearchEstimate(false);
    }
  };

  const openEditFlyout = (item: PurchaseOrder) => {
    setisRightSideBarFormHidden(false);
    setEditEstimate(item);
    setAddEstimate(false);
    setsearchEstimate(false);
  };

  const openSearchFlyout = () => {
    setisRightSideBarFormHidden(false);
    setEditEstimate(null);
    setAddEstimate(false);
    setsearchEstimate(true);
  };

  // -----------------------------
  // Vendors loader
  // -----------------------------
  const fetchVendors = async (input: string): Promise<Option[]> => {
    try {
      const res = await axiosProvider.get("/listvendors");
      const vendors = res.data?.data?.vendors ?? [];
      const rows: VendorRow[] = vendors;

      return rows
        .filter((v) => {
          const q = (input || "").toLowerCase();
          const hay = `${v.company} ${v.vendor} ${v.email_id ?? ""} ${
            v.mobile ?? ""
          }`.toLowerCase();
          return hay.includes(q);
        })
        .map((v) => ({
          value: v.id,
          label: `${v.company} (${v.vendor})`,
          raw: v,
        }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return [];
    }
  };

  // -----------------------------
  // Data fetch
  // -----------------------------
  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const qs = filterData.vendor_id
        ? `/getallorder?page=${page}&pageSize=${LIMIT}&vendor_id=${encodeURIComponent(
            filterData.vendor_id
          )}`
        : `/getallorder?page=${page}&pageSize=${LIMIT}`;

      const response = await axiosProvider.get(qs);
      const root = response?.data ?? {};

      const list: any[] = root?.data?.data ?? root?.data ?? [];

      let pages =
        root?.data?.pagination?.totalPages ?? root?.totalPages ?? undefined;

      const totalCount =
        root?.data?.pagination?.totalDocs ??
        root?.data?.pagination?.total ??
        root?.total ??
        root?.count ??
        undefined;

      if (!pages && Number.isFinite(totalCount)) {
        pages = Math.max(1, Math.ceil(Number(totalCount) / LIMIT));
      }

      if (pages) {
        setData(Array.isArray(list) ? list : []);
        setTotalPages(pages);
      } else {
        const safeList = Array.isArray(list) ? list : [];
        const computedPages = Math.max(1, Math.ceil(safeList.length / LIMIT));
        const start = (page - 1) * LIMIT;
        const slice = safeList.slice(start, start + LIMIT);

        setData(slice);
        setTotalPages(computedPages);
      }
    } catch (error) {
      setIsError(true);
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterData.vendor_id]);

  const handleAdvancePayment = (item: PurchaseOrder) => {
    if (!item.vendor) {
      toast.error("Vendor information not found");
      return;
    }

    setSelectedVendorForAdvance({
      id: item.vendor.id,
      company: item.vendor.company,
      vendor: item.vendor.vendor,
    });
    setSelectedPOId(item.id);

    const amountWithoutGst = (item.items ?? []).reduce((sum, it) => {
      const q = Number(it?.quantity ?? 0);
      const r = Number(it?.rate ?? 0);
      return sum + (Number.isFinite(q) ? q : 0) * (Number.isFinite(r) ? r : 0);
    }, 0);

    const amountWithGst = (item.items ?? []).reduce((sum, it) => {
      const q = Number(it?.quantity ?? 0);
      const r = Number(it?.rate ?? 0);
      const gst = Number(it?.gst_pct ?? 0);
      const totalWithoutGst =
        (Number.isFinite(q) ? q : 0) * (Number.isFinite(r) ? r : 0);
      return (
        sum + totalWithoutGst * (1 + (Number.isFinite(gst) ? gst : 0) / 100)
      );
    }, 0);

    const totalDeductions =
      item.total_deductions ||
      item.deductions?.reduce((sum, d) => sum + (d.amount || 0), 0) ||
      0;

    setSelectedPOData({
      po_number: item.po_number,
      items: item.items.map((it) => ({
        quantity: it.quantity,
        rate: it.rate,
        gst_pct: it.gst_pct,
      })),
      deductions: item.deductions,
      advances: item.advances,
      total_advances: item.total_advances || 0,
      pending_advances: item.pending_advances || 0,
    });

    setShowAdvanceModal(true);
  };

  const handleAdvanceSuccess = () => {
    fetchData();
  };

  const handlePageChange = (newPage: number) => {
    if (isLoading) return;
    if (!Number.isFinite(totalPages) || totalPages < 1) return;

    const next = Math.min(Math.max(newPage, 1), totalPages);
    if (next === page) return;
    setPage(next);
  };

  useEffect(() => {
    if (totalPages < 1) {
      if (page !== 1) setPage(1);
      return;
    }
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [totalPages]);

  const checkGRNDiscrepancies = async (poId: string) => {
    setLoadingDiscrepancies(true);
    try {
      const res = await axiosProvider.get(
        `/purchase-orders/${poId}/grn-discrepancies`
      );
      const data = res.data?.data;

      setHasGRNDiscrepancies(data?.has_discrepancies || false);
      setGrnDiscrepancies(data?.discrepancies || []);

      if (data?.deductions_processed) {
        setDeductionsAlreadyProcessed(true);
        toast.info("Deductions have already been processed for this PO");
      }

      return data;
    } catch (error) {
      console.error("Error checking GRN discrepancies:", error);
      setHasGRNDiscrepancies(false);
      setGrnDiscrepancies([]);
    } finally {
      setLoadingDiscrepancies(false);
    }
  };

  useEffect(() => {
    if (editEstimate?.id) {
      checkGRNDiscrepancies(editEstimate.id);
    }
  }, [editEstimate]);

  // -----------------------------
  // Edit initial values
  // -----------------------------

  const fetchDiscrepanciesStatus = async (poId: string) => {
    try {
      const res = await axiosProvider.get(
        `/purchase-orders/${poId}/grn-discrepancies`
      );
      setDiscrepanciesMap((prev) => ({
        ...prev,
        [poId]: res.data?.data?.has_discrepancies || false,
      }));
    } catch (error) {
      console.error("Error fetching discrepancies status:", error);
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      data.forEach((po) => {
        if (
          po.id &&
          po.status === "billed" &&
          (!po.deductions || po.deductions.length === 0)
        ) {
          fetchDiscrepanciesStatus(po.id);
        }
      });
    }
  }, [data]);

  const editInitialValues: FormValues = useMemo(() => {
    if (!editEstimate) {
      return {
        user_id,
        vendor_id: "",
        delivery: "",
        notes: "",
        purchase_type: "",
        shipping_address: "",
        shipping_state: "",
        site_issue: "",
        itemDetails: [
          {
            item: "",
            description: "",
            unit: "",
            make: "",
            hsn: "",
            quantity: "",
            rate: "",
            gst: RATE_OPTIONS[0].value,
          },
        ],
        deductions: [],
      };
    }
    const mappedItems = (editEstimate.items || []).map((it) => ({
      item: it.item ?? "",
      description: it.description ?? "",
      unit: it.unit ?? "",
      hsn: it.hsn_sac ?? "",
      quantity: String(it.quantity ?? ""),
      make: it.make ?? "",
      rate: String(it.rate ?? ""),
      gst: it.gst_pct ? String(it.gst_pct) : RATE_OPTIONS[0].value,
    }));
    const mappedDeductions = (editEstimate.deductions || []).map((d) => ({
      id: d.id,
      amount: String(d.amount),
      description: d.description,
      grn_id: d.grn_id,
      _destroy: false,
    }));
    return {
      user_id,
      vendor_id: editEstimate.vendor_id ?? "",
      delivery: editEstimate.delivery_address ?? "",
      notes: editEstimate.notes ?? "",
      purchase_type: editEstimate.purchase_type ?? "",
      shipping_address: (editEstimate as any).shipping_address ?? "",
      shipping_state: (editEstimate as any).shipping_state ?? "",
      site_issue: editEstimate.site_issue ?? "",
      itemDetails: mappedItems.length
        ? mappedItems
        : [
            {
              item: "",
              description: "",
              unit: "",
              make: "",
              hsn: "",
              quantity: "",
              rate: "",
              gst: RATE_OPTIONS[0].value,
            },
          ],
      deductions: mappedDeductions,
    };
  }, [editEstimate, user_id]);

  useEffect(() => {
    if (editEstimate?.vendor) {
      setVendorOption({
        value: editEstimate.vendor.id,
        label: `${editEstimate.vendor.company} (${editEstimate.vendor.vendor})`,
        raw: editEstimate.vendor,
      });
    } else {
      setVendorOption(null);
    }
  }, [editEstimate]);

  // -----------------------------
  // Create form values / schema
  // -----------------------------
  const initialValues: FormValues = {
    user_id,
    vendor_id: "",
    delivery: "",
    notes: "",
    purchase_type: "HVAC",
    shipping_address: "",
    shipping_state: "",
    site_issue: "",
    itemDetails: [
      {
        item: "",
        description: "",
        unit: "",
        make: "",
        hsn: "",
        quantity: "",
        rate: "",
        gst: RATE_OPTIONS[0].value,
      },
    ],
  };

  const validationSchema = Yup.object().shape({
    vendor_id: Yup.string().required("Company (Vendor) is required"),
    delivery: Yup.string().required("Delivery Address is required"),
    purchase_type: Yup.string().required("Purchase Type is required"),
    site_issue: Yup.string().nullable(),
    itemDetails: Yup.array()
      .of(
        Yup.object().shape({
          item: Yup.string().required("Item name is required"),
          description: Yup.string().required("Description is required"),
          unit: Yup.string().required("Unit is required"),
          hsn: Yup.string().required("HSN/SAC is required"),
          quantity: Yup.string().required("Quantity is required"),
          rate: Yup.string().required("Rate is required"),
          gst: Yup.string().required("GST is required"),
          make: Yup.string().required("Make is required"),
        })
      )
      .min(1, "At least one item is required"),
    deductions: Yup.array().of(
      Yup.object().shape({
        id: Yup.string().nullable(),
        amount: Yup.string().required("Deduction amount is required"),
        description: Yup.string().required("Description is required"),
        grn_id: Yup.string().nullable(),
        _destroy: Yup.boolean(),
      })
    ),
  });

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      const payload = {
        vendor_id: values.vendor_id,
        delivery_address: values.delivery || null,
        notes: values.notes || null,
        purchase_type: values.purchase_type,
        shipping_address: values.shipping_address || null,
        shipping_state: values.shipping_state || null,
        site_issue: values.site_issue || null,
        status: "draft" as const,
        items: values.itemDetails.map((i) => ({
          item: i.item,
          description: i.description || "",
          unit: i.unit,
          make: i.make || null,
          hsn_sac: i.hsn || null,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          gst_pct: parseGstValue(i.gst),
        })),
      };

      await axiosProvider.post("/createorder", payload);
      toast.success("Purchase order created");
      resetForm();
      setFilterData({});
      setPage(1);
      fetchData();
      toggleSidebar();
    } catch (error: any) {
      console.error("Error submitting form:", error?.response?.data || error);
      toast.error(error?.response?.data?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    try {
      if (!editEstimate?.id) {
        toast.error("No order selected to update");
        return;
      }

      const items = values.itemDetails.map((item, idx) => {
        const existingItem = editEstimate.items?.[idx];
        return {
          id: existingItem?.id || undefined,
          item: item.item,
          description: item.description || "",
          unit: item.unit,
          make: item.make || null,
          hsn_sac: item.hsn || null,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          gst_pct: parseGstValue(item.gst),
        };
      });

      const deductions = (values.deductions || [])
        .filter((d) => !d._destroy)
        .map((d) => ({
          id: d.id || undefined,
          amount: Number(d.amount),
          description: d.description,
          grn_id: d.grn_id || null,
        }));

      const destroyedDeductions = (values.deductions || [])
        .filter((d) => d._destroy && d.id)
        .map((d) => ({
          id: d.id,
          amount: Number(d.amount),
          description: d.description,
          grn_id: d.grn_id || null,
          _destroy: true,
        }));

      const allDeductions = [...deductions, ...destroyedDeductions];

      const payload = {
        vendor_id: values.vendor_id,
        delivery_address: values.delivery || null,
        notes: values.notes || null,
        purchase_type: values.purchase_type,
        shipping_address: values.shipping_address || null,
        shipping_state: values.shipping_state || null,
        site_issue: values.site_issue || null,
        status: "draft",
        items,
        deductions: allDeductions,
      };

      console.log("Update payload:", payload);

      await axiosProvider.post("/updateorder", {
        id: editEstimate.id,
        ...payload,
      });

      toast.success("Purchase order updated successfully");
      fetchData();
      toggleSidebar();
    } catch (error: any) {
      console.error("Update error details:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update order. Check console for details.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPO = async (po: PurchaseOrder) => {
    try {
      if (!po?.id) return;

      const res = await axiosProvider.axios.get(
        `/purchase-orders/${po.id}/invoice.pdf`,
        {
          responseType: "blob",
        }
      );

      // Check if response is actually a blob
      if (!(res.data instanceof Blob)) {
        throw new Error("Response is not a blob");
      }

      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err: any) {
      console.error("View PO error:", err?.response || err);

      // Handle blob error responses (when backend returns error as blob)
      if (err?.response?.data instanceof Blob) {
        const errorText = await err.response.data.text();
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(
            errorJson.message || "Unable to open Purchase Order invoice"
          );
        } catch {
          toast.error(errorText || "Unable to open Purchase Order invoice");
        }
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to open Purchase Order invoice"
        );
      }
    }
  };

  const handleVendorSearchSubmit = async (values: { vendor_id: string }) => {
    if (!values.vendor_id) {
      toast.error("Select a vendor");
      return;
    }
    setFilterData({ vendor_id: values.vendor_id });
    setPage(1);
    setisRightSideBarFormHidden(true);
  };

  const handleConvertToBill = async (item: any) => {
    try {
      setConvertingId(item.id);

      // Pass empty object as the second argument
      const res = await axiosProvider.post(
        `/po/${item.id}/convert-to-bill`,
        {}
      );

      if (res.data?.data || res.data?.success) {
        await fetchData();
        toast.success("Bill created successfully");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to convert");
    } finally {
      setConvertingId(null);
    }
  };

  const handleUploadSignedPoClick = (po: PurchaseOrder) => {
    if (!po?.id) return;

    setSelectedPoForUpload(po.id);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    fileInputRef.current?.click();
  };

  const handleSignedPoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPoForUpload) {
      return;
    }

    try {
      setUploadingId(selectedPoForUpload);

      const formData = new FormData();
      formData.append("signed_po", file);

      // Fix: Use the axios instance directly and set headers properly
      await axiosProvider.post(
        `/purchase-orders/${selectedPoForUpload}/upload-signed`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          } as any, // Type assertion to bypass the type check
        }
      );

      toast.success("Signed PO uploaded successfully");
      await fetchData();
    } catch (error: any) {
      console.error("Upload signed PO error:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload signed PO"
      );
    } finally {
      setUploadingId(null);
      setSelectedPoForUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fetchGRNsForPO = async (poId: string) => {
    try {
      const res = await axiosProvider.get(`/purchase-orders/${poId}/grns`);
      const grns = res.data?.data || [];

      const options = grns.map((grn: any) => ({
        value: grn.id,
        label: `${grn.code} (${new Date(grn.created_at).toLocaleDateString()})`,
        raw: grn,
      }));

      setGrnOptions(options);
    } catch (error) {
      console.error("Error fetching GRNs:", error);
    }
  };

  useEffect(() => {
    if (editEstimate?.id) {
      fetchGRNsForPO(editEstimate.id);
    }
  }, [editEstimate]);

  const handleViewSignedPo = (po: PurchaseOrder) => {
    if (!po.signed_po_url) {
      toast.error("No signed PO uploaded yet");
      return;
    }
    window.open(po.signed_po_url, "_blank");
  };

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center">
        <Image
          src="/images/compress-logo.svg"
          alt="Table image"
          width={500}
          height={500}
          style={{ width: "300px", height: "auto" }}
          className="animate-pulse rounded"
        />
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
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

        <div className="w-full bg-[#F5F7FA] flex justify-center p-0 md:p-0">
          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative min-h-[600px] z-10 w-full">
            <div className="relative overflow-x-auto sm:rounded-lg">
              <div className="flex justify-end items-center mb-6 w-full mx-auto">
                <div className="flex justify-between items-center gap-4 w-full">
                  <p className="text-xl font-semibold">All Purchase Orders</p>
                  <div
                    className="flex items-center gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-500 group hover:bg-primary-600"
                    onClick={toggleSidebar}
                  >
                    <MdOutlineSwitchAccount className="w-4 h-4 text-white" />
                    <p className="text-white text-base font-medium">
                      Add Purchase Order
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto sm:rounded-[12px]">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    <th className="p-2 py-0 border border-tableBorder">
                      <div className="flex items-center gap-2 p-3">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Sr.
                        </div>
                      </div>
                    </th>
                    <th className="p-2 py-0 border border-tableBorder">
                      <div className="flex items-center gap-2 p-3">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          PO No
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Vendor / Company
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Amount
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Amount(Incl.GST)
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          After Deductions
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Created By
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Creation Date
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Advance
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-0 border border-tableBorder hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Action
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isError ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10">
                        Not able to fetch data. Please try again later.
                      </td>
                    </tr>
                  ) : Array.isArray(data) && data.length > 0 ? (
                    data.map((item, index) => {
                      const amountWithoutGst = (item.items ?? []).reduce(
                        (sum, it) => {
                          const q = Number(it?.quantity ?? 0);
                          const r = Number(it?.rate ?? 0);
                          return (
                            sum +
                            (Number.isFinite(q) ? q : 0) *
                              (Number.isFinite(r) ? r : 0)
                          );
                        },
                        0
                      );

                      const amountWithGst = (item.items ?? []).reduce(
                        (sum, it) => {
                          const q = Number(it?.quantity ?? 0);
                          const r = Number(it?.rate ?? 0);
                          const gst = Number(it?.gst_pct ?? 0);
                          const totalWithoutGst =
                            (Number.isFinite(q) ? q : 0) *
                            (Number.isFinite(r) ? r : 0);
                          return (
                            sum +
                            totalWithoutGst *
                              (1 + (Number.isFinite(gst) ? gst : 0) / 100)
                          );
                        },
                        0
                      );

                      const hasDeductions =
                        item.deductions && item.deductions.length > 0;
                      const hasDiscrepancies =
                        discrepanciesMap[item.id] === true;
                      const totalDeductions =
                        item.total_deductions ||
                        item.deductions?.reduce(
                          (sum, d) => sum + (d.amount || 0),
                          0
                        ) ||
                        0;

                      const afterDeductionAmount =
                        amountWithGst - totalDeductions;

                      let amountColor = "text-[#232323]";
                      let statusText = "";

                      if (hasDiscrepancies && !hasDeductions) {
                        amountColor = "text-yellow-600";
                        statusText = "Pending";
                      } else if (hasDeductions) {
                        amountColor = "text-green-600";
                        statusText = "Deducted";
                      }

                      return (
                        <tr
                          key={index}
                          className="border border-tableBorder bg-white hover:bg-primary-100"
                        >
                          <td className="p-4 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">
                              {(page - 1) * LIMIT + (index + 1)}
                            </p>
                          </td>
                          <td className="p-4 border border-tableBorder">
                            <div className="flex items-center gap-2">
                              <p className="text-[#232323] text-base leading-normal">
                                {item.po_number}
                              </p>
                              {hasDiscrepancies && !hasDeductions && (
                                <div className="relative group">
                                  <IoWarningOutline className="text-red-500 w-5 h-5 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                                    GRN discrepancies found - deductions pending
                                  </div>
                                </div>
                              )}
                              {hasDeductions && (
                                <div className="relative group">
                                  <IoWarningOutline className="text-green-500 w-5 h-5 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                                    {item.deductions?.length} deduction
                                    {item.deductions?.length > 1 ? "s" : ""}{" "}
                                    applied
                                    {totalDeductions > 0 &&
                                      ` (₹${Intl.NumberFormat("en-IN").format(
                                        totalDeductions
                                      )})`}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-4 border border-tableBorder">
                            <div>
                              <p className="text-[#232323] text-base leading-normal font-medium">
                                {item.vendor?.company || "N/A"}
                              </p>
                              <p className="text-[#666] text-sm leading-normal">
                                {item.vendor?.vendor || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-4 border border-tableBorder hidden md:table-cell">
                            <p className="text-[#232323] text-base leading-normal">
                              {Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                              }).format(amountWithoutGst)}
                            </p>
                          </td>
                          <td className="px-2 py-4 border border-tableBorder hidden md:table-cell">
                            <p className="text-[#232323] text-base leading-normal font-medium">
                              {Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                              }).format(amountWithGst)}
                            </p>
                          </td>
                          <td className="px-2 py-4 border border-tableBorder hidden md:table-cell">
                            {hasDiscrepancies || hasDeductions ? (
                              <div className="flex flex-col">
                                <p
                                  className={`${amountColor} text-base leading-normal font-medium`}
                                >
                                  {Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                  }).format(
                                    hasDeductions
                                      ? afterDeductionAmount
                                      : amountWithGst
                                  )}
                                  {statusText && (
                                    <span
                                      className={`ml-1 text-xs ${amountColor}`}
                                    >
                                      ({statusText})
                                    </span>
                                  )}
                                </p>
                                {hasDeductions && (
                                  <p className="text-xs text-gray-500 line-through">
                                    {Intl.NumberFormat("en-IN", {
                                      style: "currency",
                                      currency: "INR",
                                    }).format(amountWithGst)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[#999999] text-sm italic">
                                No Deduction
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-4 border border-tableBorder hidden md:table-cell">
                            <p className="text-[#232323] text-base leading-normal">
                              {item.creator?.name || "N/A"}
                            </p>
                          </td>
                          <td className="px-2 py-4 border border-tableBorder hidden md:table-cell">
                            <p className="text-[#232323] text-base leading-normal">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "N/A"}
                            </p>
                          </td>
                          <td className="px-2 py-4 border border-tableBorder">
                            {item.advances ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-purple-600 font-semibold">
                                    ₹
                                    {Intl.NumberFormat("en-IN").format(
                                      item.total_advances || 0
                                    )}
                                  </span>
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                    {item.advances?.length || 0}
                                  </span>
                                </div>
                                {item.pending_advances &&
                                item.pending_advances > 0 ? (
                                  <span className="text-xs text-orange-600">
                                    Pending: ₹
                                    {Intl.NumberFormat("en-IN").format(
                                      item.pending_advances
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-xs text-green-600">
                                    Fully Adjusted
                                  </span>
                                )}
                                <div className="relative group">
                                  <span className="text-xs text-blue-600 cursor-help mt-1 inline-block">
                                    View Details ▼
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                                    {item.advances?.map(
                                      (adv: any, idx: number) => (
                                        <div
                                          key={adv.id}
                                          className="mb-2 last:mb-0 border-b border-gray-600 last:border-0 pb-1 last:pb-0"
                                        >
                                          <div className="font-semibold">
                                            {adv.advance_number}
                                          </div>
                                          <div className="flex justify-between mt-1">
                                            <span>Amount: </span>
                                            <span>
                                              ₹
                                              {Intl.NumberFormat(
                                                "en-IN"
                                              ).format(adv.amount)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Remaining: </span>
                                            <span>
                                              ₹
                                              {Intl.NumberFormat(
                                                "en-IN"
                                              ).format(
                                                adv.remaining_amount || 0
                                              )}
                                            </span>
                                          </div>
                                          <div className="text-gray-300 mt-1">
                                            {new Date(
                                              adv.advance_date
                                            ).toLocaleDateString()}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No advance
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-4 border border-tableBorder">
                            <div className="flex gap-1 md:gap-2 justify-center md:justify-start">
                              <button
                                onClick={() => handleViewPO(item)}
                                className="py-2 px-3 bg-primary-600 hover:bg-primary-800 group flex gap-1 items-center rounded-xl text-xs md:text-sm"
                              >
                                <MdRemoveRedEye className="text-white w-4 h-4" />
                                <p className="text-white hidden md:block">
                                  View PO
                                </p>
                              </button>

                              <button
                                onClick={() => openEditFlyout(item)}
                                className="py-[4px] px-3 bg-yellow-400 flex gap-1 items-center rounded-full text-xs md:text-sm group hover:bg-yellow-500"
                              >
                                <FaRegEdit className="text-white w-4 h-4" />
                                <p className="text-white hidden md:block">
                                  Edit
                                </p>
                              </button>

                              <button
                                onClick={() => {
                                  if (item.signed_po_url) {
                                    window.open(item.signed_po_url, "_blank");
                                  } else {
                                    handleUploadSignedPoClick(item);
                                  }
                                }}
                                disabled={uploadingId === item.id}
                                className={`py-[4px] px-3 flex gap-1 items-center rounded-xl text-xs md:text-sm group ${
                                  uploadingId === item.id
                                    ? "bg-yellow-300 cursor-not-allowed"
                                    : item.signed_po_url
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-yellow-400 hover:bg-yellow-500"
                                }`}
                              >
                                <p className="text-white hidden md:block">
                                  {uploadingId === item.id
                                    ? "Uploading…"
                                    : item.signed_po_url
                                    ? "View PDF"
                                    : "Upload PO"}
                                </p>
                              </button>

                              {item.status === "billed" &&
                                (!item.advances ||
                                  item.advances?.length === 0) && (
                                  <button
                                    onClick={() => handleAdvancePayment(item)}
                                    className="py-[4px] px-3 bg-purple-600 flex gap-1 items-center rounded-xl text-xs md:text-sm group hover:bg-purple-700"
                                    title="Record Advance Payment"
                                  >
                                    <FaMoneyBillWave className="text-white w-4 h-4" />
                                    <p className="text-white hidden md:block">
                                      Advance
                                    </p>
                                  </button>
                                )}

                              {item.signed_po_url && (
                                <button
                                  onClick={() => handleConvertToBill(item)}
                                  disabled={
                                    convertingId === item.id ||
                                    item.status === "billed" ||
                                    Boolean((item as any)?.bill?.id)
                                  }
                                  className={`py-2 px-3 rounded-xl text-xs md:text-sm text-white
                                                                        ${
                                                                          convertingId ===
                                                                            item.id ||
                                                                          item.status ===
                                                                            "billed" ||
                                                                          (
                                                                            item as any
                                                                          )
                                                                            ?.bill
                                                                            ?.id
                                                                            ? "bg-green-600 cursor-not-allowed"
                                                                            : "bg-red-600 hover:bg-red-700"
                                                                        }`}
                                >
                                  {convertingId === item.id
                                    ? "Converting…"
                                    : item.status === "billed" ||
                                      (item as any)?.bill?.id
                                    ? "Order Placed"
                                    : "Convert to Bill"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center text-gray-500 py-4"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center my-10 relative">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={isLoading || page <= 1 || totalPages <= 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleLeft className="w-6 h-auto" />
              </button>

              <span className="text-[#717171] text-sm">
                Page {Math.max(1, page)} of {Math.max(1, totalPages || 1)}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={isLoading || page >= totalPages || totalPages <= 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleRight className="w-6 h-auto" />
              </button>
            </div>

            {/* Hidden file input for signed PO upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleSignedPoFileChange}
            />
          </div>
        </div>

        {/* DARK BG */}
        {!isRightSideBarFormHidden && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleSidebar}
          />
        )}

        {/* Right Sidebar */}
        <div
          className={`fixed top-0 right-0 h-screen w-full ${sidebarWidth} z-50 bg-white transform transition-all duration-300 ease-in-out overflow-y-auto
                        scrollbar-thin scrollbar-thumb-[#78d75a] scrollbar-track-gray-100 ${
                          isRightSideBarFormHidden
                            ? "translate-x-full"
                            : "translate-x-0"
                        }`}
        >
          {/* Add Form */}
          {addEstimate && (
            <div className="w-full min-h-auto p-6">
              <div className="flex justify-between mb-4 sm:mb-6 md:mb-8">
                <p className="text-primary-500 text-[22px] sm:text-[24px] md:text-[26px] font-bold leading-8 sm:leading-9">
                  Add Purchase Order
                </p>
                <IoCloseOutline
                  onClick={toggleSidebar}
                  className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6" />
              <div className="w-full mx-auto p-0">
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({
                    values,
                    setFieldValue,
                    setFieldTouched,
                    isSubmitting,
                  }) => (
                    <Form>
                      <Field type="hidden" name="user_id" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Vendor */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Company Name(Vendor)
                          </p>
                          <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={fetchVendors}
                            value={vendorOption}
                            onChange={(opt: Option | null) => {
                              setVendorOption(opt);
                              setFieldValue("vendor_id", opt?.value || "");
                              setFieldTouched("vendor_id", true);

                              if (opt?.raw?.address) {
                                setFieldValue("delivery", opt.raw.address);
                                setFieldTouched("delivery", true);
                              }

                              if (opt) {
                                setFieldValue(
                                  "shipping_address",
                                  DEFAULT_SHIPPING_ADDRESS
                                );
                                setFieldValue(
                                  "shipping_state",
                                  DEFAULT_SHIPPING_STATE
                                );
                                setFieldTouched("shipping_address", true);
                                setFieldTouched("shipping_state", true);
                              } else {
                                setFieldValue("shipping_address", "");
                                setFieldValue("shipping_state", "");
                                setFieldTouched("shipping_address", false);
                                setFieldTouched("shipping_state", false);
                              }
                            }}
                            onBlur={() => setFieldTouched("vendor_id", true)}
                            placeholder="Search vendor by company / name / email / phone"
                            isClearable
                            classNamePrefix="react-select"
                            classNames={{
                              control: ({ isFocused }) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-[#DFEAF2]"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: "4px",
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                backgroundColor: "#fff",
                                zIndex: 50,
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-500)"
                                  : isFocused
                                  ? "var(--primary-100)"
                                  : "#fff",
                                color: isSelected ? "#fff" : "#333",
                                cursor: "pointer",
                              }),
                            }}
                          />
                          <ErrorMessage
                            name="vendor_id"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Delivery */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Address
                          </p>
                          <CreatableSelect
                            value={
                              values.delivery
                                ? {
                                    value: values.delivery,
                                    label: values.delivery,
                                  }
                                : null
                            }
                            onChange={(opt: Option | null) => {
                              setFieldValue("delivery", opt?.value || "");
                              setFieldTouched("delivery", true);
                            }}
                            onCreateOption={(inputValue: string) => {
                              setFieldValue("delivery", inputValue);
                              setFieldTouched("delivery", true);
                            }}
                            placeholder="Select or type a new address"
                            isClearable
                            classNamePrefix="react-select"
                            classNames={{
                              control: ({ isFocused }) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-[#DFEAF2]"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: "4px",
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                backgroundColor: "#fff",
                                zIndex: 50,
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-500)"
                                  : isFocused
                                  ? "var(--primary-100)"
                                  : "#fff",
                                color: isSelected ? "#fff" : "#333",
                                cursor: "pointer",
                              }),
                            }}
                            options={
                              values.vendor_id && values.delivery
                                ? [
                                    {
                                      value: values.delivery,
                                      label: values.delivery,
                                    },
                                  ]
                                : []
                            }
                          />
                          <ErrorMessage
                            name="delivery"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="pt-4 pb-4">
                        <h1 className="text-center bg-gray-200 py-2 my-3 rounded">
                          Item & Description
                        </h1>
                      </div>

                      <FieldArray name="itemDetails">
                        {({ push, remove }) => (
                          <div className="flex flex-col space-y-4 mb-6">
                            {values.itemDetails.map((_, idx) => {
                              const base = `itemDetails.${idx}`;
                              const isFirst = idx === 0;

                              return (
                                <div
                                  key={idx}
                                  className="flex flex-wrap items-end gap-3 w-full border-b border-gray-200 pb-4"
                                >
                                  {/* Item Name */}
                                  <div className="w-full sm:w-[150px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Item Name
                                    </p>
                                    <Field
                                      name={`${base}.item`}
                                      placeholder="Item name"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.item`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Item Description */}
                                  <div className="w-full sm:w-[300px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Description
                                    </p>
                                    <Field
                                      name={`${base}.description`}
                                      placeholder="Item description"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.description`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Make / Brand */}
                                  <div className="w-full sm:w-[120px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Make / Brand
                                    </p>
                                    <Field
                                      name={`${base}.make`}
                                      placeholder="Make / Brand"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.make`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* HSN/SAC */}
                                  <div className="w-full sm:w-[100px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      HSN / SAC
                                    </p>
                                    <Field
                                      name={`${base}.hsn`}
                                      placeholder="HSN/SAC"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.hsn`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Unit */}
                                  <div className="w-full sm:w-[80px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Unit
                                    </p>
                                    <Field
                                      name={`${base}.unit`}
                                      placeholder="Unit"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.unit`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Quantity */}
                                  <div className="w-full sm:w-[60px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Quantity
                                    </p>
                                    <Field
                                      name={`${base}.quantity`}
                                      placeholder="Qty"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.quantity`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Rate */}
                                  <div className="w-full sm:w-[80px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Rate
                                    </p>
                                    <Field
                                      name={`${base}.rate`}
                                      placeholder="Rate"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.rate`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* GST */}
                                  <div className="w-full sm:w-[120px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      GST
                                    </p>
                                    <Field name={`${base}.gst`}>
                                      {({
                                        field,
                                        form,
                                      }: FieldProps<string>) => {
                                        const options: GstOption[] =
                                          RATE_OPTIONS;
                                        const selectedOption =
                                          options.find(
                                            (opt) => opt.value === field.value
                                          ) ?? null;

                                        return (
                                          <Select<GstOption, false>
                                            value={selectedOption}
                                            onChange={(option) =>
                                              form.setFieldValue(
                                                field.name,
                                                (option as GstOption | null)
                                                  ?.value ?? ""
                                              )
                                            }
                                            onBlur={() =>
                                              form.setFieldTouched(
                                                field.name,
                                                true
                                              )
                                            }
                                            options={options}
                                            placeholder="Select GST"
                                            isClearable
                                            classNames={{
                                              control: ({ isFocused }) =>
                                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                                  isFocused
                                                    ? "!border-primary-500"
                                                    : "!border-[#DFEAF2]"
                                                }`,
                                            }}
                                            styles={{
                                              menu: (base) => ({
                                                ...base,
                                                borderRadius: "4px",
                                                boxShadow:
                                                  "0px 4px 10px rgba(0,0,0,0.1)",
                                                backgroundColor: "#fff",
                                                zIndex: 50,
                                              }),
                                              option: (
                                                base,
                                                { isFocused, isSelected }
                                              ) => ({
                                                ...base,
                                                backgroundColor: isSelected
                                                  ? "var(--primary-500)"
                                                  : isFocused
                                                  ? "var(--primary-100)"
                                                  : "#fff",
                                                color: isSelected
                                                  ? "#fff"
                                                  : "#333",
                                                cursor: "pointer",
                                              }),
                                            }}
                                          />
                                        );
                                      }}
                                    </Field>
                                    <ErrorMessage
                                      name={`${base}.gst`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Add/Remove Buttons */}
                                  <div className="w-full sm:w-auto">
                                    <div className="flex gap-2">
                                      {isFirst ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            push({
                                              item: "",
                                              description: "",
                                              unit: "",
                                              make: "",
                                              hsn: "",
                                              quantity: "",
                                              rate: "",
                                              gst: RATE_OPTIONS[0].value,
                                            })
                                          }
                                          className="h-[50px] w-full sm:w-[92px] px-4 bg-[#4AB82A] rounded hover:bg-[#35931d] text-white"
                                        >
                                          Add
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => remove(idx)}
                                          className="h-[50px] w-full sm:w-auto px-4 bg-red-500 rounded hover:bg-red-600 text-white"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </FieldArray>

                      {/* Purchase Type + Shipping State + Site Issue */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Purchase Type */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Purchase Type
                          </p>
                          <Field name="purchase_type">
                            {({ field, form }: FieldProps<string>) => {
                              const selectedOption =
                                PURCHASE_TYPE_OPTIONS.find(
                                  (opt) => opt.value === field.value
                                ) ?? null;

                              return (
                                <Select
                                  value={selectedOption}
                                  onChange={(option) =>
                                    form.setFieldValue(
                                      field.name,
                                      (option as any)?.value ?? ""
                                    )
                                  }
                                  onBlur={() =>
                                    form.setFieldTouched(field.name, true)
                                  }
                                  options={PURCHASE_TYPE_OPTIONS}
                                  placeholder="Select Purchase Type"
                                  isClearable
                                  classNames={{
                                    control: ({ isFocused }) =>
                                      `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                        isFocused
                                          ? "!border-primary-500"
                                          : "!border-[#DFEAF2]"
                                      }`,
                                  }}
                                  styles={{
                                    menu: (base) => ({
                                      ...base,
                                      borderRadius: "4px",
                                      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                      backgroundColor: "#fff",
                                      zIndex: 50,
                                    }),
                                    option: (
                                      base,
                                      { isFocused, isSelected }
                                    ) => ({
                                      ...base,
                                      backgroundColor: isSelected
                                        ? "var(--primary-500)"
                                        : isFocused
                                        ? "var(--primary-100)"
                                        : "#fff",
                                      color: isSelected ? "#fff" : "#333",
                                      cursor: "pointer",
                                    }),
                                  }}
                                />
                              );
                            }}
                          </Field>
                          <ErrorMessage
                            name="purchase_type"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Shipping State */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Shipping State
                          </p>
                          <Field
                            name="shipping_state"
                            placeholder="Enter Shipping State"
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                          />
                          <ErrorMessage
                            name="shipping_state"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Site Issue Field */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Issuing Site
                          </p>
                          <Field
                            name="site_issue"
                            placeholder="Enter site issue description"
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                          />
                          <ErrorMessage
                            name="site_issue"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      {/* Notes and Shipping Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {/* Shipping Address */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Shipping Address
                          </p>
                          <Field
                            as="textarea"
                            name="shipping_address"
                            placeholder="Shipping address (optional)"
                            rows={4}
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full min-h-[120px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] p-4 text-firstBlack resize-y"
                          />
                          <ErrorMessage
                            name="shipping_address"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                        {/* Notes */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Notes
                          </p>
                          <Field
                            as="textarea"
                            name="notes"
                            placeholder="Type any notes here…"
                            rows={4}
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full min-h-[120px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] p-4 text-firstBlack resize-y"
                          />
                          <ErrorMessage
                            name="notes"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white w-full hover:bg-primary-700"
                        >
                          {isSubmitting ? "Submitting…" : "Submit"}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {editEstimate && (
            <div className="w-full min-h-auto p-6">
              <div className="flex justify-between mb-4 sm:mb-6 md:mb-8">
                <p className="text-primary-500 text-[22px] sm:text-[24px] md:text-[26px] font-bold leading-8 sm:leading-9">
                  Edit Purchase Order
                </p>
                <IoCloseOutline
                  onClick={toggleSidebar}
                  className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6" />

              {loadingDiscrepancies && (
                <div className="text-center py-4">
                  <p className="text-gray-500">Checking GRN discrepancies...</p>
                </div>
              )}

              <div className="w-full mx-auto p-0">
                <Formik
                  key={editEstimate.id}
                  enableReinitialize
                  initialValues={editInitialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleUpdate}
                >
                  {({
                    values,
                    setFieldValue,
                    setFieldTouched,
                    isSubmitting,
                  }) => (
                    <Form>
                      <Field type="hidden" name="user_id" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Vendor */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Company Name(Vendor)
                          </p>
                          <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={fetchVendors}
                            value={vendorOption}
                            onChange={(opt: Option | null) => {
                              setVendorOption(opt);
                              setFieldValue("vendor_id", opt?.value || "");
                              setFieldTouched("vendor_id", true);
                              if (opt?.raw?.address) {
                                setFieldValue("delivery", opt.raw.address);
                              }
                            }}
                            onBlur={() => setFieldTouched("vendor_id", true)}
                            placeholder="Search vendor by company / name / email / phone"
                            isClearable
                            classNamePrefix="react-select"
                            classNames={{
                              control: ({ isFocused }) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-[#DFEAF2]"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: "4px",
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                backgroundColor: "#fff",
                                zIndex: 50,
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-500)"
                                  : isFocused
                                  ? "var(--primary-100)"
                                  : "#fff",
                                color: isSelected ? "#fff" : "#333",
                                cursor: "pointer",
                              }),
                            }}
                          />
                          <ErrorMessage
                            name="vendor_id"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Delivery */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Delivery Address
                          </p>
                          <CreatableSelect
                            value={
                              values.delivery
                                ? {
                                    value: values.delivery,
                                    label: values.delivery,
                                  }
                                : null
                            }
                            onChange={(opt: Option | null) => {
                              setFieldValue("delivery", opt?.value || "");
                              setFieldTouched("delivery", true);
                            }}
                            onCreateOption={(inputValue: string) => {
                              setFieldValue("delivery", inputValue);
                              setFieldTouched("delivery", true);
                            }}
                            placeholder="Select or type a new address"
                            isClearable
                            classNamePrefix="react-select"
                            classNames={{
                              control: ({ isFocused }) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-[#DFEAF2]"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: "4px",
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                backgroundColor: "#fff",
                                zIndex: 50,
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-500)"
                                  : isFocused
                                  ? "var(--primary-100)"
                                  : "#fff",
                                color: isSelected ? "#fff" : "#333",
                                cursor: "pointer",
                              }),
                            }}
                          />
                          <ErrorMessage
                            name="delivery"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="pt-4 pb-4">
                        <h1 className="text-center bg-gray-200 py-2 my-3 rounded">
                          Item & Description
                        </h1>
                      </div>

                      <FieldArray name="itemDetails">
                        {({ push, remove }) => (
                          <div className="flex flex-col space-y-4 mb-6">
                            {values.itemDetails.map((_, idx) => {
                              const base = `itemDetails.${idx}`;
                              const isFirst = idx === 0;

                              return (
                                <div
                                  key={idx}
                                  className="flex flex-wrap items-end gap-3 w-full border-b border-gray-200 pb-4"
                                >
                                  {/* Item Name */}
                                  <div className="w-full sm:w-[150px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Item Name
                                    </p>
                                    <Field
                                      name={`${base}.item`}
                                      placeholder="Item name"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.item`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Item Description */}
                                  <div className="w-full sm:w-[320px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Description
                                    </p>
                                    <Field
                                      name={`${base}.description`}
                                      placeholder="Item description"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.description`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Make / Brand */}
                                  <div className="w-full sm:w-[120px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Make / Brand
                                    </p>
                                    <Field
                                      name={`${base}.make`}
                                      placeholder="Make / Brand"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.make`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* HSN/SAC */}
                                  <div className="w-full sm:w-[100px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      HSN / SAC
                                    </p>
                                    <Field
                                      name={`${base}.hsn`}
                                      placeholder="HSN/SAC"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.hsn`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Unit */}
                                  <div className="w-full sm:w-[80px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Unit
                                    </p>
                                    <Field
                                      name={`${base}.unit`}
                                      placeholder="Unit"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.unit`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Quantity */}
                                  <div className="w-full sm:w-[60px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Quantity
                                    </p>
                                    <Field
                                      name={`${base}.quantity`}
                                      placeholder="Qty"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.quantity`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Rate */}
                                  <div className="w-full sm:w-[80px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      Rate
                                    </p>
                                    <Field
                                      name={`${base}.rate`}
                                      placeholder="Rate"
                                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                    />
                                    <ErrorMessage
                                      name={`${base}.rate`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* GST */}
                                  <div className="w-full sm:w-[120px]">
                                    <p className="text-[#232323] text-sm leading-normal mb-1">
                                      GST
                                    </p>
                                    <Field name={`${base}.gst`}>
                                      {({
                                        field,
                                        form,
                                      }: FieldProps<string>) => {
                                        const options: GstOption[] =
                                          RATE_OPTIONS;
                                        const selectedOption =
                                          options.find(
                                            (opt) => opt.value === field.value
                                          ) ?? null;

                                        return (
                                          <Select<GstOption, false>
                                            value={selectedOption}
                                            onChange={(option) =>
                                              form.setFieldValue(
                                                field.name,
                                                (option as GstOption | null)
                                                  ?.value ?? ""
                                              )
                                            }
                                            onBlur={() =>
                                              form.setFieldTouched(
                                                field.name,
                                                true
                                              )
                                            }
                                            options={options}
                                            placeholder="Select GST"
                                            isClearable
                                            classNames={{
                                              control: ({ isFocused }) =>
                                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                                  isFocused
                                                    ? "!border-primary-500"
                                                    : "!border-[#DFEAF2]"
                                                }`,
                                            }}
                                            styles={{
                                              menu: (base) => ({
                                                ...base,
                                                borderRadius: "4px",
                                                boxShadow:
                                                  "0px 4px 10px rgba(0,0,0,0.1)",
                                                backgroundColor: "#fff",
                                                zIndex: 50,
                                              }),
                                              option: (
                                                base,
                                                { isFocused, isSelected }
                                              ) => ({
                                                ...base,
                                                backgroundColor: isSelected
                                                  ? "var(--primary-500)"
                                                  : isFocused
                                                  ? "var(--primary-100)"
                                                  : "#fff",
                                                color: isSelected
                                                  ? "#fff"
                                                  : "#333",
                                                cursor: "pointer",
                                              }),
                                            }}
                                          />
                                        );
                                      }}
                                    </Field>
                                    <ErrorMessage
                                      name={`${base}.gst`}
                                      component="div"
                                      className="text-red-500 text-xs mt-1"
                                    />
                                  </div>

                                  {/* Add/Remove Buttons */}
                                  <div className="w-full sm:w-auto">
                                    <div className="flex gap-2">
                                      {isFirst ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            push({
                                              item: "",
                                              description: "",
                                              unit: "",
                                              make: "",
                                              hsn: "",
                                              quantity: "",
                                              rate: "",
                                              gst: RATE_OPTIONS[0].value,
                                            })
                                          }
                                          className="h-[50px] w-full sm:w-[92px] px-4 bg-[#4AB82A] rounded hover:bg-[#35931d] text-white"
                                        >
                                          Add
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => remove(idx)}
                                          className="h-[50px] w-full sm:w-auto px-4 bg-red-500 rounded hover:bg-red-600 text-white"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </FieldArray>

                      {/* Purchase Type + Shipping State + Site Issue */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Purchase Type */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Purchase Type
                          </p>
                          <Field name="purchase_type">
                            {({ field, form }: FieldProps<string>) => {
                              const selectedOption =
                                PURCHASE_TYPE_OPTIONS.find(
                                  (opt) => opt.value === field.value
                                ) ?? null;

                              return (
                                <Select
                                  value={selectedOption}
                                  onChange={(option) =>
                                    form.setFieldValue(
                                      field.name,
                                      (option as any)?.value ?? ""
                                    )
                                  }
                                  onBlur={() =>
                                    form.setFieldTouched(field.name, true)
                                  }
                                  options={PURCHASE_TYPE_OPTIONS}
                                  placeholder="Select Purchase Type"
                                  isClearable
                                  classNames={{
                                    control: ({ isFocused }) =>
                                      `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                        isFocused
                                          ? "!border-primary-500"
                                          : "!border-[#DFEAF2]"
                                      }`,
                                  }}
                                  styles={{
                                    menu: (base) => ({
                                      ...base,
                                      borderRadius: "4px",
                                      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                      backgroundColor: "#fff",
                                      zIndex: 50,
                                    }),
                                    option: (
                                      base,
                                      { isFocused, isSelected }
                                    ) => ({
                                      ...base,
                                      backgroundColor: isSelected
                                        ? "var(--primary-500)"
                                        : isFocused
                                        ? "var(--primary-100)"
                                        : "#fff",
                                      color: isSelected ? "#fff" : "#333",
                                      cursor: "pointer",
                                    }),
                                  }}
                                />
                              );
                            }}
                          </Field>
                          <ErrorMessage
                            name="purchase_type"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Shipping State */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Shipping State
                          </p>
                          <Field
                            name="shipping_state"
                            placeholder="Enter Shipping State"
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                          />
                          <ErrorMessage
                            name="shipping_state"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>

                        {/* Site Issue Field */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Site Issue
                          </p>
                          <Field
                            name="site_issue"
                            placeholder="Enter site issue description"
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                          />
                          <ErrorMessage
                            name="site_issue"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      {/* Notes and Shipping Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {/* Shipping Address */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Shipping Address
                          </p>
                          <Field
                            as="textarea"
                            name="shipping_address"
                            placeholder="Shipping address (optional)"
                            rows={4}
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full min-h-[120px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] p-4 text-firstBlack resize-y"
                          />
                          <ErrorMessage
                            name="shipping_address"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                        {/* Notes */}
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Notes
                          </p>
                          <Field
                            as="textarea"
                            name="notes"
                            placeholder="Type any notes here…"
                            rows={4}
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full min-h-[120px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] p-4 text-firstBlack resize-y"
                          />
                          <ErrorMessage
                            name="notes"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      {/* DEDUCTIONS SECTION - CONDITIONAL RENDERING */}
                      {hasGRNDiscrepancies && (
                        <>
                          <div className="pt-4 pb-4">
                            <h1 className="text-center bg-red-100 py-2 my-3 rounded text-red-800">
                              Deductions Based on GRN Discrepancies
                            </h1>
                            <p className="text-sm text-gray-600 mb-2">
                              The following GRNs have damaged or missing items.
                              Add deductions below.
                            </p>

                            {grnDiscrepancies.length > 0 && (
                              <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                                <h3 className="font-semibold text-sm mb-2">
                                  GRN Discrepancies Found:
                                </h3>
                                {grnDiscrepancies.map((disc, idx) => (
                                  <div key={idx} className="text-xs mb-1">
                                    • {disc.item_name}: {disc.damaged_qty}{" "}
                                    damaged, {disc.missing_qty} missing
                                    (Potential deduction: ₹
                                    {disc.potential_deduction.toFixed(2)})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <FieldArray name="deductions">
                            {({ push, remove }) => (
                              <div className="flex flex-col space-y-4 mb-6">
                                {values.deductions &&
                                values.deductions.length > 0 ? (
                                  values.deductions.map((_, idx) => {
                                    const base = `deductions.${idx}`;

                                    return (
                                      <div
                                        key={idx}
                                        className="flex flex-wrap items-end gap-3 w-full border-b border-red-200 pb-4 bg-red-50 p-3 rounded"
                                      >
                                        {/* Deduction Amount */}
                                        <div className="w-full sm:w-[200px]">
                                          <p className="text-[#232323] text-sm leading-normal mb-1">
                                            Deduction Amount(₹)
                                          </p>
                                          <Field
                                            name={`${base}.amount`}
                                            placeholder="Amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                          />
                                          <ErrorMessage
                                            name={`${base}.amount`}
                                            component="div"
                                            className="text-red-500 text-xs mt-1"
                                          />
                                        </div>

                                        {/* Deduction Description */}
                                        <div className="w-full sm:w-[300px]">
                                          <p className="text-[#232323] text-sm leading-normal mb-1">
                                            Description
                                          </p>
                                          <Field
                                            name={`${base}.description`}
                                            placeholder="Reason for deduction (e.g., Damaged items, Missing quantity)"
                                            className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 text-firstBlack"
                                          />
                                          <ErrorMessage
                                            name={`${base}.description`}
                                            component="div"
                                            className="text-red-500 text-xs mt-1"
                                          />
                                        </div>

                                        {/* Linked GRN (Optional) */}
                                        <div className="w-full sm:w-[200px]">
                                          <p className="text-[#232323] text-sm leading-normal mb-1">
                                            Linked GRN (Optional)
                                          </p>
                                          <Field name={`${base}.grn_id`}>
                                            {({
                                              field,
                                              form,
                                            }: FieldProps<string>) => {
                                              const selectedOption =
                                                grnOptions.find(
                                                  (opt) =>
                                                    opt.value === field.value
                                                ) || null;

                                              return (
                                                <Select
                                                  value={selectedOption}
                                                  onChange={(option) => {
                                                    form.setFieldValue(
                                                      field.name,
                                                      option?.value || null
                                                    );
                                                  }}
                                                  onBlur={() =>
                                                    form.setFieldTouched(
                                                      field.name,
                                                      true
                                                    )
                                                  }
                                                  options={grnOptions}
                                                  placeholder="Select GRN"
                                                  isClearable
                                                  classNames={{
                                                    control: ({ isFocused }) =>
                                                      `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                                        isFocused
                                                          ? "!border-primary-500"
                                                          : "!border-[#DFEAF2]"
                                                      }`,
                                                  }}
                                                />
                                              );
                                            }}
                                          </Field>
                                        </div>

                                        {/* Hidden field for ID */}
                                        <Field
                                          type="hidden"
                                          name={`${base}.id`}
                                        />
                                        <Field
                                          type="hidden"
                                          name={`${base}._destroy`}
                                          value={false}
                                        />

                                        {/* Remove Button */}
                                        <div className="w-full sm:w-auto">
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (
                                                  values.deductions &&
                                                  values.deductions[idx]?.id
                                                ) {
                                                  setFieldValue(
                                                    `${base}._destroy`,
                                                    true
                                                  );
                                                } else {
                                                  remove(idx);
                                                }
                                              }}
                                              className="h-[50px] w-full sm:w-auto px-4 bg-red-500 rounded hover:bg-red-600 text-white"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center text-gray-500 py-4">
                                    No deductions added yet.
                                  </div>
                                )}

                                {/* Add Deduction Button */}
                                <div className="flex justify-start">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      push({
                                        id: null,
                                        amount: "",
                                        description: "",
                                        grn_id: null,
                                        _destroy: false,
                                      });
                                    }}
                                    className="h-[50px] px-4 bg-blue-500 rounded hover:bg-blue-600 text-white"
                                  >
                                    + Add Deduction
                                  </button>
                                </div>
                              </div>
                            )}
                          </FieldArray>

                          {/* Display totals with deductions */}
                          {values.deductions &&
                            values.deductions.filter((d) => !d._destroy)
                              .length > 0 && (
                              <div className="bg-gray-100 p-4 rounded mb-6">
                                <h3 className="font-semibold mb-2">Summary</h3>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>Original Subtotal:</div>
                                  <div className="text-right">
                                    ₹
                                    {values.itemDetails
                                      .reduce(
                                        (sum, item) =>
                                          sum +
                                          parseFloat(item.quantity || "0") *
                                            parseFloat(item.rate || "0"),
                                        0
                                      )
                                      .toFixed(2)}
                                  </div>

                                  <div>Total Deductions:</div>
                                  <div className="text-right text-red-600">
                                    -₹
                                    {values.deductions
                                      .filter((d) => !d._destroy)
                                      .reduce(
                                        (sum, d) =>
                                          sum + (parseFloat(d.amount) || 0),
                                        0
                                      )
                                      .toFixed(2)}
                                  </div>

                                  <div className="font-bold">Net Payable:</div>
                                  <div className="text-right font-bold">
                                    ₹
                                    {(
                                      values.itemDetails.reduce(
                                        (sum, item) =>
                                          sum +
                                          parseFloat(item.quantity || "0") *
                                            parseFloat(item.rate || "0"),
                                        0
                                      ) -
                                      values.deductions
                                        .filter((d) => !d._destroy)
                                        .reduce(
                                          (sum, d) =>
                                            sum + (parseFloat(d.amount) || 0),
                                          0
                                        )
                                    ).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            )}
                        </>
                      )}

                      {/* Show message when no discrepancies found */}
                      {!loadingDiscrepancies && !hasGRNDiscrepancies && (
                        <div className="bg-green-50 p-4 rounded mb-6 border border-green-200">
                          <p className="text-green-700 text-center">
                            ✓ No GRN discrepancies found. All items received in
                            good condition.
                          </p>
                        </div>
                      )}

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white w-full hover:bg-primary-700"
                        >
                          {isSubmitting ? "Updating…" : "Update Order"}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          )}

          {/* Search Form */}
          {searchEstimate && (
            <div className="w-full min-h-auto p-6">
              <div className="flex justify-between mb-4 sm:mb-6 md:mb-8">
                <p className="text-primary-500 text-[22px] sm:text-[24px] md:text-[26px] font-bold leading-8 sm:leading-9">
                  Filter by Vendor
                </p>
                <IoCloseOutline
                  onClick={toggleSidebar}
                  className="h-7 sm:h-8 w-7 sm:w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-[#E7E7E7] mb-4 sm:mb-6" />

              <div className="w-full mx-auto p-0">
                <Formik
                  initialValues={initialVendorSearchValues}
                  validationSchema={vendorSearchSchema}
                  onSubmit={handleVendorSearchSubmit}
                >
                  {({
                    setFieldValue,
                    setFieldTouched,
                    isSubmitting,
                    values,
                  }) => (
                    <Form>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                        <div className="w-full relative">
                          <p className="text-[#232323] text-base leading-normal mb-1">
                            Company Name(Vendor)
                          </p>
                          <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={fetchVendors}
                            value={
                              values.vendor_id &&
                              vendorOption?.value === values.vendor_id
                                ? vendorOption
                                : null
                            }
                            onChange={(opt: Option | null) => {
                              setVendorOption(opt);
                              setFieldValue("vendor_id", opt?.value || "");
                              setFieldTouched("vendor_id", true);
                            }}
                            onBlur={() => setFieldTouched("vendor_id", true)}
                            placeholder="Search vendor by company / name / email / phone"
                            isClearable
                            classNamePrefix="react-select"
                            classNames={{
                              control: ({ isFocused }) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-[#DFEAF2]"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: "4px",
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                                backgroundColor: "#fff",
                                zIndex: 50,
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-500)"
                                  : isFocused
                                  ? "var(--primary-100)"
                                  : "#fff",
                                color: isSelected ? "#fff" : "#333",
                                cursor: "pointer",
                              }),
                            }}
                          />
                          <ErrorMessage
                            name="vendor_id"
                            component="div"
                            className="text-red-500 text-xs mt-1"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white w-full hover:bg-primary-700"
                        >
                          {isSubmitting ? "Searching…" : "Apply Filter"}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          )}
        </div>
      </div>
      {showAdvanceModal && selectedVendorForAdvance && (
        <AdvancePaymentModal
          isOpen={showAdvanceModal}
          onClose={() => {
            setShowAdvanceModal(false);
            setSelectedVendorForAdvance(null);
            setSelectedPOId(null);
            setSelectedPOData(null);
          }}
          vendor={selectedVendorForAdvance}
          poId={selectedPOId}
          poData={selectedPOData}
          onSuccess={handleAdvanceSuccess}
        />
      )}
    </div>
  );
}
