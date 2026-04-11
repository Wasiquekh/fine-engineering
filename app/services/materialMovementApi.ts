// services/materialMovementApi.ts

import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

export const getMaterialMovement = async (params: Record<string, any>) => {
  try {
    // Clean up params - remove undefined/null/empty values
    const cleanParams: Record<string, any> = {};
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "" && value !== "All Status") {
        // Convert "umc" to "vmc" for backward compatibility
        if (key === "machine_category" && (value === "umc" || value === "UMC")) {
          cleanParams[key] = "vmc";
        } else {
          cleanParams[key] = value;
        }
      }
    });
    
    console.log("API Request Clean Params:", cleanParams);
    
    const response = await axiosProvider.get(
      "/fineengg_erp/material/material-movement",
      { params: cleanParams } as any
    );
    
    console.log("API Response:", response?.data);
    
    return response?.data ? response.data : response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};