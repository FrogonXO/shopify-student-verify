"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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
        setErrorMessage(data.error || "Something went wrong");
        return;
      }

      if (data.alreadyVerified) {
        setStatus("already_verified");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Student Verification</h1>

        {status === "success" ? (
          <div style={styles.successBox}>
            <h2 style={{ margin: "0 0 8px 0" }}>Check your student email!</h2>
            <p style={{ margin: 0, color: "#666" }}>
              We sent a verification link to <strong>{studentEmail}</strong>.
              Click the link in that email to activate your order.
            </p>
          </div>
        ) : status === "already_verified" ? (
          <div style={styles.successBox}>
            <h2 style={{ margin: "0 0 8px 0" }}>Already verified!</h2>
            <p style={{ margin: 0, color: "#666" }}>
              Your email is already verified. Your order will be activated automatically.
            </p>
          </div>
        ) : (
          <>
            <p style={styles.description}>
              Enter your purchase email and student email to verify your student
              status and activate your order.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Purchase Email</label>
                <input
                  type="email"
                  value={purchaseEmail}
                  onChange={(e) => setPurchaseEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Student Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="your@university.ac.at"
                  required
                  style={styles.input}
                />
                <span style={styles.hint}>Must be a .edu or .ac.at email address</span>
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
                {status === "loading" ? "Sending..." : "Verify Student Status"}
              </button>
            </form>
          </>
        )}
      </div>
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
  },
  button: {
    background: "#000",
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
};
