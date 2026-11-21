import "./style.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      className="min-h-screen bg-[#f7f6f3] py-6"
    >
      {children}

    </main>
  );
}