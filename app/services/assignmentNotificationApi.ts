import AxiosProvider from "../../provider/AxiosProvider";

const api = new AxiosProvider();

export type AssignmentNotificationPayload = {
  assignee: string;
  jobId: string;
  jobNo?: string | number;
  joNumber?: string;
  tsoNo?: string | number;
  source?: string;
};

export type AssignmentNotificationResult = {
  ok: boolean;
  endpoint?: string;
  error?: string;
  debug?: {
    primary?: string;
    fallback?: string;
  };
};

const formatApiError = (error: any): string => {
  const status = error?.response?.status;
  const url = error?.config?.url;
  const data = error?.response?.data;
  const message = error?.message || "Unknown error";
  const dataText =
    typeof data === "string"
      ? data
      : data
      ? JSON.stringify(data)
      : "no response body";

  return `status=${status ?? "NA"} url=${url ?? "NA"} message=${message} response=${dataText}`;
};

// Best-effort notification trigger for assignment events.
// We intentionally do not throw here to avoid blocking assignment flow.
export async function notifyAssignment(
  payload: AssignmentNotificationPayload
): Promise<AssignmentNotificationResult> {
  try {
    await api.post(
      "/fineengg_erp/system/notifications/assignment",
      {
        assignee: payload.assignee,
        job_id: payload.jobId,
        job_no: payload.jobNo,
        jo_number: payload.joNumber,
        tso_no: payload.tsoNo,
        source: payload.source || "production_assignment",
      },
      { headers: { "Content-Type": "application/json" } } as any
    );
    return { ok: true, endpoint: "/fineengg_erp/system/notifications/assignment" };
  } catch (primaryError: any) {
    const primaryMessage = formatApiError(primaryError);

    console.error("Assignment notification primary endpoint failed:", primaryMessage);

    // Backward-compatible fallback endpoint used in older parts of the app.
    try {
      await api.post(
        "/sendnotification",
        {
          type: "assignment",
          assignee: payload.assignee,
          job_id: payload.jobId,
          job_no: payload.jobNo,
          jo_number: payload.joNumber,
          tso_no: payload.tsoNo,
          source: payload.source || "production_assignment",
        },
        { headers: { "Content-Type": "application/json" } } as any
      );
      return { ok: true, endpoint: "/sendnotification" };
    } catch (fallbackError: any) {
      const fallbackMessage = formatApiError(fallbackError);

      console.error("Assignment notification fallback endpoint failed:", fallbackMessage);

      return {
        ok: false,
        endpoint: "/sendnotification",
        error: `${primaryMessage}; ${fallbackMessage}`,
        debug: {
          primary: primaryMessage,
          fallback: fallbackMessage,
        },
      };
    }
  }
}
