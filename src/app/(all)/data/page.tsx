import {
  Boxes,
  Briefcase,
  Building,
  Factory,
  FileChartColumn,
  FlaskConical,
  Landmark,
  Network,
  PackageCheck,
  PackageOpen,
  Tags,
  Truck,
  type LucideIcon,
} from "lucide-react";
import ModuleCard from "@/components/ModuleCard";
import { getLookup, lookupHref, type LookupResource } from "@/lib/lookups";

/**
 * A hub card is one of:
 * - a built lookup (`lookup`: title and link come from `LOOKUPS`),
 * - another built page (`title` + `href`),
 * - a UI draft not connected to the backend yet (`title` + `draft` link, shown with "مسودة"),
 * - a placeholder that is not built yet (`title` only, shown as "قريبًا").
 */
type DataItem =
  | { lookup: LookupResource; icon: LucideIcon }
  | { title: string; icon: LucideIcon; href: string }
  | { title: string; icon: LucideIcon; draft?: string };
type DataSection = { title: string; items: DataItem[] };

function cardProps(item: DataItem) {
  if ("lookup" in item) {
    return { key: item.lookup, title: getLookup(item.lookup).title, href: lookupHref(item.lookup), draft: false };
  }
  if ("href" in item) {
    return { key: item.title, title: item.title, href: item.href, draft: false };
  }
  return { key: item.title, title: item.title, href: item.draft, draft: Boolean(item.draft) };
}

// Master-data lists from the old system's "البيانات" menu.
const sections: DataSection[] = [
  {
    title: "الجهات والقطاعات",
    items: [
      { lookup: "agencies", icon: Landmark },
      { lookup: "sectors", icon: Network },
    ],
  },
  {
    title: "المشاريع",
    items: [
      { title: "المشاريع", icon: Briefcase, href: "/data/projects/" },
      { lookup: "project-types", icon: Tags },
    ],
  },
  {
    title: "الشركات",
    items: [
      { title: "الشركات", icon: Building, href: "/data/companies/" },
      { lookup: "transport-companies", icon: Truck },
    ],
  },
  {
    title: "الخامات",
    items: [
      { lookup: "materials", icon: Boxes },
      { title: "خامات الشركات", icon: PackageCheck, draft: "/data/company-materials/" },
      { title: "خامات المشاريع", icon: PackageOpen, draft: "/data/project-materials/" },
      { lookup: "factories", icon: Factory },
      { lookup: "mixers", icon: FlaskConical },
    ],
  },
  {
    title: "التقارير",
    items: [{ title: "تقرير العقود", icon: FileChartColumn, draft: "/data/contract-report/" }],
  },
];

export default function DataHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-8 flex items-center gap-3 text-2xl font-bold text-foreground">
        <span className="h-7 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        البيانات
      </h1>

      <div className="space-y-8">
        {sections.map((section, index) => {
          const headingId = `data-section-${index}`;
          return (
            <section key={section.title} aria-labelledby={headingId}>
              <h2 id={headingId} className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="h-2 w-2 rotate-45 bg-accent" aria-hidden="true" />
                {section.title}
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {section.items.map((item) => {
                  const { key, title, href, draft } = cardProps(item);
                  return (
                    <li key={key}>
                      <ModuleCard title={title} icon={item.icon} href={href} size="md" draft={draft} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
