"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import OtpInput from "react-otp-input";

const axiosProvider = new AxiosProvider();
const storage = new StorageManager();

export default function OtpHome() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [otp, setOtp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    setChecking(true);
    
    console.log("========== QR PAGE CHECKING USER STATUS ==========");
    
    // Check if already have access token
    const accessToken = storage.getAccessToken();
    if (accessToken && accessToken !== "null" && accessToken !== "") {
      router.replace("/dashboard");
      return;
    }

    // Get temp data from login
    const tempToken = storage.getTempToken();
    const tempUserId = storage.getTempUserId();
    const totpSetupRequired = storage.getTotpSetupRequired();
    const storedUserId = storage.getUserId();
    const storedSecretKey = storage.getDecryptedUserSecretKey();
    
    console.log("Temp data:", { tempToken: !!tempToken, tempUserId, totpSetupRequired });
    console.log("Stored data:", { storedUserId, hasSecretKey: !!storedSecretKey });

    // Use tempUserId if available, otherwise regular userId
    const finalUserId = tempUserId || storedUserId;
    
    if (!finalUserId) {
      toast.error("Session expired. Please login again.");
      router.push("/login");
      return;
    }

    setUserId(finalUserId);

    // Check if user has secret key
    const hasValidSecret = storedSecretKey && storedSecretKey.length > 10;

    if (hasValidSecret) {
      // User has secret key - VERIFICATION MODE
      console.log("✅ VERIFICATION MODE");
      setIsSetup(false);
      setSecretKey(storedSecretKey);
      setLoading(false);
    } else {
      // No secret key - SETUP MODE
      console.log("🆕 SETUP MODE");
      setIsSetup(true);
      await generateQRCode(finalUserId);
    }
    
    setChecking(false);
  };

  const generateQRCode = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Generating QR code for userId:", userId);
      
      const res = await axiosProvider.post(`/fineengg_erp/system/system/generateqrcode?userId=${userId}`, {});
      
      console.log("QR Code response:", res.data);
      
      if (res.status === 200 && res.data.success) {
        setQrCode(res.data.data.qrCodeDataURL);
        setSecretKey(res.data.data.secret);
        
        // Save the new secret key
        await storage.saveUserSecretKey(res.data.data.secret);
        toast.success("QR Code generated successfully");
      } else {
        setError(res.data.msg || "Failed to generate QR code");
        toast.error(res.data.msg || "Failed to generate QR code");
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setError(error.response?.data?.msg || "Failed to generate QR code");
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please login again.");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      console.log("========== SUBMITTING TOTP ==========");
      console.log("Mode:", isSetup ? "SETUP" : "VERIFICATION");
      
      // Create payload
      const payload: any = {
        token: otp,
        userId: userId,
        isSetup: isSetup
      };
      
      // Only include secretKey for setup mode
      if (isSetup) {
        if (!secretKey) {
          toast.error("Secret key not found. Please regenerate QR code.");
          setLoading(false);
          return;
        }
        payload.secretKey = secretKey;
      }
      
      const res = await axiosProvider.post("/fineengg_erp/system/system/verifytotp", payload);

      console.log("Verify TOTP response:", res.data);

      if (res.status === 200 && res.data.success) {
        // Save the access token
        await storage.saveAccessToken(res.data.data.token);
        
        // Save the secret key if this was setup
        if (isSetup && secretKey) {
          await storage.saveUserSecretKey(secretKey);
        }
        
        // Save user data
        if (res.data.data.user) {
          await storage.saveUserId(res.data.data.user.id);
          await storage.saveUserName(res.data.data.user.name);
          await storage.saveUserEmail(res.data.data.user.email);
          
          if (res.data.data.user.permissions) {
            await storage.saveUserPermissions(res.data.data.user.permissions);
          }
        }
        
        // Clear temp data
        await storage.removeTempToken();
        await storage.removeTempUserId();
        await storage.removeTotpSetupRequired();
        
        toast.success(isSetup ? "TOTP setup successful!" : "Login successful!");
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(res.data.msg || "Invalid code. Please try again.");
        setOtp("");
      }
    } catch (error: any) {
      console.error("Network error:", error);
      toast.error(error.response?.data?.msg || "Failed to verify code");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (userId) {
      generateQRCode(userId);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="bg-[#F5F5F5] hidden md:block fixed inset-0">
        <Image
          src="/images/fine-engineering-login-bg.svg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>
    
      <div className="absolute top-0 bottom-0 left-0 right-0 mx-auto my-auto w-[90%] max-w-[500px] h-auto min-h-[500px] shadow-loginBoxShadow bg-white px-6 sm:px-12 py-10 sm:py-16 rounded-lg overflow-y-auto flex flex-col justify-center items-center">
        <div className="relative mx-auto mb-5 w-[250px] h-[120px]">
          <Image
            src="/images/fine-engineering-icon.png"
            alt="Fine Engineering"
            fill
            className="object-contain"
          />
        </div>

        <p className="font-bold text-lg text-center text-black mb-2">
          {isSetup ? "Two-Factor Authentication Setup" : "Two-Factor Authentication"}
        </p>
        
        {!isSetup && !loading && (
          <p className="text-sm text-gray-600 text-center mb-6">
            Please enter the 6-digit code from your authenticator app
          </p>
        )}
        
        {isSetup && (
          <p className="text-sm text-gray-600 text-center mb-6">
            Scan this QR code with Google Authenticator or any TOTP app
          </p>
        )}
        
        {loading && isSetup && !qrCode && !error && (
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generating QR code...</p>
          </div>
        )}
        
        {error && !qrCode && (
          <div className="text-center mb-6">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        )}
        
        {isSetup && qrCode && (
          <>
            <div className="flex justify-center mb-6">
              <Image
                src={qrCode}
                alt="QR Code"
                width={200}
                height={200}
                className="mx-auto border rounded-lg"
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-6 w-full">
              <p className="text-xs text-gray-500 mb-1">Secret Key (manual entry):</p>
              <p className="font-mono text-sm break-all">{secretKey}</p>
            </div>
          </>
        )}
        
        <form onSubmit={handleSubmit} className="w-full">
          <div>
            <div className="flex items-center justify-between mb-8 w-[96%] mx-auto">
              <OtpInput
                value={otp}
                onChange={handleChange}
                numInputs={6}
                shouldAutoFocus
                inputType="tel"
                containerStyle={{ display: "contents" }}
                renderInput={(props, index) => (
                  <input
                    {...props}
                    key={index}
                    className="!w-[14%] md:!w-[55px] h-12 sm:h-14 py-3 sm:py-4 text-center border-b border-[#BDD1E0] text-black text-lg sm:text-xl font-semibold focus:outline-none focus:border-b-2 focus:border-primary-500"
                  />
                )}
              />
            </div>

            <div className="w-full">
              <button
                type="submit"
                className="bg-primary-600 border rounded-[4px] w-full h-[50px] text-center text-white text-lg font-medium mb-3 hover:bg-primary-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Verifying..." : (isSetup ? "Verify & Complete Setup" : "Verify & Login")}
              </button>
              
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-primary-600 text-sm hover:underline text-center w-full mt-2"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}