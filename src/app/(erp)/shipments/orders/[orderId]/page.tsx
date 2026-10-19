import { redirect } from "next/navigation";

export default function Page() {
  redirect("/shipments/shipments?view=ready");
}
