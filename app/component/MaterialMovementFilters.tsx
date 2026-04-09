// components/MaterialMovementFilters.tsx

import React, { useState, useEffect } from 'react';
import { 
  STAGE_OPTIONS, 
  SIZE_OPTIONS, 
  MACHINE_CODES,
  VMC_CODES,
  MILLING_CODES,
  DRILLING_CODES,
  DOC_OPTIONS,
  TSO_SERVICE_CATEGORIES,
  KANBAN_CATEGORIES,
  REVIEW_FOR_OPTIONS
} from '../material-movement/materialMovement.constants';
import { getMaterialMovement } from '../services/materialMovementApi';

interface Filters {
  machine_category: string;
  machine_size: string;
  machine_code: string;
  status: string;
  job_type: string;
  job_category: string;
  review_for: string;
  q: string;
}

interface MaterialMovementRecord {
  id: string;
  jo_no: string;
  job_no: string;
  tso_no: string;
  item_no: string;
  item_description: string;
  quantity_no: string;
  status: string;
  machine_category: string;
  machine_size: string;
  machine_code: string;
  worker_name: string;
  vendor_name: string;
  serial_no: string;
  assigning_date: string;
  client_name: string;
  job_type: string;
  job_category: string;
  review_for: string;
  // New chalan fields
  chalan_no: string;
  mtl_challan_no: string;
  chalan_date: string;
  mtl_rcd_date: string;
  dispatch_date: string;
  job_order_date: string;
}

const MaterialMovementFilters: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    machine_category: "",
    machine_size: "",
    machine_code: "",
    status: "",
    job_type: "",
    job_category: "",
    review_for: "",
    q: ""
  });
  
  const [data, setData] = useState<MaterialMovementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [machineCodeOptions, setMachineCodeOptions] = useState<Array<{value: string, label: string}>>([]);
  
  // Update machine code options based on selected machine category and size
  useEffect(() => {
    if ((filters.machine_category === "Lathe" || filters.machine_category === "cnc") && filters.machine_size) {
      setMachineCodeOptions(MACHINE_CODES[filters.machine_size as keyof typeof MACHINE_CODES] || []);
    } else if (filters.machine_category === "vmc") {
      setMachineCodeOptions(VMC_CODES);
    } else if (filters.machine_category === "Milling") {
      setMachineCodeOptions(MILLING_CODES);
    } else if (filters.machine_category === "Drilling") {
      setMachineCodeOptions(DRILLING_CODES);
    } else {
      setMachineCodeOptions([]);
    }
  }, [filters.machine_category, filters.machine_size]);
  
  // Get job category options based on job type
  const getJobCategoryOptions = () => {
    if (filters.job_type === "TSO_SERVICE") {
      return TSO_SERVICE_CATEGORIES;
    } else if (filters.job_type === "KANBAN") {
      return KANBAN_CATEGORIES;
    }
    return [];
  };
  
  // Fetch data with current filters
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      
      if (filters.machine_category) params.machine_category = filters.machine_category;
      if (filters.machine_size) params.machine_size = filters.machine_size;
      if (filters.machine_code) params.machine_code = filters.machine_code;
      if (filters.status) params.status = filters.status;
      if (filters.job_type) params.job_type = filters.job_type;
      if (filters.job_category) params.job_category = filters.job_category;
      if (filters.review_for) params.review_for = filters.review_for;
      if (filters.q) params.q = filters.q;
      
      const response = await getMaterialMovement(params);
      if (response.success) {
        setData(response.data);
        console.log("Filtered data:", response.data);
        console.log("Total records:", response.pagination.total);
        
        // Log counts for debugging
        const latheRecords = response.data.filter((r: MaterialMovementRecord) => 
          r.machine_category?.toLowerCase() === "lathe"
        );
        const cncRecords = response.data.filter((r: MaterialMovementRecord) => 
          r.machine_category?.toLowerCase() === "cnc"
        );
        const vmcRecords = response.data.filter((r: MaterialMovementRecord) => 
          r.machine_category?.toLowerCase() === "vmc"
        );
        
        console.log("Lathe records found:", latheRecords.length);
        console.log("CNC records found:", cncRecords.length);
        console.log("VMC records found:", vmcRecords.length);
        
        // Log records with chalan numbers
        const recordsWithChalan = response.data.filter((r: MaterialMovementRecord) => 
          r.chalan_no !== "-" || r.mtl_challan_no !== "-"
        );
        console.log("Records with Chalan No:", recordsWithChalan.length);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === "machine_category" || key === "machine_size") {
        newFilters.machine_code = "";
      }
      if (key === "job_type") {
        newFilters.job_category = "";
      }
      
      return newFilters;
    });
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    fetchData();
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      machine_category: "",
      machine_size: "",
      machine_code: "",
      status: "",
      job_type: "",
      job_category: "",
      review_for: "",
      q: ""
    });
    // Fetch all data after reset
    setTimeout(() => fetchData(), 0);
  };
  
  // Initial load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "-") return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="filters-container" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h3>Material Movement Filters</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px", marginBottom: "20px" }}>
        {/* Search */}
        <div className="filter-group">
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Search:</label>
          <input
            type="text"
            placeholder="Search by JO No, Serial No, Worker, Vendor, Chalan No..."
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleApplyFilters()}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </div>
        
        {/* Machine Category */}
        <div className="filter-group">
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Stage / Machine Category:</label>
          <select
            value={filters.machine_category}
            onChange={(e) => handleFilterChange("machine_category", e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All Status</option>
            {STAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === "vmc" ? "VMC" : option}
              </option>
            ))}
          </select>
        </div>
        
        {/* Machine Size - Show only for Lathe and cnc */}
        {(filters.machine_category === "Lathe" || filters.machine_category === "cnc") && (
          <div className="filter-group">
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Machine Size:</label>
            <select
              value={filters.machine_size}
              onChange={(e) => handleFilterChange("machine_size", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            >
              <option value="">All Sizes</option>
              {SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Machine Code */}
        {machineCodeOptions.length > 0 && (
          <div className="filter-group">
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Machine Code:</label>
            <select
              value={filters.machine_code}
              onChange={(e) => handleFilterChange("machine_code", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            >
              <option value="">All Codes</option>
              {machineCodeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Status */}
        <div className="filter-group">
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All Status</option>
            <option value="machine">Machine</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="not-ok">Not OK</option>
            <option value="ready-for-qc">Ready for QC</option>
          </select>
        </div>
        
        {/* Job Type */}
        <div className="filter-group">
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Document Type:</label>
          <select
            value={filters.job_type}
            onChange={(e) => handleFilterChange("job_type", e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All Types</option>
            {DOC_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Job Category */}
        {getJobCategoryOptions().length > 0 && (
          <div className="filter-group">
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Category:</label>
            <select
              value={filters.job_category}
              onChange={(e) => handleFilterChange("job_category", e.target.value)}
              style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            >
              <option value="">All Categories</option>
              {getJobCategoryOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Review For */}
        <div className="filter-group">
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Review For:</label>
          <select
            value={filters.review_for}
            onChange={(e) => handleFilterChange("review_for", e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
          >
            <option value="">All</option>
            {REVIEW_FOR_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          onClick={handleApplyFilters} 
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        <button 
          onClick={handleResetFilters} 
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          Reset
        </button>
      </div>
      
      {/* Results Count */}
      <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
        Total Records: {data.length}
      </div>
      
      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>JO No</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Job No</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Chalan No</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Mtl Challan No</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Chalan Date</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Machine Category</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Machine Size</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Machine Code</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Status</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Worker Name</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Item Description</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Quantity</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Client Name</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record) => (
                <tr key={record.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.jo_no}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.job_no}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontWeight: "bold", color: "#0066cc" }}>
                    {record.chalan_no !== "-" ? record.chalan_no : record.mtl_challan_no !== "-" ? record.mtl_challan_no : "-"}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.mtl_challan_no}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{formatDate(record.chalan_date)}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.machine_category}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.machine_size}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.machine_code}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: 
                        record.status === "completed" ? "#d4edda" :
                        record.status === "rejected" ? "#f8d7da" :
                        record.status === "in-progress" ? "#fff3cd" :
                        "#e2e3e5",
                      color:
                        record.status === "completed" ? "#155724" :
                        record.status === "rejected" ? "#721c24" :
                        record.status === "in-progress" ? "#856404" :
                        "#383d41"
                    }}>
                      {record.status}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.worker_name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.item_description}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.quantity_no}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{record.client_name}</td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MaterialMovementFilters;