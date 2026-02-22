"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const LOGO_URL = "https://edubook.at/cdn/shop/files/edubookvivalahardware_Logo.png?height=130&v=1768812725";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Etwas ist schiefgelaufen");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
    }
  }

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <img src={LOGO_URL} alt="edubook" style={styles.logo} />
          <div style={styles.errorBox}>Ungültiger Verifizierungslink.</div>
        </div>
        <a href="https://edubook.at/" style={styles.backLink}>Zurück zu edubook.at</a>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={LOGO_URL} alt="edubook" style={styles.logo} />

        {status === "success" ? (
          <>
            <div style={styles.icon}>&#10003;</div>
            <h1 style={styles.title}>Bildungsstatus bestätigt!</h1>
            <p style={styles.description}>
              Dein Bildungsstatus wurde erfolgreich verifiziert. Deine Bestellung wird asap bearbeitet.
            </p>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Bildungs-Email bestätigen</h1>
            <p style={styles.description}>
              Klicke auf den Button, um deinen Bildungsstatus zu bestätigen und deine Bestellung zu aktivieren.
            </p>

            {status === "error" && (
              <div style={styles.errorBox}>{errorMessage}</div>
            )}

            <button
              onClick={handleConfirm}
              disabled={status === "loading"}
              style={{
                ...styles.button,
                opacity: status === "loading" ? 0.6 : 1,
              }}
            >
              {status === "loading" ? "Wird bestätigt..." : "Bildungsstatus bestätigen"}
            </button>
          </>
        )}
      </div>
      <a href="https://edubook.at/" style={styles.backLink}>Zurück zu edubook.at</a>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
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
    margin: "0 0 24px 0",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  button: {
    background: "#25ba86",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px",
    color: "#dc2626",
    fontSize: "14px",
    marginBottom: "16px",
  },
  backLink: {
    marginTop: "20px",
    color: "#666",
    fontSize: "14px",
    textDecoration: "none",
  },
};
