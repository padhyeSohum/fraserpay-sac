
import {
  Bell,
  Calendar,
  FileText,
  Globe,
  KeyboardIcon,
  CreditCard,
  QrCode,
  Settings,
  TrendingUp
} from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

// Dashboard features customized for the FraserPay app
const features = [
  {
    Icon: CreditCard,
    name: "Your Balance",
    description: "View and manage your account balance.",
    href: "/dashboard",
    cta: "Check balance",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-brand-100/70 to-brand-500/30 opacity-70" />
    ),
    className: "md:col-span-2 md:row-span-1",
  },
  {
    Icon: QrCode,
    name: "QR Code",
    description: "Access your personal QR code for quick payments.",
    href: "/qr-code",
    cta: "View QR code",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/70 to-blue-500/30 opacity-70" />
    ),
    className: "col-span-1 row-span-1",
  },
  {
    Icon: TrendingUp,
    name: "Leaderboard",
    description: "See the top performing booths and users.",
    href: "/leaderboard",
    cta: "View leaderboard",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-green-100/70 to-green-500/30 opacity-70" />
    ),
    className: "col-span-1 row-span-1",
  },
  {
    Icon: Settings,
    name: "Settings",
    description: "Manage your account settings and preferences.",
    href: "/settings",
    cta: "Configure",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100/70 to-gray-500/30 opacity-70" />
    ),
    className: "col-span-1 row-span-1",
  },
  {
    Icon: Bell,
    name: "Notifications",
    description: "Get notified about important account updates and transactions.",
    href: "/dashboard",
    cta: "View all",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/70 to-yellow-500/30 opacity-70" />
    ),
    className: "col-span-1 md:col-span-1 md:row-span-1",
  },
];

function BentoDemo() {
  return (
    <BentoGrid className="md:auto-rows-[18rem]">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}

export { BentoDemo };
