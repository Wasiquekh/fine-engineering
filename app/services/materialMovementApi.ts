import AxiosProvider from "../../provider/AxiosProvider";

const axiosProvider = new AxiosProvider();

export type MaterialMovementQuery = {
  q?: string;
  status?: string;
  machine_category?: string;
  machine_size?: string;
  machine_code?: string;
  page?: number;
  limit?: number;
};

export async function getMaterialMovement(params: MaterialMovementQuery) {
  const res = await axiosProvider.get("/fineengg_erp/material-movement", { params } as any);
  // expecting { success, data, meta }
  return res?.data;
}