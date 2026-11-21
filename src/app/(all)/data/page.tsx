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
import { lookupHrefByTitle } from "@/lib/lookups";

type DataItem = { title: string; icon: LucideIcon; href?: string };
type DataSection = { title: string; items: DataItem[] };

// Master-data lists from the old system's "البيانات" menu.
// A card is active when it has an `href`, or when a lookup with the same title is in `LOOKUPS`.
const sections: DataSection[] = [
  {
    title: "الجهات والقطاعات",
    items: [
      { title: "الجهات", icon: Landmark },
      { title: "القطاعات", icon: Network },
    ],
  },
  {
    title: "المشاريع",
    items: [
      { title: "المشاريع", icon: Briefcase },
      { title: "انواع المشاريع", icon: Tags },
    ],
  },
  {
    title: "الشركات",
    items: [
      { title: "الشركات", icon: Building },
      { title: "شركات النقل", icon: Truck },
    ],
  },
  {
    title: "الخامات",
    items: [
      { title: "الخامات", icon: Boxes },
      { title: "خامات الشركات", icon: PackageCheck },
      { title: "خامات المشاريع", icon: PackageOpen },
      { title: "المصانع", icon: Factory },
      { title: "الخلطات", icon: FlaskConical },
    ],
  },
  {
    title: "التقارير",
    items: [{ title: "تقرير العقود", icon: FileChartColumn }],
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
                {section.items.map((item) => (
                  <li key={item.title}>
                    <ModuleCard title={item.title} icon={item.icon} href={item.href ?? lookupHrefByTitle(item.title)} size="md" />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
