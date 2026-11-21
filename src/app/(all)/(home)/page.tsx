import Image from "next/image";
import {
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardList,
  Database,
  FileSignature,
  Mail,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import ModuleCard from "@/components/ModuleCard";

type Module = { title: string; icon: LucideIcon; href?: string };

// Order matches the old system. Only "البيانات" is active for now.
const modules: Module[] = [
  { title: "موقف المشاريع", icon: Building2 },
  { title: "التمام اليومي", icon: CalendarCheck },
  { title: "البيانات", icon: Database, href: "/data/" },
  { title: "العقود", icon: FileSignature },
  { title: "سلفة + مستخلص", icon: ReceiptText },
  { title: "الخامات", icon: Boxes },
  { title: "الجوابات", icon: Mail },
  { title: "المحاضر", icon: ClipboardList },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-10">
      {/* Hero */}
      <section
        aria-label="بسم الله الرحمن الرحيم"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-primary via-[#6f1717] to-[#4a0f0f] px-6 py-12 text-center text-white shadow-xl md:py-16"
      >
        <Image
          src="/logo.png"
          alt=""
          aria-hidden="true"
          width={420}
          height={420}
          className="pointer-events-none absolute top-1/2 left-1/2 w-72 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] select-none md:w-[420px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 rounded-[1.25rem] border border-accent/30"
        />

        <div className="relative">
          <p className="text-lg font-semibold tracking-wide text-accent md:text-2xl">بسم الله الرحمن الرحيم</p>

          <div className="mx-auto my-6 flex max-w-xs items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-l from-accent/80 to-transparent" />
            <span className="h-2 w-2 rotate-45 bg-accent" />
            <span className="h-px flex-1 bg-gradient-to-r from-accent/80 to-transparent" />
          </div>

          <blockquote className="mx-auto max-w-3xl text-2xl leading-[1.9] font-bold md:text-4xl md:leading-[1.8]">
            <span className="text-accent">﴿</span> وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ{" "}
            <span className="text-accent">﴾</span>
          </blockquote>

          <p className="mt-6 text-sm text-white/70 md:text-base">منظومة المكتب الفني</p>
        </div>
      </section>

      {/* Modules */}
      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="mb-5 flex items-center gap-3 text-xl font-bold text-foreground">
          <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          الأقسام
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {modules.map((module) => (
            <li key={module.title}>
              <ModuleCard title={module.title} icon={module.icon} href={module.href} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
