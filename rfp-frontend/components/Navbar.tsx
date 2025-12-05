// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Create RFP", href: "/" },
  { label: "Vendors", href: "/vendors" },
  { label: "Comparison", href: "/comparison" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-3xl font-semibold tracking-tight text-sky-700">
          AI RFP Manager
        </div>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-sky-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}