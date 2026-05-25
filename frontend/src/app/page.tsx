import { redirect } from "next/navigation";

/**
 * The product launches teachers into the Assignments workspace by default.
 * If product later introduces an authenticated dashboard, redirect here.
 */
export default function RootIndex() {
  redirect("/assignments");
}
