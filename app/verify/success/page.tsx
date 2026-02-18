"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>&#10003;</div>
        <h1 style={styles.title}>Student Status Verified!</h1>
        <p style={styles.description}>
          Your student email has been confirmed. Your order is now being
          activated and will be processed shortly.
        </p>
        {email && (
          <p style={styles.email}>Verified email: <strong>{email}</strong></p>
        )}
        <p style={styles.hint}>You can close this page.</p>
      </div>
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
  icon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#f0fdf4",
    color: "#22c55e",
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
};
