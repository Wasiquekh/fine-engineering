import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

export const getMaterialMovement = async (params: Record<string, any>) => {
  const response = await axiosProvider.get("/fineengg_erp/material-movement", { params } as any);

  // depending on your AxiosProvider shape
  return response?.data ? response.data : response;
};