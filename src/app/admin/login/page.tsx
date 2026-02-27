import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import AdminLoginClient from "./AdminLoginClient";

export default async function AdminLoginPage() {
  const isAuth = await isAdminAuthenticated();
  if (isAuth) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#3d2c1e] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧶</div>
          <h1 className="text-3xl font-bold text-[#f5ede0]">Owner Login</h1>
          <p className="text-[#c4a882] mt-2">
            The Twisted Threads Admin Dashboard
          </p>
        </div>
        <AdminLoginClient />
      </div>
    </div>
  );
}
