import AuthGuard from "@/components/auth/AuthGuard";
import TechnicalOfficeShell from "@/components/TechnicalOfficeShell";

export default function TechnicalOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TechnicalOfficeShell>{children}</TechnicalOfficeShell>
    </AuthGuard>
  );
}
