"use client";
import Image from "next/image";
import Tabs from "../component/Tabs";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { SetStateAction, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import LeftSideBar from "../component/LeftSideBar";
import UserActivityLogger from "../../provider/UserActivityLogger";
import { MdVerified } from "react-icons/md";
import { TbTopologyStarRing2 } from "react-icons/tb";
import { PiMapPinLight } from "react-icons/pi";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { useSearchParams } from "next/navigation";
import AxiosProvider from "../../provider/AxiosProvider";
import CustomerViewDetails from "../component/CustomerViewDetails";
import ReactPlayer from "react-player";
import DesktopHeader from "../component/DesktopHeader";
import { Tooltip } from "react-tooltip";
import { FaEllipsisVertical } from "react-icons/fa6";
import { AppContext } from "../AppContext";
import { GrPowerReset } from "react-icons/gr";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

interface Customer {
  id: string;
  firstname: string;
  lastname: string;
  birthdate: string;
  gender: string;
  mobilephonenumber: string;
  email: string; // Added email field
  streetaddress: string;
  countryofbirth: string;
  countryofresidence: string;
  updated_at: string;
  // Optional fields
  city?: string | null;
  created_at?: string | null;
  fcmtoken?: string | null;
  idcardrecto?: string | null;
  idcardverso?: string | null;
  iddoctype?: string | null;
  mobilephonenumber_verified?: boolean | null;
  password?: string | null;
  shortintrovideo?: string | null;
  usersignature?: string | null;
  face_id_url?: string | null;
  liveness_score?: number | null;
  face_match_score?: number | null;
  mainStatus?: string;
  [key: string]: any; // To allow additional unknown fields
}
interface CustomerHistoryItem {
  id: string;
  verification_type: string;
  reason_reject: string | null;
  created_at: string;
  status: string;
  system_user_id: string;
}

export default function Home() {
  const isChecking = useAuthRedirect();
  const [customer, setCustomer] = useState<Customer | null>(null); // Initial state as null
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [isCustomerViewDetailOpen, setIsCustomerViewDetailOpen] =
    useState<boolean>(false);
  const [liveDetection, setLiveDetection] = useState<string | null>(null);
  const [identityMatching, setIdentityMatching] = useState<string | null>(null);
  const [userDetailsVerification, setUserDetailsVerification] = useState<
    string | null
  >(null);
  const [scannedIdCardVerification, setScannedIdCardVerification] = useState<
    string | null
  >(null);
  const [fiveSecondVideoVerification, setFiveSecondVideoVerification] =
    useState<string | null>(null);
  const [signatureVerification, setSignatureVerification] = useState<
    string | null
  >(null);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [faceImageFromChild, setFaceImageFromChild] = useState<string | null>(
    null
  );
  const [idEctoFromChild, setIdEctoFromChild] = useState<string | null>(null);
  const [idVersoFromChild, setIdVersoFromChild] = useState<string | null>(null);
  const [userSignatureFromChild, setUserSignatureFromChild] = useState<
    string | null
  >(null);
  const [userVideoFromChild, setUserVideoFromChild] = useState<string | null>(
    null
  );
  const [customerHistory, setCustomerHistory] = useState<CustomerHistoryItem[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalOpenVideo, setIsModalOpenVideo] = useState<boolean>(false);
  const [hitApi, setHitApi] = useState<boolean>(true);
  //console.log('BBBBBBBBBBBBB',isModalOpenVideo)
  const [modalImage, setModalImage] = useState<string>("");

  const context = useContext(AppContext);
  if (!context) {
    throw new Error(
      "FetchCustomerComponent must be used within an AppProvider"
    );
  }
  const { setCustomerFullName } = context;
  // Function to open modal with specific image
  const openModal = (imageSrc: SetStateAction<string>) => {
    setModalImage(imageSrc);
    setIsModalOpen(true);
  };
  //console.log('CUSTOMER HISTORY',customerHistory)
  //console.log('SELECTED BUTTON',selectedButton)

  const axiosProvider = new AxiosProvider();

  const handleButtonClick = (button: string) => {
    setSelectedButton(button);
    setIsCustomerViewDetailOpen(!isCustomerViewDetailOpen);
  };

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const res = await axiosProvider.post("/viewcustomer", { id }); // Use POST and pass `id` in the body
          //console.log("VIEW CUSTOMER", res);
          setCustomer(res.data.data.customer);

          if (
            res?.data.data.customer.firstname &&
            res?.data.data.customer.lastname
          ) {
            setCustomerFullName(
              `${res.data.data.customer.firstname} ${res.data.data.customer.lastname}`
            );
          }
        } catch (error: any) {
          console.log("Error occurred:", error);
        }
      };

      fetchData();
    }
  }, [id, setCustomerFullName, hitApi]);

  const fetchUserStatus = async () => {
    // console.log('USE EFFECT CUS ID',id);
    try {
      // console.log("USE EFFECT CUS ID", id);
      const response = await axiosProvider.post("/getuserstatus", {
        customer_id: id,
      });
      //setFaceImage(response.data.data.url);
      //setFaceImage(response.data.data.url);
      //console.log("CUSTOMER STATUS", response);
      // console.log(
      //   "CUSTOMER STATUS",
      //   response.data.data.verificationStatuses[3].status
      // );
      setLiveDetection(response.data.data.verificationStatuses[0].status);
      setIdentityMatching(response.data.data.verificationStatuses[1].status);
      setUserDetailsVerification(
        response.data.data.verificationStatuses[2].status
      );
      setScannedIdCardVerification(
        response.data.data.verificationStatuses[3].status
      );
      setFiveSecondVideoVerification(
        response.data.data.verificationStatuses[4].status
      );
      setSignatureVerification(
        response.data.data.verificationStatuses[5].status
      );
      // toast.success("Successfully get");
    } catch (error) {
      console.error("Error deleting user:", error);
      // toast.error("Failed to get Image");
    }
  };
  const getUserHistory = async () => {
    if (id !== null) {
      try {
        const response = await axiosProvider.post("/getuserhistory", {
          customer_id: id,
        });
        setCustomerHistory(response.data.data.history);
      } catch (error) {
        console.error("Customer is not Approved:", error);
        // toast.error("Customer history is not fetched");
      }
    }
  };

  useEffect(() => {
    fetchUserStatus();
    getUserHistory();
  }, [hitApi]);

  const callNotificationApi = async (verification: string) => {
    // console.log("CALLED NOTIFICATION", verification);
    try {
      const response = await axiosProvider.post("/sendnotification", {
        customerId: id,
        verification_type: verification,
      });
      toast.success("Notification is sent");
    } catch (error) {
      console.error("Send notification failed:", error);
      toast.error("Notification is not sent");
    }
  };

  // Determine background color based on liveDetection value
  const getBgColor = (status: string | null) => {
    if (status === "Approved") return "bg-approveBtn";
    if (status === "On Progress") return "bg-progressBtn";
    if (status === "Rejected") return "bg-rejectBtn";
    if (status === "Under Review") return "bg-underreviewbtn";
    return ""; // Default background color
  };
  const liveDetectionBg = getBgColor(liveDetection);
  const identityMatchingBg = getBgColor(identityMatching);
  const userDetailsVerificationBg = getBgColor(userDetailsVerification);
  const scannedIdCardVerificationBg = getBgColor(scannedIdCardVerification);
  const fiveSecondVideoVerificationBg = getBgColor(fiveSecondVideoVerification);
  const signatureVerificationBg = getBgColor(signatureVerification);
  const tabs = [
    {
      label: "User Home",
      content: (
        <>
          {/* //   Tab 1 content */}
          <div className="pt-2 md:pt-8 w-full flex flex-col md:flex-row md:justify-between">
            <div className="w-full md:w-[49%]">
              {/* PERSONAL INFO */}
              <div className="border border-[#F1F1F4] rounded-[12px] w-full mb-4 overflow-x-auto">
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#F1F1F4]">
                        <th
                          colSpan={3}
                          className="py-4 px-4 text-left text-base font-semibold"
                        >
                          Personal Info
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#F1F1F4]">
                        <td className="text-sm text-[#78829D] py-4 px-4">
                          Photo
                        </td>
                        <td className="py-4 px-4">
                          {faceImageFromChild ? (
                            <Image
                              src={faceImageFromChild}
                              alt="Profile"
                              width={60}
                              height={60}
                              className="rounded-full border-2 border-primary-600 !h-[60px] max-w-[100px] object-cover"
                            />
                          ) : (
                            <Image
                              src="/images/dummy-image.jpg"
                              alt="Profile"
                              width={60}
                              height={60}
                              className="rounded-full border-2 border-primary-500"
                            />
                          )}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-b border-[#F1F1F4]">
                        <td className="text-sm text-[#78829D] py-4 px-4">
                          Name
                        </td>
                        <td className="text-sm font-medium text-[#252F4A] capitalize py-4 px-4">
                          {customer
                            ? `${customer.firstname} ${customer.lastname}`
                            : "Loading..."}
                        </td>
                        <td className="text-[#1B84FF] text-xs font-medium cursor-pointer py-4 px-4">
                          Edit
                        </td>
                      </tr>
                      <tr className="border-b border-[#F1F1F4]">
                        <td className="text-sm text-[#78829D] py-4 px-4">
                          Availability
                        </td>
                        <td className="text-sm font-medium text-[#17C653] py-4 px-4">
                          <span className="bg-[#EAFFF1] border border-[#17c65333] py-1 px-2 rounded ">
                            Available now
                          </span>
                        </td>
                        <td className="text-[#1B84FF] text-xs font-medium cursor-pointer py-4 px-4">
                          Edit
                        </td>
                      </tr>
                      <tr className="border-b border-[#F1F1F4]">
                        <td className="text-sm text-[#78829D] py-4 px-4">
                          Birthday
                        </td>
                        <td className="text-sm text-[#252F4A] py-4 px-4">
                          {customer ? customer.birthdate : "Loading..."}
                        </td>
                        <td className="text-[#1B84FF] text-xs font-medium cursor-pointer py-4 px-4">
                          Edit
                        </td>
                      </tr>
                      <tr className="border-b border-[#F1F1F4]">
                        <td className="text-sm text-[#78829D] py-4 px-4">
                          Gender
                        </td>
                        <td className="text-sm text-[#252F4A] py-4 px-4">
                          {customer ? customer.gender : "Loading..."}
                        </td>
                        <td className="text-[#1B84FF] text-xs font-medium cursor-pointer py-4 px-4">
                          Edit
                        </td>
                      </tr>
                      <tr className="border-b border-[#F1F1F4]">
                        <td className="text-sm text-[#78829D] py-4 px-4">
                          Address
                        </td>
                        <td className="text-sm text-[#252F4A] py-4 px-4">
                          {customer ? customer.streetaddress : "Loading..."}
                        </td>
                        <td className="text-[#1B84FF] text-xs font-medium cursor-pointer py-4 px-4">
                          Edit
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BASIC SETTING */}

              {/* COMMUNITY */}
              <div className="border border-[#F1F1F4] rounded-[12px] w-full">
                <div className="py-4 px-4 border-b border-[#F1F1F4]">
                  <p className="text-base font-semibold leading-4">
                    Community Badges
                  </p>
                </div>
                <table className="w-full pl-8">
                  <thead className=" h-[100px]">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className=" text-sm font-normal leading-5 text-[#78829D] text-left py-4 px-4">
                        <div className=" flex items-center gap-3">
                          <Image
                            src="/images/1.png"
                            alt="Orizon profile"
                            width={50}
                            height={50}
                          />
                          <Image
                            src="/images/2.png"
                            alt="Orizon profile"
                            width={50}
                            height={50}
                          />
                          <Image
                            src="/images/3.png"
                            alt="Orizon profile"
                            width={50}
                            height={50}
                          />
                          <Image
                            src="/images/4.png"
                            alt="Orizon profile"
                            width={50}
                            height={50}
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
            {/* SKILLS */}
            <div className="w-full md:w-[49%] mt-3 md:mt-0">
              <div className="border border-[#F1F1F4] rounded-[12px] w-full mb-4">
                <div className="py-4 px-4 border-b border-[#F1F1F4] flex justify-between">
                  <p className="text-base font-semibold leading-4">Skills</p>
                  <p className="text-[13px] font-medium leading-4 text-[#1B84FF]">
                    Skills
                  </p>
                </div>
                <table className="w-full pl-8">
                  <thead className=" h-[100px]">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left p-5">
                        <div className="w-[80%] flex flex-wrap flex-row gap-2">
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              web Design
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              code Review
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              Figma
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              Product Development
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              web flow
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              AI
                            </span>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* MY FILES */}
              <div className="border border-[#F1F1F4] rounded-[12px] w-full mb-4">
                <div className="py-4 px-4 border-b border-[#F1F1F4] flex justify-between">
                  <p className="text-base font-semibold leading-4">My Files</p>
                </div>
                <table className="w-full pl-8">
                  <thead className=" h-[100px]">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <div className="flex flex-col gap-5 my-3">
                          <div className=" flex items-center gap-3">
                            <div>
                              <Image
                                src="/images/pdf.png"
                                alt="Orizon profile"
                                width={24}
                                height={24}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => openModal(faceImageFromChild)}
                                className="text-[#1B84FF] text-sm font-medium leading-5"
                              >
                                Users Photo
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <div className="flex flex-col gap-5 my-3">
                          <div className=" flex items-center gap-3">
                            <div>
                              <Image
                                src="/images/pdf.png"
                                alt="Orizon profile"
                                width={24}
                                height={24}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => openModal(idEctoFromChild)}
                                className="text-[#1B84FF] text-sm font-medium leading-5"
                              >
                                Users ID Card Front
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <div className="flex flex-col gap-5 my-3">
                          <div className=" flex items-center gap-3">
                            <div>
                              <Image
                                src="/images/pdf.png"
                                alt="Orizon profile"
                                width={24}
                                height={24}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => openModal(idVersoFromChild)}
                                className="text-[#1B84FF] text-sm font-medium leading-5"
                              >
                                Users ID Card Back
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <div className="flex flex-col gap-5 my-3">
                          <div className=" flex items-center gap-3">
                            <div>
                              <Image
                                src="/images/pdf.png"
                                alt="Orizon profile"
                                width={24}
                                height={24}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() =>
                                  openModal(userSignatureFromChild)
                                }
                                className="text-[#1B84FF] text-sm font-medium leading-5"
                              >
                                Users Signature
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <div className="flex flex-col gap-5 my-3">
                          <div className=" flex items-center gap-3">
                            <div>
                              <Image
                                src="/images/pdf.png"
                                alt="Orizon profile"
                                width={24}
                                height={24}
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => setIsModalOpenVideo(true)}
                                className="text-[#1B84FF] text-sm font-medium leading-5"
                              >
                                Users short video
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                </table>
                {/* MODAL */}
                {isModalOpen && (
                  <div
                    onClick={() => setIsModalOpen(false)}
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                  >
                    <div className="bg-white p-8 rounded-lg shadow-lg w-96 relative">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-2 right-4 text-xl"
                      >
                        &times;
                      </button>

                      <h2 className="text-xl font-bold text-center mb-2">
                        User`s data
                      </h2>
                      <div className="">
                        {modalImage ? (
                          <Image
                            src={modalImage}
                            alt="Orizon profile"
                            width={200}
                            height={200}
                            className="m-auto rounded"
                          />
                        ) : (
                          <Image
                            src="/images/dummy-image.jpg"
                            alt="Orizon profile"
                            width={200}
                            height={200}
                            className="m-auto rounded"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* END MODAL */}

                {/* MODAL Video*/}
                {isModalOpenVideo && (
                  <div
                    onClick={() => setIsModalOpenVideo(false)}
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
                  >
                    <div className="bg-white p-8 rounded-lg shadow-lg w-96 relative">
                      <button
                        onClick={() => setIsModalOpenVideo(false)}
                        className="absolute top-2 right-4 text-xl"
                      >
                        &times;
                      </button>

                      <h2 className="text-xl font-bold text-center mb-2">
                        User`s short video
                      </h2>
                      {userVideoFromChild ? (
                        <div className="custom-player-container">
                          <ReactPlayer
                            url={userVideoFromChild}
                            controls={true}
                            playing={true}
                            muted={true}
                            className="custom-player"
                            width="100%" // Fill the container
                            height="100%" // Fill the container
                            config={{
                              file: {
                                attributes: {
                                  controlsList: "nodownload", // Disable extra options
                                },
                              },
                            }}
                          />
                        </div>
                      ) : (
                        <Image
                          src="/images/novideo.jpg"
                          alt="Orizon profile"
                          width={200}
                          height={200}
                          className="m-auto rounded"
                        />
                      )}
                    </div>
                  </div>
                )}
                {/* END MODAL video */}
                <div className="py-4 px-4 border-b border-[#F1F1F4] flex justify-center">
                  <p className="text-[13px] font-medium leading-[13px] text-[#1B84FF]">
                    My Files
                  </p>
                </div>
              </div>
              <div className="border border-[#F1F1F4] rounded-[12px] w-full mb-4">
                <div className="py-4 px-4 border-b border-[#F1F1F4]">
                  <p className="text-base font-semibold leading-4">Work</p>
                </div>
                <table className="w-full pl-8">
                  <thead className=" h-[57px]">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[20%]  text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        Language
                      </th>
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        {" "}
                        <span className="text-[#252F4A] font-semibold">
                          English
                        </span>{" "}
                        -Fluent
                      </th>
                    </tr>
                  </thead>
                  <thead className="h-[57px]">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[20%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        Hourly Rate
                      </th>
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <span className="text-[#252F4A] font-semibold">
                          $28 / hour
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <thead className="h-[57px]">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[20%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        Avaibilaty
                      </th>
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        32 hours a week
                      </th>
                      <th className="w-[20%] text-[#1B84FF] text-xs font-medium leading-3 cursor-pointer"></th>
                    </tr>
                  </thead>
                  <thead className="">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[20%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        Skills
                      </th>
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        <div className="w-full flex flex-wrap flex-row gap-2 py-3">
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              web Design
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              code Review
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              Figma
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              Product Development
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              web flow
                            </span>
                          </div>
                          <div className=" bg-[#F1F1F4] px-[10px] py-[4px] rounded inline">
                            <span className="text-[11px] font-medium text-[#4B5675]">
                              AI
                            </span>
                          </div>
                        </div>
                      </th>
                      <th className="w-[20%] text-[#1B84FF] text-xs font-medium leading-3 cursor-pointer"></th>
                    </tr>
                  </thead>

                  <thead className="">
                    <tr className="border-b border-[#F1F1F4]">
                      <th className="w-[20%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px]">
                        About
                      </th>
                      <th className="w-[60%] text-sm font-normal leading-5 text-[#78829D] text-left pl-[20px] py-3">
                        <span className="text-[#252F4A] font-semibold">
                          {" "}
                          We&apos;re open to partnerships, guest posts, and
                          more. Join us to share your insights and grow your
                          audience.
                        </span>
                      </th>
                      <th className="w-[20%] text-[#1B84FF] text-xs font-medium leading-3 cursor-pointer"></th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
            {/* ------------------------------- */}
          </div>
        </>
      ),
    },
    {
      label: "User Verification",
      content: (
        <>
          {/* //   Tab 2 content */}
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-[32.5%] h-[299px] p-6 bg-white rounded flex-col justify-start items-start gap-4 inline-flex border border-gray-400 mb-4">
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="h-[50px] w-[50px] relative flex items-center justify-center bg-black rounded-full">
                  <Image
                    src="/images/identity matching.svg"
                    alt="Orizon profile"
                    width={26}
                    height={26}
                    style={{ filter: "invert(100%)" }} // Makes it white
                    className="!h-[40px]"
                  />
                  <div
                    className={`w-[152px] h-[41px] px-3.5 py-2.5 left-[66px] top-[4.50px] absolute rounded-[4px] justify-center items-center gap-2.5 inline-flex  ${
                      identityMatchingBg ? identityMatchingBg : "bg-customBlue"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {identityMatching ? identityMatching : "Loading..."}
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 relative  overflow-hidden">
                  <div className="w-[5px] h-6 left-[9.50px] top-0 absolute"></div>
                </div>
              </div>
              <div className="self-stretch text-[#0e0e0e] text-base font-medium">
                Identity Matching
              </div>
              <div className="self-stretch h-[93px] rounded border border-[#232323] flex-col justify-start items-start gap-2.5 flex">
                <div className="self-stretch h-[72px] pl-4 py-1 rounded-tl rounded-tr justify-start items-start gap-1 inline-flex">
                  <div className="w-[258px] h-12 py-1 flex-col justify-start items-start inline-flex">
                    <div className="px-1 bg-white justify-start items-center inline-flex relative bottom-[13px]">
                      <div className="text-black text-xs font-normal leading-none tracking-wide">
                        Instructions
                      </div>
                    </div>
                    <div className="self-stretch justify-start items-center inline-flex">
                      <div className="w-[258px] h-12 text-[#414349] text-sm font-normal leading-normal tracking-wide">
                        <li>The face should be clear</li>
                        <li>The face should be match</li>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="w-[150px] h-9 relative">
                  <button
                    className=" bg-primary-600 text-white hover:bg-primary-500 py-1.5 px-6 rounded text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      identityMatching === "Approved" ||
                      identityMatching === "Rejected"
                    }
                    onClick={() => {
                      handleButtonClick("two");
                    }}
                  >
                    Verify User
                  </button>
                </div>
                <button
                  onClick={() => callNotificationApi("identity_matching")}
                  disabled={identityMatching != "Rejected"}
                  className="px-4 py-2 bg-primary-200 hover:bg-primary-300 cursor-pointer  rounded-[4px] justify-center items-center gap-2.5 flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-black text-sm font-medium">
                    Notify User
                  </div>
                </button>
              </div>
            </div>
            <div className="w-full md:w-[32.5%] h-[299px] p-6 bg-white rounded flex-col justify-start items-start gap-4 inline-flex border border-gray-400 mb-4">
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="h-[50px] w-[50px] relative flex items-center justify-center bg-black rounded-full">
                  <Image
                    src="/images/Scanned ID Card Verification.svg"
                    alt="Orizon profile"
                    width={26}
                    height={26}
                    style={{ filter: "invert(100%)" }} // Makes it white
                    className="!h-[40px]"
                  />
                  <div
                    className={`w-[152px] h-[41px] px-3.5 py-2.5 left-[66px] top-[4.50px] absolute rounded-[4px] justify-center items-center gap-2.5 inline-flex  ${
                      scannedIdCardVerificationBg
                        ? scannedIdCardVerificationBg
                        : "bg-customBlue"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {scannedIdCardVerification
                        ? scannedIdCardVerification
                        : "Loading..."}
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 relative  overflow-hidden">
                  <div className="w-[5px] h-6 left-[9.50px] top-0 absolute"></div>
                </div>
              </div>
              <div className="self-stretch text-[rgb(14,14,14)] text-base font-medium">
                Scanned ID Card Verification
              </div>
              <div className="self-stretch h-[93px] rounded border border-[#232323] flex-col justify-start items-start gap-2.5 flex">
                <div className="self-stretch h-[72px] pl-4 py-1 rounded-tl rounded-tr justify-start items-start gap-1 inline-flex">
                  <div className="w-[258px] h-12 py-1 flex-col justify-start items-start inline-flex">
                    <div className="px-1 bg-white justify-start items-center inline-flex relative bottom-[13px]">
                      <div className="text-black text-xs font-normal leading-none tracking-wide">
                        Instructions
                      </div>
                    </div>
                    <div className="self-stretch justify-start items-center inline-flex">
                      <div className="w-[258px] h-12 text-[#414349] text-sm font-normal leading-normal tracking-wide">
                        <li>The id card should be clear</li>
                        <li>Both images will be from same id card</li>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="w-[150px] h-9 relative">
                  <button
                    className=" bg-primary-600 text-white hover:bg-primary-500 py-1.5 px-6 rounded text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      scannedIdCardVerification === "Approved" ||
                      scannedIdCardVerification === "Rejected"
                    }
                    onClick={() => {
                      handleButtonClick("four");
                    }}
                  >
                    Verify User
                  </button>
                </div>
                <button
                  onClick={() =>
                    callNotificationApi("scanned_id_card_verification")
                  }
                  disabled={scannedIdCardVerification != "Rejected"}
                  className="px-4 py-2 bg-primary-200 hover:bg-primary-300 cursor-pointer rounded-[4px] justify-center items-center gap-2.5 flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-black text-sm font-medium">
                    Notify User
                  </div>
                </button>
              </div>
            </div>
            <div className="w-full md:w-[32.5%] h-[299px] p-6 bg-white rounded flex-col justify-start items-start gap-4 inline-flex border border-gray-400 mb-4">
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="h-[50px] w-[50px] relative flex items-center justify-center bg-black rounded-full">
                  <Image
                    src="/images/User Detail Verification.svg"
                    alt="Orizon profile"
                    width={26}
                    height={26}
                    style={{ filter: "invert(100%)" }} // Makes it white
                    className="!h-[40px]"
                  />
                  <div
                    className={`w-[152px] h-[41px] px-3.5 py-2.5 left-[66px] top-[4.50px] absolute rounded-[4px] justify-center items-center gap-2.5 inline-flex  ${
                      userDetailsVerificationBg
                        ? userDetailsVerificationBg
                        : "bg-customBlue"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {userDetailsVerification
                        ? userDetailsVerification
                        : "Loading..."}
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 relative  overflow-hidden">
                  <div className="w-[5px] h-6 left-[9.50px] top-0 absolute"></div>
                </div>
              </div>
              <div className="self-stretch text-[#0e0e0e] text-base font-medium">
                User Detail Verification
              </div>
              <div className="self-stretch h-[93px] rounded border border-[#232323] flex-col justify-start items-start gap-2.5 flex">
                <div className="self-stretch h-[72px] pl-4 py-1 rounded-tl rounded-tr justify-start items-start gap-1 inline-flex">
                  <div className="w-[258px] h-12 py-1 flex-col justify-start items-start inline-flex">
                    <div className="px-1 bg-white justify-start items-center inline-flex relative bottom-[13px]">
                      <div className="text-black text-xs font-normal leading-none tracking-wide">
                        Instructions
                      </div>
                    </div>
                    <div className="self-stretch justify-start items-center inline-flex">
                      <div className="w-[258px] h-12 text-[#414349] text-sm font-normal leading-normal tracking-wide">
                        <li>Check all details over call</li>
                        <li>All details should be valid</li>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="w-[150px] h-9 relative">
                  <button
                    className=" bg-primary-600 text-white hover:bg-primary-500 py-1.5 px-6 rounded text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      userDetailsVerification === "Approved" ||
                      userDetailsVerification === "Rejected"
                    }
                    onClick={() => {
                      handleButtonClick("three");
                    }}
                  >
                    Verify User
                  </button>
                </div>
                <button
                  onClick={() =>
                    callNotificationApi("user_details_verification")
                  }
                  disabled={userDetailsVerification != "Rejected"}
                  className="px-4 py-2 bg-primary-200 hover:bg-primary-300 cursor-pointer  rounded-[4px] justify-center items-center gap-2.5 flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-black text-sm font-medium">
                    Notify User
                  </div>
                </button>
              </div>
            </div>
            <div className="w-full md:w-[32.5%] h-[299px] p-6 bg-white rounded flex-col justify-start items-start gap-4 inline-flex border border-gray-400 mb-4">
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="h-[50px] w-[50px] relative flex items-center justify-center bg-black rounded-full">
                  <Image
                    src="/images/Liveness Detection.svg"
                    alt="Orizon profile"
                    width={26}
                    height={26}
                    style={{ filter: "invert(100%)" }} // Makes it white
                    className="!h-[40px]"
                  />
                  <div
                    className={`w-[152px] h-[41px] px-3.5 py-2.5 left-[66px] top-[4.50px] absolute rounded-[4px] justify-center items-center gap-2.5 inline-flex  ${
                      liveDetectionBg ? liveDetectionBg : "bg-customBlue"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {liveDetection ? liveDetection : "Loading..."}
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 relative  overflow-hidden">
                  <div className="w-[5px] h-6 left-[9.50px] top-0 absolute"></div>
                </div>
              </div>
              <div className="self-stretch text-[#0e0e0e] text-base font-medium">
                Liveness Detection
              </div>
              <div className="self-stretch h-[93px] rounded border border-[#232323] flex-col justify-start items-start gap-2.5 flex">
                <div className="self-stretch h-[72px] pl-4 py-1 rounded-tl rounded-tr justify-start items-start gap-1 inline-flex">
                  <div className="w-[258px] h-12 py-1 flex-col justify-start items-start inline-flex">
                    <div className="px-1 bg-white justify-start items-center inline-flex relative bottom-[13px]">
                      <div className="text-black text-xs font-normal leading-none tracking-wide">
                        Instructions
                      </div>
                    </div>
                    <div className="self-stretch justify-start items-center inline-flex">
                      <div className="w-[258px] h-12 text-[#414349] text-sm font-normal leading-normal tracking-wide">
                        <li>The face should be clear</li>
                        <li>Liveness score should be 90%</li>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="w-[150px] h-9 relative">
                  <button
                    className=" bg-primary-600 text-white hover:bg-primary-500 py-1.5 px-6 rounded-[4px] text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      liveDetection === "Approved" ||
                      liveDetection === "Rejected"
                    }
                    onClick={() => {
                      handleButtonClick("one");
                    }}
                  >
                    Verify User
                  </button>
                </div>
                <button
                  onClick={() => callNotificationApi("liveness_detection")}
                  disabled={liveDetection != "Rejected"}
                  className="px-4 py-2 bg-primary-200 hover:bg-primary-300 cursor-pointer  rounded-[4px] justify-center items-center gap-2.5 flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-black text-sm font-medium">
                    Notify User
                  </div>
                </button>
              </div>
            </div>
            <div className="w-full md:w-[32.5%] h-[299px] p-6 bg-white rounded flex-col justify-start items-start gap-4 inline-flex border border-gray-400 mb-4">
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="h-[50px] w-[50px] relative flex items-center justify-center bg-black rounded-full">
                  <Image
                    src="/images/Five Second Video Verification.svg"
                    alt="Orizon profile"
                    width={26}
                    height={26}
                    style={{ filter: "invert(100%)" }} // Makes it white
                    className="!h-[40px]"
                  />
                  <div
                    className={`w-[152px] h-[41px] px-3.5 py-2.5 left-[66px] top-[4.50px] absolute rounded-[4px] justify-center items-center gap-2.5 inline-flex  ${
                      fiveSecondVideoVerificationBg
                        ? fiveSecondVideoVerificationBg
                        : "bg-customBlue"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {fiveSecondVideoVerification
                        ? fiveSecondVideoVerification
                        : "Loading..."}
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 relative  overflow-hidden">
                  <div className="w-[5px] h-6 left-[9.50px] top-0 absolute"></div>
                </div>
              </div>
              <div className="self-stretch text-[#0e0e0e] text-base font-medium">
                Five Second Video Verification
              </div>
              <div className="self-stretch h-[93px] rounded border border-[#232323] flex-col justify-start items-start gap-2.5 flex">
                <div className="self-stretch h-[72px] pl-4 py-1 rounded-tl rounded-tr justify-start items-start gap-1 inline-flex">
                  <div className="w-[258px] h-12 py-1 flex-col justify-start items-start inline-flex">
                    <div className="px-1 bg-white justify-start items-center inline-flex relative bottom-[13px]">
                      <div className="text-black text-xs font-normal leading-none tracking-wide">
                        Instructions
                      </div>
                    </div>
                    <div className="self-stretch justify-start items-center inline-flex">
                      <div className="w-[258px] h-12 text-[#414349] text-sm font-normal leading-normal tracking-wide">
                        <li>The video should be clear</li>
                        <li>Video should be human being</li>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="w-[150px] h-9 relative">
                  <button
                    className=" bg-primary-600 text-white hover:bg-primary-500 py-1.5 px-6 rounded text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      fiveSecondVideoVerification === "Approved" ||
                      fiveSecondVideoVerification === "Rejected"
                    }
                    onClick={() => {
                      handleButtonClick("five");
                    }}
                  >
                    Verify User
                  </button>
                </div>
                <button
                  onClick={() =>
                    callNotificationApi("five_second_face_video_verification")
                  }
                  disabled={fiveSecondVideoVerification != "Rejected"}
                  className="px-4 py-2 bg-primary-200 hover:bg-primary-300 cursor-pointer   rounded-[4px] justify-center items-center gap-2.5 flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-black text-sm font-medium">
                    Notify User
                  </div>
                </button>
              </div>
            </div>
            <div className="w-full md:w-[32.5%] h-[299px] p-6 bg-white rounded flex-col justify-start items-start gap-4 inline-flex border border-gray-400 mb-4">
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="h-[50px] w-[50px] relative flex items-center justify-center bg-black rounded-full">
                  <Image
                    src="/images/Signature Verification.svg"
                    alt="Orizon profile"
                    width={26}
                    height={26}
                    style={{ filter: "invert(100%)" }} // Makes it white
                    className="!h-[40px]"
                  />
                  <div
                    className={`w-[152px] h-[41px] px-3.5 py-2.5 left-[66px] top-[4.50px] absolute rounded-[4px] justify-center items-center gap-2.5 inline-flex  ${
                      signatureVerificationBg
                        ? signatureVerificationBg
                        : "bg-customBlue"
                    }`}
                  >
                    <div className="text-white text-sm font-semibold">
                      {signatureVerification
                        ? signatureVerification
                        : "Loading..."}
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 relative  overflow-hidden">
                  <div className="w-[5px] h-6 left-[9.50px] top-0 absolute"></div>
                </div>
              </div>
              <div className="self-stretch text-[#0e0e0e] text-base font-medium">
                Signature Verification
              </div>
              <div className="self-stretch h-[93px] rounded border border-[#232323] flex-col justify-start items-start gap-2.5 flex">
                <div className="self-stretch h-[72px] pl-4 py-1 rounded-tl rounded-tr justify-start items-start gap-1 inline-flex">
                  <div className="w-[258px] h-12 py-1 flex-col justify-start items-start inline-flex">
                    <div className="px-1 bg-white justify-start items-center inline-flex relative bottom-[13px]">
                      <div className="text-black text-xs font-normal leading-none tracking-wide">
                        Instructions
                      </div>
                    </div>
                    <div className="self-stretch justify-start items-center inline-flex">
                      <div className="w-[258px] h-12 text-[#414349] text-sm font-normal leading-normal tracking-wide">
                        <li>The signarure should be clear</li>
                        <li>Check valid signature</li>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="self-stretch justify-between items-center inline-flex">
                <div className="w-[150px] h-9 relative">
                  <button
                    className=" bg-primary-600 text-white hover:bg-primary-500 py-1.5 px-6 rounded text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      signatureVerification === "Approved" ||
                      signatureVerification === "Rejected"
                    }
                    onClick={() => {
                      handleButtonClick("six");
                    }}
                  >
                    Verify User
                  </button>
                </div>
                <button
                  onClick={() => callNotificationApi("signature_verification")}
                  disabled={signatureVerification != "Rejected"}
                  className="px-4 py-2 bg-primary-200 hover:bg-primary-300 cursor-pointer  rounded-[4px] justify-center items-center gap-2.5 flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-black text-sm font-medium">
                    Notify User
                  </div>
                </button>
              </div>
            </div>
          </div>
          {/* USER HISTORY DATA */}
          {customerHistory.length > 0 && (
            <>
              <div className="container mx-auto mt-6">
                <h2 className="text-lg font-bold mb-4">Customer History</h2>
                <div className="rounded-lg overflow-hidden border border-gray-300">
                  <table className="table-auto border-collapse border border-gray-300 rounded w-full overflow-hidden">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-4 py-2">
                          System User ID
                        </th>
                        <th className="border border-gray-300 px-4 py-2 hidden md:table-cell">
                          Verification Type
                        </th>
                        <th className="border border-gray-300 px-4 py-2 hidden md:table-cell">
                          Reason Rejected
                        </th>
                        <th className="border border-gray-300 px-4 py-2 hidden md:table-cell">
                          Created At
                        </th>
                        <th className="border border-gray-300 px-4 py-2">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.map((item, index) => (
                        <tr key={index} className="">
                          <td className="border border-gray-300 px-4 py-2">
                            <div className="flex">
                              <div className="md:hidden flex">
                                <FaEllipsisVertical
                                  data-tooltip-id="my-tooltip"
                                  data-tooltip-html={`<div>
                                  <strong>System User ID:</strong> <span style="text-transform: capitalize;">${
                                    item.system_user_id
                                  }</span><br/>
                                  <strong>Verification Type:</strong> ${item.verification_type
                                    .split("_")
                                    .join(" ")}<br/>
                                  <strong>Reason Rejected:</strong> ${
                                    item.reason_reject
                                  }<br/>
                                  <strong>Created At:</strong> ${
                                    item.created_at
                                  }<br/>
                                </div>`}
                                  className="text-black leading-normal capitalize relative top-1"
                                />
                                <Tooltip id="my-tooltip" place="right" float />
                              </div>
                              {item.system_user_id}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 capitalize hidden md:table-cell">
                            {item.verification_type.split("_").join(" ")}
                            {/* {item.verification_type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} */}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 hidden md:table-cell">
                            {item.reason_reject || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 hidden md:table-cell">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <p
                              className={`text-[#fff] text-sm px-4 pt-1 pb-1.5 rounded-[4px] w-24 text-center w-full ${
                                item.status === "Approved"
                                  ? "bg-approveBtn"
                                  : item.status === "Rejected"
                                  ? "bg-rejectBtn"
                                  : "bg-underreviewbtn"
                              }`}
                            >
                              {item.status}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* END USER HISTORY DATA */}
        </>
      ),
      // End Tab content 2
    },
    {
      label: "Transaction",
      content: (
        <>
          {/* Tab content 3 */}
          <div className="container mx-auto p-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              Transaction History
            </h2>
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="w-full min-w-max bg-white">
                <thead>
                  <tr className="bg-blue-500 text-white text-xs md:text-sm">
                    <th className="text-left px-4 md:px-6 py-3">
                      Transaction ID
                    </th>
                    <th className="text-left px-4 md:px-6 py-3">Date</th>
                    <th className="text-left px-4 md:px-6 py-3">Amount</th>
                    <th className="text-left px-4 md:px-6 py-3">Status</th>
                    <th className="text-left px-4 md:px-6 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="text-xs md:text-sm">
                  <tr className="bg-gray-100 hover:bg-gray-200">
                    <td className="px-4 md:px-6 py-3">TXN001</td>
                    <td className="px-4 md:px-6 py-3">2025-01-20</td>
                    <td className="px-4 md:px-6 py-3">$250.00</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs md:text-sm font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      Payment for order #1234
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-200">
                    <td className="px-4 md:px-6 py-3">TXN002</td>
                    <td className="px-4 md:px-6 py-3">2025-01-22</td>
                    <td className="px-4 md:px-6 py-3">$150.50</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs md:text-sm font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      Refund for order #5678
                    </td>
                  </tr>
                  <tr className="bg-gray-100 hover:bg-gray-200">
                    <td className="px-4 md:px-6 py-3">TXN003</td>
                    <td className="px-4 md:px-6 py-3">2025-01-25</td>
                    <td className="px-4 md:px-6 py-3">$300.00</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs md:text-sm font-medium bg-red-100 text-red-800">
                        Failed
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      Payment for subscription
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* End Tab content 3 */}
        </>
      ),
    },
    {
      label: "Card",
      content: (
        <>
          {/* Tab content 4 */}
          <div className="container mx-auto p-4">
            {/* Card Tab Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CARD 1 */}
              <div className="w-full h-[225px] bg-cardBg rounded-2xl p-4 relative">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-white text-[11px] leading-normal">
                      Balance
                    </p>
                    <p className="text-white text-base font-semibold leading-normal">
                      $5,756
                    </p>
                  </div>
                  <div>
                    <Image
                      src="/images/Chip_Card.svg"
                      width={29}
                      height={29}
                      alt="Chip"
                      className="w-[29px] h-auto"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <p className="text-white opacity-70 text-[10px] leading-normal">
                      CARD HOLDER
                    </p>
                    <p className="text-white text-[13px] font-semibold leading-normal">
                      Eddy Cusuma
                    </p>
                  </div>
                  <div>
                    <p className="text-white opacity-70 text-[10px] leading-normal">
                      VALID THRU
                    </p>
                    <p className="text-white text-[13px] font-semibold leading-normal">
                      12/22
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-cardFooter absolute bottom-0 left-0 right-0 w-full h-[70px] p-4">
                  <p className="text-[13px] font-semibold text-white">
                    3778 **** **** 1234
                  </p>
                  <svg width="44" height="30" viewBox="0 0 44 30" fill="none">
                    <circle
                      cx="15"
                      cy="15"
                      r="15"
                      fill="white"
                      fillOpacity="0.5"
                    />
                    <circle
                      cx="29"
                      cy="15"
                      r="15"
                      fill="white"
                      fillOpacity="0.5"
                    />
                  </svg>
                </div>
              </div>

              {/* CARD 2 */}
              <div className="w-full h-[225px] bg-card rounded-2xl p-4 relative">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-white text-[11px] leading-normal">
                      Balance
                    </p>
                    <p className="text-white text-base font-semibold leading-normal">
                      $5,756
                    </p>
                  </div>
                  <div>
                    <Image
                      src="/images/Chip_Card.svg"
                      width={29}
                      height={29}
                      alt="Chip"
                      className="w-[29px] h-auto"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <p className="text-white opacity-70 text-[10px] leading-normal">
                      CARD HOLDER
                    </p>
                    <p className="text-white text-[13px] font-semibold leading-normal">
                      Eddy Cusuma
                    </p>
                  </div>
                  <div>
                    <p className="text-white opacity-70 text-[10px] leading-normal">
                      VALID THRU
                    </p>
                    <p className="text-white text-[13px] font-semibold leading-normal">
                      12/22
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-cardFooter absolute bottom-0 left-0 right-0 w-full h-[70px] p-4">
                  <p className="text-[13px] font-semibold text-white">
                    3778 **** **** 1234
                  </p>
                  <svg width="44" height="30" viewBox="0 0 44 30" fill="none">
                    <circle
                      cx="15"
                      cy="15"
                      r="15"
                      fill="white"
                      fillOpacity="0.5"
                    />
                    <circle
                      cx="29"
                      cy="15"
                      r="15"
                      fill="white"
                      fillOpacity="0.5"
                    />
                  </svg>
                </div>
              </div>

              {/* CARD 3 */}
              <div className="w-full h-[225px] border bg-white border-[#DFEAF2] rounded-2xl p-4 relative">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-[#718EBF] text-[11px] leading-normal">
                      Balance
                    </p>
                    <p className="text-[#343C6A] text-base font-semibold leading-normal">
                      $5,756
                    </p>
                  </div>
                  <div>
                    <Image
                      src="/images/white-card.svg"
                      width={29}
                      height={29}
                      alt="Chip"
                      className="w-[29px] h-auto"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <p className="text-[#718EBF] opacity-70 text-[10px] leading-normal">
                      CARD HOLDER
                    </p>
                    <p className="text-[#343C6A] text-[13px] font-semibold leading-normal">
                      Eddy Cusuma
                    </p>
                  </div>
                  <div>
                    <p className="text-[#718EBF] opacity-70 text-[10px] leading-normal">
                      VALID THRU
                    </p>
                    <p className="text-[#343C6A] text-[13px] font-semibold leading-normal">
                      12/22
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-cardFooter absolute bottom-0 left-0 right-0 w-full h-[70px] p-4 border-t border-[#DFEAF2]">
                  <p className="text-[13px] font-semibold text-[#343C6A]">
                    3778 **** **** 1234
                  </p>
                  <svg width="44" height="30" viewBox="0 0 44 30" fill="none">
                    <circle
                      cx="15"
                      cy="15"
                      r="15"
                      fill="#9199AF"
                      fillOpacity="0.5"
                    />
                    <circle
                      cx="29"
                      cy="15"
                      r="15"
                      fill="#9199AF"
                      fillOpacity="0.5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <h2 className="text-lg md:text-xl font-semibold mt-6">
              Transaction History
            </h2>
            <div className="overflow-x-auto rounded-lg shadow mt-4">
              <table className="w-full min-w-max bg-white">
                <thead>
                  <tr className="bg-blue-500 text-white text-xs md:text-sm">
                    <th className="text-left px-4 md:px-6 py-3">
                      Transaction ID
                    </th>
                    <th className="text-left px-4 md:px-6 py-3">Date</th>
                    <th className="text-left px-4 md:px-6 py-3">Amount</th>
                    <th className="text-left px-4 md:px-6 py-3">Status</th>
                    <th className="text-left px-4 md:px-6 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="text-xs md:text-sm">
                  <tr className="bg-gray-100 hover:bg-gray-200">
                    <td className="px-4 md:px-6 py-3">TXN001</td>
                    <td className="px-4 md:px-6 py-3">2025-01-20</td>
                    <td className="px-4 md:px-6 py-3">$250.00</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs md:text-sm font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      Payment for order #1234
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* End Tab content 4 */}
        </>
      ),
    },
  ];

  return (
    <>
      <div className=" flex justify-end  min-h-screen">
        {/* Left sidebar */}
        <LeftSideBar />
        {/* Main content right section */}
        <div className="w-full md:w-[83%] bg-[#F5F7FA] min-h-[500px]  rounded p-4 mt-0 relative">
          <div className="absolute bottom-0 right-0">
            <Image
              src="/images/sideDesign.svg"
              alt="side desgin"
              width={100}
              height={100}
              className=" w-full h-full"
            />
          </div>
          {/* right section top row */}
          {/* <div className=" w-full flex justify-end items-center   p-4 pb-0"> */}
          <DesktopHeader />
          {/* </div> */}
          <div className=" w-full   bg-[#F5F7FA] flex justify-center relative">
            <div className="w-full md:w-full min-h-[600px] bg-white !rounded-3xl  shadow-lastTransaction">
              <div className="py-4 px-2 md:p-6">
                <div className="flex justify-center">
                  {faceImageFromChild ? (
                    <Image
                      src={faceImageFromChild}
                      alt="Orizon profile"
                      width={100}
                      height={100}
                      className="rounded-full mb-4 border-[3px] border-primary-600  !h-[100px] max-w-[100px] object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={100}
                      height={100}
                      className="rounded-full mb-4 border-[3px] border-primary-500 !w-[100px] !h-[100px]"
                    />
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <p className="text-[#071437] text-lg font-semibold leading-5 capitalize">
                    {customer
                      ? `${customer.firstname} ${customer.lastname}`
                      : "Loading..."}
                  </p>
                  {customer && customer.mainStatus === "Approved" && (
                    <MdVerified className="w-4 h-4 text-[#1B84FF] relative top-[1.5px]" />
                  )}
                </div>
                <div className="flex justify-center items-center gap-5">
                  <div className="flex items-center justify-center gap-1">
                    <TbTopologyStarRing2 className="w-[14px] h-[20px] text-[#99A1B7]" />
                    <p className="text-[#78829D] text-sm font-medium leading-5">
                      abc work
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <PiMapPinLight className="w-[14px] h-[20px] text-[#99A1B7]" />
                    <p className="text-[#78829D] text-sm font-medium leading-5">
                      {customer ? customer.countryofresidence : "Loading..."}
                    </p>
                  </div>
                  {customer?.email && (
                    <div className="flex items-center justify-center gap-1">
                      <HiOutlineEnvelope className="w-[14px] h-[20px] text-[#99A1B7]" />
                      <p className="text-[#78829D] text-sm font-medium leading-5">
                        {customer ? customer.email : "Loading..."}
                      </p>
                    </div>
                  )}
                </div>
                <div className=" md:flex relative">
                  <Tabs tabs={tabs} />
                  <GrPowerReset
                    onClick={() => setHitApi(!hitApi)}
                    className=" absolute -top-5 -right-1 md:top-2 md:right-1 cursor-pointer text-lg md:text-2xl text-[#4B5675] hover:text-tabHoverColor active:text-tabActiveColor"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomerViewDetails
        isCustomerViewDetailOpen={isCustomerViewDetailOpen}
        setIsEditFlyoutOpen={setIsCustomerViewDetailOpen}
        customer={customer}
        selectedButton={selectedButton}
        setFaceImageFromChild={setFaceImageFromChild}
        setIdEctoFromChild={setIdEctoFromChild}
        setIdVersoFromChild={setIdVersoFromChild}
        setUserSignatureFromChild={setUserSignatureFromChild}
        setUserVideoFromChild={setUserVideoFromChild}
        hitApi={hitApi}
        setHitApi={setHitApi}
      />
    </>
  );
}
