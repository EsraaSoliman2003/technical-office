import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  FinancialSummary,
  SummaryStats,
} from "@/components/dashboard/DashboardOverview";
import RecentStatements from "@/components/dashboard/RecentStatements";
import StatementStages from "@/components/dashboard/StatementStages";

export default function Page() {
  return (
    <main
      dir="rtl"
      className="min-h-0 flex-1 overflow-y-auto bg-[#f5f7fb] px-4 py-6 md:px-7 md:py-8"
    >
      <div className="mx-auto max-w-[1440px] space-y-7">
        <DashboardHeader />
        <SummaryStats />
        <FinancialSummary />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <RecentStatements />
          <StatementStages />
        </div>
      </div>
    </main>
  );
}
