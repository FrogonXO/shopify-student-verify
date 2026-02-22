"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const LOGO_URL = "https://edubook.at/cdn/shop/files/edubookvivalahardware_Logo.png?height=130&v=1768812725";

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={LOGO_URL} alt="edubook" style={styles.logo} />
        <div style={styles.icon}>&#10003;</div>
        <h1 style={styles.title}>Bildungsstatus bestätigt!</h1>
        <p style={styles.description}>
          Dein Bildungsstatus wurde erfolgreich verifiziert. Deine Bestellung wird asap bearbeitet.
        </p>
        {email && (
          <p style={styles.email}>Verifizierte Email: <strong>{email}</strong></p>
        )}
        <p style={styles.hint}>Du kannst diese Seite schließen.</p>
      </div>
      <a href="https://edubook.at/" style={styles.backLink}>Zurück zu edubook.at</a>
    </div>
  );
}

export default function VerifySuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "40px",
    maxWidth: "460px",
    width: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center" as const,
  },
  logo: {
    display: "block",
    margin: "0 auto 24px",
    height: "50px",
  },
  icon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#f0fdf4",
    color: "#25ba86",
    fontSize: "30px",
    lineHeight: "60px",
    margin: "0 auto 20px",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "24px",
  },
  description: {
    color: "#666",
    margin: "0 0 16px 0",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  email: {
    fontSize: "14px",
    color: "#333",
  },
  hint: {
    color: "#999",
    fontSize: "13px",
    marginTop: "20px",
  },
  backLink: {
    marginTop: "20px",
    color: "#666",
    fontSize: "14px",
    textDecoration: "none",
  },
};
