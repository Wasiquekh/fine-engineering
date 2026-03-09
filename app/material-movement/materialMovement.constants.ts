export const STAGE_OPTIONS = [
  "All Status",
  "Lathe",
  "cnc",
  "UMC",
  "Drilling",
  "Milling",
  "Vendor",
  "Welding",
  "QC",
  "Completed",
];

export const SIZE_OPTIONS = ["small", "medium", "large"];

export const LATHE_CNC_CODES = {
  small: ["SFL1","SFL2","SFL3","SFL4","SFL5","SFL6","SFL7","SFL8","SFL9"],
  medium: ["MFL1","MFL2","MFL3"],
  large: ["LFL1","LFL2","LFL3","LFL4"],
};

export const UMC_CODES = ["FVMC01"];

export const MILLING_CODES = ["FML01"];

export const DRILLING_CODES = ["FDL01"];

export const VENDOR_OPTIONS = ["In Vendor", "Outsource"];

export const WELDING_OPTIONS = [
  "In Welding",
  "Ready for QC"
];

export const QC_OPTIONS = [
  "Ready for QC",
  "QC of Welding",
  "QC of Vendor",
  "Not-ok",
  "Rejected",
];

export const REVIEW_FOR_OPTIONS = ["Welding", "Vendor"];

export const DOC_OPTIONS = ["Job", "TSO", "Kanban", "PO"];