import TechnicalOfficeShell from "@/components/TechnicalOfficeShell";

export default function TechnicalOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TechnicalOfficeShell>
      {children}
    </TechnicalOfficeShell>
  );
}