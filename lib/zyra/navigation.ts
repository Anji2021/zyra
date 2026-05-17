import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Bookmark,
  BookOpen,
  Bot,
  CalendarHeart,
  CalendarClock,
  ClipboardList,
  Home,
  MapPinned,
  Menu,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** Full desktop sidebar — every destination. */
export const productSidebarNav: NavItem[] = [
  {
    href: "/app",
    label: "Home",
    description: "A gentle snapshot of your space in Zyra.",
    icon: Home,
  },
  {
    href: "/app/cycle",
    label: "Cycle",
    description: "Periods, patterns, and PCOS/PCOD notes in one private log.",
    icon: CalendarHeart,
  },
  {
    href: "/app/health-log",
    label: "Health",
    description: "Medicines and symptoms you choose to remember.",
    icon: ClipboardList,
  },
  {
    href: "/app/resources",
    label: "Resources",
    description: "Curated reads on periods, hormones, and whole-person health.",
    icon: BookOpen,
  },
  {
    href: "/app/assistant",
    label: "Assistant",
    description: "General questions; answers stay educational, not clinical.",
    icon: MessageCircleHeart,
  },
  {
    href: "/app/insights",
    label: "Insights",
    description: "Gentle summaries when you have enough logged to notice patterns.",
    icon: Sparkles,
  },
  {
    href: "/app/timeline",
    label: "Timeline",
    description: "Your cycle, symptoms, medicines, notes, and reminders in one place over time.",
    icon: CalendarClock,
  },
  {
    href: "/app/reminders",
    label: "Reminders",
    description: "Personal reminders for cycle, medicines, and check-ins.",
    icon: BellRing,
  },
  {
    href: "/app/specialists",
    label: "Specialists",
    description: "Location-based search for women’s health providers (discovery only).",
    icon: MapPinned,
  },
  {
    href: "/app/saved",
    label: "Saved",
    description: "Specialists you bookmarked from search — private to you.",
    icon: Bookmark,
  },
];

/** Mobile bottom bar — five tabs; secondary links are under More/profile menu. */
export const productMobileNav: NavItem[] = [
  {
    href: "/app",
    label: "Home",
    description: "Home",
    icon: Home,
  },
  {
    href: "/app/cycle",
    label: "Cycle",
    description: "Cycle",
    icon: CalendarHeart,
  },
  {
    href: "/app/health-log",
    label: "Health",
    description: "Health log",
    icon: ClipboardList,
  },
  {
    href: "/app/assistant",
    label: "Assistant",
    description: "Assistant",
    icon: MessageCircleHeart,
  },
  {
    href: "/app/more",
    label: "More",
    description: "Resources, specialists, saved, and insights",
    icon: Menu,
  },
];

/**
 * Hackathon-mode streamlined nav — only the destinations needed for the demo
 * experience. Activated when `NEXT_PUBLIC_HACKATHON_MODE=true`; the existing
 * `productSidebarNav` / `productMobileNav` arrays above are untouched and used
 * everywhere else. Profile is intentionally omitted here — it's still
 * reachable via the avatar dropdown in the top bar.
 */
export const productHackathonSidebarNav: NavItem[] = [
  {
    href: "/app",
    label: "Home",
    description: "Streamlined hackathon home.",
    icon: Home,
  },
  {
    href: "/app/agent",
    label: "Zyra Agent",
    description: "Unified AI care coordination — research through care plan.",
    icon: Bot,
  },
];

export const productHackathonMobileNav: NavItem[] = productHackathonSidebarNav;

/** @deprecated Use productSidebarNav or productMobileNav */
export const productNav = productSidebarNav;
