"use client";
import Image from "next/image";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import { AppContext } from "../AppContext";
import UserActivityLogger from "../../provider/UserActivityLogger";
import OtpInput from "react-otp-input";

const axiosProvider = new AxiosProvider();

export default function OtpHome() {
  const storage = new StorageManager();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [secretKey, setSecretKey] = useState<string | null>(
    storage.getDecryptedUserSecretKey()
  );
  const [userId, setuserId] = useState<string | undefined>(storage.getUserId());
  const [otp, setOtp] = useState<string>("");
  const { setAccessToken } = useContext(AppContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!secretKey) {
        const res = await axiosProvider.post(
          "/fineengg_erp/generateqrcode",
          {}
        );
        if (res.status === 200) {
          setQrCode(res.data.data.qrCodeDataURL);
          setSecretKey(res.data.data.secret);
          storage.saveUserSecretKey(res.data.data.secret);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Invalid TOTP");
    }
  };

  const handleChange = (value: string) => {
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(false);
    setLoading(false);
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      setLoading(false);
      router.push("/dashboard");
      setLoading(false);
      return;
    }

    try {
      const res = await axiosProvider.post("/fineengg_erp/verifytotp", {
        token: otp,
        secretKey: secretKey,
        userId: userId,
      });

      setAccessToken(res.data.data.token);
      storage.saveAccessToken(res.data.data.token);
      //  expiryTokenafter24Hour();
      router.push("/dashboard");

      const activityLogger = new UserActivityLogger();
      await activityLogger.userLogin();
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Invalid Code. Please try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };
  // const expiryTokenafter24Hour = () => {
  //   setTimeout(() => {
  //     storage.removeAccessToken();
  //     window.location.reload();
  //   }, 60 * 1000);
  // };

  const accessTokenlocal = storage.getAccessToken();
  if (
    accessTokenlocal !== null &&
    accessTokenlocal !== "" &&
    accessTokenlocal !== "null"
  ) {
    router.replace("/dashboard");
  }
  return (
  <>
  <div className="fixed inset-0 overflow-hidden">
  <div className="bg-[#F5F5F5] hidden md:block fixed inset-0">
    {/* Background */}
    <Image
      src="/images/fine-engineering-login-bg.svg"
      alt="Orizon iconLogo bg"
      fill
      className="object-cover"
      priority
    />
  
    {/* Top Left */}
    <div className="absolute top-20 left-28 w-[300px] h-[160px]">
      <Image
        src="/images/fine-engineering-icon.png"
        alt="OrizonIcon"
        fill
        className="object-contain"
      />
    </div>
  
    {/* Top Right */}
    <div className="absolute top-32 right-28 w-[300px] h-[160px]">
      <Image
        src="/images/fine-engineering-icon.png"
        alt="OrizonIcon"
        fill
        className="object-contain"
      />
    </div>
  
    {/* Center Left */}
    <div className="absolute top-[60%] left-[17%] -translate-y-1/2 w-[300px] h-[160px]">
      <Image
        src="/images/fine-engineering-icon.png"
        alt="OrizonIcon"
        fill
        className="object-contain"
      />
    </div>
  
    {/* Center Right */}
    <div className="absolute top-[65%] right-[17%] -translate-y-1/2 w-[300px] h-[160px]">
      <Image
        src="/images/fine-engineering-icon.png"
        alt="OrizonIcon"
        fill
        className="object-contain"
      />
    </div>
  
    {/* Bottom Center */}
    <div className="absolute top-[98%] left-0 right-0 mx-auto -translate-y-1/2 w-[300px] h-[160px]">
      <Image
        src="/images/fine-engineering-icon.png"
        alt="OrizonIcon"
        fill
        className="object-contain"
      />
    </div>
  </div>
  

    <div className="absolute top-0 bottom-0 left-0 right-0 mx-auto my-auto w-[90%] max-w-[500px] h-[587px] shadow-loginBoxShadow bg-white px-6 sm:px-12 py-10 sm:py-16 rounded-lg overflow-y-auto  flex flex-col justify-center items-center">
<div className="relative mx-auto mb-5 w-[250px] h-[120px]">
  <Image
    src="/images/fine-engineering-icon.png"
    alt="OrizonIcon"
    fill
    className="object-contain"
  />
</div>

      <p className="font-bold text-lg sm:text-base leading-normal text-center text-black mb-2">
        Authenticate your Account
      </p>
      
      {/* QR Code Section - Uncomment when needed */}
      {qrCode && (
        <div className="flex justify-center mb-6">
          <Image
            src={qrCode}
            alt="QR Code"
            width={200}
            height={200}
            className="mx-auto"
          />
        </div>
      )}
      
      <p className="text-[#232323] text-base leading-[26px] text-center mb-10 sm:mb-14">
        Please confirm your account by entering the authentication number sent
        to your authenticator app
      </p>
      
      <form onSubmit={handleSubmit} className="w-full">
        <div>
          <div className="flex items-center justify-between mb-10 sm:mb-14 w-[96%] mx-auto">
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
                  className="!w-[14%] md:!w-[55px] h-12 sm:h-14 py-3 sm:py-4 text-center sm:px-5 border-b border-[#BDD1E0] text-black text-lg sm:text-xl font-semibold leading-normal focus:outline-none focus:border-b-2 focus-within:border-primary-500"
                />
              )}
            />
          </div>

          <div className="w-full">
            <button
              type="submit"
              className="bg-primary-600 border rounded-[4px] w-full h-[50px] text-center text-white text-lg font-medium leading-normal mb-3 hover:bg-primary-500 active:bg-primary-700"
              disabled={loading}
            >
              {loading ? "Code Verifying..." : "Verify Code"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</>
  );
}
