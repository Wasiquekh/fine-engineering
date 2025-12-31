import React, { useContext, useEffect, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import { AppContext } from "../AppContext";
import { RiDeleteBin6Line } from "react-icons/ri";
import UserActivityLogger from "../../provider/UserActivityLogger";
import Swal from "sweetalert2";
import Image from "next/image";
import { IoVideocam } from "react-icons/io5";
import { Dispatch, SetStateAction } from "react";
import ReactPlayer from "react-player";
import { useSearchParams } from "next/navigation";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();
const activityLogger = new UserActivityLogger();

interface Customer {
  id: string;
  firstname: string;
  lastname: string;
  birthdate: string;
  gender: string;
  mobilephonenumber: string;
  email: string;
  streetaddress: string;
  countryofbirth: string;
  countryofresidence: string;
  updated_at: string;
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
  [key: string]: any;
}
// Props interface for SidebarUserUpdateForm
interface CustomerViewDetailsProps {
  isCustomerViewDetailOpen: boolean;
  setIsEditFlyoutOpen: Dispatch<SetStateAction<boolean>>;
  customer: Customer; // Add the customer property here
  selectedButton: string | null; // Allow null as a possible value
  setFaceImageFromChild: (value: string) => void;
  setIdEctoFromChild: (value: string) => void;
  setIdVersoFromChild: (value: string) => void;
  setUserSignatureFromChild: (value: string) => void;
  setUserVideoFromChild: (value: string) => void;
  setHitApi: Dispatch<SetStateAction<boolean>>;
  hitApi: boolean;
}

// SidebarUserUpdateForm Component
const SidebarUserUpdateForm: React.FC<CustomerViewDetailsProps> = ({
  isCustomerViewDetailOpen,
  setIsEditFlyoutOpen,
  setHitApi,
  hitApi,
  customer,
  selectedButton,
  setFaceImageFromChild,
  setIdEctoFromChild,
  setIdVersoFromChild,
  setUserSignatureFromChild,
  setUserVideoFromChild,
}) => {
  const [userDescription, setUserDescription] = useState<string | null>(null);
  //console.log('user desc',userDescription)
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [livenessScore, setLivenessScore] = useState<string | undefined>(
    undefined
  );
  const [idCardEcto, setIdCardEcto] = useState<string | undefined>(undefined);
  const [idCardVerso, setIdCardVerso] = useState<string | undefined>(undefined);
  const [customerShortVideo, setCustomerShortVideo] = useState<
    string | undefined
  >(undefined);
  const [customerSignature, setCustomerSignature] = useState<
    string | undefined
  >(undefined);

  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { accessToken } = useContext(AppContext);

  const fetchUserSignature = async () => {
    if (
      customer &&
      customer.usersignature !== undefined &&
      customer.usersignature !== null
    ) {
      const fullUrl = customer.usersignature;
      const lastPart = fullUrl.split("/").pop();
      try {
        const response = await axiosProvider.post("/getsignature", {
          filename: lastPart,
        });

        setCustomerSignature(response.data.data.url);
        setUserSignatureFromChild(response.data.data.url);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };
  const fetchIdCard = async () => {
    if (
      customer &&
      customer.idcardrecto !== undefined &&
      customer.idcardrecto !== null
    ) {
      const fullUrlEcto = customer.idcardrecto;
      const lastPartEcto = fullUrlEcto.split("/").pop();
      const fullUrlVerso = customer.idcardverso;
      const lastPartVerso = fullUrlVerso.split("/").pop();
      try {
        const response = await axiosProvider.post("/getsubmitocr", {
          frontImageFilename: lastPartEcto,
          backImageFilename: lastPartVerso,
        });
        // console.log("ID CARD ECTO", response);
        setIdCardEcto(response.data.data.frontImageUrl);
        setIdCardVerso(response.data.data.backImageUrl);
        setIdEctoFromChild(response.data.data.frontImageUrl);
        setIdVersoFromChild(response.data.data.backImageUrl);

        // toast.success("Successfully get");
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to get Id card Ecto");
      }
    }
  };
  const fetchDataVideo = async () => {
    if (
      customer &&
      customer.shortintrovideo !== undefined &&
      customer.shortintrovideo !== null
    ) {
      const fullUrl = customer.shortintrovideo;
      const lastPart = fullUrl.split("/").pop();
      try {
        const response = await axiosProvider.post("/getvideo", {
          filename: lastPart,
        });
        //console.log('SHORT VIDEO',response.data.data.url);
        setCustomerShortVideo(response.data.data.url);
        setUserVideoFromChild(response.data.data.url);

        // toast.success("Successfully get");
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to get Image");
      }
    }
  };
  const fetchData = async () => {
    if (
      customer &&
      customer.face_id_url !== undefined &&
      customer.face_id_url !== null
    ) {
      const decimalValue = customer.liveness_score;
      const percentage = (decimalValue * 100).toFixed(2);
      setLivenessScore(percentage);
      const fullUrl = customer.face_id_url;
      const lastPart = fullUrl.split("/").pop();
      try {
        const response = await axiosProvider.post("/getfaceid", {
          filename: lastPart,
        });
        //setFaceImage(response.data.data.url);
        setFaceImage(response.data.data.url);
        setFaceImageFromChild(response.data.data.url);

        // toast.success("Successfully get");
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to get Image");
      }
    }
  };

  useEffect(() => {
    // Ensure that fetchData is called when the 'customer' prop is available
    if (customer) {
      fetchData();
      fetchIdCard();
      fetchDataVideo();
      fetchUserSignature();
    }
  }, [customer, hitApi]);

  useEffect(() => {
    fetchData();
    fetchIdCard();
    fetchDataVideo();
    fetchUserSignature();
  }, [hitApi]);
  // console.log("MY HIT API", hitApi);
  const reject = async (verification: string) => {
    setIsEditFlyoutOpen(false);

    // Define different dropdown options based on the verification type
    const rejectionOptions: Record<string, Record<string, string>> = {
      liveness_detection: {
        "Liveness Score min 90%": "Liveness Score min 90%",
        "Image is blur": "Image is blur",
        "Face image not align": "Face image not align",
      },
      identity_matching: {
        "Miss matching": "Miss matching",
        "Card image is blur": "Card image is blur",
      },
      user_details_verification: {
        "Name is miss match": "Name is miss match",
        "Mobile number is missmatch": "Mobile number is missmatch",
        "DOB is miss match": "DOB is miss match",
      },
      scanned_id_card_verification: {
        "ID card is miss match": "ID card is miss match",
        "Card is blur": "Card is blur",
      },
      five_second_face_video_verification: {
        "Video is blur": "Video is blur",
        "Face is not showing": "Face is not showing",
      },
      signature_verification: {
        "Signature is not proper": "Signature is not proper",
        "Signature dot": "Signature is dot",
        "Signature is missmatch": "Signature is missmatch",
      },
    };

    const inputOptions = rejectionOptions[verification];

    if (!inputOptions) {
      console.warn(
        "No rejection options found for verification type:",
        verification
      );
      return; // Do nothing if the verification type is not found
    }
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to reject this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      input: "select", // Change input type to select dropdown
      inputOptions,
      inputPlaceholder: "Select a reason", // Placeholder text
      inputValidator: (value) => {
        if (!value) {
          return "You need to select a reason!";
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const reason = result.value; // Get the selected reason
        // console.log("Reason for rejection:", reason);
        if (customer && customer.face_id_url !== undefined) {
          try {
            const response = await axiosProvider.post("/rejectuser", {
              customer_id: id,
              system_user_id: storage.getUserId(),
              verification_type: verification,
              reason_reject: reason,
            });
            toast.success("Customer is rejected");
            setHitApi(!hitApi);
            await activityLogger.rejectedUser(id, verification);
          } catch (error) {
            console.error("Customer rejection failed:", error);
            toast.error("Customer rejection failed");
          }
        }
      }
    });
  };
  const approve = async (verification: string) => {
    setIsEditFlyoutOpen(false);
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to approve this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (customer && customer.face_id_url !== undefined) {
          // console.log('customer id',customer.id);
          // console.log('system user id',storage.getUserId())
          try {
            const response = await axiosProvider.post("/approveuser", {
              customer_id: id,
              system_user_id: storage.getUserId(),
              verification_type: verification,
            });
            toast.success("Customer is Approved");
            // toast.success("Successfully get");
            setHitApi(!hitApi);
            await activityLogger.approvedUser(id, verification);
          } catch (error) {
            console.error("Customer is not Approved:", error);
            toast.error("Customer is not Approved");
          }
        }
      }
    });
  };

  return (
    <>
      {isCustomerViewDetailOpen && (
        <div
          className="  bg-[#1f1d1d80] fixed h-full w-full top-0 left-0  z-[1000]"
          onClick={() => setIsEditFlyoutOpen(false)}
        ></div>
      )}
      <div
        className={`filterflyout ${
          isCustomerViewDetailOpen ? "filteropen" : ""
        }`}
      >
        {selectedButton === "one" && (
          <div className=" w-full">
            <div className="px-0 py-0 bg-white rounded-xl flex-col justify-start items-start gap-5 inline-flex w-full">
              <div className=" flex justify-between items-center w-full ">
                <div className=" justify-center items-center gap-4 inline-flex">
                  <div className="h-[50px] w-[50px] flex items-center justify-center bg-black !rounded-full w-full>">
                    <Image
                      src="/images/Liveness Detection.svg"
                      alt="Orizon profile"
                      width={26}
                      height={26}
                      style={{ filter: "invert(100%)" }} // Makes it white
                      className="!h-[40px]"
                    />
                  </div>
                  <div className=" px-7 py-3 bg-progressBtn rounded-[4px] ">
                    <div className="OnProgress text-white text-sm font-semibold">
                      On Progress
                    </div>
                  </div>
                </div>
                <div className="flex justify-end ">
                  <button
                    type="button"
                    onClick={() => setIsEditFlyoutOpen(false)}
                    className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="LivenessDetection w-full text-[#0e0e0e] text-base font-medium">
                Liveness Detection
              </div>
              <p>Face Image</p>
              <div className="w-full flex justify-between">
                <div className="w-full md:w-[49%]">
                  {faceImage ? (
                    <Image
                      src={faceImage}
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
                <div className="hidden md:block w-[49%]"></div>
              </div>
              {livenessScore ? (
                <div className="w-full">
                  <h1 className="text-xl font-semibold mb-2">
                    Liveness Score: {livenessScore}%
                  </h1>
                  <div className="w-full bg-gray-200 rounded-lg h-4">
                    <div
                      className="bg-progressBtn h-full rounded-lg"
                      style={{ width: `${livenessScore}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                "loading"
              )}

              <div className=" flex flex-col gap-y-3 md:flex-row md:justify-between w-full">
                <button
                  onClick={() => approve("liveness_detection")}
                  className="bg-approveBtn hover:bg-rejectBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject("liveness_detection")}
                  className="bg-rejectBtn hover:bg-approveBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedButton === "two" && (
          <div className=" w-full">
            <div className="px-0 py-0 bg-white rounded-xl flex-col justify-start items-start gap-5 inline-flex w-full">
              <div className=" flex justify-between items-center w-full ">
                <div className=" justify-center items-center gap-4 inline-flex">
                  <div className="h-[50px] w-[50px] flex items-center justify-center bg-black !rounded-full w-full>">
                    <Image
                      src="/images/identity matching.svg"
                      alt="Orizon profile"
                      width={26}
                      height={26}
                      style={{ filter: "invert(100%)" }} // Makes it white
                      className="!h-[40px]"
                    />
                  </div>
                  <div className=" px-7 py-3 bg-progressBtn rounded-[4px] ">
                    <div className="OnProgress text-white text-sm font-semibold">
                      On Progress
                    </div>
                  </div>
                </div>
                <div className="flex justify-end ">
                  <button
                    type="button"
                    onClick={() => setIsEditFlyoutOpen(false)}
                    className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="LivenessDetection w-[279px] text-[#0e0e0e] text-base font-medium">
                Identity Matching
              </div>
              <div className="w-full flex flex-col md:flex-row md:justify-between mb-5">
                <div className="w-full md:w-[49%]">
                  <p className="mb-5">ID Card Ecto</p>
                  {idCardEcto ? (
                    <Image
                      src={idCardEcto}
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
                <div className="w-full md:w-[49%]">
                  <p className="mb-5 mt-5 md:mt-0">Face Image</p>
                  {faceImage ? (
                    <Image
                      src={faceImage}
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
              </div>
              <div className="mt-0 md:mt-5 w-full">
                {livenessScore ? (
                  <div className="w-full">
                    <h1 className="text-xl font-semibold mb-2">
                      Face Match Score: {customer.face_match_score}%
                    </h1>
                    <div className="w-full bg-gray-200 rounded-lg h-4">
                      <div
                        className="bg-progressBtn h-full rounded-lg"
                        style={{ width: `${customer.face_match_score}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  "loading"
                )}
              </div>
              <div className=" flex flex-col gap-y-3 md:flex-row md:justify-between w-full">
                <button
                  onClick={() => approve("identity_matching")}
                  className="bg-approveBtn hover:bg-rejectBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject("identity_matching")}
                  className="bg-rejectBtn hover:bg-approveBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedButton === "three" && (
          <div className=" w-full">
            <div className="px-0 py-0 bg-white rounded-xl flex-col justify-start items-start gap-5 inline-flex w-full">
              <div className=" flex justify-between items-center w-full ">
                <div className=" justify-center items-center gap-4 inline-flex">
                  <div className="h-[50px] w-[50px] flex items-center justify-center bg-black !rounded-full w-full>">
                    <Image
                      src="/images/User Detail Verification.svg"
                      alt="Orizon profile"
                      width={26}
                      height={26}
                      style={{ filter: "invert(100%)" }} // Makes it white
                      className="!h-[40px]"
                    />
                  </div>
                  <div className=" px-7 py-3 bg-progressBtn rounded-[4px] ">
                    <div className="OnProgress text-white text-sm font-semibold">
                      On Progress
                    </div>
                  </div>
                </div>
                <div className="flex justify-end ">
                  <button
                    type="button"
                    onClick={() => setIsEditFlyoutOpen(false)}
                    className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>
              <div className="LivenessDetection w-[279px] text-[#0e0e0e] text-base font-medium">
                User Detail Verification
              </div>
              <div className="w-full">
                <table className="min-w-full border border-gray-300 text-left text-sm">
                  <tbody>
                    <tr className="border-b">
                      <th className="px-4 py-2 font-medium text-gray-700">
                        Full Name
                      </th>
                      <td className="px-4 py-2">
                        {customer?.firstname || "loading"}{" "}
                        {customer?.lastname || "loading"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <th className="px-4 py-2 font-medium text-gray-700">
                        Date of Birth
                      </th>
                      <td className="px-4 py-2">
                        {customer?.birthdate || "loading"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <th className="px-4 py-2 font-medium text-gray-700">
                        Mobile Number
                      </th>
                      <td className="px-4 py-2">
                        {customer?.mobilephonenumber || "loading"}
                      </td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-700">
                        Country
                      </th>
                      <td className="px-4 py-2">
                        {customer?.streetaddress || "loading"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className=" flex flex-col gap-y-3 md:flex-row md:justify-between w-full">
                <button
                  onClick={() => approve("user_details_verification")}
                  className="bg-approveBtn hover:bg-rejectBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject("user_details_verification")}
                  className="bg-rejectBtn hover:bg-approveBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedButton === "four" && (
          <div className=" w-full">
            <div className="px-0 py-0 bg-white rounded-xl flex-col justify-start items-start gap-5 inline-flex w-full">
              <div className=" flex justify-between items-center w-full ">
                <div className=" justify-center items-center gap-4 inline-flex">
                  <div className="h-[50px] w-[50px] flex items-center justify-center bg-black !rounded-full w-full>">
                    <Image
                      src="/images/Scanned ID Card Verification.svg"
                      alt="Orizon profile"
                      width={26}
                      height={26}
                      style={{ filter: "invert(100%)" }} // Makes it white
                      className="!h-[40px]"
                    />
                  </div>
                  <div className=" px-7 py-3 bg-progressBtn rounded-[4px] ">
                    <div className="OnProgress text-white text-sm font-semibold">
                      On Progress
                    </div>
                  </div>
                </div>
                <div className="flex justify-end ">
                  <button
                    type="button"
                    onClick={() => setIsEditFlyoutOpen(false)}
                    className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="LivenessDetection w-[279px] text-[#0e0e0e] text-base font-medium">
                Scanned ID Card Verification
              </div>
              <div className="w-full flex flex-col md:flex-row md:justify-between mb-0 md:mb-6">
                <div className="w-full md:w-[49%]">
                  <p className="mb-5">Front Image</p>
                  {idCardEcto ? (
                    <Image
                      src={idCardEcto}
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
                <div className="w-full md:w-[49%]">
                  <p className="mt-5 md:mt-0 mb-5">Back Image</p>
                  {idCardVerso ? (
                    <Image
                      src={idCardVerso}
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
              </div>
              <div className=" flex flex-col gap-y-3 md:flex-row md:justify-between w-full mt-5">
                <button
                  onClick={() => approve("scanned_id_card_verification")}
                  className="bg-approveBtn hover:bg-rejectBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject("scanned_id_card_verification")}
                  className="bg-rejectBtn hover:bg-approveBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedButton === "five" && (
          <div className=" w-full">
            <div className="px-0 py-0 bg-white rounded-xl flex-col justify-start items-start gap-5 inline-flex w-full">
              <div className=" flex justify-between items-center w-full ">
                <div className=" justify-center items-center gap-4 inline-flex">
                  <div className="h-[50px] w-[50px] flex items-center justify-center bg-black !rounded-full w-full>">
                    <Image
                      src="/images/Five Second Video Verification.svg"
                      alt="Orizon profile"
                      width={26}
                      height={26}
                      style={{ filter: "invert(100%)" }} // Makes it white
                      className="!h-[40px]"
                    />
                  </div>
                  <div className=" px-7 py-3 bg-progressBtn rounded-[4px] ">
                    <div className="OnProgress text-white text-sm font-semibold">
                      On Progress
                    </div>
                  </div>
                </div>
                <div className="flex justify-end ">
                  <button
                    type="button"
                    onClick={() => setIsEditFlyoutOpen(false)}
                    className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>
              <div className="LivenessDetection w-[279px] text-[#0e0e0e] text-base font-medium">
                Five Second Video Verification
              </div>
              <div className="w-full flex flex-col md:flex-row md:justify-between !mb-0 md:mb-6 md:!h-[450px]">
                <div className="w-full">
                  {customerShortVideo ? (
                    <div className="custom-player-container">
                      <ReactPlayer
                        url={customerShortVideo}
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
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
              </div>
              <div className=" flex flex-col gap-y-3 md:flex-row md:justify-between w-full">
                <button
                  onClick={() => approve("five_second_face_video_verification")}
                  className="bg-approveBtn hover:bg-rejectBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject("five_second_face_video_verification")}
                  className="bg-rejectBtn hover:bg-approveBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedButton === "six" && (
          <div className=" w-full">
            <div className="px-0 py-0 bg-white rounded-xl flex-col justify-start items-start gap-5 inline-flex w-full">
              <div className=" flex justify-between items-center w-full ">
                <div className=" justify-center items-center gap-4 inline-flex">
                  <div className="h-[50px] w-[50px] flex items-center justify-center bg-black !rounded-full w-full>">
                    <Image
                      src="/images/Signature Verification.svg"
                      alt="Orizon profile"
                      width={26}
                      height={26}
                      style={{ filter: "invert(100%)" }} // Makes it white
                      className="!h-[40px]"
                    />
                  </div>
                  <div className=" px-7 py-3 bg-progressBtn rounded-[4px] ">
                    <div className="OnProgress text-white text-sm font-semibold">
                      On Progress
                    </div>
                  </div>
                </div>
                <div className="flex justify-end ">
                  <button
                    type="button"
                    onClick={() => setIsEditFlyoutOpen(false)}
                    className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="LivenessDetection w-[279px] text-[#0e0e0e] text-base font-medium">
                Signature Verification
              </div>
              <div className="flex flex-col md:flex-row md:justify-between w-full">
                <div className="w-full md:w-[49%]">
                  {customerSignature ? (
                    <Image
                      src={customerSignature}
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  ) : (
                    <Image
                      src="/images/dummy-image.jpg"
                      alt="Orizon profile"
                      width={200}
                      height={200}
                      className="!h-full !w-full rounded"
                    />
                  )}
                </div>
                <div className="hidden md:w-[49%]"></div>
              </div>
              <div className=" flex flex-col gap-y-3 md:flex-row md:justify-between w-full">
                <button
                  onClick={() => approve("signature_verification")}
                  className="bg-approveBtn hover:bg-rejectBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => reject("signature_verification")}
                  className="bg-rejectBtn hover:bg-approveBtn text-white w-full md:w-[49%] p-3 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarUserUpdateForm;
