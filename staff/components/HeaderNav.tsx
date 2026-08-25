"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Sekcje",
    isActive: (path: string) => path === "/" || path.startsWith("/sections"),
    roles: ["admin", "teacher"] as const,
  },
  {
    href: "/results",
    label: "Uczniowie",
    isActive: (path: string) => path.startsWith("/results"),
    roles: ["admin", "teacher"] as const,
  },
  {
    href: "/teachers",
    label: "Nauczyciele",
    isActive: (path: string) => path.startsWith("/teachers"),
    roles: ["admin"] as const,
  },
  {
    href: "/import",
    label: "Import treści",
    isActive: (path: string) => path.startsWith("/import"),
    roles: ["admin"] as const,
  },
  {
    href: "/settings",
    label: "Ustawienia",
    isActive: (path: string) => path.startsWith("/settings"),
    roles: ["admin", "teacher"] as const,
  },
];

export function HeaderNav({ role }: { role: "admin" | "teacher" }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => (item.roles as readonly string[]).includes(role));

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      {items.map((item) => (
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
