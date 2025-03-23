
import {
  BarChart4,
  Users,
  CreditCard,
  Store,
  Settings,
} from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    Icon: BarChart4,
    name: "Analytics",
    description: "Get insights into student transactions and booth performance.",
    href: "/sac/dashboard?tab=data", // This will lead to the data tab
    cta: "View Analytics",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-indigo-100 opacity-50 dark:from-violet-950/30 dark:to-indigo-950/30" />
    ),
    className: "md:col-span-2 lg:col-span-2 md:row-span-1",
  },
  {
    Icon: Users,
    name: "Manage Students",
    description: "Search, view, and manage student accounts and balances.",
    href: "/sac/dashboard?tab=data&subtab=users", // Direct to users tab
    cta: "Manage Students",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-sky-100 opacity-50 dark:from-blue-950/30 dark:to-sky-950/30" />
    ),
    className: "md:col-span-1 lg:col-span-1 md:row-span-1",
  },
  {
    Icon: Store,
    name: "Booth Management",
    description: "Create, edit, and manage student club and vendor booths.",
    href: "#", // This will open the create booth dialog
    cta: "Manage Booths",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-100 opacity-50 dark:from-emerald-950/30 dark:to-green-950/30" />
    ),
    className: "md:col-span-1 lg:col-span-1 md:row-span-1",
    onClick: () => document.getElementById("create-booth-button")?.click(),
  },
  {
    Icon: CreditCard,
    name: "Transactions",
    description: "View and manage all transactions in the system.",
    href: "/sac/dashboard?tab=data&subtab=transactions", // Direct to transactions tab
    cta: "View Transactions",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-100 opacity-50 dark:from-amber-950/30 dark:to-yellow-950/30" />
    ),
    className: "md:col-span-1 lg:col-span-1 md:row-span-1",
  },
  {
    Icon: Settings,
    name: "Settings",
    description: "Configure system settings and user permissions.",
    href: "/sac/dashboard", // Main dashboard as there's likely no specific settings section yet
    cta: "Open Settings",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-stone-100 opacity-50 dark:from-neutral-950/30 dark:to-stone-950/30" />
    ),
    className: "md:col-span-1 lg:col-span-2 md:row-span-1",
  },
];

function DashboardFeatures() {
  return (
    <BentoGrid className="md:auto-rows-[20rem]">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}

export { DashboardFeatures };
