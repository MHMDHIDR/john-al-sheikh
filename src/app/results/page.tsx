import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { ResultsDisplay } from "./results-display";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return <ResultsDisplay />;
}
