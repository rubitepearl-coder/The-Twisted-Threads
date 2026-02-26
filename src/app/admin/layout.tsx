import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin – The Petal Loop",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#1e1410]">{children}</div>;
}
