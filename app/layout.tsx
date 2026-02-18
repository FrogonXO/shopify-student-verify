import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Verification",
  description: "Verify your student status to activate your order",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
