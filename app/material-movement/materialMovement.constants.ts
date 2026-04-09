// materialMovement.constants.ts
export const STAGE_OPTIONS = [
  "All Status",
  "Lathe",
  "cnc",
  "vmc",
  "Milling",
  "Drilling",
  "Vendor",
  "Welding",
  "QC",
  "Completed",
];

export const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// Machine code options
export const MACHINE_CODES = {
  small: Array.from({ length: 9 }, (_, i) => ({ value: `SFL${i + 1}`, label: `SFL${i + 1}` })),
  medium: Array.from({ length: 3 }, (_, i) => ({ value: `MFL${i + 1}`, label: `MFL${i + 1}` })),
  large: Array.from({ length: 4 }, (_, i) => ({ value: `LFL${i + 1}`, label: `LFL${i + 1}` })),
};

export const vmc_CODES = [{ value: "FVMC01", label: "FVMC01" }];
export const MILLING_CODES = [{ value: "FML01", label: "FML01" }];
export const DRILLING_CODES = [{ value: "FDL01", label: "FDL01" }];

export const VENDOR_OPTIONS = [
  { value: "in-vendor", label: "In Vendor" },
  { value: "outsource", label: "Outsource" },
];

export const WELDING_OPTIONS = [
  { value: "in-welding", label: "In Welding" },
  { value: "ready-for-qc", label: "Ready for QC" },
];

export const QC_OPTIONS = [
  { value: "ready-for-qc", label: "Ready for QC" },
  { value: "qc-welding", label: "QC of Welding" },
  { value: "qc-vendor", label: "QC of Vendor" },
  { value: "not-ok", label: "Not-ok" },
  { value: "rejected", label: "Rejected" },
];

export const REVIEW_FOR_OPTIONS = [
  { value: "welding", label: "Welding" },
  { value: "vendor", label: "Vendor" },
];

export const DOC_OPTIONS = [
  { value: "JOB_SERVICE", label: "Job" },
  { value: "TSO_SERVICE", label: "TSO" },
  { value: "KANBAN", label: "Kanban" },
  { value: "PO", label: "PO" },
];

// TSO Service Categories
export const TSO_SERVICE_CATEGORIES = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

// Kanban Categories
export const KANBAN_CATEGORIES = [
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

// Worker options based on machine category and size
export const WORKER_OPTIONS = {
  Lathe: {
    small: ["Naseem", "Sanjay", "Choto bhai", "Ali bhai", "Gufran bhai", "Mahtab alam", "Jamaluddeen", "Javed bhai", "Hasib shekh"],
    medium: ["Shoakat ali", "Mohd Jumriti anshari", "Usman bhai"],
    large: ["Partab", "Mujeeb bhai", "Rangi lala", "Mahtab mota bhai"],
  },
  cnc: {
    small: ["Ramjan ali", "Mustafa", "Akramuddeen", "Sufyan"],
    medium: ["Ziyaul mustafa", "Mufeed alam"],
    large: ["Aqif khan"],
  },
  vmc: {
    default: ["Rajnish kumar"],
  },
  Milling: {
    default: ["Ramakanat"],
  },
  Drilling: {
    default: ["Rahman"],
  },
};