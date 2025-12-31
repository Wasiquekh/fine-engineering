// app/layout.tsx (or wherever your RootLayout is located)
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import "react-toastify/dist/ReactToastify.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Orizon",
  description: "CRM",
};

// Dynamically import the ErrorBoundary and AppProvider to disable SSR
const ErrorBoundary = dynamic(() => import("./ErrorBoundary"), { ssr: false });
const AppProvider = dynamic(
  () => import("./AppContext").then((mod) => mod.AppProvider),
  { ssr: false }
);

// Dynamically import ToastContainer to avoid SSR
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  {
    ssr: false,
  }
);

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AppProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
