"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, Fragment } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { useSearchParams } from "next/navigation";
import StorageManager from "../../provider/StorageManager";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import PageGuard from "../component/PageGuard";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

const kanbanCategory = [
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

type QcRow = {
  id: string;
  job_id?: string | null;
  job_no?: string | null;
  tso_no?: string | null;
  jo_no?: string | null;
  serial_no?: string | null;
  item_no?: number | string | null;
  machine_category?: string | null;
  machine_size?: string | null;
  machine_code?: string | null;
  worker_name?: string | null;
  quantity_no?: number | string | null;
  assigning_date?: string | null;
  review_for?: "vendor" | "welding" | null;
  job_category?: string | null;
  status?: string | null;
  job?: {
    id?: string | null;
    job_no?: string | null;
    tso_no?: string | null;
    jo_number?: string | null;
    job_category?: string | null;
    client_name?: string | null;
    item_description?: string | null;
    moc?: string | null;
    qty?: number | null;
  } | null;
};

export default function QcMainPage() {
  const [data, setData] = useState<QcRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNo, setSelectedJobNo] = useState<string | null>(null);
  
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState("ALL");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);

  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "JOB_SERVICE";
  const client = searchParams.get("client") || "";

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/categories", {
        params: {
          ...(client ? { "job.client_name": client } : {}),
        },
      } as any);
      const cats = Array.isArray(response?.data?.data)
        ? response.data.data
        : response?.data?.data?.categories || [];

      const uniqueMap = new Map<string, { value: string; label: string }>();

      cats.forEach((cat: any) => {
        const jobCategory = String(cat?.job_category || "").trim();
        if (jobCategory && !uniqueMap.has(jobCategory)) {
          uniqueMap.set(jobCategory, {
            value: jobCategory,
            label: jobCategory,
          });
        }
      });

      const formattedCats = Array.from(uniqueMap.values());
      setCategories(formattedCats);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosProvider.get("/fineengg_erp/system/assign-to-worker", {
        params: {
          job_type: filterParam,
          status: "ready-for-qc",
          ...(client ? { "job.client_name": client } : {}),
        },
      } as any);

      let fetchedData = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching QC data:", error);
      toast.error("Failed to load QC data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [client]);

  useEffect(() => {
    setSelectedJobNo(null);
    setSelectedJobs(new Set());
    setIsMultiSelectMode(false);
    fetchData();
  }, [filterParam, client]);

  const filteredData = useMemo(() => {
    let currentData = [...data];

    if (filterParam === "JOB_SERVICE") {
      if (jobServiceCategoryFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === jobServiceCategoryFilter;
        });
      }
    } else if (filterParam === "TSO_SERVICE") {
      if (tsoSubFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === tsoSubFilter;
        });
      }
    } else if (filterParam === "KANBAN") {
      if (kanbanSubFilter !== "ALL") {
        currentData = currentData.filter((item) => {
          const category = item.job_category || item.job?.job_category || "";
          return category === kanbanSubFilter;
        });
      }
    }

    return currentData;
  }, [data, filterParam, jobServiceCategoryFilter, tsoSubFilter, kanbanSubFilter]);

  const jobIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    filteredData.forEach((item) => {
      let identifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        identifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        identifier = item.jo_no || item.job_no || item.job?.job_no;
      } else {
        identifier = item.job_no || item.job?.job_no;
      }
      if (identifier) ids.add(identifier);
    });
    return Array.from(ids);
  }, [filteredData, filterParam]);

  const getJoGroupsForIdentifier = (identifier: string) => {
    const items = filteredData.filter((item) => {
      let itemIdentifier: string | null | undefined;
      if (filterParam === "TSO_SERVICE") {
        itemIdentifier = item.tso_no || item.job?.tso_no;
      } else if (filterParam === "KANBAN") {
        itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
      } else {
        itemIdentifier = item.job_no || item.job?.job_no;
      }
      return itemIdentifier === identifier;
    });
    
    const groups: Record<string, QcRow[]> = {};

    items.forEach((item) => {
      const joKey = item.job?.jo_number || "Unknown";
      if (!groups[joKey]) groups[joKey] = [];
      groups[joKey].push(item);
    });

    return groups;
  };

  const jobSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        totalQty: number;
        uniqueJoCount: number;
        jobCategory: string;
        assigningDate: string;
      }
    > = {};

    jobIdentifiers.forEach((identifier) => {
      const items = filteredData.filter((item) => {
        let itemIdentifier: string | null | undefined;
        if (filterParam === "TSO_SERVICE") {
          itemIdentifier = item.tso_no || item.job?.tso_no;
        } else if (filterParam === "KANBAN") {
          itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
        } else {
          itemIdentifier = item.job_no || item.job?.job_no;
        }
        return itemIdentifier === identifier;
      });

      const totalQty = items.reduce(
        (sum, item) => sum + (Number(item.quantity_no) || 0),
        0
      );

      const uniqueJoCount = new Set(items.map((x) => x.job?.jo_number || "Unknown")).size;

      const jobCategory =
        items.length > 0
          ? items[0].job_category || items[0].job?.job_category || "N/A"
          : "N/A";

      const assigningDate =
        items.length > 0 ? items[0].assigning_date || "N/A" : "N/A";

      summary[identifier] = {
        totalQty,
        uniqueJoCount,
        jobCategory,
        assigningDate,
      };
    });

    return summary;
  }, [filteredData, jobIdentifiers, filterParam]);

  const uniqueCategories = useMemo(() => {
    if (filterParam === "JOB_SERVICE") return categories;
    if (filterParam === "TSO_SERVICE") return tsoServiceCategory;
    if (filterParam === "KANBAN") return kanbanCategory;
    return [];
  }, [filterParam, categories]);

  const toggleJobSelection = (jobIdentifier: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobIdentifier)) {
      newSelected.delete(jobIdentifier);
    } else {
      newSelected.add(jobIdentifier);
    }
    setSelectedJobs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedJobs.size === jobIdentifiers.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobIdentifiers));
    }
  };

  const handleBulkDispatch = async () => {
    if (selectedJobs.size === 0) {
      toast.error("Please select at least one JO to dispatch");
      return;
    }

    const allSelectedItems: QcRow[] = [];
    const selectedJobsList = Array.from(selectedJobs);
    
    for (const jobIdentifier of selectedJobsList) {
      const items = filteredData.filter((item) => {
        let itemIdentifier: string | null | undefined;
        if (filterParam === "TSO_SERVICE") {
          itemIdentifier = item.tso_no || item.job?.tso_no;
        } else if (filterParam === "KANBAN") {
          itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
        } else {
          itemIdentifier = item.job_no || item.job?.job_no;
        }
        return itemIdentifier === jobIdentifier;
      });
      allSelectedItems.push(...items);
    }

    if (allSelectedItems.length === 0) {
      toast.error("No items found for selected JOs");
      return;
    }
    
    const totalItems = allSelectedItems.length;
    const totalQuantity = allSelectedItems.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
    
    const joGroups: Record<string, { count: number; qty: number }> = {};
    for (const jobId of selectedJobsList) {
      const jobItems = allSelectedItems.filter(item => {
        let itemIdentifier: string | null | undefined;
        if (filterParam === "TSO_SERVICE") {
          itemIdentifier = item.tso_no || item.job?.tso_no;
        } else if (filterParam === "KANBAN") {
          itemIdentifier = item.jo_no || item.job_no || item.job?.job_no;
        } else {
          itemIdentifier = item.job_no || item.job?.job_no;
        }
        return itemIdentifier === jobId;
      });
      joGroups[jobId] = {
        count: jobItems.length,
        qty: jobItems.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0)
      };
    }
    
    let joSummaryHtml = '<div class="max-h-60 overflow-y-auto border rounded-lg">';
    for (const [joId, info] of Object.entries(joGroups)) {
      joSummaryHtml += `
        <div class="flex justify-between items-center p-3 border-b">
          <span class="font-mono text-sm font-medium">${joId}</span>
          <div class="text-right">
            <span class="text-xs text-gray-500">${info.count} items</span>
            <span class="text-sm font-semibold ml-3 text-green-600">Qty: ${info.qty}</span>
          </div>
        </div>
      `;
    }
    joSummaryHtml += '</div>';

    const { value: dispatchData } = await Swal.fire({
      title: `Bulk Dispatch - ${selectedJobs.size} JO${selectedJobs.size > 1 ? 's' : ''}`,
      html: `
        <div class="text-left">
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <p class="font-semibold text-blue-800 mb-2">📦 Dispatch Summary</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="text-gray-600">Total JOs:</div>
              <div class="font-bold text-blue-600">${selectedJobs.size}</div>
              <div class="text-gray-600">Total Items:</div>
              <div class="font-bold">${totalItems}</div>
              <div class="text-gray-600">Total Quantity:</div>
              <div class="font-bold text-green-600">${totalQuantity}</div>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Selected JOs:</label>
            ${joSummaryHtml}
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chalan No <span class="text-red-500">*</span></label>
              <input id="chalan_no" class="swal2-input w-full" placeholder="Enter Chalan Number" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dispatch Date <span class="text-red-500">*</span></label>
              <input id="dispatch_date" class="swal2-input w-full" type="date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-3 rounded text-sm">
            <p class="font-semibold text-yellow-800">⚠️ Note:</p>
            <p class="text-yellow-700 text-xs mt-1">All selected JOs will be dispatched with FULL quantities. For partial dispatch, please dispatch JOs individually.</p>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: `Dispatch ${selectedJobs.size} JO${selectedJobs.size > 1 ? 's' : ''}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10B981",
      preConfirm: () => {
        const chalan_no = (document.getElementById("chalan_no") as HTMLInputElement)?.value;
        const dispatch_date = (document.getElementById("dispatch_date") as HTMLInputElement)?.value;

        if (!chalan_no || !chalan_no.trim()) {
          Swal.showValidationMessage("Chalan number is required");
          return false;
        }
        
        if (!dispatch_date) {
          Swal.showValidationMessage("Dispatch date is required");
          return false;
        }
        
        return { chalan_no: chalan_no.trim(), dispatch_date };
      }
    });

    if (!dispatchData) return;

    const confirmResult = await Swal.fire({
      title: 'Confirm Bulk Dispatch',
      html: `
        <div class="text-left">
          <p class="mb-3">You are about to dispatch:</p>
          <ul class="list-disc list-inside mb-4 space-y-1">
            <li><strong class="text-blue-600">${selectedJobs.size}</strong> JO(s)</li>
            <li><strong>${totalItems}</strong> item(s)</li>
            <li>Total quantity: <strong class="text-green-600">${totalQuantity}</strong></li>
            <li>Chalan: <strong class="font-mono">${dispatchData.chalan_no}</strong></li>
          </ul>
          <p class="text-sm text-red-600 font-semibold">⚠️ This action cannot be undone!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Dispatch All!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10B981'
    });

    if (!confirmResult.isConfirmed) return;

    const itemsToDispatch = allSelectedItems.map(item => ({
      assignment_id: item.id,
      quantity: Number(item.quantity_no) || 0
    }));

    const loadingToast = toast.loading(`Dispatching ${selectedJobs.size} JO(s)...`);

    try {
      const response = await axiosProvider.post("/fineengg_erp/system/jobs/dispatch", {
        items: itemsToDispatch,
        chalan_no: dispatchData.chalan_no,
        dispatch_date: dispatchData.dispatch_date,
        multi_jo_dispatch: true,
      });

      toast.dismiss(loadingToast);

      if (response?.data?.success) {
        toast.success(
          <div>
            <div className="font-semibold text-green-600">✅ Bulk Dispatch Successful!</div>
            <div className="text-sm mt-2 space-y-1">
              <div>📦 Dispatched: <span className="font-bold">{selectedJobs.size}</span> JO(s)</div>
              <div>📄 Total Items: <span className="font-bold">{totalItems}</span></div>
              <div>📊 Total Qty: <span className="font-bold">{totalQuantity}</span></div>
              <div>📄 Chalan: <span className="font-mono">{dispatchData.chalan_no}</span></div>
            </div>
          </div>,
          { autoClose: 5000 }
        );
        
        setSelectedJobs(new Set());
        setIsMultiSelectMode(false);
        await fetchData();
      } else {
        toast.error(response?.data?.error || "Bulk dispatch failed");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Bulk dispatch error:", error);
      toast.error(error?.response?.data?.error || "Bulk dispatch failed");
    }
  };

  const handleJoOK = async (items: QcRow[]) => {
    if (!items || items.length === 0) {
      toast.error("No items to dispatch.");
      return;
    }

    const firstItem = items[0];
    const jobType = filterParam;
    
    let dispatchIdentifier = null;
    let displayIdentifier = null;
    
    if (jobType === "TSO_SERVICE") {
      dispatchIdentifier = firstItem?.tso_no || firstItem?.job?.tso_no;
      displayIdentifier = dispatchIdentifier;
    } else {
      dispatchIdentifier = firstItem?.job?.jo_number || firstItem?.jo_no;
      displayIdentifier = dispatchIdentifier;
    }
    
    if (!dispatchIdentifier) {
      toast.error(`${jobType} identifier not found. Cannot dispatch.`);
      return;
    }

    const jobNo = firstItem?.job?.job_no || "Unknown";
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
    
    const { value: selectedItems } = await Swal.fire({
      title: `Dispatch Items - ${jobType === "TSO_SERVICE" ? "TSO" : "JO"}: ${displayIdentifier}`,
      html: `
        <div class="text-left">
          <div class="bg-blue-50 p-3 rounded-lg mb-4">
            <p class="font-semibold">Job: ${jobNo}</p>
            <p class="text-sm text-gray-600">Total Available Quantity: <span class="font-bold text-green-600">${totalQuantity}</span></p>
            <p class="text-xs text-gray-500 mt-1">Select items and enter quantity to dispatch</p>
          </div>
          
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-semibold text-gray-700">Items</label>
              <button type="button" id="select-all-btn" class="text-xs text-blue-600 hover:text-blue-800">Select All</button>
            </div>
            <div class="max-h-96 overflow-y-auto border rounded-lg divide-y divide-gray-200">
              ${items.map((item, idx) => `
                <div class="item-row p-3 hover:bg-gray-50 transition-colors" data-item-idx="${idx}">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="item-checkbox mt-1" data-id="${item.id}" data-max="${item.quantity_no}" data-serial="${item.serial_no}" data-idx="${idx}">
                    <div class="flex-1">
                      <div class="flex justify-between items-start">
                        <div>
                          <span class="font-mono font-medium text-sm">${item.serial_no || 'N/A'}</span>
                          <span class="text-xs text-gray-500 ml-2">Item #${item.item_no || 'N/A'}</span>
                        </div>
                        <span class="text-xs font-semibold text-gray-600">Available: ${item.quantity_no || 0}</span>
                      </div>
                      <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <div><span class="font-medium">Item Description:</span> ${item.job?.item_description || '-'}</div>
                        <div><span class="font-medium">MOC:</span> ${item.job?.moc || '-'}</div>
                      </div>
                      <div class="mt-2">
                        <label class="text-xs text-gray-600">Dispatch Quantity:</label>
                        <input 
                          type="number" 
                          class="dispatch-qty ml-2 px-2 py-1 border rounded text-sm w-28" 
                          data-id="${item.id}"
                          value="${item.quantity_no}" 
                          min="1" 
                          max="${item.quantity_no}"
                          step="1"
                        >
                        <span class="text-xs text-gray-400 ml-2">Max: ${item.quantity_no}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chalan No <span class="text-red-500">*</span></label>
              <input id="chalan_no" class="swal2-input w-full" placeholder="Enter Chalan Number" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dispatch Date <span class="text-red-500">*</span></label>
              <input id="dispatch_date" class="swal2-input w-full" type="date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-2 rounded text-xs text-yellow-700">
            💡 Tip: You can partially dispatch items by entering quantity less than available
          </div>
        </div>
      `,
      width: '750px',
      showCancelButton: true,
      confirmButtonText: `Dispatch Selected (${items.length} items)`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10B981",
      didOpen: () => {
        const selectAllBtn = document.getElementById('select-all-btn');
        const checkboxes = document.querySelectorAll('.item-checkbox');
        const qtyInputs = document.querySelectorAll('.dispatch-qty');
        
        checkboxes.forEach((cb, index) => {
          (cb as HTMLInputElement).checked = true;
          const qtyInput = qtyInputs[index] as HTMLInputElement;
          if (qtyInput) qtyInput.disabled = false;
        });
        
        const confirmBtn = Swal.getConfirmButton();
        if (confirmBtn) {
          confirmBtn.textContent = `Dispatch Selected (${items.length} items)`;
        }
        
        if (selectAllBtn) {
          selectAllBtn.onclick = () => {
            const allChecked = Array.from(checkboxes).every(cb => (cb as HTMLInputElement).checked);
            checkboxes.forEach((cb, idx) => {
              (cb as HTMLInputElement).checked = !allChecked;
              const qtyInput = qtyInputs[idx] as HTMLInputElement;
              if (qtyInput) {
                qtyInput.disabled = !(cb as HTMLInputElement).checked;
                if (!(cb as HTMLInputElement).checked) {
                  qtyInput.value = '0';
                } else {
                  qtyInput.value = qtyInput.getAttribute('data-max') || '1';
                }
              }
            });
            
            const newCount = Array.from(checkboxes).filter(cb => (cb as HTMLInputElement).checked).length;
            if (confirmBtn) {
              confirmBtn.textContent = `Dispatch Selected (${newCount} items)`;
            }
          };
        }
        
        checkboxes.forEach((cb, index) => {
          cb.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            const qtyInput = qtyInputs[index] as HTMLInputElement;
            if (qtyInput) {
              qtyInput.disabled = !isChecked;
              if (!isChecked) {
                qtyInput.value = '0';
              } else {
                qtyInput.value = qtyInput.getAttribute('data-max') || '1';
              }
            }
            
            const checkedCount = Array.from(checkboxes).filter(cb => (cb as HTMLInputElement).checked).length;
            if (confirmBtn) {
              confirmBtn.textContent = `Dispatch Selected (${checkedCount} items)`;
            }
          });
        });
        
        qtyInputs.forEach((input) => {
          input.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            let value = parseInt(target.value);
            const max = parseInt(target.getAttribute('max') || '0');
            
            if (isNaN(value)) value = 0;
            if (value > max) {
              target.value = max.toString();
              toast.warning(`Quantity reduced to maximum available (${max})`);
            }
            if (value < 0) target.value = '0';
          });
        });
      },
      preConfirm: () => {
        const checkboxes = document.querySelectorAll('.item-checkbox:checked');
        if (checkboxes.length === 0) {
          Swal.showValidationMessage("Please select at least one item to dispatch");
          return false;
        }
        
        const chalan_no = (document.getElementById("chalan_no") as HTMLInputElement)?.value;
        const dispatch_date = (document.getElementById("dispatch_date") as HTMLInputElement)?.value;

        if (!chalan_no || !chalan_no.trim()) {
          Swal.showValidationMessage("Chalan number is required");
          return false;
        }
        
        if (!dispatch_date) {
          Swal.showValidationMessage("Dispatch date is required");
          return false;
        }
        
        const selectedItemsData: any[] = [];
        let hasValidQuantity = false;
        let totalDispatchQty = 0;
        
        checkboxes.forEach((cb) => {
          const itemId = (cb as HTMLInputElement).getAttribute('data-id');
          const maxQty = parseInt((cb as HTMLInputElement).getAttribute('data-max') || '0');
          const serialNo = (cb as HTMLInputElement).getAttribute('data-serial');
          
          const qtyInput = document.querySelector(`.dispatch-qty[data-id="${itemId}"]`) as HTMLInputElement;
          let dispatchQty = qtyInput ? parseInt(qtyInput.value) : maxQty;
          
          if (isNaN(dispatchQty)) dispatchQty = 0;
          if (dispatchQty > maxQty) dispatchQty = maxQty;
          if (dispatchQty < 0) dispatchQty = 0;
          
          if (dispatchQty > 0) {
            hasValidQuantity = true;
            totalDispatchQty += dispatchQty;
            selectedItemsData.push({
              assignment_id: itemId,
              quantity: dispatchQty,
              serial_no: serialNo,
              max_quantity: maxQty
            });
          }
        });
        
        if (!hasValidQuantity) {
          Swal.showValidationMessage("Please enter valid quantity for at least one item");
          return false;
        }
        
        return Swal.fire({
          title: 'Confirm Dispatch',
          html: `
            <div class="text-left">
              <p>You are about to dispatch:</p>
              <ul class="list-disc list-inside mt-2 mb-2">
                <li><strong>${selectedItemsData.length}</strong> item(s)</li>
                <li>Total quantity: <strong>${totalDispatchQty}</strong></li>
                <li>Chalan: <strong>${chalan_no}</strong></li>
                <li>Date: <strong>${dispatch_date}</strong></li>
              </ul>
              <p class="text-sm text-yellow-600 mt-2">⚠️ This action cannot be undone!</p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Dispatch!',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#10B981'
        }).then((result) => {
          if (result.isConfirmed) {
            return { 
              items: selectedItemsData,
              chalan_no: chalan_no.trim(), 
              dispatch_date 
            };
          }
          return false;
        });
      },
    });

    if (!selectedItems || selectedItems === false) return;

    const loadingToast = toast.loading(`Dispatching ${selectedItems.items.length} item(s)...`);

    try {
      const response = await axiosProvider.post("/fineengg_erp/system/jobs/dispatch", {
        items: selectedItems.items,
        chalan_no: selectedItems.chalan_no,
        dispatch_date: selectedItems.dispatch_date,
      });

      toast.dismiss(loadingToast);

      if (response?.data?.success) {
        toast.success(response.data.message);
        await fetchData();
        setSelectedJobNo(null);
      } else {
        toast.error(response?.data?.error || "Dispatch failed");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error("Dispatch error:", error);
      toast.error(error?.response?.data?.error || "Dispatch failed");
    }
  };

  const handleJoNotOk = async (items: QcRow[]) => {
    if (!items || items.length === 0) {
      toast.error("No items to process.");
      return;
    }

    const firstItem = items[0];
    const jobType = filterParam;
    const jobId = firstItem?.job_id || firstItem?.job?.id;
    
    if (!jobId) {
      toast.error("Job ID not found");
      return;
    }
    
    let displayIdentifier = null;
    if (jobType === "TSO_SERVICE") {
      displayIdentifier = firstItem?.tso_no || firstItem?.job?.tso_no;
    } else {
      displayIdentifier = firstItem?.job?.jo_number || firstItem?.jo_no;
    }
    
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity_no) || 0), 0);
    
    const { value: selectedData } = await Swal.fire({
      title: `Select Items & Quantity to Mark as NOT OK`,
      html: `
        <div class="text-left">
          <div class="bg-red-50 p-3 rounded-lg mb-4">
            <p class="font-semibold">${jobType === "TSO_SERVICE" ? "TSO" : "JO"}: <span class="text-red-600">${displayIdentifier}</span></p>
            <p class="text-sm text-gray-600">Total Quantity Available: <span class="font-bold">${totalQuantity}</span></p>
          </div>
          
          <div class="mb-3">
            <p class="text-sm font-semibold text-gray-700 mb-2">Select items and quantity to mark as NOT OK:</p>
            <div class="max-h-80 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              ${items.map((item, idx) => `
                <div class="item-row p-3 border-b border-gray-200 hover:bg-gray-100">
                  <div class="flex items-center gap-3 mb-2">
                    <input type="checkbox" class="item-checkbox" data-id="${item.id}" data-max="${item.quantity_no}" data-serial="${item.serial_no}" ${idx === 0 ? 'checked' : ''}>
                    <div class="flex-1">
                      <span class="font-mono font-medium">${item.serial_no || 'N/A'}</span>
                      <span class="text-gray-500 ml-2">(Total Qty: ${item.quantity_no || 0})</span>
                    </div>
                  </div>
                  <div class="ml-7">
                    <label class="text-xs text-gray-600">Not OK Quantity:</label>
                    <input type="number" class="notok-qty ml-2 px-2 py-1 border rounded text-sm w-24" data-id="${item.id}" value="${item.quantity_no}" min="1" max="${item.quantity_no}" ${idx === 0 ? '' : 'disabled'}>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason <span class="text-red-500">*</span></label>
            <textarea id="reason" class="swal2-textarea w-full" rows="3" placeholder="Enter reason..." required></textarea>
          </div>
        </div>
      `,
      width: '650px',
      showCancelButton: true,
      confirmButtonText: `Mark as NOT OK`,
      confirmButtonColor: "#d33",
      didOpen: () => {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        const qtyInputs = document.querySelectorAll('.notok-qty');
        checkboxes.forEach((cb, index) => {
          cb.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            const qtyInput = qtyInputs[index] as HTMLInputElement;
            if (qtyInput) {
              qtyInput.disabled = !isChecked;
              if (!isChecked) qtyInput.value = '0';
              else qtyInput.value = qtyInput.getAttribute('data-max') || '1';
            }
          });
        });
      },
      preConfirm: () => {
        const checkboxes = document.querySelectorAll('.item-checkbox:checked');
        if (checkboxes.length === 0) {
          Swal.showValidationMessage("Please select at least one item");
          return false;
        }
        
        const reason = (document.getElementById("reason") as HTMLTextAreaElement)?.value;
        if (!reason?.trim()) {
          Swal.showValidationMessage("Reason is required!");
          return false;
        }
        
        const selectedItems: any[] = [];
        checkboxes.forEach((cb) => {
          const itemId = (cb as HTMLInputElement).getAttribute('data-id');
          const maxQty = parseInt((cb as HTMLInputElement).getAttribute('data-max') || '0');
          const qtyInput = document.querySelector(`.notok-qty[data-id="${itemId}"]`) as HTMLInputElement;
          let notOkQty = qtyInput ? parseInt(qtyInput.value) : maxQty;
          if (isNaN(notOkQty)) notOkQty = 0;
          if (notOkQty > maxQty) notOkQty = maxQty;
          if (notOkQty > 0) {
            selectedItems.push({ assignment_id: itemId, quantity: notOkQty });
          }
        });
        
        if (selectedItems.length === 0) {
          Swal.showValidationMessage("Please enter valid quantity for at least one item");
          return false;
        }
        
        return { items: selectedItems, reason: reason.trim() };
      },
    });

    if (!selectedData) return;

    const loadingToast = toast.loading(`Marking items as NOT OK...`);
    const updated_by = storage.getUserId();

    try {
      const response = await axiosProvider.post(`/fineengg_erp/system/jobs/${jobId}/not-ok`, {
        items: selectedData.items,
        reason: selectedData.reason,
        updated_by: updated_by,
      });

      toast.dismiss(loadingToast);
      
      if (response?.data?.success) {
        toast.warning(response.data.message);
        fetchData();
        setSelectedJobNo(null);
      } else {
        toast.error(response?.data?.error || "Failed to mark as NOT OK");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error?.response?.data?.error || "Failed to mark as NOT OK");
    }
  };

  const handleJoRework = async (items: QcRow[]) => {
    if (!items || items.length === 0) {
      toast.error("No items to process.");
      return;
    }

    const joNo = items[0]?.job?.jo_number || "Unknown";

    const { value: reason } = await Swal.fire({
      title: "Send JO for Rework",
      html: `
        <p>Sending JO: <strong>${joNo}</strong> for rework</p>
        <p class="text-sm text-gray-600 mt-2">Items in this JO: ${items.length}</p>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for rework...",
      showCancelButton: true,
      confirmButtonText: "Yes, Send to Rework",
      confirmButtonColor: "#ef4444",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!reason) return;

    const updated_by = storage.getUserId();

    if (!updated_by) {
      toast.error("User not found");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/reject`, {
          updated_by,
        });
        successCount++;
      } catch (error: any) {
        console.error(`Failed to reject item ${item.serial_no}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} item(s) from JO ${joNo} sent for rework`);
    }
    if (failCount > 0) {
      toast.error(`Failed to process ${failCount} item(s)`);
    }

    fetchData();
  };

  const handleSingleItemRework = async (item: QcRow) => {
    if (!item) return;

    const joNo = item.job?.jo_number || "Unknown";

    const { value: reason } = await Swal.fire({
      title: "Send Item for Rework",
      html: `
        <p>Serial: <strong>${item.serial_no || "N/A"}</strong></p>
        <p class="text-sm text-gray-600 mt-2">JO: ${joNo}</p>
      `,
      input: "textarea",
      inputPlaceholder: "Enter reason for rework...",
      showCancelButton: true,
      confirmButtonText: "Yes, Send to Rework",
      confirmButtonColor: "#ef4444",
      inputValidator: (value) => {
        if (!value) return "Reason is required!";
        return null;
      },
    });

    if (!reason) return;

    const updated_by = storage.getUserId();

    if (!updated_by) {
      toast.error("User not found");
      return;
    }

    try {
      await axiosProvider.post(`/fineengg_erp/system/assign-to-worker/${item.id}/reject`, {
        updated_by,
      });

      toast.success(`Item ${item.serial_no} sent for rework`);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Rework failed");
    }
  };

  const QcContent = () => (
    <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px] rounded p-4 mt-0 relative">
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

      <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
        <div className="mb-4 px-2">
          <h1 className="text-xl font-semibold text-firstBlack">
            QC • {filterParam.replace("_", " ")}
            {client && ` • ${client}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className="font-semibold">ready-for-qc</span>
          </p>
        </div>

        {uniqueCategories.length > 0 && (
          <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full mb-6">
            <button
              onClick={() => {
                if (filterParam === "JOB_SERVICE") setJobServiceCategoryFilter("ALL");
                if (filterParam === "TSO_SERVICE") setTsoSubFilter("ALL");
                if (filterParam === "KANBAN") setKanbanSubFilter("ALL");
              }}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                filterParam === "JOB_SERVICE"
                  ? jobServiceCategoryFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  : filterParam === "TSO_SERVICE"
                  ? tsoSubFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  : filterParam === "KANBAN"
                  ? kanbanSubFilter === "ALL"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>

            {uniqueCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  if (filterParam === "JOB_SERVICE") setJobServiceCategoryFilter(cat.value);
                  if (filterParam === "TSO_SERVICE") setTsoSubFilter(cat.value);
                  if (filterParam === "KANBAN") setKanbanSubFilter(cat.value);
                }}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filterParam === "JOB_SERVICE"
                    ? jobServiceCategoryFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : filterParam === "TSO_SERVICE"
                    ? tsoSubFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : filterParam === "KANBAN"
                    ? kanbanSubFilter === cat.value
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative overflow-x-auto sm:rounded-lg">
          {selectedJobNo ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedJobNo(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FaArrowLeft />
                  Back to Jobs
                </button>
              </div>

              <h2 className="text-xl font-bold mb-4">
                {filterParam === "TSO_SERVICE"
                  ? "TSO"
                  : filterParam === "KANBAN"
                  ? "J/O Number"
                  : "Job"}
                : {selectedJobNo}
              </h2>

              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder bg-gray-50">
                    <th className="p-3 border border-tableBorder font-semibold">JO No</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">Serial No</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">Item No</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">Item Description</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">MOC</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Qty</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">Assigning Date</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(getJoGroupsForIdentifier(selectedJobNo)).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center border border-tableBorder">
                        <p className="text-[#666666] text-base">No JO data found</p>
                      </td>
                    </tr>
                  ) : (
                    Object.entries(getJoGroupsForIdentifier(selectedJobNo)).map(([jo, items]) => (
                      <Fragment key={jo}>
                        <tr className="border border-tableBorder bg-gray-100">
                          <td className="px-3 py-2 border border-tableBorder font-semibold" colSpan={3}>
                            JO: {jo}
                          </td>
                          <td className="px-3 py-2 border border-tableBorder" colSpan={2}>
                            <span className="text-xs text-gray-600">{items.length} item(s)</span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <span className="text-xs font-semibold text-green-600">
                              Total: {items.reduce((sum, i) => sum + (Number(i.quantity_no) || 0), 0)}
                            </span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder" colSpan={2}>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleJoOK(items)}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                              >
                                Dispatch JO
                              </button>
                              <button
                                onClick={() => handleJoNotOk(items)}
                                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
                              >
                                Not OK JO
                              </button>
                              <button
                                onClick={() => handleJoRework(items)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Rework JO
                              </button>
                            </div>
                          </td>
                        </tr>

                        {items.map((item) => (
                          <tr key={item.id} className="border border-tableBorder bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 border border-tableBorder"> </td>
                            <td className="px-3 py-2 border border-tableBorder font-mono text-sm">
                              {item.serial_no || "-"}
                            </td>
                            <td className="px-3 py-2 border border-tableBorder">
                              {item.item_no ?? "-"}
                            </td>
                            <td className="px-3 py-2 border border-tableBorder text-sm">
                              {item.job?.item_description || "-"}
                            </td>
                            <td className="px-3 py-2 border border-tableBorder">
                              {item.job?.moc || "-"}
                            </td>
                            <td className="px-3 py-2 border border-tableBorder text-center">
                              <span className="font-semibold text-blue-600">{item.quantity_no ?? "-"}</span>
                            </td>
                            <td className="px-3 py-2 border border-tableBorder">
                              {item.assigning_date || "-"}
                            </td>
                            <td className="px-3 py-2 border border-tableBorder text-center">
                              <button
                                onClick={() => handleSingleItemRework(item)}
                                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                title={`Rework: ${item.serial_no || "N/A"}`}
                              >
                                Rework
                              </button>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {filterParam === "TSO_SERVICE"
                    ? "TSOs Ready for QC"
                    : filterParam === "KANBAN"
                    ? "Kanban Ready for QC"
                    : "Jobs Ready for QC"}
                </h2>
                
                {jobIdentifiers.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsMultiSelectMode(!isMultiSelectMode);
                        if (isMultiSelectMode) {
                          setSelectedJobs(new Set());
                        }
                      }}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        isMultiSelectMode 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isMultiSelectMode ? 'Exit Multi-Select' : 'Multi-Select Mode'}
                    </button>
                    
                    {isMultiSelectMode && selectedJobs.size > 0 && (
                      <button
                        onClick={handleBulkDispatch}
                        className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 flex items-center gap-2"
                      >
                        🚚 Dispatch Selected ({selectedJobs.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isMultiSelectMode && selectedJobs.size > 0 && (
                <div className="mb-3 p-2 bg-green-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-green-700">
                    ✓ {selectedJobs.size} JO(s) selected for dispatch
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {selectedJobs.size === jobIdentifiers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}

              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder bg-gray-50">
                    {isMultiSelectMode && (
                      <th className="p-3 border border-tableBorder w-10">
                        <input
                          type="checkbox"
                          checked={selectedJobs.size === jobIdentifiers.length && jobIdentifiers.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="p-3 border border-tableBorder font-semibold">
                      {filterParam === "TSO_SERVICE"
                        ? "TSO No"
                        : filterParam === "KANBAN"
                        ? "J/O Number"
                        : "Job No"}
                    </th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">Job Category</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Total JO</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold text-center">Total Quantity</th>
                    <th className="px-3 py-2 border border-tableBorder font-semibold">Assigning Date</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={isMultiSelectMode ? 6 : 5} className="px-4 py-6 text-center border border-tableBorder">
                        <div className="flex justify-center items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                          <p className="text-[#666666] text-base">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : jobIdentifiers.length === 0 ? (
                    <tr>
                      <td colSpan={isMultiSelectMode ? 6 : 5} className="px-4 py-6 text-center border border-tableBorder">
                        <p className="text-[#666666] text-base">No data found</p>
                      </td>
                    </tr>
                  ) : (
                    jobIdentifiers.map((identifier) => {
                      const summary = jobSummary[identifier];
                      const isSelected = selectedJobs.has(identifier);

                      return (
                        <tr
                          key={identifier}
                          className={`border border-tableBorder cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-green-50 hover:bg-green-100' 
                              : 'bg-white hover:bg-primary-50'
                          }`}
                          onClick={() => {
                            if (isMultiSelectMode) {
                              toggleJobSelection(identifier);
                            } else {
                              setSelectedJobNo(identifier);
                            }
                          }}
                        >
                          {isMultiSelectMode && (
                            <td className="px-3 py-2 border border-tableBorder text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleJobSelection(identifier)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className={`text-base leading-normal ${!isMultiSelectMode ? 'text-blue-600 font-medium' : ''}`}>
                              {identifier}
                            </p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base">{summary.jobCategory}</p>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {summary.uniqueJoCount}
                            </span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder text-center">
                            <span className="font-semibold text-green-600">{summary.totalQty}</span>
                          </td>
                          <td className="px-3 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base">{summary.assigningDate || "-"}</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-4 px-2 flex justify-between items-center">
          <div>
            Total {filterParam === "TSO_SERVICE" ? "TSOs" : filterParam === "KANBAN" ? "J/O Numbers" : "Jobs"}: <span className="font-semibold">{jobIdentifiers.length}</span> | Total Items: <span className="font-semibold">{filteredData.length}</span>
          </div>
          <div className="text-gray-400">
            💡 Click on any row to view details
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <PageGuard requiredPermission="qc.view">
        <QcContent />
      </PageGuard>
    </div>
  );
}