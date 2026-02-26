"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs bg-[#5c3a1e] text-[#e8d5be] px-3 py-1.5 rounded-full hover:bg-[#7a4f2e] transition-colors"
    >
      Sign Out
    </button>
  );
}
