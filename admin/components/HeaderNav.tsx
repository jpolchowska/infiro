"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Sekcje", isActive: (path: string) => path === "/" || path.startsWith("/sections") },
  { href: "/results", label: "Wyniki uczniów", isActive: (path: string) => path.startsWith("/results") },
  { href: "/import", label: "Import treści", isActive: (path: string) => path.startsWith("/import") },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            item.isActive(pathname)
              ? "text-infiro-navy"
              : "text-gray-600 hover:text-infiro-navy"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
