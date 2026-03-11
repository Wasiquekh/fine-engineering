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

interface FilterTab {
  value: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterTab[];
  activeTab: string;
  onTabClick: (value: string) => void;
  showAllTab?: boolean;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ options, activeTab, onTabClick, showAllTab = true }) => (
  <div className="flex items-center gap-2 p-1 rounded-lg border border-gray-200 bg-white overflow-x-auto max-w-full">
    {showAllTab && (
      <button
        onClick={() => onTabClick("ALL")}
        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
          activeTab === "ALL" ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        All
      </button>
    )}
    {options.map((cat) => (
      <button
        key={cat.value}
        onClick={() => onTabClick(cat.value)}
        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
          activeTab === cat.value ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {cat.label}
      </button>
    ))}
  </div>
);

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState<string>("ALL");
  const [tsoSubFilter, setTsoSubFilter] = useState<string>("ALL");
  const [kanbanSubFilter, setKanbanSubFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<any[]>([]);
  const lastFetchedEndpoint = useRef<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const clientParam = searchParams.get("client");
  const urgentParam = searchParams.get("urgent");
  const assignToParam = searchParams.get("assign_to");

  // This module should always display jobs, not a category summary.
  const isCategoriesDataset = false;

  useEffect(() => {
    if (filterParam) {
      // Update active filter if a valid param is present
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  const filteredData = useMemo(() => {
    // With backend filtering, the data is pre-filtered. We only need to
    // handle tasks like de-duplication on the client side.
    // De-duplicate by job_no to show only one entry per job
    const uniqueData: any[] = [];
    const seenJobNos = new Set<string>();

    data.forEach((item) => {
      if (item.job_no && !seenJobNos.has(item.job_no)) {
        seenJobNos.add(item.job_no);
        uniqueData.push(item);
      } else if (!item.job_no) {
        uniqueData.push(item);
      }
    });

    return uniqueData;
  }, [data]);

  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams();
      if (clientParam) {
        params.append("client_name", clientParam);
      }
      if (assignToParam) {
        params.append("assign_to", assignToParam);
      }
      let url = "/fineengg_erp/categories";
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      const response = await axiosProvider.get(url);
      if (response.data && response.data.data) {
        const cats = Array.isArray(response.data.data) ? response.data.data : response.data.data.categories || [];
        const uniqueCategories = Array.from(
          new Map( // Using Array.from to explicitly convert MapIterator to Array
            cats.map((cat: any) => [
              cat.job_category,
              { value: cat.job_category, label: cat.job_category }
            ])
          ).values() // .values() returns a MapIterator
        );

        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [clientParam, assignToParam]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // This component always fetches jobs. Categories are for filter tabs only.
      const endpoint = "/fineengg_erp/jobs";
      const params = new URLSearchParams();

      if (clientParam) {
        params.append("client_name", clientParam);
      }
      if (assignToParam) {
        params.append("assign_to", assignToParam);
      }
      if (urgentParam === "true") {
        params.append("is_urgent", "true");
      }

      if (activeFilter !== "ALL") {
        params.append("job_type", activeFilter);

        // Add the appropriate sub-filter for job_category
        if (activeFilter === "JOB_SERVICE" && jobServiceCategoryFilter !== "ALL") {
          params.append("job_category", jobServiceCategoryFilter);
        } else if (activeFilter === "TSO_SERVICE" && tsoSubFilter !== "ALL") {
          params.append("job_category", tsoSubFilter);
        } else if (activeFilter === "KANBAN" && kanbanSubFilter !== "ALL") {
          params.append("job_category", kanbanSubFilter);
        }
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      if (lastFetchedEndpoint.current === url) {
        return;
      }
      lastFetchedEndpoint.current = url;

      // Clear data for new fetch to show loading state
      setData([]);

      try {
        const response = await axiosProvider.get(url);
        if (isMounted) {
          const fetchedData = Array.isArray(response.data.data) ? response.data.data : [];
          setData(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) setData([]); // Clear data on error
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeFilter, clientParam, assignToParam, urgentParam, jobServiceCategoryFilter, tsoSubFilter, kanbanSubFilter]);

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
                  <FilterTabs
                    options={tsoServiceCategory}
                    activeTab={tsoSubFilter}
                    onTabClick={setTsoSubFilter}
                  />
                )}
                {/* Kanban Tabs */}
                {activeFilter === "KANBAN" && (
                  <FilterTabs
                    options={kanbanCategory}
                    activeTab={kanbanSubFilter}
                    onTabClick={setKanbanSubFilter}
                  />
                )}
                {/* Job Service Tabs */}
                {activeFilter === "JOB_SERVICE" && (
                  <FilterTabs
                    options={categories}
                    activeTab={jobServiceCategoryFilter}
                    onTabClick={setJobServiceCategoryFilter}
                  />
                )}
              </div>

            </div>

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
                  <tr className="border border-tableBorder">
                    {isCategoriesDataset ? (
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
                          Job No
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
                      isCategoriesDataset ? (
                        <tr
                          className="border border-tableBorder bg-white hover:bg-primary-100"
                          key={item.id}
                        >
                          <td className="px-2 py-2 border border-tableBorder">
                            <p
                            onClick={() =>
                                router.push(
                                  `/production_module/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}`
                                )
                              }
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
                          {item.job_no ? (
                            <p
                              onClick={() =>
                                router.push(
                                  `/production_module/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}`
                                )
                              }
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