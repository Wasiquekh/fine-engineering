"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AxiosProvider from "../provider/AxiosProvider";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import StorageManager from "../provider/StorageManager";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";

const storage = new StorageManager();
const axiosProvider = new AxiosProvider();

interface FormValues {
  email: string;
  password: string;
}

export default function LoginHome() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const accessToken = storage.getAccessToken();
    if (accessToken && accessToken !== "null" && accessToken !== "") {
      router.replace("/dashboard");
    }
  }, [router]);

  const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email or User ID is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmitLogin = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await axiosProvider.post("/fineengg_erp/system/system/login", {
        email: values.email,
        password: values.password,
      });
      
      if (res.status !== 200) {
        toast.error("Login failed. Please try again.");
        return;
      }

      const responseData = res.data;
      console.log("📥 Login response:", responseData);
      
      if (responseData.success) {
        const data = responseData.data;
        
        // Save user data
        await storage.saveUserId(data.id);
        await storage.saveUserName(data.name);
        await storage.saveUserEmail(values.email);
        await storage.saveUserPermissions(data.permissions);
        
        // Save secret key if present
        if (data.secretKey) {
          console.log("🔐 Saving secret key");
          await storage.saveUserSecretKey(data.secretKey);
        }
        
        // Save temp data for TOTP
        if (data.tempToken) {
          await storage.saveTempToken(data.tempToken);
          await storage.saveTempUserId(data.id);
          await storage.saveTotpSetupRequired(data.requiresTotpSetup ? "true" : "false");
        }
        
        router.push("/qrcode");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.msg || "Username or password is incorrect");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-[#F5F5F5] hidden md:block fixed inset-0">
        <Image
          src="/images/fine-engineering-login-bg.svg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-[90%] max-w-[500px] shadow-loginBoxShadow bg-white px-6 sm:px-12 py-10 sm:py-16 rounded-lg">
          <div className="relative mx-auto mb-5 w-[250px] h-[120px]">
            <Image
              src="/images/fine-engineering-icon.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>

          <p className="font-bold text-lg text-center text-black mb-6">
            Login to Fine Engineering
          </p>
          
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmitLogin}
          >
            {({ setFieldValue }) => (
              <Form className="w-full">
                <div className="w-full">
                  <p className="text-[#232323] text-base mb-2">
                    Email or User ID
                  </p>
                  <div className="relative">
                    <Field
                      type="text"
                      name="email"
                      autoComplete="username"
                      placeholder="Enter your User ID/Email"
                      className="focus:outline-none w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-7"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm absolute top-14"
                    />
                  </div>
                  
                  <p className="text-[#232323] text-base mb-2">
                    Password
                  </p>
                  <div className="relative">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      onChange={(e) => setFieldValue("password", e.target.value)}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="focus:outline-none w-full h-[50px] border border-[#DFEAF2] rounded-[4px] text-[15px] placeholder-[#718EBF] pl-4 mb-8"
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
                    className="bg-primary-600 rounded-[4px] w-full h-[50px] text-center text-white text-lg font-medium hover:bg-primary-500 disabled:opacity-50"
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
  );
}