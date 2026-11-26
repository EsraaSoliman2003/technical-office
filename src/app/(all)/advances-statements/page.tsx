import { Banknote, ReceiptText, type LucideIcon } from "lucide-react";
import ModuleCard from "@/components/ModuleCard";

const cards: { title: string; icon: LucideIcon; href: string }[] = [
  { title: "السلف", icon: Banknote, href: "/advances/" },
  { title: "المستخلصات", icon: ReceiptText, href: "/statements/" },
];

/** سلفة + مستخلص hub (like /data): السلف and المستخلصات. */
export default function AdvancesStatementsHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-8 flex items-center gap-3 text-2xl font-bold text-foreground">
        <span className="h-7 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        سلفة + مستخلص
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
