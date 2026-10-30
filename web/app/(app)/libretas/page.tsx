import { redirect } from "next/navigation";

export default function LibretasPage() {
  redirect("/tareas?seccion=libretas");
}
