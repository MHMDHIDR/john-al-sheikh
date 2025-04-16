import { notFound } from "next/navigation";
import { auth } from "@/server/auth";
import { AccountForm } from "./account-form";

export default async function Account() {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const user = session.user;

  return (
    <section className="container px-6 py-10 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">تفاصيل الحساب</h1>
      <AccountForm user={user} />
    </section>
  );
}
