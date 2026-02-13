"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import LeftSideBar from "../component/LeftSideBar";
import { useRouter, useSearchParams } from "next/navigation";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

// Options for TSO Service Category
const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
];

// Options for Kanban Category - UPDATED based on API validation
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

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [currentDataset, setCurrentDataset] = useState<"JOBS" | "CATEGORIES">("JOBS");
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState<string>("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState<string>("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<any[]>([]);
  const [usmaanJobNos, setUsmaanJobNos] = useState<string[]>([]);
  const lastFetchedEndpoint = useRef<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const clientParam = searchParams.get("client");
  const urgentParam = searchParams.get("urgent");

  useEffect(() => {
    if (filterParam) {
      // Update active filter if a valid param is present
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    fetchUsmaanJobNos();
  }, []);

  const filteredData = useMemo(() => {
    let currentData = data;

    if (usmaanJobNos.length > 0) {
      currentData = currentData.filter((item) => usmaanJobNos.includes(item.job_no));
    }

    if (urgentParam === "true") {
      currentData = currentData.filter((item) => item.urgent || item.is_urgent);
    }

    if (currentDataset === "CATEGORIES") {
      if (jobServiceCategoryFilter === "URGENT_TAB") {
        return currentData.filter((item) => item.urgent || item.is_urgent);
      }
      if (jobServiceCategoryFilter !== "ALL") {
        return currentData.filter((item) => item.job_category === jobServiceCategoryFilter);
      }
      return currentData;
    }

    if (clientParam) {
      currentData = currentData.filter((item) => item.client_name === clientParam);
    }

    if (activeFilter === "JOB_SERVICE") {
      return currentData.filter((item) => {
        if (item.job_type !== "JOB_SERVICE") return false;
        if (jobServiceCategoryFilter === "URGENT_TAB") {
          return item.urgent;
        }
        if (jobServiceCategoryFilter !== "ALL" && item.job_category !== jobServiceCategoryFilter) return false;
        return true;
      });
    }
    if (activeFilter === "TSO_SERVICE") {
      const tsoData = currentData.filter((item) => {
        if (item.job_type !== "TSO_SERVICE") return false;
        if (tsoSubFilter === "ALL") return true;
        return item.job_category === tsoSubFilter;
      });

      const uniqueTsoData: any[] = [];
      const seenTsoNos = new Set();

      tsoData.forEach((item) => {
        if (item.tso_no && !seenTsoNos.has(item.tso_no)) {
          seenTsoNos.add(item.tso_no);
          uniqueTsoData.push(item);
        } else if (!item.tso_no) {
          uniqueTsoData.push(item);
        }
      });

      return uniqueTsoData;
    }
    if (activeFilter === "KANBAN") {
      return currentData.filter((item) => {
        if (item.job_type !== "KANBAN") return false;
        if (kanbanSubFilter === "ALL") return true;
        return item.job_category === kanbanSubFilter;
      });
    }
    if (activeFilter === "ALL") {
      return currentData;
    }
    return currentData.filter((item) => item.job_type === activeFilter);
  }, [data, activeFilter, tsoSubFilter, kanbanSubFilter, jobServiceCategoryFilter, clientParam, currentDataset, urgentParam, usmaanJobNos]);

  const fetchUsmaanJobNos = async () => {
  try {
    const res = await axiosProvider.get(
      "/fineengg_erp/jobs?assign_to=Usmaan&limit=1000"
    );

    const jobNos = Array.isArray(res.data.data)
      ? res.data.data.map((job: any) => job.job_no)
      : [];

    setUsmaanJobNos(jobNos);
  } catch (err) {
    console.error("Failed to fetch Usmaan jobs", err);
  }
};

  const fetchCategories = async () => {
    try {
      const response = await axiosProvider.get("/fineengg_erp/categories");
      if (response.data && response.data.data) {
        const cats = Array.isArray(response.data.data) ? response.data.data : response.data.data.categories || [];
        const formattedCats = cats.map((cat: any) => ({
          value: cat.job_category,
          label: cat.job_category
        }));
        setCategories(formattedCats);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      let endpoint = "/fineengg_erp/jobs";
      let dataset: "JOBS" | "CATEGORIES" = "JOBS";

      if (activeFilter === "JOB_SERVICE") {
        endpoint = "/fineengg_erp/categories";
        dataset = "CATEGORIES";
      }

      if (lastFetchedEndpoint.current === endpoint) {
        return;
      }

      if (currentDataset !== dataset) {
        setCurrentDataset(dataset);
        setData([]);
      }

      try {
        const response = await axiosProvider.get(endpoint);
        if (isMounted) {
          const fetchedData = Array.isArray(response.data.data) ? response.data.data : [];
          setData(fetchedData);
          lastFetchedEndpoint.current = endpoint;

          // if (endpoint.includes("/fineengg_erp/jobs")) {
          //   const usmaanJobs = fetchedData
          //     .filter((job: any) => job.assign_to === "Usmaan")
          //     .map((job: any) => job.job_no);
          //   setUsmaanJobNos(usmaanJobs);
          // }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  return (
    <>
      <div className="flex justify-end min-h-screen">
        <LeftSideBar />
        {/* Main content right section */}
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
          {/* left section top row */}
          <DesktopHeader />

          {/* Main content middle section */}
          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
            {/* Search and filter table row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
              <div className="flex items-center gap-4 max-w-full min-w-0">
                {/* TSO Service Tabs */}
                {activeFilter === "TSO_SERVICE" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => setTsoSubFilter("ALL")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        tsoSubFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {tsoServiceCategory.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setTsoSubFilter(cat.value)}
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          tsoSubFilter === cat.value
                            ? "bg-primary-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* Kanban Tabs */}
                {activeFilter === "KANBAN" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => setKanbanSubFilter("ALL")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        kanbanSubFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {kanbanCategory.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setKanbanSubFilter(cat.value)}
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          kanbanSubFilter === cat.value
                            ? "bg-primary-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
                {/* Job Service Tabs */}
                {activeFilter === "JOB_SERVICE" && (
                  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
                    <button
                      onClick={() => setJobServiceCategoryFilter("ALL")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        jobServiceCategoryFilter === "ALL"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setJobServiceCategoryFilter(cat.value)}
                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                          jobServiceCategoryFilter === cat.value
                            ? "bg-primary-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    {/* <button
                      onClick={() => setJobServiceCategoryFilter("URGENT_TAB")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        jobServiceCategoryFilter === "URGENT_TAB"
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Urgent
                    </button> */}
                  </div>
                )}
              </div>

            </div>

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    {currentDataset === "CATEGORIES" ? (
                      <>
                        <th scope="col" className="p-3 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Job No
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Job Category
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
                              Material Type
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
                              Bar
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Temperature
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Due Date
                            </div>
                          </div>
                        </th>
                        <th scope="col" className="px-2 py-0 border border-tableBorder">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-firstBlack text-base leading-normal">
                              Status
                            </div>
                          </div>
                        </th>
                      </>
                    ) : (
                      <>
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          {activeFilter === "TSO_SERVICE" ? "TSO No" : "Job No"}
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          J/O Number
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job Type
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Job Category
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Item Description
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Item No
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Quantity
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          MOC
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder hidden sm:table-cell"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Bin Location
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-0 border border-tableBorder"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          Status
                        </div>
                      </div>
                    </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item: any) => (
                      currentDataset === "CATEGORIES" ? (
                        <tr
                          className="border border-tableBorder bg-white hover:bg-primary-100"
                          key={item.id}
                        >
                          <td className="px-2 py-2 border border-tableBorder">
                            <p
                            onClick={() => router.push(`/production_module_2/${encodeURIComponent(item.job_no)}`)}
                              className={`text-base leading-normal cursor-pointer underline ${
                                item.urgent || item.is_urgent
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.job_category}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.description}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.material_type}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.qty}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.bar}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.tempp}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <p className="text-[#232323] text-base leading-normal">{item.urgent_due_date || "-"}</p>
                          </td>
                          <td className="px-2 py-2 border border-tableBorder">
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                item.urgent || item.is_urgent
                                  ? "bg-red-100 text-red-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {item.urgent || item.is_urgent ? "Urgent" : "Normal"}
                            </span>
                          </td>
                        </tr>
                      ) : (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          {activeFilter === "TSO_SERVICE" ? (
                            <p
                              onClick={() => router.push(`/tso_details/${encodeURIComponent(item.tso_no)}`)}
                              className={`text-base leading-normal cursor-pointer underline ${
                                item.urgent_due_date &&
                                new Date(item.urgent_due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.tso_no || "N/A"}
                            </p>
                          ) : item.job_no ? (
                            <p
                              onClick={() => router.push(`/production_planning/${encodeURIComponent(item.job_no)}`)}
                              className={`text-base leading-normal cursor-pointer underline ${
                                item.urgent_due_date &&
                                new Date(item.urgent_due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          ) : (
                            <p className="text-[#232323] text-base leading-normal">N/A</p>
                          )}
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.jo_number || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_type}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.job_category || "N/A"}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.item_description}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.item_no}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.qty}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.moc}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder hidden sm:table-cell">
                          <p className="text-[#232323] text-base leading-normal">
                            {item.bin_location}
                          </p>
                        </td>
                        <td className="px-2 py-2 border border-tableBorder">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              item.urgent
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {item.urgent ? "Urgent" : "Normal"}
                          </span>
                        </td>
                      </tr>
                      )
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}