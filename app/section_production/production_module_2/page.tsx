"use client";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import LeftSideBar from "../../component/LeftSideBar";
import { useRouter, useSearchParams } from "next/navigation";
import DesktopHeader from "../../component/DesktopHeader";
import AxiosProvider from "../../../provider/AxiosProvider";
import { FiSearch } from "react-icons/fi";
import { normalizeUrgent, urgentBadgeClass } from "../../component/utils/permissionUtils";

const axiosProvider = new AxiosProvider();

// Options for TSO Service Category
const tsoServiceCategory = [
  { value: "drawing", label: "Drawing" },
  { value: "sample", label: "Sample" },
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const activeFilter = "TSO_SERVICE";
  const [tsoSubFilter, setTsoSubFilter] = useState<string>("ALL");

  const router = useRouter();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  //const urgentParam = searchParams.get("urgent");
  const assignToParam = searchParams.get("assign_to");

  const getPaginationFromResponse = (response: any, requestedPage: number) => {
    const meta = response?.data?.meta || {};
    const resolvedTotalPages =
      Number(meta.totalPages) ||
      Number(meta.total_pages) ||
      Number(meta.lastPage) ||
      Number(meta.last_page) ||
      1;
    const resolvedPage =
      Number(meta.page) ||
      Number(meta.currentPage) ||
      Number(meta.current_page) ||
      requestedPage;

    return {
      totalPages: Math.max(1, resolvedTotalPages),
      page: Math.max(1, resolvedPage),
    };
  };

  const filteredData = useMemo(() => {
    let dataToFilter = data;

    if (tsoSubFilter !== "ALL") {
      dataToFilter = data.filter((item) => {
        const category = item.job_category || item.job?.job_category || "";
        return category === tsoSubFilter;
      });
    }

    const uniqueData: any[] = [];
    const seenTsoNos = new Set<string>();

    dataToFilter.forEach((item) => {
      if (item.tso_no && !seenTsoNos.has(item.tso_no)) {
        seenTsoNos.add(item.tso_no);
        uniqueData.push(item);
      } else if (!item.tso_no) {
        uniqueData.push(item);
      }
    });

    return uniqueData;
  }, [data, tsoSubFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 500);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const endpoint = "/fineengg_erp/system/jobs";
      const params = new URLSearchParams();

      if (clientParam) {
        params.append("client_name", clientParam);
      }
      if (assignToParam) {
        params.append("assign_to", assignToParam);
      }
      if (searchTerm.trim()) {
        params.append("tso_no", searchTerm.trim());
      }
      params.append("page", String(currentPage));
      // if (urgentParam === "true") {
      //   params.append("is_urgent", "true");
      // }

      params.append("job_type", "TSO_SERVICE");

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      try {
        const response = await axiosProvider.get(url);
        if (isMounted) {
          const fetchedData = Array.isArray(response.data.data) ? response.data.data : [];
          setData(fetchedData);
          const pagination = getPaginationFromResponse(response, currentPage);
          setTotalPages(pagination.totalPages);
          setCurrentPage(pagination.page);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) setData([]);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [clientParam, assignToParam, currentPage, searchTerm /*, urgentParam */]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tsoSubFilter, searchTerm, clientParam, assignToParam]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      {/* PageGuard only for content, not for sidebar */}
    
        {/* Main content right section */}
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
          {/* left section top row */}
          <DesktopHeader />

          {/* Main content middle section */}
          <div className="rounded-3xl shadow-lastTransaction bg-white px-1 py-6 md:p-6 relative">
            {/* Search and filter table row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 w-full mx-auto">
              <div className="flex items-center gap-4 max-w-full min-w-0">
                {/* TSO Service Tabs */}
                <FilterTabs
                  options={tsoServiceCategory}
                  activeTab={tsoSubFilter}
                  onTabClick={setTsoSubFilter}
                />
              </div>
              <div className="flex items-center w-full sm:w-[320px] rounded-lg border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-primary-600">
                <input
                  type="text"
                  placeholder="Search TSO no..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full py-2.5 px-4 pr-10 text-sm focus:outline-none bg-transparent"
                />
                <div className="pr-3 text-gray-400">
                  <FiSearch className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto overflow-y-auto sm:rounded-lg max-h-[500px] border border-tableBorder">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999] [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-50">
                  <tr className="border border-tableBorder">
                    <th scope="col" className="p-3 border border-tableBorder">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-firstBlack text-base leading-normal">
                          TSO No
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
                      <tr
                        className="border border-tableBorder bg-white hover:bg-primary-100"
                        key={item.id}
                      >
                        <td className="px-2 py-2 border border-tableBorder">
                          <p
                            onClick={() =>
                              router.push(
                                `/section_production/production_module_2/${encodeURIComponent(item.tso_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}&assign_to=${encodeURIComponent(assignToParam || "")}`
                              )
                            }
                            className={`text-base leading-normal cursor-pointer underline ${
                              normalizeUrgent(item.urgent) === "Urgent"
                                ? "text-red-600 hover:text-red-700"
                                : "text-blue-600 hover:text-blue-800"
                            }`}
                          >
                            {item.tso_no || "N/A"}
                          </p>
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
                            className={`px-2 py-1 rounded text-sm ${urgentBadgeClass(normalizeUrgent(item.urgent))}`}
                          >
                            {normalizeUrgent(item.urgent)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredData.length > 0 && (
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
  );
}