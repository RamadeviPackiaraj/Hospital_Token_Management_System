import { redirect } from "next/navigation";

export default function DepartmentsRedirectPage() {
  redirect("/dashboard/settings/departments");
}
