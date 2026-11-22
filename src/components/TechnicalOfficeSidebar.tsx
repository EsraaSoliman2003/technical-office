"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Database,
  Factory,
  FileText,
  FileSignature,
  Home,
  LogOut,
  Package,
  ReceiptText,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: SidebarItem[];
};

type TechnicalOfficeSidebarProps = {
  isOpen: boolean;
};

const navigationItems: SidebarItem[] = [
  {
    label: "لوحة التحكم",
    icon: Home,
    href: "/",
  },
  {
    label: "متابعة الأعمال",
    icon: ClipboardList,
    children: [
      {
        label: "المقايسات الجارية",
        icon: ClipboardCheck,
        href: "/quotations",
      },
      {
        label: "العقود والارتباط",
        icon: FileSignature,
        href: "/contracts",
      },
      {
        label: "المستخلصات الجارية",
        icon: ReceiptText,
        href: "/statements",
      },
      {
        label: "الخامات المخصومة",
        icon: Package,
        href: "/materials/deducted",
      },
    ],
  },
  {
    label: "البيانات الأساسية",
    icon: Database,
    children: [
      {
        label: "القطاعات",
        icon: Briefcase,
        href: "/sectors",
      },
      {
        label: "المشاريع",
        icon: Building2,
        href: "/projects",
      },
      {
        label: "أنواع المشاريع",
        icon: FileText,
        href: "/project-types",
      },
      {
        label: "الشركات",
        icon: Building2,
        href: "/companies",
      },
      {
        label: "الجهات",
        icon: Building2,
        href: "/entities",
      },
    ],
  },
  {
    label: "إدارة الخامات",
    icon: Boxes,
    children: [
      {
        label: "الخامات",
        icon: Package,
        href: "/materials",
      },
      {
        label: "خامات الشركات",
        icon: Package,
        href: "/company-materials",
      },
      {
        label: "خامات المشاريع",
        icon: Package,
        href: "/project-materials",
      },
    ],
  },
  {
    label: "مرافق ومصادر التوريد",
    icon: Factory,
    children: [
      {
        label: "المصانع",
        icon: Factory,
        href: "/factories",
      },
      {
        label: "الخلاطات",
        icon: Boxes,
        href: "/mixers",
      },
      {
        label: "شركات النقل",
        icon: Truck,
        href: "/transport-companies",
      },
    ],
  },
  {
    label: "التقارير",
    icon: FileText,
    children: [
      {
        label: "تقرير العقود",
        icon: FileSignature,
        href: "/contract-report",
      },
    ],
  },
];

export default function TechnicalOfficeSidebar({
  isOpen,
}: TechnicalOfficeSidebarProps) {
  const logout = useLogout();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isSameLink = (href?: string) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const containsActiveLink = (items: SidebarItem[]): boolean =>
    items.some((item) =>
      isSameLink(item.href) ||
      (item.children ? containsActiveLink(item.children) : false)
    );

  useEffect(() => {
    const nextExpanded = new Set(expandedItems);

    const expandActiveBranches = (items: SidebarItem[]) => {
      items.forEach((item) => {
        if (item.children?.length && containsActiveLink(item.children)) {
          nextExpanded.add(item.label);
          expandActiveBranches(item.children);
        }
      });
    };

    expandActiveBranches(navigationItems);
    setExpandedItems(nextExpanded);
  }, [pathname]);

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
      const { label, icon: Icon, href, children } = item;
      const hasChildren = Boolean(children && children.length > 0);
      const isExpanded = expandedItems.has(label);
      const isActive = hasChildren
        ? Boolean(children && containsActiveLink(children))
        : isSameLink(href);

      const sizingClass = isOpen
        ? level === 0
          ? "gap-3 px-3 py-2.5 text-[15px] font-semibold"
          : level === 1
            ? "gap-2.5 px-3 py-2 text-[13.5px]"
            : "gap-2 px-2.5 py-1.5 text-[12.5px]"
        : "justify-center px-0 py-2.5";

      const stateClass = isActive
        ? "bg-amber-300/15 text-white shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]"
        : level === 0
          ? "text-blue-100/90 hover:bg-white/[0.06] hover:text-white"
          : level === 1
            ? "text-blue-200/75 hover:bg-white/[0.04] hover:text-blue-50"
            : "text-blue-200/60 hover:bg-white/[0.03] hover:text-blue-100";

      const sharedClassName = `group relative flex w-full items-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 ${sizingClass} ${stateClass}`;

      const content = (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-amber-400"
            />
          )}

          <Icon
            size={level === 0 ? 20 : level === 1 ? 18 : 16}
            className={`shrink-0 ${isActive ? "text-amber-300" : ""}`}
          />

          {isOpen && (
            <span className="min-w-0 flex-1 truncate text-start">{label}</span>
          )}

          {hasChildren && isOpen && (
            <ChevronDown
              aria-hidden="true"
              size={level === 0 ? 18 : 16}
              className={`ms-auto shrink-0 transition-transform duration-200 ${isExpanded ? "" : "rotate-90"
                } ${isExpanded || isActive
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
            aria-current={isActive ? "page" : undefined}
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
      className={`scrollbar-hide h-screen shrink-0 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-[#0d2d55] via-[#103462] to-[#0c2647] shadow-2xl transition-[width] duration-300 ${isOpen ? "w-64 md:w-67" : "w-16 md:w-15"
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
          className={`group flex w-full items-center justify-center rounded-lg text-red-200/80 transition-colors hover:bg-red-400/10 hover:text-red-100 ${isOpen
            ? "gap-3 px-3 py-2.5 text-[14px]"
            : "justify-center px-0 py-2.5"
            }`}
        >
          <LogOut className="shrink-0" size={20} />
          {isOpen && <span className="whitespace-nowrap">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}