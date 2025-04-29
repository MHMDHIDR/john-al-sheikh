import { env } from "@/env";

export default async function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">لوحة الإدارة {env.NEXT_PUBLIC_APP_NAME}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <h3>عناصر لوحة الإدارة</h3>
      </div>
    </div>
  );
}
