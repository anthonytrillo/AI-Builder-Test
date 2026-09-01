import Link from "next/link";
import { APP_NAME, NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="border-b border-foreground/10">
      <nav
        className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {APP_NAME}
        </Link>

        <ul className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-medium text-foreground/70 transition-colors hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
