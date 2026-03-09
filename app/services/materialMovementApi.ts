import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

export const getMaterialMovement = async (params: Record<string, any>) => {
  const response = await axiosProvider.get(
    "/fineengg_erp/material-movement",
    { params } as any
  );

  return response?.data ? response.data : response;
};