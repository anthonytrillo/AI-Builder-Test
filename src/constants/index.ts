import type { NavItem } from "@/types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Builder";

export const NAV_ITEMS: NavItem[] = [{ label: "Home", href: "/" }];
