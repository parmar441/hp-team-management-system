import { AuditLog } from "../models/AuditLog.js";

interface AuditParams {
  userId: string;
  userName: string;
  userRole: string;
  action: "create" | "update" | "delete";
  targetId: string;
  targetName: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await AuditLog.create(params);
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
