import AxiosProvider from "../../provider/AxiosProvider";

const api = new AxiosProvider();

const getDefaultActorName = (): string => {
  if (typeof window === "undefined") return "";
  return (
    String(localStorage.getItem("userName") || "").trim() ||
    String(localStorage.getItem("userEmail") || "").trim()
  );
};

const canonicalizeProductionName = (name?: string | null): string => {
  const raw = String(name || "").trim();
  const key = raw.toLowerCase().replace(/\s+/g, "");
  if (!key) return "";

  if (key === "usmaan" || key === "usman") return "Usmaan";
  if (key === "riyaaz" || key === "riyaz") return "Riyaaz";
  if (key === "ramzaan" || key === "ramzan" || key === "ramzon") return "Ramzaan";
  return raw;
};

export const sendAssignmentNotification = async (params: {
  workerName: string;
  assignedBy?: string | null;
  joNumber?: string | null;
  jobId?: string | null;
  jobNo?: string | null;
  route?: string | null;
}): Promise<void> => {
  const workerName = canonicalizeProductionName(params.workerName);
  if (!workerName) return;
  const assignedBy = canonicalizeProductionName(params.assignedBy);

  try {
    await api.post("/sendnotification", {
      type: "assignment",
      assignee: workerName,
      worker_name: workerName,
      assigned_by: assignedBy || undefined,
      jo_number: String(params.joNumber || "").trim(),
      job_id: String(params.jobId || "").trim(),
      job_no: String(params.jobNo || "").trim(),
      route:
        String(params.route || "").trim() ||
        "/section_production_planning/production_planning",
      source: "production_planning_job_assign",
    });
  } catch (error) {
    // Assignment flow should not fail due to notification errors.
    console.error("sendAssignmentNotification failed:", error);
  }
};

export const sendRoleNotification = async (params: {
  roles: string[];
  title: string;
  body: string;
  type?: string;
  route?: string | null;
  source?: string | null;
  sendAll?: boolean;
  workerName?: string | null;
  userTypes?: Array<"system" | "worker">;
}): Promise<void> => {
  const roles = Array.from(
    new Set(
      (params.roles || [])
        .map((r) => String(r || "").trim())
        .filter(Boolean)
    )
  );
  if (!roles.length) return;

  const workerName = canonicalizeProductionName(params.workerName);
  try {
    await api.post("/sendnotification", {
      type: String(params.type || "role_alert").trim(),
      title: String(params.title || "Role Notification").trim(),
      body: String(params.body || "").trim(),
      roles,
      send_all: params.sendAll === true, // default false for role-targeted sends
      worker_name: workerName || undefined,
      user_types: Array.isArray(params.userTypes) ? params.userTypes : undefined,
      route: String(params.route || "").trim() || undefined,
      source: String(params.source || "role_based_frontend").trim(),
    });
  } catch (error) {
    // UI actions should not fail due to notification errors.
    console.error("sendRoleNotification failed:", error);
  }
};

export const sendMultiRoleNotifications = async (
  items: Array<{
    roles: string[];
    title: string;
    body: string;
    type?: string;
    route?: string | null;
    source?: string | null;
    sendAll?: boolean;
    workerName?: string | null;
    userTypes?: Array<"system" | "worker">;
  }>
): Promise<void> => {
  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    await sendRoleNotification(item);
  }
};

export const sendRoleNotificationByEvent = async (params: {
  eventKey: "assignment_created" | "moved_to_qc" | "sent_to_vendor" | "material_required" | string;
  joNo?: string | null;
  joNumber?: string | null;
  jobNo?: string | null;
  workerName?: string | null;
  assignedBy?: string | null;
  clientName?: string | null;
  jobType?: string | null;
  title?: string | null;
  body?: string | null;
  route?: string | null;
  source?: string | null;
  sendAll?: boolean;
  notifyAssignee?: boolean;
}): Promise<void> => {
  const eventKey = String(params.eventKey || "").trim();
  if (!eventKey) return;
  const fallbackActor = getDefaultActorName();
  const assignedBy = canonicalizeProductionName(params.assignedBy || fallbackActor || "");
  const workerName = canonicalizeProductionName(params.workerName);
  const source = String(params.source || `event_${eventKey}` || "").trim();

  try {
    await api.post("/sendnotification", {
      event_key: eventKey,
      jo_no: String(params.joNo || "").trim() || undefined,
      jo_number: String(params.joNumber || "").trim() || undefined,
      job_no: String(params.jobNo || "").trim() || undefined,
      worker_name: workerName || undefined,
      assigned_by: assignedBy || undefined,
      client_name: String(params.clientName || "").trim() || undefined,
      job_type: String(params.jobType || "").trim() || undefined,
      title: String(params.title || "").trim() || undefined, // optional override
      body: String(params.body || "").trim() || undefined, // optional override
      route: String(params.route || "").trim() || undefined, // optional override
      source: source || undefined,
      send_all: params.sendAll === true,
      notify_assignee: params.notifyAssignee === true,
    });
  } catch (error) {
    console.error("sendRoleNotificationByEvent failed:", error);
  }
};

