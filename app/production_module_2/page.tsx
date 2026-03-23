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
  const activeFilter = "TSO_SERVICE";
  const [tsoSubFilter, setTsoSubFilter] = useState<string>("ALL");

  const router = useRouter();
  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const urgentParam = searchParams.get("urgent");
  const assignToParam = searchParams.get("assign_to");

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
      if (urgentParam === "true") {
        params.append("is_urgent", "true");
      }

      params.append("job_type", "TSO_SERVICE");

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
  }, [clientParam, assignToParam, urgentParam]);

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
                <FilterTabs
                  options={tsoServiceCategory}
                  activeTab={tsoSubFilter}
                  onTabClick={setTsoSubFilter}
                />
              </div>

            </div>

            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-[#999999]">
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
                                `/production_module_2/${encodeURIComponent(item.tso_no)}?filter=${activeFilter}&client=${encodeURIComponent(clientParam || "")}&assign_to=${encodeURIComponent(assignToParam || "")}`
                              )
                            }
                            className={`text-base leading-normal cursor-pointer underline ${
                              item.urgent
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