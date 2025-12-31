"use client";
import Image from "next/image";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
//import { AppContext } from "./AppContext";
import AxiosProvider from "../provider/AxiosProvider";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import StorageManager from "../provider/StorageManager";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { constrainedMemory } from "process";

const storage = new StorageManager();

interface FormValues {
  email: string;
  password: string;
}
export default function LoginHome() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const storage = new StorageManager();
  const axiosProvider = new AxiosProvider();
  //const { setAccessToken } = useContext(AppContext);

  const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email or User ID is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmitLogin = async (values: FormValues) => {
    setLoading(true);
    router.push("/qrcode");
    setLoading(false);

    return;
    try {
      const res = await axiosProvider.post("/login", {
        email: values.email,
        password: values.password,
      });
      if (res.status !== 200) {
        console.error("Login failed", res.status, res.data);
      }
      //console.log('LOG IN',res)
      // console.log(res.data.data.secretKey);
      storage.saveUserId(res.data.data.id);
      storage.saveUserSecretKey(res.data.data.secretKey);
      storage.saveUserName(res.data.data.name);
      await storage.saveUserPermissions(res.data.data.permissions);
      router.push("/qrcode");
    } catch (error) {
      console.log(error);
      toast.error("Username or password is incorrect. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const accessTokenlocal = storage.getAccessToken();
  if (
    accessTokenlocal !== null &&
    accessTokenlocal !== "" &&
    accessTokenlocal !== "null"
  ) {
    router.replace("/dashboard");
  }
  // const value = localStorage.getItem("accessToken");
  // value === null ?
  // console.log("OOOOOOOOOOOOOOO", value);

  return (
    <>
  <div className="relative min-h-screen overflow-hidden">
  <div className="bg-[#F5F5F5] hidden md:block fixed inset-0">
    <Image
      src="/images/orizon-login-bg.svg"
      alt="Orizon iconLogo bg"
      fill
      className="object-cover"
      priority
    />
    <Image
      src="/images/orizonIcon.svg"
      alt="OrizonIcon"
      width={82}
      height={52}
      className="absolute top-20 left-28"
    />
    <Image
      src="/images/orizonIcon.svg"
      alt="OrizonIcon"
      width={82}
      height={52}
      className="absolute top-32 right-28"
    />
    <Image
      src="/images/orizonIcon.svg"
      alt="OrizonIcon"
      width={82}
      height={52}
      className="absolute top-1/2 left-[25%] -translate-y-1/2"
    />
    <Image
      src="/images/orizonIcon.svg"
      alt="OrizonIcon"
      width={82}
      height={52}
      className="absolute top-[60%] right-[25%] -translate-y-1/2"
    />
    <Image
      src="/images/orizonIcon.svg"
      alt="OrizonIcon"
      width={82}
      height={52}
      className="absolute top-[90%] right-0 left-0 mx-auto -translate-y-1/2"
    />
  </div>
  
  <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
    <div className="w-[90%] max-w-[500px] max-h-[587px] shadow-loginBoxShadow bg-white px-6 sm:px-12 py-10 sm:py-16 rounded-lg">
      <Image
        src="/images/orizonIcon.svg"
        alt="OrizonIcon"
        width={82}
        height={52}
        className="mx-auto mb-5"
      />
      <p className="font-bold text-lg sm:text-base leading-normal text-center text-black mb-6">
        Login to Orizon
      </p>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmitLogin}
      >
        {({ setFieldValue }) => (
          <Form className="w-full">
            <div className="w-full">
              <p className="text-[#232323] text-base leading-normal mb-2">
                Email or User ID
              </p>
              <div className="relative">
                <Field
                  type="text"
                  name="email"
                  autoComplete="username"
                  placeholder="Enter your User ID/Email"
                  className="focus:outline-none w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-7 text-[#718EBF] hover:shadow-hoverInputShadow focus:border-primary-500"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm absolute top-14"
                />
              </div>
              <p className="text-[#232323] text-base leading-normal mb-2">
                Password
              </p>
              <div className="relative">
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={(e) => setFieldValue("password", e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="focus:outline-none w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-8 text-[#718EBF] hover:shadow-hoverInputShadow focus:border-primary-500"
                />
                {showPassword ? (
                  <FaRegEye
                    onClick={togglePasswordVisibility}
                    className="absolute top-4 right-4 text-[#718EBF] text-[15px] cursor-pointer"
                  />
                ) : (
                  <FaRegEyeSlash
                    onClick={togglePasswordVisibility}
                    className="absolute top-4 right-4 text-[#718EBF] text-[15px] cursor-pointer"
                  />
                )}
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm absolute top-14"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 rounded-[4px] w-full h-[50px] text-center text-white text-lg font-medium leading-normal mb-3 hover:bg-primary-500 active:bg-primary-700 transition duration-100"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  </div>
</div>
    </>
  );
}
