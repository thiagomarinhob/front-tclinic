import { ROUTES } from "@/config/constants";
import { redirect } from "next/navigation";

export default function AdminHomeRoute() {
  redirect(ROUTES.ADMIN_TENANTS);
}
