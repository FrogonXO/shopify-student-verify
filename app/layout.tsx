import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "edubook - Bildungsstatus verifizieren",
  description: "Verifiziere deinen Bildungsstatus, um deine Bestellung zu aktivieren",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
