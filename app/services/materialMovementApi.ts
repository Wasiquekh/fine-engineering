// services/materialMovementApi.ts
import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

export const getMaterialMovement = async (params: Record<string, any>) => {
  try {
    console.log("API Request Params:", params);
    
    const response = await axiosProvider.get(
      "/fineengg_erp/material/material-movement",
      { params } as any
    );
    
    console.log("API Response:", response?.data);
    
    return response?.data ? response.data : response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};