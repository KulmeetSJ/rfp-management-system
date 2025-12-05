// lib/config.ts
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export const navItems = [
  { label: "Create RFP", href: "/" },
  { label: "Vendors", href: "/vendors" },
  { label: "Comparison", href: "/comparison" },
];