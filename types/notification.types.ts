export type NotificationType =
  | "APPOINTMENT_CONFIRMATION"
  | "APPOINTMENT_CANCELLATION";

export interface Notification {
  id: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}
