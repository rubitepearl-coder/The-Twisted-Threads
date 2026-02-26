"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid password");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#4d3828] rounded-2xl p-8 shadow-xl border border-[#5c3a1e]"
    >
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#e8d5be] mb-2">
          Admin Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full bg-[#3d2c1e] border border-[#7a4f2e] rounded-xl px-4 py-3 text-[#f5ede0] placeholder-[#7a5c3e] focus:outline-none focus:ring-2 focus:ring-[#c4a882] focus:border-transparent"
          required
          autoFocus
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#c4a882] text-[#3d2c1e] py-3 rounded-full font-bold hover:bg-[#e8d5be] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <p className="text-center text-xs text-[#7a5c3e] mt-4">
        Owner access only
      </p>
    </form>
  );
}
