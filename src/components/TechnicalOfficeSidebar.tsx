"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileCheck2,
  FileSignature,
  Home,
  LogOut,
  Mail,
  ReceiptText,
  Settings,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  href?: string;
  children?: SidebarItem[];
};

type TechnicalOfficeSidebarProps = {
  isOpen: boolean;
};

const navigationItems: SidebarItem[] = [
  { label: "الرئيسية", icon: Home, href: "/", active: true },
  { label: "الإشعارات", icon: Bell, href: "/notifications" },
  {
    label: "منظومة الكتائب - الأولوية",
    icon: Building2,
    children: [
      { label: "الشركات", icon: Building2, href: "/companies" },
      { label: "المشاريع", icon: Briefcase, href: "/projects" },
      { label: "المقايسات", icon: ClipboardList, href: "/quotations" },
      { label: "العقود", icon: FileSignature, href: "/contracts" },
      { label: "طلبات التدبير", icon: ClipboardCheck, href: "/procurement-requests" },
      { label: "أوامر التوريد", icon: Truck, href: "/supply-orders" },
      { label: "المستخلصات", icon: ReceiptText, href: "/statements" },
      { label: "طلبات التصديق", icon: FileCheck2, href: "/approval-requests" },
      {
        label: "الخامات",
        icon: Boxes,
        children: [
          { label: "التفاويض", icon: ClipboardCheck, href: "/materials/delegations" },
          { label: "تسكين على الشركات", icon: Building2, href: "/materials/allocate-companies" },
          { label: "تسكين على العقود", icon: FileSignature, href: "/materials/allocate-contracts" },
          { label: "تحويل داخلي", icon: ArrowLeftRight, href: "/materials/internal-transfer" },
          { label: "تحويل خارجي", icon: Truck, href: "/materials/external-transfer" },
        ],
      },
      {
        label: "الخطابات",
        icon: Mail,
        children: [
          { label: "مهامي والتنبيهات", icon: Bell, href: "/letters/my-tasks" },
        ],
      },
    ],
  },
  { label: "منظومة الإدارة", icon: Briefcase, href: "/management" },
  { label: "إدخال البيانات (الربط)", icon: Database, href: "/data-entry" },
  { label: "الإعدادات", icon: Settings, href: "/settings" },
];

export default function TechnicalOfficeSidebar({
  isOpen,
}: TechnicalOfficeSidebarProps) {
  const logout = useLogout();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (label: string) => {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const renderItems = (items: SidebarItem[], level = 0) =>
    items.map((item) => {
      const { label, icon: Icon, active, href, children } = item;
      const hasChildren = Boolean(children && children.length > 0);
      const isExpanded = expandedItems.has(label);

      const sizingClass = isOpen
        ? level === 0
          ? "gap-3 px-3 py-2.5 text-[15px] font-semibold"
          : level === 1
            ? "gap-2.5 px-3 py-2 text-[13.5px]"
            : "gap-2 px-2.5 py-1.5 text-[12.5px]"
        : "justify-center px-0 py-2.5";

      const stateClass = active
        ? "bg-amber-300/15 text-white shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]"
        : level === 0
          ? "text-blue-100/90 hover:bg-white/[0.06] hover:text-white"
          : level === 1
            ? "text-blue-200/75 hover:bg-white/[0.04] hover:text-blue-50"
            : "text-blue-200/60 hover:bg-white/[0.03] hover:text-blue-100";

      const sharedClassName = `group relative flex w-full items-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 ${sizingClass} ${stateClass}`;

      const content = (
        <>
          {active && (
            <span
              aria-hidden="true"
              className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-amber-400"
            />
          )}

          <Icon
            size={level === 0 ? 20 : level === 1 ? 18 : 16}
            className={`shrink-0 ${active ? "text-amber-300" : ""}`}
          />

          {isOpen && (
            <span className="min-w-0 flex-1 truncate text-start">{label}</span>
          )}

          {hasChildren && isOpen && (
            <ChevronDown
              aria-hidden="true"
              size={level === 0 ? 18 : 16}
              className={`ms-auto shrink-0 transition-transform duration-200 ${isExpanded ? "" : "rotate-90"
                } ${isExpanded || active
                  ? "text-amber-300"
                  : "text-blue-100/80 group-hover:text-white"
                }`}
            />
          )}
        </>
      );

      if (hasChildren) {
        return (
          <li key={label} className="list-none px-2">
            <button
              type="button"
              aria-label={label}
              aria-expanded={isExpanded}
              onClick={() => toggleItem(label)}
              className={sharedClassName}
            >
              {content}
            </button>

            {isExpanded && isOpen && (
              <ul className="ms-4 mt-1 flex flex-col gap-0.5 border-s-2 border-white/10 ps-2">
                {renderItems(children ?? [], level + 1)}
              </ul>
            )}
          </li>
        );
      }

      return (
        <li key={label} className="list-none px-2">
          <Link
            href={href ?? "#"}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={sharedClassName}
          >
            {content}
          </Link>
        </li>
      );
    });

  return (
    <aside
      id="technical-office-sidebar"
      aria-label="القائمة الجانبية"
      className={`scrollbar-hide h-screen shrink-0 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-[#0d2d55] via-[#103462] to-[#0c2647] shadow-2xl transition-[width] duration-300 ${isOpen ? "w-64 md:w-67" : "w-16 md:w-20"
        }`}
    >
      <div className="flex min-h-full w-full flex-col gap-3 py-4">
        <div
          className={`flex items-center ${isOpen ? "justify-start gap-3 px-5" : "justify-center px-0"
            }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-md shadow-amber-500/20">
            <Building2 className="text-[#103462]" size={22} />
          </div>
          {isOpen && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">
                منظومة المكتب الفني
              </span>
              <span className="text-[11px] text-blue-200/60">
                Technical Office
              </span>
            </div>
          )}
        </div>

        <div className="mx-4 h-px bg-white/10" />

        <nav aria-label="التنقل الرئيسي" className="w-full">
          <ul className="flex w-full flex-col gap-1">
            {renderItems(navigationItems)}
          </ul>
        </nav>

        <div className="mx-4 mt-auto h-px bg-white/10" />

        <button
          aria-label="تسجيل الخروج"
          onClick={logout}
          className={`group flex w-full items-center rounded-lg text-red-200/80 transition-colors hover:bg-red-400/10 hover:text-red-100 ${isOpen
              ? "mx-2 gap-3 px-3 py-2.5 text-[14px]"
              : "mx-2 justify-center px-0 py-2.5"
            }`}
        >
          <LogOut className="shrink-0" size={20} />
          {isOpen && <span className="whitespace-nowrap">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}