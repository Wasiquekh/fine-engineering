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

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();
const activityLogger = new UserActivityLogger();

// Interface for Current User Data
interface CurrentUserData {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  role: string;
}

// Props interface for SidebarUserUpdateForm
interface SidebarUserUpdateFormProps {
  isEditFlyoutOpen: boolean;
  setIsEditFlyoutOpen: (open: boolean) => void;
  currentUserData: CurrentUserData;
  setShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}

// SidebarUserUpdateForm Component
const SidebarUserUpdateForm: React.FC<SidebarUserUpdateFormProps> = ({
  isEditFlyoutOpen,
  setIsEditFlyoutOpen,
  currentUserData,
  setShouldRefetch,
}) => {
  const [userDescription, setUserDescription] = useState<string | null>(null);
  //console.log('user desc',userDescription)
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const { accessToken } = useContext(AppContext);
  const permissions = storage.getUserPermissions();
  const hasSystemUserEdit = permissions?.some(
    (perm) => perm.name === "systemuser.edit"
  );
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if currentUserData and currentUserData.id are valid
        if (currentUserData && currentUserData.id) {
          // Send user ID along with other data to the API
          const res = await axiosProvider.post("/fetchsecret", {
            userId: currentUserData.id, // Send currentUserData.id to the API
          });
          setUserDescription(res.data.data.description);
        } else {
          console.log("User ID not found or currentUserData is missing");
        }
      } catch (error: any) {
        console.log("Error occurred:", error);
        setUserDescription("");
        // toast.error(error.response.data.msg || "An error occurred"); // Display the error message from the API response
      }
    };

    fetchData(); // Call fetchData only if currentUserData.id exists
  }, [currentUserData]); // Adding accessToken as a dependency if it changes

  const hanldleDelete = async () => {
    setIsEditFlyoutOpen(false);
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axiosProvider.post("/deletesecert", {
            userId: currentUserData.id, // Send currentUserData.id to the API
          });
          //console.log("%%%%%%%%%%%%%%%%%%%%%%%% ssucess api", res);
          toast.success("Secret Key Deleted");
        } catch (error: any) {
          // Check if error response exists and handle the error message
          if (error.res && error.res) {
            const errorMsg = error.res.msg || "An error occurred.";
            toast.error(errorMsg); // Display the error message in the toast
          }
        }
      }
    });
  };

  return (
    <>
      {isEditFlyoutOpen && (
        <div
          className="  bg-[#1f1d1d80] fixed h-full w-full top-0 left-0  z-[1000]"
          onClick={() => setIsEditFlyoutOpen(false)}
        ></div>
      )}
      <div className={`filterflyout ${isEditFlyoutOpen ? "filteropen" : ""}`}>
        <div className="flex  md:flex-row justify-between mb-4">
          <p className="text-primary-600 text-[26px] font-bold leading-9 hover:cursor-pointer block">
            User Details
          </p>
          <button
            type="button"
            onClick={() => setIsEditFlyoutOpen(false)}
            className="h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer"
          >
            X
          </button>
        </div>

        <div className="flex flex-row justify-between  mb-4 w-full md:w-[50%]">
          <p
            onClick={() => setIsVisible(true)}
            className={`text-[16px] font-medium leading-9 hover:cursor-pointer  hover:text-primary-600 hover:border-primary-600 hover:border-b-2 ${
              isVisible
                ? "text-primary-600 border-b-2 border-primary-500"
                : "text-gray-500"
            }`}
          >
            Personal Details
          </p>
          <p
            onClick={() => setIsVisible(false)}
            className={`text-[16px] font-medium leading-9 hover:cursor-pointer  hover:text-primary-600 hover:border-primary-600 hover:border-b-2 ${
              !isVisible
                ? "text-primary-600 border-b-2 border-primary-500 "
                : "text-gray-500"
            }`}
          >
            MF 2 Device
          </p>
        </div>

        {isVisible ? (
          <Formik
            initialValues={{
              id: currentUserData?.id || "",
              name: currentUserData?.name || "",
              mobile_number: currentUserData?.mobile_number || "",
              email: currentUserData?.email || "",
            }}
            enableReinitialize={true}
            validationSchema={Yup.object({
              name: Yup.string().required("Name is required"),
              mobile_number: Yup.string()
                .required("Mobile number is required")
                .matches(
                  /^\+\d{1,4}\d{10}$/,
                  "Enter a valid mobile number with country code"
                ),
              email: Yup.string()
                .email("Invalid email format")
                .required("Email is required"),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const res = await axiosProvider.post("/updateuser", values);
                if (res.status === 200) {
                  toast.success("User updated successfully!");
                  setIsEditFlyoutOpen(false);
                  setShouldRefetch((prev) => !prev);
                } else if (res.status === 204) {
                  toast.success("No Data Changed!");
                } else {
                  toast.error(`Unexpected response: ${res.status}`);
                }
                // Create instance and log activity
                await activityLogger.userUpdate(currentUserData.id);
              } catch (error) {
                console.error("Error during user update:", error);
                if (error.response) {
                  const { status, data } = error.response;
                  if (status === 409) {
                    toast.error(data?.msg || "Conflict error occurred.");
                  } else {
                    toast.error(
                      data?.msg ||
                        `Error: ${status} - ${
                          data?.message || "Something went wrong"
                        }`
                    );
                  }
                } else {
                  toast.error("Failed to submit the form.");
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => (
              <Form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col gap-3 mb-[10px]">
                  <div className="w-full flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="w-full">
                      <label className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Name
                      </label>
                      <Field
                        type="text"
                        name="name"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.name}
                        className={`hover:shadow-hoverInputShadow focus-border-primary w-full border rounded-[4px] text-sm leading-4 font-medium text-[#717171] py-4 px-4 ${
                          touched.name && errors.name
                            ? "border-red-500"
                            : "border-[#DFEAF2]"
                        }`}
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-red-500"
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Mobile
                      </label>
                      <Field
                        type="text"
                        name="mobile_number"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.mobile_number}
                        className={`hover:shadow-hoverInputShadow focus-border-primary w-full border rounded-[4px] text-sm leading-4 font-medium text-[#717171] py-4 px-4 ${
                          touched.mobile_number && errors.mobile_number
                            ? "border-red-500"
                            : "border-[#DFEAF2]"
                        }`}
                      />
                      <ErrorMessage
                        name="mobile_number"
                        component="div"
                        className="text-red-500"
                      />
                    </div>
                  </div>
                  <div className="w-full flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="w-full">
                      <label className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Email
                      </label>
                      <Field
                        type="email"
                        name="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email}
                        className={`hover:shadow-hoverInputShadow focus-border-primary w-full border rounded-[4px] text-sm leading-4 font-medium text-[#717171] py-4 px-4 ${
                          touched.email && errors.email
                            ? "border-red-500"
                            : "border-[#DFEAF2]"
                        }`}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-500"
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Role
                      </label>
                      <Field
                        as="select"
                        name="role"
                        onChange={handleChange}
                        className="hover:shadow-hoverInputShadow focus-border-primary w-full border rounded-[4px] text-sm leading-4 font-medium text-[#717171] py-4 px-4"
                      >
                        <option value="" disabled>
                          Select Role
                        </option>
                        {currentUserData?.role && (
                          <option value={currentUserData.role}>
                            {currentUserData.role}
                          </option>
                        )}
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="mt-10 w-full flex justify-end items-center gap-5">
                  {hasSystemUserEdit ? (
                    <button
                      type="submit"
                      onClick={() => setIsEditFlyoutOpen(false)}
                      disabled={isSubmitting}
                      className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white hover:bg-primary-600 hover:text-white w-full md:w-[48%]"
                    >
                      {isSubmitting ? "Updating Details" : "Update Details"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={() => setIsEditFlyoutOpen(false)}
                      disabled
                      className="py-[13px] px-[26px] bg-customBlue rounded-[4px] text-base font-medium leading-6 text-white cursor-not-allowed"
                    >
                      Not Access
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          <div className="w-full border rounded-lg p-0 sm:p-4 shadow-md">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className=" border-b">
                  <th className="text-left p-2 border text-[#0A0A0A] font-medium text-base leading-6">
                    Name
                  </th>
                  <th className="text-left p-2 border text-[#0A0A0A] font-medium text-base leading-6">
                    Description
                  </th>
                  <th className="text-left p-2 border text-[#0A0A0A] font-medium text-base leading-6">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  {userDescription ? (
                    <>
                      <td className="p-2 border">{currentUserData.name}</td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={userDescription || "No Description"}
                          className="border px-2 py-1 rounded w-full"
                          readOnly
                        />
                      </td>
                      <td className="p-2 border">
                        <button
                          onClick={hanldleDelete}
                          className="py-2 px-4 bg-black flex gap-1.5 items-center rounded-full hover:bg-primary-500 transition"
                        >
                          <RiDeleteBin6Line className="text-white w-4 h-4" />
                          <p className="text-sm leading-normal text-white">
                            Delete
                          </p>
                        </button>
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="p-2 text-center">
                      NO SECRET KEY FOUND
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarUserUpdateForm;
