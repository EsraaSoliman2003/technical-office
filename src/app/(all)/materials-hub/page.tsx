import { PackageCheck, PackageOpen, type LucideIcon } from "lucide-react";
import ModuleCard from "@/components/ModuleCard";

// Like the old system's الخامات popup: المشاريع (deliveries to projects) and الشركات (company materials).
const cards: { title: string; icon: LucideIcon; href: string }[] = [
  { title: "خامات المشاريع", icon: PackageOpen, href: "/data/project-materials/" },
  { title: "خامات الشركات", icon: PackageCheck, href: "/data/company-materials/" },
];

/** الخامات hub (home card): خامات المشاريع and خامات الشركات. */
export default function MaterialsHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-8 flex items-center gap-3 text-2xl font-bold text-foreground">
        <span className="h-7 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        الخامات
      </h1>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((card) => (
          <li key={card.href}>
            <ModuleCard title={card.title} icon={card.icon} href={card.href} size="md" />
          </li>
        ))}
      </ul>
    </div>
  );
}
