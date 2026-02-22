"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const LOGO_URL = "https://edubook.at/cdn/shop/files/edubookvivalahardware_Logo.png?height=130&v=1768812725";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [purchaseEmail, setPurchaseEmail] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already_verified">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    if (email) setPurchaseEmail(email);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseEmail, studentEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Etwas ist schiefgelaufen");
        return;
      }

      if (data.alreadyVerified) {
        setStatus("already_verified");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={LOGO_URL} alt="edubook" style={styles.logo} />
        <h1 style={styles.title}>Bildungsstatus verifizieren</h1>

        {status === "success" ? (
          <div style={styles.successBox}>
            <h2 style={{ margin: "0 0 8px 0" }}>Bitte überprüfe deine Bildungs-Email.</h2>
            <p style={{ margin: 0, color: "#666" }}>
              Wir haben einen Verifizierungs Link an <strong>{studentEmail}</strong> gesendet.
              Klicke auf den Link in der Email, damit wir die Bestellung schnellstmöglich durchführen können.
            </p>
          </div>
        ) : status === "already_verified" ? (
          <div style={styles.successBox}>
            <h2 style={{ margin: "0 0 8px 0" }}>Bereits bestätigt!</h2>
            <p style={{ margin: 0, color: "#666" }}>
              Dein Bildungsstatus ist bestätigt, deine Bestellung wird asap bearbeitet.
            </p>
          </div>
        ) : (
          <>
            <p style={styles.description}>
              Gib deine Bestellungs-Email und deine Uni- bzw. Schul-Email an.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email deiner Bestellung</label>
                <input
                  type="email"
                  value={purchaseEmail}
                  onChange={(e) => setPurchaseEmail(e.target.value)}
                  placeholder="deine@email.com"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Bildungs-Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="deine@universität.ac.at"
                  required
                  style={styles.input}
                />
                <span style={styles.hint}>
                  Die Bildungsemail muss eine .edu oder eine .ac.at - Adresse sein.
                  Bei Problemen, sende eine Email an service@edubook.at mit deiner Bestell-Email + einem Beleg deines Bildungsstatus
                </span>
              </div>

              {status === "error" && (
                <div style={styles.errorBox}>{errorMessage}</div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  ...styles.button,
                  opacity: status === "loading" ? 0.6 : 1,
                }}
              >
                {status === "loading" ? "Wird gesendet..." : "Bildungsstatus verifizieren"}
              </button>
            </form>
          </>
        )}
      </div>
      <a href="https://edubook.at/" style={styles.backLink}>Zurück zu edubook.at</a>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
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
  },
  logo: {
    display: "block",
    margin: "0 auto 24px",
    height: "50px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "24px",
  },
  description: {
    color: "#666",
    margin: "0 0 24px 0",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
  },
  hint: {
    fontSize: "12px",
    color: "#999",
    lineHeight: "1.5",
  },
  button: {
    background: "#25ba86",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "8px",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "20px",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px",
    color: "#dc2626",
    fontSize: "14px",
  },
  backLink: {
    marginTop: "20px",
    color: "#666",
    fontSize: "14px",
    textDecoration: "none",
  },
};
