"use client";
import Image from "next/image";
import Tabs from "../component/Tabs";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { useEffect, useState } from "react";
import { appCheck } from "../firebase-config";
import { getToken } from "firebase/app-check";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FormikHelpers,
  useFormik,
} from "formik";
import * as Yup from "yup";
import AxiosProvider from "../../provider/AxiosProvider";
import { useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { AppContext } from "../AppContext";
import LeftSideBar from "../component/LeftSideBar";
import UserActivityLogger from "../../provider/UserActivityLogger";
import Select, { SingleValue } from "react-select";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

const axiosProvider = new AxiosProvider();

interface FormValues {
  name: string;
  mobile_number: string;
  email: string;
  password: string;
  roleLevel: string;
}
const roleOptions = [
  { value: "1", label: "Admin" },
  { value: "2", label: "Non-Admin" },
  { value: "3", label: "Sub-Admin" },
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Your name is required"),
  mobile_number: Yup.string()
    .matches(
      /^\+\d{1,4}\d{10}$/,
      "Enter a valid mobile number with country code"
    ) // Regex for valid mobile number format
    .required("Mobile number is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Home() {
  const isChecking = useAuthRedirect();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>
  ) => {
    toast.success("Form submitted successfully!");
    return;
    console.log(values);
    try {
      const appCheckToken = await getToken(appCheck, true);
      const res = await axiosProvider.post("/register", values);

      if (res.status === 200) {
        toast.success("Form submitted successfully!");
        resetForm();
        // window.location.reload();
      }
      //console.log('user register',res.data.data.userId)
      // Create instance and log activity
      const activityLogger = new UserActivityLogger();
      await activityLogger.userRegister(res.data.data.userId);
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.error(error.response.data.msg || "Conflict error occurred.");
      } else {
        console.error("Error during registration:", error);
        toast.error("Failed to submit the form.");
      }
    }
  };

  const tabs = [
    {
      label: "Create New User",
      content: (
        <>
          <div className="flex gap-8 pt-3 flex-col md:flex-row">
            <Formik
              initialValues={{
                name: "",
                mobile_number: "",
                email: "",
                password: "",
                roleLevel: "1",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ setFieldValue, isSubmitting, values }) => (
                <Form className="w-full md:w-9/12">
                  <div className="w-full">
                    {/* Name Field */}
                    <div className="w-full flex flex-col md:flex-row gap-6">
                      <div className="w-full relative mb-3">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Your Name
                        </p>
                        <Field
                          type="text"
                          name="name"
                          placeholder="Charlene Reed"
                          className="hover:shadow-hoverInputShadow  focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-2 text-firstBlack"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="text-red-500 absolute top-[90px] text-xs"
                        />
                      </div>

                      {/* Mobile Number Field */}
                      <div className="w-full relative mb-3">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Mobile Number
                        </p>
                        <PhoneInput
                          country={"in"}
                          value={values.mobile_number}
                          onChange={(phone: string) => {
                            const formattedPhone = phone
                              ? phone.startsWith("+")
                                ? phone
                                : `+${phone}`
                              : "";
                            setFieldValue("mobile_number", formattedPhone);
                          }}
                          placeholder="Mobile Number"
                        />
                        <ErrorMessage
                          name="mobile_number"
                          component="div"
                          className="text-red-500 absolute top-[90px] text-xs"
                        />
                      </div>
                    </div>

                    {/* Email and Password Fields */}
                    <div className="w-full flex flex-col md:flex-row gap-6">
                      <div className="w-full relative mb-3">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Email
                        </p>
                        <Field
                          type="email"
                          name="email"
                          placeholder="Janedoe@gmail.com"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-2 text-firstBlack"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-red-500 absolute top-[90px] text-xs"
                        />
                      </div>

                      <div className="w-full relative mb-3">
                        <p className="text-[#232323] text-base leading-normal mb-2">
                          Password
                        </p>
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="********"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-2 text-firstBlack"
                        />
                        {showPassword ? (
                          <FaRegEye
                            onClick={togglePasswordVisibility}
                            className="absolute top-12 right-4 text-[#718EBF] text-[15px] cursor-pointer"
                          />
                        ) : (
                          <FaRegEyeSlash
                            onClick={togglePasswordVisibility}
                            className="absolute top-12 right-4 text-[#718EBF] text-[15px] cursor-pointer"
                          />
                        )}
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="text-red-500 absolute top-[90px] text-xs"
                        />
                      </div>
                    </div>

                    {/* Role Field */}
                    <div className="w-full justify-between">
                      <div className=" w-full md:w-[49%]  flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-full relative mb-8">
                          <p className="text-[#232323] text-base leading-normal mb-2">
                            Role
                          </p>
                          <Select
                            options={roleOptions}
                            value={
                              roleOptions.find(
                                (option) => option.value === values.roleLevel
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              setFieldValue(
                                "roleLevel",
                                selectedOption ? selectedOption.value : ""
                              );
                            }}
                            onBlur={() =>
                              setFieldValue("roleLevel", values.roleLevel)
                            }
                            isSearchable={false} // Disables typing
                            classNames={{
                              control: ({ isFocused }) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-600"
                                    : "!border-[#DFEAF2]"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: "4px",
                                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                                backgroundColor: "#fff",
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-600)" // Active (selected) background color
                                  : isFocused
                                  ? "var(--primary-100)" // Hover background color
                                  : "#fff", // Default background
                                color: isSelected ? "#fff" : "#333",
                                cursor: "pointer",
                              }),
                            }}
                          />
                        </div>
                      </div>
                      <div className=" hidden md:block w-[49%]"></div>
                    </div>

                    {/* Submit Button */}
                    <div className="w-full flex gap-6">
                      <div className="w-full flex justify-between">
                        <div className="w-full md:w-[49%]">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full  h-[50px] bg-primary-600 rounded-[4px] text-white text-lg leading-normal font-medium hover:bg-primary-600 hover:text-white"
                          >
                            {isSubmitting ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                        <div className="hidden md:block w-[49%]"></div>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
            <ToastContainer />
          </div>
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
        <div className="w-full md:w-[83%]  min-h-[500px]  rounded p-4  bg-[#F5F7FA] relative">
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
          {/* <div className=" w-full flex justify-end items-center gap-7 mb-3 p-4 "> */}
          <DesktopHeader />
          {/* </div> */}
          <div className=" w-full   bg-[#F5F7FA] flex justify-center relative ">
            <div className=" w-full min-h-[600px] bg-white rounded-[25px]">
              <div className="p-2 md:p-6">
                <Tabs tabs={tabs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
