"use client";
import { createContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from "react";
import StorageManager from "../provider/StorageManager";

interface AppContextType {
  accessToken: string | null;
  setAccessToken: Dispatch<SetStateAction<string | null>>;
  customerFullName: string;
  setCustomerFullName: Dispatch<SetStateAction<string>>;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

const storageManager = new StorageManager();

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(storageManager.getAccessToken());
  const [customerFullName, setCustomerFullName] = useState<string>("");

  useEffect(() => {
    storageManager.saveAccessToken(accessToken);
  }, [accessToken]);

  return (
    <AppContext.Provider value={{ accessToken, setAccessToken, customerFullName, setCustomerFullName }}>
      {children}
    </AppContext.Provider>
  );
};
