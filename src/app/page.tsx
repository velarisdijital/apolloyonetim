import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingContent from "./landing-content";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/panel");

  return <LandingContent />;
}
