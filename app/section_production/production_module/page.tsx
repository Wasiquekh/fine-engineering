"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import { useRouter, useSearchParams } from "next/navigation";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { FiSearch } from "react-icons/fi";

const axiosProvider = new AxiosProvider();
const ITEMS_PER_PAGE = 20;

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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const activeFilter = "JOB_SERVICE";
  const [jobServiceCategoryFilter, setJobServiceCategoryFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<any[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  //const urgentParam = searchParams.get("urgent");
  const assignToParam = searchParams.get("assign_to");

  const filteredData = useMemo(() => {
    let dataToFilter = data;

    if (jobServiceCategoryFilter !== "ALL") {
      dataToFilter = data.filter((item) => {
        const category = item.job_category || item.job?.job_category || "";
        return category === jobServiceCategoryFilter;
      });
    }

    // With backend filtering, the data is pre-filtered. We only need to
    // handle tasks like de-duplication on the client side.
    // De-duplicate by job_no to show only one entry per job.
    // Using a Map is a cleaner way to get unique items by a key.
    const uniqueJobs = new Map<string, any>();
    const itemsWithoutJob: any[] = [];

    dataToFilter.forEach((item) => {
      if (item.job_no) {
        if (!uniqueJobs.has(item.job_no)) {
          uniqueJobs.set(item.job_no, item);
        }
      } else {
        itemsWithoutJob.push(item);
      }
    });

    return [...Array.from(uniqueJobs.values()), ...itemsWithoutJob];
  }, [data, jobServiceCategoryFilter]);

  const searchedData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return filteredData;

    return filteredData.filter((item: any) => {
      const searchableValues = [
        item.job_no,
        item.job_category,
        item.description,
        item.material_type,
        item.qty,
        item.bar,
        item.tempp,
      ];
      return searchableValues.some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
    });
  }, [filteredData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(searchedData.length / ITEMS_PER_PAGE));

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchedData, currentPage]);

  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams();
      if (clientParam) {
        params.append("client_name", clientParam);
      }
      if (assignToParam) {
        params.append("assign_to", assignToParam);
      }
      let url = "/fineengg_erp/system/categories";
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
    setCurrentPage(1);
  }, [jobServiceCategoryFilter, searchTerm, clientParam, assignToParam]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const endpoint = "/fineengg_erp/system/categories";
      const params = new URLSearchParams();

      if (clientParam) {
        params.append("client_name", clientParam);
      }
      if (assignToParam) {
        params.append("assign_to", assignToParam);
      }
      // if (urgentParam === "true") {
      //   params.append("is_urgent", "true");
      // }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
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
  }, [clientParam, assignToParam /*, urgentParam */]);

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
                {/* Job Service Tabs */}
                <FilterTabs
                  options={categories}
                  activeTab={jobServiceCategoryFilter}
                  onTabClick={setJobServiceCategoryFilter}
                />
              </div>
              <div className="flex items-center w-full sm:w-[320px] rounded-lg border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-primary-600">
                <input
                  type="text"
                  placeholder="Search Job no, category, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2.5 px-4 pr-10 text-sm focus:outline-none bg-transparent"
                />
                <div className="pr-3 text-gray-400">
                  <FiSearch className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto overflow-y-auto sm:rounded-lg max-h-[500px] border border-tableBorder">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-xs text-gray-700 uppercase font-semibold bg-gray-50 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-50">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="px-4 py-4 border border-tableBorder whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Job No
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Job Category
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Description
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Material Type
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Quantity
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Bar
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Temperature
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Due Date
                        </div>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-4 border border-tableBorder whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">
                          Status
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center border border-tableBorder"
                      >
                        <p className="text-[#666666] text-base">
                          No data found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item: any) => (
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-4 py-3 border border-tableBorder">
                          {item.job_no ? (
                            <p
                              onClick={() =>
                                router.push(
                                  `/section_production/production_module/${encodeURIComponent(item.job_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}&assign_to=${encodeURIComponent(assignToParam || "")}`
                                )
                              }
                              className={`text-sm font-medium leading-normal cursor-pointer underline ${
                                item.is_urgent
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-blue-600 hover:text-blue-800"
                              }`}
                            >
                              {item.job_no}
                            </p>
                          ) : (
                            <p className="text-[#232323] text-sm leading-normal">N/A</p>
                          )}
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm leading-normal">{item.job_category || "N/A"}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm leading-normal">{item.description}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm leading-normal">{item.material_type}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm font-semibold text-yellow-600 leading-normal">{item.qty}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm leading-normal">{item.bar}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm leading-normal">{item.tempp}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <p className="text-[#232323] text-sm leading-normal">{item.urgent_due_date || "-"}</p>
                        </td>
                        <td className="px-4 py-3 border border-tableBorder">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              item.is_urgent
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {item.is_urgent ? "Urgent" : "Normal"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {searchedData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
}