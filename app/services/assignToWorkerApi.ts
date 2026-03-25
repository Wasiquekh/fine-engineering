import AxiosProvider from "../../provider/AxiosProvider";

const api = new AxiosProvider();

export async function getAssignments(params: {
  status?: string;
  job_type?: string; // JOB_SERVICE etc
  vendor_name?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.job_type) qs.set("job_type", params.job_type);
  if (params.vendor_name) qs.set("vendor_name", params.vendor_name);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const res = await api.get(`/fineengg_erp/system/system/assign-to-worker?${qs.toString()}`);
  return res.data;
}

export async function getReviewAssignmentsPublic(params: {
  status?: string;
  job_type?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.job_type) qs.set("job_type", params.job_type);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const res = await api.get(`/fineengg_erp/system/system/assign-to-worker?${qs.toString()}`);
  return res.data;
}

export async function postAssignVendor(id: string, vendor_name: string) {
  // backend: POST /assign-to-worker/:id/assign-vendor
  const res = await api.post(
    `/fineengg_erp/system/system/assign-to-worker/${id}/assign-vendor`,
    { vendor_name },
    { headers: { "Content-Type": "application/json" } } as any
  );
  return res.data;
}

export async function postQcOutgoing(id: string, payload: any) {
  // backend: POST /assign-to-worker/:id/qc-outgoing
  const res = await api.post(
    `/fineengg_erp/system/system/assign-to-worker/${id}/qc-outgoing`,
    payload,
    { headers: { "Content-Type": "application/json" } } as any
  );
  return res.data;
}