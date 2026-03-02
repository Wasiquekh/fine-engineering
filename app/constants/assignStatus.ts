export const ASSIGN_STATUS = {
    // Production planning
    VENDOR_OUTSOURCE: "vendor-outsource", // review->vendor goes here
  
    // QC flows (two forms)
    QC_WELDING_OUTGOING: "qc-welding-outgoing",
    QC_WELDING_INCOMING: "qc-welding-incoming",
    QC_VENDOR_OUTGOING: "qc-vendor-outgoing",
    QC_VENDOR_INCOMING: "qc-vendor-incoming",
  
    // Review menu after QC incoming done
    REVIEW_WELDING: "review-welding",
    REVIEW_VENDOR: "review-vendor",
  };