import GuestGuard from "@/components/auth/GuestGuard";
import "./style.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background">
      <GuestGuard>{children}</GuestGuard>
    </main>
  );
}
