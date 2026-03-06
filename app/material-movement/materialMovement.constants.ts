export const STAGE_OPTIONS = [
  "All Status",
  "Lathe",
  "CNC",
  "UMC",
  "Drilling",
  "Milling",
  "Vendor",
  "Welding",
  "QC",
  "Completed",
] as const;

export const SIZE_OPTIONS = ["All", "Small", "Medium", "Large"] as const;

export const LATHE_CNC_CODES = {
  Small: ["SFL1", "SFL2", "SFL3", "SFL4", "SFL5", "SFL6", "SFL7", "SFL8", "SFL9"],
  Medium: ["MFL1", "MFL2", "MFL3"],
  Large: ["LFL1", "LFL2", "LFL3", "LFL4"],
};

export const UMC_CODES = ["UMC1", "UMC2", "UMC3"];
export const MILLING_CODES = ["MIL1", "MIL2", "MIL3"];
export const DRILLING_CODES = ["DRL1", "DRL2", "DRL3"];

export const VENDOR_OPTIONS = ["In Vendor", "Outsource"] as const;
export const WELDING_OPTIONS = ["In Welding"] as const;

export const QC_OPTIONS = [
  "Ready for QC",
  "QC of Welding",
  "QC of Vendor",
  "Not-ok",
  "Rejected",
] as const;

export const DOC_OPTIONS = ["Job", "TSO", "Kanban", "PO"] as const;