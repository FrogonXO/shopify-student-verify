"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const LOGO_URL = "https://edubook.at/cdn/shop/files/edubookvivalahardware_Logo.png?height=130&v=1768812725";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "used" | "expired" | "error">("idle");

  async function handleConfirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("success");
        return;
      }

      const data = await res.json();
      if (data.code === "used") {
        setStatus("used");
      } else if (data.code === "expired") {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <img src={LOGO_URL} alt="edubook" style={styles.logo} />
          <div style={styles.errorIcon}>!</div>
          <h1 style={styles.title}>Ungültiger Link</h1>
          <p style={styles.description}>
            Dieser Verifizierungslink ist ungültig. Bitte starte den Verifizierungsprozess erneut.
          </p>
          <a href="/verify" style={styles.button}>Erneut verifizieren</a>
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
            <div style={styles.successIcon}>&#10003;</div>
            <h1 style={styles.title}>Bildungsstatus bestätigt!</h1>
            <p style={styles.description}>
              Dein Bildungsstatus wurde erfolgreich verifiziert. Deine Bestellung wird asap bearbeitet.
            </p>
          </>
        ) : status === "used" ? (
          <>
            <div style={styles.errorIcon}>!</div>
            <h1 style={styles.title}>Link bereits verwendet</h1>
            <p style={styles.description}>
              Dieser Verifizierungslink wurde bereits verwendet. Falls dein Bildungsstatus bereits bestätigt ist, musst du nichts weiter tun.
            </p>
            <a href="/verify" style={styles.buttonOutline}>Erneut verifizieren</a>
          </>
        ) : status === "expired" ? (
          <>
            <div style={styles.errorIcon}>!</div>
            <h1 style={styles.title}>Link abgelaufen</h1>
            <p style={styles.description}>
              Dieser Verifizierungslink ist abgelaufen. Bitte starte den Verifizierungsprozess erneut.
            </p>
            <a href="/verify" style={styles.button}>Erneut verifizieren</a>
          </>
        ) : status === "error" ? (
          <>
            <div style={styles.errorIcon}>!</div>
            <h1 style={styles.title}>Etwas ist schiefgelaufen</h1>
            <p style={styles.description}>
              Bitte versuche es erneut. Falls das Problem bestehen bleibt, kontaktiere service@edubook.at.
            </p>
            <button onClick={handleConfirm} style={styles.button}>
              Erneut versuchen
            </button>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Bildungs-Email bestätigen</h1>
            <p style={styles.description}>
              Klicke auf den Button, um deinen Bildungsstatus zu bestätigen und deine Bestellung zu aktivieren.
            </p>
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
  successIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#f0fdf4",
    color: "#25ba86",
    fontSize: "30px",
    lineHeight: "60px",
    margin: "0 auto 20px",
  },
  errorIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "30px",
    fontWeight: 700,
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
    display: "inline-block",
    background: "#25ba86",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    textDecoration: "none",
    textAlign: "center" as const,
  },
  buttonOutline: {
    display: "inline-block",
    background: "transparent",
    color: "#25ba86",
    border: "2px solid #25ba86",
    padding: "10px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    textDecoration: "none",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
  },
  backLink: {
    marginTop: "20px",
    color: "#666",
    fontSize: "14px",
    textDecoration: "none",
  },
};
